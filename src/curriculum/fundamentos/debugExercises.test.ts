import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { DEBUG_EXERCISES } from './debugExercises';

describe('laboratorios de depuración', () => {
  it.each(DEBUG_EXERCISES)('$id empieza con todas sus comprobaciones fallando', async (exercise) => {
    const result = await runChallengeValidation(
      {
        id: exercise.id,
        title: exercise.title,
        timestamp: 0,
        instructions: exercise.description || '',
        tests: exercise.tests,
        hints: [],
      },
      exercise.initialWorkspace,
      null,
    );

    expect(result.tests.filter((test) => test.isEvaluationError)).toEqual([]);
    expect(result.passedCount).toBe(0);
    expect(result.allPassed).toBe(false);
  });
});
