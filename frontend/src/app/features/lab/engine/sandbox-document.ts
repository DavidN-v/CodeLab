import { LabFile } from '../models/lab.models';
import { BUNDLE_NAME, CompiledProject } from './compile';
import { isExternalReference, languageOf, resolvePath } from './languages';
import { HostConfig, RuntimeConfig, RuntimeTest, labHost, labRuntime } from './runtime';

/** A loop that keeps the thread busy this long is stopped. */
export const LOOP_LIMIT_MS = 3000;

/** A program without a page is killed after this long. */
export const WORKER_LIMIT_MS = 6000;

/**
 * What the sandboxed document may do: run the learner's inline code and show
 * images, nothing else. No network requests, so the code cannot reach the
 * platform's API or any other site.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' blob:",
  'worker-src blob:',
  "style-src 'unsafe-inline'",
  'img-src data: blob: https:',
  'media-src data: blob:',
  'font-src data:',
].join('; ');

export interface SandboxDocument {
  /** The `srcdoc` of the sandboxed iframe. */
  html: string;
  /** True when the project has a page to show. */
  hasPage: boolean;
  /** Things the learner should know before reading the output, e.g. a script that is not linked. */
  notes: string[];
}

export interface SandboxOptions {
  token: string;
  tests: RuntimeTest[];
  /** Guards the loops of inline `<script>` blocks, like those of the project's files. */
  guardInline: (code: string) => string;
}

/** The page that opens the project: `index.html`, or the first HTML file there is. */
export function entryPage(files: readonly LabFile[]): LabFile | null {
  const pages = files.filter((file) => languageOf(file.path) === 'html');
  return pages.find((file) => file.path.toLowerCase() === 'index.html') ?? pages[0] ?? null;
}

export function buildSandboxDocument(
  files: readonly LabFile[],
  compiled: CompiledProject,
  options: SandboxOptions,
): SandboxDocument {
  const page = entryPage(files);
  return page ? pageDocument(page, files, compiled, options) : workerDocument(compiled, options);
}

function workerDocument(compiled: CompiledProject, options: SandboxOptions): SandboxDocument {
  const config: HostConfig = {
    token: options.token,
    runtimeSource: labRuntime.toString(),
    units: compiled.units.map((unit) => ({ name: unit.name, code: unit.code })),
    tests: options.tests,
    loopLimitMs: LOOP_LIMIT_MS,
    timeLimitMs: WORKER_LIMIT_MS,
  };
  const html = `<!doctype html><html><head><meta charset="utf-8">${policyTag()}</head><body>${scriptTag(
    `(${labHost.toString()})(${embed(config)});`,
  )}</body></html>`;
  return { html, hasPage: false, notes: [] };
}

function pageDocument(
  page: LabFile,
  files: readonly LabFile[],
  compiled: CompiledProject,
  options: SandboxOptions,
): SandboxDocument {
  const notes: string[] = [];
  const byPath = new Map(files.map((file) => [file.path, file]));
  const unitNames = new Set(compiled.units.map((unit) => unit.name));
  const linked = new Set<string>();
  let bundleLinked = false;

  let html = page.content;

  // Stylesheets of the project become inline styles: the sandbox has no files to fetch.
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = attribute(tag, 'href');
    if (!href || !/\bstylesheet\b/i.test(attribute(tag, 'rel') ?? '') || isExternalReference(href)) {
      return tag;
    }
    const sheet = byPath.get(resolvePath(page.path, href));
    return sheet ? `<style data-lab-file="${escapeAttribute(sheet.path)}">${sheet.content}</style>` : tag;
  });

  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (whole, attributes: string, body: string) => {
    const tag = `<script${attributes}>`;
    const src = attribute(tag, 'src');
    if (!src) {
      const type = (attribute(tag, 'type') ?? '').toLowerCase();
      const isJavaScript = !type || type === 'text/javascript' || type === 'module';
      return isJavaScript ? `<script${attributes}>${options.guardInline(body)}</script>` : whole;
    }
    if (isExternalReference(src)) {
      notes.push(`El script externo «${src}» no se carga: el laboratorio no tiene acceso a internet.`);
      return '';
    }
    const path = resolvePath(page.path, src);
    linked.add(path);
    const deferred = /\bdefer\b/i.test(attributes) || (attribute(tag, 'type') ?? '').toLowerCase() === 'module';
    const call = deferred ? '__labDefer' : '__labRun';
    if (compiled.kind === 'modules' && byPath.has(path)) {
      if (bundleLinked) {
        return '';
      }
      bundleLinked = true;
      return scriptTag(`${call}(${JSON.stringify(BUNDLE_NAME)});`);
    }
    if (unitNames.has(path)) {
      return scriptTag(`${call}(${JSON.stringify(path)});`);
    }
    notes.push(`«${page.path}» enlaza el script «${src}», pero ese archivo no existe en el proyecto.`);
    return '';
  });

  for (const file of files) {
    const language = languageOf(file.path);
    if ((language === 'javascript' || language === 'typescript') && !linked.has(file.path)) {
      if (compiled.kind === 'modules' && bundleLinked) {
        continue;
      }
      notes.push(
        `«${file.path}» no está enlazado en «${page.path}» con una etiqueta <script src="${file.path}">, así que no se ejecuta.`,
      );
    }
  }

  const config: RuntimeConfig = {
    token: options.token,
    mode: 'page',
    units: compiled.units.map((unit) => ({ name: unit.name, source: unit.code })),
    tests: options.tests,
    loopLimitMs: LOOP_LIMIT_MS,
  };
  const head = `${policyTag()}${scriptTag(`(${labRuntime.toString()})(${embed(config)});`)}`;
  return { html: injectHead(html, head), hasPage: true, notes };
}

/** Puts the runtime before anything of the learner's, so it sees every error and message. */
function injectHead(html: string, head: string): string {
  for (const pattern of [/<head\b[^>]*>/i, /<html\b[^>]*>/i, /<!doctype[^>]*>/i]) {
    const match = pattern.exec(html);
    if (match) {
      const at = match.index + match[0].length;
      return html.slice(0, at) + head + html.slice(at);
    }
  }
  return head + html;
}

function policyTag(): string {
  return `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;
}

function scriptTag(code: string): string {
  return `<script>${code}</script>`;
}

/** Line separators that are legal inside JSON strings but end a line in JavaScript source. */
const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028, 0x2029)}]`, 'g');

/** Starts a Unicode escape; written this way so no tool turns it into the character itself. */
const UNICODE_ESCAPE = `${String.fromCharCode(92)}u`;

/** JSON that is safe inside a `<script>` element. */
function embed(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, `${UNICODE_ESCAPE}003c`)
    .replace(LINE_SEPARATORS, (separator) => UNICODE_ESCAPE + separator.charCodeAt(0).toString(16));
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
