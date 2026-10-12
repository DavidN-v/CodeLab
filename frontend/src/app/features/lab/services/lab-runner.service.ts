import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import { CompiledProject, SourceLocation } from '../engine/compile';
import { LESSONS } from '../engine/lessons';
import { RuntimeMessage, RuntimeTestResult } from '../engine/runtime';
import { WORKER_LIMIT_MS } from '../engine/sandbox-document';
import { ConsoleEntry, LabDiagnostic, LabFile, LabTest, RunStatus, TestOutcome } from '../models/lab.models';
import { LabEngineService } from './lab-engine.service';

/** A page that has not finished loading after this long is stopped. */
const PAGE_LIMIT_MS = 20_000;

const MAX_CONSOLE_ENTRIES = 500;

/**
 * Runs the project for real, inside a sandboxed iframe that cannot reach the
 * platform: it has its own origin, no network access and no access to the
 * learner's session. Everything shown in the console, the preview and the
 * test results comes from that execution.
 */
@Injectable({ providedIn: 'root' })
export class LabRunnerService {
  private readonly engine = inject(LabEngineService);
  private readonly document = inject(DOCUMENT);

  private readonly state = signal<RunStatus>('idle');
  private readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private readonly outcomes = signal<TestOutcome[]>([]);
  private readonly runtimeProblems = signal<LabDiagnostic[]>([]);
  private readonly elapsed = signal<number | null>(null);
  private readonly page = signal(false);
  private readonly testsStale = signal(false);

  readonly status = this.state.asReadonly();
  readonly entries = this.consoleEntries.asReadonly();
  /** Results of the last run that included tests. */
  readonly testOutcomes = this.outcomes.asReadonly();
  /** Errors the browser raised while running, as diagnostics. */
  readonly runtimeDiagnostics = this.runtimeProblems.asReadonly();
  /** Milliseconds until the program finished loading; null when unknown. */
  readonly durationMs = this.elapsed.asReadonly();
  /** Whether the last run produced a page to look at. */
  readonly hasPage = this.page.asReadonly();
  /** True when the code changed after the tests ran, so their results may be out of date. */
  readonly resultsStale = this.testsStale.asReadonly();
  readonly running = computed(() => this.state() === 'running');

  private frame: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private holder: HTMLElement | null = null;
  private token = '';
  private compiled: CompiledProject | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private listening = false;
  private pagePath: string | null = null;

  /** The preview panel offers its element; without one the program runs out of sight. */
  attach(container: HTMLElement | null): void {
    this.container = container;
    if (this.frame) {
      this.parent().appendChild(this.frame);
    }
  }

