import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from '../../curriculum/open-cells/lessonWorkspaces';
import { OPEN_CELLS_ARTIFACTS } from '../../curriculum/open-cells/lessonProjects';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';
import { auditCellsProject } from './cellsProjectAudit';
import { createCellsCurriculumPracticeWorkspace } from './cellsCurriculumRecipes';
import type { CellsComponentPracticeStage } from './cellsRecipes';

describe('recipes acumulativas del currículo Cells', () => {
  it('produce componentes visualmente distintos para las familias del curso', () => {
    const lessons = [1, 2, 3, 6, 10, 13, 16, 17, 21, 23, 37];
    const tags = lessons.map((number) => buildCellsPreviewDocument(createOpenCellsLessonWorkspace(number).snapshot).componentDemo?.tagName);
    expect(new Set(tags).size).toBe(lessons.length);
  });

  it('reutiliza fuentes anteriores mediante imports locales', () => {
    const product = createOpenCellsLessonWorkspace(6).snapshot;
    expect(product.files['src/components/academy-action-button.js']).toBeDefined();
    expect(product.files['src/components/academy-status-badge.js']).toBeDefined();
    expect(product.files['src/academy-product-card.js'].content).toContain("from './components/academy-action-button.js'");
    expect(product.files['src/academy-product-card.js'].content).toContain("from './components/academy-status-badge.js'");

    const list = createOpenCellsLessonWorkspace(16).snapshot;
    expect(list.files['src/components/academy-product-card.js']).toBeDefined();
    expect(list.files['src/academy-product-list.js'].content).toContain("from './components/academy-product-card.js'");
  });

  it('mantiene preview ejecutable para todas las lecciones', () => {
    for (let number = 1; number <= 68; number += 1) {
      const preview = buildCellsPreviewDocument(createOpenCellsLessonWorkspace(number).snapshot);
      expect(preview.html, `preview vacío en ${number}`).toContain('<!doctype html>');
      if (number <= 38) expect(preview.componentDemo, `falta demo de componente en ${number}`).toBeDefined();
      else expect(preview.componentDemo, `la app ${number} se trató como componente`).toBeUndefined();
    }
  });

  it('mantiene los contratos de composición y propiedades Cells en todos los componentes acumulativos', () => {
    for (let number = 1; number <= 38; number += 1) {
      const workspace = createOpenCellsLessonWorkspace(number).snapshot;
      const source = Object.values(workspace.files).find((file) => (
        /^src\/[^/]+\.js$/.test(file.path) && file.content.includes('WidgetMixin(ScopedElementsMixin(LitElement))')
      ))?.content;

      expect(source, `falta host Cells en ${number}`).toBeDefined();
      expect(source, `properties no usa getter en ${number}`).toMatch(/static get properties\(\)\s*\{/);
      expect(source, `scopedElements no conserva super en ${number}`).toContain('...super.scopedElements');
    }
  });

  it('abre páginas y servicios diferentes dentro de la aplicación acumulativa', () => {
    const focuses = [
      [44, 'favorites', 'app/pages/academy-favorites-page/academy-favorites-page.js'],
      [45, 'cart', 'app/pages/academy-cart-page/academy-cart-page.js'],
      [47, 'not-found', 'app/pages/academy-not-found-page/academy-not-found-page.js'],
      [57, 'search', 'app/pages/academy-search-page/academy-search-page.js'],
      [58, 'search', 'app/data/academy-product-data-manager.js'],
      [63, 'home', 'test/unit/app.test.js'],
      [64, 'home', 'app/locales-app/locales.json'],
      [67, 'home', 'app/config/prod.js'],
    ] as const;

    for (const [lesson, initialTemplate, activeFilePath] of focuses) {
      const workspace = createOpenCellsLessonWorkspace(lesson).snapshot;
      expect(workspace.activeFilePath, `foco incorrecto en ${lesson}`).toBe(activeFilePath);
      expect(workspace.files['app/scripts/app.js'].content).toContain(`initialTemplate: '${initialTemplate}'`);
      expect(auditCellsProject(workspace).results.every((result) => result.passed), `auditoría incompleta en ${lesson}`).toBe(true);
    }
  });

  it('rompe solo el contrato de cada misión en artefactos diferentes', () => {
    const practices: Array<[string, CellsComponentPracticeStage, string[]]> = [
      ['status-badge', 'scaffold', ['package-contract']],
      ['product-card', 'composition', ['scoped-components', 'public-event']],
      ['user-summary', 'api', ['public-property', 'public-event']],
      ['notice-banner', 'styles', ['style-pair']],
      ['product-list', 'i18n', ['locale-parity', 'locale-placeholders']],
      ['search-filter', 'demo', ['demo-public-entry', 'demo-controls-property']],
      ['language-switcher', 'tests', ['test-public-event']],
      ['catalog-shell', 'delivery', ['metadata-contract', 'readme-consumer-path']],
    ];

    for (const [artifactId, stage, expectedFailures] of practices) {
      const workspace = createCellsCurriculumPracticeWorkspace(OPEN_CELLS_ARTIFACTS[artifactId], stage).snapshot;
      const failures = auditCellsProject(workspace).results.filter((result) => !result.passed).map((result) => result.id);
      expect(failures, `${artifactId}:${stage}`).toEqual(expectedFailures);
      expect(buildCellsPreviewDocument(workspace).componentDemo?.tagName).toBe(OPEN_CELLS_ARTIFACTS[artifactId].tagName);
    }
  });

  it('construye las pruebas del navegador desde el contrato del artefacto actual', () => {
    const product = createCellsCurriculumPracticeWorkspace(OPEN_CELLS_ARTIFACTS['product-card'], 'composition').snapshot;
    const preview = buildCellsPreviewDocument(product, { runContractTests: true, testRunId: 'product-contract' });

    expect(preview.html).toContain('const propertyName = "productName"');
    expect(preview.html).toContain('const eventName = "academy-product-card-select"');
    expect(preview.html).toContain('const expectedScopedTags = ["academy-action-button","academy-status-badge"]');
    expect(preview.html).not.toContain('element.learnerName');
    expect(preview.html).not.toContain("addEventListener('academy-learning-card-continue'");
  });
});
