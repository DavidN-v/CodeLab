import type TypeScript from 'typescript';

import { DiagnosticCategory, DiagnosticSeverity, LabDiagnostic, LabFile } from '../models/lab.models';
import { syntaxDiagnostics } from './compile';
import { isScript, languageOf } from './languages';
import { LESSONS } from './lessons';
import { Ts } from './loop-guard';

/** The standard library declarations (`lib.*.d.ts`) by file name; null when they could not be loaded. */
export type LibraryFiles = ReadonlyMap<string, string> | null;

/** The declaration files the type checker starts from; they reference the rest. */
export const ROOT_LIBRARIES = ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'];

const RULES = 'Reglas de Forja';
const COMPILER = 'Compilador de TypeScript';
const PROJECT_ROOT = '/proyecto/';
const LIBRARY_ROOT = '/lib/';

/** Compiler codes that mean "declared but never used". */
const UNUSED_CODES = new Set([6133, 6138, 6192, 6196, 6198, 6199]);

/**
 * Static analysis of the project's scripts, without running them: syntax
 * errors and type errors from the real TypeScript compiler, plus the lab's own
 * rules for bad practices, likely logic mistakes and unsafe code.
 */
export function analyzeScripts(ts: Ts, files: readonly LabFile[], libraries: LibraryFiles): LabDiagnostic[] {
  const scripts = files.filter((file) => isScript(file.path));
  const syntax = scripts.flatMap((file) => syntaxDiagnostics(ts, file).map(withLesson));
  const broken = new Set(syntax.map((diagnostic) => diagnostic.path));
  // Rules and types are only meaningful on code that parses.
  const sound = scripts.filter((file) => !broken.has(file.path));
  const types = libraries && syntax.length === 0 ? typeDiagnostics(ts, scripts, libraries) : [];
  const rules = sound.flatMap((file) => ruleDiagnostics(ts, file));
  return [...syntax, ...types, ...rules];
}

function withLesson(diagnostic: LabDiagnostic): LabDiagnostic {
  return { ...diagnostic, lesson: LESSONS[diagnostic.code] ?? null };
}

function typeDiagnostics(ts: Ts, scripts: readonly LabFile[], libraries: ReadonlyMap<string, string>): LabDiagnostic[] {
  const sources = new Map(scripts.map((file) => [PROJECT_ROOT + file.path, file.content]));
  const options: TypeScript.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ROOT_LIBRARIES,
    strict: true,
    noEmit: true,
    // JavaScript files take part so their globals are known, but are not type-checked.
    allowJs: true,
    checkJs: false,
    allowImportingTsExtensions: true,
    noUnusedLocals: true,
    skipLibCheck: true,
    types: [],
  };
  const read = (name: string): string | undefined =>
    sources.get(name) ?? (name.startsWith(LIBRARY_ROOT) ? libraries.get(name.slice(LIBRARY_ROOT.length)) : undefined);
  const host: TypeScript.CompilerHost = {
    getSourceFile: (name, languageVersion) => {
      const text = read(name);
      return text === undefined ? undefined : ts.createSourceFile(name, text, languageVersion, true);
    },
    getDefaultLibFileName: () => LIBRARY_ROOT + ROOT_LIBRARIES[0],
    getDefaultLibLocation: () => LIBRARY_ROOT.slice(0, -1),
    writeFile: () => undefined,
    getCurrentDirectory: () => PROJECT_ROOT.slice(0, -1),
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (name) => read(name) !== undefined,
    readFile: read,
    directoryExists: () => true,
    getDirectories: () => [],
  };
  const program = ts.createProgram([...sources.keys()], options, host);
  const result: LabDiagnostic[] = [];
  for (const file of scripts) {
    if (languageOf(file.path) !== 'typescript') {
      continue;
    }
    const source = program.getSourceFile(PROJECT_ROOT + file.path);
    if (!source) {
      continue;
    }
    for (const diagnostic of program.getSemanticDiagnostics(source)) {
      const unused = UNUSED_CODES.has(diagnostic.code);
      const position =
        diagnostic.start !== undefined ? source.getLineAndCharacterOfPosition(diagnostic.start) : null;
      result.push(
        withLesson({
          category: unused ? 'practice' : 'types',
          severity: unused ? 'warning' : 'error',
          confirmed: true,
          source: COMPILER,
          code: `TS${diagnostic.code}`,
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          path: file.path,
          line: position ? position.line + 1 : 0,
          column: position ? position.character + 1 : 0,
          lesson: null,
        }),
      );
    }
  }
  return result;
}

