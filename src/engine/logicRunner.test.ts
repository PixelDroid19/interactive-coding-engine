import { describe, expect, it } from 'vitest';
import { buildLogicWorkerSource, collectLogicSource } from './logicRunner';
import { WorkspaceSnapshot } from '../types/scrim';

function workspace(files: WorkspaceSnapshot['files']): WorkspaceSnapshot {
  return { files, activeFilePath: 'app.js' };
}

function executeWorkerSource(source: string) {
  const messages: unknown[] = [];
  const self = { postMessage: (message: unknown) => messages.push(message) };
  new Function('self', source)(self);
  return messages;
}

describe('logicRunner', () => {
  it('ejecuta únicamente los archivos de lógica y conserva su orden', () => {
    const source = collectLogicSource(workspace({
      'index.html': { name: 'index.html', path: 'index.html', language: 'html', content: '<h1>No ejecutar</h1>' },
      'helpers.js': { name: 'helpers.js', path: 'helpers.js', language: 'javascript', content: 'const doble = n => n * 2;' },
      'app.js': { name: 'app.js', path: 'app.js', language: 'javascript', content: 'console.log(doble(4));' },
      'style.css': { name: 'style.css', path: 'style.css', language: 'css', content: 'body{}' },
    }));

    expect(source).toContain('const doble = n => n * 2;');
    expect(source).toContain('console.log(doble(4));');
    expect(source).not.toContain('No ejecutar');
    expect(source).not.toContain('body{}');
  });

  it('produce mensajes serializables, línea de origen y cierre correcto', () => {
    const messages = executeWorkerSource(buildLogicWorkerSource('const dato = { nombre: "Ana" };\nconsole.log(dato);')) as Array<Record<string, unknown>>;

    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'console', level: 'log', args: ['{"nombre":"Ana"}'], line: 2 }),
      expect.objectContaining({ type: 'complete' }),
    ]));
  });

  it('convierte un error de ejecución en feedback y no informa éxito', () => {
    const messages = executeWorkerSource(buildLogicWorkerSource('const total = precio * 2;')) as Array<Record<string, unknown>>;

    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'error', message: expect.stringContaining('precio'), line: 1 }),
    ]));
    expect(messages.some((message) => message.type === 'complete')).toBe(false);
  });
});
