import { describe, it, expect } from 'vitest';
import { runChallengeValidation } from './testRunner';
import { ScrimChallenge, WorkspaceSnapshot } from '../types/scrim';
import { file, workspaceOf } from './lessonCompiler';
import { Window } from 'happy-dom';
import { LESSON1_HTML } from '../curriculum/fundamentos/workspaces';
import { LESSON_01 } from '../curriculum/fundamentos/lesson01';

function wsFromJs(js: string): WorkspaceSnapshot {
  return workspaceOf('app.js', {
    'index.html': file('index.html', LESSON1_HTML),
    'style.css': file('style.css', '*{}'),
    'app.js': file('app.js', js),
  });
}

// El reto real de la lección 01 reescrita: dos instrucciones de consola.
const retoLeccion1: ScrimChallenge = LESSON_01.challenges[0];

describe('testRunner reto lección 01 (sintaxis mínima)', () => {
  it('el starter vacío falla', async () => {
    const ws = wsFromJs(`// notas\n`);
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(false);
    expect(result.passedCount).toBe(0);
    expect(result.tests.filter((t) => t.isEvaluationError).length).toBe(0);
  });

  it('una solución del alumno pasa todas las comprobaciones de comportamiento', async () => {
    const ws = wsFromJs(
      `console.log("Me llamo Damien");
console.log("Estoy aprendiendo JavaScript");`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(true);
    expect(result.passedCount).toBe(result.totalCount);
  });

  it('una segunda solución razonable también pasa', async () => {
    const ws = wsFromJs(
      `console.log('Me llamo María');
console.log('Estoy aprendiendo JavaScript');`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(true);
  });

  it('escribir un solo mensaje falla', async () => {
    const ws = wsFromJs(
      `console.log("Me llamo Damien");`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(false);
    const segundo = result.tests.find(t => t.id === 'aprendiendo-console');
    expect(segundo?.passed).toBe(false);
    expect(result.tests.filter((t) => t.isEvaluationError).length).toBe(0);
  });

  it('un texto suelto sin console.log no cuenta como instrucción', async () => {
    const ws = wsFromJs(
      `"Me llamo Damien";
"Estoy aprendiendo JavaScript";`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(false);
  });

  it('los dos mensajes en orden inverso no completan el reto', async () => {
    const ws = wsFromJs(
      `console.log("Estoy aprendiendo JavaScript");
console.log("Me llamo Damien");`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    const order = result.tests.find(t => t.id === 'mensajes-en-orden');
    expect(order?.passed).toBe(false);
    expect(result.allPassed).toBe(false);
  });
});

describe('testRunner hardening', () => {
  it('trata una función aún no escrita como reto pendiente, no como error interno', async () => {
    const ws = wsFromJs('// El alumno todavía no empezó la función.');
    const reto: ScrimChallenge = {
      id: 'funcion-pendiente',
      title: 'Función pendiente',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'falta-suma',
        description: 'suma(2, 3) devuelve 5',
        validatorType: 'function-call' as const,
        targetFunction: 'suma',
        args: [2, 3],
        expectedReturn: 5,
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.tests[0].status).toBe('failed');
    expect(result.tests[0].isEvaluationError).not.toBe(true);
    expect(result.feedbackMessage).toContain("No encontramos la función 'suma'");
    expect(result.feedbackMessage).not.toContain('error interno');
  });

  it('tolera la UI ya renderizada al comprobar una función que falta', async () => {
    const ws = wsFromJs(`
      const caja = document.getElementById('lista');
      const fila = document.createElement('div');
      fila.classList.add('activa');
      caja.appendChild(fila);
    `);
    const reto = {
      id: 'funcion-tras-dom',
      title: 'Función tras DOM',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'falta-etiqueta',
        description: 'etiqueta(3) devuelve Fizz',
        validatorType: 'function-call' as const,
        targetFunction: 'etiqueta',
        args: [3],
        expectedReturn: 'Fizz',
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.tests[0].status).toBe('failed');
    expect(result.tests[0].isEvaluationError).not.toBe(true);
    expect(result.feedbackMessage).toContain("No encontramos la función 'etiqueta'");
  });

  it('console-check no aprueba incondicionalmente', async () => {
    const ws = wsFromJs('let x=1');
    const reto = {
      id: 'test',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{ id: 'c', description: 'consola', validatorType: 'console-check' as const }],
      hints: [],
    };
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(false);
    expect(result.tests[0].passed).toBe(false);
    expect(result.tests[0].isEvaluationError).toBe(true);
    expect(result.tests[0].errorMessage).toContain('falta el resultado esperado');
  });

  it('console-check evalúa la salida real y respeta el orden', async () => {
    const ws = wsFromJs('console.log("uno");\nconsole.log("dos");');
    const reto = {
      id: 'test-console',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{ id: 'c', description: 'consola', validatorType: 'console-check' as const, expectedValue: ['uno', 'dos'] }],
      hints: [],
    };

    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(true);

    ws.files['app.js'].content = 'console.log("dos");\nconsole.log("uno");';
    const reversed = await runChallengeValidation(reto as any, ws, null);
    expect(reversed.allPassed).toBe(false);
    expect(reversed.tests[0].receivedValue).toEqual(['dos', 'uno']);
  });

  it('function-call compara retorno y mensaje en español', async () => {
    const ws = wsFromJs('function suma(a,b){return a+b}');
    const reto = {
      id: 'test',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{ id: 't1', description: 'suma', validatorType: 'function-call' as const, targetFunction: 'suma', args: [2,3], expectedReturn: 5 }],
      hints: [],
    };
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(true);
    const reto2 = {
      id: 'test',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{ id: 't1', description: 'suma', validatorType: 'function-call' as const, targetFunction: 'suma', args: [2,3], expectedReturn: 6 }],
      hints: [],
    };
    const result2 = await runChallengeValidation(reto2 as any, ws, null);
    expect(result2.tests[0].passed).toBe(false);
    expect(result2.tests[0].errorMessage).toContain('Esperábamos');
  });

  it('comprueba secuencias e independencia cuando la función devuelve otra función', async () => {
    const reto = {
      id: 'closure',
      title: 'Contadores independientes',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'secuencias',
        description: 'Dos contadores conservan estados separados',
        validatorType: 'function-call' as const,
        targetFunction: 'crearContador',
        args: [],
        returnedFunctionCallCounts: [3, 1],
        expectedReturn: [[1, 2, 3], [1]],
      }],
      hints: [],
    };
    const correct = wsFromJs('function crearContador(){ let n=0; return function(){ n++; return n; }; }');
    const shared = wsFromJs('let n=0; function crearContador(){ return function(){ n++; return n; }; }');

    const correctResult = await runChallengeValidation(reto, correct, null);
    const sharedResult = await runChallengeValidation(reto, shared, null);

    expect(correctResult.allPassed).toBe(true);
    expect(sharedResult.allPassed).toBe(false);
    expect(sharedResult.tests[0].receivedValue).toEqual([[1, 2, 3], [4]]);
  });

  it('dom-check mensajes en español', async () => {
    const ws = wsFromJs('let x=1');
    const reto = {
      id: 'test',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{ id: 'd', description: 'existe', validatorType: 'dom-check' as const, domSelector: '#noexiste', domProperty: 'exists' as const }],
      hints: [],
    };
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.tests[0].errorMessage).toContain('No encontramos');
  });

  it('dom-check respeta expectedContains aunque no haya expectedValue', async () => {
    const ws = wsFromJs(
      `document.getElementById("linea1").textContent = "Y me gusta el helado";
document.getElementById("linea2").textContent = "";`
    );
    const reto = {
      id: 'test',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'd',
        description: 'contenido correcto',
        validatorType: 'dom-check' as const,
        domSelector: '#linea1',
        domProperty: 'innerText' as const,
        expectedContains: ['Ana'],
        matcher: 'contains-all' as const,
        caseInsensitive: true,
        normalizeSpaces: true,
        ignorePunctuation: true,
      }],
      hints: [],
    };
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.tests[0].passed).toBe(false);
    expect(result.passedCount).toBe(0);
  });

  it('dom-check distingue un error de ejecución de una respuesta incorrecta', async () => {
    const ws = wsFromJs('document.getElementById("no-existe").textContent = "Listo";');
    const reto = {
      id: 'dom-runtime-error',
      title: 'Error de ejecución',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'd',
        description: 'actualiza el título',
        validatorType: 'dom-check' as const,
        domSelector: '#titulo',
        domProperty: 'innerText' as const,
        expectedValue: 'Listo',
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.tests[0].status).toBe('evaluation-error');
    expect(result.tests[0].isEvaluationError).toBe(true);
    expect(result.tests[0].errorMessage).toContain('no-existe');
    expect(result.feedbackMessage).toContain('No pudimos evaluar');
  });

  it('función que lanza error produce evaluation-error, no fallo normal', async () => {
    const ws = wsFromJs('function explota(){ throw new Error("boom"); }');
    const reto = {
      id: 'test',
      title: 't',
      timestamp: 0,
      instructions: '',
      tests: [{ id: 'e', description: 'explota', validatorType: 'function-call' as const, targetFunction: 'explota', args: [] }],
      hints: [],
    };
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.tests[0].isEvaluationError).toBe(true);
    expect(result.feedbackMessage).toContain('No pudimos evaluar');
  });
});

