import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { cloneWorkspace, reconstructWorkspaceAt } from '../../engine/eventLog';
import { FUNDAMENTOS_SCRIMS } from './course';
import { LESSON_10 } from './lesson10';
import { LESSON_01 } from './lesson01';
import { LESSON_04 } from './lesson04';
import { LESSON_02 } from './lesson02';
import { LESSON_06 } from './lesson06';
import { LESSON_09 } from './lesson09';

describe('retos dentro de las lecciones', () => {
  it.each(Object.values(FUNDAMENTOS_SCRIMS).flatMap((lesson) =>
    lesson.challenges.map((challenge) => ({ lesson, challenge }))))(
    '$lesson.id abre $challenge.id como reto pendiente y evaluable',
    async ({ lesson, challenge }) => {
      const workspace = reconstructWorkspaceAt(
        lesson.initialWorkspace,
        lesson.events,
        lesson.snapshots,
        challenge.timestamp,
      ).workspace;

      const result = await runChallengeValidation(challenge, workspace, null);

      expect(result.allPassed).toBe(false);
      expect(result.tests.filter((test) => test.isEvaluationError)).toEqual([]);
    },
  );

  it.each(Object.values(FUNDAMENTOS_SCRIMS).flatMap((lesson) =>
    lesson.challenges.map((challenge) => ({ lesson, challenge }))))(
    '$lesson.id acepta la resolución construida por la cinta después de $challenge.id',
    async ({ lesson, challenge }) => {
      const resolutionWrite = lesson.events.find(
        (event) => event.timestamp > challenge.timestamp && event.type === 'code-change',
      );
      expect(resolutionWrite).toBeDefined();
      const resolvedWorkspace = reconstructWorkspaceAt(
        lesson.initialWorkspace,
        lesson.events,
        lesson.snapshots,
        resolutionWrite!.timestamp,
      ).workspace;

      const result = await runChallengeValidation(challenge, resolvedWorkspace, null);

      expect(result.tests.filter((test) => test.isEvaluationError)).toEqual([]);
      expect(result.allPassed).toBe(true);
    },
  );

  it('la primera práctica acepta textos propios sin exigir el DOM', async () => {
    const challenge = LESSON_01.challenges.find((candidate) => candidate.id === 'reto-primeras-instrucciones');
    const workspace = cloneWorkspace(LESSON_01.initialWorkspace);
    workspace.files['app.js'].content = [
      'console.log("Me llamo Sara");',
      'console.log("Estoy aprendiendo JavaScript");',
    ].join('\n');

    const result = await runChallengeValidation(challenge!, workspace, null);

    expect(result.allPassed).toBe(true);
  });

  it('el primer reto de DOM acepta otra forma válida de seleccionar elementos', async () => {
    const challenge = LESSON_10.challenges.find((candidate) => candidate.id === 'reto-dom-dos-elementos');
    const workspace = cloneWorkspace(LESSON_10.initialWorkspace);
    workspace.files['app.js'].content = [
      'document.querySelector("#titulo").textContent = "Mi página";',
      'document.querySelector("#mensaje").textContent = "Ya funciona";',
    ].join('\n');

    const result = await runChallengeValidation(challenge!, workspace, null);

    expect(result.allPassed).toBe(true);
  });

  it('el reto de operadores no exige funciones antes de enseñarlas', async () => {
    const challenge = LESSON_04.challenges.find((candidate) => candidate.id === 'reto-operadores');
    const workspace = cloneWorkspace(LESSON_04.initialWorkspace);
    workspace.files['app.js'].content = [
      'const numero = 8;',
      'const edad = 20;',
      'const tieneEntrada = true;',
      'const esPar = numero % 2 === 0;',
      'const puedeEntrar = edad >= 18 && tieneEntrada;',
      'console.log(esPar);',
      'console.log(puedeEntrar);',
    ].join('\n');

    const result = await runChallengeValidation(challenge!, workspace, null);

    expect(challenge).toBeDefined();
    expect(challenge?.instructions).not.toMatch(/funci[oó]n/i);
    expect(result.allPassed).toBe(true);
  });

  it('el reto de operadores acepta expresiones equivalentes', async () => {
    const challenge = LESSON_04.challenges.find((candidate) => candidate.id === 'reto-operadores')!;
    const workspace = cloneWorkspace(LESSON_04.initialWorkspace);
    workspace.files['app.js'].content = [
      'const numero = 8;',
      'const edad = 20;',
      'const tieneEntrada = true;',
      'const esPar = 0 === numero % 2;',
      'const puedeEntrar = tieneEntrada && edad >= 18;',
      'console.log(esPar);',
      'console.log(puedeEntrar);',
    ].join('\n');

    expect((await runChallengeValidation(challenge, workspace, null)).allPassed).toBe(true);
  });

  it('el reto de bucles acepta un límite equivalente que produce la misma secuencia', async () => {
    const challenge = LESSON_06.challenges.find((candidate) => candidate.id === 'reto-limite-bucle')!;
    const workspace = cloneWorkspace(LESSON_06.initialWorkspace);
    workspace.files['app.js'].content = 'for (let i = 1; i < 6; i++) { console.log(i); }';

    expect((await runChallengeValidation(challenge, workspace, null)).allPassed).toBe(true);
  });

  it('la segunda lección comprueba el orden sin exigir variables ni funciones', async () => {
    const challenge = LESSON_02.challenges.find((candidate) => candidate.id === 'reto-pasos-en-orden');
    const workspace = cloneWorkspace(LESSON_02.initialWorkspace);
    workspace.files['app.js'].content = [
      "console.log('Calentar el agua');",
      "console.log('Poner el té en la taza');",
      "console.log('Servir el agua');",
    ].join('\n');

    const result = await runChallengeValidation(challenge!, workspace, null);

    expect(workspace.files['app.js'].content).not.toMatch(/\b(?:const|let|function|if|for)\b/);
    expect(result.allPassed).toBe(true);
  });

  it('el reto de objetos acepta valores elegidos por el estudiante sin exigir console.log', async () => {
    const challenge = LESSON_09.challenges.find((candidate) => candidate.id === 'reto-producto')!;
    const workspace = cloneWorkspace(LESSON_09.initialWorkspace);
    workspace.files['app.js'].content = [
      'const producto = { nombre: "Cuaderno", precio: 27 };',
      'function etiqueta(item) {',
      '  return item.nombre + " — " + item.precio;',
      '}',
    ].join('\n');

    const result = await runChallengeValidation(challenge, workspace, null);

    expect(result.allPassed).toBe(true);
    expect(workspace.files['app.js'].content).not.toContain('console.log');
  });

  it('el reto de objetos explica que los datos propios son libres y console.log es opcional', () => {
    const challenge = LESSON_09.challenges.find((candidate) => candidate.id === 'reto-producto')!;
    const visibleTests = challenge.tests.map((test) => test.description).join('\n');
    const visibleHints = challenge.hints.map((hint) => `${hint.title} ${hint.text}`).join('\n');

    expect(challenge.instructions).toMatch(/elige.+valores|valores.+quieras/i);
    expect(challenge.instructions).toMatch(/pruebas.+otros productos/i);
    expect(visibleTests).not.toMatch(/Té|Café|precio\s*:\s*(?:4|12)/i);
    expect(visibleHints).toMatch(/console\.log/i);
    expect(visibleHints).toMatch(/opcional|si quieres/i);
  });
});