  /** The code changed: what the last run reported no longer describes it. */
  markStale(): void {
    if (this.outcomes().length > 0) {
      this.testsStale.set(true);
    }
    // An error of code that no longer exists would only mislead.
    this.runtimeProblems.set([]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  /** Stops whatever is running and forgets its output. */
  reset(): void {
    this.stop();
    this.state.set('idle');
    this.consoleEntries.set([]);
    this.outcomes.set([]);
    this.runtimeProblems.set([]);
    this.elapsed.set(null);
    this.page.set(false);
    this.testsStale.set(false);
  }

  stop(): void {
    this.clearWatchdog();
    this.frame?.remove();
    this.frame = null;
    this.token = '';
  }

  /** Compiles and runs the project; with `tests`, evaluates them once the program has loaded. */
  async run(files: readonly LabFile[], tests: readonly LabTest[]): Promise<void> {
    this.stop();
    this.state.set('running');
    this.consoleEntries.set([]);
    this.runtimeProblems.set([]);
    this.elapsed.set(null);
    if (tests.length > 0) {
      this.outcomes.set([]);
      this.testsStale.set(false);
    }

    const token = crypto.randomUUID();
    this.token = token;
    let build;
    try {
      build = await this.engine.build(
        files,
        tests.map((test) => ({ id: test.id, expression: test.expression, expected: test.expected })),
        token,
      );
    } catch (error) {
      if (this.token === token) {
        this.system(error instanceof Error ? error.message : 'No se ha podido preparar la ejecución.');
        this.state.set('blocked');
      }
      return;
    }
    if (this.token !== token) {
      // Another run started while this one was compiling.
      return;
    }

    this.compiled = build.compiled;
    if (!build.sandbox) {
      const count = build.compiled.syntaxErrors.length;
      this.system(
        `No se ha ejecutado: hay ${count === 1 ? 'un error' : `${count} errores`} de sintaxis. ` +
          'Míralos en la pestaña Problemas y corrígelos primero.',
      );
      this.state.set('blocked');
      return;
    }
    if (build.compiled.units.length === 0 && !build.sandbox.hasPage) {
      this.system('No hay nada que ejecutar: el proyecto no tiene archivos HTML, JavaScript ni TypeScript.');
      this.state.set('blocked');
      return;
    }

    build.sandbox.notes.forEach((note) => this.push({ level: 'warn', text: note }));
    this.page.set(build.sandbox.hasPage);
    this.pagePath = build.sandbox.hasPage ? this.firstPage(files) : null;
    this.listen();

    const frame = this.document.createElement('iframe');
    // No `allow-same-origin`: the program gets an origin of its own and cannot
    // read the platform's storage, cookies or session.
    frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
    frame.setAttribute('title', 'Vista previa de tu proyecto');
    frame.className = 'lab-sandbox';
    frame.srcdoc = build.sandbox.html;
    this.frame = frame;
    this.parent().appendChild(frame);

    const limit = build.sandbox.hasPage ? PAGE_LIMIT_MS : WORKER_LIMIT_MS + 2000;
    this.watchdog = setTimeout(() => {
      if (this.token === token && this.state() === 'running') {
        this.timeOut();
      }
    }, limit);
  }

  private firstPage(files: readonly LabFile[]): string | null {
    const pages = files.filter((file) => /\.html?$/i.test(file.path));
    return (pages.find((file) => file.path.toLowerCase() === 'index.html') ?? pages[0])?.path ?? null;
  }

  private parent(): HTMLElement {
    if (this.container) {
      return this.container;
    }
    if (!this.holder) {
      this.holder = this.document.createElement('div');
      this.holder.hidden = true;
      this.document.body.appendChild(this.holder);
    }
    return this.holder;
  }

  private listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.document.defaultView?.addEventListener('message', (event: MessageEvent) => {
      const message = event.data as RuntimeMessage | null;
      // Only the current sandbox, and only messages of the current run, are heard.
      if (!this.frame || event.source !== this.frame.contentWindow || !message || message.lab !== this.token) {
        return;
      }
      this.receive(message);
    });
  }

  private receive(message: RuntimeMessage): void {
    switch (message.type) {
      case 'console':
        this.push({ level: message.level === 'system' ? 'system' : (message.level as ConsoleEntry['level']), text: message.text });
        break;
      case 'clear':
        this.consoleEntries.set([]);
        break;
      case 'error':
        this.fail(message.message, this.locate(message.unit, message.line));
        break;
      case 'ready':
        this.elapsed.set(message.ms);
        break;
      case 'tests':
        this.outcomes.set(message.results.map((result) => this.outcome(result)));
        break;
      case 'done':
        this.clearWatchdog();
        if (this.state() === 'running') {
          this.state.set('ok');
        }
        break;
      case 'timeout':
        this.timeOut();
        break;
    }
  }

  private outcome(result: RuntimeTestResult): TestOutcome {
    return {
      testId: result.id,
      status: result.status,
      actual: result.actual,
      expected: result.expected,
      error: result.error,
    };
  }

  /** Translates a line of the code that ran into the learner's own file and line. */
  private locate(unit: string, line: number): SourceLocation | null {
    const compiled = this.compiled?.units.find((candidate) => candidate.name === unit);
    if (compiled) {
      return compiled.lines[line - 1] ?? null;
    }
    // An error without a unit comes from a script written inside the page itself.
    return !unit && this.pagePath && line > 0 ? { path: this.pagePath, line: 0 } : null;
  }

  private fail(message: string, location: SourceLocation | null): void {
    const line = location && location.line > 0 ? location.line : undefined;
    this.push({ level: 'error', text: message, path: location?.path, line });
    const kind = /^(\w+Error)/.exec(message)?.[1] ?? 'Error';
    const code = message.includes('Bucle detenido') ? 'runtime/loop' : `runtime/${kind}`;
    this.runtimeProblems.update((problems) => [
      ...problems,
      {
        category: 'runtime',
        severity: 'error',
        confirmed: true,
        source: 'Navegador (ejecución real)',
        code,
        message,
        path: location?.path ?? null,
        line: line ?? 0,
        column: 0,
        lesson: LESSONS[code] ?? null,
      },
    ]);
    this.state.set('error');
  }

  private timeOut(): void {
    this.stop();
    this.system(
      'Ejecución detenida: el programa seguía ocupado y no terminaba. Suele ser un bucle que no llega a su condición de salida.',
    );
    this.state.set('timeout');
  }

  private system(text: string): void {
    this.push({ level: 'system', text });
  }

  private push(entry: ConsoleEntry): void {
    this.consoleEntries.update((entries) =>
      entries.length >= MAX_CONSOLE_ENTRIES ? [...entries.slice(1), entry] : [...entries, entry],
    );
  }

  private clearWatchdog(): void {
    if (this.watchdog !== null) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
  }
}
