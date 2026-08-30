export type IsolatedFunctionRequest =
  | { mode: 'single'; args: unknown[]; referenceArgIndex?: number }
  | { mode: 'sequence'; calls: unknown[][] }
  | { mode: 'returned-sequence'; args: unknown[]; counts: number[] };

export type IsolatedFunctionOutcome =
  | { kind: 'missing' }
  | { kind: 'setup-error'; message: string }
  | { kind: 'thrown'; message: string }
  | { kind: 'single'; value: unknown; argsAfter: unknown[]; sameReference: boolean }
  | { kind: 'sequence'; values: unknown[] }
  | { kind: 'returned-sequence'; values: unknown[][] }
  | { kind: 'returned-not-function'; value: unknown };

export type IsolatedConsoleOutcome =
  | { kind: 'console'; output: string[] }
  | { kind: 'setup-error'; message: string; output: string[] };

const LOCK_DOWN_WORKER_GLOBALS = `
const __blocked = () => { throw new Error('El entorno de comprobación no permite acceso a la red ni a procesos externos.'); };
for (const __name of ['fetch', 'WebSocket', 'EventSource', 'XMLHttpRequest', 'Worker', 'SharedWorker', 'BroadcastChannel', 'importScripts']) {
  try { self[__name] = __blocked; } catch (_error) {}
  try { Object.defineProperty(self, __name, { configurable: false, writable: false, value: __blocked }); } catch (_error) {}
}
for (const __name of ['indexedDB', 'caches']) {
  try { Object.defineProperty(self, __name, { configurable: false, get: __blocked }); } catch (_error) {}
}
`;

const EVALUATION_STUBS = `
const __createElement = () => {
  const children = [];
  const classes = new Set();
  const element = {
    textContent: '', innerText: '', innerHTML: '', value: '', className: '', style: {}, dataset: {}, children,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle: (name) => classes.has(name) ? (classes.delete(name), false) : (classes.add(name), true),
    },
    addEventListener() {}, removeEventListener() {},
    appendChild(child) { children.push(child); return child; },
    removeChild(child) { const index = children.indexOf(child); if (index >= 0) children.splice(index, 1); return child; },
    setAttribute(name, value) { element[name] = String(value); },
    getAttribute(name) { return element[name] ?? null; },
  };
  return element;
};
const __elements = {};
const __document = {
  body: __createElement(), head: __createElement(),
  getElementById(id) { return __elements[id] ?? (__elements[id] = __createElement()); },
  querySelector(selector) { const match = String(selector).match(/#([\\w-]+)/); return match ? this.getElementById(match[1]) : __createElement(); },
  querySelectorAll() { return []; }, createElement() { return __createElement(); },
  addEventListener() {}, removeEventListener() {},
};
const __window = Object.freeze({ document: __document });
const __clone = (value) => typeof structuredClone === 'function' ? structuredClone(value) : value;
`;

function serializeTrustedValue(value: unknown): string {
  if (typeof value === 'function') return `(${value.toString()})`;
  if (value === undefined) return 'undefined';
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(serializeTrustedValue).join(',')}]`;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}:${serializeTrustedValue(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function functionWorkerSource(source: string, targetFunction: string, request: IsolatedFunctionRequest): string {
  return `${LOCK_DOWN_WORKER_GLOBALS}${EVALUATION_STUBS}
const __source = ${JSON.stringify(source)};
const __targetName = ${JSON.stringify(targetFunction)};
const __request = ${serializeTrustedValue(request)};
void (async () => {
  let __target;
  try {
    const __factory = new Function('document', 'window', __source + '\\n; return typeof ' + __targetName + ' === "function" ? ' + __targetName + ' : null;');
    __target = __factory(__document, __window);
  } catch (error) {
    self.postMessage({ kind: 'setup-error', message: error?.message || String(error) });
    return;
  }
  if (typeof __target !== 'function') { self.postMessage({ kind: 'missing' }); return; }
  try {
    if (__request.mode === 'sequence') {
      const values = [];
      for (const args of __request.calls) values.push(await __target(...__clone(args)));
      self.postMessage({ kind: 'sequence', values });
      return;
    }
    if (__request.mode === 'returned-sequence') {
      const values = [];
      for (const count of __request.counts) {
        const returned = __target(...__clone(__request.args));
        if (typeof returned !== 'function') { self.postMessage({ kind: 'returned-not-function', value: returned }); return; }
        const row = [];
        for (let index = 0; index < count; index++) row.push(await returned());
        values.push(row);
      }
      self.postMessage({ kind: 'returned-sequence', values });
      return;
    }
    const args = __clone(__request.args);
    const value = await __target(...args);
    const sameReference = Number.isInteger(__request.referenceArgIndex)
      ? value === args[__request.referenceArgIndex]
      : false;
    self.postMessage({ kind: 'single', value, argsAfter: args, sameReference });
  } catch (error) {
    self.postMessage({ kind: 'thrown', message: error?.message || String(error) });
  }
})();`;
}

function consoleWorkerSource(source: string): string {
  return `${LOCK_DOWN_WORKER_GLOBALS}${EVALUATION_STUBS}
