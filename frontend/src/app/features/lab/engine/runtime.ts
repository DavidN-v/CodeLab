/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The code that runs next to the learner's program, inside the sandbox.
 *
 * Both functions here are turned into text with `toString()` and injected into
 * a sandboxed iframe, so they must be completely self-contained: no imports,
 * no helpers, nothing from the surrounding module.
 */

export interface RuntimeUnit {
  name: string;
  /** Page mode: the code itself. Worker mode: a blob URL to import. */
  source: string;
}

export interface RuntimeTest {
  id: string;
  expression: string;
  expected: string;
}

export interface RuntimeConfig {
  token: string;
  /** `page`: in the document, with the DOM. `worker`: no DOM, can be killed. */
  mode: 'page' | 'worker';
  units: RuntimeUnit[];
  tests: RuntimeTest[];
  /** How long a loop may spin before it is stopped. */
  loopLimitMs: number;
}

/** A message from the sandbox. `lab` carries the token of the run it belongs to. */
export type RuntimeMessage = { lab: string } & (
  | { type: 'console'; level: string; text: string }
  | { type: 'clear' }
  | { type: 'error'; message: string; unit: string; line: number; column: number }
  | { type: 'ready'; ms: number }
  | { type: 'tests'; results: RuntimeTestResult[] }
  | { type: 'done' }
  | { type: 'timeout' }
);

export interface RuntimeTestResult {
  id: string;
  status: 'pass' | 'fail' | 'error';
  actual: string;
  expected: string;
  error: string;
}

