import { describe, expect, it, vi } from 'vitest';
import { CellsRuntimeClient, CellsRuntimeClientError, type CellsWorkerLike } from './cellsRuntimeClient';
import type { CellsWorkerRequest, CellsWorkerResponse } from './cellsWorkerProtocol';

class FakeWorker implements CellsWorkerLike {
  messages: CellsWorkerRequest[] = [];
  listeners = new Set<(event: MessageEvent<CellsWorkerResponse>) => void>();
  terminate = vi.fn();

  postMessage(message: CellsWorkerRequest) { this.messages.push(message); }
  addEventListener(_type: 'message', listener: (event: MessageEvent<CellsWorkerResponse>) => void) { this.listeners.add(listener); }
  removeEventListener(_type: 'message', listener: (event: MessageEvent<CellsWorkerResponse>) => void) { this.listeners.delete(listener); }
  emit(response: CellsWorkerResponse) { this.listeners.forEach((listener) => listener({ data: response } as MessageEvent<CellsWorkerResponse>)); }
}

function response<T extends CellsWorkerResponse>(value: T): T { return value; }

describe('CellsRuntimeClient', () => {
  it('crea el Worker de forma diferida y envía identidad y generación', async () => {
    const worker = new FakeWorker();
    const factory = vi.fn(() => worker);
    const client = new CellsRuntimeClient(factory, 'sesion-1');
    expect(factory).not.toHaveBeenCalled();

    const pending = client.createProject({ name: 'academy-learning-card' }, 3);
    expect(factory).toHaveBeenCalledOnce();
    const sent = worker.messages[0];
    expect(sent).toMatchObject({ type: 'project:create', sessionId: 'sesion-1', generation: 3 });
    worker.emit(response({
      type: 'workspace:updated', requestId: sent.requestId, sessionId: 'sesion-1', generation: 3,
      payload: { workspace: { files: {}, activeFilePath: '' } },
    }));
    await expect(pending).resolves.toMatchObject({ type: 'workspace:updated' });
  });

  it('ignora una respuesta de una generación anterior', async () => {
    const worker = new FakeWorker();
    const client = new CellsRuntimeClient(() => worker, 'sesion-2');
    const pending = client.buildPreview(8);
    const sent = worker.messages[0];
    worker.emit(response({
      type: 'preview:built', requestId: sent.requestId, sessionId: 'sesion-2', generation: 7,
      payload: { html: '<p>viejo</p>', warnings: [] },
    }));
    let settled = false;
    void pending.finally(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    worker.emit(response({
      type: 'preview:built', requestId: sent.requestId, sessionId: 'sesion-2', generation: 8,
      payload: { html: '<p>actual</p>', warnings: [] },
    }));
    await expect(pending).resolves.toMatchObject({ payload: { html: '<p>actual</p>' } });
  });

  it('acepta que un comando generador entregue una generación posterior', async () => {
    const worker = new FakeWorker();
    const client = new CellsRuntimeClient(() => worker, 'sesion-generador');
    const pending = client.runCommand('cells component:locales', 4);
    const sent = worker.messages[0];
    let settled = false;
    void pending.then(() => { settled = true; });

    worker.emit(response({
      type: 'locales:generated', requestId: sent.requestId, sessionId: 'sesion-generador', generation: 5,
      payload: { workspace: { files: {}, activeFilePath: '' }, keys: ['learningCard.title'] },
    }));
    await Promise.resolve();

    expect(settled).toBe(true);
    await expect(pending).resolves.toMatchObject({ type: 'locales:generated', generation: 5 });
  });

  it('cancela una petición sin fingir que finalizó', async () => {
    const worker = new FakeWorker();
    const client = new CellsRuntimeClient(() => worker, 'sesion-3');
    const pending = client.runTests(2, true);
    const target = worker.messages[0];
    client.cancel(target.requestId, 2);
    expect(worker.messages[1]).toMatchObject({
      type: 'request:cancel', payload: { targetRequestId: target.requestId }, generation: 2,
    });
    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
  });

  it('propaga errores normalizados del Worker', async () => {
    const worker = new FakeWorker();
    const client = new CellsRuntimeClient(() => worker, 'sesion-4');
    const pending = client.buildPreview(1);
    const sent = worker.messages[0];
    worker.emit(response({
      type: 'runtime:error', requestId: sent.requestId, sessionId: 'sesion-4', generation: 1,
      payload: { error: { code: 'COMMAND_FAILED', message: 'Falta render()', filePath: 'src/card.js', line: 12 } },
    }));
    await expect(pending).rejects.toEqual(expect.objectContaining({
      code: 'COMMAND_FAILED', filePath: 'src/card.js', line: 12,
    }));
  });

  it('al cerrar rechaza pendientes, retira el listener y termina el Worker', async () => {
    const worker = new FakeWorker();
    const client = new CellsRuntimeClient(() => worker, 'sesion-5');
    const pending = client.buildPreview(1);
    expect(worker.listeners.size).toBe(1);
    client.dispose();
    await expect(pending).rejects.toBeInstanceOf(CellsRuntimeClientError);
    expect(worker.listeners.size).toBe(0);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
