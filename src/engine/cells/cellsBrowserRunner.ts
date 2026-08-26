import type { CellsTestResult } from './cellsWorkerProtocol';
import type { IstanbulCoverageMap } from './cellsCoverage';

export interface CellsBrowserTestPayload {
  results: CellsTestResult[];
  invokedMethods: string[];
  coverage?: IstanbulCoverageMap;
}

function isPayload(value: unknown): value is CellsBrowserTestPayload & { source: string; type: string; testRunId: string } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CellsBrowserTestPayload> & { source?: string; type?: string; testRunId?: string };
  return candidate.source === 'open-cells-tests'
    && candidate.type === 'complete'
    && typeof candidate.testRunId === 'string'
    && Array.isArray(candidate.results)
    && Array.isArray(candidate.invokedMethods)
    && (candidate.coverage === undefined || (candidate.coverage !== null && typeof candidate.coverage === 'object'));
}

export function waitForCellsBrowserTests(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>,
  expectedRunId: string,
  expectedSource: () => MessageEventSource | null,
  timeoutMs = 8_000,
  signal?: AbortSignal,
): Promise<CellsBrowserTestPayload> {
  return new Promise((resolve, reject) => {
    const finish = (callback: () => void) => {
      clearTimeout(timeout);
      target.removeEventListener('message', onMessage as EventListener);
      signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onMessage = (event: Event) => {
      const message = event as MessageEvent;
      if (!isPayload(message.data)) return;
      if (message.data.testRunId !== expectedRunId || message.source !== expectedSource()) return;
      finish(() => resolve({
        results: message.data.results,
        invokedMethods: message.data.invokedMethods,
        coverage: message.data.coverage,
      }));
    };
    const onAbort = () => finish(() => reject(new Error('La ejecución de pruebas Cells fue cancelada.')));
    const timeout = setTimeout(() => finish(() => reject(new Error('Las pruebas del iframe superaron el tiempo permitido.'))), timeoutMs);
    target.addEventListener('message', onMessage as EventListener);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}