export function labRuntime(config: RuntimeConfig): void {
  const scope: any = globalThis;
  const isPage = config.mode === 'page';
  const started = performance.now();
  const urlNames: Record<string, string> = {};
  const post = (message: any): void => {
    message.lab = config.token;
    if (isPage) {
      scope.parent.postMessage(message, '*');
    } else {
      scope.postMessage(message);
    }
  };

  // --- Showing values the way a browser console does ------------------------
  const inspect = (value: any, depth: number, quote: boolean, seen: any[]): string => {
    if (typeof value === 'string') {
      return quote ? JSON.stringify(value) : value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || value === undefined || value === null) {
      return Object.is(value, -0) ? '-0' : String(value);
    }
    if (typeof value === 'bigint') {
      return `${value}n`;
    }
    if (typeof value === 'symbol') {
      return value.toString();
    }
    if (typeof value === 'function') {
      return `[Función ${value.name || 'anónima'}]`;
    }
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? 'Fecha no válida' : value.toISOString();
    }
    if (value instanceof RegExp) {
      return String(value);
    }
    if (scope.Element && value instanceof scope.Element) {
      const id = value.id ? `#${value.id}` : '';
      return `<${value.tagName.toLowerCase()}${id}>`;
    }
    if (seen.indexOf(value) >= 0) {
      return '[Circular]';
    }
    if (depth > 4) {
      return Array.isArray(value) ? '[…]' : '{…}';
    }
    const inner = seen.concat([value]);
    if (Array.isArray(value)) {
      return `[${value.map((item) => inspect(item, depth + 1, true, inner)).join(', ')}]`;
    }
    if (value instanceof Map) {
      const entries = Array.from(value.entries()).map(
        ([key, item]) => `${inspect(key, depth + 1, true, inner)} => ${inspect(item, depth + 1, true, inner)}`,
      );
      return `Map(${value.size}) {${entries.join(', ')}}`;
    }
    if (value instanceof Set) {
      const items = Array.from(value.values()).map((item) => inspect(item, depth + 1, true, inner));
      return `Set(${value.size}) {${items.join(', ')}}`;
    }
    let keys: string[];
    try {
      keys = Object.keys(value);
    } catch {
      return String(value);
    }
    const name = value.constructor && value.constructor.name !== 'Object' ? `${value.constructor.name} ` : '';
    const fields = keys.map((key) => {
      let field: string;
      try {
        field = inspect(value[key], depth + 1, true, inner);
      } catch {
        field = '[no se puede leer]';
      }
      return `${key}: ${field}`;
    });
    return `${name}{${fields.length ? ` ${fields.join(', ')} ` : ''}}`;
  };

  // --- Console ---------------------------------------------------------------
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    const original = scope.console[level];
    scope.console[level] = (...values: any[]): void => {
      post({ type: 'console', level, text: values.map((value) => inspect(value, 0, false, [])).join(' ') });
      original.apply(scope.console, values);
    };
  }
  scope.console.clear = (): void => post({ type: 'clear' });
  scope.console.table = (value: any): void => scope.console.log(value);

  // --- Loops that never end --------------------------------------------------
  // The timer below only fires when the thread is free, so `windowStart` stays
  // set for as long as one piece of code keeps the thread busy.
  let iterations = 0;
  let windowStart = 0;
  scope.setInterval(() => {
    windowStart = 0;
  }, 200);
  scope.__labGuard = (): void => {
    if ((++iterations & 1023) !== 0) {
      return;
    }
    const now = performance.now();
    if (!windowStart) {
      windowStart = now;
    } else if (now - windowStart > config.loopLimitMs) {
      windowStart = 0;
      throw new Error(
        `Bucle detenido: llevaba más de ${Math.round(config.loopLimitMs / 1000)} segundos sin terminar. ` +
          'Revisa la condición que debería hacerlo parar.',
      );
    }
  };

  // --- Errors ----------------------------------------------------------------
  const unitOf = (file: string): string => {
    if (urlNames[file]) {
      return urlNames[file];
    }
    const marker = 'lab:///';
    const at = file.indexOf(marker);
    return at >= 0 ? file.slice(at + marker.length) : '';
  };
  const fromStack = (error: any): { unit: string; line: number; column: number } => {
    const stack = error && typeof error.stack === 'string' ? error.stack : '';
    const frames = /((?:lab:\/\/\/|blob:)[^\s()]+?):(\d+):(\d+)/g;
    // The first frame can be this runtime (the loop guard throws from here):
    // the learner's code is the first frame that belongs to one of their files.
    for (let frame = frames.exec(stack); frame; frame = frames.exec(stack)) {
      const unit = unitOf(frame[1]);
      if (unit) {
        return { unit, line: Number(frame[2]), column: Number(frame[3]) };
      }
    }
    return { unit: '', line: 0, column: 0 };
  };
  const describe = (error: any): string =>
    error instanceof Error ? `${error.name}: ${error.message}` : inspect(error, 0, false, []);
  const report = (error: any): void => {
    post({ type: 'error', message: describe(error), ...fromStack(error) });
  };
  scope.addEventListener('error', (event: any) => {
    if (event.error === undefined && !event.message) {
      return;
    }
    const located = fromStack(event.error);
    post({
      type: 'error',
      message: event.error !== undefined && event.error !== null ? describe(event.error) : String(event.message),
      unit: located.unit || unitOf(String(event.filename || '')),
      line: located.line || Number(event.lineno) || 0,
      column: located.column || Number(event.colno) || 0,
    });
  });
  scope.addEventListener('unhandledrejection', (event: any) => {
    const located = fromStack(event.reason);
    post({ type: 'error', message: `Promesa rechazada sin capturar: ${describe(event.reason)}`, ...located });
  });

  // --- Tests -----------------------------------------------------------------
  const same = (a: any, b: any, seen: any[]): boolean => {
    if (Object.is(a, b) || (a === 0 && b === 0)) {
      return true;
    }
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
      return false;
    }
    if (seen.indexOf(a) >= 0) {
      return true;
    }
    const inner = seen.concat([a]);
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }
    if (a instanceof Map && b instanceof Map) {
      return same(Array.from(a.entries()), Array.from(b.entries()), inner);
    }
    if (a instanceof Set && b instanceof Set) {
      return same(Array.from(a.values()), Array.from(b.values()), inner);
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && same(a[key], b[key], inner))
    );
  };
  const settle = (value: any): Promise<any> => {
    if (!value || typeof value.then !== 'function') {
      return Promise.resolve(value);
    }
    return Promise.race([
      value,
      new Promise((_, reject) =>
        scope.setTimeout(() => reject(new Error('La promesa no terminó en 2 segundos.')), 2000),
      ),
    ]);
  };
  const evaluate = scope.eval;
  const runTests = async (): Promise<void> => {
    const results: any[] = [];
    for (const test of config.tests) {
      const result = { id: test.id, status: 'error', actual: '', expected: test.expected.trim(), error: '' };
      results.push(result);
      let actual: any;
      try {
        // Indirect eval: the expression sees the program's globals, like the console would.
        actual = await settle(evaluate(test.expression));
      } catch (error) {
        result.error = describe(error);
        continue;
      }
      result.actual = inspect(actual, 0, true, []);
      let expected: any;
      let literal = false;
      try {
        expected = await settle(evaluate(`(${test.expected}\n)`));
      } catch {
        // Not valid JavaScript: take what the learner wrote as plain text.
        literal = true;
      }
      if (literal) {
        result.status = String(actual) === test.expected.trim() ? 'pass' : 'fail';
        result.actual = inspect(actual, 0, false, []);
      } else {
        result.expected = inspect(expected, 0, true, []);
        result.status = same(actual, expected, []) ? 'pass' : 'fail';
      }
    }
    if (config.tests.length > 0) {
      post({ type: 'tests', results });
    }
  };
  const finish = (): void => {
    post({ type: 'ready', ms: Math.round(performance.now() - started) });
    void runTests().then(() => post({ type: 'done' }));
  };

  // --- Running the program ---------------------------------------------------
  if (!isPage) {
    for (const unit of config.units) {
      urlNames[unit.source] = unit.name;
      try {
        scope.importScripts(unit.source);
      } catch (error) {
        report(error);
      }
    }
    finish();
    return;
  }

  const document = scope.document;
  const codeOf: Record<string, string> = {};
  for (const unit of config.units) {
    codeOf[unit.name] = unit.source;
  }
  const ran: Record<string, boolean> = {};
  // A script element added by code runs at once, and `sourceURL` gives it a
  // name and its own line numbers in errors.
  scope.__labRun = (name: string): void => {
    if (ran[name] || codeOf[name] === undefined) {
      return;
    }
    ran[name] = true;
    const script = document.createElement('script');
    script.textContent = `${codeOf[name]}\n//# sourceURL=lab:///${name}`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  };
  const deferred: string[] = [];
  scope.__labDefer = (name: string): void => {
    deferred.push(name);
  };
  document.addEventListener('DOMContentLoaded', () => deferred.forEach((name) => scope.__labRun(name)));

  // The preview never leaves the sandbox: links and forms stay on the page.
  document.addEventListener('click', (event: any) => {
    const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (link && !event.defaultPrevented && link.getAttribute('href').charAt(0) !== '#') {
      event.preventDefault();
      post({
        type: 'console',
        level: 'system',
        text: `Enlace a «${link.getAttribute('href')}»: en la vista previa no se sale de la página.`,
      });
    }
  });
  document.addEventListener('submit', (event: any) => {
    if (!event.defaultPrevented) {
      event.preventDefault();
      post({
        type: 'console',
        level: 'system',
        text: 'El formulario se ha enviado. En la vista previa no se recarga la página; usa event.preventDefault() para controlarlo tú.',
      });
    }
  });
  scope.addEventListener('load', () => scope.setTimeout(finish, 0));
}

