import type { WorkspaceSnapshot } from '../../types/scrim';
import type { CellsCoverageResult, CellsTestResult } from './cellsWorkerProtocol';

function test(id: string, title: string, passed: boolean, message: string, filePath?: string): CellsTestResult {
  return { id, title, passed, message, ...(filePath ? { filePath } : {}) };
}

function localeKeys(source = ''): string[] {
  return Array.from(source.matchAll(/['"]([^'"]+)['"]\s*:/g), (match) => match[1]).sort();
}

export function auditCellsComponent(workspace: WorkspaceSnapshot): { results: CellsTestResult[]; coverage: CellsCoverageResult } {
  const sourcePath = Object.keys(workspace.files).find((path) => (
    /^src\/[^/]+\.js$/.test(path)
    && !path.includes('/locales/')
    && /WidgetMixin\s*\(/.test(workspace.files[path].content)
  ));
  const source = sourcePath ? workspace.files[sourcePath].content : '';
  const demo = workspace.files['demo/index.html']?.content ?? '';
  const enKeys = localeKeys(workspace.files['src/locales/en.js']?.content);
  const esKeys = localeKeys(workspace.files['src/locales/es.js']?.content);
  const tagName = Object.values(workspace.files)
    .map((file) => file.content.match(/customElements\.define\(['"]([^'"]+)/)?.[1])
    .find(Boolean);
  const scopedRegistry = source.match(/static\s+get\s+scopedElements\s*\(\)\s*\{\s*return\s*\{([\s\S]*?)\}\s*;?\s*\}/)?.[1] ?? '';
  const translationCalls = Array.from(source.matchAll(/this\.t\(['"]([^'"]+)['"]/g), (match) => match[1]);
  const uniqueCalls = [...new Set(translationCalls)];

  const results = [
    test('source-entry', 'Existe una entrada pública', Boolean(sourcePath), sourcePath ? 'Se encontró el módulo principal.' : 'Falta un archivo principal dentro de src/.'),
    test('cells-mixins', 'Compone los mixins Cells', /WidgetMixin\(ScopedElementsMixin\(LitElement\)\)/.test(source), 'La clase debe componer WidgetMixin y ScopedElementsMixin.', sourcePath),
    test('scoped-components', 'Registra dependencias scoped', /['"]open-cells-type-text['"]\s*:\s*OpenCellsTypeText/.test(scopedRegistry) && /['"]open-cells-button-default['"]\s*:\s*OpenCellsButtonDefault/.test(scopedRegistry), 'Registra ambos componentes públicos dentro de scopedElements.', sourcePath),
    test('translated-copy', 'Traduce el texto visible', uniqueCalls.length >= 3 && !/this\.t\([^)]*\)\s*\|\|/.test(source), 'Usa this.t con claves reales y sin ocultar errores con un fallback vacío.', sourcePath),
    test('locale-parity', 'Mantiene EN y ES sincronizados', enKeys.length > 0 && JSON.stringify(enKeys) === JSON.stringify(esKeys), 'Los catálogos deben tener exactamente las mismas claves.', 'src/locales/es.js'),
    test('public-event', 'Emite un evento público', /this\.emitEvent\(['"]continue['"]\s*,\s*\{[^}]+\}/s.test(source), 'Emite continue con un detail útil; el nombre público incluye el tag del componente.', sourcePath),
    test('demo-renders', 'La demo instancia el componente', Boolean(tagName && new RegExp(`<${tagName}(?:\\s|>)`).test(demo)), 'La demo debe incluir el tag definido por el componente.', 'demo/index.html'),
  ];
  const covered = results.filter((result) => result.passed).length;
  const behaviorIds = new Set(['scoped-components', 'translated-copy', 'public-event', 'demo-renders']);
  const behaviorsCovered = results.filter((result) => result.passed && behaviorIds.has(result.id)).length;
  return {
    results,
    coverage: {
      statements: { covered, total: results.length, percentage: Math.round((covered / results.length) * 100) },
      behaviors: { covered: behaviorsCovered, total: behaviorIds.size, percentage: Math.round((behaviorsCovered / behaviorIds.size) * 100) },
    },
  };
}

export function auditCellsApplication(workspace: WorkspaceSnapshot): { results: CellsTestResult[]; coverage: CellsCoverageResult } {
  const routes = workspace.files['app/scripts/app-routes.js']?.content ?? '';
  const pagePath = 'app/pages/academy-home-page/academy-home-page.js';
  const page = workspace.files[pagePath]?.content ?? '';
  const managerPath = 'app/data/academy-product-data-manager.js';
  const manager = workspace.files[managerPath]?.content ?? '';
  const cardPath = 'app/components/academy-product-card/academy-product-card.js';
  const card = workspace.files[cardPath]?.content ?? '';
  const results = [
    test('app-entry', 'Arranca desde una entrada Cells', /startApp\s*\(\s*\{/.test(workspace.files['app/scripts/app.js']?.content ?? ''), 'La entrada debe entregar rutas y mainNode al runtime público de Cells.', 'app/scripts/app.js'),
    test('declarative-routes', 'Declara rutas lazy por nombre', /name:\s*['"]home['"]/.test(routes) && /path:\s*['"]\/product\/:id['"]/.test(routes) && /action:\s*async\s*\(\)\s*=>\s*import\(/.test(routes), 'Cada ruta declara path, name, component y carga lazy.', 'app/scripts/app-routes.js'),
    test('not-found-route', 'Reserva una ruta para direcciones desconocidas', (routes.match(/notFound:\s*true/g) ?? []).length === 1, 'La tabla debe declarar exactamente una ruta notFound.', 'app/scripts/app-routes.js'),
    test('cells-page', 'Compone una página Cells', /class\s+AcademyHomePage\s+extends\s+PageMixin\(ScopedElementsMixin\(LitElement\)\)/.test(page), 'La página termina en -page y aplica PageMixin.', pagePath),
    test('page-lifecycle', 'Limpia canales al abandonar la página', /onPageEnter\s*\(\)/.test(page) && /onPageLeave\s*\(\)\s*\{[\s\S]*this\.unsubscribe\(PRODUCT_SELECTED_CHANNEL\)/.test(page), 'Toda suscripción de página necesita cleanup observable en onPageLeave.', pagePath),
    test('channel-subscribe', 'Recibe el último valor del canal', /this\.subscribe\(PRODUCT_SELECTED_CHANNEL/.test(page), 'La página observa el canal estable al entrar.', pagePath),
    test('channel-publish', 'Publica un payload estable', /this\.publish\(PRODUCT_SELECTED_CHANNEL\s*,\s*product\)/.test(page), 'La selección publica un producto explícito en el mismo canal.', pagePath),
    test('named-navigation', 'Navega por nombre con parámetros', /this\.navigate\(['"]product-detail['"]\s*,\s*\{\s*id:\s*product\.id\s*\}\)/.test(page), 'La página navega por el name de la ruta y entrega el id.', pagePath),
    test('data-states', 'Modela los estados de la petición', /new\s+AbortController\(\)/.test(manager) && ['loading', 'success', 'empty', 'error'].every((state) => manager.includes(`'${state}'`)), 'El data manager distingue carga, éxito, vacío y error.', managerPath),
    test('data-race', 'Descarta respuestas antiguas', /requestId\s*!==\s*this\.requestId/.test(manager), 'Solo la petición más reciente puede publicar su resultado.', managerPath),
    test('data-cleanup', 'Cancela la petición al desconectar', /disconnect\s*\(\)\s*\{[\s\S]*this\.controller\?\.abort\(\)/.test(manager), 'disconnect debe abortar el trabajo que todavía pertenece al manager.', managerPath),
    test('public-card-event', 'El componente hijo emite una intención', /this\.emitEvent\(['"]select['"]\s*,\s*\{\s*\.\.\.this\.product\s*\}\)/.test(card), 'La tarjeta emite select; no conoce rutas ni canales de aplicación.', cardPath),
    test(
      'environment-config',
      'Separa configuración dev y prod',
      workspace.files['app/config/dev.js']?.content.includes("runtimeConfig: 'open-cells-development'") === true
        && workspace.files['app/config/prod.js']?.content.includes("runtimeConfig: 'open-cells-production'") === true,
      'Ambos entornos deben conservar configuraciones Cells explícitas y diferentes.',
      'app/config/prod.js',
    ),
  ];
  const covered = results.filter((result) => result.passed).length;
  const behaviorIds = new Set([
    'not-found-route',
    'page-lifecycle',
    'channel-subscribe',
    'channel-publish',
    'named-navigation',
    'data-states',
    'data-race',
    'data-cleanup',
    'public-card-event',
    'environment-config',
  ]);
  const behaviorsCovered = results.filter((result) => result.passed && behaviorIds.has(result.id)).length;
  return {
    results,
    coverage: {
      statements: { covered, total: results.length, percentage: Math.round((covered / results.length) * 100) },
      behaviors: { covered: behaviorsCovered, total: behaviorIds.size, percentage: Math.round((behaviorsCovered / behaviorIds.size) * 100) },
    },
  };
}

export function auditCellsProject(workspace: WorkspaceSnapshot) {
  try {
    const manifest = JSON.parse(workspace.files['package.json']?.content ?? '{}');
    return manifest.cellsProjectType === 'application'
      ? auditCellsApplication(workspace)
      : auditCellsComponent(workspace);
  } catch {
    return auditCellsComponent(workspace);
  }
}
