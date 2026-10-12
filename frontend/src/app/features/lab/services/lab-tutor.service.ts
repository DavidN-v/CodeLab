import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { withoutErrorNotification } from '../../../core/interceptors/http-error.interceptor';
import { ConsoleEntry, LabDiagnostic, LabFile, LabPlan, LabProject, LabTest, TestOutcome } from '../models/lab.models';

/** A plan as the tutor returns it: the plan itself plus tests it proposes. */
export interface PlanAnswer extends LabPlan {
  tests: { description: string; expression: string; expected: string }[];
}

export interface FixAnswer {
  path: string;
  content: string;
  explanation: string;
}

/** What the real tools have reported so far; the tutor reasons from this and nothing else. */
export interface LabEvidence {
  diagnostics: readonly LabDiagnostic[];
  console: readonly ConsoleEntry[];
  tests: readonly LabTest[];
  outcomes: readonly TestOutcome[];
  /** False when the program has not been run since the last change. */
  executed: boolean;
  /** True when the test results are older than the code. */
  testsStale: boolean;
}

/** The lab's AI tutor. It lives behind the API: no key ever reaches the browser. */
@Injectable({ providedIn: 'root' })
export class LabTutorService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/tutor/lab`;

  plan(idea: string, answers: string): Observable<PlanAnswer> {
    return this.http.post<PlanAnswer>(`${this.url}/plan`, { idea, answers }, { context: withoutErrorNotification() });
  }

  /** `level` 1-4 asks for graded help; 0 explains the one problem in `focus`. */
  help(level: number, project: LabProject, evidence: LabEvidence, focus: string, question: string): Observable<string> {
    return this.http
      .post<{ answer: string }>(`${this.url}/help`, this.body(level, project, evidence, focus, question), {
        context: withoutErrorNotification(),
      })
      .pipe(map((response) => response.answer));
  }

  /** Asks for a corrected version of one file. Nothing is applied by this call. */
  fix(project: LabProject, evidence: LabEvidence, path: string): Observable<FixAnswer> {
    return this.http.post<FixAnswer>(`${this.url}/fix`, this.body(4, project, evidence, path, ''), {
      context: withoutErrorNotification(),
    });
  }

  private body(level: number, project: LabProject, evidence: LabEvidence, focus: string, question: string): object {
    return {
      level,
      idea: project.idea || project.plan?.goal || '',
      requirements: (project.plan?.requirements ?? []).map((requirement) => `- ${requirement}`).join('\n'),
      files: project.files.map((file: LabFile) => ({ path: file.path, content: file.content })),
      diagnostics: describeDiagnostics(evidence.diagnostics),
      console: describeConsole(evidence),
      tests: describeTests(evidence),
      focus,
      question,
    };
  }
}

export function describeDiagnostic(diagnostic: LabDiagnostic): string {
  const where = diagnostic.path ? `${diagnostic.path}${diagnostic.line ? `:${diagnostic.line}` : ''}` : 'proyecto';
  const certainty = diagnostic.confirmed ? 'confirmado' : 'sospecha';
  return `[${certainty}] [${diagnostic.source}] ${where} (${diagnostic.code}): ${diagnostic.message}`;
}

function describeDiagnostics(diagnostics: readonly LabDiagnostic[]): string {
  return clip(diagnostics.map(describeDiagnostic).join('\n'), 12_000);
}

function describeConsole(evidence: LabEvidence): string {
  if (!evidence.executed) {
    return 'El programa no se ha ejecutado desde el último cambio.';
  }
  const lines = evidence.console.map((entry) => {
    const where = entry.path ? ` (${entry.path}${entry.line ? `:${entry.line}` : ''})` : '';
    return `[${entry.level}] ${entry.text}${where}`;
  });
  return clip(lines.join('\n') || 'El programa se ejecutó y no escribió nada en la consola.', 8000);
}

function describeTests(evidence: LabEvidence): string {
  if (evidence.tests.length === 0) {
    return 'No hay pruebas definidas.';
  }
  if (evidence.outcomes.length === 0) {
    return 'Hay pruebas definidas, pero no se han ejecutado.';
  }
  const byId = new Map(evidence.outcomes.map((outcome) => [outcome.testId, outcome]));
  const lines = evidence.tests.map((test) => {
    const outcome = byId.get(test.id);
    if (!outcome) {
      return `SIN EJECUTAR «${test.description}»: ${test.expression}`;
    }
    if (outcome.status === 'pass') {
      return `PASA «${test.description}»: ${test.expression} → ${outcome.actual}`;
    }
    if (outcome.status === 'error') {
      return `ERROR «${test.description}»: ${test.expression} lanzó ${outcome.error}`;
    }
    return `FALLA «${test.description}»: ${test.expression} → esperado ${outcome.expected}, obtenido ${outcome.actual}`;
  });
  const note = evidence.testsStale ? 'Aviso: estos resultados son anteriores al último cambio del código.\n' : '';
  return clip(note + lines.join('\n'), 8000);
}

function clip(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 20)}\n… (recortado)`;
}