describe('testRunner para componentes ejecutados en navegador', () => {
  it('acepta una comprobación asíncrona contra la vista previa real', async () => {
    const previewWindow = new Window();
    const previewDocument = previewWindow.document;
    previewDocument.body.innerHTML = '<estado-curso><span id="estado">listo</span></estado-curso>';
    const iframe = {
      contentDocument: previewDocument,
      contentWindow: previewWindow,
      __generation: 7,
    } as unknown as HTMLIFrameElement;
    const challenge = {
      id: 'componente-real',
      title: 'Componente real',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'estado-visible',
        description: 'El componente muestra su estado',
        validatorType: 'browser-script',
        customValidatorScript: `async ({ document }) => {
          await Promise.resolve();
          return document.querySelector('#estado')?.textContent === 'listo';
        }`,
      }],
      hints: [],
    } as any;

    const result = await runChallengeValidation(challenge, wsFromJs('// componente cargado en iframe'), iframe, 7);

    expect(result.allPassed).toBe(true);
    expect(result.tests[0].status).toBe('passed');
  });

  it('explica que la vista debe estar lista en vez de marcar la solución incorrecta', async () => {
    const challenge = {
      id: 'sin-vista',
      title: 'Sin vista',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'componente',
        description: 'El componente funciona',
        validatorType: 'browser-script',
        customValidatorScript: '() => true',
      }],
      hints: [],
    } as any;

    const result = await runChallengeValidation(challenge, wsFromJs('// todavía no hay vista'), null, 1);

    expect(result.allPassed).toBe(false);
    expect(result.tests[0].status).toBe('evaluation-error');
    expect(result.tests[0].errorMessage).toContain('vista previa');
  });

  it('corta una comprobación que espera para siempre por un elemento no registrado', async () => {
    const previewWindow = new Window();
    const iframe = {
      contentDocument: previewWindow.document,
      contentWindow: previewWindow,
      __generation: 3,
    } as unknown as HTMLIFrameElement;
    const challenge = {
      id: 'registro-ausente', title: 'Registro ausente', timestamp: 0, instructions: '', hints: [],
      tests: [{
        id: 'espera-registro',
        description: 'Registra el elemento',
        validatorType: 'browser-script',
        customValidatorScript: 'async () => new Promise(() => {})',
      }],
    } as any;

    const result = await runChallengeValidation(challenge, wsFromJs('// sin registro'), iframe, 3);

    expect(result.allPassed).toBe(false);
    expect(result.tests[0].status).toBe('evaluation-error');
    expect(result.tests[0].errorMessage).toContain('tiempo');
  });

  it('trata una etiqueta esperada pero aún no registrada como respuesta fallida, no como avería', async () => {
    const previewWindow = new Window();
    const iframe = {
      contentDocument: previewWindow.document,
      contentWindow: previewWindow,
      __generation: 4,
    } as unknown as HTMLIFrameElement;
    const challenge = {
      id: 'registro-por-aprender', title: 'Registra la etiqueta', timestamp: 0, instructions: '', hints: [],
      tests: [{
        id: 'registro-status',
        description: 'Registra status-badge',
        validatorType: 'browser-script',
        customValidatorScript: `async ({ customElements }) => {
          await customElements.whenDefined('status-badge');
          return true;
        }`,
      }],
    } as any;

    const result = await runChallengeValidation(challenge, wsFromJs('// falta registrar'), iframe, 4);

    expect(result.allPassed).toBe(false);
    expect(result.tests[0].status).toBe('failed');
    expect(result.tests[0].isEvaluationError).not.toBe(true);
    expect(result.tests[0].errorMessage).toContain('status-badge');
  });
});
