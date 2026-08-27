import type { WorkspaceSnapshot } from '../../types/scrim';

function moduleUrl(source: string): string {
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
}

const SCOPED_ELEMENTS_RUNTIME = `
import 'https://esm.sh/@webcomponents/scoped-custom-element-registry@0.0.10';
export { ScopedElementsMixin } from 'https://esm.sh/@open-wc/scoped-elements@3.0.6/lit-element.js';`;

const PAGE_MIXIN_RUNTIME = `
import { navigate, publish, subscribe, unsubscribe } from '@open-cells/core';

export const PageMixin = (Base) => class extends Base {
  constructor() { super(); this.__cellsSubscriptions = new Map(); }
  publish(channel, value) { publish(channel, value); }
  subscribe(channel, callback) {
    subscribe(channel, this, callback);
    this.__cellsSubscriptions.set(channel, true);
  }
  unsubscribe(channel) {
    unsubscribe(channel, this);
    this.__cellsSubscriptions.delete(channel);
  }
  navigate(page, params = {}) { return navigate(page, params); }
  disconnectedCallback() {
    super.disconnectedCallback?.();
    for (const channel of [...this.__cellsSubscriptions.keys()]) this.unsubscribe(channel);
  }
}`;

const CORE_RUNTIME = `
const values = new Map();
const listeners = new Map();
let renderRoute = null;

export function publish(channel, value) {
  values.set(channel, value);
  for (const entry of listeners.get(channel) || []) entry.callback(value);
}

export function subscribe(channel, node, callback) {
  const entries = listeners.get(channel) || new Set();
  entries.add({ node, callback });
  listeners.set(channel, entries);
  if (values.has(channel)) queueMicrotask(() => callback(values.get(channel)));
}

export function unsubscribe(channel, node) {
  const entries = listeners.get(channel);
  if (!entries) return;
  for (const entry of [...entries]) if (entry.node === node) entries.delete(entry);
  if (entries.size === 0) listeners.delete(channel);
}

export function navigate(page, params = {}) {
  if (!renderRoute) throw new Error('La aplicación Cells todavía no ha iniciado.');
  return renderRoute(page, params);
}

export function startApp({ mainNode, routes, initialTemplate, debug = false }) {
  if (debug !== false) throw new Error('El playground solo inicia Cells con debug desactivado.');
  const outlet = document.getElementById(mainNode);
  if (!outlet) throw new Error('No se encontró el outlet ' + mainNode);
  let activePage = null;
  renderRoute = async (name, params = {}) => {
    const route = routes.find((candidate) => candidate.name === name) || routes.find((candidate) => candidate.notFound);
    if (!route) throw new Error('No existe la ruta ' + name + ' ni una ruta notFound.');
    activePage?.onPageLeave?.();
    await route.action();
    const page = document.createElement(route.component);
    outlet.replaceChildren(page);
    activePage = page;
    page.onPageEnter?.(params);
    publish('__oc_app', { currentPage: route.name });
    await page.updateComplete;
    return page;
  };
  globalThis.__OPEN_CELLS_APP_READY__ = renderRoute(initialTemplate);
  return globalThis.__OPEN_CELLS_APP_READY__;
}`;

const IMPORT_MAP: Record<string, string> = {
  lit: 'https://esm.sh/lit@3.3.3',
  'lit/': 'https://esm.sh/lit@3.3.3/',
  '@webcomponents/scoped-custom-element-registry': 'https://esm.sh/@webcomponents/scoped-custom-element-registry@0.0.10',
  '@open-wc/scoped-elements/lit-element.js': moduleUrl(SCOPED_ELEMENTS_RUNTIME),
  '@open-cells/page-mixin': moduleUrl(PAGE_MIXIN_RUNTIME),
  '@open-cells/core': moduleUrl(CORE_RUNTIME),
};

const IMPORT_PATTERN = /(?:^|\n)\s*import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;

function scriptEscape(value: string): string {
  return value.replaceAll('</script', '<\\/script');
}

type LocaleCatalog = Record<'en' | 'es', Record<string, string>>;

