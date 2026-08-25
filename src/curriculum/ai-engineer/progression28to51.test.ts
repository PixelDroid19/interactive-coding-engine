import { describe, expect, it } from 'vitest';
import { AI_SPECS_01_TO_27, AI_SPECS_28_TO_51 } from './modules';

describe('progresión de AI Engineer 28 a 51', () => {
  it('mantiene una secuencia completa sin saltos', () => {
    expect(AI_SPECS_28_TO_51.map((spec) => spec.number)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 28),
    );
  });

  it('solo exige habilidades enseñadas previamente', () => {
    const taught = new Set(AI_SPECS_01_TO_27.flatMap((spec) => spec.skillsIntroduced));

    for (const spec of AI_SPECS_28_TO_51) {
      for (const prerequisite of spec.skillsRequired) {
        expect(taught.has(prerequisite), `${spec.number} exige ${prerequisite} antes de enseñarlo`).toBe(true);
      }
      spec.skillsIntroduced.forEach((skill) => taught.add(skill));
    }
  });

  it('incluye práctica variable, lectura con fuentes y variantes equivalentes', () => {
    for (const spec of AI_SPECS_28_TO_51) {
      expect(spec.practice.cases.length).toBeGreaterThanOrEqual(2);
      expect(spec.reading.sourceIds.length).toBeGreaterThanOrEqual(2);
      expect(spec.javascript.starter).not.toBe(spec.javascript.solution);
      expect(spec.python.starter).not.toBe(spec.python.solution);
      expect(spec.script.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('evalúa embeddings con entradas variadas, no con un vector fijo', () => {
    const embeddingLessons = AI_SPECS_28_TO_51.filter((spec) => spec.module === 5);
    for (const spec of embeddingLessons) {
      const serializedCases = JSON.stringify(spec.practice.cases);
      expect(new Set(spec.practice.cases.map((testCase) => JSON.stringify(testCase.args))).size).toBeGreaterThan(1);
      expect(serializedCases).not.toContain('vectorCorrecto');
    }
  });

  it('enseña recuperación antes de generación y evaluación RAG', () => {
    const skillOrder = AI_SPECS_28_TO_51.flatMap((spec) => spec.skillsIntroduced);
    expect(skillOrder.indexOf('recuperar-y-rerankear')).toBeLessThan(skillOrder.indexOf('generar-con-citas'));
    expect(skillOrder.indexOf('generar-con-citas')).toBeLessThan(skillOrder.indexOf('evaluar-rag'));
  });
});
