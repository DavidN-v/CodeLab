import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppError } from '../../../core/models/api-error.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CatalogEntry, TEMPLATES, catalogEntry } from '../data/lab-catalog';
import { formatCode } from '../engine/format';
import { pathProblem } from '../engine/languages';
import {
  EMPTY_CONTENT,
  LabDiagnostic,
  LabFile,
  LabMode,
  LabPlan,
  LabProject,
  LabProjectSummary,
  LabProposal,
  LabTest,
  LabVersion,
} from '../models/lab.models';
import { LabEngineService } from './lab-engine.service';
import { LabProjectService } from './lab-project.service';
import { LabRunnerService } from './lab-runner.service';
import { LabEvidence, LabTutorService, PlanAnswer, describeDiagnostic } from './lab-tutor.service';

/** Where the current project is kept right now. */
export type SaveState = 'saved' | 'saving' | 'unsaved' | 'draft' | 'error';

const ANALYSIS_DELAY_MS = 500;
const AUTOSAVE_DELAY_MS = 2500;

export interface TutorMessage {
  /** What the learner asked for, shown above the answer. */
  title: string;
  markdown: string;
}

/**
 * The state of the lab workspace: the project being edited, what the tools
 * say about it and the conversation with the tutor. Provided by the workspace
 * page, so it lives exactly as long as the page.
 */
@Injectable()
export class LabStore {
  private readonly auth = inject(AuthService);
  private readonly projects = inject(LabProjectService);
  private readonly engine = inject(LabEngineService);
  private readonly tutor = inject(LabTutorService);
  private readonly notifications = inject(NotificationService);
  readonly runner = inject(LabRunnerService);

  // --- Project ---------------------------------------------------------------
  private readonly current = signal<LabProject>(fromCatalog(TEMPLATES[0]));
  private readonly active = signal(TEMPLATES[0].files[0].path);
  private readonly saving = signal<SaveState>('draft');
  private readonly loaded = signal(false);

  readonly project = this.current.asReadonly();
  readonly activePath = this.active.asReadonly();
  readonly saveState = this.saving.asReadonly();
  /** False while the last project is being fetched at start-up. */
  readonly ready = this.loaded.asReadonly();
  readonly signedIn = this.auth.isAuthenticated;
  readonly activeFile = computed(
    () => this.current().files.find((file) => file.path === this.active()) ?? this.current().files[0] ?? null,
  );
  /** The exercise this project started from, with its statement. */
  readonly exercise = computed(() => {
    const entry = catalogEntry(this.current().catalogId);
    return entry && entry.mode !== 'free' ? entry : null;
  });

  // --- Analysis --------------------------------------------------------------
  private readonly staticProblems = signal<LabDiagnostic[]>([]);
  private readonly analysing = signal(false);
  private readonly typed = signal(true);
  private readonly toolsFailure = signal<string | null>(null);
  private readonly executedFresh = signal(false);

  readonly analyzing = this.analysing.asReadonly();
  /** False when the type libraries could not be loaded: types were not checked. */
  readonly typesChecked = this.typed.asReadonly();
  /** Why the analysis tools are not available, when they are not. */
  readonly toolsError = this.toolsFailure.asReadonly();
  /** True when the program has run since the last change to the code. */
  readonly executed = this.executedFresh.asReadonly();

  /** Tests that failed in the last run, as problems the learner can act on. */
  private readonly testProblems = computed<LabDiagnostic[]>(() => {
    const tests = new Map(this.current().tests.map((test) => [test.id, test]));
    return this.runner
      .testOutcomes()
      .filter((outcome) => outcome.status !== 'pass' && tests.has(outcome.testId))
      .map((outcome) => {
        const test = tests.get(outcome.testId)!;
        const detail =
          outcome.status === 'error'
            ? `no se pudo evaluar \`${test.expression}\`: ${outcome.error}`
            : `\`${test.expression}\` debía dar ${outcome.expected} y ha dado ${outcome.actual}`;
        return {
          category: 'logic',
          severity: 'error',
          confirmed: true,
          source: 'Pruebas (ejecución real)',
          code: 'prueba',
          message: `Falla la prueba «${test.description}»: ${detail}.`,
          path: null,
          line: 0,
          column: 0,
          lesson: null,
        } satisfies LabDiagnostic;
      });
  });

