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
      'src/academy-learning-card.js',
      'locales/locales.json',
      'demo/index.html',
      'demo/basic.html',
      'demo/demo.js',
      'demo/demo-build.js',
      'demo/locales/locales.json',
      'test/unit/locales/locales.json',
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
    expect(source).toContain("AcademyTypeText");
    expect(source).toContain("AcademyActionButton");
    expect(source).toContain('WidgetMixin(ScopedElementsMixin(LitElement))');
    expect(source).toContain('...super.scopedElements');
    expect(source).toContain("'academy-type-text': AcademyTypeText");
    expect(source).toContain("'academy-action-button': AcademyActionButton");
    expect(source).toMatch(/static get properties\(\)\s*\{/);
    expect(source).not.toContain('static properties =');
  });

  it('instala IntlMsg, espera sus recursos y vuelve a renderizar al cambiar el idioma', () => {
    const widgetMixin = workspace.snapshot.files['src/mixins/WidgetMixin.js'].content;
    const intlRuntime = workspace.snapshot.files['src/runtime/academy-intl-msg.js'].content;
    const demo = workspace.snapshot.files['demo/demo.js'].content;

    expect(widgetMixin).toContain("addEventListener('language-update'");
    expect(widgetMixin).toContain("removeEventListener('language-update'");
    expect(widgetMixin).toContain('this.requestUpdate?.()');
    expect(intlRuntime).toContain('export function installIntlMsg');
    expect(intlRuntime).toContain('loadUrlResourcesComplete');
    expect(demo).toContain("import { installIntlMsg } from '../src/runtime/academy-intl-msg.js'");
    expect(demo).toContain('const intlMsg = installIntlMsg');
    expect(demo).toContain('await intlMsg.loadUrlResourcesComplete');
    expect(demo.indexOf('await intlMsg.loadUrlResourcesComplete')).toBeLessThan(demo.indexOf("await import('../academy-learning-card.js')"));
  });

  it('consume el css.js generado desde el SCSS en lugar de duplicar estilos dentro del componente', () => {
    const source = workspace.snapshot.files['src/academy-learning-card.js'].content;
    const scss = workspace.snapshot.files['src/academy-learning-card.scss'].content;
    const runtimeStyles = workspace.snapshot.files['src/academy-learning-card.css.js'].content;

    expect(source).toContain("import styles from './academy-learning-card.css.js';");
    expect(source).toContain('static styles = styles;');
    expect(source).not.toContain('static styles = css`');
    expect(source).not.toMatch(/import\s*\{[^}]*\bcss\b[^}]*\}\s*from\s*['"]lit['"]/);
    expect(runtimeStyles).toContain(scss.trim());
  });

  it('traduce todo texto visible y emite un evento público con detalle', () => {
    const source = workspace.snapshot.files['src/academy-learning-card.js'].content;
    expect(source).toContain("this.t('learningCard.title', { name: this.learnerName })");
    expect(source).toContain("this.t('learningCard.continue')");
    expect(source).not.toMatch(/this\.t\([^)]*\)\s*\|\|/);
    expect(source).toContain("this.emitEvent('continue'");
  });

  it('mantiene las claves y placeholders sincronizados entre inglés y español', () => {
    const catalog = JSON.parse(workspace.snapshot.files['locales/locales.json'].content);
    const english = catalog.en;
    const spanish = catalog.es;
    for (const key of ['learningCard.title', 'learningCard.description', 'learningCard.continue']) {
      expect(english).toHaveProperty(key);
      expect(spanish).toHaveProperty(key);
    }
    expect(english['learningCard.title']).toContain('${name}');
    expect(spanish['learningCard.title']).toContain('${name}');
    expect(workspace.snapshot.files['src/locales/en.js']).toBeUndefined();
    expect(workspace.snapshot.files['src/locales/es.js']).toBeUndefined();
    expect(JSON.parse(workspace.snapshot.files['demo/locales/locales.json'].content)).toEqual(catalog);
    expect(JSON.parse(workspace.snapshot.files['test/unit/locales/locales.json'].content)).toEqual(catalog);
  });

  it('incluye una demo que consume la entrada pública y expone controles reales', () => {
    expect(workspace.snapshot.files['demo/index.html'].content).toContain('src="./demo.js"');
    expect(workspace.snapshot.files['demo/index.html'].content).toContain('data-cells-demo-subject');
    expect(workspace.snapshot.files['demo/index.html'].content).not.toContain('<h1>Demo interactiva</h1>');
    expect(workspace.snapshot.files['demo/basic.html'].content).toContain('<academy-learning-card');
    const controller = workspace.snapshot.files['demo/demo.js'].content;
    expect(controller).toContain("await import('../academy-learning-card.js')");
    expect(controller).toContain("addEventListener('input'");
    expect(controller).toContain("addEventListener('academy-learning-card-continue'");
    expect(workspace.snapshot.files['demo/demo-build.js'].content).toContain("import './demo.js'");
  });

  it('prueba el host y sus hijos scoped desde el DOM público', () => {
    const testSource = workspace.snapshot.files['test/unit/academy-learning-card.test.js'].content;
    expect(testSource).toContain("import catalogs from './locales/locales.json'");
    expect(testSource).toContain("import { installIntlMsg } from '../../src/runtime/academy-intl-msg.js'");
    expect(testSource).toContain("document.createElement('academy-learning-card')");
    expect(testSource).toContain('await component.updateComplete');
    expect(testSource).toContain("component.shadowRoot.querySelector('academy-action-button')");
    expect(testSource).toContain("button.shadowRoot.querySelector('button').click()");
    expect(testSource).not.toContain('.prototype.render.call(');
  });

  it('publica metadatos consumibles por el playground sin inventar la API', () => {
    const metadata = JSON.parse(workspace.snapshot.files['custom-elements.json'].content);
    const declaration = metadata.modules[0].declarations[0];

    expect(declaration).toMatchObject({
      tagName: 'academy-learning-card',
      members: [expect.objectContaining({ name: 'learnerName', attribute: 'learner-name' })],
      events: [expect.objectContaining({ name: 'academy-learning-card-continue' })],
    });
    expect(declaration.cssProperties).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '--learning-card-background' }),
    ]));
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
