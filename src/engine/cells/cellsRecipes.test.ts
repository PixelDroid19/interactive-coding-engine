import { describe, expect, it } from 'vitest';
import { createCellsComponentWorkspace } from './cellsRecipes';

describe('createCellsComponentWorkspace', () => {
  const workspace = createCellsComponentWorkspace({
    name: 'academy-learning-card',
    namespace: '@open-cells-learning',
  });

  it('crea un proyecto Cells completo y editable en el navegador', () => {
    expect(Object.keys(workspace.snapshot.files)).toEqual(expect.arrayContaining([
      'package.json',
      'README.md',
      'custom-elements.json',
      'index.html',
      'src/academy-learning-card.js',
      'src/locales/en.js',
      'src/locales/es.js',
      'demo/index.html',
      'test/unit/academy-learning-card.test.js',
      'types/open-cells.d.ts',
    ]));
    expect(workspace.snapshot.activeFilePath).toBe('src/academy-learning-card.js');
  });

  it('usa contratos Cells reales, dependencias scoped y composición por mixins', () => {
    const source = workspace.snapshot.files['src/academy-learning-card.js'].content;
    expect(source).toContain("from 'lit'");
    expect(source).toContain("from '@open-wc/scoped-elements/lit-element.js'");
    expect(source).toContain("WidgetMixin");
    expect(source).toContain("OpenCellsTypeText");
    expect(source).toContain("OpenCellsButtonDefault");
    expect(source).toContain('WidgetMixin(ScopedElementsMixin(LitElement))');
    expect(source).toContain("'open-cells-type-text': OpenCellsTypeText");
    expect(source).toContain("'open-cells-button-default': OpenCellsButtonDefault");
  });

  it('traduce todo texto visible y emite un evento público con detalle', () => {
    const source = workspace.snapshot.files['src/academy-learning-card.js'].content;
    expect(source).toContain("this.t('learningCard.title', { name: this.learnerName })");
    expect(source).toContain("this.t('learningCard.continue')");
    expect(source).not.toMatch(/this\.t\([^)]*\)\s*\|\|/);
    expect(source).toContain("this.emitEvent('continue'");
  });

  it('mantiene las claves y placeholders sincronizados entre inglés y español', () => {
    const english = workspace.snapshot.files['src/locales/en.js'].content;
    const spanish = workspace.snapshot.files['src/locales/es.js'].content;
    for (const key of ['learningCard.title', 'learningCard.description', 'learningCard.continue']) {
      expect(english).toContain(`'${key}'`);
      expect(spanish).toContain(`'${key}'`);
    }
    expect(english).toContain('${name}');
    expect(spanish).toContain('${name}');
  });

  it('declara solo las dependencias directas del componente', () => {
    const manifest = JSON.parse(workspace.snapshot.files['package.json'].content);
    expect(manifest.name).toBe('@open-cells-learning/academy-learning-card');
    expect(manifest.types).toBe('./types/open-cells.d.ts');
    expect(manifest.dependencies).toEqual({
      '@open-wc/scoped-elements': '3.0.10',
      '@webcomponents/scoped-custom-element-registry': '0.0.10',
      lit: '3.3.3',
    });
    expect(manifest.scripts).toEqual({
      dev: 'cells component:dev',
      test: 'cells component:test',
      'test:coverage': 'cells component:test --coverage',
      locales: 'cells component:locales',
      documentation: 'cells component:documentation',
      sass: 'cells component:sass',
      build: 'cells component:build:demo',
    });
  });
});
