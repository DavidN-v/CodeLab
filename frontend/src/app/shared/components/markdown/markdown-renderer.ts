import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import { Marked, Token, Tokens } from 'marked';

import { GlossaryTerm } from '../../../core/models/course.model';
import { renderMemoryDiagram } from './memory-diagram';

hljs.registerLanguage('java', java);

export interface Heading {
  id: string;
  text: string;
}

/**
 * A piece of the rendered page. Runnable examples and Mermaid diagrams become
 * components; everything else is trusted HTML generated here.
 */
export type Segment =
  | { kind: 'html'; html: string }
  | { kind: 'example'; code: string }
  | { kind: 'mermaid'; source: string };

export interface RenderedMarkdown {
  segments: Segment[];
  /** Second-level headings, for an "on this page" index. */
  headings: Heading[];
}

export interface RenderOptions {
  /** Turn top-level `java` blocks with a main method into runnable examples. */
  runnable?: boolean;
  /** Terms to explain on hover, the first time each one appears. */
  glossary?: readonly GlossaryTerm[];
}

interface Callout {
  icon: string;
  title: string;
}

/** `> [!tipo]` blocks: see docs/CONTENT.md. */
const CALLOUTS: Readonly<Record<string, Callout>> = {
  analogia: { icon: '💡', title: 'Piénsalo así' },
  idea: { icon: '🔑', title: 'Idea clave' },
  prueba: { icon: '🧪', title: 'Pruébalo' },
  cuidado: { icon: '⚠️', title: 'Cuidado' },
  resumen: { icon: '📌', title: 'En resumen' },
};

/** Inside these elements terms are never explained: code, links, headings… */
const NO_GLOSSARY = new Set(['code', 'pre', 'a', 'h1', 'h2', 'h3', 'h4', 'button', 'table']);

/** Elements without a closing tag. */
const VOID_ELEMENTS = new Set(['br', 'hr', 'img', 'input']);

/**
 * Renders lesson Markdown. Raw HTML in the source is escaped, so the output
 * only contains markup generated here and can be trusted as such.
 *
 * Code fences: `java` blocks with a main method are runnable; `java fragment`
 * and `java error` blocks are only highlighted; `memoria` draws a memory
 * diagram and `mermaid` a flowchart or class diagram.
 */
