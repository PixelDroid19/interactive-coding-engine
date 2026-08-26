import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './course';

describe('recorrido guiado completo de Open Cells', () => {
  const lessons = Object.values(OPEN_CELLS_SCRIMS).sort((left, right) => left.id.localeCompare(right.id));

  it('registra 68 clases separadas con lectura, razonamiento y depuración', () => {
    expect(lessons).toHaveLength(68);
    for (const module of OPEN_CELLS_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 4) {
        expect(module.items.slice(index, index + 4).map((item) => item.type)).toEqual([
          'scrim', 'reading', 'reasoning', 'debugging',
        ]);
      }
    }
  });

  it('cada cinta demuestra una respuesta que pasa y devuelve un starter que falla', async () => {
    for (const lesson of lessons) {
      const challenge = lesson.challenges[0];
      expect(challenge, `${lesson.id} no tiene reto pausado`).toBeTruthy();
      const completeSnapshot = lesson.snapshots
        .filter((snapshot) => snapshot.timestamp <= challenge.timestamp - 7_000)
        .at(-1)?.workspace;
      const starterSnapshot = lesson.snapshots.at(-1)?.workspace;
      expect(completeSnapshot, `${lesson.id} no conserva la demostración completa`).toBeTruthy();
      expect(starterSnapshot, `${lesson.id} no conserva el starter`).toBeTruthy();

      const demonstrated = await runChallengeValidation(challenge, completeSnapshot!);
      const starter = await runChallengeValidation(challenge, starterSnapshot!);
      expect(demonstrated.allPassed, `${lesson.id} demuestra código que no supera su propio reto`).toBe(true);
      expect(starter.allPassed, `${lesson.id} entrega un starter ya resuelto`).toBe(false);
    }
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
