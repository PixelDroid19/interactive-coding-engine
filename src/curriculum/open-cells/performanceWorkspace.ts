import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';
import { connectPerformancePanel } from './performancePanel';

const evaluatorSource = `export function evaluateBudget(budget, measurements = {}) {
  return Object.entries(budget).map(([metric, limit]) => {
    if (!Number.isFinite(limit) || limit < 0) throw new RangeError('Invalid performance limit: ' + metric);
    const measured = measurements[metric];
    if (!Number.isFinite(measured) || measured < 0) {
      return { metric, limit, measured: null, excess: null, status: 'unmeasured' };
    }
    const excess = Math.max(0, measured - limit);
    return { metric, limit, measured, excess, status: excess > 0 ? 'exceeded' : 'passed' };
  });
}
`;

const resourcesSource = `export function measureInitialResources(entries) {
  const result = {};
  for (const [metric, extension] of [['initialJavaScriptKb', 'js'], ['initialCssKb', 'css']]) {
    const resources = entries.filter((entry) => {
      try {
        const url = new URL(entry.name);
        return ['http:', 'https:'].includes(url.protocol) && url.pathname.endsWith('.' + extension);
      } catch { return false; }
    });
    if (resources.length && resources.every((entry) => Number.isFinite(entry.decodedBodySize) && entry.decodedBodySize > 0)) {
      result[metric] = resources.reduce((total, entry) => total + entry.decodedBodySize, 0) / 1024;
    }
  }
  return result;
}
`;

const navigationSource = `let sequence = 0;
let pending;
let measurement;

export function startNavigation(now = performance.now()) {
  if (!Number.isFinite(now) || now < 0) throw new RangeError('Invalid navigation start');
  pending = { id: 'navigation-' + ++sequence, startedAt: now };
  return pending.id;
}
export function finishNavigation(id, now = performance.now()) {
  if (!pending || pending.id !== id) return false;
  if (!Number.isFinite(now) || now < pending.startedAt) throw new RangeError('Invalid navigation end');
  measurement = now - pending.startedAt;
  pending = undefined;
  return true;
}
export function getNavigationMeasurement() { return measurement; }
`;

