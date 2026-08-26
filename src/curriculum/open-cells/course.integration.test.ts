import { describe, expect, it } from 'vitest';
import { COMPONENT_COURSE } from '../web-components-lit/course';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './course';

describe('curso Open Cells', () => {
  it('es independiente del curso de Web Components y Lit', () => {
    expect(OPEN_CELLS_COURSE.id).toBe('course-open-cells');
    expect(OPEN_CELLS_COURSE.id).not.toBe(COMPONENT_COURSE.id);
    const litIds = new Set(COMPONENT_COURSE.modules.flatMap((module) => module.items.map((item) => item.id)));
    expect(OPEN_CELLS_COURSE.modules.flatMap((module) => module.items).some((item) => litIds.has(item.id))).toBe(false);
  });

  it('entrega 68 unidades progresivas y una práctica de proyecto en cada lectura', () => {
    const allItems = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items);
    const items = allItems.filter((item) => item.type === 'reading');
    expect(items).toHaveLength(68);
    const practice = items[5];
    expect(practice?.type).toBe('reading');
    if (practice?.type === 'reading') {
      expect(practice.handsOnLab).toBe('open-cells-playground');
      expect(practice.sections).toHaveLength(3);
      expect(practice.frequentQuestions?.length).toBeGreaterThan(0);
    }
    const appPractice = items[45];
    expect(appPractice?.type).toBe('reading');
    if (appPractice?.type === 'reading') expect(appPractice.handsOnLab).toBe('open-cells-app-playground');
    expect(items.filter((item) => item.type === 'reading' && item.handsOnLab)).toHaveLength(68);
    expect(items[0]?.type === 'reading' && items[0].handsOnLab).toBe('open-cells-component-scaffold-playground');
    expect(items[12]?.type === 'reading' && items[12].handsOnLab).toBe('open-cells-component-styles-playground');
    expect(items[13]?.type === 'reading' && items[13].handsOnLab).toBe('open-cells-component-styles-playground');
    expect(items[22]?.type === 'reading' && items[22].handsOnLab).toBe('open-cells-component-i18n-playground');
    expect(items[27]?.type === 'reading' && items[27].handsOnLab).toBe('open-cells-component-api-playground');
    expect(items[30]?.type === 'reading' && items[30].handsOnLab).toBe('open-cells-component-demo-playground');
    expect(items[31]?.type === 'reading' && items[31].handsOnLab).toBe('open-cells-component-tests-playground');
    expect(items[37]?.type === 'reading' && items[37].handsOnLab).toBe('open-cells-component-delivery-playground');
    expect(items[53]?.type === 'reading' && items[53].handsOnLab).toBe('open-cells-channels-playground');
    expect(items[61]?.type === 'reading' && items[61].handsOnLab).toBe('open-cells-data-playground');
    expect(items[67]?.type === 'reading' && items[67].handsOnLab).toBe('open-cells-delivery-playground');
    expect(allItems.filter((item) => item.type === 'reasoning')).toHaveLength(68);
    expect(allItems.filter((item) => item.type === 'debugging')).toHaveLength(0);
  });

  it('incluye una primera clase guiada que prepara el laboratorio real', () => {
    const lesson = OPEN_CELLS_SCRIMS['open-cells-06'];
    expect(lesson).toBeDefined();
    expect(lesson.templateId).toBe('cells-component');
    expect(lesson.narrationMode).toBe('silent');
    expect(lesson.audioTrack?.url).toBeUndefined();
    expect(lesson.challenges).toHaveLength(1);
    expect(lesson.challenges[0].hints).toHaveLength(3);

    const items = OPEN_CELLS_COURSE.modules[0].items;
    const lessonIndex = items.findIndex((item) => item.type === 'scrim' && item.id === lesson.id);
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    expect(items.slice(lessonIndex + 1).some((item) => item.type === 'reading' && item.id === 'open-cells-06-lectura')).toBe(true);
    expect(items.slice(lessonIndex + 1).some((item) => item.type === 'reading' && item.handsOnLab === 'open-cells-playground')).toBe(true);
  });
});
