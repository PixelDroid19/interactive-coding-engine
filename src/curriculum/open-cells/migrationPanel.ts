import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const messages = {
  es: {
    'migration.title': 'Migra sin mantener dos productos',
    'migration.help': 'El consumidor antiguo envía name; el nuevo envía title. El adaptador valida ambos y entrega a las mismas tarjetas un único modelo interno. Cambia de consumidor y comprueba qué ocurre al retirar la compatibilidad.',
    'migration.legacy': 'Consumidor antiguo', 'migration.current': 'Consumidor nuevo',
    'migration.retire': 'Simular retirada en la versión 2',
    'migration.accepted': 'Aceptados en esta carga', 'migration.legacyCount': 'Usos del contrato antiguo', 'migration.rejected': 'Rechazados en esta carga',
    'migration.warning': 'Esta carga usa compatibilidad temporal. Actualiza el consumidor de name a title antes de retirar el adaptador.',
    'migration.blocked': 'El contrato antiguo ya no se acepta en esta simulación. Cambia al consumidor nuevo para recuperar las tarjetas.',
    'migration.currentStatus': 'El consumidor nuevo funciona sin compatibilidad antigua.',
    'migration.plan': 'Calendario de práctica: retirada prevista',
    'migration.criteria': 'Antes de retirar: cero usos antiguos en los consumidores revisados y pruebas de ambos contratos. La fecha no desactiva código automáticamente; la casilla permite ensayar el cambio.',
    'migration.empty': 'No hay registros aceptados para mostrar.'
  },
  en: {
    'migration.title': 'Migrate without keeping two products',
    'migration.help': 'The legacy consumer sends name; the new consumer sends title. The adapter validates both and supplies one internal model to the same cards. Switch consumers and check what happens when compatibility is retired.',
    'migration.legacy': 'Legacy consumer', 'migration.current': 'New consumer',
    'migration.retire': 'Simulate retirement in version 2',
    'migration.accepted': 'Accepted in this batch', 'migration.legacyCount': 'Legacy contract uses', 'migration.rejected': 'Rejected in this batch',
    'migration.warning': 'This batch uses temporary compatibility. Update the consumer from name to title before removing the adapter.',
    'migration.blocked': 'The legacy contract is no longer accepted in this simulation. Switch to the new consumer to restore the cards.',
    'migration.currentStatus': 'The new consumer works without legacy compatibility.',
    'migration.plan': 'Practice schedule: planned retirement',
    'migration.criteria': 'Before retirement: zero legacy uses in the reviewed consumers and tests for both contracts. The date does not disable code automatically; the checkbox lets you rehearse the change.',
    'migration.empty': 'No accepted records to display.'
  }
};

const panel = `
        <section class="migration-lab" aria-labelledby="migration-title">
          <h2 id="migration-title">\${this.t('migration.title')}</h2>
          <p>\${this.t('migration.help')}</p>
          <div class="migration-actions">
            <button aria-pressed=\${this.catalogConsumer === 'legacy'} @click=\${() => this.loadMigrationCatalog('legacy')}>\${this.t('migration.legacy')}</button>
            <button aria-pressed=\${this.catalogConsumer === 'current'} @click=\${() => this.loadMigrationCatalog('current')}>\${this.t('migration.current')}</button>
          </div>
          <label class="migration-retire"><input type="checkbox" .checked=\${this.legacyRetired} @change=\${(event) => { this.legacyRetired = event.target.checked; this.loadMigrationCatalog(this.catalogConsumer); }}>\${this.t('migration.retire')}</label>
          <dl><div><dt>\${this.t('migration.accepted')}</dt><dd data-migration="accepted">\${this.migrationResult.items.length}</dd></div><div><dt>\${this.t('migration.legacyCount')}</dt><dd data-migration="legacy">\${this.migrationResult.legacyCount}</dd></div><div><dt>\${this.t('migration.rejected')}</dt><dd data-migration="rejected">\${this.migrationResult.rejectedCount}</dd></div></dl>
          <p role="status">\${this.t(this.migrationResult.rejectedCount ? 'migration.blocked' : this.migrationResult.warnings.length ? 'migration.warning' : 'migration.currentStatus')}</p>
          <p class="migration-plan">\${this.t('migration.plan')}: \${MIGRATION_PLAN.removalDate} · v\${MIGRATION_PLAN.removalVersion}</p>
          <p>\${this.t('migration.criteria')}</p>
          \${this.products.length ? '' : html\`<p>\${this.t('migration.empty')}</p>\`}
        </section>`;

const styles = `
.migration-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.migration-lab h2 { margin: 0 0 16px; font-size: clamp(24px, 3vw, 32px); }
.migration-lab p { color: #62635b; line-height: 1.6; }
.migration-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
.migration-actions button[aria-pressed='true'] { background: #ffe600; }
.migration-retire { display: flex; align-items: center; gap: 12px; font-weight: 700; line-height: 1.5; }
.migration-retire input { width: 20px; height: 20px; flex: 0 0 20px; accent-color: #242520; }
.migration-lab dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
.migration-lab dl div { padding: 14px; border: 1px solid #b9b7ad; }
.migration-lab dt { font-size: 13px; }
.migration-lab dd { margin: 8px 0 0; font-size: 28px; font-weight: 700; }
.migration-plan { padding-top: 16px; border-top: 1px solid #b9b7ad; }
@media (max-width: 600px) { .migration-lab { padding: 22px 18px; } .migration-lab dl { grid-template-columns: 1fr; } .migration-actions button { width: 100%; } }
`;

export function connectMigrationPanel(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, content: string) => { workspace = writeCellsFile(workspace, path, content); };
  put('app/migrations/plan.js', `export const MIGRATION_PLAN = Object.freeze({
  removalVersion: '2.0.0',
  removalDate: '2026-12-01',
  trainingExample: true,
});
`);
  put('app/consumers/legacy-catalog.js', `export const legacyCatalog = [
  { id: 'first', name: 'Proyecto Museo' },
  { id: 'second', name: 'Proyecto Clima' },
];
`);
  put('app/consumers/current-catalog.js', `export const currentCatalog = [
  { id: 'first', title: 'Proyecto Museo' },
  { id: 'second', title: 'Proyecto Clima' },
];
`);
  const home = 'app/pages/academy-home-page/academy-home-page';
  put(`${home}.js`, `import { adaptCatalog } from '../../migrations/adapt-catalog.js';
import { MIGRATION_PLAN } from '../../migrations/plan.js';
import { legacyCatalog } from '../../consumers/legacy-catalog.js';
import { currentCatalog } from '../../consumers/current-catalog.js';\n` + workspace.snapshot.files[`${home}.js`].content
    .replace('products: { state: true },', 'products: { state: true },\n      migrationResult: { state: true },\n      legacyRetired: { state: true },\n      catalogConsumer: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.legacyRetired = false;\n    this.loadMigrationCatalog('legacy');")
    .replace('  handleProductSelected(event) {', `  loadMigrationCatalog(consumer) {
    this.catalogConsumer = consumer;
    this.migrationResult = adaptCatalog(consumer === 'legacy' ? legacyCatalog : currentCatalog, { allowLegacy: !this.legacyRetired });
    this.products = this.migrationResult.items;
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
