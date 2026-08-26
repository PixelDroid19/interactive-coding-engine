import type { WorkspaceFile, WorkspaceSnapshot } from '../../types/scrim';
import { createVersionedCellsWorkspace, writeCellsFile, type VersionedCellsWorkspace } from './cellsVirtualFileSystem';

export interface CellsAppScaffold {
  name: string;
  namespace?: '@open-cells-learning';
}

function file(path: string, content: string, language: WorkspaceFile['language']): WorkspaceFile {
  return { path, name: path.split('/').at(-1)!, content: content.trimStart(), language };
}

export function createCellsAppWorkspace(scaffold: CellsAppScaffold): VersionedCellsWorkspace {
  if (!/^(?:academy|open-cells)-[a-z0-9]+(?:-[a-z0-9]+)*-app$/.test(scaffold.name)) {
    throw new Error('La aplicación debe comenzar por academy- u open-cells-, terminar en -app y usar kebab-case.');
  }
  const namespace = scaffold.namespace ?? '@open-cells-learning';
  const files: Record<string, WorkspaceFile> = {
    '.open-cells-academy-recipe.json': file('.open-cells-academy-recipe.json', `${JSON.stringify({
      schema: 1,
      kind: 'app',
      profile: 'academy-app',
      name: scaffold.name,
      cellsVersion: '5',
      capabilities: [
        'lit-runtime',
        'cells-config',
        'routing',
        'pubsub',
        'data-manager',
        'i18n',
        'scoped-elements',
        'unit-browser-tests',
      ],
    }, null, 2)}\n`, 'json'),
    'package.json': file('package.json', `${JSON.stringify({
      name: `${namespace}/${scaffold.name}`,
      version: '0.1.0',
      private: true,
      type: 'module',
      cellsProjectType: 'application',
      cells: { entry: './app/scripts/app.js' },
      scripts: {
        dev: 'cells app:dev -c dev.js',
        test: 'cells app:test',
        'test:coverage': 'cells app:test --coverage',
        locales: 'cells app:locales -c dev.js',
        build: 'cells app:build -c prod.js',
        preview: 'cells app:preview -c prod.js',
      },
      dependencies: {
        '@open-cells/core': '1.2.1',
        '@open-cells/page-mixin': '1.2.4',
        '@open-wc/scoped-elements': '3.0.10',
        lit: '3.3.3',
      },
      devDependencies: {
        '@vitest/coverage-v8': '3.2.4',
        'happy-dom': '20.11.2',
        sass: '^1.80.0',
        vite: '7.3.6',
        vitest: '3.2.4',
      },
    }, null, 2)}\n`, 'json'),
    'index.html': file('index.html', `
<!doctype html>
<html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body><main id="app" aria-live="polite"></main><script type="module" src="./app/scripts/app.js"></script></body>
</html>
`, 'html'),
    'app/scripts/app.js': file('app/scripts/app.js', `
import { startApp } from '@open-cells/core';
import { ROUTES } from './app-routes.js';

globalThis.__OPEN_CELLS_APP_READY__ = startApp({
  mainNode: 'app',
  routes: ROUTES,
  initialTemplate: 'home',
  debug: false,
});
`, 'javascript'),
    'app/scripts/routes.js': file('app/scripts/routes.js', `
export const ROUTES = [
  {
    path: '/',
    name: 'home',
    component: 'academy-home-page',
    action: async () => import('../pages/academy-home-page/academy-home-page.js'),
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: 'academy-product-detail-page',
    action: async () => import('../pages/academy-product-detail-page/academy-product-detail-page.js'),
  },
  {
    path: '/not-found',
    name: 'not-found',
    component: 'academy-not-found-page',
    notFound: true,
    action: async () => import('../pages/academy-not-found-page/academy-not-found-page.js'),
  },
];
`, 'javascript'),
    'app/scripts/app-routes.js': file('app/scripts/app-routes.js', `
export const ROUTES = [
  {
    path: '/',
    name: 'home',
    component: 'academy-home-page',
    action: async () => import('../pages/academy-home-page/academy-home-page.js'),
  },
  {
    path: '/product/:id',
    name: 'product-detail',
    component: 'academy-product-detail-page',
    action: async () => import('../pages/academy-product-detail-page/academy-product-detail-page.js'),
  },
  {
    path: '/not-found',
    name: 'not-found',
    component: 'academy-not-found-page',
    notFound: true,
    action: async () => import('../pages/academy-not-found-page/academy-not-found-page.js'),
  },
];
`, 'javascript'),
    'app/scripts/channels.js': file('app/scripts/channels.js', `
export const PRODUCT_SELECTED_CHANNEL = 'academy:store:product:selected';
export const APP_LIFECYCLE_CHANNEL = 'academy:app:lifecycle';
`, 'javascript'),
    'app/bridge/native-adapter.js': file('app/bridge/native-adapter.js', `
import { APP_LIFECYCLE_CHANNEL } from '../scripts/channels.js';

export function createNativeAdapter({ publish, navigate }) {
  return {
    handle(message) {
      if (!message || typeof message.type !== 'string') return false;
      if (message.type === 'app:lifecycle') {
        publish(APP_LIFECYCLE_CHANNEL, { state: message.state });
        return true;
      }
      if (message.type === 'app:deep-link' && typeof message.route === 'string') {
        navigate(message.route, message.params ?? {});
        return true;
      }
      return false;
    },
  };
}
`, 'javascript'),
    'app/pages/academy-home-page/academy-home-page.js': file('app/pages/academy-home-page/academy-home-page.js', `
import { LitElement, css, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { PageMixin } from '@open-cells/page-mixin';
import { AcademyProductCard } from '../../components/academy-product-card/academy-product-card.js';
import { PRODUCT_SELECTED_CHANNEL } from '../../scripts/channels.js';

const t = (key, values = {}) => globalThis.IntlMsg?.t?.(key, values) ?? '[' + key + ']';

export class AcademyHomePage extends PageMixin(ScopedElementsMixin(LitElement)) {
  static get is() { return 'academy-home-page'; }
  static get scopedElements() { return { 'academy-product-card': AcademyProductCard }; }
  static properties = { products: { state: true }, lastSelection: { state: true } };
  static styles = css\`
    :host { display: block; font-family: system-ui, sans-serif; }
    main { max-width: 52rem; margin: auto; padding: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(14rem,1fr)); gap: 1rem; }
  \`;

  constructor() {
    super();
    this.products = [{ id: 'tea', name: 'Té', price: 4 }, { id: 'coffee', name: 'Café', price: 12 }];
    this.lastSelection = '';
  }

  onPageEnter() {
    this.subscribe(PRODUCT_SELECTED_CHANNEL, (product) => { this.lastSelection = product.id; });
  }

  onPageLeave() {
    this.unsubscribe(PRODUCT_SELECTED_CHANNEL);
  }

  handleProductSelected(event) {
    const product = event.detail;
    this.publish(PRODUCT_SELECTED_CHANNEL, product);
    this.navigate('product-detail', { id: product.id });
  }

  render() {
    return html\`
      <main>
        <h1>${'${'}t('home.title')}</h1>
        <p>${'${'}t('home.description')}</p>
        <div class="grid" @academy-product-card-select=${'${'}this.handleProductSelected}>
          ${'${'}this.products.map((product) => html\`<academy-product-card .product=${'${'}product}></academy-product-card>\`)}
        </div>
      </main>
    \`;
  }
}

customElements.define(AcademyHomePage.is, AcademyHomePage);
`, 'javascript'),
    'app/pages/academy-product-detail-page/academy-product-detail-page.js': file('app/pages/academy-product-detail-page/academy-product-detail-page.js', `
import { LitElement, html } from 'lit';
import { PageMixin } from '@open-cells/page-mixin';

const t = (key, values = {}) => globalThis.IntlMsg?.t?.(key, values) ?? '[' + key + ']';

export class AcademyProductDetailPage extends PageMixin(LitElement) {
  static get is() { return 'academy-product-detail-page'; }
  static properties = { productId: { state: true } };
  constructor() { super(); this.productId = ''; }
  onPageEnter(params = {}) { this.productId = params.id ?? ''; }
  render() {
    return html\`<main><button @click=${'${'}() => this.navigate('home')}>${'${'}t('detail.back')}</button><h1>${'${'}t('detail.title')} · ${'${'}this.productId}</h1></main>\`;
  }
}
customElements.define(AcademyProductDetailPage.is, AcademyProductDetailPage);
`, 'javascript'),
    'app/pages/academy-not-found-page/academy-not-found-page.js': file('app/pages/academy-not-found-page/academy-not-found-page.js', `
import { LitElement, html } from 'lit';
import { PageMixin } from '@open-cells/page-mixin';
const t = (key) => globalThis.IntlMsg?.t?.(key) ?? '[' + key + ']';
export class AcademyNotFoundPage extends PageMixin(LitElement) {
  static get is() { return 'academy-not-found-page'; }
  render() { return html\`<main><h1>${'${'}t('notFound.title')}</h1><button @click=${'${'}() => this.navigate('home')}>${'${'}t('app.back')}</button></main>\`; }
}
customElements.define(AcademyNotFoundPage.is, AcademyNotFoundPage);
`, 'javascript'),
    'app/components/academy-product-card/academy-product-card.js': file('app/components/academy-product-card/academy-product-card.js', `
import { LitElement, css, html } from 'lit';
import { WidgetMixin } from '../../runtime/widget-mixin.js';

export class AcademyProductCard extends WidgetMixin(LitElement) {
  static get is() { return 'academy-product-card'; }
  static properties = { product: { type: Object } };
  static styles = css\`:host{display:block}article{border:2px solid #111827;padding:1rem;background:white}button{padding:.6rem 1rem}\`;
  constructor() { super(); this.product = { id: '', name: '', price: 0 }; }
  selectProduct() { this.emitEvent('select', { ...this.product }); }
  render() {
    return html\`<article><h2>${'${'}this.product.name}</h2><p>${'${'}this.product.price} €</p><button @click=${'${'}this.selectProduct}>${'${'}this.t('home.viewDetail')}</button></article>\`;
  }
}
customElements.define(AcademyProductCard.is, AcademyProductCard);
`, 'javascript'),
    'app/runtime/widget-mixin.js': file('app/runtime/widget-mixin.js', `
/**
 * Capacidades de traducción y eventos usadas por los componentes del curso.
 * La aplicación mantiene este adaptador local para no depender de un paquete
 * educativo inexistente ni confundirlo con el runtime público de Cells.
 * @template {new (...args: any[]) => HTMLElement} T
 * @param {T} Base Clase host que conserva su API de HTMLElement.
 */
export const WidgetMixin = (Base) => class extends Base {
  t(key, values = {}) {
    const message = globalThis.IntlMsg?.t?.(key, values);
    return message ?? '[' + key + ']';
  }

  emitEvent(type, detail = {}) {
    return this.dispatchEvent(new CustomEvent(this.tagName.toLowerCase() + '-' + type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
    }));
  }
};
`, 'javascript'),
    'app/data/academy-product-data-manager.js': file('app/data/academy-product-data-manager.js', `
export class AcademyProductDataManager extends EventTarget {
  constructor() { super(); this.requestId = 0; this.controller = null; }
  emit(state, detail = {}) { this.dispatchEvent(new CustomEvent('state-changed', { detail: { state, ...detail } })); }
  async load(loader) {
    this.controller?.abort();
    this.controller = new AbortController();
    const requestId = ++this.requestId;
    this.emit('loading');
    try {
      const products = await loader({ signal: this.controller.signal });
      if (requestId !== this.requestId) return;
      this.emit(products.length ? 'success' : 'empty', { products });
    } catch (error) {
      if (error?.name !== 'AbortError' && requestId === this.requestId) this.emit('error', { message: error.message });
    }
  }
  disconnect() { this.controller?.abort(); }
}
`, 'javascript'),
    'app/data-managers/lesson-data-manager.js': file('app/data-managers/lesson-data-manager.js', `
export {
  AcademyProductDataManager as LessonDataManager,
} from '../data/academy-product-data-manager.js';
`, 'javascript'),
    'app/config/dev.js': file('app/config/dev.js', `
const appConfig = {
  cells_properties: {
    initialTemplate: 'home',
    locales: {
      enabledI18n: true,
      languages: ['en', 'es'],
      intlInputFileNames: ['locales'],
      intlFileName: 'locales',
      forTesting: true,
    },
  },
  app_properties: {
    app: {
      name: 'academy-store-app',
      title: 'Catálogo Cells',
      version: '0.1.0',
      runtimeConfig: 'open-cells-development',
    },
  },
  server: { host: '127.0.0.1', port: 8001, strictPort: false, open: false },
  build: { target: 'es2022', sourcemap: true },
};

export default appConfig;
`, 'javascript'),
    'app/config/prod.js': file('app/config/prod.js', `
const appConfig = {
  cells_properties: {
    initialTemplate: 'home',
    locales: {
      enabledI18n: true,
      languages: ['en', 'es'],
      intlInputFileNames: ['locales'],
      intlFileName: 'locales',
      forTesting: true,
    },
  },
  app_properties: {
    app: {
      name: 'academy-store-app',
      title: 'Catálogo Cells',
      version: '0.1.0',
      runtimeConfig: 'open-cells-production',
    },
  },
  server: { host: '127.0.0.1', port: 8001, strictPort: false, open: false },
  build: { target: 'es2022', sourcemap: false },
};

export default appConfig;
`, 'javascript'),
    'app/locales-app/locales.json': file('app/locales-app/locales.json', `${JSON.stringify({
      en: { 'app.title': 'Cells catalog', 'app.back': 'Back' },
      es: { 'app.title': 'Catálogo Cells', 'app.back': 'Volver' },
    }, null, 2)}\n`, 'json'),
    'app/pages/academy-home-page/locales/locales.json': file('app/pages/academy-home-page/locales/locales.json', `${JSON.stringify({
      en: { 'home.title': 'Cells catalog', 'home.description': 'Choose a product to see its details.', 'home.viewDetail': 'View details' },
      es: { 'home.title': 'Catálogo Cells', 'home.description': 'Elige un producto para ver su detalle.', 'home.viewDetail': 'Ver detalle' },
    }, null, 2)}\n`, 'json'),
    'app/pages/academy-product-detail-page/locales/locales.json': file('app/pages/academy-product-detail-page/locales/locales.json', `${JSON.stringify({
      en: { 'detail.title': 'Product detail', 'detail.back': 'Back to catalog' },
      es: { 'detail.title': 'Detalle del producto', 'detail.back': 'Volver al catálogo' },
    }, null, 2)}\n`, 'json'),
    'app/pages/academy-not-found-page/locales/locales.json': file('app/pages/academy-not-found-page/locales/locales.json', `${JSON.stringify({
      en: { 'notFound.title': 'Page not found' },
      es: { 'notFound.title': 'Página no encontrada' },
    }, null, 2)}\n`, 'json'),
    'vite.config.js': file('vite.config.js', `
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/unit/**/*.test.js'],
  },
});
`, 'javascript'),
    'test/unit/app.test.js': file('test/unit/app.test.js', `
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../app/scripts/app-routes.js';
import { AcademyProductDataManager } from '../../app/data/academy-product-data-manager.js';

describe('academy-store-app', () => {
  it('declara rutas lazy por nombre y una única salida desconocida', () => {
    expect(ROUTES.map((route) => route.name)).toEqual(['home', 'product-detail', 'not-found']);
    expect(ROUTES.filter((route) => route.notFound)).toHaveLength(1);
    expect(ROUTES.find((route) => route.name === 'product-detail')?.path).toBe('/product/:id');
  });

  it('publica success y empty como estados diferentes', async () => {
    const manager = new AcademyProductDataManager();
    const states = [];
    manager.addEventListener('state-changed', (event) => states.push(event.detail));
    await manager.load(async () => [{ id: 'tea' }]);
    await manager.load(async () => []);
    expect(states.map((entry) => entry.state)).toEqual(['loading', 'success', 'loading', 'empty']);
  });

  it('cancela el trabajo que todavía pertenece al manager', async () => {
    const manager = new AcademyProductDataManager();
    let signal;
    const pending = manager.load(({ signal: current }) => {
      signal = current;
      return new Promise(() => {});
    });
    manager.disconnect();
    expect(signal.aborted).toBe(true);
    void pending;
  });
});
`, 'javascript'),
    'README.md': file('README.md', `
# ${scaffold.name}

Aplicación Cells educativa con páginas declarativas, rutas lazy, canales con último valor, cleanup y un data manager cancelable.
`, 'markdown'),
    'types/open-cells-app.d.ts': file('types/open-cells-app.d.ts', `
declare module 'lit' {
  export class LitElement extends HTMLElement { readonly updateComplete: Promise<boolean>; }
  export function html(strings: TemplateStringsArray, ...values: unknown[]): unknown;
  export function css(strings: TemplateStringsArray, ...values: unknown[]): unknown;
}
declare module '@open-wc/scoped-elements/lit-element.js' {
  type Constructor<T = object> = new (...args: any[]) => T;
  export function ScopedElementsMixin<T extends Constructor>(base: T): T;
}
declare module '@open-cells/page-mixin' {
  type Constructor<T = object> = new (...args: any[]) => T;
  interface CellsPageApi {
    /** Publica un valor en un canal Cells. */ publish(channel: string, value: unknown): void;
    /** Recibe el último valor y los siguientes; devuelve la función de limpieza. */ subscribe(channel: string, callback: (value: any) => void): () => void;
    /** Elimina las suscripciones de este host para el canal. */ unsubscribe(channel: string): void;
    /** Navega usando el nombre estable de una página y parámetros opcionales. */ navigate(page: string, params?: Record<string, unknown>): void;
  }
  export function PageMixin<T extends Constructor>(base: T): T & Constructor<CellsPageApi>;
}
declare module '@open-cells/core' {
  export function startApp(config: { mainNode: string; routes: unknown[]; initialTemplate: string; debug: false }): Promise<unknown>;
}
`, 'typescript'),
  };
  const snapshot: WorkspaceSnapshot = { files, activeFilePath: 'app/pages/academy-home-page/academy-home-page.js' };
  return createVersionedCellsWorkspace(snapshot);
}

