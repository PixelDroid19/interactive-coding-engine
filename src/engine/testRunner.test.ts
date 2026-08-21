import { describe, it, expect } from 'vitest';
import { runChallengeValidation } from './testRunner';
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

// El reto real de la lección 01 reescrita (dos instrucciones busca-y-escribe)
const retoLeccion1: ScrimChallenge = LESSON_01.challenges[0];

describe('testRunner reto lección 01 (busca-y-escribe)', () => {
  it('el starter vacío falla', async () => {
    const ws = wsFromJs(`// notas\n`);
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(false);
    expect(result.passedCount).toBe(0);
  });

  it('una solución del alumno pasa las 4 pruebas', async () => {
    const ws = wsFromJs(
      `document.getElementById("linea1").textContent = "Damien";
document.getElementById("linea2").textContent = "Pizza";`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(true);
    expect(result.passedCount).toBe(4);
  });

  it('una segunda solución razonable también pasa', async () => {
    const ws = wsFromJs(
      `document.getElementById("linea1").textContent = 'María';
document.getElementById("linea2").textContent = 'Sushi';`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(true);
  });

  it('escribir todo en un solo recuadro falla', async () => {
    const ws = wsFromJs(
      `document.getElementById("linea1").textContent = "Damien";
document.getElementById("linea1").textContent = "Pizza";`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(false);
    const linea2 = result.tests.find(t => t.id === 'linea2-tiene-texto');
    expect(linea2?.passed).toBe(false);
  });

  it('con id equivocado falla la comprobación del recuadro', async () => {
    const ws = wsFromJs(
      `document.getElementById("linea3").textContent = "Damien";
document.getElementById("linea4").textContent = "Pizza";`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    expect(result.allPassed).toBe(false);
  });

  it('la demo de orden del instructor pasa el patrón (última gana)', async () => {
    // Comportamiento clave enseñado: dos escrituras al mismo recuadro → la última gana
    const ws = wsFromJs(
      `document.getElementById("linea1").textContent = "Hola";
document.getElementById("linea1").textContent = "Adiós";`
    );
    const result = await runChallengeValidation(retoLeccion1, ws, null);
    const linea1 = result.tests.find(t => t.id === 'linea1-tiene-texto');
    // linea1 tiene texto (Adiós), así que esa comprobación pasa aunque el reto completo no
    expect(linea1?.passed).toBe(true);
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
    expect(result.tests[0].errorMessage).toContain('comportamiento real');
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
