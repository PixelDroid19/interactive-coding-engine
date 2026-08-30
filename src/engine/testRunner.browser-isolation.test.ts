// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { Window } from 'happy-dom';
import { runChallengeValidation } from './testRunner';
import { file, workspaceOf } from './lessonCompiler';

const previousWorker = globalThis.Worker;

afterEach(() => {
  Object.defineProperty(globalThis, 'Worker', { configurable: true, value: previousWorker });
});

describe('comprobación DOM aislada', () => {
  it('consulta el resultado mediante el canal del iframe', async () => {
    Object.defineProperty(globalThis, 'Worker', { configurable: true, value: class BrowserWorker {} });
    const hostWindow = new Window();
    const frameWindow = {
      postMessage(message: { validationId: string }) {
        queueMicrotask(() => hostWindow.dispatchEvent(new hostWindow.MessageEvent('message', {
          source: frameWindow as any,
          data: { source: 'aula-validator', type: 'result', validationId: message.validationId, result: { passed: true, receivedValue: 'Listo', expectedValue: 'Listo' } },
        })));
      },
    };
    const iframe = { contentWindow: frameWindow, ownerDocument: { defaultView: hostWindow } } as unknown as HTMLIFrameElement;
    const workspace = workspaceOf('app.js', {
      'index.html': file('index.html', '<div id="estado">Pendiente</div>'),
      'app.js': file('app.js', 'document.getElementById("estado").innerText = "Listo";'),
    });
    const challenge = {
      id: 'dom-aislado', title: 'DOM aislado', timestamp: 0, instructions: '', hints: [],
      tests: [{ id: 'estado', description: 'Actualiza el estado', validatorType: 'dom-check' as const, domSelector: '#estado', domProperty: 'innerText' as const, expectedValue: 'Listo' }],
    };

    const result = await runChallengeValidation(challenge, workspace, iframe);

    expect(result.allPassed, JSON.stringify(result)).toBe(true);
    expect(result.tests[0]).toMatchObject({ status: 'passed', receivedValue: 'Listo' });
  });
});
