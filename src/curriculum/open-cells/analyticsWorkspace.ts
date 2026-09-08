import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const adapterSource = `import { createAnalyticsEvent } from './events.js';

export function createAnalyticsAdapter() {
  let events = [];
  return Object.freeze({
    track(name, properties) {
      const event = createAnalyticsEvent(name, properties);
      if (!event) return false;
      events = [...events, event].slice(-25);
      return true;
    },
    getEvents() { return [...events]; },
    clear() { events = []; },
  });
}

export const analytics = createAnalyticsAdapter();
`;

const messages = {
  es: {
    'analytics.title': 'Qué recoge la analítica',
    'analytics.help': 'Abre una tarjeta y vuelve. El adaptador conserva solo el nombre del evento, su versión, el identificador del proyecto y la pantalla de origen. Este colector guarda hasta 25 eventos en memoria; no los envía a ningún servicio.',
    'analytics.empty': 'Todavía no hay eventos. Empieza por una tarjeta.',
    'analytics.clear': 'Limpiar eventos',
    'analytics.invalid': 'Probar un evento inválido',
    'analytics.rejected': 'Evento rechazado: el identificador debe ser una cadena no vacía. No se añadió al colector.'
  },
  en: {
    'analytics.title': 'What analytics collects',
    'analytics.help': 'Open a card and return. The adapter keeps only the event name, version, project identifier and source page. This collector holds up to 25 events in memory; it sends them to no service.',
    'analytics.empty': 'No events yet. Start with a card.',
    'analytics.clear': 'Clear events',
    'analytics.invalid': 'Try an invalid event',
    'analytics.rejected': 'Event rejected: the identifier must be a non-empty string. Nothing was added to the collector.'
  }
};

const panel = `
        <section class="analytics-lab" aria-labelledby="analytics-title">
          <h2 id="analytics-title">\${this.t('analytics.title')}</h2>
          <p>\${this.t('analytics.help')}</p>
          <div class="analytics-actions">
            <button @click=\${this.tryInvalidAnalyticsEvent}>\${this.t('analytics.invalid')}</button>
            <button @click=\${this.clearAnalyticsEvents}>\${this.t('analytics.clear')}</button>
          </div>
          <p role="status">\${this.analyticsRejected ? this.t('analytics.rejected') : ''}</p>
          \${this.analyticsEvents.length ? html\`<ol>\${this.analyticsEvents.map((event) => html\`<li><pre data-analytics-event>\${JSON.stringify(event, null, 2)}</pre></li>\`)}</ol>\` : html\`<p>\${this.t('analytics.empty')}</p>\`}
        </section>`;

const styles = `
.analytics-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.analytics-lab h2 { margin: 0 0 16px; font-size: clamp(24px, 3vw, 32px); }
.analytics-lab p { max-width: 80ch; color: #62635b; line-height: 1.6; }
.analytics-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
.analytics-lab ol { margin: 20px 0 0; padding-left: 24px; max-height: 360px; overflow: auto; }
.analytics-lab pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.6; padding: 12px; background: #f5f2eb; border-left: 3px solid #242520; }
@media (max-width: 600px) { .analytics-lab { padding: 22px 18px; } .analytics-actions button { width: 100%; } }
`;

