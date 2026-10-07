import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import { Marked, Tokens } from 'marked';

hljs.registerLanguage('java', java);

export interface Heading {
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  /** Second-level headings, for an "on this page" index. */
  headings: Heading[];
  /** Code of the runnable examples, indexed by their button's data-code-index. */
  runnableCode: string[];
}

/**
 * Renders lesson Markdown to HTML. Raw HTML in the source is escaped, so the
 * output only contains markup generated here and can be trusted as such.
 *
 * Code fences: `java` blocks with a main method are runnable and get an
 * "open in playground" button when `runnable` is set; `java fragment` and
 * `java error` blocks are highlighted but never offered to run.
 */
export function renderMarkdown(source: string, runnable: boolean): RenderedMarkdown {
  const headings: Heading[] = [];
  const runnableCode: string[] = [];
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
      code({ text, lang }: Tokens.Code): string {
        const [language = '', variant = ''] = (lang ?? '').trim().split(/\s+/);
        const highlighted =
          language === 'java' ? hljs.highlight(text, { language: 'java' }).value : escapeHtml(text);
        const label = language === 'java' ? 'Java' : language || 'texto';
        let action = '';
        if (
          runnable &&
          language === 'java' &&
          variant === '' &&
          text.includes('static void main')
        ) {
          runnableCode.push(text);
          action = `<button type="button" class="prose__run" data-code-index="${runnableCode.length - 1}">Abrir en el playground</button>`;
        }
        return `<div class="prose__code"><div class="prose__code-bar"><span class="prose__code-lang">${label}</span>${action}</div><pre><code class="hljs">${highlighted}</code></pre></div>\n`;
      },
      link({ href, title, tokens }: Tokens.Link): string {
        const external = /^https?:\/\//.test(href);
        const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const titleAttribute = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(href)}"${titleAttribute}${attributes}>${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });

  const html = marked.parse(source, { async: false });
  return { html, headings, runnableCode };
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