export interface HostConfig {
  token: string;
  /** `labRuntime` as text. */
  runtimeSource: string;
  units: { name: string; code: string }[];
  tests: RuntimeTest[];
  loopLimitMs: number;
  /** After this the worker is killed whatever it is doing. */
  timeLimitMs: number;
}

/**
 * Runs a project that has no page: starts a worker inside the sandboxed iframe,
 * relays what it says to the lab and kills it when it takes too long.
 */
export function labHost(config: HostConfig): void {
  const scope: any = globalThis;
  const blob = (code: string): string =>
    scope.URL.createObjectURL(new scope.Blob([code], { type: 'text/javascript' }));
  const runtimeConfig = {
    token: config.token,
    mode: 'worker',
    units: config.units.map((unit) => ({ name: unit.name, source: blob(unit.code) })),
    tests: config.tests,
    loopLimitMs: config.loopLimitMs,
  };
  const worker = new scope.Worker(blob(`(${config.runtimeSource})(${JSON.stringify(runtimeConfig)});`));
  let finished = false;
  worker.onmessage = (event: any): void => {
    if (event.data && event.data.type === 'done') {
      finished = true;
    }
    scope.parent.postMessage(event.data, '*');
  };
  worker.onerror = (event: any): void => {
    event.preventDefault();
    scope.parent.postMessage(
      { lab: config.token, type: 'error', message: String(event.message), unit: '', line: 0, column: 0 },
      '*',
    );
  };
  scope.setTimeout(() => {
    worker.terminate();
    if (!finished) {
      scope.parent.postMessage({ lab: config.token, type: 'timeout' }, '*');
    }
  }, config.timeLimitMs);
}
