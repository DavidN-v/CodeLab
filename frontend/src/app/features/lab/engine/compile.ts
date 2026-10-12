import type TypeScript from 'typescript';

import { LabDiagnostic, LabFile } from '../models/lab.models';
import { isScript, languageOf } from './languages';
import { Ts, guardLoops } from './loop-guard';
import { originalLines } from './source-map';

/** Where a line of generated code came from in the learner's files. */
export interface SourceLocation {
  path: string;
  line: number;
}

/** One script the browser will run, with the way back to the learner's lines. */
export interface CompiledUnit {
  /** The name the script runs under; errors are reported against it. */
  name: string;
  code: string;
  /** Index = generated line - 1. Null entries are glue code the learner did not write. */
  lines: (SourceLocation | null)[];
}

export interface CompiledProject {
  /**
   * `scripts`: classic scripts sharing the global scope, one unit per file.
   * `modules`: the files use import/export, bundled into a single unit.
   */
  kind: 'scripts' | 'modules';
  units: CompiledUnit[];
  /** Syntax errors found by the TypeScript parser. With any of these, nothing runs. */
  syntaxErrors: LabDiagnostic[];
}

/** The unit that holds every module when the project uses import/export. */
export const BUNDLE_NAME = 'proyecto.bundle.js';

/**
 * Turns the project's JavaScript and TypeScript into what the browser runs:
 * TypeScript is compiled by the real compiler and every loop gets a guard.
 */
export function compileProject(ts: Ts, files: readonly LabFile[]): CompiledProject {
  const scripts = files.filter((file) => isScript(file.path));
  const syntaxErrors = scripts.flatMap((file) => syntaxDiagnostics(ts, file));
  const modular = scripts.some((file) => usesModules(ts, file));
  if (syntaxErrors.length > 0) {
    return { kind: modular ? 'modules' : 'scripts', units: [], syntaxErrors };
  }
  if (!modular) {
    return { kind: 'scripts', units: scripts.map((file) => compileScript(ts, file)), syntaxErrors };
  }
  return { kind: 'modules', units: [bundle(scripts.map((file) => compileModule(ts, file)))], syntaxErrors };
}

/** Compiles a snippet that lives inside an HTML file (an inline `<script>`). */
export function guardInlineScript(ts: Ts, code: string): string {
  return guardLoops(ts, code, 'inline.js');
}

export function syntaxDiagnostics(ts: Ts, file: LabFile): LabDiagnostic[] {
  const output = ts.transpileModule(file.content, {
    fileName: file.path,
    reportDiagnostics: true,
    compilerOptions: transpileOptions(ts, false),
  });
  return (output.diagnostics ?? []).map((diagnostic) => {
    const position =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        : null;
    return {
      category: 'syntax',
      severity: 'error',
      confirmed: true,
      source: 'Compilador de TypeScript',
      code: `TS${diagnostic.code}`,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      path: file.path,
      line: position ? position.line + 1 : 0,
      column: position ? position.character + 1 : 0,
      lesson: null,
    } satisfies LabDiagnostic;
  });
}

function usesModules(ts: Ts, file: LabFile): boolean {
  const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, false);
  return source.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      (ts.canHaveModifiers(statement) &&
        (ts.getModifiers(statement) ?? []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )),
  );
}

function transpileOptions(ts: Ts, commonJs: boolean): TypeScript.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2022,
    module: commonJs ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
    sourceMap: true,
    inlineSources: false,
    // Each file is compiled on its own, like the bundlers Angular uses.
    isolatedModules: true,
    esModuleInterop: true,
    allowJs: true,
    verbatimModuleSyntax: false,
  };
}

function compileScript(ts: Ts, file: LabFile): CompiledUnit {
  const guarded = guardLoops(ts, file.content, file.path);
  if (languageOf(file.path) === 'javascript') {
    // Plain JavaScript runs as written: its lines are already the learner's lines.
    return { name: file.path, code: guarded, lines: identity(file.path, guarded) };
  }
  return transpile(ts, file.path, guarded, false);
}

function compileModule(ts: Ts, file: LabFile): CompiledUnit {
  return transpile(ts, file.path, guardLoops(ts, file.content, file.path), true);
}

function transpile(ts: Ts, path: string, guarded: string, commonJs: boolean): CompiledUnit {
  const output = ts.transpileModule(guarded, {
    fileName: path,
    compilerOptions: transpileOptions(ts, commonJs),
  });
  const code = output.outputText.replace(/\n?\/\/# sourceMappingURL=.*$/, '');
  const mappings = output.sourceMapText
    ? (JSON.parse(output.sourceMapText) as { mappings: string }).mappings
    : '';
  const mapped = originalLines(mappings);
  const lines = code
    .split('\n')
    .map((_, index) => (mapped[index] ? { path, line: mapped[index] } : null));
  return { name: path, code, lines };
}

function identity(path: string, code: string): SourceLocation[] {
  return code.split('\n').map((_, index) => ({ path, line: index + 1 }));
}

/**
 * A tiny CommonJS loader around the compiled modules. Every module runs once,
 * in file order, and its exports are also published as globals so tests and
 * the console can reach them by name.
 */
function bundle(modules: CompiledUnit[]): CompiledUnit {
  const code: string[] = [];
  const lines: (SourceLocation | null)[] = [];
  const glue = (text: string): void => {
    for (const line of text.split('\n')) {
      code.push(line);
      lines.push(null);
    }
  };

  glue('(function () {');
  glue('var __defs = {};');
  for (const module of modules) {
    glue(`__defs[${JSON.stringify(module.name)}] = function (module, exports, require) {`);
    code.push(...module.code.split('\n'));
    lines.push(...module.lines);
    glue('};');
  }
  glue(LOADER);
  glue(`__run(${JSON.stringify(modules.map((module) => module.name))});`);
  glue('})();');
  return { name: BUNDLE_NAME, code: code.join('\n'), lines };
}

const LOADER = `var __cache = {};
function __resolve(from, spec) {
  var parts = spec.charAt(0) === '/' ? [] : from.split('/').slice(0, -1);
  spec.split('/').forEach(function (part) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  });
  var base = parts.join('/');
  var tries = [base, base + '.ts', base + '.js', base.replace(/\\.js$/, '.ts')];
  for (var i = 0; i < tries.length; i++) {
    if (Object.prototype.hasOwnProperty.call(__defs, tries[i])) return tries[i];
  }
  throw new Error("No se encuentra el archivo '" + spec + "' que importa " + from + '.');
}
function __load(path) {
  if (!__cache[path]) {
    var module = { exports: {} };
    __cache[path] = module;
    __defs[path](module, module.exports, function (spec) {
      if (spec.charAt(0) !== '.' && spec.charAt(0) !== '/') {
        throw new Error("No se puede importar el paquete '" + spec + "': en el laboratorio solo existen los archivos de tu proyecto.");
      }
      return __load(__resolve(path, spec));
    });
  }
  return __cache[path].exports;
}
function __run(paths) {
  paths.forEach(function (path) {
    var exported = __load(path);
    Object.keys(exported).forEach(function (name) {
      if (name !== 'default' && name !== '__esModule' && !(name in globalThis)) {
        globalThis[name] = exported[name];
      }
    });
  });
}`;