export function renderMarkdown(source: string, options: RenderOptions = {}): RenderedMarkdown {
  const headings: Heading[] = [];
  const usedIds = new Set<string>();

  const marked = new Marked({
    gfm: true,
    renderer: {
      html({ text }: Tokens.HTML | Tokens.Tag): string {
        return escapeHtml(text);
      },
      heading({ tokens, depth, text }: Tokens.Heading): string {
        const id = uniqueId(slugify(text), usedIds);
        if (depth === 2) {
          headings.push({ id, text: plainText(text) });
        }
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      blockquote({ tokens }: Tokens.Blockquote): string {
        const body = this.parser.parse(tokens);
        const marker = /^<p>\[!([a-zA-Záéíóú]+)\]\s*/.exec(body);
        const callout = marker ? CALLOUTS[marker[1].toLowerCase()] : undefined;
        if (!marker || !callout) {
          return `<blockquote>\n${body}</blockquote>\n`;
        }
        const rest = body.slice(marker[0].length).replace(/^<\/p>\s*/, '');
        // The marker may share its paragraph with the first sentence; keep that sentence a paragraph.
        const startsBlock = /^<(p|ul|ol|pre|div|table|blockquote|h\d|figure|aside)[\s>]/.test(rest);
        const content = startsBlock || rest === '' ? rest : `<p>${rest}`;
        return `<aside class="callout callout--${marker[1].toLowerCase()}"><p class="callout__title"><span aria-hidden="true">${callout.icon}</span> ${callout.title}</p>${content}</aside>\n`;
      },
      code({ text, lang }: Tokens.Code): string {
        const [language = '', variant = ''] = (lang ?? '').trim().split(/\s+/);
        if (language === 'memoria') {
          return renderMemoryDiagram(text);
        }
        return codeBlock(text, language, variant);
      },
      link({ href, title, tokens }: Tokens.Link): string {
        const external = /^https?:\/\//.test(href);
        const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${titleAttribute}${attributes}>${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });

  // Top-level examples and diagrams become components; nested ones stay static.
  const tokens = marked.lexer(source);
  const segments: Segment[] = [];
  let pending: Token[] = [];
  const flush = () => {
    if (pending.length > 0) {
      const html = marked.parser(Object.assign(pending, { links: tokens.links }));
      segments.push({ kind: 'html', html });
      pending = [];
    }
  };
  for (const token of tokens) {
    if (token.type === 'code') {
      const [language = '', variant = ''] = ((token as Tokens.Code).lang ?? '').trim().split(/\s+/);
      const code = (token as Tokens.Code).text;
      if (
        options.runnable &&
        language === 'java' &&
        variant === '' &&
        code.includes('static void main')
      ) {
        flush();
        segments.push({ kind: 'example', code });
        continue;
      }
      if (language === 'mermaid') {
        flush();
        segments.push({ kind: 'mermaid', source: code });
        continue;
      }
    }
    pending.push(token);
  }
  flush();

  if (options.glossary && options.glossary.length > 0) {
    const explain = glossaryLinker(options.glossary);
    for (const segment of segments) {
      if (segment.kind === 'html') {
        segment.html = explain(segment.html);
      }
    }
  }
  return { segments, headings };
}

/** The whole document as one HTML string, for short texts such as statements and hints. */
export function renderMarkdownHtml(source: string): string {
  return renderMarkdown(source)
    .segments.map((segment) =>
      segment.kind === 'html'
        ? segment.html
        : codeBlock(
            segment.kind === 'example' ? segment.code : segment.source,
            segment.kind === 'example' ? 'java' : 'mermaid',
            '',
          ),
    )
    .join('');
}

function codeBlock(text: string, language: string, variant: string): string {
  const highlighted =
    language === 'java' ? hljs.highlight(text, { language: 'java' }).value : escapeHtml(text);
  const label =
    language === 'java'
      ? variant === 'error'
        ? 'Java · con un error a propósito'
        : variant === 'fragment'
          ? 'Java · fragmento'
          : 'Java'
      : language || 'texto';
  return `<div class="prose__code${variant === 'error' ? ' prose__code--error' : ''}"><div class="prose__code-bar"><span class="prose__code-lang">${label}</span></div><pre><code class="hljs">${highlighted}</code></pre></div>\n`;
}

/**
 * Wraps the first appearance of each glossary term in a span that shows its
 * definition on hover or focus. Works on the generated HTML, skipping tags and
 * the inside of code, links and headings.
 */
export function glossaryLinker(terms: readonly GlossaryTerm[]): (html: string) => string {
  const byWord = new Map<string, GlossaryTerm>();
  for (const term of terms) {
    for (const word of [term.term, ...term.aliases]) {
      byWord.set(word.toLowerCase(), term);
    }
  }
  const words = [...byWord.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  if (words.length === 0) {
    return (html) => html;
  }
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(${words.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
  const explained = new Set<GlossaryTerm>();

  return (html: string) => {
    // One entry per open element: whether terms are skipped inside it.
    const open: boolean[] = [];
    return html
      .split(/(<[^>]+>)/)
      .map((piece) => {
        if (piece.startsWith('<')) {
          const name = /^<\/?([a-z0-9]+)/i.exec(piece)?.[1].toLowerCase() ?? '';
          if (piece.startsWith('</')) {
            open.pop();
          } else if (!VOID_ELEMENTS.has(name) && !piece.endsWith('/>')) {
            open.push(NO_GLOSSARY.has(name) || piece.includes('callout__title'));
          }
          return piece;
        }
        if (open.some(Boolean)) {
          return piece;
        }
        return piece.replace(pattern, (match: string) => {
          const term = byWord.get(match.toLowerCase());
          if (!term || explained.has(term)) {
            return match;
          }
          explained.add(term);
          return `<span class="term" tabindex="0" data-definition="${escapeHtml(term.definition)}">${match}</span>`;
        });
      })
      .join('');
  };
}

export function slugify(text: string): string {
  return (
    plainText(text)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'seccion'
  );
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  for (let suffix = 2; used.has(id); suffix++) {
    id = `${base}-${suffix}`;
  }
  used.add(id);
  return id;
}

/** Heading text without inline Markdown markers. */
function plainText(text: string): string {
  return text.replace(/[`*_]/g, '');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
