import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const messages = {
  es: {
    'budget.title': 'Presupuestos con evidencia',
    'budget.help': 'Abre un proyecto y vuelve para medir la navegación hasta el render del detalle. La carga inicial se captura una sola vez al entrar en Inicio. Los tamaños son KiB descomprimidos informados por el navegador, no bytes transferidos.',
    'budget.caveat': 'Sin recursos HTTP medibles no se aprueba el tamaño. El playground usa módulos en memoria; en el exportado los estilos incluidos en JavaScript cuentan dentro de JS, no como CSS separado. Las páginas cuentan nodos montados, no memoria en bytes.',
    'budget.loading': 'Leyendo los límites…', 'budget.error': 'No se pudieron leer los límites. Revisa performance-budget.json.',
    'budget.initialJavaScriptKb': 'JavaScript inicial (KiB)', 'budget.initialCssKb': 'CSS separado inicial (KiB)',
    'budget.routeTransitionMs': 'Selección → detalle (ms)', 'budget.retainedPages': 'Páginas montadas',
    'budget.passed': 'Cumple', 'budget.exceeded': 'Excede', 'budget.unmeasured': 'Sin medir',
    'budget.limit': 'Límite', 'budget.measured': 'Medido', 'budget.excess': 'Exceso'
  },
  en: {
    'budget.title': 'Evidence-based budgets',
    'budget.help': 'Open a project and return to measure navigation through the detail render. Initial loading is captured once on entering Home. Sizes are decoded KiB reported by the browser, not transferred bytes.',
    'budget.caveat': 'Without measurable HTTP resources, size is not approved. The playground uses in-memory modules; exported styles embedded in JavaScript count under JS, not separate CSS. Pages count mounted nodes, not memory bytes.',
    'budget.loading': 'Reading limits…', 'budget.error': 'Could not read limits. Check performance-budget.json.',
    'budget.initialJavaScriptKb': 'Initial JavaScript (KiB)', 'budget.initialCssKb': 'Initial separate CSS (KiB)',
    'budget.routeTransitionMs': 'Selection → detail (ms)', 'budget.retainedPages': 'Mounted pages',
    'budget.passed': 'Passed', 'budget.exceeded': 'Exceeded', 'budget.unmeasured': 'Unmeasured',
    'budget.limit': 'Limit', 'budget.measured': 'Measured', 'budget.excess': 'Excess'
  }
};

const panel = `
        <section class="budget-lab" aria-labelledby="budget-title">
          <h2 id="budget-title">\${this.t('budget.title')}</h2>
          <p>\${this.t('budget.help')}</p>
          <p>\${this.t('budget.caveat')}</p>
          \${this.budgetState !== 'ready' ? html\`<p role="status">\${this.t('budget.' + this.budgetState)}</p>\` : ''}
          <ul>\${this.budgetRows.map((row) => html\`
            <li data-metric=\${row.metric} data-status=\${row.status} data-measured=\${row.measured ?? ''}>
              <h3>\${this.t('budget.' + row.metric)}</h3>
              <strong>\${this.t('budget.' + row.status)}</strong>
              <p>\${this.t('budget.limit')}: \${row.limit} · \${this.t('budget.measured')}: \${row.measured === null ? '—' : row.measured.toFixed(2)} · \${this.t('budget.excess')}: \${row.excess === null ? '—' : row.excess.toFixed(2)}</p>
            </li>\`)}</ul>
        </section>`;

const styles = `
.budget-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.budget-lab h2 { margin: 0 0 16px; font-size: clamp(24px, 3vw, 32px); }
.budget-lab p { color: #62635b; line-height: 1.6; }
.budget-lab ul { list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.budget-lab li { border: 1px solid #b9b7ad; padding: 16px; min-width: 0; }
.budget-lab h3 { margin: 0 0 12px; font-size: 18px; }
.budget-lab li[data-status='exceeded'] { border-left: 4px solid #a52d27; }
@media (max-width: 600px) { .budget-lab { padding: 22px 18px; } .budget-lab ul { grid-template-columns: 1fr; } }
`;

export function connectPerformancePanel(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, content: string) => { workspace = writeCellsFile(workspace, path, content); };
  put('app/performance/load-budget.js', `const url = new URL('../../performance-budget.json', import.meta.url).href;
export async function loadBudget() {
  const response = await fetch(url);
  if (!response.ok) throw new Error('budget-load-failed');
  const budget = await response.json();
  const keys = ['initialJavaScriptKb', 'initialCssKb', 'routeTransitionMs', 'retainedPages'];
  if (!budget || keys.some((key) => !Number.isFinite(budget[key]) || budget[key] < 0)) throw new Error('budget-invalid');
  return Object.fromEntries(keys.map((key) => [key, budget[key]]));
}
`);
  const home = 'app/pages/academy-home-page/academy-home-page';
  put(`${home}.js`, `import { evaluateBudget } from '../../performance/evaluate-budget.js';
import { loadBudget } from '../../performance/load-budget.js';
import { getNavigationMeasurement } from '../../performance/navigation.js';\n` + workspace.snapshot.files[`${home}.js`].content
    .replace('products: { state: true },', 'products: { state: true },\n      budgetRows: { state: true },\n      budgetState: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.budgetRows = [];\n    this.budgetState = 'loading';")
    .replace('  handleProductSelected(event) {', `  async refreshBudget() {
    try {
      const budget = await loadBudget();
      const outlet = document.getElementById('app');
      const mounted = outlet ? [...outlet.children].filter((node) => node.localName.startsWith('academy-') && node.localName.endsWith('-page')).length : undefined;
      this.budgetRows = evaluateBudget(budget, { ...captureInitialResources(), routeTransitionMs: getNavigationMeasurement(), retainedPages: mounted });
      this.budgetState = 'ready';
    } catch { this.budgetState = 'error'; }
  }

  handleProductSelected(event) {`)
    .replace('        </header>', `        </header>\n${panel}`));
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
  return workspace;
}
