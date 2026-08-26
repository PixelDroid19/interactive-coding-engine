import { describe, expect, it } from 'vitest';
import { Course } from '../types/curriculum';
import { ScrimLessonData } from '../types/scrim';
import { FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS } from './fundamentos/course';
import { JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS } from './javascript/course';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS } from './web-components-lit/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './open-cells/course';

const catalogs: Array<[Course, Record<string, ScrimLessonData>]> = [
  [FUNDAMENTOS_COURSE, FUNDAMENTOS_SCRIMS],
  [JAVASCRIPT_COURSE, JAVASCRIPT_SCRIMS],
  [COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS],
  [OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS],
];

describe('formato legible del código curricular', () => {
  it('no entrega archivos largos minificados en clases ni laboratorios', () => {
    for (const [course, scrims] of catalogs) {
      for (const lesson of Object.values(scrims)) {
        for (const file of Object.values(lesson.initialWorkspace.files)) {
          if (file.content.length <= 100) continue;
          expect(file.content.split('\n').length, `${lesson.id}/${file.path} aparece en una sola línea`).toBeGreaterThan(2);
        }

        for (const event of lesson.events) {
          if (event.type !== 'code-change' || !event.fullContent || event.fullContent.length <= 100) continue;
          expect(event.fullContent.split('\n').length, `${lesson.id}/${event.filePath} se escribe minificado`).toBeGreaterThan(2);
        }
      }

      for (const item of course.modules.flatMap((module) => module.items)) {
        if (item.type !== 'debugging') continue;
        for (const file of Object.values(item.initialWorkspace.files)) {
          if (file.content.length <= 100) continue;
          expect(file.content.split('\n').length, `${item.id}/${file.path} aparece minificado`).toBeGreaterThan(2);
        }
      }
    }
  });
});
