import { DiagnosticCategory, DiagnosticSeverity, LabDiagnostic, LabFile } from '../models/lab.models';
import { isExternalReference, languageOf, resolvePath } from './languages';
import { LESSONS } from './lessons';

const RULES = 'Reglas de Forja';
const BROWSER = 'Motor de CSS del navegador';

/** Asks the browser whether it understands a CSS declaration; `CSS.supports` in practice. */
export type CssSupports = (property: string, value: string) => boolean;

/** Elements that never have a closing tag. */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

/**
 * Elements whose closing tag is mandatory. Others (`p`, `li`, `td`…) may be
 * left open in valid HTML, so they are not reported.
 */
const MUST_CLOSE = new Set([
  'a', 'article', 'aside', 'button', 'div', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
  'label', 'main', 'nav', 'ol', 'script', 'section', 'select', 'span', 'style', 'table', 'textarea', 'ul',
]);

/** Checks of the HTML and CSS files that need no execution. */
export function analyzeMarkup(files: readonly LabFile[], supports: CssSupports | null): LabDiagnostic[] {
  return files.flatMap((file) => {
    const language = languageOf(file.path);
    if (language === 'html') {
      return analyzeHtml(file, files);
    }
    return language === 'css' ? analyzeCss(file, supports) : [];
  });
}

function finding(
  file: LabFile,
  line: number,
  code: string,
  category: DiagnosticCategory,
  severity: DiagnosticSeverity,
  confirmed: boolean,
  message: string,
  source = RULES,
): LabDiagnostic {
  const fullCode = `forja/${code}`;
  return {
    category,
    severity,
    confirmed,
    source,
    code: fullCode,
    message,
    path: file.path,
    line,
    column: 1,
    lesson: LESSONS[fullCode] ?? null,
  };
}

function lineAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
    }
  }
  return line;
}

function attributeOf(attributes: string, name: string): string | null {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attributes);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function hasAttribute(attributes: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, 'i').test(attributes);
}

export function analyzeHtml(file: LabFile, files: readonly LabFile[]): LabDiagnostic[] {
  const result: LabDiagnostic[] = [];
  const html = file.content;
  const paths = new Set(files.map((other) => other.path));
  const ids = new Map<string, number>();
  const open: { tag: string; line: number }[] = [];
  const pattern = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;

  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    if (!match[2]) {
      continue;
    }
    const closing = match[1] === '/';
    const tag = match[2].toLowerCase();
    const attributes = match[3] ?? '';
    const line = lineAt(html, match.index);

    if (closing) {
      if (!MUST_CLOSE.has(tag)) {
        continue;
      }
      const at = open.map((entry) => entry.tag).lastIndexOf(tag);
      if (at < 0) {
        result.push(finding(file, line, 'unclosed-tag', 'syntax', 'warning', false,
          `Hay un cierre \`</${tag}>\` sin su etiqueta de apertura.`));
        continue;
      }
      for (const unclosed of open.splice(at).slice(1)) {
        result.push(finding(file, unclosed.line, 'unclosed-tag', 'syntax', 'warning', false,
          `La etiqueta \`<${unclosed.tag}>\` no se cierra antes de \`</${tag}>\`.`));
      }
      continue;
    }

    const id = attributeOf(attributes, 'id');
    if (id) {
      const first = ids.get(id);
      if (first === undefined) {
        ids.set(id, line);
      } else {
        result.push(finding(file, line, 'duplicate-id', 'logic', 'warning', true,
          `El id «${id}» ya se usa en la línea ${first}; un id debe ser único en la página.`));
      }
    }
    if (tag === 'img' && !hasAttribute(attributes, 'alt')) {
      result.push(finding(file, line, 'img-alt', 'practice', 'info', true, 'La imagen no tiene atributo `alt`.'));
    }
    const reference =
      tag === 'script' ? attributeOf(attributes, 'src') : tag === 'link' ? attributeOf(attributes, 'href') : null;
    if (reference && !isExternalReference(reference) && !paths.has(resolvePath(file.path, reference))) {
      result.push(finding(file, line, 'missing-file', 'logic', 'error', true,
        `Se enlaza «${reference}», pero ese archivo no existe en el proyecto.`));
    }

    const selfClosed = attributes.trimEnd().endsWith('/');
    if (MUST_CLOSE.has(tag) && !VOID_ELEMENTS.has(tag) && !selfClosed) {
      open.push({ tag, line });
      // What is inside <script> and <style> is not HTML: jump to their closing tag.
      if (tag === 'script' || tag === 'style') {
        const end = html.toLowerCase().indexOf(`</${tag}`, pattern.lastIndex);
        if (end >= 0) {
          pattern.lastIndex = end;
        }
      }
    }
  }
  for (const unclosed of open) {
    result.push(finding(file, unclosed.line, 'unclosed-tag', 'syntax', 'warning', false,
      `La etiqueta \`<${unclosed.tag}>\` no se cierra.`));
  }
  return result;
}

export function analyzeCss(file: LabFile, supports: CssSupports | null): LabDiagnostic[] {
  const result: LabDiagnostic[] = [];
  // Comments are blanked out, keeping line breaks so line numbers stay right.
  const css = file.content.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
  const openLines: number[] = [];
  let chunk = '';
  let chunkStart = 0;
  let quote = '';

  const flushDeclaration = (): void => {
    const text = chunk.trim();
    chunk = '';
    if (!supports || openLines.length === 0 || !text || text.startsWith('@')) {
      return;
    }
    const colon = text.indexOf(':');
    if (colon <= 0) {
      return;
    }
    const property = text.slice(0, colon).trim();
    const value = text.slice(colon + 1).replace(/!important\s*$/i, '').trim();
    // Custom properties and vendor prefixes are not errors, whatever this browser thinks.
    if (!/^[a-z][a-z-]*$/i.test(property) || !value) {
      return;
    }
    if (!supports(property, value)) {
      result.push(finding(file, lineAt(css, firstInk(css, chunkStart)), 'css-unknown', 'syntax', 'warning', true,
        `El navegador no reconoce \`${property}: ${value}\` y lo ignora.`, BROWSER));
    }
  };

  for (let index = 0; index < css.length; index++) {
    const char = css[index];
    if (quote) {
      chunk += char;
      if (char === quote && css[index - 1] !== '\\') {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      chunk += char;
    } else if (char === '{') {
      openLines.push(lineAt(css, index));
      chunk = '';
      chunkStart = index + 1;
    } else if (char === '}') {
      flushDeclaration();
      chunkStart = index + 1;
      if (openLines.length === 0) {
        result.push(finding(file, lineAt(css, index), 'css-braces', 'syntax', 'error', true,
          'Sobra una llave de cierre `}`.'));
      } else {
        openLines.pop();
      }
    } else if (char === ';') {
      flushDeclaration();
      chunkStart = index + 1;
    } else {
      chunk += char;
    }
  }
  for (const line of openLines) {
    result.push(finding(file, line, 'css-braces', 'syntax', 'error', true,
      'Falta la llave de cierre `}` de la regla que empieza aquí.'));
  }
  return result;
}

/** Index of the first non-blank character at or after `from`. */
function firstInk(text: string, from: number): number {
  let index = from;
  while (index < text.length && /\s/.test(text[index])) {
    index++;
  }
  return index;
}
