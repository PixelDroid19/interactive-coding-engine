import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const sessionSource = `import { createTrace } from './trace.js';

const actions = new Map();
const listeners = new Set();
let records = [];
let sequence = 0;

export function getTraceRecords() { return [...records]; }
function append(record) {
  records = [...records, record].slice(-25);
  listeners.forEach((listener) => listener(getTraceRecords()));
}
export function subscribeTraces(listener) {
  listeners.add(listener);
  listener(getTraceRecords());
  return () => listeners.delete(listener);
}
export function clearTraces() {
  records = [];
  listeners.forEach((listener) => listener([]));
}
export function isTraceActive(id) { return actions.has(id); }

export function startTraceStep(id, name) {
  const action = actions.get(id);
  if (!action) return () => {};
  if (!['selection', 'navigation', 'data', 'render'].includes(name)) throw new TypeError('Unknown trace stage');
  const trace = createTrace(name, id);
  let closed = false;
  const finish = (status) => {
    if (closed) return;
    const record = trace.finish(status);
    closed = true;
    action.steps.delete(finish);
    append(record);
  };
  action.steps.add(finish);
  return finish;
}

export function completeProjectTrace(id, status) {
  const action = actions.get(id);
  if (!action) return;
  action.steps.forEach((finish) => finish(status));
  append(action.trace.finish(status));
  actions.delete(id);
}

export function beginProjectTrace(selected = true) {
  if (actions.size >= 4) completeProjectTrace(actions.keys().next().value, 'cancelled');
  const id = 'action-' + ++sequence;
  actions.set(id, { trace: createTrace('project.open', id), steps: new Set() });
  if (selected) startTraceStep(id, 'selection')('ok');
  actions.get(id).navigation = startTraceStep(id, 'navigation');
  return id;
}
export function enterProjectTrace(id) { actions.get(id)?.navigation('ok'); }
`;

const messages = {
  es: {
    'trace.kicker': 'Laboratorio / Trazas', 'trace.title': 'Sigue el recorrido de una acción',
    'trace.help': 'Abre un proyecto y vuelve. Cada paso comparte un identificador; sus duraciones se miden con el reloj del navegador. Solo se guardan los últimos 25 pasos de esta sesión.',
    'trace.empty': 'Todavía no hay trazas. Empieza por una tarjeta.',
    'trace.errorAction': 'Probar un proyecto inexistente', 'trace.clear': 'Limpiar trazas',
    'trace.stage.selection': 'Selección', 'trace.stage.navigation': 'Navegación', 'trace.stage.data': 'Carga de datos',
    'trace.stage.render': 'Render', 'trace.stage.project.open': 'Acción completa',
    'trace.status.ok': 'Correcto', 'trace.status.error': 'Error', 'trace.status.cancelled': 'Cancelado',
    'trace.detailLoading': 'Cargando proyecto…', 'trace.detailError': 'No pudimos abrir este proyecto',
    'trace.detailHelp': 'Esta página carga un catálogo local de práctica. Al volver podrás seguir la misma acción en el registro, sin guardar el contenido del proyecto en la traza.'
  },
  en: {
    'trace.kicker': 'Lab / Traces', 'trace.title': 'Follow one action from start to finish',
    'trace.help': 'Open a project and return. Every step shares an identifier; durations use the browser clock. Only the last 25 steps from this session are kept.',
    'trace.empty': 'No traces yet. Start with a card.',
    'trace.errorAction': 'Try a missing project', 'trace.clear': 'Clear traces',
    'trace.stage.selection': 'Selection', 'trace.stage.navigation': 'Navigation', 'trace.stage.data': 'Data loading',
    'trace.stage.render': 'Render', 'trace.stage.project.open': 'Complete action',
    'trace.status.ok': 'OK', 'trace.status.error': 'Error', 'trace.status.cancelled': 'Cancelled',
    'trace.detailLoading': 'Loading project…', 'trace.detailError': 'Could not open this project',
    'trace.detailHelp': 'This page loads a local practice catalog. Return to follow the same action in the log, without recording project content in the trace.'
  }
};

const panel = `
        <section class="trace-lab" aria-labelledby="trace-title">
          <span class="trace-kicker">\${this.t('trace.kicker')}</span>
          <h2 id="trace-title">\${this.t('trace.title')}</h2>
          <p>\${this.t('trace.help')}</p>
          <div class="trace-actions"><button @click=\${() => this.openTrackedProject({ id: 'missing' })}>\${this.t('trace.errorAction')}</button><button @click=\${clearTraces}>\${this.t('trace.clear')}</button></div>
          \${this.traceRows.length === 0 ? html\`<p class="trace-empty">\${this.t('trace.empty')}</p>\` : ''}
          <ol class="trace-list">\${this.traceRows.map((row) => html\`
            <li data-trace-id=\${row.correlationId} data-stage=\${row.name} data-status=\${row.status}>
              <code>\${row.correlationId}</code><strong>\${this.t('trace.stage.' + row.name)}</strong><span>\${this.t('trace.status.' + row.status)}</span><span>\${row.durationMs.toFixed(1)} ms</span>
            </li>\`)}</ol>
        </section>`;

