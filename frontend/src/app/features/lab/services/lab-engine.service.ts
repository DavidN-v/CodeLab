import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import {
  AnalysisResult,
  BuildResult,
  EngineEnvelope,
  EngineReply,
  EngineRequest,
} from '../engine/engine-protocol';
import { analyzeMarkup } from '../engine/markup-analysis';
import { RuntimeTest } from '../engine/runtime';
import { LabFile } from '../models/lab.models';

/**
 * The lab's tools: the TypeScript compiler (in a worker, loaded on first use)
 * and the browser's own CSS engine. Everything it reports comes from them.
 */
@Injectable({ providedIn: 'root' })
export class LabEngineService {
  private readonly document = inject(DOCUMENT);
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly waiting = new Map<
    number,
    { resolve: (value: BuildResult | AnalysisResult) => void; reject: (reason: Error) => void }
  >();

  /** Compiles the project and prepares the sandboxed document that will run it. */
  build(files: readonly LabFile[], tests: RuntimeTest[], token: string): Promise<BuildResult> {
    return this.ask({ kind: 'build', files: [...files], tests, token }) as Promise<BuildResult>;
  }

  /** Static analysis of the whole project: scripts by the compiler, HTML and CSS here. */
  async analyze(files: readonly LabFile[]): Promise<AnalysisResult> {
    const scripts = (await this.ask({ kind: 'analyze', files: [...files] })) as AnalysisResult;
    const supports =
      typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
        ? (property: string, value: string): boolean => CSS.supports(property, value)
        : null;
    return {
      diagnostics: [...scripts.diagnostics, ...analyzeMarkup(files, supports)],
      typesChecked: scripts.typesChecked,
    };
  }

  private ask(request: EngineRequest): Promise<BuildResult | AnalysisResult> {
    const worker = this.start();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      worker.postMessage({ id, baseUrl: this.document.baseURI, request } satisfies EngineEnvelope);
    });
  }

  private start(): Worker {
    if (this.worker) {
      return this.worker;
    }
    const worker = new Worker(new URL('../engine/lab.worker', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event: MessageEvent<EngineReply>) => {
      const reply = event.data;
      const waiting = this.waiting.get(reply.id);
      this.waiting.delete(reply.id);
      if (reply.ok) {
        waiting?.resolve(reply.result);
      } else {
        waiting?.reject(new Error(reply.error));
      }
    });
    worker.addEventListener('error', (event) => {
      // The worker itself failed (e.g. the compiler could not be downloaded): nobody is left waiting.
      event.preventDefault();
      for (const waiting of this.waiting.values()) {
        waiting.reject(new Error('No se han podido cargar las herramientas del laboratorio.'));
      }
      this.waiting.clear();
      this.worker?.terminate();
      this.worker = null;
    });
    this.worker = worker;
    return worker;
  }
}