export function connectPerformanceWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = writeCellsFile(base, 'app/performance/evaluate-budget.js', evaluatorSource);
  workspace = writeCellsFile(workspace, 'app/performance/measure-resources.js', resourcesSource);
  workspace = writeCellsFile(workspace, 'app/performance/navigation.js', navigationSource);
  workspace = writeCellsFile(workspace, 'app/performance/session.js', `import { measureInitialResources } from './measure-resources.js';
let baseline;
export function captureInitialResources(entries = performance.getEntriesByType('resource')) {
  if (!baseline) baseline = Object.freeze(measureInitialResources(entries));
  return baseline;
}
`);
  const homePath = 'app/pages/academy-home-page/academy-home-page.js';
  const home = workspace.snapshot.files[homePath].content;
  workspace = writeCellsFile(workspace, homePath,
    `import { startNavigation } from '../../performance/navigation.js';
import { captureInitialResources } from '../../performance/session.js';\n` + home
    .replace('  onPageEnter() {', '  onPageEnter() {\n    this.updateComplete.then(() => { captureInitialResources(); this.refreshBudget(); });')
    .replace("    this.navigate('product-detail', { id: product.id });", "    captureInitialResources();\n    const measurementId = startNavigation();\n    this.navigate('product-detail', { id: product.id, measurementId });"));
  const detailPath = 'app/pages/academy-product-detail-page/academy-product-detail-page.js';
  workspace = writeCellsFile(workspace, detailPath,
    `import { finishNavigation } from '../../performance/navigation.js';\n` + workspace.snapshot.files[detailPath].content
    .replace('  onPageEnter() {', '  async onPageEnter() {\n    const measurementId = this.params.measurementId;')
    .replace('    catch { this.productId = id; }', '    catch { this.productId = id; }\n    await this.updateComplete;\n    finishNavigation(measurementId);'));
  const testPath = 'test/unit/app.test.js';
  workspace = writeCellsFile(workspace, testPath, workspace.snapshot.files[testPath].content.replace("'product-detail', { id: 'chosen-project' }", "'product-detail', expect.objectContaining({ id: 'chosen-project', measurementId: expect.any(String) })"));
  workspace = writeCellsFile(workspace, 'test/unit/performance.test.js', `import { describe, expect, it } from 'vitest';
import { evaluateBudget } from '../../app/performance/evaluate-budget.js';
import { measureInitialResources } from '../../app/performance/measure-resources.js';
import { startNavigation, finishNavigation, getNavigationMeasurement } from '../../app/performance/navigation.js';

describe('measured performance budgets', () => {
  it('reports the exact excess without approving missing measurements', () => {
    expect(evaluateBudget({ routeTransitionMs: 250 }, { routeTransitionMs: 275 })[0]).toEqual({ metric: 'routeTransitionMs', limit: 250, measured: 275, excess: 25, status: 'exceeded' });
    expect(evaluateBudget({ routeTransitionMs: 250 }, {})[0].status).toBe('unmeasured');
    expect(evaluateBudget({ routeTransitionMs: 250 }, { routeTransitionMs: 250 })[0].status).toBe('passed');
  });
  it('leaves opaque resources unmeasured', () => {
    expect(measureInitialResources([{ name: 'blob:opaque', decodedBodySize: 0 }])).toEqual({});
  });
  it('preserves the timing identifier across string route parameters', () => {
    const old = startNavigation(10);
    const current = startNavigation(20);
    expect(finishNavigation(String(old), 30)).toBe(false);
    expect(finishNavigation(String(current), 45)).toBe(true);
    expect(getNavigationMeasurement()).toBe(25);
    expect(finishNavigation(current, 80)).toBe(false);
  });
});
`);
  workspace = writeCellsFile(workspace, 'docs/performance.md', `# Presupuestos que se contrastan con medidas

performance-budget.json es la fuente de límites. El panel lo lee, valida los cuatro máximos y muestra el valor observado, el límite y el exceso. Cambia un límite, vuelve a ejecutar y repite el mismo recorrido para comprobar el resultado.

## Línea base

La primera entrada a Inicio congela los recursos HTTP terminados hasta su render. JavaScript y CSS separado usan decodedBodySize / 1024: son KiB descomprimidos, no tamaño gzip ni bytes transferidos. Un tamaño cero o no disponible no demuestra que el recurso pese cero. Los módulos en memoria del playground no se aprueban como si fueran un artefacto publicado.

En el exportado, el JavaScript contiene también los estilos Lit. Si no hay archivos CSS independientes, su fila queda sin medir; sus bytes ya están incluidos en JavaScript. Esta medida describe lo cargado para entrar a Inicio, no la suma de todas las rutas ni una métrica de red completa.

## Navegación posterior

Seleccionar una tarjeta abre un intervalo con identificador textual. El detalle lo cierra después de updateComplete. Volver muestra el último intervalo cerrado, sin sumar el tiempo de lectura del alumno. Una entrada directa sin selección previa no inventa una duración. Las páginas montadas se cuentan en el outlet: no representan memoria en bytes ni un perfil de heap.

## Repetición

Exporta, ejecuta cells app:test y cells app:build -c prod.js, y sirve con cells app:preview -c prod.js. Recarga Inicio para una nueva línea base y repite la misma selección. Compara bajo las mismas condiciones de navegador y caché; no concluyas una mejora general a partir de una sola duración.

Para ver un exceso real, reduce routeTransitionMs por debajo de la medición observada y repite. El panel debe explicar cuánto supera el máximo. Si el JSON es inválido muestra un error; no conserva una certificación verde inventada.
`);
  return connectPerformancePanel(workspace);
}
