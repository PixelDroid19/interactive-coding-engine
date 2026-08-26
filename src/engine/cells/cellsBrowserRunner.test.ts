// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { waitForCellsBrowserTests } from './cellsBrowserRunner';

describe('waitForCellsBrowserTests', () => {
  it('recibe únicamente el resultado tipado del iframe Cells', async () => {
    const source = window;
    const pending = waitForCellsBrowserTests(window, 'run-1', () => source, 100);
    window.dispatchEvent(new MessageEvent('message', { data: { source: 'otra-vista', type: 'complete' } }));
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        source: 'open-cells-tests',
        type: 'complete',
        testRunId: 'run-1',
        results: [{ id: 'render', title: 'Render', passed: true, message: 'ok' }],
        invokedMethods: ['render'],
      },
      source,
    }));

    await expect(pending).resolves.toMatchObject({ invokedMethods: ['render'] });
  });

  it('convierte un iframe bloqueado en un timeout diagnosticable', async () => {
    await expect(waitForCellsBrowserTests(window, 'run-timeout', () => window, 5)).rejects.toThrow(/tiempo/i);
  });
});