  readonly diagnostics = computed<LabDiagnostic[]>(() => [
    ...this.staticProblems(),
    ...this.runner.runtimeDiagnostics(),
    ...this.testProblems(),
  ]);
  readonly errorCount = computed(() => this.diagnostics().filter((d) => d.severity === 'error').length);
  readonly warningCount = computed(() => this.diagnostics().filter((d) => d.severity !== 'error').length);
  /** Problems of the file being edited, for the editor's underlines. */
  readonly activeMarks = computed(() =>
    this.diagnostics()
      .filter((diagnostic) => diagnostic.path === this.active() && diagnostic.line > 0)
      .map((diagnostic) => ({
        line: diagnostic.line,
        message: diagnostic.message,
        severity: diagnostic.severity === 'error' ? ('error' as const) : ('warning' as const),
      })),
  );

  // --- Tutor -----------------------------------------------------------------
  private readonly tutorBusy = signal(false);
  private readonly tutorAnswers = signal<TutorMessage[]>([]);
  private readonly tutorFailure = signal<string | null>(null);
  private readonly pendingProposal = signal<LabProposal | null>(null);
  private readonly lastApplied = signal<{ path: string; before: string } | null>(null);
  private readonly proposedTests = signal<LabTest[]>([]);

  readonly tutorLoading = this.tutorBusy.asReadonly();
  readonly tutorMessages = this.tutorAnswers.asReadonly();
  readonly tutorError = this.tutorFailure.asReadonly();
  /** A correction waiting for the learner to accept or reject it. */
  readonly proposal = this.pendingProposal.asReadonly();
  /** Set after accepting a correction, so it can be undone. */
  readonly undoable = this.lastApplied.asReadonly();
  /** Tests the tutor suggested and the learner has not accepted or discarded yet. */
  readonly suggestedTests = this.proposedTests.asReadonly();

  // --- Saved projects ---------------------------------------------------------
  private readonly summaries = signal<LabProjectSummary[] | null>(null);
  private readonly savePoints = signal<LabVersion[] | null>(null);
  readonly savedProjects = this.summaries.asReadonly();
  readonly versions = this.savePoints.asReadonly();

