import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COMPONENT_COURSE, COMPONENT_COURSE_SCRIMS, COMPONENT_COURSE_SPECS } from './course';

describe('curso profesional de Web Components y Lit', () => {
  const items = COMPONENT_COURSE.modules.flatMap((module) => module.items);
  const lessons = items.filter((item) => item.type === 'scrim');

  it('ofrece 40 unidades completas y separadas de los otros cursos', () => {
    expect(COMPONENT_COURSE.id).toBe('course-web-components-lit');
    expect(COMPONENT_COURSE_SPECS).toHaveLength(40);
    expect(Object.keys(COMPONENT_COURSE_SCRIMS)).toHaveLength(40);
    expect(lessons).toHaveLength(40);
    expect(items.filter((item) => item.type === 'reading')).toHaveLength(40);
    expect(items.filter((item) => item.type === 'reasoning')).toHaveLength(40);
    expect(items.filter((item) => item.type === 'debugging')).toHaveLength(40);
  });

  it('enseña Web Components antes de importar Lit', () => {
    const nativeSource = COMPONENT_COURSE_SPECS.slice(0, 14).map((spec) => `${spec.example}\n${spec.starter}`).join('\n');
    const litSource = COMPONENT_COURSE_SPECS.slice(14).map((spec) => `${spec.example}\n${spec.starter}`).join('\n');
    expect(nativeSource).not.toMatch(/from\s+['"]lit/);
    expect(litSource).toMatch(/from\s+['"]lit/);
  });

  it('usa solamente JavaScript en los workspaces del estudiante', () => {
    for (const lesson of Object.values(COMPONENT_COURSE_SCRIMS)) {
      expect(Object.values(lesson.initialWorkspace.files).some((file) => /\.tsx?$/.test(file.path))).toBe(false);
      expect(lesson.templateId).toBe('lit');
    }
  });

  it('enseña todos los requisitos antes de pedirlos', () => {
    const learned = new Set<string>();
    for (const spec of COMPONENT_COURSE_SPECS) {
      expect(spec.skillsRequired.filter((skill) => !learned.has(skill)), spec.title).toEqual([]);
      spec.skillsIntroduced.forEach((skill) => learned.add(skill));
    }
  });

  it('cada unidad construye, lee, razona y depura sin entregar la solución', () => {
    for (const module of COMPONENT_COURSE.modules) {
      for (let index = 0; index < module.items.length; index += 4) {
        const group = module.items.slice(index, index + 4);
        expect(group.map((item) => item.type)).toEqual(['scrim', 'reading', 'reasoning', 'debugging']);
        const lessonItem = group[0];
        if (lessonItem?.type !== 'scrim') continue;
        const lessonData = COMPONENT_COURSE_SCRIMS[lessonItem.scrimDataId];
        expect(lessonData.challenges).toHaveLength(1);
        expect(lessonData.challenges[0].solutionFiles).toBeUndefined();
        expect(lessonData.challenges[0].tests.some((test) => test.validatorType === 'browser-script')).toBe(true);
        expect(lessonData.challenges[0].hints.map((hint) => hint.text).join(' ')).not.toMatch(/soluci[oó]n\s*:/i);
        const reading = group[1];
        if (reading?.type === 'reading') {
          expect(reading.sections.length).toBeGreaterThanOrEqual(7);
          expect(reading.sources?.length).toBeGreaterThan(0);
          expect(reading.sources?.every((entry) => /developer\.mozilla\.org|lit\.dev|html\.spec\.whatwg\.org|modern-web\.dev/.test(entry.url))).toBe(true);
        }
        const debug = group[3];
        if (debug?.type === 'debugging') expect('solutionFiles' in debug).toBe(false);
      }
    }
  });

  it('explica super antes del ciclo de Lit y vuelve a conectarlo causalmente', () => {
    expect(COMPONENT_COURSE_SPECS[1].title).toContain('super');
    expect(COMPONENT_COURSE_SPECS[1].script.join(' ')).toMatch(/clase base|HTMLElement|cimientos/i);
    expect(COMPONENT_COURSE_SPECS[21].title).toContain('super');
    expect(COMPONENT_COURSE_SPECS[21].script.join(' ')).toMatch(/LitElement|heredad|base/i);
  });

  it('mantiene una voz humana sin repetir las mismas transiciones en todo el curso', () => {
    expect(new Set(COMPONENT_COURSE_SPECS.map((spec) => spec.script[2])).size).toBeGreaterThanOrEqual(8);
    expect(new Set(COMPONENT_COURSE_SPECS.map((spec) => spec.script[5])).size).toBeGreaterThanOrEqual(8);
  });

  it('mantiene válidas todas las expresiones de comprobación curricular', () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      for (const test of [...spec.tests, ...spec.debug.tests]) {
        if (test.validatorType === 'source-regex') {
          expect(() => new RegExp(test.regexPattern || '', 'i'), `${spec.number}: ${test.description}`).not.toThrow();
        }
      }
    }
  });

  it('exporta un guion hablado completo por cada clase', () => {
    for (const spec of COMPONENT_COURSE_SPECS) {
      const number = String(spec.number).padStart(2, '0');
      const guion = readFileSync(resolve(process.cwd(), 'docs/guiones/web-components-lit', `${number}.md`), 'utf8');
      expect(guion).toContain(`lesson: componentes-lit-${number}`);
      for (const paragraph of spec.script) expect(guion).toContain(paragraph);
    }
  });
});
