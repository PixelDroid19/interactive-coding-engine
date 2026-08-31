import { describe, expect, it } from 'vitest';
import { Course, DebuggingExerciseItem } from '../types/curriculum';
import { ChallengeTest, ScrimChallenge, ScrimLessonData, WorkspaceSnapshot } from '../types/scrim';
import { runChallengeValidation } from '../engine/testRunner';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from './javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './web-components-lit/course';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from './ai-engineer/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './open-cells/course';
import { learnerHintText } from '../learning/learnerHints';

interface AuditedExercise {
  id: string;
  courseId: string;
  kind: 'challenge' | 'debug';
  copy: string;
  hints: string[];
  tests: ChallengeTest[];
  solutionFiles?: Record<string, string>;
  initialWorkspace?: WorkspaceSnapshot;
}

type ScrimCatalog = Record<string, ScrimLessonData>;

const catalogs: Array<[Course, ScrimCatalog]> = [
  [FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS],
  [JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS],
  [COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS],
  [AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS],
  [OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS],
];

function fromChallenge(courseId: string, challenge: ScrimChallenge): AuditedExercise {
  return {
    id: challenge.id,
    courseId,
    kind: 'challenge',
    copy: `${challenge.title}\n${challenge.instructions}`,
    hints: challenge.hints.map((hint) => `${hint.title} ${hint.text}`),
    tests: challenge.tests,
    solutionFiles: challenge.solutionFiles,
  };
}

function fromDebug(courseId: string, exercise: DebuggingExerciseItem): AuditedExercise {
  return {
    id: exercise.id,
    courseId,
    kind: 'debug',
    copy: [exercise.title, exercise.description, exercise.expectedBehavior, exercise.observedBehavior].join('\n'),
    hints: exercise.hints.map((hint) => hint.text),
    tests: exercise.tests,
    initialWorkspace: exercise.initialWorkspace,
  };
}

function collectExercises(): AuditedExercise[] {
  return catalogs.flatMap(([course, scrims]) => course.modules.flatMap((module) =>
    module.items.flatMap((item) => {
      if (item.type === 'scrim') {
        return scrims[item.scrimDataId].challenges.map((challenge) => fromChallenge(course.id, challenge));
      }
      if (item.type === 'challenge') return [fromChallenge(course.id, item.challenge)];
      if (item.type === 'debugging') return [fromDebug(course.id, item)];
      return [];
    }),
  ));
}

function invocationCases(test: ChallengeTest): Array<{ expected: unknown }> {
  if (test.callSequence) {
    return test.callSequence.map((step) => ({ expected: step.expectedReturn }));
  }
  return [{ expected: test.expectedErrorContains ?? test.expectedReturn }];
}

