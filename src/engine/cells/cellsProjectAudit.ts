import type { WorkspaceSnapshot } from '../../types/scrim';
import type { CellsCoverageResult, CellsTestResult } from './cellsWorkerProtocol';

function test(id: string, title: string, passed: boolean, message: string, filePath?: string): CellsTestResult {
  return { id, title, passed, message, ...(filePath ? { filePath } : {}) };
}

function localeKeys(source = '', language: 'en' | 'es'): string[] {
  try {
    const catalog = JSON.parse(source) as Record<string, Record<string, unknown>>;
    return Object.entries(catalog[language] ?? {})
      .filter(([, value]) => typeof value === 'string')
      .map(([key]) => key)
      .sort();
  } catch {
    return [];
  }
}

function jsonRecord(source = ''): Record<string, any> {
  try {
    return JSON.parse(source) as Record<string, any>;
  } catch {
    return {};
  }
}

function placeholders(value: unknown): string[] {
  return typeof value === 'string'
    ? Array.from(value.matchAll(/\$\{([^}]+)\}/g), (match) => match[1]).sort()
    : [];
}

export function auditCellsComponent(workspace: WorkspaceSnapshot): { results: CellsTestResult[]; coverage: CellsCoverageResult } {
  const sourcePath = Object.keys(workspace.files).find((path) => (
    /^src\/[^/]+\.js$/.test(path)
    && !path.includes('/locales/')
    && /WidgetMixin\s*\(/.test(workspace.files[path].content)
  ));
  const source = sourcePath ? workspace.files[sourcePath].content : '';
  const demo = workspace.files['demo/index.html']?.content ?? '';
  const demoController = workspace.files['demo/demo.js']?.content ?? '';
  const localeSource = workspace.files['locales/locales.json']?.content;
  const localeCatalog = jsonRecord(localeSource);
  const manifest = jsonRecord(workspace.files['package.json']?.content);
  const metadata = jsonRecord(workspace.files['custom-elements.json']?.content);
  const readme = workspace.files['README.md']?.content ?? '';
  const enKeys = localeKeys(localeSource, 'en');
  const esKeys = localeKeys(localeSource, 'es');
  const tagName = Object.values(workspace.files)
    .map((file) => file.content.match(/customElements\.define\(['"]([^'"]+)/)?.[1])
    .find(Boolean);
  const componentTest = tagName ? workspace.files[`test/unit/${tagName}.test.js`]?.content ?? '' : '';
  const scopedRegistry = source.match(/static\s+get\s+scopedElements\s*\(\)\s*\{\s*return\s*\{([\s\S]*?)\}\s*;?\s*\}/)?.[1] ?? '';
  const publicProperties = source.match(/static\s+properties\s*=\s*\{([\s\S]*?)\n\s*\};/)?.[1] ?? '';
  const learnerNameContract = publicProperties.match(/learnerName\s*:\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const translationCalls = Array.from(source.matchAll(/this\.t\(['"]([^'"]+)['"]/g), (match) => match[1]);
  const uniqueCalls = [...new Set(translationCalls)];
  const scssPath = tagName ? `src/${tagName}.scss` : '';
  const cssModulePath = tagName ? `src/${tagName}.css.js` : '';
  const scssSource = scssPath ? workspace.files[scssPath]?.content.trim() ?? '' : '';
  const cssModuleSource = cssModulePath ? workspace.files[cssModulePath]?.content ?? '' : '';
  const importedStyleName = tagName
    ? source.match(new RegExp(`import\\s+([A-Za-z_$][\\w$]*)\\s+from\\s+['"]\\./${tagName}\\.css\\.js['"]`))?.[1]
    : undefined;
  const consumesGeneratedStyles = Boolean(
    tagName
    && scssSource
    && cssModuleSource.includes(scssSource)
    && importedStyleName
    && new RegExp(`static\\s+styles\\s*=\\s*${importedStyleName}\\s*;`).test(source)
    && !/static\s+styles\s*=\s*css`/.test(source),
  );

  const results = [
    test('package-contract', 'Declara entradas y comandos consumibles', manifest.exports?.['.'] === './index.js' && manifest.scripts?.documentation === 'cells component:documentation', 'package.json debe exponer index.js y conservar el comando Cells de documentación.', 'package.json'),
    test('source-entry', 'Existe una entrada pública', Boolean(sourcePath), sourcePath ? 'Se encontró el módulo principal.' : 'Falta un archivo principal dentro de src/.'),
    test('cells-mixins', 'Compone los mixins Cells', /WidgetMixin\(ScopedElementsMixin\(LitElement\)\)/.test(source), 'La clase debe componer WidgetMixin y ScopedElementsMixin.', sourcePath),
    test('public-property', 'Declara la entrada pública learnerName', /\btype\s*:\s*String\b/.test(learnerNameContract) && /\battribute\s*:\s*['"]learner-name['"]/.test(learnerNameContract), 'learnerName debe ser una propiedad String configurable también mediante learner-name.', sourcePath),
    test('scoped-components', 'Registra dependencias scoped', /['"]academy-type-text['"]\s*:\s*AcademyTypeText/.test(scopedRegistry) && /['"]academy-action-button['"]\s*:\s*AcademyActionButton/.test(scopedRegistry), 'Registra los componentes locales del ejercicio dentro de scopedElements.', sourcePath),
    test('translated-copy', 'Traduce el texto visible', uniqueCalls.length >= 3 && !/this\.t\([^)]*\)\s*\|\|/.test(source), 'Usa this.t con claves reales y sin ocultar errores con un fallback vacío.', sourcePath),
    test('locale-parity', 'Mantiene EN y ES sincronizados', enKeys.length > 0 && JSON.stringify(enKeys) === JSON.stringify(esKeys), 'El catálogo fuente debe contener exactamente las mismas claves en EN y ES.', 'locales/locales.json'),
    test('locale-placeholders', 'Conserva placeholders entre idiomas', esKeys.every((key) => JSON.stringify(placeholders(localeCatalog.es?.[key])) === JSON.stringify(placeholders(localeCatalog.en?.[key]))), 'Cada clave debe conservar los mismos nombres de placeholder en EN y ES.', 'locales/locales.json'),
    test('public-event', 'Emite un evento público', /this\.emitEvent\(\s*['"]continue['"]\s*,\s*[^)\s][^)]*\)/s.test(source), 'Emite continue con un detail útil; el nombre público incluye el tag del componente.', sourcePath),
    test('demo-renders', 'La demo instancia el componente', Boolean(tagName && new RegExp(`<${tagName}(?:\\s|>)`).test(demo)), 'La demo debe incluir el tag definido por el componente.', 'demo/index.html'),
    test('demo-public-entry', 'La demo consume la entrada pública', Boolean(tagName && demoController.includes(`from '../${tagName}.js'`)), 'demo/demo.js debe importar la entrada pública que utilizará una aplicación consumidora.', 'demo/demo.js'),
    test('demo-controls-property', 'La demo configura la propiedad pública', /[A-Za-z_$][\w$]*\.learnerName\s*=\s*[A-Za-z_$][\w$]*\.target\.value/.test(demoController), 'El control de nombre debe modificar learnerName en la instancia, no una copia interna.', 'demo/demo.js'),
    test('style-pair', 'Consume el css.js generado desde el SCSS', consumesGeneratedStyles, 'Conserva el SCSS como fuente, genera el css.js equivalente, impórtalo como styles y úsalo en static styles.', sourcePath),
    test('test-public-event', 'Prueba el evento desde la API pública', /expect\([^)]*\.detail\)\.toEqual\(/.test(componentTest) && /expect\([^)]*\.bubbles\)\.toBe\(true\)/.test(componentTest) && /expect\([^)]*\.composed\)\.toBe\(true\)/.test(componentTest), 'La suite debe comprobar detail, bubbles y composed a partir del evento recibido por un consumidor.', tagName ? `test/unit/${tagName}.test.js` : undefined),
    test('metadata-contract', 'Alinea metadata y tag público', Boolean(tagName && metadata.modules?.some?.((module: any) => module.declarations?.some?.((declaration: any) => declaration.tagName === tagName))), 'custom-elements.json debe describir el mismo tag que registra la entrada pública.', 'custom-elements.json'),
    test('readme-consumer-path', 'Documenta consumo y evento público', Boolean(tagName && readme.includes(`${tagName}-continue`) && /cells component:(?:test|dev|documentation)/.test(readme)), 'README debe explicar el evento público y al menos un comando Cells para continuar el proyecto.', 'README.md'),
  ];
  const covered = results.filter((result) => result.passed).length;
  const behaviorIds = new Set(['public-property', 'scoped-components', 'translated-copy', 'locale-placeholders', 'public-event', 'demo-renders', 'demo-public-entry', 'demo-controls-property', 'style-pair', 'test-public-event', 'metadata-contract']);
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
  const globalLocales = workspace.files['app/locales-app/locales.json']?.content ?? '';
  const homeLocales = workspace.files['app/pages/academy-home-page/locales/locales.json']?.content ?? '';
  const nativeAdapterPath = 'app/bridge/native-adapter.js';
  const nativeAdapter = workspace.files[nativeAdapterPath]?.content ?? '';
  const results = [
    test('app-entry', 'Arranca desde una entrada Cells', /startApp\s*\(\s*\{/.test(workspace.files['app/scripts/app.js']?.content ?? ''), 'La entrada debe entregar rutas y mainNode al runtime público de Cells.', 'app/scripts/app.js'),
    test('declarative-routes', 'Declara rutas lazy por nombre', /name:\s*['"]home['"]/.test(routes) && /path:\s*['"]\/product\/:id['"]/.test(routes) && /action:\s*async\s*\(\)\s*=>\s*import\(/.test(routes), 'Cada ruta declara path, name, component y carga lazy.', 'app/scripts/app-routes.js'),
    test('not-found-route', 'Reserva una ruta para direcciones desconocidas', (routes.match(/notFound:\s*true/g) ?? []).length === 1, 'La tabla debe declarar exactamente una ruta notFound.', 'app/scripts/app-routes.js'),
    test('cells-page', 'Compone una página Cells', /class\s+AcademyHomePage\s+extends\s+PageMixin\(ScopedElementsMixin\(LitElement\)\)/.test(page), 'La página termina en -page y aplica PageMixin.', pagePath),
    test('page-lifecycle', 'Limpia canales al abandonar la página', /onPageEnter\s*\(\)/.test(page) && /onPageLeave\s*\(\)\s*\{[\s\S]*this\.unsubscribe\(PRODUCT_SELECTED_CHANNEL\)/.test(page), 'Toda suscripción de página necesita cleanup observable en onPageLeave.', pagePath),
    test('channel-subscribe', 'Recibe el último valor del canal', /this\.subscribe\(PRODUCT_SELECTED_CHANNEL/.test(page), 'La página observa el canal estable al entrar.', pagePath),
    test('channel-publish', 'Publica un payload estable', /this\.publish\(\s*PRODUCT_SELECTED_CHANNEL\s*,\s*[^)\s][^)]*\)/s.test(page), 'La selección publica un producto explícito en el mismo canal.', pagePath),
    test('native-boundary', 'Traduce mensajes externos en una frontera', /typeof\s+message(?:\?\.|\.)type\s*!==\s*['"]string['"]/.test(nativeAdapter) && /publish\(\s*APP_LIFECYCLE_CHANNEL\s*,\s*[^)\s][^)]*\)/s.test(nativeAdapter) && /navigate\(\s*message\.route\s*,\s*[^)\s][^)]*\)/s.test(nativeAdapter), 'El adaptador debe validar el mensaje y traducir ciclo o deep link a contratos internos.', nativeAdapterPath),
    test('named-navigation', 'Navega por nombre con parámetros', /this\.navigate\(\s*['"]product-detail['"]\s*,\s*\{[\s\S]*?\bid\s*:\s*[A-Za-z_$][\w$]*\.id[\s\S]*?\}\s*\)/.test(page), 'La página navega por el name de la ruta y entrega el id.', pagePath),
    test('data-states', 'Modela los estados de la petición', /new\s+AbortController\(\)/.test(manager) && ['loading', 'success', 'empty', 'error'].every((state) => manager.includes(`'${state}'`)), 'El data manager distingue carga, éxito, vacío y error.', managerPath),
    test('data-race', 'Descarta respuestas antiguas', /(?:requestId\s*!==\s*this\.requestId|this\.requestId\s*!==\s*requestId)/.test(manager), 'Solo la petición más reciente puede publicar su resultado.', managerPath),
    test('data-cleanup', 'Cancela la petición al desconectar', /disconnect\s*\(\)\s*\{[\s\S]*?this\.controller[\s\S]*?\.abort\(\)[\s\S]*?\}/.test(manager), 'disconnect debe abortar el trabajo que todavía pertenece al manager.', managerPath),
    test('public-card-event', 'El componente hijo emite una intención', /this\.emitEvent\(\s*['"]select['"]\s*,\s*[^)\s][^)]*\)/s.test(card), 'La tarjeta emite select; no conoce rutas ni canales de aplicación.', cardPath),
    test('app-locales', 'Separa textos globales y de página', localeKeys(globalLocales, 'es').includes('app.title') && localeKeys(homeLocales, 'es').includes('home.title') && !localeKeys(homeLocales, 'es').includes('app.title'), 'Los textos globales viven en locales-app y cada página conserva su catálogo dentro de su carpeta.', 'app/pages/academy-home-page/locales/locales.json'),
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
    'native-boundary',
    'named-navigation',
    'data-states',
    'data-race',
    'data-cleanup',
    'public-card-event',
    'app-locales',
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