const __source = ${JSON.stringify(source)};
const __output = [];
const __format = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'undefined') return 'undefined';
  try { return JSON.stringify(value); } catch (_error) { return String(value); }
};
const __console = {};
for (const level of ['log', 'warn', 'error']) __console[level] = (...values) => __output.push(values.map(__format).join(' '));
try {
  new Function('document', 'window', 'console', __source)(__document, __window, __console);
  self.postMessage({ kind: 'console', output: __output });
} catch (error) {
  self.postMessage({ kind: 'setup-error', message: error?.message || String(error), output: __output });
}`;
}

function runWorker<T>(source: string, timeoutMs = 1_500): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(url);
      callback();
    };
    const timeoutId = window.setTimeout(() => finish(() => reject(new Error('La comprobación superó el tiempo permitido. Revisa si hay un bucle infinito.'))), timeoutMs);
    worker.onmessage = (event: MessageEvent<T>) => finish(() => resolve(event.data));
    worker.onerror = (event) => finish(() => reject(new Error(event.message || 'El entorno aislado no pudo evaluar el código.')));
  });
}

function legacyFunctionEvaluation(source: string, targetFunction: string, request: IsolatedFunctionRequest): Promise<IsolatedFunctionOutcome> {
  return (async () => {
    const createElement = () => {
      const children: any[] = [];
      const classes = new Set<string>();
      const element: any = {
        textContent: '', innerText: '', innerHTML: '', value: '', className: '', style: {}, dataset: {}, children,
        classList: { add: (...names: string[]) => names.forEach((name) => classes.add(name)), remove: (...names: string[]) => names.forEach((name) => classes.delete(name)), contains: (name: string) => classes.has(name), toggle: (name: string) => classes.has(name) ? (classes.delete(name), false) : (classes.add(name), true) },
        addEventListener() {}, removeEventListener() {}, appendChild(child: any) { children.push(child); return child; },
        removeChild(child: any) { const index = children.indexOf(child); if (index >= 0) children.splice(index, 1); return child; },
        setAttribute(name: string, value: unknown) { element[name] = String(value); }, getAttribute(name: string) { return element[name] ?? null; },
      };
      return element;
    };
    const elements: Record<string, any> = {};
    const documentStub: any = {
      body: createElement(), head: createElement(),
      getElementById(id: string) { return elements[id] ?? (elements[id] = createElement()); },
      querySelector(selector: string) { const match = selector.match(/#([\w-]+)/); return match ? this.getElementById(match[1]) : createElement(); },
      querySelectorAll: () => [], createElement, addEventListener() {}, removeEventListener() {},
    };
    const clone = (value: any): any => {
      if (typeof value === 'function' || value === null || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map(clone);
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
    };
    let target: any;
    try {
      target = new Function('document', 'window', `${source}\n; return typeof ${targetFunction} === "function" ? ${targetFunction} : null;`)(documentStub, { document: documentStub });
    } catch (error) {
      return { kind: 'setup-error', message: error instanceof Error ? error.message : String(error) };
    }
    if (typeof target !== 'function') return { kind: 'missing' };
    try {
      if (request.mode === 'sequence') {
        const values: unknown[] = [];
        for (const args of request.calls) values.push(await target(...clone(args)));
        return { kind: 'sequence', values };
      }
      if (request.mode === 'returned-sequence') {
        const values: unknown[][] = [];
        for (const count of request.counts) {
          const returned = target(...clone(request.args));
          if (typeof returned !== 'function') return { kind: 'returned-not-function', value: returned };
          const row: unknown[] = [];
          for (let index = 0; index < count; index++) row.push(await returned());
          values.push(row);
        }
        return { kind: 'returned-sequence', values };
      }
      const args = clone(request.args);
      const value = await target(...args);
      return { kind: 'single', value, argsAfter: args, sameReference: request.referenceArgIndex !== undefined && value === args[request.referenceArgIndex] };
    } catch (error) {
      return { kind: 'thrown', message: error instanceof Error ? error.message : String(error) };
    }
  })();
}

export function evaluateFunctionIsolated(source: string, targetFunction: string, request: IsolatedFunctionRequest): Promise<IsolatedFunctionOutcome> {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') {
    // happy-dom no ejecuta Workers. Esta ruta existe solo para las pruebas de Node;
    // los builds de navegador siempre usan el Worker aislado anterior.
    return legacyFunctionEvaluation(source, targetFunction, request);
  }
  return runWorker<IsolatedFunctionOutcome>(functionWorkerSource(source, targetFunction, request));
}

export function evaluateConsoleIsolated(source: string): Promise<IsolatedConsoleOutcome> {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') {
    const output: string[] = [];
    const format = (value: unknown) => typeof value === 'string' ? value : value === undefined ? 'undefined' : JSON.stringify(value);
    const consoleStub = { log: (...values: unknown[]) => output.push(values.map(format).join(' ')), warn: (...values: unknown[]) => output.push(values.map(format).join(' ')), error: (...values: unknown[]) => output.push(values.map(format).join(' ')) };
    try {
      new Function('document', 'window', 'console', source)({}, { document: {} }, consoleStub);
      return Promise.resolve({ kind: 'console', output });
    } catch (error) {
      return Promise.resolve({ kind: 'setup-error', message: error instanceof Error ? error.message : String(error), output });
    }
  }
  return runWorker<IsolatedConsoleOutcome>(consoleWorkerSource(source));
}

export const isolatedEvaluatorWorkerPolicy = LOCK_DOWN_WORKER_GLOBALS;