interface Finding {
  node: TypeScript.Node;
  code: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  confirmed: boolean;
  message: string;
}

function ruleDiagnostics(ts: Ts, file: LabFile): LabDiagnostic[] {
  const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
  const findings: Finding[] = [];
  const add = (
    node: TypeScript.Node,
    code: string,
    category: DiagnosticCategory,
    severity: DiagnosticSeverity,
    confirmed: boolean,
    message: string,
  ): void => {
    findings.push({ node, code: `forja/${code}`, category, severity, confirmed, message });
  };
  const K = ts.SyntaxKind;

  const unwrap = (node: TypeScript.Expression): TypeScript.Expression =>
    ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;
  const isNaNName = (node: TypeScript.Expression): boolean => ts.isIdentifier(node) && node.text === 'NaN';
  const isStaticText = (node: TypeScript.Expression): boolean =>
    ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

  const checkCondition = (condition: TypeScript.Expression | undefined): void => {
    if (!condition) {
      return;
    }
    const inner = unwrap(condition);
    if (ts.isBinaryExpression(inner) && inner.operatorToken.kind === K.EqualsToken) {
      add(inner, 'assign-in-condition', 'logic', 'warning', false,
        'La condición usa `=` (asignar) y no `===` (comparar).');
    }
  };

  /** Does this loop body have a way out? Nested functions and inner loops do not count. */
  const canExit = (node: TypeScript.Node, nested: boolean): boolean => {
    if (ts.isFunctionLike(node)) {
      return false;
    }
    if (ts.isReturnStatement(node) || ts.isThrowStatement(node)) {
      return true;
    }
    if (ts.isBreakStatement(node)) {
      return !nested || node.label !== undefined;
    }
    const deeper = nested || ts.isIterationStatement(node, false) || ts.isSwitchStatement(node);
    return ts.forEachChild(node, (child) => canExit(child, deeper) || undefined) ?? false;
  };

  const checkStatements = (statements: TypeScript.NodeArray<TypeScript.Statement>): void => {
    for (let index = 0; index < statements.length - 1; index++) {
      const statement = statements[index];
      const jumps =
        ts.isReturnStatement(statement) ||
        ts.isThrowStatement(statement) ||
        ts.isBreakStatement(statement) ||
        ts.isContinueStatement(statement);
      // Function declarations are hoisted, so they are reachable wherever they are written.
      const next = statements.slice(index + 1).find((later) => !ts.isFunctionDeclaration(later));
      if (jumps && next) {
        add(next, 'unreachable', 'practice', 'warning', true,
          'Este código no se ejecuta nunca: está después de un salto (`return`, `throw`, `break` o `continue`).');
        return;
      }
    }
  };

  const visit = (node: TypeScript.Node): void => {
    if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.BlockScoped) === 0) {
      add(node, 'var', 'practice', 'warning', true, 'Se usa `var`; hoy se declara con `let` o `const`.');
    }

    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      const loose = operator === K.EqualsEqualsToken || operator === K.ExclamationEqualsToken;
      const strict = operator === K.EqualsEqualsEqualsToken || operator === K.ExclamationEqualsEqualsToken;
      if ((loose || strict) && (isNaNName(node.left) || isNaNName(node.right))) {
        add(node, 'nan-comparison', 'logic', 'error', true,
          'Comparar con `NaN` da siempre el mismo resultado: `NaN` no es igual a nada.');
      } else if (loose && node.left.kind !== K.NullKeyword && node.right.kind !== K.NullKeyword) {
        add(node.operatorToken, 'eqeq', 'practice', 'warning', false,
          `Se compara con \`${node.operatorToken.getText(source)}\`, que convierte los tipos antes de comparar.`);
      }
      const assigns = operator === K.EqualsToken || operator === K.PlusEqualsToken;
      if (
        assigns &&
        ts.isPropertyAccessExpression(node.left) &&
        (node.left.name.text === 'innerHTML' || node.left.name.text === 'outerHTML') &&
        !isStaticText(node.right)
      ) {
        add(node, 'unsafe-html', 'security', 'warning', false,
          `Se escribe HTML con \`${node.left.name.text}\` usando un valor que no es un texto fijo.`);
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee) && callee.text === 'eval') {
        add(node, 'eval', 'security', 'warning', true, '`eval` ejecuta como código el texto que recibe.');
      }
      if (ts.isPropertyAccessExpression(callee)) {
        const method = callee.name.text;
        const dynamicHtml =
          (method === 'insertAdjacentHTML' && node.arguments.length > 1 && !isStaticText(node.arguments[1])) ||
          (method === 'write' && ts.isIdentifier(callee.expression) && callee.expression.text === 'document');
        if (dynamicHtml) {
          add(node, 'unsafe-html', 'security', 'warning', false,
            `Se escribe HTML con \`${method}\` usando un valor que puede no ser un texto fijo.`);
        }
      }
    }
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Function') {
      add(node, 'eval', 'security', 'warning', true, '`new Function` ejecuta como código el texto que recibe.');
    }

    if (ts.isCatchClause(node) && node.block.statements.length === 0) {
      add(node, 'empty-catch', 'practice', 'warning', true, 'El bloque `catch` está vacío: el error se pierde.');
    }

    if (ts.isIfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) {
      checkCondition(node.expression);
    }
    if (ts.isForStatement(node)) {
      checkCondition(node.condition);
      checkLoopDirection(node);
    }
    const endless =
      (ts.isWhileStatement(node) && unwrap(node.expression).kind === K.TrueKeyword) ||
      (ts.isForStatement(node) && !node.condition);
    if (endless && !canExit((node as TypeScript.IterationStatement).statement, false)) {
      add(node, 'endless-loop', 'logic', 'warning', false,
        'Este bucle no tiene forma de terminar: la condición siempre se cumple y dentro no hay `break` ni `return`.');
    }

    if (ts.isBlock(node) || ts.isSourceFile(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
      checkStatements(node.statements);
    }
    ts.forEachChild(node, visit);
  };

  /** `for (i = 0; i < n; i--)` and its mirror image: the step moves away from the limit. */
  const checkLoopDirection = (loop: TypeScript.ForStatement): void => {
    const condition = loop.condition ? unwrap(loop.condition) : null;
    const step = loop.incrementor ? unwrap(loop.incrementor) : null;
    if (!condition || !step || !ts.isBinaryExpression(condition) || !ts.isIdentifier(condition.left)) {
      return;
    }
    const counter = condition.left.text;
    const comparison = condition.operatorToken.kind;
    const expectsUp = comparison === K.LessThanToken || comparison === K.LessThanEqualsToken;
    const expectsDown = comparison === K.GreaterThanToken || comparison === K.GreaterThanEqualsToken;
    let goesUp: boolean | null = null;
    if ((ts.isPostfixUnaryExpression(step) || ts.isPrefixUnaryExpression(step)) && ts.isIdentifier(step.operand)) {
      if (step.operand.text === counter && (step.operator === K.PlusPlusToken || step.operator === K.MinusMinusToken)) {
        goesUp = step.operator === K.PlusPlusToken;
      }
    } else if (ts.isBinaryExpression(step) && ts.isIdentifier(step.left) && step.left.text === counter) {
      if (step.operatorToken.kind === K.PlusEqualsToken) {
        goesUp = true;
      } else if (step.operatorToken.kind === K.MinusEqualsToken) {
        goesUp = false;
      }
    }
    if (goesUp !== null && ((expectsUp && !goesUp) || (expectsDown && goesUp))) {
      add(loop, 'loop-direction', 'logic', 'warning', false,
        `El bucle avanza en sentido contrario a su condición: \`${condition.getText(source)}\` con \`${step.getText(source)}\`.`);
    }
  };

  visit(source);

  return findings.map((finding) => {
    const position = source.getLineAndCharacterOfPosition(finding.node.getStart(source));
    return withLesson({
      category: finding.category,
      severity: finding.severity,
      confirmed: finding.confirmed,
      source: RULES,
      code: finding.code,
      message: finding.message,
      path: file.path,
      line: position.line + 1,
      column: position.character + 1,
      lesson: null,
    });
  });
}

/** The names of the libraries that `text` asks for with `/// <reference lib="..." />`. */
export function referencedLibraries(text: string): string[] {
  const names: string[] = [];
  const pattern = /^\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/gm;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    names.push(`lib.${match[1]}.d.ts`);
  }
  return names;
}
