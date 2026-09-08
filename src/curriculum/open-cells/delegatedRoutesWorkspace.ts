import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const messages = {
  es: { 'delegated.label': 'Enlace del catálogo', 'delegated.open': 'Abrir enlace', 'delegated.help': 'El shell entrega el enlace al módulo de catálogo. Prueba /catalogo o /catalogo/first; el módulo devuelve una ruta nombrada, no renderiza la página.', 'delegated.invalid': 'El enlace no pertenece al catálogo o está incompleto.', 'delegated.accepted': 'Enlace aceptado por el módulo de catálogo.', 'delegated.failed': 'No se pudo aplicar la navegación.' },
  en: { 'delegated.label': 'Catalog link', 'delegated.open': 'Open link', 'delegated.help': 'The shell passes the link to the catalog module. Try /catalogo or /catalogo/first; the module returns a named route, it does not render the page.', 'delegated.invalid': 'The link does not belong to the catalog or is incomplete.', 'delegated.accepted': 'Link accepted by the catalog module.', 'delegated.failed': 'Navigation could not be applied.' },
};

const moduleSource = `import { delegateRoute } from '../../scripts/delegated-routes.js';

const PAGES = Object.freeze({ home: 'home', detail: 'product-detail' });

/** El módulo traduce su contrato de URL a las rutas públicas del shell. */
export function resolveCatalogNavigation(url) {
  const target = delegateRoute(url);
  if (!target || target.module !== 'catalogo') return undefined;
  const page = PAGES[target.route];
  if (!page) return undefined;
  const params = target.params.id === undefined ? {} : { id: encodeURIComponent(target.params.id) };
  return { page, params };
}
`;

const styles = `[data-delegated-navigation] { box-sizing: border-box; max-width: 1040px; margin: 16px auto; padding: 18px; border: 2px solid #171717; box-shadow: 4px 4px 0 #171717; background: #f5f2eb; color: #171717; font: 16px/1.5 system-ui, sans-serif; }
[data-delegated-navigation] label { display: block; font-weight: 700; margin-bottom: 8px; }
[data-delegated-navigation] input { box-sizing: border-box; width: 100%; padding: 10px; border: 2px solid #171717; background: white; color: #171717; font: inherit; }
[data-delegated-navigation] button { margin-top: 12px; padding: 10px 16px; border: 2px solid #171717; background: #ffe600; color: #171717; font: inherit; font-weight: 700; cursor: pointer; }
[data-delegated-navigation] :focus-visible { outline: 3px solid #2455b5; outline-offset: 3px; }
`;

const shellSource = `import { navigate } from '@open-cells/core';
import { appIntlMsg } from './app-messages.js';
import { resolveCatalogNavigation } from '../modules/catalogo/navigation.js';
import styles from './delegated-shell.css.js';

export function installDelegatedNavigation() {
  const form = document.createElement('form');
  form.setAttribute('data-delegated-navigation', '');
  form.innerHTML = '<label for="catalog-link" data-message="delegated.label"></label><input id="catalog-link" type="text" value="/catalogo" aria-describedby="catalog-link-help catalog-link-status"><p id="catalog-link-help" data-message="delegated.help"></p><button type="button" data-message="delegated.open"></button><p id="catalog-link-status" role="status"></p>';
  const style = document.createElement('style');
  style.textContent = styles;
  form.prepend(style);
  document.getElementById('app').before(form);
  const input = form.querySelector('input');
  let status;
  let version = 0;
  const refresh = () => {
    for (const node of form.querySelectorAll('[data-message]')) node.textContent = appIntlMsg.t(node.dataset.message);
    form.querySelector('[role="status"]').textContent = status ? appIntlMsg.t(status) : '';
    input.setAttribute('aria-invalid', String(status === 'delegated.invalid'));
  };
  const openLink = async () => {
    const request = ++version;
    const destination = resolveCatalogNavigation(input.value);
    if (!destination) {
      status = 'delegated.invalid';
      refresh();
      return;
    }
    try {
      await navigate(destination.page, destination.params);
      if (request === version) status = 'delegated.accepted';
    } catch {
      if (request === version) status = 'delegated.failed';
    }
    refresh();
  };
  form.addEventListener('submit', (event) => event.preventDefault());
  form.querySelector('button').addEventListener('click', () => { void openLink(); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void openLink();
    }
  });
  globalThis.addEventListener('language-update', refresh);
  refresh();
  const dispose = () => {
    version += 1;
    globalThis.removeEventListener('language-update', refresh);
    globalThis.removeEventListener('pagehide', dispose);
    form.remove();
  };
  globalThis.addEventListener('pagehide', dispose);
  return { dispose };
}
`;

export function connectDelegatedRoutesWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, source: string) => { workspace = writeCellsFile(workspace, path, source); };
  put('app/modules/catalogo/navigation.js', moduleSource);
  put('app/scripts/delegated-shell.js', shellSource);
  put('app/scripts/delegated-shell.scss', styles);
  put('app/scripts/delegated-shell.css.js', `export default ${JSON.stringify(styles)};\n`);
  const routesPath = 'app/scripts/app-routes.js';
  const routes = workspace.snapshot.files[routesPath].content;
  const routeStart = routes.indexOf('export const ROUTES = [\n') + 'export const ROUTES = [\n'.length;
  const routeEnd = routes.indexOf("  {\n    path: '/favorites',");
  if (routeStart < 'export const ROUTES = [\n'.length || routeEnd < routeStart) throw new Error('No se encontraron las rutas del catálogo.');
  const catalogRoutes = routes.slice(routeStart, routeEnd)
    .replace("path: '/',", "path: ['/catalogo', '/'],")
    .replace("path: '/product/:id',", "path: '/catalogo/:id',")
    .replaceAll("import('../pages/", "import('../../pages/");
  put('app/modules/catalogo/routes.js', `export const CATALOG_ROUTES = [\n${catalogRoutes}];\n`);
  put(routesPath, `import { CATALOG_ROUTES } from '../modules/catalogo/routes.js';\nexport const ROUTES = [\n  ...CATALOG_ROUTES,\n${routes.slice(routeEnd)}`);
  const testPath = 'test/unit/app.test.js';
  put(testPath, workspace.snapshot.files[testPath].content.replace("toBe('/product/:id')", "toBe('/catalogo/:id')"));
  const localePath = 'app/locales-app/locales.json';
  const catalogs = JSON.parse(workspace.snapshot.files[localePath].content);
  for (const language of ['es', 'en'] as const) Object.assign(catalogs[language], messages[language]);
  put(localePath, JSON.stringify(catalogs, null, 2));
  const messagesPath = 'app/scripts/app-messages.js';
  const source = workspace.snapshot.files[messagesPath].content;
  const match = source.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo del shell.');
  const merged = JSON.parse(match[1]);
  for (const language of ['es', 'en'] as const) Object.assign(merged[language], messages[language]);
  put(messagesPath, source.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  const appPath = 'app/scripts/app.js';
  put(appPath, workspace.snapshot.files[appPath].content
    .replace("import { ROUTES }", "import { installDelegatedNavigation } from './delegated-shell.js';\nimport { ROUTES }")
    .replace('globalThis.__OPEN_CELLS_APP_READY__ = startApp({', 'installDelegatedNavigation();\nglobalThis.__OPEN_CELLS_APP_READY__ = startApp({'));
  return workspace;
}
