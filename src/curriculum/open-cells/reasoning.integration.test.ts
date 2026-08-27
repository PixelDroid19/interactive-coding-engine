import { describe, expect, it } from 'vitest';
import { createInitialReasoningAttempt, validateReasoningAttempt } from '../../engine/reasoningRunner';
import type { ReasoningActivity, ReasoningAttempt } from '../../types/curriculum';
import { OPEN_CELLS_COURSE } from './course';
import { OPEN_CELLS_REASONING } from './reasoning';

function solvedAttempt(activity: ReasoningActivity): ReasoningAttempt {
  if (activity.kind === 'sequence') return { kind: 'sequence', order: [...activity.expectedOrder] };
  if (activity.kind === 'decision-table') return { kind: 'decision-table', outcomes: { ...activity.expectedOutcomes } };
  if (activity.kind === 'dependency-map') return { kind: 'dependency-map', dependencies: [...activity.expectedDependencies] };
  if (activity.kind === 'flowchart') return { kind: 'flowchart', connections: [...activity.expectedConnections] };
  if (activity.kind === 'trace-table') return { kind: 'trace-table', cells: { ...activity.expectedCells } };
  if (activity.kind === 'vector-ranking') return { kind: 'vector-ranking', order: [...activity.expectedOrder] };
  return { kind: 'context-budget', selected: [...activity.expectedSelected] };
}

describe('prácticas de razonamiento Open Cells', () => {
  const items = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items);
  const readings = items.filter((item) => item.type === 'reading');
  const reasoning = items.filter((item) => item.type === 'reasoning');
  const customIds = new Set(OPEN_CELLS_REASONING.map((item) => item.id));

  it('entrega una práctica resoluble y inicialmente no resuelta por cada lectura', () => {
    expect(reasoning).toHaveLength(68);
    for (const exercise of reasoning) {
      const initial = createInitialReasoningAttempt(exercise.activity);
      expect(validateReasoningAttempt(exercise.activity, initial).allPassed, `${exercise.id} empieza resuelta`).toBe(false);
      expect(validateReasoningAttempt(exercise.activity, solvedAttempt(exercise.activity)).allPassed, `${exercise.id} no acepta su modelo correcto`).toBe(true);
    }
  });

  it('las prácticas generadas usan el contenido de su lección y no una plantilla genérica repetida', () => {
    const kinds = new Set<string>();
    for (const exercise of reasoning.filter((item) => !customIds.has(item.id))) {
      const reading = readings.find((item) => item.id === exercise.relatedLessonId);
      expect(reading, `Falta la lectura de ${exercise.id}`).toBeDefined();
      if (!reading || reading.type !== 'reading') continue;
      kinds.add(exercise.activity.kind);
      expect(JSON.stringify(exercise.activity), `${exercise.id} no incorpora su modelo mental`).toContain(reading.sections[0].content.slice(0, 40));
      expect(exercise.hints.join(' ')).not.toContain('return ');
    }
    expect(kinds).toEqual(new Set(['sequence', 'decision-table', 'dependency-map']));
  });

  it('mantiene ids únicos y tres pistas graduadas sin revelar código final', () => {
    expect(new Set(reasoning.map((item) => item.id)).size).toBe(68);
    for (const exercise of reasoning) {
      expect(exercise.hints.map((hint) => hint.level)).toEqual([1, 2, 3]);
      expect(exercise.hints.some((hint) => /return\s|customElements\.define|emitEvent\s*\(/.test(hint.text))).toBe(false);
    }
  });
});
