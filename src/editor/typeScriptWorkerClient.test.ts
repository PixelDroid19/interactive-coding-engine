import { describe, expect, it } from 'vitest';
import { TypeScriptWorkerClient, type LanguageWorkerLike } from './typeScriptWorkerClient';

class FakeWorker implements LanguageWorkerLike {
  readonly messages: unknown[] = [];
  terminated = false;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void {
    if (type === 'message') this.messageListener = listener;
  }

  removeEventListener(): void {
    this.messageListener = null;
  }

  postMessage(message: { id?: number; type: string }): void {
    this.messages.push(message);
    if (message.id == null) return;
    queueMicrotask(() => {
      this.messageListener?.({
        data: { id: message.id, ok: true, result: [{ label: 'doble', insertText: 'doble', kind: 'function' }] },
      } as MessageEvent);
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe('TypeScriptWorkerClient', () => {
  it('no crea el Web Worker hasta que el editor necesita inteligencia semántica', () => {
    let creations = 0;
    const client = new TypeScriptWorkerClient(() => {
      creations += 1;
      return new FakeWorker();
    });

    expect(creations).toBe(0);
    client.dispose();
    expect(creations).toBe(0);
  });

  it('sincroniza solo archivos JavaScript y TypeScript y responde solicitudes', async () => {
    const worker = new FakeWorker();
    const client = new TypeScriptWorkerClient(() => worker);
    client.replaceWorkspace([
      { path: 'app.js', content: 'do', language: 'javascript' },
      { path: 'helpers.ts', content: 'export const doble = (n: number) => n * 2;', language: 'typescript' },
      { path: 'index.html', content: '<h1>Hola</h1>', language: 'html' },
      { path: 'style.css', content: 'body {}', language: 'css' },
    ]);

    const completions = await client.completions('app.js', 2);
    const workspaceMessage = worker.messages[0] as { type: string; files: Array<{ path: string }> };

    expect(workspaceMessage.type).toBe('workspace/replace');
    expect(workspaceMessage.files.map((file) => file.path)).toEqual(['app.js', 'helpers.ts']);
    expect(completions).toEqual([expect.objectContaining({ label: 'doble', insertText: 'doble' })]);
  });

  it('traduce los ids del HTML a tipos DOM sin enviar HTML como JavaScript', () => {
    const worker = new FakeWorker();
    const client = new TypeScriptWorkerClient(() => worker);

    client.replaceWorkspace([
      { path: 'app.js', content: 'document.getElementById("nombre").value;', language: 'javascript' },
      { path: 'index.html', content: '<label for="nombre">Nombre</label><input id="nombre">', language: 'html' },
    ]);

    const message = worker.messages[0] as { files: Array<{ path: string; content: string }> };
    expect(message.files.map((file) => file.path)).toEqual(['app.js', '/__aula_dom__.d.ts']);
    expect(message.files[1]?.content).toContain('elementId: "nombre"');
    expect(message.files[1]?.content).toContain('HTMLInputElement');
    expect(message.files.some((file) => file.path.endsWith('.html'))).toBe(false);
  });

  it('termina el worker y rechaza respuestas pendientes al desmontar el editor', async () => {
    const worker = new FakeWorker();
    const client = new TypeScriptWorkerClient(() => worker);
    client.replaceWorkspace([{ path: 'app.js', content: '', language: 'javascript' }]);
    client.dispose();

    expect(worker.terminated).toBe(true);
    await expect(client.diagnostics('app.js')).rejects.toThrow('cerrado');
  });
});
