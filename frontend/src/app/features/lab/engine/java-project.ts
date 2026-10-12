import { LabFile } from '../models/lab.models';
import { SourceLocation } from './compile';
import { languageOf } from './languages';

/** A test of a Java project: two Java expressions that must be equal. */
export interface JavaTest {
  id: string;
  expression: string;
  expected: string;
}

/**
 * A Java project as the one source file the runner compiles. Every line of a
 * learner's file keeps its own line in the bundle, so the compiler's and the
 * JVM's line numbers can be translated back.
 */
export interface JavaBundle {
  source: string;
  /** The learner's file and line behind a line of the bundle; null for generated lines. */
  locate(line: number): SourceLocation | null;
  /** The test whose generated code contains that line of the bundle, if any. */
  testAt(line: number): string | null;
  /** Marks the lines of the output that carry test results. */
  marker: string;
}

export type JavaBundleResult = { ok: true; bundle: JavaBundle } | { ok: false; error: string };

const TYPE = '(?:class|record|enum|interface)\\s+([A-Za-z_$][\\w$]*)';
const MODIFIERS = '(?:(?:final|abstract|sealed|non-sealed|strictfp)\\s+)*';
/** The start of a type declaration, up to and including its optional `public`. */
const DECLARATION = new RegExp(`^(\\s*)(?:public\\s+)?(?=${MODIFIERS}${TYPE})`);
const TOP_TYPE = new RegExp(`^\\s*(?:public\\s+)?${MODIFIERS}${TYPE}`, 'm');
const MAIN = /\bstatic\s+void\s+main\s*\(/;
const TEST_CLASS = 'PruebasDelLaboratorio';

export function javaFiles(files: readonly LabFile[]): LabFile[] {
  return files.filter((file) => languageOf(file.path) === 'java');
}

/** A project with Java files is compiled and run as Java. */
export function isJavaProject(files: readonly LabFile[]): boolean {
  return files.some((file) => languageOf(file.path) === 'java');
}

/**
 * Joins the Java files into one source. Imports go to the top (Java wants them
 * before any type) and only the class that starts the program stays public,
 * because one file can hold a single public type. With tests, a generated
 * class evaluates them instead of running `main`.
 */
export function bundleJava(files: readonly LabFile[], tests: readonly JavaTest[], marker: string): JavaBundleResult {
  const sources = javaFiles(files);
  const entry = sources.find((file) => MAIN.test(file.content));
  if (tests.length === 0 && !entry) {
    return {
      ok: false,
      error:
        'No hay por dónde empezar: un programa Java arranca en el método `public static void main(String[] args)` y ningún archivo lo tiene.',
    };
  }
  const entryType = entry ? (TOP_TYPE.exec(entry.content)?.[1] ?? null) : null;

  const imports: string[] = [];
  const body: string[] = [];
  const origin: (SourceLocation | null)[] = [];
  for (const file of sources) {
    let inComment = false;
    file.content.split('\n').forEach((text, index) => {
      let line = text.replace(/\r$/, '');
      if (!inComment) {
        const trimmed = line.trim();
        if (/^import\s+[\w.*\s]+;/.test(trimmed)) {
          if (!imports.includes(trimmed)) {
            imports.push(trimmed);
          }
          line = '';
        } else if (/^package\s+[\w.]+\s*;/.test(trimmed)) {
          // Everything ends up in one file, so in one (unnamed) package.
          line = '';
        } else {
          const declared = DECLARATION.exec(line);
          if (declared) {
            const isEntry = tests.length === 0 && file === entry && declared[2] === entryType;
            line = line.replace(DECLARATION, isEntry ? '$1public ' : '$1');
          }
        }
      }
      // Block comments can contain anything; they are copied untouched.
      const opened = line.lastIndexOf('/*');
      if (opened > line.lastIndexOf('*/')) {
        inComment = true;
      } else if (line.includes('*/')) {
        inComment = false;
      }
      body.push(line);
      origin.push({ path: file.path, line: index + 1 });
    });
  }

  const testLines: (string | null)[] = [];
  const harness: string[] = [];
  if (tests.length > 0) {
    const add = (line: string, testId: string | null = null): void => {
      harness.push(line);
      testLines.push(testId);
    };
    add(`public class ${TEST_CLASS} {`);
    add('    static String ver(Object v) {');
    add('        if (v instanceof String s) return "\\"" + s + "\\"";');
    add('        if (v instanceof Character c) return "\'" + c + "\'";');
    add('        if (v instanceof Object[] a) return java.util.Arrays.deepToString(a);');
    add('        if (v != null && v.getClass().isArray()) {');
    add('            String t = java.util.Arrays.deepToString(new Object[] { v });');
    add('            return t.substring(1, t.length() - 1);');
    add('        }');
    add('        return String.valueOf(v);');
    add('    }');
    add('    static String linea(String s) { return s.replace("\\\\", "\\\\\\\\").replace("\\n", "\\\\n").replace("\\t", "\\\\t"); }');
    add('    public static void main(String[] args) {');
    add('        java.io.PrintStream salida = System.out;');
    tests.forEach((test, index) => {
      const id = JSON.stringify(test.id);
      const report = (status: string, values: string): string =>
        `salida.println("${marker}\\t" + ${id} + "\\t${status}\\t" + ${values});`;
      add('        try {', test.id);
      add(`            Object obtenido${index} = (`, test.id);
      add(`                ${test.expression.replace(/\s*\n\s*/g, ' ')}`, test.id);
      add('            );', test.id);
      add(`            Object esperado${index} = (`, test.id);
      add(`                ${test.expected.replace(/\s*\n\s*/g, ' ')}`, test.id);
      add('            );', test.id);
      add(
        `            boolean igual = java.util.Objects.deepEquals(obtenido${index}, esperado${index}) || ver(obtenido${index}).equals(ver(esperado${index}));`,
        test.id,
      );
      add(
        `            ${report('" + (igual ? "pass" : "fail") + "', `linea(ver(obtenido${index})) + "\\t" + linea(ver(esperado${index}))`)}`,
        test.id,
      );
      add('        } catch (Throwable error) {', test.id);
      add(`            ${report('error', 'linea(String.valueOf(error))')}`, test.id);
      add('        }', test.id);
    });
    add('    }');
    add('}');
  }

  const head = imports.length;
  const source = [...imports, ...body, ...harness].join('\n');
  return {
    ok: true,
    bundle: {
      source,
      marker,
      locate: (line) => origin[line - 1 - head] ?? null,
      testAt: (line) => testLines[line - 1 - head - body.length] ?? null,
    },
  };
}

export interface JavaTestLine {
  id: string;
  status: 'pass' | 'fail' | 'error';
  actual: string;
  expected: string;
  error: string;
}

/** Splits what the program printed into its own output and the results of the tests. */
export function splitJavaOutput(stdout: string, marker: string): { output: string[]; results: JavaTestLine[] } {
  const output: string[] = [];
  const results: JavaTestLine[] = [];
  const lines = stdout.split('\n');
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  for (const line of lines) {
    const fields = line.replace(/\r$/, '').split('\t');
    if (fields[0] !== marker) {
      output.push(line.replace(/\r$/, ''));
    } else if (fields[2] === 'error') {
      results.push({ id: fields[1], status: 'error', actual: '', expected: '', error: fields[3] ?? '' });
    } else {
      results.push({
        id: fields[1],
        status: fields[2] === 'pass' ? 'pass' : 'fail',
        actual: fields[3] ?? '',
        expected: fields[4] ?? '',
        error: '',
      });
    }
  }
  return { output, results };
}
