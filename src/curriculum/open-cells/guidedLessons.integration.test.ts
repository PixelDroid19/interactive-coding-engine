import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ScrimEvent } from '../../types/scrim';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './course';

describe('recorrido guiado completo de Open Cells', () => {
  const lessons = Object.values(OPEN_CELLS_SCRIMS).sort((left, right) => left.id.localeCompare(right.id));

  it('registra 68 clases separadas con lectura, razonamiento y laboratorio de proyecto', () => {
    expect(lessons).toHaveLength(68);
    for (const module of OPEN_CELLS_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 3) {
        const block = module.items.slice(index, index + 3);
        expect(block.map((item) => item.type)).toEqual([
          'scrim', 'reading', 'reasoning',
        ]);
        expect(block[1]?.type === 'reading' && block[1].handsOnLab).toBeTruthy();
      }
    }
  });

  it('las cintas no desvían la práctica hacia checkpoints genéricos', () => {
    for (const lesson of lessons) {
      expect(Object.keys(lesson.initialWorkspace.files).some((path) => path.includes('/checkpoints/'))).toBe(false);
      if (lesson.id !== 'open-cells-06') expect(lesson.challenges).toHaveLength(0);
    }
  });

  it('enseña sobre varios archivos reales antes del laboratorio de proyecto', () => {
    for (const lesson of lessons) {
      const projectEvents = lesson.events.filter((event): event is Extract<ScrimEvent, { type: 'file-switch' | 'code-change' }> => (
        (event.type === 'file-switch' || event.type === 'code-change')
        && !event.filePath.includes('/checkpoints/')
      ));
      const projectPaths = [...new Set(projectEvents.map((event) => event.filePath))];
      const projectWrites = projectEvents.filter((event) => event.type === 'code-change');
      expect(projectPaths.length, `${lesson.id} no recorre un grafo real`).toBeGreaterThanOrEqual(3);
      expect(projectWrites.length, `${lesson.id} no construye ningún archivo del proyecto`).toBeGreaterThan(0);
      expect(lesson.events.some((event) => event.type === 'run-code'), `${lesson.id} no ejecuta el proyecto`).toBe(true);
    }
  });

  it('las unidades clave construyen el componente, la demo y la aplicación archivo por archivo', () => {
    const pathsFor = (id: string) => new Set(OPEN_CELLS_SCRIMS[id].events.flatMap((event) => (
      (event.type === 'file-switch' || event.type === 'code-change') ? [event.filePath] : []
    )));
    expect([...pathsFor('open-cells-03')]).toEqual(expect.arrayContaining([
      'package.json', 'index.js', 'academy-learning-card.js', 'src/academy-learning-card.js',
    ]));
    expect([...pathsFor('open-cells-31')]).toEqual(expect.arrayContaining([
      'demo/index.html', 'demo/demo.js', 'demo/demo-build.js',
    ]));
    expect([...pathsFor('open-cells-39')]).toEqual(expect.arrayContaining([
      'index.html', 'app/scripts/app.js', 'app/scripts/app-routes.js', 'app/pages/academy-home-page/academy-home-page.js',
    ]));
  });

  it('mantiene 68 guiones hablados sincronizados con los subtítulos', () => {
    for (const lesson of lessons) {
      const number = lesson.id.replace('open-cells-', '');
      const script = readFileSync(`docs/guiones/open-cells/${number}.md`, 'utf8');
      expect(script).toContain(`lesson: ${lesson.id}`);
      for (const cue of lesson.audioTrack.narrationScript ?? []) {
        expect(script, `${lesson.id} no contiene el subtítulo completo`).toContain(cue.text);
      }
    }
  });
});