export type CellsAppPracticeStage = 'lifecycle' | 'channels' | 'data' | 'delivery';

export function createCellsAppPracticeWorkspace(
  stage: CellsAppPracticeStage = 'lifecycle',
  scaffold: CellsAppScaffold = { name: 'academy-store-app' },
): VersionedCellsWorkspace {
  const complete = createCellsAppWorkspace(scaffold);
  const pagePath = 'app/pages/academy-home-page/academy-home-page.js';
  const managerPath = 'app/data/academy-product-data-manager.js';
  const routesPath = 'app/scripts/app-routes.js';
  const prodPath = 'app/config/prod.js';

  if (stage === 'lifecycle') {
    const starter = complete.snapshot.files[pagePath].content
      .replace('    this.unsubscribe(PRODUCT_SELECTED_CHANNEL);', '    // TODO: corta la suscripción al abandonar la página.')
      .replace("    this.navigate('product-detail', { id: product.id });", '    // TODO: navega por nombre y entrega el id seleccionado.');
    return createVersionedCellsWorkspace(writeCellsFile(complete, pagePath, starter).snapshot, 0);
  }

  if (stage === 'channels') {
    const starter = complete.snapshot.files[pagePath].content
      .replace('    this.subscribe(PRODUCT_SELECTED_CHANNEL, (product) => { this.lastSelection = product.id; });', '    // TODO: observa el canal y conserva el id del último producto.')
      .replace('    this.publish(PRODUCT_SELECTED_CHANNEL, product);', '    // TODO: publica el producto seleccionado para consumidores lejanos.');
    const bridgePath = 'app/bridge/native-adapter.js';
    const bridge = complete.snapshot.files[bridgePath].content
      .replace("      if (!message || typeof message.type !== 'string') return false;", '      // TODO: rechaza mensajes externos sin un type válido.')
      .replace('        publish(APP_LIFECYCLE_CHANNEL, { state: message.state });', '        // TODO: traduce el ciclo nativo al canal interno de la aplicación.');
    const withPage = writeCellsFile(complete, pagePath, starter);
    const changed = writeCellsFile(withPage, bridgePath, bridge);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: bridgePath }, 0);
  }

  if (stage === 'data') {
    const starter = complete.snapshot.files[managerPath].content
      .replace('      if (requestId !== this.requestId) return;', '      // TODO: descarta esta respuesta cuando ya exista una petición más reciente.')
      .replace('  disconnect() { this.controller?.abort(); }', '  disconnect() {\n    // TODO: cancela el trabajo que todavía pertenece a este manager.\n  }');
    const next = writeCellsFile(complete, managerPath, starter);
    return createVersionedCellsWorkspace({ ...next.snapshot, activeFilePath: managerPath }, 0);
  }

  const routes = complete.snapshot.files[routesPath].content
    .replace('    notFound: true,', '    // TODO: declara esta como la única ruta para direcciones desconocidas.');
  const prod = complete.snapshot.files[prodPath].content
    .replace("runtimeConfig: 'open-cells-production'", "runtimeConfig: 'open-cells-development', // TODO: usa el entorno de entrega");
  const withRoutes = writeCellsFile(complete, routesPath, routes);
  const withProd = writeCellsFile(withRoutes, prodPath, prod);
  return createVersionedCellsWorkspace({ ...withProd.snapshot, activeFilePath: routesPath }, 0);
}

