import { RuntimeExecutionResult } from '../types/runtime';
import { WorkspaceFile, WorkspaceSnapshot } from '../types/scrim';

export type LogicWorkerMessage =
  | { type: 'console'; level: 'log' | 'info' | 'warn' | 'error'; args: string[]; line?: number }
  | { type: 'error'; message: string; stack?: string; line?: number; column?: number }
  | { type: 'complete' };

function isLogicFile(file: WorkspaceFile): boolean {
  return file.language === 'javascript'
    || file.language === 'typescript'
    || /\.(?:js|jsx|ts|tsx)$/i.test(file.name);
}

export function collectLogicSource(workspace: WorkspaceSnapshot): string {
  const files = Object.values(workspace.files).filter(isLogicFile);
  return files
    .map((file) => file.content)
    .join('\n\n');
}

export function buildLogicWorkerSource(userSource: string): string {
  return `
const __userSource = ${JSON.stringify(userSource)};
const __serialize = (value) => {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "function") return "[Función " + (value.name || "anónima") + "]";
  if (typeof value === "object" && value !== null) {
    try { return JSON.stringify(value); } catch (_error) { return String(value); }
  }
  return String(value);
};
const __location = (stack) => {
  const sourceMatch = String(stack || "").match(/aula-logica\\.js:(\\d+):(\\d+)/);
  if (sourceMatch) {
    return { line: Math.max(1, Number(sourceMatch[1]) - 2), column: Number(sourceMatch[2]) };
  }
  const matches = Array.from(String(stack || "").matchAll(/<anonymous>:(\\d+):(\\d+)/g));
  const match = matches[matches.length - 1];
  if (!match) return {};
  return { line: Math.max(1, Number(match[1]) - 2), column: Number(match[2]) };
};
const __console = {};
["log", "info", "warn", "error"].forEach((level) => {
  __console[level] = (...args) => {
    const location = __location(new Error().stack);
    self.postMessage({ type: "console", level, args: args.map(__serialize), ...location });
  };
});
try {
  const __run = new Function("console", __userSource + "\\n//# sourceURL=aula-logica.js");
  __run(__console);
  self.postMessage({ type: "complete" });
} catch (error) {
  const location = __location(error && error.stack);
  self.postMessage({
    type: "error",
    message: error && error.message ? error.message : String(error),
    stack: error && error.stack ? String(error.stack) : undefined,
    ...location,
  });
}
`;
}

export interface LogicExecutionOptions {
  timeoutMs?: number;
}

export function executeLogicWorkspace(
  workspace: WorkspaceSnapshot,
  options: LogicExecutionOptions = {},
): Promise<RuntimeExecutionResult> {
  const startedAt = performance.now();
  const timeoutMs = options.timeoutMs ?? 1_500;
  const source = collectLogicSource(workspace);

  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return Promise.resolve({
      success: false,
      error: { message: 'Este navegador no permite iniciar el entorno aislado de JavaScript.' },
      consoleLogs: [],
      executionTimeMs: Math.max(0, performance.now() - startedAt),
    });
  }

  return new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(new Blob([buildLogicWorkerSource(source)], { type: 'text/javascript' }));
    const worker = new Worker(blobUrl);
    const consoleLogs: RuntimeExecutionResult['consoleLogs'] = [];
    let settled = false;

    const finish = (result: Omit<RuntimeExecutionResult, 'executionTimeMs' | 'consoleLogs'>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve({
        ...result,
        consoleLogs,
        executionTimeMs: Math.max(0, performance.now() - startedAt),
      });
    };

    const timeoutId = window.setTimeout(() => {
      finish({
        success: false,
        error: { message: `La ejecución superó ${timeoutMs} ms. Revisa si hay un bucle que nunca termina.` },
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<LogicWorkerMessage>) => {
      const message = event.data;
      if (message.type === 'console') {
        consoleLogs.push({
          id: `logic-${consoleLogs.length + 1}`,
          type: message.level,
          args: message.args,
          timestamp: Date.now(),
          sourceLine: message.line,
        });
      } else if (message.type === 'error') {
        finish({
          success: false,
          error: {
            message: message.message,
            stack: message.stack,
            line: message.line,
            column: message.column,
          },
        });
      } else if (message.type === 'complete') {
        finish({ success: true });
      }
    };

    worker.onerror = (event) => {
      finish({ success: false, error: { message: event.message || 'La ejecución de JavaScript falló.' } });
    };
  });
}