describe('auditoría integrada de todos los ejercicios', () => {
  const exercises = collectExercises();

  it('recorre los retos y laboratorios de los cinco cursos', () => {
    expect(exercises).toHaveLength(265);
    expect(exercises.filter((exercise) => exercise.courseId === FUNDAMENTOS_COURSE.id)).toHaveLength(48);
    expect(exercises.filter((exercise) => exercise.courseId === JAVASCRIPT_COURSE.id)).toHaveLength(48);
    expect(exercises.filter((exercise) => exercise.courseId === COMPONENT_COURSE.id)).toHaveLength(90);
    expect(exercises.filter((exercise) => exercise.courseId === AI_ENGINEER_COURSE.id)).toHaveLength(78);
    expect(exercises.filter((exercise) => exercise.courseId === OPEN_CELLS_COURSE.id)).toHaveLength(1);
    expect(OPEN_CELLS_COURSE.modules.flatMap((module) => module.items)
      .filter((item) => item.type === 'reading' && item.handsOnLab)).toHaveLength(14);
  });

  it('mantiene contratos identificables, explicados y sin soluciones adjuntas', () => {
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length);

    for (const exercise of exercises) {
      expect(exercise.copy.trim().length, `${exercise.id} no explica el trabajo`).toBeGreaterThan(30);
      expect(exercise.tests.length, `${exercise.id} no tiene comprobaciones`).toBeGreaterThan(0);
      expect(exercise.hints.length, `${exercise.id} no ofrece ayuda progresiva`).toBeGreaterThanOrEqual(3);
      expect(exercise.solutionFiles, `${exercise.id} expone la solución`).toBeUndefined();

      const testIds = exercise.tests.map((test) => test.id);
      expect(new Set(testIds).size, `${exercise.id} repite identificadores de prueba`).toBe(testIds.length);
      for (const test of exercise.tests) {
        expect(test.description.trim().length, `${exercise.id}/${test.id} no explica qué comprueba`).toBeGreaterThan(5);
        if (test.validatorType === 'source-regex') {
          expect(() => new RegExp(test.regexPattern || '', 'i'), `${exercise.id}/${test.id} tiene un patrón inválido`).not.toThrow();
        }
        if (test.validatorType === 'function-call') {
          expect(test.targetFunction, `${exercise.id}/${test.id} no indica qué función invoca`).toBeTruthy();
        }
        if (test.validatorType === 'browser-script') {
          expect(test.customValidatorScript?.trim().length, `${exercise.id}/${test.id} no ejecuta una comprobación real`).toBeGreaterThan(20);
        }
      }
    }
  });

  it('la última ayuda visible nunca entrega el paso final de ninguno de los cinco cursos', () => {
    for (const exercise of exercises) {
      const original = exercise.hints.at(-1) ?? '';
      const visible = learnerHintText({
        text: original,
        index: Math.max(0, exercise.hints.length - 1),
        total: exercise.hints.length,
        criteria: exercise.tests.map((test) => test.description),
      });

      expect(visible, `${exercise.id} deja visible la pista-solución original`).not.toBe(original);
      expect(visible, `${exercise.id} muestra código copiable en la última pista`).not.toMatch(/```|\breturn\b|=>|===|\b(?:const|let|var|if|for|while)\s*[\s({]/i);
      expect(visible, `${exercise.id} no exige investigar antes de cambiar`).toMatch(/dos entradas|dos casos/i);
      expect(visible, `${exercise.id} no limita el cambio`).toMatch(/una sola causa/i);
    }
  });

  it('cada reto reúne el modelo previo, el punto de partida y los criterios de éxito', () => {
    for (const exercise of exercises.filter((candidate) => candidate.kind === 'challenge')) {
      expect(exercise.copy, `${exercise.id} no recuerda el modelo ya enseñado`).toMatch(/Antes de empezar/i);
      expect(exercise.copy, `${exercise.id} no explica qué archivo o starter modificar`).toMatch(/Punto de partida/i);
      expect(exercise.copy, `${exercise.id} no dice cómo verificar el resultado`).toMatch(/Cómo comprobarlo/i);
      expect(exercise.copy, `${exercise.id} no explica cómo pedir ayuda sin revelar la respuesta`).toMatch(/pistas.*una.*vez/i);
    }
  });

  it('prueba cada contrato de función con entradas y resultados diferentes', () => {
    for (const exercise of exercises) {
      const testsByFunction = new Map<string, ChallengeTest[]>();
      for (const test of exercise.tests.filter((candidate) => candidate.validatorType === 'function-call')) {
        const functionName = test.targetFunction || '';
        testsByFunction.set(functionName, [...(testsByFunction.get(functionName) || []), test]);
      }

      for (const [functionName, functionTests] of testsByFunction) {
        const cases = functionTests.flatMap(invocationCases);
        expect(cases.length, `${exercise.id}/${functionName} solo prueba una entrada`).toBeGreaterThanOrEqual(2);
        expect(
          new Set(cases.map((currentCase) => JSON.stringify(currentCase.expected))).size,
          `${exercise.id}/${functionName} permite devolver siempre el mismo resultado`,
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('no convierte console.log en requisito oculto de una función', () => {
    for (const exercise of exercises) {
      const callsFunctions = exercise.tests.some((test) => test.validatorType === 'function-call');
      if (!callsFunctions || !/console\.log/i.test(exercise.copy)) continue;
      expect(exercise.copy, `${exercise.id} exige console.log aunque las pruebas llaman la función`).toMatch(/opcional|no es obligatorio/i);
    }
  });

  it('ningún laboratorio con pruebas locales se entrega ya resuelto', async () => {
    let validatedLabs = 0;
    for (const exercise of exercises.filter((candidate) => candidate.kind === 'debug')) {
      if (exercise.tests.some((test) => test.validatorType === 'browser-script') || !exercise.initialWorkspace) continue;
      validatedLabs += 1;
      const result = await runChallengeValidation({
        id: exercise.id,
        title: exercise.id,
        timestamp: 0,
        instructions: exercise.copy,
        tests: exercise.tests,
        hints: [],
      }, exercise.initialWorkspace);
      expect(result.allPassed, `${exercise.id} aprueba sin que el estudiante cambie el starter`).toBe(false);
    }

    expect(validatedLabs, 'la auditoría no alcanzó suficientes laboratorios ejecutables fuera del iframe').toBeGreaterThanOrEqual(45);
  });
});
