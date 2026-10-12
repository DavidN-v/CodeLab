import { LabFile } from '../models/lab.models';
import { bundleJava, isJavaProject, splitJavaOutput } from './java-project';

const file = (path: string, content: string): LabFile => ({ path, content });

const CALCULATOR = file(
  'Calculadora.java',
  'package app;\nimport java.util.List;\n\npublic class Calculadora {\n    public static int sumar(int a, int b) { return a + b; }\n}',
);
const MAIN = file(
  'Main.java',
  'import java.util.List;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Calculadora.sumar(2, 3));\n    }\n}',
);

describe('bundleJava', () => {
  it('joins the files with imports first and only the entry class public', () => {
    const result = bundleJava([CALCULATOR, MAIN], [], 'M');

    expect(result.ok).toBe(true);
    const source = result.ok ? result.bundle.source : '';
    const lines = source.split('\n');
    expect(lines.slice(0, 2)).toEqual(['import java.util.List;', 'import java.util.Scanner;']);
    expect(source).not.toContain('package app');
    expect(source).toContain('\nclass Calculadora {');
    expect(source).toContain('\npublic class Main {');
  });

  it('translates a line of the bundle into the file and line it came from', () => {
    const result = bundleJava([CALCULATOR, MAIN], [], 'M');
    const bundle = result.ok ? result.bundle : null;
    const line = bundle!.source.split('\n').findIndex((text) => text.includes('System.out.println')) + 1;

    expect(bundle!.locate(line)).toEqual({ path: 'Main.java', line: 6 });
    expect(bundle!.locate(1)).toBeNull();
  });

  it('refuses a project without a main method', () => {
    const result = bundleJava([CALCULATOR], [], 'M');

    expect(result.ok).toBe(false);
  });

  it('runs tests from a generated class and knows which test each line belongs to', () => {
    const result = bundleJava([CALCULATOR, MAIN], [{ id: 't1', expression: 'Calculadora.sumar(2, 3)', expected: '5' }], 'M');
    const bundle = result.ok ? result.bundle : null;
    const lines = bundle!.source.split('\n');
    const line = lines.findIndex((text) => text.trim() === 'Calculadora.sumar(2, 3)') + 1;

    expect(bundle!.source).toContain('\nclass Main {');
    expect(bundle!.source).toContain('public class PruebasDelLaboratorio {');
    expect(bundle!.testAt(line)).toBe('t1');
    expect(bundle!.locate(line)).toBeNull();
  });

  it('recognises a Java project by its files', () => {
    expect(isJavaProject([MAIN])).toBe(true);
    expect(isJavaProject([file('main.js', '')])).toBe(false);
  });
});

describe('splitJavaOutput', () => {
  it('separates what the program printed from the test results', () => {
    const { output, results } = splitJavaOutput('hola\nM\tt1\tpass\t5\t5\nM\tt2\tfail\t-1\t5\nM\tt3\terror\tjava.lang.ArithmeticException\n', 'M');

    expect(output).toEqual(['hola']);
    expect(results.map((result) => `${result.id}:${result.status}`)).toEqual(['t1:pass', 't2:fail', 't3:error']);
    expect(results[1]).toMatchObject({ actual: '-1', expected: '5' });
    expect(results[2].error).toBe('java.lang.ArithmeticException');
  });
});
