import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const resourceSource = `import { PageRetention } from './page-retention.js';

export const pageRetention = new PageRetention(2);
export const retainedListeners = new Set();
export const sessionNote = { value: '' };

/**
 * Tracks application-owned resources; the router owns DOM eviction.
 * @template {new (...args: any[]) => any} T
 * @param {T} Base
 */
export const RetainedPageMixin = (Base) => class extends Base {
  constructor(...args) {
    super(...args);
    this.retentionPulses = 0;
    this.handleRetentionPing = () => {
      this.retentionPulses += 1;
      this.requestUpdate?.();
    };
  }
  connectedCallback() {
    super.connectedCallback?.();
    if (retainedListeners.has(this)) return;
    globalThis.addEventListener('academy-retention-ping', this.handleRetentionPing);
    retainedListeners.add(this);
    pageRetention.keep(this.localName, this);
  }
  disconnectedCallback() {
    pageRetention.release(this.localName, this);
    super.disconnectedCallback?.();
  }
  cleanup() {
    globalThis.removeEventListener('academy-retention-ping', this.handleRetentionPing);
    retainedListeners.delete(this);
  }
};
`;

const messages = {
  es: {
    'retention.kicker': 'Laboratorio / Retención',
    'retention.intro': 'Guarda una nota. Cambia de página. Observa qué permanece.',
    'retention.instructions': 'Cómo probarlo',
    'retention.empty': 'Todavía no has guardado una nota.',
    'retention.title': '¿Qué sobrevive al volver?',
    'retention.help': 'Escribe un borrador, guarda una nota y abre un detalle. Al volver se conserva la misma página. Visita una tercera página distinta: la más antigua se desmonta. La nota guardada vive fuera de la página durante esta sesión; no sobrevive a recargar.',
    'retention.draft': 'Borrador local de esta página',
    'retention.save': 'Guardar nota fuera de la página',
    'retention.saved': 'Nota guardada en la sesión',
    'retention.pages': 'Páginas retenidas',
    'retention.listeners': 'Listeners del ejercicio',
    'retention.ping': 'Enviar evento a las páginas retenidas',
    'retention.pulses': 'Eventos recibidos por esta instancia',
  },
  en: {
    'retention.kicker': 'Lab / Page retention',
    'retention.intro': 'Save a note. Switch pages. Observe what remains.',
    'retention.instructions': 'How to try it',
    'retention.empty': 'You have not saved a note yet.',
    'retention.title': 'What survives a return visit?',
    'retention.help': 'Write a draft, save a note and open a detail. Returning preserves the same page. Visit a third distinct page: the oldest one is unmounted. The saved note lives outside the page for this session; it does not survive a reload.',
    'retention.draft': 'Local draft for this page',
    'retention.save': 'Save note outside the page',
    'retention.saved': 'Note saved for the session',
    'retention.pages': 'Retained pages',
    'retention.listeners': 'Exercise listeners',
    'retention.ping': 'Send event to retained pages',
    'retention.pulses': 'Events received by this instance',
  },
};

const panel = `
        <section class="retention-lab" aria-labelledby="retention-title">
          <span class="lab-kicker">\${this.t('retention.kicker')}</span>
          <h2 id="retention-title">\${this.t('retention.title')}</h2>
          <p class="lab-intro">\${this.t('retention.intro')}</p>
          <details><summary>\${this.t('retention.instructions')}</summary><p>\${this.t('retention.help')}</p></details>
          <label for="retention-draft">\${this.t('retention.draft')}</label>
          <input id="retention-draft" .value=\${this.localDraft} @input=\${(event) => { this.localDraft = event.target.value; }}>
          <button class="save-note" @click=\${() => { sessionNote.value = this.localDraft; this.requestUpdate(); }}>\${this.t('retention.save')}</button>
          <div class="saved-note"><span>\${this.t('retention.saved')}</span><output data-saved-note aria-live="polite">\${sessionNote.value || this.t('retention.empty')}</output></div>
          <div class="lab-metrics">
            <div><strong><output data-retained-pages>\${pageRetention.pages.size}</output><small> / \${pageRetention.limit}</small></strong><span>\${this.t('retention.pages')}</span></div>
            <div><output data-retained-listeners>\${retainedListeners.size}</output><span>\${this.t('retention.listeners')}</span></div>
            <div><output data-retention-pulses>\${this.retentionPulses}</output><span>\${this.t('retention.pulses')}</span></div>
          </div>
          <button class="send-event" @click=\${() => globalThis.dispatchEvent(new Event('academy-retention-ping'))}>\${this.t('retention.ping')}</button>
        </section>
`;

