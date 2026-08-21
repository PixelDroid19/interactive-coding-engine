import { describe, it, expect } from 'vitest';
import { runChallengeValidation } from './testRunner';
import { WorkspaceSnapshot } from '../types/scrim';
import { file, workspaceOf } from './lessonCompiler';
import { LESSON1_HTML } from '../curriculum/fundamentos/workspaces';

function wsFromJs(js: string): WorkspaceSnapshot {
  return workspaceOf('app.js', {
    'index.html': file('index.html', LESSON1_HTML),
    'style.css': file('style.css', '*{}'),
    'app.js': file('app.js', js),
  });
}

describe('testRunner lesson01 behavioral', () => {
  const reto = {
    id: 'reto-tu-nombre',
    title: 'Reto: pon tu nombre',
    timestamp: 109400,
    instructions: '...',
    tests: [
      {
        id: 'nombre-cambiado',
        description: 'Cambiaste "Alex" por otro nombre',
        validatorType: 'source-regex' as const,
        regexPattern: 'nombre\\s*=\\s*["\'](?!Alex["\'])[^"\']+["\']',
        errorMessage: 'Sigue siendo "Alex".',
        hintTip: 'Ejemplo: let nombre = "Ana";',
      },
      {
        id: 'saludo-muestra-hola',
        description: 'El saludo se muestra en la página',
        validatorType: 'dom-check' as const,
        domSelector: '#saludo',
        domProperty: 'innerText' as const,
        expectedValue: 'Hola',
        errorMessage: 'No muestra Hola',
      },
      {
        id: 'saludo-usa-nuevo-nombre',
        description: 'El saludo usa tu nombre nuevo',
        validatorType: 'dom-check' as const,
        domSelector: '#saludo',
        domProperty: 'innerText' as const,
        errorMessage: 'No usa nombre',
      },
    ],
    hints: [],
  };

  it('starter falla (sigue siendo Alex o vacío)', async () => {
    const ws = wsFromJs(`// notas\n`);
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(false);
    expect(result.passedCount).toBeLessThan(3);
  });

  it('con Alex original falla nombre-cambiado pero Hola puede pasar si simula', async () => {
    const ws = wsFromJs(`let nombre = "Alex";\ndocument.getElementById("saludo").textContent = "Hola, " + nombre + ".";`);
    const result = await runChallengeValidation(reto as any, ws, null);
    // nombre-cambiado debe fallar porque es Alex
    const nombreTest = result.tests.find(t => t.id === 'nombre-cambiado');
    expect(nombreTest?.passed).toBe(false);
  });

  it('solución Ana pasa las 3 pruebas', async () => {
    const ws = wsFromJs(`let nombre = "Ana";\ndocument.getElementById("saludo").textContent = "Hola, " + nombre + ".";`);
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(true);
    expect(result.passedCount).toBe(3);
  });

  it('solución con comillas simples también pasa (segunda solución razonable)', async () => {
    const ws = wsFromJs(`let nombre = 'Carlos';\ndocument.getElementById("saludo").textContent = "Hola, " + nombre + ".";`);
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(true);
  });

  it('manteniendo palabra Alex pero sin cambiar nombre falla aunque haya Hola', async () => {
    const ws = wsFromJs(`let nombre = "Alex";\n// Hola\n document.getElementById("saludo").textContent = "Hola, " + nombre + ".";`);
    const result = await runChallengeValidation(reto as any, ws, null);
    expect(result.allPassed).toBe(false);
  });

  it('source-regex solo no basta: si borra línea saludo falla dom', async () => {
    const ws = wsFromJs(`let nombre = "Ana";\n// sin saludo`);
    const result = await runChallengeValidation(reto as any, ws, null);
    // aunque nombre-cambiado pasa, los dom fallan
    expect(result.allPassed).toBe(false);
    const saludoHola = result.tests.find(t => t.id === 'saludo-muestra-hola');
    expect(saludoHola?.passed).toBe(false);
  });
});

describe('testRunner hardening', () => {
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
    // ahora falla
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
});
