import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { cloneWorkspace, reconstructWorkspaceAt } from '../../engine/eventLog';
import { FUNDAMENTOS_SCRIMS } from './course';
import { LESSON_10 } from './lesson10';

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

  it('el reto de closures rechaza un contador constante y acepta instancias independientes', async () => {
    const challenge = LESSON_10.challenges.find((candidate) => candidate.id === 'reto-contador');
    expect(challenge).toBeDefined();

    const constantWorkspace = cloneWorkspace(LESSON_10.initialWorkspace);
    constantWorkspace.files['app.js'].content = 'function crearContador(){ return function(){ return 1; }; }';
    const independentWorkspace = cloneWorkspace(LESSON_10.initialWorkspace);
    independentWorkspace.files['app.js'].content = 'function crearContador(){ let n = 0; return function(){ n++; return n; }; }';

    const constantResult = await runChallengeValidation(challenge!, constantWorkspace, null);
    const independentResult = await runChallengeValidation(challenge!, independentWorkspace, null);

    expect(constantResult.allPassed).toBe(false);
    expect(independentResult.allPassed).toBe(true);
  });
});