const styles = `
.retention-lab { box-sizing: border-box; padding: 28px; border: 2px solid #242520; background: #fffdf7; color: #242520; box-shadow: 5px 5px 0 #242520; }
.lab-kicker { display: inline-block; margin-bottom: 18px; padding: 5px 8px; background: #ffe600; font: 700 10px/1.4 monospace; text-transform: uppercase; letter-spacing: .07em; }
.retention-lab h2 { max-width: 16ch; margin-bottom: 12px; font-size: 29px; line-height: 1.1; }
.retention-lab .lab-intro { color: #62635b; font-size: 14px; }
.retention-lab details { margin: 14px 0 22px; font-size: 13px; }
.retention-lab summary { width: fit-content; padding: 8px 0; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.retention-lab details p { padding: 8px 0; color: #62635b; }
.retention-lab label { display: block; margin: 0 0 8px; font-weight: 700; font-size: 12px; }
.retention-lab input { display: block; width: 100%; margin-bottom: 10px; background: #f5f2eb; }
.retention-lab button { width: 100%; white-space: normal; }
.retention-lab .save-note { background: #ffe600; box-shadow: 2px 2px 0 #242520; font-size: 13px; }
.saved-note { display: grid; gap: 7px; padding: 16px 0 22px; font-size: 13px; }
.saved-note > span { color: #62635b; font-size: 11px; }
.saved-note output { min-height: 20px; overflow-wrap: anywhere; line-height: 1.5; }
.lab-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid #d9d8ce; padding: 18px 0; gap: 14px; }
.lab-metrics > div { display: flex; flex-direction: column; gap: 6px; }
.lab-metrics output { font: 700 27px/1 'Space Grotesk', 'Trebuchet MS', sans-serif; }
.lab-metrics small { color: #62635b; font-size: 13px; }
.lab-metrics span { max-width: 15ch; color: #62635b; font-size: 10px; line-height: 1.4; }
.retention-lab .send-event { min-height: 42px; font-size: 12px; background: #f5f2eb; }
.retention-lab button:hover { transform: translateY(-1px); }
@media (max-width: 800px) { .retention-lab { margin: 0 0 28px; padding: 22px; } }
`;

export function connectPageRetentionWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, source: string) => { workspace = writeCellsFile(workspace, path, source); };
  put('app/runtime/retained-page-mixin.js', resourceSource);
  put('app/runtime/retained-page.js', `import { PageMixin as FrameworkPageMixin } from '@open-cells/page-mixin';
import { RetainedPageMixin } from './retained-page-mixin.js';
/**
 * @template {new (...args: any[]) => any} T
 * @param {T} Base
 */
export const PageMixin = (Base) => RetainedPageMixin(FrameworkPageMixin(Base));
`);
  for (const file of Object.values(workspace.snapshot.files)) {
    if (file.path.startsWith('app/pages/') && file.path.endsWith('.js')) {
      put(file.path, file.content.replace("from '@open-cells/page-mixin'", "from '../../runtime/retained-page.js'"));
    }
  }
  const homePath = 'app/pages/academy-home-page/academy-home-page.js';
  put(homePath, `import { pageRetention, retainedListeners, sessionNote } from '../../runtime/retained-page-mixin.js';\n` + workspace.snapshot.files[homePath].content
    .replace('products: { state: true },', 'products: { state: true },\n      localDraft: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.localDraft = '';")
    .replace('  onPageEnter() {', '  onPageEnter() {\n    this.requestUpdate();')
    .replace('        </header>', `        </header>\n${panel}`));
  const stylePath = 'app/pages/academy-home-page/academy-home-page';
  const scss = workspace.snapshot.files[`${stylePath}.scss`].content + styles;
  put(`${stylePath}.scss`, scss);
  put(`${stylePath}.css.js`, `import { css } from 'lit';\nexport default css\`\n${scss}\n\`;\n`);
  const localePath = 'app/locales-app/locales.json';
  const catalogs = JSON.parse(workspace.snapshot.files[localePath].content);
  for (const language of ['es', 'en'] as const) Object.assign(catalogs[language], messages[language]);
  put(localePath, JSON.stringify(catalogs, null, 2));
  const messagesPath = 'app/scripts/app-messages.js';
  const source = workspace.snapshot.files[messagesPath].content;
  const match = source.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo de la aplicación.');
  const merged = JSON.parse(match[1]);
  for (const language of ['es', 'en'] as const) Object.assign(merged[language], messages[language]);
  put(messagesPath, source.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  const appPath = 'app/scripts/app.js';
  put(appPath, `import { pageRetention } from '../runtime/retained-page-mixin.js';\n` + workspace.snapshot.files[appPath].content
    .replace("  mainNode: 'app',", "  mainNode: 'app',\n  viewLimit: pageRetention.limit,"));
  return workspace;
}
