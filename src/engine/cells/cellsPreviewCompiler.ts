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

const BBVA_TYPE_TEXT_RUNTIME = `
import { LitElement, html } from 'lit';
export class BbvaTypeText extends LitElement {
  static properties = { text: { type: String } };
  constructor() { super(); this.text = ''; }
  render() { return html\`<span part="text">\${this.text}</span>\`; }
}`;

const BBVA_BUTTON_DEFAULT_RUNTIME = `
import { LitElement, css, html } from 'lit';
export class BbvaButtonDefault extends LitElement {
  static properties = { disabled: { type: Boolean, reflect: true }, text: { type: String } };
  static styles = css\`button{font:700 .78rem/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:.9rem 1.35rem;border:0;border-radius:999px;background:#2d7462;color:white;box-shadow:0 .45rem 0 #0b382f;cursor:pointer}button:active{transform:translateY(.2rem);box-shadow:0 .25rem 0 #0b382f}button:disabled{opacity:.55;cursor:not-allowed}\`;
  constructor() { super(); this.disabled = false; this.text = ''; }
  render() { return html\`<button type="button" ?disabled=\${this.disabled}>\${this.text}<slot></slot></button>\`; }
}`;

const IMPORT_MAP: Record<string, string> = {
  lit: 'https://esm.sh/lit@3.3.3',
  'lit/': 'https://esm.sh/lit@3.3.3/',
  '@webcomponents/scoped-custom-element-registry': 'https://esm.sh/@webcomponents/scoped-custom-element-registry@0.0.10',
  '@open-wc/scoped-elements/lit-element.js': moduleUrl(SCOPED_ELEMENTS_RUNTIME),
  '@open-cells/page-mixin': moduleUrl(PAGE_MIXIN_RUNTIME),
  '@open-cells/core': moduleUrl(CORE_RUNTIME),
  '@bbva-spherica-components/bbva-type-text': moduleUrl(BBVA_TYPE_TEXT_RUNTIME),
  '@bbva-spherica-components/bbva-button-default': moduleUrl(BBVA_BUTTON_DEFAULT_RUNTIME),
};

const IMPORT_PATTERN = /(?:^|\n)\s*import\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;

function scriptEscape(value: string): string {
  return value.replaceAll('</script', '<\\/script');
}

function htmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const COMPONENT_DEMO_STYLES = `
  :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#17212b;background:#f7f9fb}
  *{box-sizing:border-box}
  body{margin:0;min-width:320px;background:#f7f9fb}
  button,select,input{font:inherit}
  [data-cells-demo-shell]{min-height:100vh;display:flex;flex-direction:column}
  .cells-demo-topbar{display:grid;grid-template-columns:minmax(14rem,1fr) auto auto;align-items:center;gap:1rem;min-height:5.25rem;padding:1rem 1.5rem;border-bottom:1px solid #d7e0e8;background:white}
  .cells-demo-identity{min-width:0;padding-right:1.5rem;border-right:1px solid #d7e0e8}
  .cells-demo-identity strong,.cells-demo-identity span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cells-demo-identity strong{font-size:1rem}.cells-demo-identity span{margin-top:.2rem;color:#607080;font-size:.75rem}
  .cells-demo-case{display:flex;align-items:center;gap:.55rem;color:#607080;font-size:.72rem;font-weight:700}
  .cells-demo-case select{min-width:8.5rem;padding:.65rem 2rem .65rem .75rem;border:1px solid #ccd8e1;border-radius:.7rem;background:#f0f5f8;color:#17212b;font-weight:700}
  .cells-demo-tabs,.cells-demo-languages{display:flex;padding:.25rem;border:1px solid #ccd8e1;border-radius:.8rem;background:#eef3f7}
  .cells-demo-tabs button,.cells-demo-languages button{min-height:2.35rem;padding:.5rem .95rem;border:0;border-radius:.6rem;background:transparent;color:#536477;font-size:.75rem;font-weight:800;cursor:pointer}
  .cells-demo-tabs button[aria-selected="true"],.cells-demo-languages button[aria-pressed="true"]{background:white;color:#17212b;box-shadow:0 .2rem .65rem rgb(29 51 70 / 12%)}
  .cells-demo-languages button[aria-pressed="true"]{background:#075a75;color:white}
  .cells-demo-topbar__end{display:flex;align-items:center;justify-content:flex-end;gap:1rem}
  .cells-demo-hide{display:flex;align-items:center;gap:.5rem;color:#607080;font-size:.75rem;font-weight:700;white-space:nowrap}
  .cells-demo-viewportbar{display:flex;align-items:center;justify-content:center;gap:.7rem;min-height:4rem;padding:.65rem 1rem;border-bottom:1px solid #d7e0e8;background:#fff}
  .cells-demo-presets{display:flex;padding:.2rem;border:1px solid #ccd8e1;border-radius:.7rem;background:#eef3f7}
  .cells-demo-presets button{padding:.55rem .75rem;border:0;border-radius:.5rem;background:transparent;color:#536477;font-size:.7rem;font-weight:800;cursor:pointer}
  .cells-demo-presets button[aria-pressed="true"]{background:white;color:#17212b;box-shadow:0 .15rem .5rem rgb(29 51 70 / 12%)}
  .cells-demo-size{padding-left:.8rem;border-left:1px solid #ccd8e1;color:#536477;font:700 .72rem/1 ui-monospace,monospace}
  .cells-demo-size input{width:4.8rem;padding:.55rem .65rem;border:1px solid #ccd8e1;border-radius:.55rem;background:#fff;color:#17212b}
  .cells-demo-apply,.cells-demo-expand{padding:.62rem .85rem;border:0;border-radius:.55rem;background:#075a75;color:white;font-size:.72rem;font-weight:800;cursor:pointer}
  .cells-demo-panel[hidden]{display:none}
  .cells-demo-visual{display:grid;grid-template-columns:minmax(0,1fr) 20rem;gap:1rem;flex:1;padding:1rem;background:#edf4f8}
  .cells-demo-canvas{display:grid;place-items:center;min-width:0;min-height:37rem;padding:1.5rem;overflow:auto;border:1px solid #d2dee6;border-radius:1rem;background-color:#edf4f8;background-image:radial-gradient(#bdd0dd 1px,transparent 1px);background-size:20px 20px}
  .cells-demo-device{width:min(100%,37.5rem);min-height:34rem;display:flex;flex-direction:column;border:1px solid #c9d6df;border-radius:1rem;background:#fff;box-shadow:0 .8rem 2.2rem rgb(35 64 85 / 12%);transition:width .2s ease}
  .cells-demo-device__bar{display:flex;align-items:center;justify-content:space-between;min-height:3.25rem;padding:.75rem 1rem;border-bottom:1px solid #d7e0e8;color:#33495d;font-size:.72rem;font-weight:800}
  .cells-demo-device__bar span::before{display:inline-block;width:.55rem;height:.55rem;margin-right:.45rem;border-radius:50%;background:#2c9b7f;box-shadow:0 0 0 3px #d9f1e9;content:''}
  .cells-demo-stage{display:grid;place-items:center;flex:1;padding:clamp(1rem,5vw,3rem);overflow:auto;background:linear-gradient(180deg,#fff 0%,#faf8ec 100%)}
  [data-cells-demo-subject]{width:min(100%,34rem)}
  .cells-demo-events{display:flex;flex-direction:column;min-height:0;border:1px solid #d2dee6;border-radius:1rem;background:#fff;overflow:hidden}
  .cells-demo-events__head{display:flex;align-items:center;justify-content:space-between;padding:1rem;border-bottom:1px solid #d7e0e8}.cells-demo-events__head strong{font-size:.95rem}.cells-demo-events__head span{color:#06708d;font:800 .72rem/1 ui-monospace,monospace}
  .cells-demo-events__intro{margin:0;padding:1rem;color:#607080;font-size:.75rem;line-height:1.55}
  .cells-demo-event-card{margin:0 1rem 1rem;padding:1rem;border:1px solid #d4dfe6;border-radius:.8rem;background:#f5f8fa}
  .cells-demo-event-card small{display:block;margin-bottom:.55rem;color:#2c7967;font:800 .65rem/1 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
  .cells-demo-event-card code{display:block;color:#075a75;font:800 .7rem/1.45 ui-monospace,monospace;overflow-wrap:anywhere}.cells-demo-event-card output{display:block;margin-top:.55rem;color:#536477;font:500 .7rem/1.45 ui-monospace,monospace;overflow-wrap:anywhere}
  .cells-demo-reference{padding:2rem;min-height:34rem;background:#f7f9fb}.cells-demo-reference article{max-width:64rem;margin:auto;padding:1.5rem;border:1px solid #d2dee6;border-radius:1rem;background:#fff}.cells-demo-reference h2{margin-top:0}.cells-demo-reference pre{padding:1rem;overflow:auto;border-radius:.75rem;background:#111821;color:#dcecff;font:500 .76rem/1.6 ui-monospace,monospace}
  .cells-demo-reference dl{display:grid;grid-template-columns:max-content 1fr;gap:.7rem 1.2rem}.cells-demo-reference dt{font-weight:800}.cells-demo-reference dd{margin:0;color:#607080}
  .cells-demo-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  [data-cells-demo-shell].is-interface-hidden .cells-demo-topbar,[data-cells-demo-shell].is-interface-hidden .cells-demo-viewportbar,[data-cells-demo-shell].is-interface-hidden .cells-demo-events{display:none}
  [data-cells-demo-shell].is-interface-hidden .cells-demo-visual{grid-template-columns:1fr;padding:0}[data-cells-demo-shell].is-interface-hidden .cells-demo-canvas{min-height:100vh;border:0;border-radius:0}
  @media(max-width:900px){.cells-demo-topbar{grid-template-columns:1fr}.cells-demo-identity{padding-right:0;border-right:0}.cells-demo-topbar__end{justify-content:flex-start;flex-wrap:wrap}.cells-demo-visual{grid-template-columns:1fr}.cells-demo-events{min-height:16rem}.cells-demo-viewportbar{justify-content:flex-start;overflow:auto}.cells-demo-canvas{min-height:32rem}}
`;