export function connectAnalyticsWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = writeCellsFile(base, 'app/analytics/adapter.js', adapterSource);
  const path = 'app/pages/academy-home-page/academy-home-page.js';
  const source = workspace.snapshot.files[path].content;
  workspace = writeCellsFile(workspace, path,
    `import { analytics } from '../../analytics/adapter.js';\n` + source
    .replace('products: { state: true },', 'products: { state: true },\n      analyticsEvents: { state: true },\n      analyticsRejected: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.analyticsEvents = analytics.getEvents();\n    this.analyticsRejected = false;")
    .replace('  onPageEnter() {', '  onPageEnter() {\n    this.analyticsEvents = analytics.getEvents();\n    this.analyticsRejected = false;')
    .replace('  handleProductSelected(event) {', `  clearAnalyticsEvents() {
    analytics.clear();
    this.analyticsEvents = analytics.getEvents();
    this.analyticsRejected = false;
  }

  tryInvalidAnalyticsEvent() {
    this.analyticsRejected = !analytics.track('catalog:item-selected', { itemId: {}, source: 'home' });
    this.analyticsEvents = analytics.getEvents();
  }

  handleProductSelected(event) {`)
    .replace('        </header>', `        </header>\n${panel}`)
    .replace(
      '    this.publish(PRODUCT_SELECTED_CHANNEL, product);',
      "    analytics.track('catalog:item-selected', { itemId: product.id, source: 'home' });\n    this.publish(PRODUCT_SELECTED_CHANNEL, product);"
    ));
  const stylePath = 'app/pages/academy-home-page/academy-home-page';
  const scss = workspace.snapshot.files[`${stylePath}.scss`].content + styles;
  workspace = writeCellsFile(workspace, `${stylePath}.scss`, scss);
  workspace = writeCellsFile(workspace, `${stylePath}.css.js`, `import { css } from 'lit';\nexport default css\`\n${scss}\n\`;\n`);
  const localePath = 'app/locales-app/locales.json';
  const locales = JSON.parse(workspace.snapshot.files[localePath].content);
  for (const lang of ['es', 'en'] as const) Object.assign(locales[lang], messages[lang]);
  workspace = writeCellsFile(workspace, localePath, JSON.stringify(locales, null, 2));
  const messagePath = 'app/scripts/app-messages.js';
  const messageSource = workspace.snapshot.files[messagePath].content;
  const match = messageSource.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo de la aplicación.');
  const merged = JSON.parse(match[1]);
  for (const lang of ['es', 'en'] as const) Object.assign(merged[lang], messages[lang]);
  workspace = writeCellsFile(workspace, messagePath, messageSource.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  workspace = writeCellsFile(workspace, 'test/unit/analytics.test.js', `import { describe, expect, it } from 'vitest';
import { createAnalyticsAdapter } from '../../app/analytics/adapter.js';

describe('local analytics adapter', () => {
  it('collects only valid versioned events without extra data', () => {
    const adapter = createAnalyticsAdapter();
    expect(adapter.track('toString', {})).toBe(false);
    expect(adapter.track('catalog:item-selected', { itemId: {}, source: 'home' })).toBe(false);
    expect(adapter.track('catalog:item-selected', { itemId: 'first', source: 'home', privateData: 'synthetic' })).toBe(true);
    expect(adapter.getEvents()).toEqual([{ name: 'catalog:item-selected', version: 1, properties: { itemId: 'first', source: 'home' } }]);
  });
  it('bounds and clears local history without exposing the internal array', () => {
    const adapter = createAnalyticsAdapter();
    for (let index = 0; index < 30; index++) adapter.track('catalog:item-selected', { itemId: 'first', source: 'home' });
    expect(adapter.getEvents()).toHaveLength(25);
    adapter.getEvents().pop();
    expect(adapter.getEvents()).toHaveLength(25);
    adapter.clear();
    expect(adapter.getEvents()).toEqual([]);
  });
});
`);
  workspace = writeCellsFile(workspace, 'docs/analytics.md', `# Analítica con un contrato pequeño

La tarjeta publica una intención de selección. Inicio conserva su navegación y pasa solo itemId y source al adaptador de analítica. No se envía el objeto del proyecto.

El evento catalog:item-selected usa la versión 1. Sus dos propiedades son cadenas no vacías; los nombres desconocidos y los valores inválidos se rechazan. El evento y sus propiedades quedan congelados para que su esquema no cambie después de validarlo.

app/analytics/events.js define el contrato. app/analytics/adapter.js valida y entrega cada evento aceptado a su colector local, limitado a 25 entradas. getEvents devuelve una copia del historial y clear lo vacía. No hay peticiones de red ni almacenamiento persistente: recargar inicia otra sesión.

La medición no sustituye el evento de negocio ni decide si se puede navegar. No registres nombres de personas, contenido de proyectos, credenciales o respuestas completas. Una cadena válida no garantiza por sí sola que su contenido sea apropiado: la página es responsable de elegir identificadores de producto y una fuente conocida.

Tras exportar, ejecuta cells app:test y cells app:build -c prod.js. Las pruebas comprueban rechazo, esquema, filtrado y límite del colector.
`);
  return workspace;
}
