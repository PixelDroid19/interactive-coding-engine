import { describe, expect, it } from 'vitest';
import { COMPONENT_COURSE } from '../web-components-lit/course';
import { R2_AUDIO_BY_LESSON } from '../../config/r2Audio';
import { reconstructWorkspaceAt } from '../../engine/eventLog';
import { OPEN_CELLS_COURSE, OPEN_CELLS_SCRIMS } from './course';

describe('curso Open Cells', () => {
  it('es independiente del curso de Web Components y Lit', () => {
    expect(OPEN_CELLS_COURSE.id).toBe('course-open-cells');
    expect(OPEN_CELLS_COURSE.id).not.toBe(COMPONENT_COURSE.id);
    const litIds = new Set(COMPONENT_COURSE.modules.flatMap((module) => module.items.map((item) => item.id)));
    expect(OPEN_CELLS_COURSE.modules.flatMap((module) => module.items).some((item) => litIds.has(item.id))).toBe(false);
  });

  it('entrega 84 unidades progresivas y laboratorios de proyecto al cerrar cada bloque', () => {
    const allItems = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items);
    const items = allItems.filter((item) => item.type === 'reading');
    expect(items).toHaveLength(84);
    const practice = items[5];
    expect(practice?.type).toBe('reading');
    if (practice?.type === 'reading') {
      expect(practice.handsOnLab).toBe('open-cells-playground');
      expect(practice.sections.length).toBeGreaterThanOrEqual(5);
      expect(practice.frequentQuestions?.length).toBeGreaterThan(0);
    }
    const appPractice = items[45];
    expect(appPractice?.type).toBe('reading');
    if (appPractice?.type === 'reading') expect(appPractice.handsOnLab).toBe('open-cells-app-playground');
    expect(items.filter((item) => item.type === 'reading' && item.handsOnLab).map((item) => item.id)).toEqual([
      'open-cells-05-lectura',
      'open-cells-06-lectura',
      'open-cells-10-lectura',
      'open-cells-14-lectura',
      'open-cells-22-lectura',
      'open-cells-27-lectura',
      'open-cells-30-lectura',
      'open-cells-31-lectura',
      'open-cells-34-lectura',
      'open-cells-38-lectura',
      'open-cells-46-lectura',
      'open-cells-54-lectura',
      'open-cells-62-lectura',
      'open-cells-68-lectura',
    ]);
    expect(items[4]?.type === 'reading' && items[4].handsOnLab).toBe('open-cells-component-scaffold-playground');
    expect(items[13]?.type === 'reading' && items[13].handsOnLab).toBe('open-cells-component-styles-playground');
    expect(items[26]?.type === 'reading' && items[26].handsOnLab).toBe('open-cells-component-i18n-playground');
    expect(items[30]?.type === 'reading' && items[30].handsOnLab).toBe('open-cells-component-demo-playground');
    expect(items[33]?.type === 'reading' && items[33].handsOnLab).toBe('open-cells-component-tests-playground');
    expect(items[37]?.type === 'reading' && items[37].handsOnLab).toBe('open-cells-component-delivery-playground');
    expect(items[45]?.type === 'reading' && items[45].handsOnLab).toBe('open-cells-app-playground');
    expect(items[53]?.type === 'reading' && items[53].handsOnLab).toBe('open-cells-channels-playground');
    expect(items[61]?.type === 'reading' && items[61].handsOnLab).toBe('open-cells-data-playground');
    expect(items[67]?.type === 'reading' && items[67].handsOnLab).toBe('open-cells-delivery-playground');
    expect(allItems.filter((item) => item.type === 'reasoning')).toHaveLength(84);
    expect(allItems.filter((item) => item.type === 'debugging')).toHaveLength(0);
    for (const reading of items) {
      if (reading.type !== 'reading') continue;
      expect(reading.sections.some((section) => section.title === 'Recorrido de archivos'), reading.id).toBe(true);
      expect(reading.sections.some((section) => section.title === 'Antes de editar'), reading.id).toBe(true);
    }
  });

  it('cubre las capacidades de producción que completan componentes y aplicaciones Cells', () => {
    const titles = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items)
      .filter((item) => item.type === 'reading')
      .map((item) => item.title.toLocaleLowerCase('es'));
    for (const topic of ['ciclo de vida', 'contexto', 'imágenes e iconos', 'tema', 'interceptores', 'rutas delegadas', 'service worker', 'feature flags', 'observabilidad', 'analítica', 'rendimiento', 'ci/cd', 'migración']) {
      expect(titles.some((title) => title.includes(topic)), topic).toBe(true);
    }
  });

  it('incluye una primera clase guiada diversa que prepara el laboratorio real', () => {
    const lesson = OPEN_CELLS_SCRIMS['open-cells-06'];
    expect(lesson).toBeDefined();
    expect(lesson.templateId).toBe('cells-component');
    expect(lesson.narrationMode).toBe('audio');
    expect(lesson.audioTrack?.url).toBe(R2_AUDIO_BY_LESSON['open-cells-06'].url);
    expect(lesson.challenges).toHaveLength(1);
    const challenge = lesson.challenges[0];
    const starterPath = 'src/academy-product-card.js';
    const instructorAtChallenge = reconstructWorkspaceAt(
      lesson.initialWorkspace,
      lesson.events,
      lesson.snapshots,
      challenge.timestamp,
    ).workspace.files[starterPath].content;
    expect(challenge.instructions).toContain('producto');
    expect(challenge.starterCodeDiff?.[starterPath]).toContain('TODO: registra el botón');
    expect(challenge.starterCodeDiff?.[starterPath]).toContain('TODO: comunica la selección');
    expect(challenge.starterCodeDiff?.[starterPath]).not.toBe(instructorAtChallenge);
    expect(lesson.initialWorkspace.files['src/academy-product-card.js']).toBeDefined();
    expect(lesson.initialWorkspace.files['src/components/academy-action-button.js']).toBeDefined();

    const items = OPEN_CELLS_COURSE.modules[0].items;
    const lessonIndex = items.findIndex((item) => item.type === 'scrim' && item.id === lesson.id);
    expect(lessonIndex).toBeGreaterThanOrEqual(0);
    expect(items.slice(lessonIndex + 1).some((item) => item.type === 'reading' && item.id === 'open-cells-06-lectura')).toBe(true);
    expect(items.slice(lessonIndex + 1).some((item) => item.type === 'reading' && item.handsOnLab === 'open-cells-playground')).toBe(true);
  });
});
