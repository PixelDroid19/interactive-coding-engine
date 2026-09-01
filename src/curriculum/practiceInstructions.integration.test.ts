import { describe, expect, it } from 'vitest';
import type { Course } from '../types/curriculum';
import type { ScrimLessonData } from '../types/scrim';
import { splitPracticeCopy } from '../components/practice/practiceCopy';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from './javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './web-components-lit/course';
import { AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS } from './ai-engineer/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './open-cells/course';

type ScrimCatalog = Record<string, ScrimLessonData>;

const catalogs: Array<[Course, ScrimCatalog]> = [
  [FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS],
  [JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS],
  [COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS],
  [AI_ENGINEER_COURSE, AI_ENGINEER_SCRIMS],
  [OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS],
];

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

describe('instrucciones visibles de todas las prácticas', () => {
  it('mantiene la acción inicial en 28 palabras o menos sin perder el contexto', () => {
    for (const [course, scrims] of catalogs) {
      for (const item of course.modules.flatMap((module) => module.items)) {
        if (item.type === 'debugging') {
          const copy = splitPracticeCopy(item.description ?? `Corrige “${item.title}”.`);
          expect(wordCount(copy.action), `${item.id}: depuración demasiado larga`).toBeLessThanOrEqual(28);
        }
        if (item.type === 'reasoning') {
          const copy = splitPracticeCopy(item.activity.prompt, 'last');
          expect(wordCount(copy.action), `${item.id}: razonamiento demasiado largo`).toBeLessThanOrEqual(28);
        }
        if (item.type === 'solo-project') {
          const copy = splitPracticeCopy(item.brief);
          expect(wordCount(copy.action), `${item.id}: proyecto demasiado largo`).toBeLessThanOrEqual(28);
        }
        if (item.type === 'challenge') {
          const action = splitPracticeCopy(item.challenge.instructions.trim().split(/\n\s*\n/)[0]).action;
          expect(wordCount(action), `${item.id}: reto demasiado largo`).toBeLessThanOrEqual(28);
        }
        if (item.type === 'scrim') {
          for (const challenge of scrims[item.scrimDataId].challenges) {
            const action = splitPracticeCopy(challenge.instructions.trim().split(/\n\s*\n/)[0]).action;
            expect(wordCount(action), `${challenge.id}: reto de lección demasiado largo`).toBeLessThanOrEqual(28);
          }
        }
      }
    }
  });
});
