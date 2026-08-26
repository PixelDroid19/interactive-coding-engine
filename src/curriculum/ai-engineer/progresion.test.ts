import { describe, expect, it } from 'vitest';
import { AI_SPECS } from './modules';
import { buildAiLessonBundle } from './factory';

// Progresión del curso: 39 clases en 7 fases que construyen el TutorLocal.
const NUMERO_DE_CLASES = 39;

describe('progresión AI Engineer por fases', () => {
  it('contiene exactamente las clases en orden continuo', () => {
    expect(AI_SPECS.map((spec) => spec.number)).toEqual(
      Array.from({ length: NUMERO_DE_CLASES }, (_, index) => index + 1),
    );
  });

  it('organiza las siete fases en orden no decreciente', () => {
    const fases = AI_SPECS.map((spec) => spec.module);
    expect(fases[0]).toBe(0);
    expect(Math.max(...fases)).toBe(6);
    for (let index = 1; index < fases.length; index++) {
      expect(fases[index], `la clase ${index + 1} retrocede de fase`).toBeGreaterThanOrEqual(fases[index - 1]);
    }
  });

  it('solo requiere habilidades que ya fueron enseñadas', () => {
    const taught = new Set<string>();
    for (const spec of AI_SPECS) {
      expect(spec.skillsRequired.filter((skill) => !taught.has(skill)), `Clase ${spec.number}`).toEqual([]);
      spec.skillsIntroduced.forEach((skill) => taught.add(skill));
    }
  });

  it('declara una capacidad única del chat y cómo se integra', () => {
    const nombres = new Set<string>();
    for (const spec of AI_SPECS) {
      expect(spec.capacidad.nombre.trim().length, `Clase ${spec.number} sin capacidad`).toBeGreaterThan(2);
      expect(nombres.has(spec.capacidad.nombre), `Capacidad repetida en clase ${spec.number}: ${spec.capacidad.nombre}`).toBe(false);
      nombres.add(spec.capacidad.nombre);
      expect(spec.integracion, `Clase ${spec.number} sin integración`).toMatch(/chat|tutorlocal/i);
      expect(spec.capacidad.descripcion.trim().length, `Clase ${spec.number} sin descripción de capacidad`).toBeGreaterThan(10);
    }
  });

  it('cada práctica usa dos o más entradas y tiene fuentes y subtítulos humanos', () => {
    for (const spec of AI_SPECS) {
      const bundle = buildAiLessonBundle(spec);
      expect(spec.practice.cases.length, `Clase ${spec.number}`).toBeGreaterThanOrEqual(2);
      expect(bundle.reading.sources?.length, `Clase ${spec.number}`).toBeGreaterThanOrEqual(2);
      expect(bundle.lesson.audioTrack?.narrationScript?.map((cue) => cue.text), `Clase ${spec.number}`).toEqual(spec.script);
      expect(bundle.lesson.narrationMode).toBe('silent');
    }
  });
});
