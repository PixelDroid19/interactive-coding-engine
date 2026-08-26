import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { createInitialReasoningAttempt, validateReasoningAttempt } from '../../engine/reasoningRunner';
import type { ReasoningActivity, ReasoningAttempt } from '../../types/curriculum';
import { buildRoadmap } from '../fundamentos/roadmap';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from './course';
import { buildAiLessonBundle } from './factory';
import { AI_SPECS } from './modules';
import { AI_ENGINEER_PROJECTS } from './projects';

function reasoningAttempts(activity: ReasoningActivity): { initial: ReasoningAttempt; correct: ReasoningAttempt } {
  switch (activity.kind) {
    case 'sequence':
      return { initial: { kind: 'sequence', order: activity.steps.map((step) => step.id) }, correct: { kind: 'sequence', order: [...activity.expectedOrder] } };
    case 'trace-table':
      return { initial: { kind: 'trace-table', cells: {} }, correct: { kind: 'trace-table', cells: { ...activity.expectedCells } } };
    case 'flowchart':
      return { initial: { kind: 'flowchart', connections: [] }, correct: { kind: 'flowchart', connections: structuredClone(activity.expectedConnections) } };
    case 'decision-table':
      return { initial: { kind: 'decision-table', outcomes: {} }, correct: { kind: 'decision-table', outcomes: { ...activity.expectedOutcomes } } };
    case 'dependency-map':
      return { initial: { kind: 'dependency-map', dependencies: [] }, correct: { kind: 'dependency-map', dependencies: structuredClone(activity.expectedDependencies) } };
    case 'vector-ranking':
      return { initial: { kind: 'vector-ranking', order: activity.candidates.map((item) => item.id) }, correct: { kind: 'vector-ranking', order: [...activity.expectedOrder] } };
    case 'context-budget':
      return { initial: { kind: 'context-budget', selected: activity.blocks.filter((block) => block.required).map((block) => block.id) }, correct: { kind: 'context-budget', selected: [...activity.expectedSelected] } };
  }
}