export type CellsAppProject = 'store' | 'museum' | 'climate' | 'relay' | 'capstone';

const PROJECT_COPY: Record<CellsAppProject, {
  name: string;
  title: string;
  description: string;
  firstItem: string;
  secondItem: string;
  channel: string;
}> = {
  store: {
    name: 'academy-store-app',
    title: 'Catálogo Cells',
    description: 'Catálogo de productos con detalle y selección retenida.',
    firstItem: 'Té',
    secondItem: 'Café',
    channel: 'academy:store:product:selected',
  },
  museum: {
    name: 'academy-museum-app',
    title: 'Museo Cells',
    description: 'Recorrido de obras con páginas, navegación y cleanup al salir de una sala.',
    firstItem: 'Luz andina',
    secondItem: 'Ciudad de lluvia',
    channel: 'academy:museum:artwork:selected',
  },
  climate: {
    name: 'academy-climate-app',
    title: 'Clima Cells',
    description: 'Consulta de estaciones con estados, carreras y cancelación de solicitudes.',
    firstItem: 'Bogotá',
    secondItem: 'Medellín',
    channel: 'academy:climate:station:selected',
  },
  relay: {
    name: 'academy-relay-app',
    title: 'Relé Cells',
    description: 'Panel de nodos con eventos de intención, canales retenidos y desuscripción.',
    firstItem: 'Nodo norte',
    secondItem: 'Nodo sur',
    channel: 'academy:relay:node:selected',
  },
  capstone: {
    name: 'academy-learning-studio-app',
    title: 'Estudio Cells',
    description: 'Aplicación final que integra componentes, rutas, canales, datos, idiomas y entrega.',
    firstItem: 'Proyecto Museo',
    secondItem: 'Proyecto Clima',
    channel: 'academy:studio:project:selected',
  },
};

