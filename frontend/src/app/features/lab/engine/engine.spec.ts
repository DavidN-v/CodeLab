import ts from 'typescript';

import { LabFile } from '../models/lab.models';
import { BUNDLE_NAME, compileProject } from './compile';
import { pathProblem, resolvePath } from './languages';
import { guardLoops } from './loop-guard';
import { analyzeCss, analyzeHtml } from './markup-analysis';
import { buildSandboxDocument } from './sandbox-document';
import { analyzeScripts, referencedLibraries } from './script-analysis';

const file = (path: string, content: string): LabFile => ({ path, content });
const codes = (diagnostics: { code: string }[]): string[] => diagnostics.map((diagnostic) => diagnostic.code);

describe('guardLoops', () => {
  it('guards block and single-statement loops without moving lines', () => {
    const source = 'while (a) {\n  b();\n}\nfor (;;) c();\ndo d(); while (e);';

    const guarded = guardLoops(ts, source, 'main.js');

    expect(guarded.split('\n')).toHaveLength(source.split('\n').length);
    expect(guarded).toContain('while (a) {__labGuard();');
    expect(guarded).toContain('for (;;) {__labGuard();c();}');
    expect(guarded).toContain('do {__labGuard();d();} while (e);');
  });

  it('closes nested single-statement loops in the right order', () => {
    const guarded = guardLoops(ts, 'for (a of b) for (c of d) e();', 'main.js');

    expect(guarded).toBe('for (a of b) {__labGuard();for (c of d) {__labGuard();e();}}');
    expect(() => new Function('b', 'd', 'e', '__labGuard', guarded)).not.toThrow();
  });
});

describe('compileProject', () => {
  it('runs plain JavaScript as written, one unit per file', () => {
    const compiled = compileProject(ts, [file('a.js', 'const x = 1;'), file('b.js', 'console.log(x);')]);

    expect(compiled.kind).toBe('scripts');
    expect(compiled.units.map((unit) => unit.name)).toEqual(['a.js', 'b.js']);
    expect(compiled.units[0].code).toBe('const x = 1;');
  });

  it('compiles TypeScript and maps generated lines back to the source', () => {
    const source = 'interface Punto {\n  x: number;\n}\n\nconst p: Punto = { x: 1 };\nconsole.log(p.x);';

    const compiled = compileProject(ts, [file('main.ts', source)]);

    const unit = compiled.units[0];
    expect(unit.code).not.toContain('interface');
    const logLine = unit.code.split('\n').findIndex((line) => line.includes('console.log'));
    expect(unit.lines[logLine]).toEqual({ path: 'main.ts', line: 6 });
  });

  it('does not produce anything to run when a file has a syntax error', () => {
    const compiled = compileProject(ts, [file('main.js', 'function sumar(a, b {\n  return a + b;\n}')]);

    expect(compiled.units).toEqual([]);
    expect(compiled.syntaxErrors[0]).toMatchObject({ category: 'syntax', confirmed: true, path: 'main.js', line: 1 });
  });

  it('bundles files that use import and export, keeping their lines', () => {
    const compiled = compileProject(ts, [
      file('mates.ts', 'export function sumar(a: number, b: number): number {\n  return a + b;\n}'),
      file('main.ts', "import { sumar } from './mates';\nconsole.log(sumar(2, 3));"),
    ]);

    expect(compiled.kind).toBe('modules');
    expect(compiled.units).toHaveLength(1);
    const unit = compiled.units[0];
    expect(unit.name).toBe(BUNDLE_NAME);
    const returnLine = unit.code.split('\n').findIndex((line) => line.includes('return a + b'));
    expect(unit.lines[returnLine]).toEqual({ path: 'mates.ts', line: 2 });

    // The bundle really runs: exports are reachable and the import resolves.
    const logged: unknown[] = [];
    const scope: Record<string, unknown> = {};
    new Function('console', 'globalThis', unit.code)({ log: (value: unknown) => logged.push(value) }, scope);
    expect(logged).toEqual([5]);
    expect(typeof scope['sumar']).toBe('function');
  });
});

