import { describe, expect, it } from 'vitest';
import { createCellsAppPracticeWorkspace, createCellsAppWorkspace, createCellsProjectPracticeWorkspace } from './cellsAppRecipes';

describe('scaffold de aplicación Cells', () => {
  const workspace = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;

  it('genera rutas, páginas, componente, data manager, configuración y pruebas', () => {
    expect(Object.keys(workspace.files)).toEqual(expect.arrayContaining([
      'app/scripts/app.js', 'app/scripts/app-routes.js', 'app/scripts/channels.js',
      'app/bridge/native-adapter.js',
      'app/pages/academy-home-page/academy-home-page.js',
      'app/pages/academy-product-detail-page/academy-product-detail-page.js',
      'app/components/academy-product-card/academy-product-card.js',
      'app/data/academy-product-data-manager.js', 'app/config/dev.js', 'app/config/prod.js',
      'app/locales-app/locales.json',
      'app/pages/academy-home-page/locales/locales.json',
      'app/pages/academy-product-detail-page/locales/locales.json',
      'app/pages/academy-not-found-page/locales/locales.json',
      'test/unit/app.test.js',
    ]));
    expect(workspace.files['app/locales/en.js']).toBeUndefined();
    expect(workspace.files['app/locales/es.js']).toBeUndefined();
    const globalCatalog = JSON.parse(workspace.files['app/locales-app/locales.json'].content);
    const pageCatalog = JSON.parse(workspace.files['app/pages/academy-home-page/locales/locales.json'].content);
    expect(globalCatalog.es).toHaveProperty('app.title');
    expect(pageCatalog.es).toHaveProperty('home.title');
    expect(pageCatalog.es).not.toHaveProperty('app.title');
  });

  it('usa el contrato público de páginas, rutas y canales', () => {
    const page = workspace.files['app/pages/academy-home-page/academy-home-page.js'].content;
    const routes = workspace.files['app/scripts/app-routes.js'].content;
    expect(page).toContain('PageMixin(WidgetMixin(ScopedElementsMixin(LitElement)))');
    expect(page).toContain('...super.scopedElements');
    expect(page).toContain('static get properties()');
    expect(page).toContain('...super.properties');
    expect(page).toContain('onPageEnter()');
    expect(page).toContain('onPageLeave()');
    expect(page).toContain('this.subscribe(PRODUCT_SELECTED_CHANNEL');
    expect(page).toContain('this.unsubscribe(PRODUCT_SELECTED_CHANNEL)');
    expect(page).toContain("this.navigate('product-detail', { id: product.id })");
    expect(routes).toContain("path: '/product/:id'");
    expect(routes).toContain('action: async () => import(');
  });

  it('inicializa IntlMsg antes del router y traduce desde las instancias Cells', () => {
    const entry = workspace.files['app/scripts/app.js'].content;
    const messages = workspace.files['app/scripts/app-messages.js'].content;
    const pages = Object.entries(workspace.files)
      .filter(([path]) => /^app\/pages\/[^/]+\/[^/]+\.js$/.test(path))
      .map(([, source]) => source.content);

    expect(entry).toContain("import { initializeAppMessages } from './app-messages.js'");
    expect(entry.indexOf('await initializeAppMessages')).toBeLessThan(entry.indexOf('startApp({'));
    expect(messages).toContain('installIntlMsg({ catalogs: appCatalogs');
    expect(messages).toContain('await appIntlMsg.loadUrlResourcesComplete');
    expect(workspace.files['app/runtime/academy-intl-msg.js']).toBeDefined();
    expect(pages.every((source) => source.includes('WidgetMixin'))).toBe(true);
    expect(pages.every((source) => !source.includes('const t ='))).toBe(true);
    expect(pages.every((source) => source.includes('this.t('))).toBe(true);
  });

  it('mantiene la tarjeta interna únicamente en scopedElements y prueba DOM, idioma y evento', () => {
    const page = workspace.files['app/pages/academy-home-page/academy-home-page.js'].content;
    const card = workspace.files['app/components/academy-product-card/academy-product-card.js'].content;
    const suite = workspace.files['test/unit/app.test.js'].content;

    expect(page).toContain("'academy-product-card': AcademyProductCard");
    expect(card).toContain('WidgetMixin(ScopedElementsMixin(LitElement))');
    expect(card).toContain('...super.scopedElements');
    expect(card).not.toContain('customElements.define(AcademyProductCard.is');
    expect(card).toContain("this.t('home.productLabel')");
    expect(suite).toContain("customElements.get('academy-product-card')");
    expect(suite).toContain("switchAppLanguage('en')");
    expect(suite).toContain("academy-product-card-select");
  });

  it('incluye cancelación y protección contra respuestas fuera de orden', () => {
    const manager = workspace.files['app/data/academy-product-data-manager.js'].content;
    expect(manager).toContain('new AbortController()');
    expect(manager).toContain('requestId !== this.requestId');
    expect(manager).toContain("this.emit('loading')");
    expect(manager).toContain("'success' : 'empty'");
    expect(manager).toContain("this.emit('error'");
  });

  it('el starter retira navegación y cleanup sin revelar su sintaxis exacta', () => {
    const page = createCellsAppPracticeWorkspace().snapshot.files['app/pages/academy-home-page/academy-home-page.js'].content;
    expect(page).not.toContain('this.unsubscribe(PRODUCT_SELECTED_CHANNEL)');
    expect(page).not.toContain("this.navigate('product-detail', { id: product.id })");
    expect(page).toContain('TODO: corta');
    expect(page).toContain('TODO: navega');
  });

  it('crea etapas progresivas sobre el mismo proyecto exportable', () => {
    expect(createCellsAppPracticeWorkspace('channels').snapshot.activeFilePath).toBe('app/bridge/native-adapter.js');
    expect(createCellsAppPracticeWorkspace('data').snapshot.activeFilePath).toContain('data-manager');
    expect(createCellsAppPracticeWorkspace('delivery').snapshot.activeFilePath).toBe('app/scripts/app-routes.js');
  });

  it('no duplica la tabla de rutas y separa configuración productiva de pruebas', () => {
    expect(workspace.files['app/scripts/routes.js']).toBeUndefined();
    expect(workspace.files['app/config/dev.js'].content).toContain('forTesting: true');
    expect(workspace.files['app/config/prod.js'].content).toContain('forTesting: false');
  });

  it('entrega Museo, Clima, Relé y capstone como proyectos distintos', () => {
    const projects = [
      createCellsProjectPracticeWorkspace('museum', 'lifecycle'),
      createCellsProjectPracticeWorkspace('climate', 'data'),
      createCellsProjectPracticeWorkspace('relay', 'channels'),
      createCellsProjectPracticeWorkspace('capstone', 'delivery'),
    ];
    const manifests = projects.map((project) => JSON.parse(project.snapshot.files['package.json'].content));
    expect(manifests.map((manifest) => manifest.name)).toEqual([
      '@open-cells-learning/academy-museum-app',
      '@open-cells-learning/academy-climate-app',
      '@open-cells-learning/academy-relay-app',
      '@open-cells-learning/academy-learning-studio-app',
    ]);
    expect(new Set(manifests.map((manifest) => manifest.learningProject)).size).toBe(4);
    expect(projects[0].snapshot.files['README.md'].content).toContain('Recorrido de obras');
    expect(projects[1].snapshot.files['README.md'].content).toContain('cancelación');
    expect(projects[2].snapshot.files['app/scripts/channels.js'].content).toContain('academy:relay:node:selected');
    expect(projects[3].snapshot.files['README.md'].content).toContain('Aplicación final');
  });
});