/** Crea cuatro proyectos de dominio distintos sobre los mismos contratos públicos de Cells. */
export function createCellsProjectPracticeWorkspace(
  project: CellsAppProject,
  stage: CellsAppPracticeStage,
): VersionedCellsWorkspace {
  const copy = PROJECT_COPY[project];
  const base = createCellsAppPracticeWorkspace(stage, { name: copy.name });
  const files = Object.fromEntries(Object.entries(base.snapshot.files).map(([path, source]) => {
    let content = source.content
      .replaceAll('academy-store-app', copy.name)
      .replaceAll('Catálogo Cells', copy.title)
      .replaceAll('Aplicación Cells educativa con páginas declarativas, rutas lazy, canales con último valor, cleanup y un data manager cancelable.', copy.description)
      .replaceAll("academy:store:product:selected", copy.channel)
      .replaceAll("{ id: 'tea', name: 'Té', price: 4 }", `{ id: 'first', name: '${copy.firstItem}', price: 4 }`)
      .replaceAll("{ id: 'coffee', name: 'Café', price: 12 }", `{ id: 'second', name: '${copy.secondItem}', price: 12 }`);
    if (path === 'package.json') {
      const manifest = JSON.parse(content);
      manifest.learningProject = project;
      content = `${JSON.stringify(manifest, null, 2)}\n`;
    }
    return [path, { ...source, content }];
  }));
  return createVersionedCellsWorkspace({ ...base.snapshot, files }, base.generation);
}