  private analysisTimer: ReturnType<typeof setTimeout> | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private analysisRun = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.flushDraft();
      this.runner.reset();
    });
  }

  /** Opens what the learner was last working on, or a fresh page to start from. */
  async init(): Promise<void> {
    const draft = this.projects.readDraft();
    const lastId = this.projects.lastProjectId();
    let project: LabProject | null = null;
    if (this.signedIn() && lastId !== null) {
      // A draft of that same project is newer than what the server has.
      if (draft && draft.id === lastId) {
        project = draft;
        this.saving.set('unsaved');
      } else {
        try {
          project = await firstValueFrom(this.projects.open(lastId));
          this.saving.set('saved');
        } catch {
          this.projects.rememberProject(null);
        }
      }
    }
    if (!project && draft) {
      // A draft that points at an account project cannot be saved to it while signed out.
      project = this.signedIn() ? draft : { ...draft, id: null };
      this.saving.set(project.id === null ? 'draft' : 'unsaved');
    }
    if (project && project.files.length > 0) {
      this.adopt(project);
    } else {
      this.scheduleAnalysis(0);
    }
    this.loaded.set(true);
  }

  // --- Editing ---------------------------------------------------------------

  select(path: string): void {
    if (this.current().files.some((file) => file.path === path)) {
      this.active.set(path);
    }
  }

  updateFile(path: string, content: string): void {
    const file = this.current().files.find((candidate) => candidate.path === path);
    if (!file || file.content === content) {
      return;
    }
    this.patch({ files: this.current().files.map((f) => (f.path === path ? { ...f, content } : f)) });
    this.codeChanged();
  }

  /** Returns why the file cannot be created, or null when it was. */
  addFile(path: string): string | null {
    const problem = pathProblem(path, this.current().files);
    if (problem) {
      return problem;
    }
    this.patch({ files: [...this.current().files, { path, content: '' }] });
    this.active.set(path);
    this.codeChanged();
    return null;
  }

  renameFile(from: string, to: string): string | null {
    const problem = pathProblem(to, this.current().files, from);
    if (problem) {
      return problem;
    }
    this.patch({ files: this.current().files.map((f) => (f.path === from ? { ...f, path: to } : f)) });
    if (this.active() === from) {
      this.active.set(to);
    }
    this.codeChanged();
    return null;
  }

  deleteFile(path: string): void {
    const files = this.current().files.filter((file) => file.path !== path);
    if (files.length === 0) {
      this.notifications.showInfo('Un proyecto necesita al menos un archivo.');
      return;
    }
    this.patch({ files });
    if (this.active() === path) {
      this.active.set(files[0].path);
    }
    this.codeChanged();
  }

  rename(name: string, description: string): void {
    this.patch({ name: name.trim() || 'Proyecto sin nombre', description: description.trim() });
    this.changed();
  }

  setMode(mode: LabMode): void {
    if (mode !== this.current().mode) {
      this.patch({ mode });
      this.changed();
    }
  }

  setIdea(idea: string): void {
    this.patch({ idea });
    this.changed();
  }

  toggleStep(index: number): void {
    const done = this.current().doneSteps;
    this.patch({ doneSteps: done.includes(index) ? done.filter((i) => i !== index) : [...done, index] });
    this.changed();
  }

  async format(): Promise<void> {
    const file = this.activeFile();
    if (!file) {
      return;
    }
    const result = await formatCode(file.path, file.content);
    if (result.ok) {
      this.updateFile(file.path, result.code);
    } else {
      this.notifications.showInfo(result.error);
    }
  }

  // --- Tests -----------------------------------------------------------------

  addTest(description: string, expression: string, expected: string): void {
    this.patch({
      tests: [...this.current().tests, { id: crypto.randomUUID(), description, expression, expected, origin: 'student' }],
    });
    this.runner.markStale();
    this.changed();
  }

  updateTest(id: string, changes: Partial<Pick<LabTest, 'description' | 'expression' | 'expected'>>): void {
    this.patch({ tests: this.current().tests.map((test) => (test.id === id ? { ...test, ...changes } : test)) });
    this.runner.markStale();
    this.changed();
  }

  removeTest(id: string): void {
    this.patch({ tests: this.current().tests.filter((test) => test.id !== id) });
    this.changed();
  }

  /** The learner decides that a test suggested by the tutor describes what they want. */
  acceptSuggestedTest(id: string): void {
    const test = this.proposedTests().find((candidate) => candidate.id === id);
    if (test) {
      this.proposedTests.update((tests) => tests.filter((candidate) => candidate.id !== id));
      this.patch({ tests: [...this.current().tests, test] });
      this.runner.markStale();
      this.changed();
    }
  }

  discardSuggestedTest(id: string): void {
    this.proposedTests.update((tests) => tests.filter((candidate) => candidate.id !== id));
  }

  // --- Running ---------------------------------------------------------------

  async run(withTests: boolean): Promise<void> {
    const project = this.current();
    await this.runner.run(project.files, withTests ? project.tests : []);
    this.executedFresh.set(this.runner.status() !== 'blocked');
  }

  // --- Projects --------------------------------------------------------------

  /** Starts a new project from a template, a challenge or a debugging exercise. */
  startFrom(entry: CatalogEntry): void {
    this.flushDraft();
    this.adopt(fromCatalog(entry));
    this.saving.set('draft');
    this.projects.rememberProject(null);
    this.projects.writeDraft(this.current());
  }

  /** Puts the exercise back as it was, keeping the project's identity. */
  resetExercise(): void {
    const entry = this.exercise();
    if (entry) {
      const fresh = fromCatalog(entry);
      this.patch({ files: fresh.files, tests: fresh.tests });
      this.active.set(fresh.files[fresh.files.length - 1].path);
      this.runner.reset();
      this.codeChanged();
    }
  }

  async save(): Promise<boolean> {
    if (!this.signedIn()) {
      this.notifications.showInfo('Entra con tu cuenta para guardar el proyecto. De momento se conserva en este navegador.');
      return false;
    }
    this.clearSaveTimer();
    this.saving.set('saving');
    const sent = this.current();
    try {
      const saved = await firstValueFrom(this.projects.save(sent));
      // Edits made while the request was in flight are kept; only the id is taken from the answer.
      if (this.current() === sent) {
        this.saving.set('saved');
      } else {
        this.saving.set('unsaved');
        this.scheduleSave();
      }
      if (sent.id === null) {
        this.patch({ id: saved.id });
      }
      this.projects.rememberProject(saved.id);
      this.projects.writeDraft(this.current());
      this.summaries.set(null);
      return true;
    } catch {
      this.saving.set('error');
      return false;
    }
  }

  async loadProjects(): Promise<void> {
    if (!this.signedIn()) {
      this.summaries.set([]);
      return;
    }
    try {
      this.summaries.set(await firstValueFrom(this.projects.list()));
    } catch {
      this.summaries.set([]);
    }
  }

  async openProject(id: number): Promise<void> {
    try {
      const project = await firstValueFrom(this.projects.open(id));
      this.flushDraft();
      this.adopt(project);
      this.saving.set('saved');
      this.projects.rememberProject(id);
      this.projects.writeDraft(project);
    } catch {
      // The interceptor has already told the learner what went wrong.
    }
  }

  async duplicateProject(id: number): Promise<void> {
    try {
      await firstValueFrom(this.projects.duplicate(id));
      await this.loadProjects();
    } catch {
      // Reported by the interceptor.
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await firstValueFrom(this.projects.delete(id));
      if (this.current().id === id) {
        // The work on screen stays, as a draft that is no longer in the account.
        this.patch({ id: null });
        this.saving.set('draft');
        this.projects.rememberProject(null);
        this.projects.writeDraft(this.current());
      }
      await this.loadProjects();
    } catch {
      // Reported by the interceptor.
    }
  }

  async loadVersions(): Promise<void> {
    const id = this.current().id;
    if (id === null) {
      this.savePoints.set([]);
      return;
    }
    try {
      this.savePoints.set(await firstValueFrom(this.projects.versions(id)));
    } catch {
      this.savePoints.set([]);
    }
  }

  /** Keeps the project as it is now, so the learner can come back to it. */
  async saveVersion(label: string): Promise<boolean> {
    if (!(await this.save())) {
      return false;
    }
    const id = this.current().id;
    if (id === null) {
      return false;
    }
    try {
      await firstValueFrom(this.projects.saveVersion(id, label));
      await this.loadVersions();
      return true;
    } catch {
      return false;
    }
  }

  async restoreVersion(versionId: number): Promise<void> {
    const id = this.current().id;
    if (id === null) {
      return;
    }
    try {
      const project = await firstValueFrom(this.projects.restoreVersion(id, versionId));
      this.adopt(project);
      this.saving.set('saved');
      this.projects.writeDraft(project);
      await this.loadVersions();
    } catch {
      // Reported by the interceptor.
    }
  }

  // --- Tutor -----------------------------------------------------------------

  /** Turns the idea into a goal, requirements, steps and suggested tests. */
  async planIdea(idea: string, answers: string): Promise<void> {
    const answer = await this.askTutor(() => firstValueFrom(this.tutor.plan(idea, answers)));
    if (!answer) {
      return;
    }
    const plan: LabPlan = {
      goal: answer.goal ?? '',
      questions: answer.questions ?? [],
      requirements: answer.requirements ?? [],
      steps: answer.steps ?? [],
      concepts: answer.concepts ?? [],
    };
    this.patch({ idea, plan, doneSteps: [] });
    this.proposedTests.set(suggested(answer));
    this.changed();
  }

  /** Graded help, from a short hint (1) to an example of the fix (4). */
  async help(level: number, question: string): Promise<void> {
    const titles = ['', 'Pista', 'El concepto', 'Dónde mirar', 'Ejemplo de corrección'];
    const answer = await this.askTutor(() =>
      firstValueFrom(this.tutor.help(level, this.current(), this.evidence(), '', question)),
    );
    if (answer) {
      this.tutorAnswers.update((messages) => [
        ...messages,
        { title: question ? `${titles[level]} · ${question}` : titles[level], markdown: answer },
      ]);
    }
  }

  /** A full explanation of one problem, for those the lab has no lesson for. */
  async explain(diagnostic: LabDiagnostic): Promise<void> {
    const answer = await this.askTutor(() =>
      firstValueFrom(this.tutor.help(0, this.current(), this.evidence(), describeDiagnostic(diagnostic), '')),
    );
    if (answer) {
      this.tutorAnswers.update((messages) => [
        ...messages,
        { title: `Explicación · ${diagnostic.message}`, markdown: answer },
      ]);
    }
  }

  /** Asks for a correction of one file. It is shown as a comparison; nothing changes yet. */
  async requestFix(path: string): Promise<void> {
    const file = this.current().files.find((candidate) => candidate.path === path);
    if (!file) {
      return;
    }
    const before = file.content;
    const answer = await this.askTutor(() => firstValueFrom(this.tutor.fix(this.current(), this.evidence(), path)));
    if (!answer) {
      return;
    }
    if (answer.content === before) {
      this.tutorAnswers.update((messages) => [
        ...messages,
        { title: `Corrección de ${path}`, markdown: answer.explanation || 'El tutor no propone ningún cambio en este archivo.' },
      ]);
      return;
    }
    this.pendingProposal.set({ path, before, after: answer.content, explanation: answer.explanation });
  }

  acceptProposal(): void {
    const proposal = this.pendingProposal();
    if (!proposal) {
      return;
    }
    const file = this.current().files.find((candidate) => candidate.path === proposal.path);
    if (file) {
      // What is undone is the file as it was when accepting, including edits made since the request.
      this.lastApplied.set({ path: proposal.path, before: file.content });
      this.updateFile(proposal.path, proposal.after);
      this.active.set(proposal.path);
    }
    this.pendingProposal.set(null);
  }

  rejectProposal(): void {
    this.pendingProposal.set(null);
  }

  undoFix(): void {
    const applied = this.lastApplied();
    if (applied) {
      this.updateFile(applied.path, applied.before);
      this.active.set(applied.path);
      this.lastApplied.set(null);
    }
  }

  clearTutor(): void {
    this.tutorAnswers.set([]);
    this.tutorFailure.set(null);
  }

  /** Everything the real tools know right now; what the tutor is allowed to rely on. */
  evidence(): LabEvidence {
    return {
      diagnostics: this.diagnostics(),
      console: this.runner.entries(),
      tests: this.current().tests,
      outcomes: this.runner.testOutcomes(),
      executed: this.executedFresh(),
      testsStale: this.runner.resultsStale(),
    };
  }

  // --- Internals -------------------------------------------------------------

  private async askTutor<T>(request: () => Promise<T>): Promise<T | null> {
    if (!this.signedIn()) {
      this.tutorFailure.set('Entra con tu cuenta para preguntar al tutor.');
      return null;
    }
    if (this.tutorBusy()) {
      return null;
    }
    this.tutorBusy.set(true);
    this.tutorFailure.set(null);
    try {
      return await request();
    } catch (error) {
      this.tutorFailure.set(error instanceof AppError ? error.message : 'El tutor no ha podido responder.');
      return null;
    } finally {
      this.tutorBusy.set(false);
    }
  }

  private adopt(project: LabProject): void {
    this.clearTimers();
    this.runner.reset();
    this.current.set(project);
    this.active.set(preferredFile(project.files));
    this.staticProblems.set([]);
    this.executedFresh.set(false);
    this.pendingProposal.set(null);
    this.lastApplied.set(null);
    this.proposedTests.set([]);
    this.tutorAnswers.set([]);
    this.tutorFailure.set(null);
    this.savePoints.set(null);
    this.scheduleAnalysis(0);
  }

  private patch(changes: Partial<LabProject>): void {
    this.current.update((project) => ({ ...project, ...changes }));
  }

  private codeChanged(): void {
    this.executedFresh.set(false);
    this.runner.markStale();
    this.scheduleAnalysis(ANALYSIS_DELAY_MS);
    this.changed();
  }

  private changed(): void {
    this.projects.writeDraft(this.current());
    if (this.current().id !== null && this.signedIn()) {
      this.saving.set('unsaved');
      this.scheduleSave();
    } else {
      this.saving.set('draft');
    }
  }

  private scheduleSave(): void {
    this.clearSaveTimer();
    this.saveTimer = setTimeout(() => void this.save(), AUTOSAVE_DELAY_MS);
  }

  private scheduleAnalysis(delay: number): void {
    if (this.analysisTimer !== null) {
      clearTimeout(this.analysisTimer);
    }
    this.analysisTimer = setTimeout(() => void this.analyze(), delay);
  }

  private async analyze(): Promise<void> {
    const run = ++this.analysisRun;
    this.analysing.set(true);
    try {
      const result = await this.engine.analyze(this.current().files);
      if (run === this.analysisRun) {
        this.staticProblems.set(result.diagnostics);
        this.typed.set(result.typesChecked);
        this.toolsFailure.set(null);
      }
    } catch (error) {
      if (run === this.analysisRun) {
        // Without the tools nothing is known: say so instead of showing "no problems".
        this.staticProblems.set([]);
        this.toolsFailure.set(error instanceof Error ? error.message : 'No se ha podido analizar el código.');
      }
    } finally {
      if (run === this.analysisRun) {
        this.analysing.set(false);
      }
    }
  }

  private flushDraft(): void {
    this.projects.writeDraft(this.current());
  }

  private clearSaveTimer(): void {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearSaveTimer();
    if (this.analysisTimer !== null) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = null;
    }
  }
}

function fromCatalog(entry: CatalogEntry): LabProject {
  return {
    ...EMPTY_CONTENT,
    id: null,
    name: entry.mode === 'free' ? 'Proyecto sin nombre' : entry.title,
    description: entry.mode === 'free' ? '' : entry.summary,
    mode: entry.mode,
    files: entry.files.map((file: LabFile) => ({ ...file })),
    tests: entry.tests.map((test) => ({ ...test, id: crypto.randomUUID(), origin: 'catalog' as const })),
    catalogId: entry.id,
  };
}

function suggested(answer: PlanAnswer): LabTest[] {
  return (answer.tests ?? [])
    .filter((test) => test.expression && test.expected)
    .map((test) => ({
      id: crypto.randomUUID(),
      description: test.description || test.expression,
      expression: test.expression,
      expected: test.expected,
      origin: 'tutor' as const,
    }));
}

/** The file a learner most likely wants to see first: the script, then the page. */
function preferredFile(files: readonly LabFile[]): string {
  const script = files.find((file) => /\.(js|ts)$/i.test(file.path));
  return (script ?? files[0])?.path ?? '';
}