describe('analyzeScripts', () => {
  it('reports the rules of the lab with a lesson each', () => {
    const source = [
      'var total = 0;',
      'if (total == "0") {}',
      'if (total = 5) {}',
      'if (total === NaN) {}',
      'for (let i = 0; i < 5; i--) {}',
      'while (true) { total++; }',
      'try { total(); } catch (e) {}',
      'eval("1 + 1");',
      'document.body.innerHTML = total;',
    ].join('\n');

    const diagnostics = analyzeScripts(ts, [file('main.js', source)], null);

    expect(codes(diagnostics)).toEqual([
      'forja/var',
      'forja/eqeq',
      'forja/assign-in-condition',
      'forja/nan-comparison',
      'forja/loop-direction',
      'forja/endless-loop',
      'forja/empty-catch',
      'forja/eval',
      'forja/unsafe-html',
    ]);
    expect(diagnostics.map((diagnostic) => diagnostic.line)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(diagnostics.every((diagnostic) => diagnostic.lesson !== null)).toBe(true);
    // A rule that only suspects a problem says so.
    expect(diagnostics.find((diagnostic) => diagnostic.code === 'forja/assign-in-condition')?.confirmed).toBe(false);
    expect(diagnostics.find((diagnostic) => diagnostic.code === 'forja/nan-comparison')?.confirmed).toBe(true);
  });

  it('does not flag correct code written in a different way', () => {
    const source = [
      'const lista = [3, 1, 2];',
      'for (let i = lista.length - 1; i >= 0; i--) { console.log(lista[i]); }',
      'while (true) { if (lista.pop() === undefined) { break; } }',
      'function f(n) { if (n == null) { return 0; } return n; }',
      'document.body.innerHTML = "<p>Hola</p>";',
    ].join('\n');

    expect(analyzeScripts(ts, [file('main.js', source)], null)).toEqual([]);
  });

  it('reports code after a return', () => {
    const diagnostics = analyzeScripts(ts, [file('main.js', 'function f() {\n  return 1;\n  console.log("x");\n}')], null);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ code: 'forja/unreachable', line: 3 });
  });

  it('checks types with the real compiler when the libraries are available', () => {
    const libraries = new Map([
      ['lib.es2022.d.ts', 'interface Array<T> {}\ninterface Boolean {}\ninterface CallableFunction {}\ninterface Function {}\ninterface IArguments {}\ninterface NewableFunction {}\ninterface Number {}\ninterface Object {}\ninterface RegExp {}\ninterface String {}'],
      ['lib.dom.d.ts', ''],
      ['lib.dom.iterable.d.ts', ''],
    ]);
    const source = 'const edad: number = "veinte";\nfunction doble(n: number): number {\n  return n * 2;\n}\ndoble("4");';

    const diagnostics = analyzeScripts(ts, [file('main.ts', source)], libraries);

    expect(diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.line, diagnostic.category])).toEqual([
      ['TS2322', 1, 'types'],
      ['TS2345', 5, 'types'],
    ]);
    expect(diagnostics[0].lesson).not.toBeNull();
  });

  it('finds the libraries a declaration file refers to', () => {
    expect(referencedLibraries('/// <reference lib="es2021" />\n/// <reference lib="es2022.array" />\n')).toEqual([
      'lib.es2021.d.ts',
      'lib.es2022.array.d.ts',
    ]);
  });
});

