import type { PythonRuntimeError } from './pythonWorkerProtocol';

const EXEC_LINE = /File "<exec>", line (\d+)/g;

export function normalizePythonError(error: unknown): PythonRuntimeError {
  const stack = error instanceof Error ? error.stack : undefined;
  const raw = error instanceof Error ? error.message : String(error);
  const matches = [...raw.matchAll(EXEC_LINE)];
  const lastLine = matches.at(-1)?.[1];
  const message = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? raw;

  return {
    message,
    ...(stack ? { stack } : {}),
    ...(lastLine ? { line: Number(lastLine), column: 1 } : {}),
  };
}
