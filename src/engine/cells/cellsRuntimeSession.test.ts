import { describe, expect, it } from 'vitest';
import { CellsRuntimeSession } from './cellsRuntimeSession';
import type { CellsWorkerRequest } from './cellsWorkerProtocol';

function request<T extends CellsWorkerRequest['type']>(
  type: T,
  payload: Extract<CellsWorkerRequest, { type: T }>['payload'],
  generation: number,
): Extract<CellsWorkerRequest, { type: T }> {
  return { type, payload, generation, requestId: `req-${type}-${generation}`, sessionId: 'session-1' } as Extract<CellsWorkerRequest, { type: T }>;
}

describe('CellsRuntimeSession', () => {
  it('recorre crear, previsualizar, probar y exportar sin procesos falsos', async () => {
    const session = new CellsRuntimeSession('session-1');
    const created = await session.handle(request('project:create', { scaffold: { name: 'academy-learning-card' } }, 0));
    expect(created.type).toBe('workspace:updated');

    const preview = await session.handle(request('preview:build', {}, 0));
    expect(preview).toMatchObject({ type: 'preview:built', payload: { warnings: [] } });
    if (preview.type === 'preview:built') expect(preview.payload.html).toContain('<academy-learning-card');

    const testPreview = await session.handle(request('preview:build', { runContractTests: true, testRunId: 'run-1' }, 0));
    expect(testPreview.type).toBe('preview:built');
    if (testPreview.type === 'preview:built') expect(testPreview.payload.html).toContain("source: 'open-cells-tests'");

    const tested = await session.handle(request('tests:run', { coverage: true }, 0));
    expect(tested.type).toBe('tests:completed');
    if (tested.type === 'tests:completed') {
      expect(tested.payload.results.every((result) => result.passed)).toBe(true);
      expect(tested.payload.coverage?.behaviors.percentage).toBe(100);
    }

    const exported = await session.handle(request('project:export', {}, 0));
    expect(exported.type).toBe('project:exported');
    if (exported.type === 'project:exported') {
      expect(Array.from(exported.payload.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
      expect(exported.payload.fileName).toBe('academy-learning-card.zip');
    }
  });

  it('rechaza una operación sobre una generación vieja', async () => {
    const session = new CellsRuntimeSession('session-1');
    await session.handle(request('project:create', { scaffold: { name: 'academy-learning-card' } }, 0));
    const result = await session.handle(request('file:write', { path: 'README.md', content: '# Cambio' }, 0));
    expect(result).toMatchObject({ type: 'runtime:error', payload: { error: { code: 'INVALID_WORKSPACE' } } });
  });
});