function readLocaleCatalog(source: string, path: string): LocaleCatalog {
  try {
    const parsed = JSON.parse(source) as Partial<LocaleCatalog>;
    const validLanguage = (value: unknown): value is Record<string, string> => Boolean(value)
      && typeof value === 'object'
      && Object.values(value as Record<string, unknown>).every((text) => typeof text === 'string');
    if (!validLanguage(parsed.en) || !validLanguage(parsed.es)) throw new Error('faltan los catálogos en y es');
    return { en: parsed.en, es: parsed.es };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${path} no contiene un catálogo de locales válido: ${reason}.`);
  }
}

function readWorkspaceLocales(workspace: WorkspaceSnapshot, isApplication: boolean): LocaleCatalog {
  const paths = isApplication
    ? Object.keys(workspace.files).filter((path) => path === 'app/locales-app/locales.json' || /^app\/pages\/[^/]+\/locales\/locales\.json$/.test(path)).sort()
    : ['locales/locales.json'];
  if (paths.length === 0 || paths.some((path) => !workspace.files[path])) {
    throw new Error(isApplication
      ? 'La aplicación necesita app/locales-app/locales.json.'
      : 'El componente necesita locales/locales.json.');
  }
  return paths.reduce<LocaleCatalog>((catalog, path) => {
    const current = readLocaleCatalog(workspace.files[path].content, path);
    return { en: { ...catalog.en, ...current.en }, es: { ...catalog.es, ...current.es } };
  }, { en: {}, es: {} });
}

function validateImports(source: string): void {
  for (const match of source.matchAll(new RegExp(IMPORT_PATTERN.source, 'g'))) {
    const specifier = match[1];
    if (specifier.startsWith('.') || specifier.startsWith('/')) continue;
    if (!(specifier in IMPORT_MAP) && !specifier.startsWith('lit/')) {
      throw new Error(`El paquete ${specifier} no está disponible en el runtime Cells del navegador.`);
    }
  }
}

function normalizeModulePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replaceAll('\\', '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop(); else parts.push(part);
  }
  return parts.join('/');
}

function resolveWorkspaceImport(fromPath: string, specifier: string, paths: Set<string>): string | null {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;
  const base = specifier.startsWith('/') ? specifier.slice(1) : `${fromPath.split('/').slice(0, -1).join('/')}/${specifier}`;
  const normalized = normalizeModulePath(base);
  return [normalized, `${normalized}.js`, `${normalized}/index.js`].find((candidate) => paths.has(candidate)) ?? null;
}

function buildWorkspaceModules(
  workspace: WorkspaceSnapshot,
  entryPaths: string | string[],
  instrumentSource?: (source: string, path: string) => string,
): Record<string, string> {
  const modules = Object.values(workspace.files).filter((file) => /\.(?:js|mjs|ts)$/.test(file.path) && !file.path.endsWith('.d.ts'));
  const paths = new Set(modules.map((file) => normalizeModulePath(file.path)));
  const sources = new Map(modules.map((file) => [normalizeModulePath(file.path), file.content]));
  const reachable = new Set<string>();
  const visit = (path: string) => {
    if (reachable.has(path)) return;
    const source = sources.get(path);
    if (source === undefined) throw new Error(`No se encontró el módulo ${path} dentro del workspace.`);
    reachable.add(path);
    validateImports(source);
    const specifiers = [
      ...Array.from(source.matchAll(/(?:^|\n)\s*import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g), (match) => match[1]),
      ...Array.from(source.matchAll(/(?:^|\n)\s*export\s+[^'";]+?\s+from\s+['"]([^'"]+)['"]/g), (match) => match[1]),
      ...Array.from(source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]),
    ];
    for (const specifier of specifiers) {
      const resolved = resolveWorkspaceImport(path, specifier, paths);
      if (resolved) visit(resolved);
    }
  };
  for (const entryPath of Array.isArray(entryPaths) ? entryPaths : [entryPaths]) {
    visit(normalizeModulePath(entryPath));
  }

  const map: Record<string, string> = {};
  for (const path of reachable) {
    const source = sources.get(path)!;
    const rewritten = source
      .replace(/(from\s*['"])([^'"]+)(['"])/g, (statement, before: string, specifier: string, after: string) => {
        const resolved = resolveWorkspaceImport(path, specifier, paths);
        return resolved ? `${before}workspace:/${resolved}${after}` : statement;
      })
      .replace(/(import\(\s*['"])([^'"]+)(['"]\s*\))/g, (statement, before: string, specifier: string, after: string) => {
        const resolved = resolveWorkspaceImport(path, specifier, paths);
        return resolved ? `${before}workspace:/${resolved}${after}` : statement;
      });
    const executable = instrumentSource
      ? instrumentSource(rewritten, path)
      : rewritten;
    map[`workspace:/${path}`] = moduleUrl(executable);
  }
  return map;
}

export interface CellsPreviewBuild {
  html: string;
  warnings: string[];
  componentDemo?: {
    tagName: string;
    packageName: string;
    packageVersion?: string;
    locales: Array<'es' | 'en'>;
    source: string;
    htmlSource?: string;
    cssSource?: string;
    cases: Array<{
      id: string;
      label: string;
      sourcePath: string;
      markup: string;
      properties: Record<string, string | number | boolean>;
    }>;
    contract: Array<{ term: string; description: string }>;
    documentation?: {
      description?: string;
      properties?: Array<{
        name: string;
        attribute?: string;
        type: string;
        default?: string;
        description: string;
      }>;
      events?: Array<{
        name: string;
        detail?: string;
        bubbles?: boolean;
        composed?: boolean;
        description: string;
      }>;
      slots?: Array<{
        name: string;
        description: string;
      }>;
      cssProperties?: Array<{
        name: string;
        default?: string;
        description: string;
      }>;
      examples?: Array<{
        title: string;
        code: string;
      }>;
    };
  };
}

type ComponentDocumentation = NonNullable<NonNullable<CellsPreviewBuild['componentDemo']>['documentation']>;
type ComponentProperty = NonNullable<ComponentDocumentation['properties']>[number];

interface CustomElementsDeclaration {
  tagName?: string;
  description?: string;
  members?: Array<{
    kind?: string;
    name?: string;
    attribute?: string;
    type?: { text?: string } | string;
    default?: string;
    description?: string;
  }>;
  events?: Array<{ name?: string; type?: { text?: string } | string; description?: string }>;
  slots?: Array<{ name?: string; description?: string }>;
  cssProperties?: Array<{ name?: string; default?: string; description?: string }>;
}

function typeText(value: { text?: string } | string | undefined): string {
  if (typeof value === 'string') return value;
  return value?.text ?? 'unknown';
}

function readComponentDocumentation(workspace: WorkspaceSnapshot, tagName: string): ComponentDocumentation | undefined {
  const metadataFile = workspace.files['custom-elements.json'];
  if (!metadataFile) return undefined;
  try {
    const metadata = JSON.parse(metadataFile.content) as { modules?: Array<{ declarations?: CustomElementsDeclaration[] }> };
    const declaration = metadata.modules
      ?.flatMap((module) => module.declarations ?? [])
      .find((candidate) => candidate.tagName === tagName);
    if (!declaration) return undefined;

    const properties: ComponentProperty[] = (declaration.members ?? [])
      .filter((member) => member.kind === 'field' && member.name)
      .map((member) => ({
        name: member.name!,
        ...(member.attribute ? { attribute: member.attribute } : {}),
        type: typeText(member.type),
        ...(member.default !== undefined ? { default: member.default } : {}),
        description: member.description?.trim() ?? '',
      }));
    const events = (declaration.events ?? [])
      .filter((event) => event.name)
      .map((event) => ({
        name: event.name!,
        detail: typeText(event.type),
        description: event.description?.trim() ?? '',
      }));
    const slots = (declaration.slots ?? []).map((slot) => ({
      name: slot.name?.trim() || 'default',
      description: slot.description?.trim() ?? '',
    }));
    const cssProperties = (declaration.cssProperties ?? [])
      .filter((property) => property.name)
      .map((property) => ({
        name: property.name!,
        ...(property.default !== undefined ? { default: property.default } : {}),
        description: property.description?.trim() ?? '',
      }));

    const documentation: ComponentDocumentation = {};
    if (declaration.description?.trim()) documentation.description = declaration.description.trim();
    if (properties.length > 0) documentation.properties = properties;
    if (events.length > 0) documentation.events = events;
    if (slots.length > 0) documentation.slots = slots;
    if (cssProperties.length > 0) documentation.cssProperties = cssProperties;
    return Object.keys(documentation).length > 0 ? documentation : undefined;
  } catch {
    return undefined;
  }
}

function attributeToProperty(attribute: string, properties: ComponentProperty[]): string {
  return properties.find((property) => property.attribute === attribute)?.name
    ?? attribute.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function coerceDemoValue(value: string | true, property: ComponentProperty | undefined): string | number | boolean {
  const normalizedType = property?.type.toLowerCase() ?? '';
  if (value === true || normalizedType.includes('boolean')) return value === true || value !== 'false';
  if (normalizedType.includes('number')) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

function ensureDemoSubject(markup: string, tagName: string): string {
  if (/\bdata-cells-demo-subject\b/.test(markup)) return markup;
  return markup.replace(new RegExp(`<${tagName}\\b`, 'i'), `<${tagName} data-cells-demo-subject`);
}

function readComponentDemos(
  workspace: WorkspaceSnapshot,
  tagName: string,
  documentation: ComponentDocumentation | undefined,
): NonNullable<CellsPreviewBuild['componentDemo']>['cases'] {
  const secondaryPaths = Object.keys(workspace.files)
    .filter((path) => /^demo\/[^/]+\.html$/.test(path) && path !== 'demo/index.html')
    .sort();
  const paths = secondaryPaths.length > 0
    ? secondaryPaths
    : workspace.files['demo/index.html'] ? ['demo/index.html'] : [];
  const properties = documentation?.properties ?? [];

  return paths.flatMap((path) => {
    const source = workspace.files[path].content;
    const markup = source.match(new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, 'i'))?.[0];
    if (!markup) return [];
    const startTag = markup.match(new RegExp(`^<${tagName}\\b([^>]*)>`, 'i'))?.[1] ?? '';
    const values: Record<string, string | number | boolean> = {};
    for (const attribute of startTag.matchAll(/([A-Za-z_][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const name = attribute[1];
      if (name === 'data-cells-demo-subject' || name === 'class' || name === 'id') continue;
      const propertyName = attributeToProperty(name, properties);
      const property = properties.find((candidate) => candidate.name === propertyName);
      values[propertyName] = coerceDemoValue(attribute[2] ?? attribute[3] ?? attribute[4] ?? true, property);
    }
    const id = path.split('/').at(-1)!.replace(/\.html$/, '');
    const label = source.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      ?? id.replaceAll('-', ' ').replace(/^./, (letter) => letter.toUpperCase());
    return [{ id, label, sourcePath: path, markup: ensureDemoSubject(markup, tagName), properties: values }];
  });
}

export interface CellsPreviewOptions {
  runContractTests?: boolean;
  /** Correlaciona el resultado con la ejecución que lo solicitó. */
  testRunId?: string;
  /** Inyectado únicamente por el Worker de pruebas; el preview normal no carga Istanbul. */
  instrumentSource?: (source: string, path: string) => string;
}

export function buildCellsPreviewDocument(workspace: WorkspaceSnapshot, options: CellsPreviewOptions = {}): CellsPreviewBuild {
  if (options.runContractTests && !options.testRunId) {
    throw new Error('Las pruebas del iframe necesitan un identificador de ejecución.');
  }
  const manifest = workspace.files['package.json'];
  if (!manifest) throw new Error('El proyecto necesita package.json para construir la vista previa.');
  let packageData: { name?: string; version?: string; exports?: Record<string, string> };
  try {
    packageData = JSON.parse(manifest.content);
  } catch {
    throw new Error('package.json no contiene JSON válido.');
  }
  const isApplication = (packageData as { cellsProjectType?: string }).cellsProjectType === 'application';
  const cellsEntry = (packageData as { cells?: { entry?: string } }).cells?.entry;
  const sourcePath = cellsEntry?.replace(/^\.\//, '') ?? packageData.exports?.['.']?.replace(/^\.\//, '')
    ?? Object.keys(workspace.files).find((path) => /^src\/[^/]+\.js$/.test(path));
  if (!sourcePath || !workspace.files[sourcePath]) throw new Error('No se encontró la entrada pública del componente.');
  const source = workspace.files[sourcePath].content;
  validateImports(source);

  const demo = (isApplication ? workspace.files['index.html'] : workspace.files['demo/index.html'])?.content ?? '';
  if (/<script\b[^>]*\bsrc=["'](?:https?:)?\/\//i.test(demo)) {
    throw new Error('La vista previa no ejecuta scripts remotos introducidos por el proyecto.');
  }
  const body = demo.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]
    ?.replace(/<script\b[\s\S]*?<\/script>/gi, '')
    ?.trim()
    || `<p>No hay contenido en demo/index.html.</p>`;
  const demoModule = demo.match(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/i)?.[1]
    ?? demo.match(/<script\b[^>]*src=["']([^"']+)["'][^>]*type=["']module["']/i)?.[1];
  const executionPath = !isApplication && demoModule
    ? normalizeModulePath(`demo/${demoModule}`)
    : sourcePath;
  if (!workspace.files[executionPath]) throw new Error(`La entrada ejecutable ${executionPath} no existe en el workspace.`);
  const locales = readWorkspaceLocales(workspace, isApplication);
  const testEntries = options.runContractTests && isApplication && workspace.files['app/data/academy-product-data-manager.js']
    ? [executionPath, 'app/data/academy-product-data-manager.js']
    : executionPath;
  const importMap = JSON.stringify({ imports: {
    ...IMPORT_MAP,
    ...buildWorkspaceModules(workspace, testEntries, options.instrumentSource),
  } });
  const localeData = JSON.stringify(locales);
  const definedTag = Object.values(workspace.files)
    .map((file) => file.content.match(/customElements\.define\(['"]([^'"]+)/)?.[1])
    .find(Boolean) ?? 'open-cells-component';
  const componentSource = Object.values(workspace.files).find((file) => (
    /^src\/[^/]+\.js$/.test(file.path) && /WidgetMixin\s*\(/.test(file.content)
  ))?.content ?? source;
  const componentDocumentation = isApplication ? undefined : readComponentDocumentation(workspace, definedTag);
  const componentDemos = isApplication ? [] : readComponentDemos(workspace, definedTag, componentDocumentation);
  // Extract the component tag from the demo HTML body, then strip hardcoded attributes
  // so the component initializes with its own class defaults from the student's code
  const rawMarkup = body.match(new RegExp(`<${definedTag}\\b[\\s\\S]*?<\\/${definedTag}>`, 'i'))?.[0];
  const componentMarkup = rawMarkup
    ? rawMarkup.replace(new RegExp(`^<${definedTag}\\b[^>]*>`, 'i'), `<${definedTag} data-cells-demo-subject>`)
    : `<${definedTag} data-cells-demo-subject></${definedTag}>`;
  const renderedBody = isApplication ? body : componentMarkup;
  const componentContractHarness = `
  const results = [];
  const check = (id, title, passed, message) => results.push({ id, title, passed: Boolean(passed), message });
  const invokedMethods = [];
  const initialContractLocale = globalThis.__OPEN_CELLS_LOCALE__;
  try {
    const element = document.querySelector('${definedTag}');
    if (!element) throw new Error('La demo no contiene ${definedTag}.');
    invokedMethods.push('constructor');
    await element.updateComplete;

    const originalRender = element.render?.bind(element);
    if (originalRender) {
      element.render = (...args) => { invokedMethods.push('render'); return originalRender(...args); };
    }
    const originalContinue = element.handleContinue?.bind(element);
    if (originalContinue) {
      element.handleContinue = (...args) => { invokedMethods.push('handleContinue'); return originalContinue(...args); };
    }

    globalThis.__OPEN_CELLS_LOCALE__ = 'es';
    element.learnerName = 'Lina';
    element.requestUpdate?.();
    await element.updateComplete;
    let titleHost = element.shadowRoot?.querySelector('academy-type-text');
    await titleHost?.updateComplete;
    const spanishText = (element.shadowRoot?.textContent || '') + ' ' + (titleHost?.textContent || '') + ' ' + (titleHost?.shadowRoot?.textContent || '');
    check('browser-render-es', 'Renderiza propiedades y español', spanishText.includes('Lina') && spanishText.includes('Estás aprendiendo'), 'El DOM público debe reflejar learnerName y el catálogo español.');

    const scoped = element.constructor.scopedElements || {};
    invokedMethods.push('scopedElements');
    check('browser-scoped', 'Resuelve ambas dependencias scoped', Boolean(scoped['academy-type-text'] && scoped['academy-action-button']), 'El registro local debe exponer los dos componentes didácticos como clases.');

    globalThis.__OPEN_CELLS_LOCALE__ = 'en';
    element.requestUpdate?.();
    await element.updateComplete;
    titleHost = element.shadowRoot?.querySelector('academy-type-text');
    await titleHost?.updateComplete;
    const englishText = (element.shadowRoot?.textContent || '') + ' ' + (titleHost?.textContent || '') + ' ' + (titleHost?.shadowRoot?.textContent || '');
    check('browser-render-en', 'Cambia el idioma sin recrear el host', englishText.includes('Lina') && englishText.includes('You are learning'), 'El mismo host debe actualizarse con el catálogo inglés.');

    let event = null;
    element.addEventListener('${definedTag}-continue', (received) => { event = received; }, { once: true });
    element.requestUpdate?.();
    await element.updateComplete;
    const buttonHost = element.shadowRoot?.querySelector('academy-action-button');
    await buttonHost?.updateComplete;
    buttonHost?.shadowRoot?.querySelector('button')?.click();
    check('browser-event', 'El botón emite el evento público', event?.detail?.learnerName === 'Lina' && event.bubbles && event.composed, 'El click debe producir detail, bubbles y composed observables.');
  } catch (error) {
    check('browser-runner', 'El componente puede probarse en aislamiento', false, error?.message || String(error));
  }
  globalThis.__OPEN_CELLS_LOCALE__ = initialContractLocale;
  for (const element of document.querySelectorAll('*')) element.requestUpdate?.();
  window.parent.postMessage({ source: 'open-cells-tests', type: 'complete', testRunId: ${JSON.stringify(options.testRunId ?? '')}, results, invokedMethods, coverage: globalThis.__cellsCoverage__ || {} }, '*');`;
  const applicationChannel = workspace.files['app/scripts/channels.js']?.content.match(/['"](academy:[^'"]+)['"]/)?.[1] ?? '';
  const applicationContractHarness = `
  const results = [];
  const invokedMethods = [];
  const check = (id, title, passed, message) => results.push({ id, title, passed: Boolean(passed), message });
  const waitFor = async (read, label) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const value = read();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return null;
  };
  try {
    const home = await waitFor(() => document.querySelector('academy-home-page'), 'la página inicial');
    invokedMethods.push('constructor', 'onPageEnter', 'render');
    await home.updateComplete;
    const cards = home.shadowRoot?.querySelectorAll('academy-product-card') || [];
    check('app-home', 'Monta la página inicial y sus componentes', cards.length === 2, 'La página inicial debe renderizar dos consumidores del componente hijo.');

    const firstCard = cards[0];
    await firstCard?.updateComplete;
    const firstId = firstCard?.product?.id;
    firstCard?.shadowRoot?.querySelector('button')?.click();
    invokedMethods.push('handleProductSelected', 'onPageLeave');
    const detail = await waitFor(() => document.querySelector('academy-product-detail-page'), 'la navegación al detalle');
    await detail?.updateComplete;
    check('app-navigation', 'Navega por nombre y entrega parámetros', detail?.productId === firstId, 'El detalle debe recibir el id elegido, no un valor fijo.');

    const { publish, navigate } = await import('@open-cells/core');
    const selectionBefore = home.lastSelection;
    publish(${JSON.stringify(applicationChannel)}, { id: 'after-leave' });
    await Promise.resolve();
    check('app-cleanup', 'La página anterior deja de recibir el canal', home.lastSelection === selectionBefore, 'onPageLeave debe cortar la suscripción antes de que otro valor se publique.');
    await navigate('route-that-does-not-exist');
    const notFound = await waitFor(() => document.querySelector('academy-not-found-page'), 'la ruta desconocida');
    check('app-not-found', 'Una ruta desconocida tiene salida visible', Boolean(notFound), 'La tabla debe conservar una única ruta notFound.');

    const { AcademyProductDataManager } = await import('workspace:/app/data/academy-product-data-manager.js');
    const manager = new AcademyProductDataManager();
    invokedMethods.push('constructor');
    const states = [];
    manager.addEventListener('state-changed', (event) => states.push(event.detail.state));
    await manager.load(async () => [{ id: 'dynamic' }]);
    await manager.load(async () => []);
    invokedMethods.push('load', 'emit');
    check('app-data-states', 'El data manager distingue success y empty', states.join(',') === 'loading,success,loading,empty', 'Una respuesta vacía no debe confundirse con loading ni success.');

    let abortSignal = null;
    const pending = manager.load(({ signal }) => {
      abortSignal = signal;
      return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Cancelada', 'AbortError')), { once: true }));
    });
    manager.disconnect();
    invokedMethods.push('load', 'disconnect');
    await pending;
    check('app-data-cleanup', 'disconnect cancela la petición activa', abortSignal?.aborted === true, 'El manager debe abortar el trabajo que todavía le pertenece.');
  } catch (error) {
    check('app-browser-runner', 'La aplicación puede probarse como historia vertical', false, error?.message || String(error));
  }
  window.parent.postMessage({ source: 'open-cells-tests', type: 'complete', testRunId: ${JSON.stringify(options.testRunId ?? '')}, results, invokedMethods, coverage: globalThis.__cellsCoverage__ || {} }, '*');`;
  const contractHarness = !options.runContractTests
    ? ''
    : isApplication ? applicationContractHarness : componentContractHarness;
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' data: https://esm.sh; style-src 'unsafe-inline'; connect-src https://esm.sh; img-src data:;">
  <script type="importmap">${importMap}</script>
  <script>
    globalThis.__OPEN_CELLS_LOCALES__ = ${scriptEscape(localeData)};
    globalThis.__OPEN_CELLS_LOCALE__ = 'es';
    globalThis.__OPEN_CELLS_CONTRACT_TESTS__ = ${options.runContractTests === true};
    globalThis.IntlMsg = {
      get lang() { return globalThis.__OPEN_CELLS_LOCALE__; },
      set lang(value) {
        globalThis.__OPEN_CELLS_LOCALE__ = value;
        globalThis.dispatchEvent(new Event('language-update'));
      },
      loadUrlResourcesComplete: Promise.resolve(),
      t(key, values = {}) {
        const catalogs = globalThis.__OPEN_CELLS_LOCALES__ || {};
        const language = globalThis.__OPEN_CELLS_LOCALE__ || 'es';
        const template = catalogs[language]?.[key] ?? catalogs.es?.[key] ?? catalogs.en?.[key] ?? ('[' + key + ']');
        return Object.entries(values).reduce((text, [name, value]) => text.split('$' + '{' + name + '}').join(String(value)), template);
      },
    };

    const forwardCustomEvent = (name, detail, bubbles = false, composed = false) => {
      try {
        window.parent.postMessage({
          source: 'open-cells-preview',
          type: 'component:event',
          name: String(name),
          detail: detail,
          bubbles: Boolean(bubbles),
          composed: Boolean(composed),
          timestamp: Date.now(),
        }, '*');
      } catch {}
    };

    // Observe public events from the demo subject, without leaking internal child events.
    const originalDispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function(event) {
      if (
        event
        && (event instanceof CustomEvent || event.detail !== undefined)
        && this === document.querySelector('[data-cells-demo-subject]')
      ) {
        forwardCustomEvent(event.type, event.detail, event.bubbles, event.composed);
      }
      return originalDispatch.apply(this, arguments);
    };

    // Intercept console logs to forward to host playground
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalErr = console.error;
    console.log = (...args) => {
      try {
        window.parent.postMessage({
          source: 'open-cells-preview',
          type: 'console',
          level: 'log',
          args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)),
          timestamp: Date.now(),
        }, '*');
      } catch {}
      originalLog.apply(console, args);
    };
    console.warn = (...args) => {
      try {
        window.parent.postMessage({
          source: 'open-cells-preview',
          type: 'console',
          level: 'warn',
          args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)),
          timestamp: Date.now(),
        }, '*');
      } catch {}
      originalWarn.apply(console, args);
    };
    console.error = (...args) => {
      try {
        window.parent.postMessage({
          source: 'open-cells-preview',
          type: 'console',
          level: 'error',
          args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)),
          timestamp: Date.now(),
        }, '*');
      } catch {}
      originalErr.apply(console, args);
    };

    const markUnresolvedScopedElements = async (subject) => {
      if (!subject) return;
      await subject.updateComplete;
      const root = subject.shadowRoot;
      if (!root) return;
      for (const node of root.querySelectorAll('[data-cells-unresolved-element]')) {
        node.removeAttribute('data-cells-unresolved-element');
        node.removeAttribute('aria-invalid');
        node.removeAttribute('title');
        node.style.removeProperty('outline');
        node.style.removeProperty('outline-offset');
        node.style.removeProperty('background');
      }
      for (const node of root.querySelectorAll('*')) {
        if (!node.localName.includes('-') || node.constructor !== HTMLElement) continue;
        node.setAttribute('data-cells-unresolved-element', node.localName);
        node.setAttribute('aria-invalid', 'true');
        node.setAttribute('title', 'Componente no registrado: <' + node.localName + '>');
        node.style.setProperty('outline', '2px dashed #dc2626');
        node.style.setProperty('outline-offset', '4px');
        node.style.setProperty('background', 'rgba(220, 38, 38, 0.08)');
      }
    };

    const reportPreviewError = (message) => window.parent.postMessage({ source: 'open-cells-preview', type: 'error', message: String(message) }, '*');
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent || event.data?.source !== 'open-cells-shell') return;
      if (event.data.type === 'locale:set' && ['es', 'en'].includes(event.data.locale)) {
        if (globalThis.__OPEN_CELLS_CONTRACT_TESTS__) return;
        globalThis.IntlMsg.lang = event.data.locale;
        for (const element of document.querySelectorAll('*')) element.requestUpdate?.();
        window.parent.postMessage({ source: 'open-cells-preview', type: 'locale:changed', locale: event.data.locale }, '*');
      }
      if (event.data.type === 'demo:set-case' && !globalThis.__OPEN_CELLS_CONTRACT_TESTS__) {
        let subject = document.querySelector('[data-cells-demo-subject]');
        if (subject && event.data.markup && subject.dataset.cellsDemoCase !== event.data.caseId) {
          const template = document.createElement('template');
          template.innerHTML = String(event.data.markup).trim();
          const replacement = template.content.firstElementChild;
          if (replacement && replacement.localName === subject.localName) {
            replacement.setAttribute('data-cells-demo-subject', '');
            replacement.dataset.cellsDemoCase = String(event.data.caseId || '');
            subject.replaceWith(replacement);
            subject = replacement;
          }
        }
        if (subject) {
          for (const [property, value] of Object.entries(event.data.properties || {})) {
            subject[property] = value;
            const attribute = property.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
            if (typeof value === 'boolean') subject.toggleAttribute(attribute, value);
            else if (value === null || value === undefined) subject.removeAttribute(attribute);
            else subject.setAttribute(attribute, String(value));
          }
          subject.requestUpdate?.();
          void markUnresolvedScopedElements(subject);
        }
        window.parent.postMessage({ source: 'open-cells-preview', type: 'case:changed', caseId: event.data.caseId }, '*');
      }
    });
    window.addEventListener('error', (event) => reportPreviewError(event.message || 'Error al ejecutar la vista previa.'));
    window.addEventListener('unhandledrejection', (event) => reportPreviewError(event.reason?.message || event.reason || 'Promesa rechazada en la vista previa.'));
  </script>
  <style>${isApplication
    ? 'body{margin:0;background:#f5f2eb;color:#171717;font-family:system-ui,sans-serif}'
    : 'html,body{min-height:100%;margin:0;box-sizing:border-box}body{display:grid;place-items:center;padding:clamp(1rem,4vw,2.5rem);background:linear-gradient(180deg,#fff 0%,#faf8ec 100%);font-family:system-ui,-apple-system,sans-serif}[data-cells-demo-subject]{width:min(100%,34rem);display:block}'}</style>
</head>
<body>
${renderedBody}
<script type="module">
try {
  await import('workspace:/${executionPath}');
  ${isApplication
    ? `await globalThis.__OPEN_CELLS_APP_READY__;`
    : `await customElements.whenDefined('${definedTag}');`}
  const subject = document.querySelector('[data-cells-demo-subject]');
  const initialProps = {};
  if (subject) {
    for (const key of Object.keys(subject.constructor.properties || {})) {
      if (subject[key] !== undefined) initialProps[key] = subject[key];
    }
  }
  await markUnresolvedScopedElements(subject);
  window.parent.postMessage({ source: 'open-cells-preview', type: 'ready', initialProps }, '*');
  ${contractHarness}
} catch (error) {
  reportPreviewError(error?.message || error);
}
</script>
</body>
</html>`;
  const demoHtml = workspace.files['demo/index.html']?.content;
  const scssFile = Object.values(workspace.files).find((f) => f.path.endsWith('.scss'))?.content;
  const availableLocales = Object.keys(locales)
    .filter((locale): locale is 'es' | 'en' => locale === 'es' || locale === 'en')
    .sort();
  const currentCodeCase: NonNullable<CellsPreviewBuild['componentDemo']>['cases'][number] = {
    id: 'current-code',
    label: 'Código actual',
    sourcePath,
    markup: `<${definedTag} data-cells-demo-subject></${definedTag}>`,
    properties: {},
  };
  const demoCases = [currentCodeCase, ...componentDemos];
  const documentation = componentDocumentation ? {
    ...componentDocumentation,
    examples: demoCases.map((demoCase) => ({ title: demoCase.label, code: demoCase.markup })),
  } : undefined;

  return {
    html,
    warnings: [],
    ...(isApplication ? {} : {
      componentDemo: {
        tagName: definedTag,
        packageName: packageData.name ?? definedTag,
        packageVersion: packageData.version,
        locales: availableLocales,
        source: componentSource,
        htmlSource: demoHtml,
        cssSource: scssFile,
        cases: demoCases,
        contract: [
          { term: 'Elemento', description: `<${definedTag}>` },
          ...(componentDocumentation?.properties ?? []).map((property) => ({
            term: 'Propiedad',
            description: property.attribute ? `${property.name} / ${property.attribute}` : property.name,
          })),
          ...(componentDocumentation?.events ?? []).map((event) => ({ term: 'Evento', description: event.name })),
          ...(scssFile ? [{ term: 'Estilos', description: 'SCSS fuente → css.js generado → static styles' }] : []),
        ],
        ...(documentation ? { documentation } : {}),
      },
    }),
  };
}
