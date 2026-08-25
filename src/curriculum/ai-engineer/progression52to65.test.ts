import { describe, expect, it } from 'vitest';
import { AI_SPECS } from './modules';

describe('progresión de seguridad a herramientas multimodales', () => {
  const specs = AI_SPECS.filter((spec) => spec.number >= 52 && spec.number <= 65);

  it('completa las lecciones 52 a 65 sin saltos', () => {
    expect(specs.map((spec) => spec.number)).toEqual(Array.from({ length: 14 }, (_, index) => index + 52));
    expect(AI_SPECS).toHaveLength(79);
  });

  it('solo usa habilidades previamente enseñadas en todo el curso', () => {
    const taught = new Set<string>();
    for (const spec of AI_SPECS) {
      for (const required of spec.skillsRequired) {
        expect(taught.has(required), `${spec.number} exige ${required} antes de enseñarlo`).toBe(true);
      }
      spec.skillsIntroduced.forEach((skill) => taught.add(skill));
    }
  });

  it('mantiene contenido, fuentes y prácticas en ambos lenguajes', () => {
    for (const spec of specs) {
      expect(spec.script).toHaveLength(4);
      expect(spec.reading.sections.length).toBeGreaterThanOrEqual(4);
      expect(spec.reading.sourceIds.length).toBeGreaterThanOrEqual(2);
      expect(spec.practice.cases.length).toBeGreaterThanOrEqual(2);
      expect(spec.javascript.starter).not.toBe(spec.javascript.solution);
      expect(spec.python.starter).not.toBe(spec.python.solution);
    }
  });

  it('deja explícita la frontera navegador y backend para claves', () => {
    const lesson = AI_SPECS.find((spec) => spec.number === 54);
    const content = lesson?.reading.sections.map((section) => section.content).join(' ') ?? '';
    expect(content).toContain('solo en memoria');
    expect(content).toContain('backend');
    expect(content).toContain('localStorage');
  });

  it('no crea narración de audio para contenido multimodal', () => {
    const multimodal = specs.filter((spec) => spec.module === 11);
    expect(multimodal).toHaveLength(4);
    expect(multimodal.find((spec) => spec.number === 63)?.reading.sections.some((section) => section.content.includes('no usa audio como narración'))).toBe(true);
  });
});
