import type { WorkspaceFile } from '../../types/scrim';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { createVersionedCellsWorkspace, type VersionedCellsWorkspace } from './cellsVirtualFileSystem';

const TAG = 'academy-account-detail';
const SOURCE = `src/${TAG}.js`;

const copy = {
  es: {
    'account.detail.title': 'Tu cuenta, de un vistazo',
    'account.detail.demo': 'Proyecto educativo · datos de demostración',
    'account.detail.movements': 'Ver movimientos',
    'account.detail.back': 'Volver al resumen',
    'account.detail.loading': 'Estamos preparando el detalle de la cuenta.',
    'account.detail.empty': 'Todavía no hay una cuenta para mostrar.',
    'account.detail.error': 'No pudimos cargar la cuenta. Puedes volver a intentarlo.',
    'account.detail.retry': 'Reintentar',
    'account.summary.balance': 'Saldo disponible',
    'account.summary.note': 'El resumen recibe datos; no hace peticiones ni decide la navegación.',
    'account.movements.title': 'Movimientos de la cuenta',
    'account.movements.search': 'Buscar por concepto',
    'account.movements.empty': 'No hay movimientos que coincidan con tu búsqueda.',
    'account.movements.results': 'Resultados',
  },
  en: {
    'account.detail.title': 'Your account at a glance',
    'account.detail.demo': 'Educational project · demonstration data',
    'account.detail.movements': 'View transactions',
    'account.detail.back': 'Back to overview',
    'account.detail.loading': 'Preparing the account details.',
    'account.detail.empty': 'There is no account to display yet.',
    'account.detail.error': 'The account could not be loaded. You can try again.',
    'account.detail.retry': 'Try again',
    'account.summary.balance': 'Available balance',
    'account.summary.note': 'The overview receives data; it does not fetch or own navigation.',
    'account.movements.title': 'Account transactions',
    'account.movements.search': 'Search by description',
    'account.movements.empty': 'No transactions match your search.',
    'account.movements.results': 'Results',
  },
};

function pageSource(className: string, tag: string, properties: string, defaults: string, methods: string, markup: string): string {
  return `import { LitElement, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { WidgetMixin } from '../mixins/WidgetMixin.js';
import { getComponentSharedStyles } from '../styles/shared-styles.js';
import { formatAmount } from '../utils/format-amount.js';
import styles from './${tag}.css.js';

export class ${className} extends WidgetMixin(ScopedElementsMixin(LitElement)) {
  static get is() { return '${tag}'; }
  static get properties() {
    return { ...super.properties, ${properties} };
  }
  static get scopedElements() {
    return this.scopedElementsFromClasses(this.configurationScopedElements());
  }
  static get styles() {
    return [styles, getComponentSharedStyles('${tag}-shared-styles')];
  }
  constructor() {
    super();
    ${defaults}
  }
  ${methods}
  render() {
    return html\`${markup}\`;
  }
}
`;
}

