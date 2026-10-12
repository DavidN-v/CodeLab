/// <reference lib="webworker" />

import { compileProject, guardInlineScript } from './compile';
import { AnalysisResult, BuildResult, EngineEnvelope, EngineReply, EngineRequest } from './engine-protocol';
import { Ts } from './loop-guard';
import { buildSandboxDocument } from './sandbox-document';
import { ROOT_LIBRARIES, analyzeScripts, referencedLibraries } from './script-analysis';

/**
 * Hosts the real TypeScript compiler off the main thread. The compiler is a
 * plain script served next to the app (it cannot be bundled for the browser),
 * so it is fetched the first time the lab needs it.
 */

let compiler: Promise<Ts> | null = null;
let libraries: Promise<Map<string, string> | null> | null = null;

/**
 * The compiler file declares a global `ts`. A module worker has no
 * `importScripts`, so the file is fetched and evaluated in the global scope.
 */
async function loadCompiler(baseUrl: string): Promise<Ts> {
  const response = await fetch(`${baseUrl}vendor/typescript.js`);
  if (!response.ok) {
    throw new Error('No se ha podido descargar el compilador de TypeScript.');
  }
  (0, eval)(await response.text());
  return (globalThis as unknown as { ts: Ts }).ts;
}

/** Compiler messages in Spanish, when the compiler build exposes the hook for it. */
async function localize(ts: Ts, baseUrl: string): Promise<void> {
  const hook = (ts as unknown as { setLocalizedDiagnosticMessages?: (messages: unknown) => void })
    .setLocalizedDiagnosticMessages;
  if (!hook) {
    return;
  }
  try {
    const response = await fetch(`${baseUrl}vendor/ts-es/diagnosticMessages.generated.json`);
    if (response.ok) {
      hook(await response.json());
    }
  } catch {
    // English messages are still correct messages.
  }
}

/** Fetches the declaration files the type checker needs, following their references. */
async function loadLibraries(baseUrl: string): Promise<Map<string, string> | null> {
  const loaded = new Map<string, string>();
  let pending = [...ROOT_LIBRARIES];
  try {
    while (pending.length > 0) {
      const batch = pending.filter((name) => !loaded.has(name));
      const texts = await Promise.all(
        batch.map(async (name) => {
          const response = await fetch(`${baseUrl}vendor/ts-lib/${name}`);
          if (!response.ok) {
            throw new Error(`${name}: ${response.status}`);
          }
          return response.text();
        }),
      );
      batch.forEach((name, index) => loaded.set(name, texts[index]));
      pending = texts.flatMap(referencedLibraries).filter((name) => !loaded.has(name));
    }
    return loaded;
  } catch {
    return null;
  }
}

let localized: Promise<void> | null = null;

async function handle(baseUrl: string, request: EngineRequest): Promise<BuildResult | AnalysisResult> {
  compiler ??= loadCompiler(baseUrl);
  let ts: Ts;
  try {
    ts = await compiler;
  } catch (error) {
    // Let the next request try the download again.
    compiler = null;
    throw error;
  }
  localized ??= localize(ts, baseUrl);
  await localized;

  if (request.kind === 'build') {
    const compiled = compileProject(ts, request.files);
    const sandbox =
      compiled.syntaxErrors.length > 0
        ? null
        : buildSandboxDocument(request.files, compiled, {
            token: request.token,
            tests: request.tests,
            guardInline: (code) => guardInlineScript(ts, code),
          });
    return { compiled, sandbox };
  }

  libraries ??= loadLibraries(baseUrl);
  const loaded = await libraries;
  if (!loaded) {
    // Try again next time: the network may have been down.
    libraries = null;
  }
  return { diagnostics: analyzeScripts(ts, request.files, loaded), typesChecked: loaded !== null };
}

addEventListener('message', (event: MessageEvent<EngineEnvelope>) => {
  const { id, baseUrl, request } = event.data;
  handle(baseUrl, request).then(
    (result) => postMessage({ id, ok: true, result } satisfies EngineReply),
    (error: unknown) =>
      postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) } satisfies EngineReply),
  );
});
