import { describe, expect, it } from 'vitest';
import { AI_SPECS_01_TO_27 } from './modules';
import { buildAiLessonBundle } from './factory';

describe('progresión AI Engineer 1 a 27', () => {
  it('contiene exactamente las primeras 27 clases en orden', () => {
    expect(AI_SPECS_01_TO_27.map((spec) => spec.number)).toEqual(Array.from({ length: 27 }, (_, index) => index + 1));
  });

  it('solo requiere habilidades que ya fueron enseñadas', () => {
    const taught = new Set<string>();
    for (const spec of AI_SPECS_01_TO_27) {
      expect(spec.skillsRequired.filter((skill) => !taught.has(skill)), `Clase ${spec.number}`).toEqual([]);
      spec.skillsIntroduced.forEach((skill) => taught.add(skill));
    }
  });

  it('cada práctica usa dos o más entradas y tiene fuentes y subtítulos humanos', () => {
    for (const spec of AI_SPECS_01_TO_27) {
      const bundle = buildAiLessonBundle(spec);
      expect(spec.practice.cases.length, `Clase ${spec.number}`).toBeGreaterThanOrEqual(2);
      expect(bundle.reading.sources?.length, `Clase ${spec.number}`).toBeGreaterThanOrEqual(2);
      expect(bundle.lesson.audioTrack?.narrationScript?.map((cue) => cue.text), `Clase ${spec.number}`).toEqual(spec.script);
      expect(bundle.lesson.narrationMode).toBe('silent');
    }
  });
});
