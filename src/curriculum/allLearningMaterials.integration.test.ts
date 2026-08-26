import { describe, expect, it } from 'vitest';
import { Course, ReadingItem, ReasoningAttempt, ReasoningExerciseItem } from '../types/curriculum';
import { validateReasoningAttempt } from '../engine/reasoningRunner';
import { FUNDAMENTOS_COURSE } from './fundamentos/course';
import { JAVASCRIPT_COURSE } from './javascript/course';
import { COMPONENT_COURSE } from './web-components-lit/course';
import { AI_ENGINEER_COURSE } from './ai-engineer/course';

const courses: Course[] = [FUNDAMENTOS_COURSE, JAVASCRIPT_COURSE, COMPONENT_COURSE, AI_ENGINEER_COURSE];

function itemsOf<T extends 'reading' | 'reasoning'>(course: Course, type: T) {
  return course.modules.flatMap((module) => module.items).filter((item) => item.type === type);
}

function attemptFor(item: ReasoningExerciseItem): ReasoningAttempt {
  const { activity } = item;
  if (activity.kind === 'sequence') return { kind: 'sequence', order: activity.expectedOrder };
  if (activity.kind === 'trace-table') return { kind: 'trace-table', cells: activity.expectedCells };
  if (activity.kind === 'flowchart') return { kind: 'flowchart', connections: activity.expectedConnections };
  if (activity.kind === 'decision-table') return { kind: 'decision-table', outcomes: activity.expectedOutcomes };
  if (activity.kind === 'vector-ranking') return { kind: 'vector-ranking', order: activity.expectedOrder };
  if (activity.kind === 'context-budget') return { kind: 'context-budget', selected: activity.expectedSelected };
  return { kind: 'dependency-map', dependencies: activity.expectedDependencies };
}

function expectValidReasoningReferences(item: ReasoningExerciseItem) {
  const { activity } = item;
  if (activity.kind === 'sequence') {
    expect(new Set(activity.expectedOrder), `${item.id} no permite ordenar todos los pasos visibles`)
      .toEqual(new Set(activity.steps.map((step) => step.id)));
    return;
  }
  if (activity.kind === 'trace-table') {
    const visibleCells = activity.rows.flatMap((row) => activity.columns.map((column) => `${row.id}.${column}`));
    expect(new Set(Object.keys(activity.expectedCells)), `${item.id} espera celdas que el estudiante no puede editar`)
      .toEqual(new Set(visibleCells));
    return;
  }
  if (activity.kind === 'decision-table') {
    expect(new Set(Object.keys(activity.expectedOutcomes)), `${item.id} no cubre todos los casos visibles`)
      .toEqual(new Set(activity.cases.map((currentCase) => currentCase.id)));
    for (const currentCase of activity.cases) {
      expect(currentCase.options, `${item.id}/${currentCase.id} no ofrece la respuesta esperada`)
        .toContain(activity.expectedOutcomes[currentCase.id]);
    }
    return;
  }
  if (activity.kind === 'vector-ranking') {
    expect(new Set(activity.expectedOrder), `${item.id} ordena candidatos invisibles`)
      .toEqual(new Set(activity.candidates.map((candidate) => candidate.id)));
    return;
  }
  if (activity.kind === 'context-budget') {
    const ids = new Set(activity.blocks.map((block) => block.id));
    activity.expectedSelected.forEach((id) => expect(ids, `${item.id} selecciona un bloque invisible`).toContain(id));
    const used = activity.blocks.filter((block) => activity.expectedSelected.includes(block.id)).reduce((sum, block) => sum + block.tokens, 0);
    expect(used, `${item.id} tiene una respuesta que supera el presupuesto`).toBeLessThanOrEqual(activity.budget);
    return;
  }

  const nodes = activity.kind === 'flowchart' ? activity.nodes : activity.modules;
  const options = activity.kind === 'flowchart' ? activity.connectionOptions : activity.dependencyOptions;
  const expected = activity.kind === 'flowchart' ? activity.expectedConnections : activity.expectedDependencies;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const optionKeys = new Set(options.map((connection) => JSON.stringify(connection)));
  for (const connection of options) {
    expect(nodeIds.has(connection.from), `${item.id} parte de un nodo invisible: ${connection.from}`).toBe(true);
    expect(nodeIds.has(connection.to), `${item.id} llega a un nodo invisible: ${connection.to}`).toBe(true);
  }
  for (const connection of expected) {
    expect(optionKeys, `${item.id} espera una conexión que la interfaz no ofrece`).toContain(JSON.stringify(connection));
  }
}

