import { describe, expect, it } from 'vitest';
import { AI_SPECS } from './modules';

describe('ecosistema y proyecto final, clases 66 a 79', () => {
  const specs = AI_SPECS.filter((spec) => spec.number >= 66);

  it('añade catorce clases sin saltos y deja el proyecto final al cierre', () => {
    expect(specs.map((spec) => spec.number)).toEqual(Array.from({ length: 14 }, (_, index) => index + 66));
    expect(specs.slice(0, 12).every((spec) => spec.module === 12)).toBe(true);
    expect(specs.slice(-2).map((spec) => spec.module)).toEqual([13, 13]);
    expect(specs.at(-1)?.skillsIntroduced).toContain('entregar-capstone-ia');
  });

  it('parte de lo aprendido y llega al capstone por decisiones conectadas', () => {
    const taught = new Set(AI_SPECS.filter((spec) => spec.number < 66).flatMap((spec) => spec.skillsIntroduced));
    for (const spec of specs) {
      spec.skillsRequired.forEach((skill) => expect(taught.has(skill), `${spec.number} exige ${skill} demasiado pronto`).toBe(true));
      spec.skillsIntroduced.forEach((skill) => taught.add(skill));
    }
  });
});