function buildComponentDemoShell(body: string, tagName: string, packageName: string, source: string): string {
  return `
<div data-cells-demo-shell>
  <header class="cells-demo-topbar">
    <div class="cells-demo-identity"><strong>Demostración de ${htmlEscape(tagName)}</strong><span>${htmlEscape(packageName)}</span></div>
    <label class="cells-demo-case">Caso
      <select id="learner-name" aria-label="Caso de demostración">
        <option value="Ada">Básico</option>
        <option value="Lina">Nombre alternativo</option>
        <option value="Equipo Cells">Texto largo</option>
      </select>
    </label>
    <div class="cells-demo-topbar__end">
      <div class="cells-demo-tabs" role="tablist" aria-label="Vista de la demostración">
        <button type="button" role="tab" data-demo-tab="visual" aria-selected="true">Visual</button>
        <button type="button" role="tab" data-demo-tab="code" aria-selected="false">Código</button>
        <button type="button" role="tab" data-demo-tab="docs" aria-selected="false">Documentación</button>
      </div>
      <div class="cells-demo-languages" aria-label="Idioma de la demostración">
        <button type="button" data-demo-locale="en" aria-pressed="false">Inglés</button>
        <button type="button" data-demo-locale="es" aria-pressed="true">Español</button>
      </div>
      <label class="cells-demo-hide"><input type="checkbox" data-demo-hide> Ocultar interfaz</label>
      <select id="locale" class="cells-demo-sr-only" aria-label="Idioma"><option value="es">Español</option><option value="en">English</option></select>
    </div>
  </header>
  <div class="cells-demo-viewportbar">
    <div class="cells-demo-presets" aria-label="Tamaño de la demostración">
      <button type="button" data-demo-width="375" aria-pressed="false">Móvil</button>
      <button type="button" data-demo-width="768" aria-pressed="false">Tablet</button>
      <button type="button" data-demo-width="1024" aria-pressed="false">Escritorio</button>
      <button type="button" data-demo-width="1280" aria-pressed="false">Escritorio grande</button>
      <button type="button" data-demo-width="fluid" aria-pressed="true">Fluido</button>
    </div>
    <label class="cells-demo-size">ANCHO <input data-demo-custom-width inputmode="numeric" placeholder="auto"></label>
    <span>×</span>
    <label class="cells-demo-size">ALTO <input data-demo-custom-height inputmode="numeric" placeholder="auto"></label>
    <button type="button" class="cells-demo-apply" data-demo-apply>Aplicar</button>
    <button type="button" class="cells-demo-expand" data-demo-expand aria-label="Alternar vista ampliada">↗</button>
  </div>
  <section class="cells-demo-panel cells-demo-visual" data-demo-panel="visual">
    <div class="cells-demo-canvas">
      <div class="cells-demo-device" data-demo-device>
        <div class="cells-demo-device__bar"><span>Básico</span><code>#01</code></div>
        <div class="cells-demo-stage">${body}</div>
      </div>
    </div>
    <aside class="cells-demo-events" aria-label="Eventos">
      <div class="cells-demo-events__head"><strong>Eventos</strong><span data-demo-event-count>00</span></div>
      <p class="cells-demo-events__intro">Los eventos emitidos por el componente aparecen aquí como un flujo inspeccionable.</p>
      <div class="cells-demo-event-card">
        <small>● Eventos</small>
        <code data-demo-event-name>Sin eventos todavía</code>
        <output id="event-log" aria-live="polite">Interactúa con el componente para ver el nombre y el detail.</output>
      </div>
    </aside>
  </section>
  <section class="cells-demo-panel cells-demo-reference" data-demo-panel="code" hidden>
    <article><h2>Entrada pública del componente</h2><p>La demo consume el mismo módulo que usaría una aplicación.</p><pre>${htmlEscape(source)}</pre></article>
  </section>
  <section class="cells-demo-panel cells-demo-reference" data-demo-panel="docs" hidden>
    <article><h2>Contrato público</h2><dl><dt>Elemento</dt><dd>&lt;${htmlEscape(tagName)}&gt;</dd><dt>Propiedad</dt><dd>learnerName / learner-name</dd><dt>Evento</dt><dd>${htmlEscape(tagName)}-continue</dd><dt>Estilos</dt><dd>SCSS fuente → css.js generado → static styles</dd></dl></article>
  </section>
</div>`;
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
  let packageData: { name?: string; exports?: Record<string, string> };
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
  const renderedBody = isApplication
    ? body
    : buildComponentDemoShell(body, definedTag, packageData.name ?? definedTag, componentSource);
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
    let titleHost = element.shadowRoot?.querySelector('bbva-type-text');
    await titleHost?.updateComplete;
    const spanishText = (element.shadowRoot?.textContent || '') + ' ' + (titleHost?.shadowRoot?.textContent || '');
    check('browser-render-es', 'Renderiza propiedades y español', spanishText.includes('Lina') && spanishText.includes('Estás aprendiendo'), 'El DOM público debe reflejar learnerName y el catálogo español.');

    const scoped = element.constructor.scopedElements || {};
    invokedMethods.push('scopedElements');
    check('browser-scoped', 'Resuelve ambas dependencias scoped', Boolean(scoped['bbva-type-text'] && scoped['bbva-button-default']), 'El registro local debe exponer texto y botón del catálogo como clases.');

    globalThis.__OPEN_CELLS_LOCALE__ = 'en';
    element.requestUpdate?.();
    await element.updateComplete;
    titleHost = element.shadowRoot?.querySelector('bbva-type-text');
    await titleHost?.updateComplete;
    const englishText = (element.shadowRoot?.textContent || '') + ' ' + (titleHost?.shadowRoot?.textContent || '');
    check('browser-render-en', 'Cambia el idioma sin recrear el host', englishText.includes('Lina') && englishText.includes('You are learning'), 'El mismo host debe actualizarse con el catálogo inglés.');

    let event = null;
    element.addEventListener('${definedTag}-continue', (received) => { event = received; }, { once: true });
    element.requestUpdate?.();
    await element.updateComplete;
    const buttonHost = element.shadowRoot?.querySelector('bbva-button-default');
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
  const componentDemoController = isApplication ? '' : `
  const demoShell = document.querySelector('[data-cells-demo-shell]');
  const demoDevice = document.querySelector('[data-demo-device]');
  const localeSelect = document.querySelector('#locale');
  const syncLocaleButtons = () => {
    for (const button of document.querySelectorAll('[data-demo-locale]')) {
      button.setAttribute('aria-pressed', String(button.dataset.demoLocale === globalThis.__OPEN_CELLS_LOCALE__));
    }
    if (localeSelect) localeSelect.value = globalThis.__OPEN_CELLS_LOCALE__;
  };
  for (const button of document.querySelectorAll('[data-demo-tab]')) {
    button.addEventListener('click', () => {
      for (const candidate of document.querySelectorAll('[data-demo-tab]')) candidate.setAttribute('aria-selected', String(candidate === button));
      for (const panel of document.querySelectorAll('[data-demo-panel]')) panel.hidden = panel.dataset.demoPanel !== button.dataset.demoTab;
    });
  }
  for (const button of document.querySelectorAll('[data-demo-locale]')) {
    button.addEventListener('click', () => {
      localeSelect.value = button.dataset.demoLocale;
      localeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      globalThis.IntlMsg.lang = button.dataset.demoLocale;
      for (const element of document.querySelectorAll('*')) element.requestUpdate?.();
      syncLocaleButtons();
    });
  }
  for (const button of document.querySelectorAll('[data-demo-width]')) {
    button.addEventListener('click', () => {
      const width = button.dataset.demoWidth;
      demoDevice.style.width = width === 'fluid' ? 'min(100%, 60rem)' : 'min(100%, ' + width + 'px)';
      for (const candidate of document.querySelectorAll('[data-demo-width]')) candidate.setAttribute('aria-pressed', String(candidate === button));
    });
  }
  document.querySelector('[data-demo-apply]')?.addEventListener('click', () => {
    const width = Number(document.querySelector('[data-demo-custom-width]')?.value);
    const height = Number(document.querySelector('[data-demo-custom-height]')?.value);
    if (width > 0) demoDevice.style.width = 'min(100%, ' + width + 'px)';
    demoDevice.style.minHeight = height > 0 ? height + 'px' : '';
  });
  document.querySelector('[data-demo-expand]')?.addEventListener('click', () => demoShell.classList.toggle('is-interface-hidden'));
  document.querySelector('[data-demo-hide]')?.addEventListener('change', (event) => demoShell.classList.toggle('is-interface-hidden', event.target.checked));
  document.querySelector('#learner-name')?.addEventListener('change', (event) => {
    const label = event.target.selectedOptions?.[0]?.textContent || 'Básico';
    const deviceLabel = document.querySelector('.cells-demo-device__bar span');
    if (deviceLabel) deviceLabel.textContent = label;
  });
  globalThis.addEventListener('language-update', syncLocaleButtons);
  syncLocaleButtons();`;
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
    const reportPreviewError = (message) => window.parent.postMessage({ source: 'open-cells-preview', type: 'error', message: String(message) }, '*');
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent || event.data?.source !== 'open-cells-shell') return;
      if (event.data.type === 'locale:set' && ['es', 'en'].includes(event.data.locale)) {
        if (globalThis.__OPEN_CELLS_CONTRACT_TESTS__) return;
        globalThis.IntlMsg.lang = event.data.locale;
        for (const element of document.querySelectorAll('*')) element.requestUpdate?.();
        window.parent.postMessage({ source: 'open-cells-preview', type: 'locale:changed', locale: event.data.locale }, '*');
      }
    });
    window.addEventListener('error', (event) => reportPreviewError(event.message || 'Error al ejecutar la vista previa.'));
    window.addEventListener('unhandledrejection', (event) => reportPreviewError(event.reason?.message || event.reason || 'Promesa rechazada en la vista previa.'));
  </script>
  <style>${isApplication
    ? 'body{margin:0;background:#f5f2eb;color:#171717;font-family:system-ui,sans-serif}'
    : COMPONENT_DEMO_STYLES}</style>
</head>
<body>
${renderedBody}
<script type="module">
try {
  await import('workspace:/${executionPath}');
  ${isApplication
    ? `await globalThis.__OPEN_CELLS_APP_READY__;`
    : `await customElements.whenDefined('${definedTag}');`}
  ${componentDemoController}
  ${isApplication ? '' : `document.addEventListener('${definedTag}-continue', (event) => {
    const eventCount = document.querySelector('[data-demo-event-count]');
    const eventName = document.querySelector('[data-demo-event-name]');
    const eventLog = document.querySelector('#event-log');
    const nextCount = Number(eventCount?.textContent || 0) + 1;
    if (eventCount) eventCount.textContent = String(nextCount).padStart(2, '0');
    if (eventName) eventName.textContent = event.type;
    if (eventLog) eventLog.textContent = JSON.stringify(event.detail);
    window.parent.postMessage({ source: 'open-cells-preview', type: 'business:event', name: event.type, detail: event.detail }, '*');
  });`}
  window.parent.postMessage({ source: 'open-cells-preview', type: 'ready' }, '*');
  ${contractHarness}
} catch (error) {
  reportPreviewError(error?.message || error);
}
</script>
</body>
</html>`;
  return { html, warnings: [] };
}