const styles = `
.trace-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.trace-kicker { display: inline-block; padding: 5px 9px; background: #ffe600; font: 700 11px/1.5 monospace; text-transform: uppercase; letter-spacing: .08em; }
.trace-lab h2 { margin: 18px 0 12px; font-size: clamp(24px, 3vw, 32px); }
.trace-lab p { max-width: 78ch; color: #62635b; font-size: 14px; }
.trace-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
.trace-list { list-style: none; padding: 0; margin: 0; max-height: 390px; overflow: auto; }
.trace-list li { display: grid; grid-template-columns: 100px minmax(120px, 1fr) 80px 90px; gap: 8px; padding: 12px 8px; border-top: 1px solid #d3d1c8; font-size: 12px; align-items: center; }
.trace-list code { font-size: 11px; }
.trace-list li[data-stage='project.open'] { background: #f5f2eb; border-left: 3px solid #242520; }
.trace-list li[data-status='error'] { border-left: 3px solid #a52d27; }
.trace-empty { margin-top: 20px; }
@media (max-width: 600px) { .trace-lab { padding: 22px 18px; } .trace-list li { grid-template-columns: 1fr 1fr; } .trace-actions button { width: 100%; } }
`;

/** Wires correlated stages across the page, data boundary and completed render. */
export function connectTraceWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, content: string) => { workspace = writeCellsFile(workspace, path, content); };
  put('app/observability/trace-session.js', sessionSource);
  put('test/unit/traces.test.js', `import { afterEach, describe, expect, it } from 'vitest';
import { beginProjectTrace, enterProjectTrace, startTraceStep, completeProjectTrace, getTraceRecords, clearTraces, subscribeTraces } from '../../app/observability/trace-session.js';

afterEach(clearTraces);
describe('correlated action recording', () => {
  it('closes outstanding stages once when an action is cancelled', () => {
    const id = beginProjectTrace();
    enterProjectTrace(id);
    const finishData = startTraceStep(id, 'data');
    completeProjectTrace(id, 'cancelled');
    finishData('ok');
    completeProjectTrace(id, 'ok');
    const rows = getTraceRecords();
    expect(rows.map((row) => row.name)).toEqual(['selection', 'navigation', 'data', 'project.open']);
    expect(rows.map((row) => row.status)).toEqual(['ok', 'ok', 'cancelled', 'cancelled']);
    expect(rows.every((row) => row.correlationId === id)).toBe(true);
    for (const row of rows) expect(Object.keys(row).sort()).toEqual(['correlationId', 'durationMs', 'name', 'status']);
  });
  it('bounds history and releases subscriptions', () => {
    let count = 0;
    const stop = subscribeTraces(() => count++);
    stop();
    for (let index = 0; index < 12; index++) completeProjectTrace(beginProjectTrace(), 'ok');
    expect(getTraceRecords()).toHaveLength(25);
    expect(count).toBe(1);
    const copy = getTraceRecords();
    copy.length = 0;
    expect(getTraceRecords()).toHaveLength(25);
  });
});
`);
  put('docs/traces.md', `# Sigue una acción, no un volcado de objetos

La selección en Inicio crea un correlationId. La página lo pasa al router; el detalle lo conserva durante la carga y el render. El registro local muestra selección, navegación, datos, render y acción completa. Una entrada directa al detalle no inventa una selección anterior.

## Archivos que colaboran

- [trace.js](../app/observability/trace.js) mide un intervalo y fija su resultado una sola vez. Rechaza relojes inválidos y objetos usados como identificadores.
- [trace-session.js](../app/observability/trace-session.js) conecta los pasos y mantiene solo 25 registros. No tiene proveedor externo ni persistencia.
- [project-detail.js](../app/data/project-detail.js) carga el catálogo local de práctica mediante fetch. No depende de un backend ni registra la respuesta.
- La página de detalle espera su updateComplete antes de cerrar el paso de render. Salir aborta la petición y cancela los pasos pendientes.

## Comprueba éxito y fallo

Abre Proyecto Museo y vuelve: los cinco pasos comparten un identificador. Usa Probar un proyecto inexistente y vuelve: la carga y la acción completa muestran error; el render de ese error puede terminar correctamente. Cada acción usa otro identificador.

Los registros contienen únicamente nombre del paso, correlationId, resultado y duración. No copies nombres de proyectos, cuerpos de respuesta, parámetros completos ni mensajes de excepción. Los identificadores son locales a esta sesión, no identificadores personales.

Una traza relaciona pasos; no es una métrica agregada ni una promesa de rendimiento. Las duraciones pequeñas o variables del catálogo local son mediciones reales, no valores de ejemplo.

Tras exportar: cells app:test y cells app:build -c prod.js. Repite el recorrido visual y el cambio de idioma. La prueba de cancelación verifica que callbacks tardíos no cambian un resultado ya cerrado.
`);
  put('app/data/projects.json', JSON.stringify([{ id: 'first', name: 'Proyecto Museo' }, { id: 'second', name: 'Proyecto Clima' }], null, 2));
  put('app/data/project-detail.js', `const source = new URL('./projects.json', import.meta.url).href;
export async function loadProject(id, { signal }) {
  const response = await fetch(source, { signal });
  if (!response.ok) throw new Error('project-load-failed');
  const projects = await response.json();
  const project = Array.isArray(projects) && projects.find((entry) => entry.id === id && typeof entry.name === 'string');
  if (!project) throw new Error('project-not-found');
  return { id: project.id, name: project.name };
}
`);
  const home = 'app/pages/academy-home-page/academy-home-page';
  put(`${home}.js`, `import { beginProjectTrace, completeProjectTrace, getTraceRecords, subscribeTraces, clearTraces } from '../../observability/trace-session.js';\n` + workspace.snapshot.files[`${home}.js`].content
    .replace('products: { state: true },', 'products: { state: true },\n      traceRows: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.traceRows = getTraceRecords();")
    .replace('  onPageEnter() {', '  onPageEnter() {\n    this.stopTraceUpdates?.();\n    this.stopTraceUpdates = subscribeTraces((rows) => { this.traceRows = rows; });')
    .replace('  onPageLeave() {', '  onPageLeave() {\n    this.stopTraceUpdates?.();')
    .replace("    this.navigate('product-detail', { id: product.id });", '    this.openTrackedProject(product);')
    .replace('  handleProductSelected(event) {', `  openTrackedProject(product) {
    const correlationId = beginProjectTrace();
    Promise.resolve(this.navigate('product-detail', { id: product.id, correlationId })).catch(() => completeProjectTrace(correlationId, 'error'));
  }

  handleProductSelected(event) {`)
    .replace('        </header>', `        </header>\n${panel}`));
  const detail = 'app/pages/academy-product-detail-page/academy-product-detail-page.js';
  put(detail, `import { loadProject } from '../../data/project-detail.js';
import { beginProjectTrace, enterProjectTrace, startTraceStep, completeProjectTrace, isTraceActive } from '../../observability/trace-session.js';\n` + workspace.snapshot.files[detail].content
    .replace('productId: { state: true },', "productId: { state: true },\n      projectName: { state: true },\n      loadState: { state: true },")
    .replace("this.productId = 'first';", "this.productId = 'first';\n    this.projectName = '';\n    this.loadState = 'loading';")
    .replace(/  onPageEnter\(\) \{[\s\S]*?\n  \}\n/, `  async onPageEnter() {
    this.requestController?.abort();
    this.productId = String(this.params.id ?? 'first');
    const id = isTraceActive(this.params.correlationId) ? this.params.correlationId : beginProjectTrace(false);
    this.correlationId = id;
    enterProjectTrace(id);
    const controller = new AbortController();
    this.requestController = controller;
    this.projectName = '';
    this.loadState = 'loading';
    const finishData = startTraceStep(id, 'data');
    try {
      const project = await loadProject(this.productId, { signal: controller.signal });
      if (controller.signal.aborted || !isTraceActive(id)) return;
      finishData('ok');
      const finishRender = startTraceStep(id, 'render');
      this.projectName = project.name;
      this.loadState = 'success';
      await this.updateComplete;
      finishRender('ok');
      completeProjectTrace(id, 'ok');
    } catch {
      if (controller.signal.aborted) { completeProjectTrace(id, 'cancelled'); return; }
      finishData('error');
      const finishRender = startTraceStep(id, 'render');
      this.loadState = 'error';
      await this.updateComplete;
      finishRender('ok');
      completeProjectTrace(id, 'error');
    }
  }

  onPageLeave() {
    this.requestController?.abort();
    completeProjectTrace(this.correlationId, 'cancelled');
  }
`)
    .replace("${this.t('detail.title')} · ${this.productId}", "${this.projectName || this.t(this.loadState === 'error' ? 'trace.detailError' : 'trace.detailLoading')}")
    .replace("this.t('detail.description')", "this.t('trace.detailHelp')"));
  const scss = workspace.snapshot.files[`${home}.scss`].content + styles;
  put(`${home}.scss`, scss);
  put(`${home}.css.js`, `import { css } from 'lit';\nexport default css\`\n${scss}\n\`;\n`);
  const locale = 'app/locales-app/locales.json';
  const catalogs = JSON.parse(workspace.snapshot.files[locale].content);
  for (const lang of ['es', 'en'] as const) Object.assign(catalogs[lang], messages[lang]);
  put(locale, JSON.stringify(catalogs, null, 2));
  const messagePath = 'app/scripts/app-messages.js';
  const source = workspace.snapshot.files[messagePath].content;
  const match = source.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo de la aplicación.');
  const merged = JSON.parse(match[1]);
  for (const lang of ['es', 'en'] as const) Object.assign(merged[lang], messages[lang]);
  put(messagePath, source.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  const test = 'test/unit/app.test.js';
  put(test, workspace.snapshot.files[test].content.replace("'product-detail', { id: 'chosen-project' }", "'product-detail', expect.objectContaining({ id: 'chosen-project', correlationId: expect.any(String) })"));
  return workspace;
}
