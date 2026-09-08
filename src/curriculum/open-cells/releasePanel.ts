import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const messages = {
  es: {
    'release.title': 'Revisa una entrega',
    'release.help': 'Exporta el proyecto y ejecuta npm run release:check. Después carga el report.json de esa ejecución para revisar formato, pruebas, build, inspección y consumo.',
    'release.caveat': 'Este visor lee un informe local: no ejecuta comandos, no verifica su autenticidad y no certifica el proyecto abierto. Antes de entregar, vuelve a ejecutar las puertas sobre las fuentes y el artefacto exactos.',
    'release.upload': 'Cargar informe JSON', 'release.empty': 'Todavía no has cargado un informe.',
    'release.loading': 'Leyendo el informe…', 'release.error': 'No se pudo leer el informe. Usa un report.json válido de hasta 256 KiB.',
    'release.ready': 'El informe declara las cinco puertas aprobadas y sus identificadores coinciden.',
    'release.blocked': 'La entrega no está aprobada: falta evidencia o alguna puerta no coincide o falló.',
    'release.run': 'Ejecución', 'release.source': 'Huella de fuentes', 'release.artifact': 'Huella del artefacto',
    'release.format': 'Formato', 'release.tests': 'Pruebas', 'release.build': 'Compilación',
    'release.package-audit': 'Inspección del artefacto', 'release.consumer-smoke': 'Consumo en navegador',
    'release.passed': 'Aprobada', 'release.failed': 'Fallida', 'release.pending': 'Sin ejecutar'
  },
  en: {
    'release.title': 'Review a delivery',
    'release.help': 'Export the project and run npm run release:check. Then load its report.json to review formatting, tests, build, artifact audit and consumption.',
    'release.caveat': 'This viewer reads a local report: it runs no commands, does not verify authenticity and does not certify the open project. Before delivery, rerun the gates against the exact sources and artifact.',
    'release.upload': 'Load JSON report', 'release.empty': 'No report loaded yet.',
    'release.loading': 'Reading report…', 'release.error': 'Could not read the report. Use a valid report.json up to 256 KiB.',
    'release.ready': 'The report declares all five gates passed with matching identifiers.',
    'release.blocked': 'Delivery is not approved: evidence is missing, inconsistent or failed.',
    'release.run': 'Run', 'release.source': 'Source hash', 'release.artifact': 'Artifact hash',
    'release.format': 'Formatting', 'release.tests': 'Tests', 'release.build': 'Build',
    'release.package-audit': 'Artifact audit', 'release.consumer-smoke': 'Browser consumption',
    'release.passed': 'Passed', 'release.failed': 'Failed', 'release.pending': 'Not run'
  }
};

const panel = `
        <section class="release-lab" aria-labelledby="release-title">
          <h2 id="release-title">\${this.t('release.title')}</h2>
          <p>\${this.t('release.help')}</p>
          <p>\${this.t('release.caveat')}</p>
          <button @click=\${() => this.renderRoot.querySelector('#release-report').click()}>\${this.t('release.upload')}</button>
          <input id="release-report" hidden aria-label=\${this.t('release.upload')} type="file" accept=".json,application/json" @change=\${this.loadReleaseReport}>
          <p role="status">\${this.t('release.' + this.releaseState)}</p>
          \${this.releaseReport ? html\`
            <dl><dt>\${this.t('release.run')}</dt><dd>\${this.releaseReport.runId}</dd><dt>\${this.t('release.source')}</dt><dd>\${this.releaseReport.sourceHash}</dd><dt>\${this.t('release.artifact')}</dt><dd>\${this.releaseReport.artifactHash || '—'}</dd></dl>
            <ol>\${QUALITY_GATES.map((gate) => {
              const status = ['passed', 'failed'].includes(this.releaseReport.results[gate.name]?.status) ? this.releaseReport.results[gate.name].status : 'pending';
              return html\`<li data-gate=\${gate.name} data-gate-status=\${status}><strong>\${this.t('release.' + gate.name)}</strong><span>\${this.t('release.' + status)}</span><code>\${gate.command}</code></li>\`;
            })}</ol>
          \` : ''}
        </section>`;

const styles = `
.release-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.release-lab h2 { margin: 0 0 16px; font-size: clamp(24px, 3vw, 32px); }
.release-lab p { color: #62635b; line-height: 1.6; }
.release-lab label { display: block; font-weight: 700; margin: 20px 0 8px; }
.release-lab input { width: 100%; max-width: 100%; font-size: 14px; }
.release-lab dd { margin: 4px 0 14px; font: 12px/1.5 monospace; overflow-wrap: anywhere; }
.release-lab dt { font-size: 13px; font-weight: 700; }
.release-lab ol { padding-left: 24px; }
.release-lab li { padding: 12px; border-top: 1px solid #b9b7ad; }
.release-lab li span { display: block; margin: 6px 0; }
.release-lab code { font-size: 12px; overflow-wrap: anywhere; }
.release-lab li[data-gate-status='failed'] { border-left: 3px solid #a52d27; }
@media (max-width: 600px) { .release-lab { padding: 22px 18px; } }
`;

export function connectReleasePanel(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, content: string) => { workspace = writeCellsFile(workspace, path, content); };
  const home = 'app/pages/academy-home-page/academy-home-page';
  put(`${home}.js`, `import { QUALITY_GATES, canPromote } from '../../../ci/quality-gates.js';\n` + workspace.snapshot.files[`${home}.js`].content
    .replace('products: { state: true },', 'products: { state: true },\n      releaseReport: { state: true },\n      releaseState: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.releaseReport = null;\n    this.releaseState = 'empty';\n    this.reportRevision = 0;")
    .replace('  handleProductSelected(event) {', `  async loadReleaseReport(event) {
    const revision = ++this.reportRevision;
    const file = event.target.files?.[0];
    this.releaseReport = null;
    this.releaseState = file ? 'loading' : 'empty';
    if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('report-too-large');
      const report = JSON.parse(await file.text());
      if (!report || report.version !== 1 || typeof report.runId !== 'string' || !report.runId || report.runId.length > 100 || typeof report.sourceHash !== 'string' || report.sourceHash.length !== 64 || typeof report.artifactHash !== 'string' || ![0, 64].includes(report.artifactHash.length) || !report.results || typeof report.results !== 'object' || Array.isArray(report.results)) throw new Error('invalid-report');
      if (revision !== this.reportRevision) return;
      this.releaseReport = report;
      this.releaseState = report.ready === true && !report.error && canPromote(report) ? 'ready' : 'blocked';
    } catch {
      if (revision === this.reportRevision) this.releaseState = 'error';
    }
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