/** An original feature; the supplied action is the same component taught earlier. */
export function createCellsAccountFeatureWorkspace(action: VersionedCellsWorkspace): VersionedCellsWorkspace {
  const base = createCellsComponentWorkspace({ name: TAG });
  const files = { ...base.snapshot.files };
  const put = (path: string, content: string, language: WorkspaceFile['language'] = 'javascript') => {
    files[path] = { path, name: path.split('/').at(-1)!, content, language };
  };
  const stylePair = (path: string, styles: string) => {
    put(`${path}.scss`, styles, 'css');
    put(`${path}.css.js`, `import { css } from 'lit';\nexport default css\`\n${styles}\n\`;\n`);
  };
  for (const source of Object.values(action.snapshot.files)) {
    if (source.path.startsWith('src/components/')) files[source.path] = { ...source };
    if (source.path.startsWith('src/academy-action-button.')) {
      const path = source.path.replace('src/', 'src/components/');
      put(path, source.content.replaceAll("from './components/", "from './").replaceAll("from './mixins/", "from '../mixins/").replaceAll("from './styles/", "from '../styles/"), source.language);
    }
  }

  put('src/config/demo-data.js', `export const demoAccount = {
  name: 'Cuenta cotidiana',
  balance: 1260.5,
  movements: [
    { id: 'm-1', description: 'Compra en mercado', amount: -34.5 },
    { id: 'm-2', description: 'Ingreso de ejemplo', amount: 400 },
    { id: 'm-3', description: 'Billete de tren', amount: -18.25 }
  ]
};\n`);
  put('src/utils/format-amount.js', `export function formatAmount(value, language = 'es') {
  return Number.isFinite(value)
    ? new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(value)
    : '—';
}\n`);
  put('src/pages/academy-account-summary.js', pageSource('AcademyAccountSummary', 'academy-account-summary',
    "accountName: { type: String, attribute: 'account-name' }, balance: { type: Number }",
    "this.accountName = ''; this.balance = 0;", '',
    `<article aria-label=\${this.accountName}>
      <p>\${this.t('account.summary.balance')}</p>
      <strong>\${formatAmount(this.balance, globalThis.IntlMsg.lang)}</strong>
      <p class="note">\${this.t('account.summary.note')}</p>
    </article>`));
  put('src/pages/academy-movement-list.js', pageSource('AcademyMovementList', 'academy-movement-list',
    "movements: { type: Array, attribute: false }, query: { type: String }",
    "this.movements = []; this.query = '';",
    `get filteredMovements() {
    const query = String(this.query).trim().toLocaleLowerCase();
    return (Array.isArray(this.movements) ? this.movements : [])
      .filter((movement) => String(movement.description ?? '').toLocaleLowerCase().includes(query));
  }
  handleInput(event) {
    this.emitEvent('filter', { query: event.target.value });
  }`,
    `<section>
      <h2>\${this.t('account.movements.title')}</h2>
      <label>\${this.t('account.movements.search')}<input type="search" .value=\${this.query} @input=\${this.handleInput}></label>
      <p role="status">\${this.t('account.movements.results')}: \${this.filteredMovements.length}</p>
      \${this.filteredMovements.length ? html\`<ul>\${this.filteredMovements.map((movement) => html\`<li data-movement-id=\${movement.id}><span>\${movement.description}</span><strong>\${formatAmount(movement.amount, globalThis.IntlMsg.lang)}</strong></li>\`)}</ul>\` : html\`<p>\${this.t('account.movements.empty')}</p>\`}
    </section>`));
  put(SOURCE, `import { LitElement, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { WidgetMixin } from './mixins/WidgetMixin.js';
import { getComponentSharedStyles } from './styles/shared-styles.js';
import { AcademyActionButton } from './components/academy-action-button.js';
import { AcademyAccountSummary } from './pages/academy-account-summary.js';
import { AcademyMovementList } from './pages/academy-movement-list.js';
import styles from './${TAG}.css.js';

export class AcademyAccountDetail extends WidgetMixin(ScopedElementsMixin(LitElement)) {
  static get is() { return '${TAG}'; }
  static get properties() {
    return {
      ...super.properties,
      accountName: { type: String, attribute: 'account-name' },
      balance: { type: Number },
      movements: { type: Array, attribute: false },
      status: { type: String },
      view: { state: true },
      query: { state: true },
    };
  }
  static get scopedElements() {
    const classes = [
      AcademyActionButton,
      AcademyAccountSummary,
      AcademyMovementList,
      ...this.configurationScopedElements(),
    ];
    return { ...super.scopedElements, ...this.scopedElementsFromClasses(classes) };
  }
  static get styles() {
    return [styles, getComponentSharedStyles('${TAG}-shared-styles')];
  }
  constructor() {
    super();
    this.accountName = '';
    this.balance = 0;
    this.movements = [];
    this.status = 'empty';
    this.view = 'summary';
    this.query = '';
  }
  handleAction(event) {
    event?.stopPropagation();
    this.view = this.view === 'summary' ? 'movements' : 'summary';
    this.emitEvent('navigate', { accountName: this.accountName, view: this.view });
  }
  handleFilter(event) {
    event.stopPropagation();
    this.query = event.detail.query;
  }
  handleRetry() {
    this.emitEvent('retry', { accountName: this.accountName });
  }
  renderContent() {
    if (this.status === 'loading') return html\`<p role="status">\${this.t('account.detail.loading')}</p>\`;
    if (this.status === 'empty') return html\`<p role="status">\${this.t('account.detail.empty')}</p>\`;
    if (this.status !== 'success') return html\`<p role="alert">\${this.t('account.detail.error')}</p><button type="button" @click=\${this.handleRetry}>\${this.t('account.detail.retry')}</button>\`;
    return html\`
      <academy-action-button .label=\${this.t(this.view === 'summary' ? 'account.detail.movements' : 'account.detail.back')} @academy-action-button-activate=\${this.handleAction}></academy-action-button>
      \${this.view === 'summary'
        ? html\`<academy-account-summary .accountName=\${this.accountName} .balance=\${this.balance}></academy-account-summary>\`
        : html\`<academy-movement-list .movements=\${this.movements} .query=\${this.query} @academy-movement-list-filter=\${this.handleFilter}></academy-movement-list>\`}
    \`;
  }
  render() {
    return html\`<main><p class="eyebrow">\${this.t('account.detail.demo')}</p><h1>\${this.t('account.detail.title')}</h1><p class="account-name">\${this.accountName}</p>\${this.renderContent()}</main>\`;
  }
}
`);
  stylePair(`src/${TAG}`, `:host { display: block; color: #172a26; font-family: system-ui, sans-serif; }
main { display: grid; gap: 1.25rem; padding: clamp(1rem, 4vw, 2rem); background: var(--account-surface, #fffdf4); border: 2px solid #172a26; border-radius: 1.25rem; box-shadow: .4rem .4rem 0 #172a26; }
h1, p { margin: 0; }
h1 { font-size: clamp(1.35rem, 4vw, 2rem); }
.eyebrow { font-size: .75rem; letter-spacing: .07em; text-transform: uppercase; }
.account-name { font-weight: 700; }
button { font: inherit; padding: .65rem 1rem; border: 2px solid currentColor; border-radius: .6rem; background: #fce977; cursor: pointer; }
button:focus-visible { outline: 3px solid #376fba; outline-offset: 3px; }
`);
  stylePair('src/pages/academy-account-summary', `:host { display: block; }
article { padding: 1.5rem; background: var(--account-balance-surface, #e8f3e9); border-radius: 1rem; }
strong { font-size: clamp(1.8rem, 5vw, 2.6rem); font-variant-numeric: tabular-nums; }
.note { font-size: .875rem; line-height: 1.5; }
`);
  stylePair('src/pages/academy-movement-list', `:host { display: block; min-width: 0; }
section { display: grid; gap: .8rem; }
h2, p { margin: 0; }
label { display: grid; gap: .4rem; font-weight: 600; }
input { box-sizing: border-box; width: 100%; min-height: 2.8rem; padding: .65rem; border: 2px solid #476359; border-radius: .6rem; font: inherit; }
input:focus-visible { outline: 3px solid #376fba; outline-offset: 2px; }
ul { list-style: none; margin: 0; padding: 0; }
li { display: flex; justify-content: space-between; gap: 1rem; padding: .9rem 0; border-bottom: 1px solid #c8d2c5; }
li span { overflow-wrap: anywhere; }
li strong { white-space: nowrap; font-variant-numeric: tabular-nums; }
`);
  const actionCopy = JSON.parse(action.snapshot.files['locales/locales.json'].content);
  const locales = { es: { ...actionCopy.es, ...copy.es }, en: { ...actionCopy.en, ...copy.en } };
  for (const path of ['locales/locales.json', 'demo/locales/locales.json', 'test/unit/locales/locales.json']) put(path, `${JSON.stringify(locales, null, 2)}\n`, 'json');
  put('demo/index.html', `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Detalle de cuenta · proyecto educativo</title></head><body>
<label>Nombre de cuenta<input id="account-name" value="Cuenta cotidiana"></label>
<label>Estado<select id="status"><option value="success">Con datos</option><option value="loading">Cargando</option><option value="empty">Sin cuenta</option><option value="error">Error</option></select></label>
<label>Idioma<select id="locale"><option value="es">Español</option><option value="en">Inglés</option></select></label>
<${TAG} data-cells-demo-subject></${TAG}><output id="event-log" aria-live="polite"></output><script type="module" src="./demo.js"></script></body></html>`, 'html');
  for (const state of ['success', 'loading', 'empty', 'error']) put(`demo/${state}.html`, `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><${TAG} status="${state}"></${TAG}><script type="module" src="./demo.js"></script></body></html>`, 'html');
  put('demo/demo.js', `import { installIntlMsg } from '../src/runtime/academy-intl-msg.js';
import { demoAccount } from '../src/config/demo-data.js';
const intlMsg = installIntlMsg({ language: 'es' });
intlMsg.localesHost = new URL('./locales/locales.json', import.meta.url).href;
void intlMsg.loadUrlResources();
await intlMsg.loadUrlResourcesComplete;
await import('../${TAG}.js');
const subject = document.querySelector('${TAG}');
if (subject) {
  subject.accountName = demoAccount.name;
  subject.balance = demoAccount.balance;
  subject.movements = demoAccount.movements.map((movement) => ({ ...movement }));
  subject.status = subject.getAttribute('status') || 'success';
}
document.querySelector('#account-name')?.addEventListener('input', (event) => { subject.accountName = event.target.value; });
document.querySelector('#status')?.addEventListener('change', (event) => { subject.status = event.target.value; });
document.querySelector('#locale')?.addEventListener('change', (event) => intlMsg.setLanguage(event.target.value));
for (const type of ['${TAG}-navigate', '${TAG}-retry']) subject?.addEventListener(type, (event) => {
  const log = document.querySelector('#event-log');
  if (log) log.textContent = event.type + ' · ' + JSON.stringify(event.detail);
});
`);
  put(`test/unit/${TAG}.test.js`, `import catalogs from './locales/locales.json' with { type: 'json' };
import { installIntlMsg } from '../../src/runtime/academy-intl-msg.js';
import '../../${TAG}.js';
describe('account detail public navigation', () => {
  beforeEach(async () => { await installIntlMsg({ catalogs, language: 'es' }).loadUrlResourcesComplete; });
  afterEach(() => document.body.replaceChildren());
  it('navigates through the visible action and emits the current account', async () => {
    const host = document.createElement('${TAG}');
    host.accountName = 'Cuenta de prueba';
    host.status = 'success';
    document.body.append(host);
    await host.updateComplete;
    const action = host.shadowRoot.querySelector('academy-action-button');
    await action.updateComplete;
    const received = new Promise((resolve) => host.addEventListener('${TAG}-navigate', resolve, { once: true }));
    action.shadowRoot.querySelector('button').click();
    const event = await received;
    expect(event.detail).toEqual({ accountName: 'Cuenta de prueba', view: 'movements' });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    await host.updateComplete;
    expect(host.shadowRoot.querySelector('academy-movement-list')).not.toBeNull();
  });
});
`);
  const metadata = JSON.parse(files['custom-elements.json'].content);
  const declaration = metadata.modules[0].declarations[0];
  declaration.description = 'Feature educativa propia: resumen, movimientos y filtros mediante contratos públicos.';
  declaration.members = [
    { kind: 'field', name: 'accountName', attribute: 'account-name', type: { text: 'string' }, description: 'Nombre público de la cuenta.' },
    { kind: 'field', name: 'balance', type: { text: 'number' }, description: 'Saldo de demostración en euros.' },
    { kind: 'field', name: 'movements', type: { text: 'Array<{ id: string; description: string; amount: number }>' }, description: 'Colección recibida por propiedad; no se modifica al filtrar.' },
    { kind: 'field', name: 'status', type: { text: 'string' }, description: 'success, loading, empty o error; sin datos empieza en empty.' },
  ];
  declaration.cssProperties = [{ name: '--account-surface', description: 'Fondo de la feature.' }, { name: '--account-balance-surface', description: 'Fondo del resumen.' }];
  declaration.events = [{ name: `${TAG}-navigate`, type: { text: 'CustomEvent<{ accountName: string; view: string }>' }, description: 'Cambio de vista interno.' }, { name: `${TAG}-retry`, description: 'El consumidor decide cómo reintentar la carga.' }];
  put('custom-elements.json', `${JSON.stringify(metadata, null, 2)}\n`, 'json');
  const manifest = JSON.parse(files['package.json'].content);
  manifest.learningArtifact = 'account-detail';
  put('package.json', `${JSON.stringify(manifest, null, 2)}\n`, 'json');
  put('README.md', `# ${TAG}

Feature educativa independiente, con datos ficticios y componentes propios. No requiere paquetes privados.

## Flujo

El host posee la vista y la consulta. El resumen recibe accountName y balance; la lista recibe movements y query. El botón compartido comunica una intención y el host emite ${TAG}-navigate con accountName y view. ${TAG}-retry solicita una nueva carga sin inventar una respuesta satisfactoria.

## Archivos

- src/${TAG}.js: composición y cambios de vista.
- src/pages/: resumen y movimientos presentacionales.
- src/components/: el mismo botón reutilizado en el curso.
- src/config/demo-data.js: datos ficticios, sustituibles desde propiedades.
- src/styles/shared-styles.js: registro educativo de estilos Lit, cargado antes de los componentes.
- demo/: consumidores y casos success, loading, empty y error.
- test/unit/: prueba desde el botón y el evento público.

## Comprobar y continuar

Usa cells component:dev, cells component:test y cells component:documentation. Filtra por tren y por un texto sin coincidencias; vuelve al resumen y cambia el idioma. Un data manager solo haría falta al integrar un origen de datos: no pertenece a los componentes presentacionales.

## Contratos del entorno educativo

WidgetMixin aporta this.t, this.emitEvent, scopedElementsFromClasses y configurationScopedElements. La configuración base está vacía; una variante puede añadir clases con is. getComponentSharedStyles consume registros propios hechos antes de importar el componente. Son implementaciones educativas públicas, no una redistribución de un runtime privado.
`, 'markdown');
  return createVersionedCellsWorkspace({ ...base.snapshot, files, activeFilePath: SOURCE }, 0);
}

export function createCellsAccountFeaturePractice(complete: VersionedCellsWorkspace): VersionedCellsWorkspace {
  const original = complete.snapshot.files[SOURCE];
  const content = original.content
    .replace('      AcademyActionButton,', '      // Registra aquí la clase del botón que ya está importada.')
    .replace("    this.emitEvent('navigate', { accountName: this.accountName, view: this.view });", '    // Comunica al consumidor el cambio de vista y la cuenta actual.');
  return createVersionedCellsWorkspace({ ...complete.snapshot, files: { ...complete.snapshot.files, [SOURCE]: { ...original, content } } }, 0);
}