describe('auditoría integral de AI Engineer', () => {
  const items = AI_ENGINEER_COURSE.modules.flatMap((module) => module.items);

  it('entrega el inventario completo sin ids duplicados', () => {
    expect(AI_ENGINEER_COURSE.modules).toHaveLength(7);
    expect(AI_SPECS).toHaveLength(39);
    expect(Object.keys(AI_ENGINEER_SCRIMS)).toHaveLength(39);
    expect(items.filter((item) => item.type === 'scrim')).toHaveLength(39);
    expect(items.filter((item) => item.type === 'reading')).toHaveLength(39);
    expect(items.filter((item) => item.type === 'reasoning')).toHaveLength(39);
    expect(items.filter((item) => item.type === 'debugging')).toHaveLength(39);
    expect(items.filter((item) => item.type === 'solo-project')).toHaveLength(7);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(AI_ENGINEER_PROJECTS).toHaveLength(7);
  });

  it('publica los siete proyectos de fase como destinos accesibles en el roadmap', () => {
    const projectRows = buildRoadmap(AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS)
      .flatMap((phase) => phase.rows)
      .filter((row) => row.main.itemType === 'solo-project');

    expect(projectRows).toHaveLength(7);
    expect(projectRows.map((row) => row.main.label)).toEqual([
      'Proyecto: el Eco, primer cerebro del chat',
      'Proyecto: panel de parámetros del chat',
      'Proyecto: motor local visible',
      'Proyecto: buscador semántico de notas',
      'Proyecto: RAG con citas verificables',
      'Proyecto: guardián de publicaciones',
      'Proyecto: entrega del TutorLocal completo',
    ]);
  });

  it('mantiene todas las clases visuales, silenciosas y sin audio heredado', () => {
    for (const lesson of Object.values(AI_ENGINEER_SCRIMS)) {
      expect(lesson.narrationMode, lesson.id).toBe('silent');
      expect(lesson.audioTrack?.url, lesson.id).toBeUndefined();
      expect(lesson.audioTrack?.narrationScript.length, lesson.id).toBe(4);
      expect(lesson.languageVariants?.javascript.lessonTape).toBeDefined();
      expect(lesson.languageVariants?.python.lessonTape).toBeDefined();
    }
  });

  it('usa fuentes HTTPS y material suficiente en cada lectura', () => {
    for (const item of items) {
      if (item.type !== 'reading') continue;
      expect(item.sections.length, item.id).toBeGreaterThanOrEqual(4);
      expect(item.keyPoints.length, item.id).toBeGreaterThanOrEqual(2);
      expect(item.frequentQuestions?.length, item.id).toBeGreaterThanOrEqual(1);
      expect(item.sources?.length, item.id).toBeGreaterThanOrEqual(2);
      item.sources?.forEach((source) => expect(source.url, item.id).toMatch(/^https:\/\//));
    }
  });

  it('hace fallar cada starter JavaScript y aprobar sus 39 soluciones con entradas variadas', async () => {
    for (const spec of AI_SPECS) {
      const bundle = buildAiLessonBundle(spec);
      const challenge = bundle.lesson.languageVariants!.javascript.lessonTape!.challenges[0];
      const starter = bundle.lesson.languageVariants!.javascript.workspace;
      const starterResult = await runChallengeValidation(challenge, starter);
      expect(starterResult.allPassed, `${spec.number} entrega la solución en el starter`).toBe(false);

      const solution = structuredClone(starter);
      solution.files['app.js'].content = bundle.solutions.javascript;
      const solutionResult = await runChallengeValidation(challenge, solution);
      expect(solutionResult.allPassed, `${spec.number} tiene una solución de referencia inválida: ${solutionResult.feedbackMessage}`).toBe(true);
      expect(challenge.tests.length, `${spec.number} solo prueba un valor`).toBeGreaterThanOrEqual(2);
    }
  });

  it('hace fallar las 39 depuraciones JavaScript y acepta la corrección de referencia', async () => {
    for (const spec of AI_SPECS) {
      const bundle = buildAiLessonBundle(spec);
      const debug = bundle.debug.languageVariants!.javascript;
      const challenge = {
        id: bundle.debug.id,
        title: bundle.debug.title,
        timestamp: 0,
        instructions: bundle.debug.description ?? '',
        tests: debug.tests,
        hints: [],
      };

      const brokenResult = await runChallengeValidation(challenge, debug.workspace);
      expect(brokenResult.allPassed, `${spec.number} entrega la depuración ya resuelta`).toBe(false);

      const corrected = structuredClone(debug.workspace);
      corrected.files['app.js'].content = bundle.solutions.javascript;
      const correctedResult = await runChallengeValidation(challenge, corrected);
      expect(correctedResult.allPassed, `${spec.number} no acepta una corrección general válida`).toBe(true);
    }
  });

  it('hace evaluables los 39 razonamientos sin entregarlos resueltos al abrir', () => {
    for (const spec of AI_SPECS) {
      const activity = buildAiLessonBundle(spec).reasoning.activity;
      const { correct } = reasoningAttempts(activity);
      const initial = createInitialReasoningAttempt(activity);
      expect(validateReasoningAttempt(activity, initial).allPassed, `${spec.number} abre el razonamiento ya resuelto`).toBe(false);
      expect(validateReasoningAttempt(activity, correct).allPassed, `${spec.number} no reconoce su respuesta correcta`).toBe(true);
    }
  });

  it('evalúa comportamiento con entradas distintas y explica cómo investigar con valores propios', () => {
    for (const spec of AI_SPECS) {
      const bundle = buildAiLessonBundle(spec);
      const challenge = bundle.lesson.challenges[0];
      const serializedArgs = challenge.tests.map((test) => JSON.stringify(test.args));
      expect(challenge.tests.length, `${spec.number} no prueba variación`).toBeGreaterThanOrEqual(2);
      expect(new Set(serializedArgs).size, `${spec.number} repite la misma entrada`).toBe(challenge.tests.length);
      challenge.tests.forEach((test) => {
        expect(test.validatorType, `${spec.number} depende del texto fuente`).toBe('function-call');
        expect(test.targetFunction, `${spec.number} no llama la función del estudiante`).toBe(spec.practice.functionName);
      });
      expect(challenge.instructions, `${spec.number} no explica cómo probar datos propios`).toMatch(/datos distintos/i);
      expect(challenge.instructions, `${spec.number} no aclara el papel de console\.log`).toMatch(/console\.log es opcional/i);
    }
  });
});
