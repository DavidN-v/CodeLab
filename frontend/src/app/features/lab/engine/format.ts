import { languageOf } from './languages';

/** The outcome of formatting: the new text, or why the formatter refused. */
export type FormatResult = { ok: true; code: string } | { ok: false; error: string };

/**
 * Formats a file with Prettier, the formatter the Angular CLI itself uses.
 * Prettier and its parsers are loaded on first use.
 */
export async function formatCode(path: string, code: string): Promise<FormatResult> {
  const language = languageOf(path);
  if (language === 'text') {
    return { ok: false, error: 'Este tipo de archivo no se puede formatear.' };
  }
  try {
    const [prettier, estree, babel, typescript, postcss, html] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/estree'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/typescript'),
      import('prettier/plugins/postcss'),
      import('prettier/plugins/html'),
    ]);
    const parser = { html: 'html', css: 'css', javascript: 'babel', typescript: 'typescript' }[language];
    const formatted = await prettier.format(code, {
      parser,
      plugins: [estree, babel, typescript, postcss, html],
      singleQuote: true,
      printWidth: 100,
    });
    return { ok: true, code: formatted };
  } catch (error) {
    // Prettier refuses code it cannot parse; its message says where.
    const message = error instanceof Error ? error.message.split('\n')[0] : '';
    return { ok: false, error: `No se puede formatear mientras haya errores de sintaxis. ${message}`.trim() };
  }
}
