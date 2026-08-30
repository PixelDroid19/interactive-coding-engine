import { describe, it, expect } from 'vitest';
import { runChallengeValidation } from './testRunner';
import { evaluationValuesEqual } from './evaluationEquality';
import { Window } from 'happy-dom';

describe('comparación de resultados numéricos', () => {
  it('acepta el ruido normal de coma flotante sin ocultar diferencias reales', () => {
    expect(evaluationValuesEqual(0.9 - 0.7, 0.2)).toBe(true);
    expect(evaluationValuesEqual([0.6000000000000001, 0.8], [0.6, 0.8])).toBe(true);
    expect(evaluationValuesEqual(0.21, 0.2)).toBe(false);
  });
});
import { ScrimChallenge, WorkspaceSnapshot } from '../types/scrim';
import { file, workspaceOf } from './lessonCompiler';
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

function validatorIframe(
  response?: Readonly<{ type: 'result'; result: unknown } | { type: 'missing-tag'; tag: string }>,
  generation = 1,
): HTMLIFrameElement {
  const hostWindow = new Window();
  const frameWindow = {
    postMessage(message: { validationId: string }) {
      if (!response) return;
      queueMicrotask(() => {
        hostWindow.dispatchEvent(new hostWindow.MessageEvent('message', {
          source: frameWindow as any,
          data: { source: 'aula-validator', validationId: message.validationId, ...response },
        }));
      });
    },
  };
  return {
    contentWindow: frameWindow,
    ownerDocument: { defaultView: hostWindow },
    __generation: generation,
  } as unknown as HTMLIFrameElement;
}

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
  it('acepta una clase default anónima válida durante el preflight de sintaxis', async () => {
    const ws = wsFromJs(`import { LitElement } from 'lit';
export default class extends LitElement {}`);
    const reto = {
      id: 'default-anonima',
      title: 'Export nombrado',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'export-nombrado',
        description: 'Exporta una clase por nombre',
        validatorType: 'source-regex' as const,
        regexPattern: String.raw`export\s+class\s+StatusChip`,
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.allPassed).toBe(false);
    expect(result.tests[0].status).toBe('failed');
    expect(result.tests[0].isEvaluationError).not.toBe(true);
  });

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

  it('function-call evalúa una función exportada sin exigir una sintaxis distinta', async () => {
    const ws = wsFromJs('export function doble(numero) { return numero * 2; }');
    const reto = {
      id: 'export-behavior',
      title: 'Exportación con comportamiento',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'doble-exportado',
        description: 'La función exportada conserva su contrato',
        validatorType: 'function-call' as const,
        targetFunction: 'doble',
        args: [7],
        expectedReturn: 14,
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.allPassed, result.feedbackMessage).toBe(true);
  });

  it('function-call espera el resultado de una función asíncrona', async () => {
    const ws = wsFromJs('async function resolver(valor) { return valor.toUpperCase(); }');
    const reto = {
      id: 'async-behavior',
      title: 'Resultado asíncrono',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'resolver-async',
        description: 'Espera la promesa',
        validatorType: 'function-call' as const,
        targetFunction: 'resolver',
        args: ['listo'],
        expectedReturn: 'LISTO',
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.allPassed, result.feedbackMessage).toBe(true);
  });

  it('function-call conserva callbacks usados como argumentos de prueba', async () => {
    const ws = wsFromJs('async function cargar(obtener) { const dato = await obtener(); return dato.titulo.toUpperCase(); }');
    const reto = {
      id: 'async-callback',
      title: 'Callback asíncrona',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'usa-proveedor',
        description: 'Usa el proveedor recibido',
        validatorType: 'function-call' as const,
        targetFunction: 'cargar',
        args: [async () => ({ titulo: 'otro valor' })],
        expectedReturn: 'OTRO VALOR',
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto, ws, null);

    expect(result.allPassed, result.feedbackMessage).toBe(true);
  });

  it('function-call puede comprobar un error esperado como comportamiento válido', async () => {
    const ws = wsFromJs('function validar(respuesta) { if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`); return respuesta; }');
    const reto = {
      id: 'expected-error',
      title: 'Error esperado',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'rechaza-404',
        description: 'Rechaza respuestas fallidas',
        validatorType: 'function-call' as const,
        targetFunction: 'validar',
        args: [{ ok: false, status: 404 }],
        expectedErrorContains: '404',
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto as any, ws, null);

    expect(result.allPassed, result.feedbackMessage).toBe(true);

  });

  it('function-call distingue una copia nueva de una mutación del argumento', async () => {
    const reto = {
      id: 'immutable-copy',
      title: 'Copia sin mutar',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'copia-nueva',
        description: 'Conserva la entrada y devuelve otro objeto',
        validatorType: 'function-call' as const,
        targetFunction: 'completar',
        args: [{ id: 1, completada: false }],
        expectedReturn: { id: 1, completada: true },
        expectArgsUnchanged: true,
        expectNewReferenceFromArg: 0,
      }],
      hints: [],
    };

    const mutating = wsFromJs('function completar(tarea) { tarea.completada = true; return tarea; }');
    const mutationResult = await runChallengeValidation(reto as any, mutating, null);
    expect(mutationResult.allPassed).toBe(false);
    expect(mutationResult.tests[0].errorMessage).toMatch(/original|objeto nuevo/i);

    const copying = wsFromJs('function completar(tarea) { return { ...tarea, completada: true }; }');
    const copyResult = await runChallengeValidation(reto as any, copying, null);
    expect(copyResult.allPassed, copyResult.feedbackMessage).toBe(true);
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

  it('function-call puede comprobar varias llamadas consecutivas sobre el mismo estado', async () => {
    const ws = wsFromJs('const tareas = []; function agregar(texto) { if (texto) tareas.push(texto); return tareas.length; }');
    const reto = {
      id: 'call-sequence',
      title: 'Secuencia con estado',
      timestamp: 0,
      instructions: '',
      tests: [{
        id: 'dos-altas',
        description: 'Dos llamadas válidas acumulan dos tareas',
        validatorType: 'function-call' as const,
        targetFunction: 'agregar',
        callSequence: [
          { args: ['Leer'], expectedReturn: 1 },
          { args: ['Practicar'], expectedReturn: 2 },
        ],
      }],
      hints: [],
    };

    const result = await runChallengeValidation(reto as any, ws, null);

    expect(result.allPassed, result.feedbackMessage).toBe(true);

    const broken = wsFromJs('function agregar() { return 1; }');
    const brokenResult = await runChallengeValidation(reto as any, broken, null);
    expect(brokenResult.allPassed).toBe(false);
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

  it('usa el plural correcto al informar varias comprobaciones no evaluables', async () => {
    const ws = wsFromJs('console.log("abierto";');
    const reto = {
      id: 'syntax-plural',
      title: 'Sintaxis',
      timestamp: 0,
      instructions: '',
      tests: [
        { id: 'uno', description: 'primera', validatorType: 'console-check' as const, expectedReturn: 'uno' },
        { id: 'dos', description: 'segunda', validatorType: 'console-check' as const, expectedReturn: 'dos' },
      ],
      hints: [],
    };

    const result = await runChallengeValidation(reto as any, ws, null);

    expect(result.feedbackMessage).toContain('2 comprobaciones');
    expect(result.feedbackMessage).not.toContain('comprobaciónes');
  });
});

describe('testRunner para componentes ejecutados en navegador', () => {
  it('acepta una comprobación asíncrona contra la vista previa real', async () => {
    const iframe = validatorIframe({ type: 'result', result: { passed: true } }, 7);
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
    const iframe = validatorIframe(undefined, 3);
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
    const iframe = validatorIframe({ type: 'missing-tag', tag: 'status-badge' }, 4);
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

  it('distingue esperar undefined de no declarar un resultado esperado', async () => {
    const challenge = {
      id: 'ausente-real', title: 'Conserva ausencias', timestamp: 0, instructions: '', hints: [],
      tests: [{
        id: 'ausente',
        description: 'No inventa un valor',
        validatorType: 'function-call',
        targetFunction: 'buscar',
        args: ['desconocido'],
        expectedReturn: undefined,
      }],
    } as any;

    const result = await runChallengeValidation(
      challenge,
      wsFromJs("function buscar() { return 'valor fijo'; }"),
    );

    expect(result.allPassed).toBe(false);
    expect(result.tests[0]).toMatchObject({ passed: false, receivedValue: 'valor fijo', expectedValue: undefined });
  });
});