describe('markup analysis', () => {
  it('reports missing files, repeated ids, images without alt and unclosed tags', () => {
    const page = file(
      'index.html',
      '<!doctype html>\n<link rel="stylesheet" href="estilos.css">\n<div id="a">\n<span id="a">\n<img src="x.png">\n</div>\n<script src="main.js"></script>',
    );

    const diagnostics = analyzeHtml(page, [page, file('main.js', '')]);

    expect(diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.line])).toEqual([
      ['forja/missing-file', 2],
      ['forja/duplicate-id', 4],
      ['forja/img-alt', 5],
      ['forja/unclosed-tag', 4],
    ]);
  });

  it('does not treat script contents as HTML', () => {
    const page = file('index.html', '<script>\nif (a < b) { document.write("<div>"); }\n</script>\n<p>Hola');

    expect(analyzeHtml(page, [page])).toEqual([]);
  });

  it('asks the browser about each declaration and checks the braces', () => {
    const sheet = file('estilos.css', '.a {\n  color: red;\n  colr: blue;\n  /* margin: 3 */\n  width: 10;\n}\n.b {\n  color: red;\n');
    const supports = (property: string, value: string): boolean =>
      property === 'color' || (property === 'width' && value.endsWith('px'));

    const diagnostics = analyzeCss(sheet, supports);

    expect(diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.line])).toEqual([
      ['forja/css-unknown', 3],
      ['forja/css-unknown', 5],
      ['forja/css-braces', 7],
    ]);
  });
});

describe('paths', () => {
  it('resolves relative references', () => {
    expect(resolvePath('index.html', './js/main.js')).toBe('js/main.js');
    expect(resolvePath('paginas/a.html', '../css/a.css?v=2')).toBe('css/a.css');
  });

  it('explains why a file name cannot be used', () => {
    const files = [file('main.js', '')];
    expect(pathProblem('otro.js', files)).toBeNull();
    expect(pathProblem('Main.js', files)).toContain('Ya existe');
    expect(pathProblem('notas.txt', files)).toContain('.html');
    expect(pathProblem('../x.js', files)).not.toBeNull();
  });
});

describe('buildSandboxDocument', () => {
  const options = { token: 't', tests: [], guardInline: (code: string) => guardLoops(ts, code, 'inline.js') };

  it('inlines the project styles, runs linked scripts by name and locks the page down', () => {
    const files = [
      file('index.html', '<!doctype html>\n<html><head><link rel="stylesheet" href="estilos.css"></head>\n<body><script src="main.js"></script></body></html>'),
      file('estilos.css', 'h1 { color: red; }'),
      file('main.js', 'console.log(1);'),
      file('suelto.js', 'console.log(2);'),
    ];

    const sandbox = buildSandboxDocument(files, compileProject(ts, files), options);

    expect(sandbox.hasPage).toBe(true);
    expect(sandbox.html).toContain('<style data-lab-file="estilos.css">h1 { color: red; }</style>');
    expect(sandbox.html).toContain('<script>__labRun("main.js");</script>');
    expect(sandbox.html).not.toContain('src="main.js"');
    // The policy comes before anything of the learner's and forbids network access.
    expect(sandbox.html.indexOf('Content-Security-Policy')).toBeLessThan(sandbox.html.indexOf('<style'));
    expect(sandbox.html).toContain("default-src 'none'");
    expect(sandbox.notes).toEqual([
      '«suelto.js» no está enlazado en «index.html» con una etiqueta <script src="suelto.js">, así que no se ejecuta.',
    ]);
  });

  it('guards the loops of inline scripts and refuses external ones', () => {
    const files = [
      file('index.html', '<script>while (true) {}</script><script src="https://cdn.example/x.js"></script>'),
    ];

    const sandbox = buildSandboxDocument(files, compileProject(ts, files), options);

    expect(sandbox.html).toContain('<script>while (true) {__labGuard();}</script>');
    expect(sandbox.html).not.toContain('cdn.example/x.js"></script>');
    expect(sandbox.notes[0]).toContain('no se carga');
  });

  it('uses a worker host when the project has no page', () => {
    const files = [file('main.js', 'console.log(1);')];

    const sandbox = buildSandboxDocument(files, compileProject(ts, files), options);

    expect(sandbox.hasPage).toBe(false);
    expect(sandbox.html).toContain('new scope.Worker');
  });
});