describe('auditoría integrada del material de aprendizaje', () => {
  it('incluye una lectura y una práctica inmediatamente después de cada clase', () => {
    for (const course of courses) {
      for (const module of course.modules) {
        for (const [index, item] of module.items.entries()) {
          if (item.type !== 'scrim') continue;
          const beforeNextLesson = module.items.slice(index + 1).findIndex((candidate) => candidate.type === 'scrim');
          const learningBlock = module.items.slice(index + 1, beforeNextLesson < 0 ? undefined : index + 1 + beforeNextLesson);
          const reading = learningBlock.find((candidate) => candidate.type === 'reading');
          const practice = learningBlock.find((candidate) => candidate.type === 'debugging');

          expect(reading, `${course.id}/${item.id} no tiene lectura complementaria`).toBeDefined();
          expect(practice, `${course.id}/${item.id} no tiene práctica de depuración`).toBeDefined();
          expect(learningBlock.indexOf(reading!), `${course.id}/${item.id} muestra la práctica antes de preparar al estudiante`)
            .toBeLessThan(learningBlock.indexOf(practice!));
        }
      }
    }
  });

  it('las 132 lecturas explican, ejemplifican, anticipan errores y conectan con la práctica', () => {
    const readings = courses.flatMap((course) => itemsOf(course, 'reading')) as ReadingItem[];
    expect(readings).toHaveLength(132);
    expect(new Set(readings.map((reading) => reading.id)).size).toBe(readings.length);

    for (const reading of readings) {
      expect.soft(reading.summary.trim().length, `${reading.id} no presenta el propósito`).toBeGreaterThan(50);
      expect.soft(reading.sections.length, `${reading.id} desarrolla muy poco el concepto`).toBeGreaterThanOrEqual(3);
      expect.soft(reading.sections.some((section) => Boolean(section.example?.trim())), `${reading.id} no contiene un ejemplo trabajado`).toBe(true);
      expect.soft(
        reading.sections.some((section) => /error|equivoc|fall|confusi|cuidado|problema/i.test(`${section.title} ${section.content}`)),
        `${reading.id} no prepara para errores frecuentes`,
      ).toBe(true);
      expect.soft(reading.keyPoints.length, `${reading.id} no resume lo esencial`).toBeGreaterThanOrEqual(3);
      expect.soft(reading.frequentQuestions?.length, `${reading.id} no responde dudas frecuentes`).toBeGreaterThanOrEqual(2);
      expect.soft(reading.transferPrompt?.trim().length, `${reading.id} no invita a transferir lo aprendido`).toBeGreaterThan(25);
      expect.soft(reading.practiceItemId, `${reading.id} no enlaza con una práctica`).toBeTruthy();

      const course = courses.find((candidate) => candidate.modules.some((module) => module.items.includes(reading)))!;
      const practice = course.modules.flatMap((module) => module.items)
        .find((candidate) => candidate.id === reading.practiceItemId);
      expect.soft(practice?.type, `${reading.id} apunta a una práctica inexistente`).toBe('debugging');
    }
  });

  it('las 127 actividades Piensa son claras, guiadas y resolubles desde lo que muestran', () => {
    const activities = courses.flatMap((course) => itemsOf(course, 'reasoning')) as ReasoningExerciseItem[];
    expect(activities).toHaveLength(127);
    expect(new Set(activities.map((item) => item.id)).size).toBe(activities.length);

    for (const item of activities) {
      expect.soft(item.activity.prompt.trim().length, `${item.id} no plantea la tarea con suficiente contexto`).toBeGreaterThan(35);
      expect.soft(item.explanation.trim().length, `${item.id} no explica el modelo después de responder`).toBeGreaterThan(55);
      expect.soft(item.hints.length, `${item.id} no ofrece ayuda gradual`).toBeGreaterThanOrEqual(3);
      expect.soft(item.hints.map((hint) => hint.level), `${item.id} tiene niveles de pista incoherentes`).toEqual([1, 2, 3]);
      expect.soft(new Set(item.hints.map((hint) => hint.text.trim())).size, `${item.id} repite pistas`).toBe(item.hints.length);
      expectValidReasoningReferences(item);
      expect(validateReasoningAttempt(item.activity, attemptFor(item)).allPassed, `${item.id} es imposible de completar desde su interfaz`).toBe(true);
    }
  });
});
