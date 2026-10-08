import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('java', java);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

/** Technologies whose programs the sandbox can run; the rest are graded without running. */
const RUNNABLE_LANGUAGES = new Set(['java']);

export function isRunnable(languageSlug: string | null | undefined): boolean {
  return RUNNABLE_LANGUAGES.has(languageSlug ?? 'java');
}

/** The language of a snippet with no fence to say it: Java, an HTML template or TypeScript. */
export function guessLanguage(code: string): 'java' | 'xml' | 'typescript' {
  if (/\bpublic\s+(static\s+)?(class|void)\b|System\.out\./.test(code)) {
    return 'java';
  }
  return code.trimStart().startsWith('<') ? 'xml' : 'typescript';
}

/** Highlighted HTML for a snippet whose language is guessed. */
export function highlightCode(code: string): string {
  return hljs.highlight(code, { language: guessLanguage(code), ignoreIllegals: true }).value;
}
