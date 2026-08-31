import type { WorkspaceFile, WorkspaceSnapshot } from '../../types/scrim';
import { createVersionedCellsWorkspace, type VersionedCellsWorkspace, writeCellsFile } from './cellsVirtualFileSystem';

export interface CellsComponentScaffold {
  name: string;
  namespace?: '@open-cells-learning';
}

function file(path: string, content: string, language: WorkspaceFile['language']): WorkspaceFile {
  return { path, name: path.split('/').at(-1)!, content: content.trimStart(), language };
}

function classNameFor(tagName: string): string {
  return tagName.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

export function widgetMixinSource(): string {
  return `function academyWidgetError(code) {
  const error = new Error('Academy widget error: ' + code);
  error.code = code;
  return error;
}

function languageEventTarget() {
  return typeof globalThis.addEventListener === 'function' && typeof globalThis.removeEventListener === 'function'
    ? globalThis
    : undefined;
}

export const WidgetMixin = (Base) => {
  if (typeof Base !== 'function') throw academyWidgetError('ACADEMY_WIDGET_INVALID_BASE');

  return class extends Base {
    constructor(...args) {
      super(...args);
      this.__academyLanguageUpdate = () => this.requestUpdate?.();
      this.__academyListeningLanguage = false;
    }

    connectedCallback() {
      super.connectedCallback?.();
      const target = languageEventTarget();
      if (target && !this.__academyListeningLanguage) {
        target.addEventListener('language-update', this.__academyLanguageUpdate);
        this.__academyListeningLanguage = true;
      }
    }

    disconnectedCallback() {
      const target = languageEventTarget();
      if (target && this.__academyListeningLanguage) {
        target.removeEventListener('language-update', this.__academyLanguageUpdate);
        this.__academyListeningLanguage = false;
      }
      super.disconnectedCallback?.();
    }

    t(key, values = {}) {
      const intlMsg = globalThis.IntlMsg;
      if (!intlMsg || typeof intlMsg.t !== 'function') throw academyWidgetError('ACADEMY_I18N_NOT_INSTALLED');
      return intlMsg.t(key, values);
    }

    emitEvent(type, detail = {}, options = {}) {
      if (typeof type !== 'string' || type.trim().length === 0) throw academyWidgetError('ACADEMY_WIDGET_EVENT_NAME_REQUIRED');
      if (!options || typeof options !== 'object' || Array.isArray(options)) throw academyWidgetError('ACADEMY_WIDGET_INVALID_EVENT_OPTIONS');
      const hostName = typeof this.localName === 'string' ? this.localName.trim() : '';
      if (!hostName) throw academyWidgetError('ACADEMY_WIDGET_HOST_NAME_REQUIRED');
      return this.dispatchEvent(new CustomEvent(hostName + '-' + type.trim(), {
        ...options,
        bubbles: options.bubbles ?? true,
        composed: options.composed ?? true,
        cancelable: options.cancelable ?? true,
        detail,
      }));
    }
  };
};
`;
}

export function intlMsgRuntimeSource(): string {
  return `const LANGUAGE_UPDATE_EVENT = 'language-update';

function academyI18nError(code) {
  const error = new Error('Academy i18n error: ' + code);
  error.code = code;
  return error;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertLanguage(value) {
  if (typeof value !== 'string' || value.trim().length === 0) throw academyI18nError('ACADEMY_I18N_INVALID_INPUT');
  return value.trim();
}

function normalizeCatalogs(value) {
  if (!isRecord(value) || Object.keys(value).length === 0) throw academyI18nError('ACADEMY_I18N_INVALID_CATALOGS');
  let expectedKeys;
  const result = Object.create(null);
  for (const [language, catalog] of Object.entries(value)) {
    assertLanguage(language);
    if (!isRecord(catalog)) throw academyI18nError('ACADEMY_I18N_INVALID_CATALOGS');
    const keys = Object.keys(catalog).sort();
    if (keys.length === 0 || (expectedKeys && JSON.stringify(keys) !== JSON.stringify(expectedKeys))) {
      throw academyI18nError('ACADEMY_I18N_INVALID_CATALOGS');
    }
    expectedKeys = keys;
    const messages = Object.create(null);
    for (const key of keys) {
      if (typeof catalog[key] !== 'string' || catalog[key].length === 0) throw academyI18nError('ACADEMY_I18N_INVALID_CATALOGS');
      messages[key] = catalog[key];
    }
    result[language] = Object.freeze(messages);
  }
  return Object.freeze(result);
}

function assertSupportedLanguage(language, catalogs) {
  if (!catalogs || !Object.hasOwn(catalogs, language)) throw academyI18nError('ACADEMY_I18N_UNSUPPORTED_LANGUAGE');
}

function notifyLanguage(language) {
  if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
    globalThis.dispatchEvent(new CustomEvent(LANGUAGE_UPDATE_EVENT, { detail: { language } }));
  }
}

export function installIntlMsg(options = {}) {
  if (!isRecord(options)) throw academyI18nError('ACADEMY_I18N_INVALID_INPUT');
  let catalogs = options.catalogs === undefined ? undefined : normalizeCatalogs(options.catalogs);
  let language = assertLanguage(options.language ?? 'en');
  let requestedLanguage = language;
  let localesHost = typeof options.localesHost === 'string' ? options.localesHost : '';
  let requestVersion = 0;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  let loadUrlResourcesComplete = Promise.resolve(catalogs);

  if (catalogs) assertSupportedLanguage(language, catalogs);

  const loadUrlResources = (url = localesHost) => {
    const version = ++requestVersion;
    if (typeof url !== 'string' || url.trim().length === 0 || typeof fetchImpl !== 'function') {
      loadUrlResourcesComplete = Promise.reject(academyI18nError('ACADEMY_I18N_INVALID_INPUT'));
      loadUrlResourcesComplete.catch(() => {});
      return loadUrlResourcesComplete;
    }
    loadUrlResourcesComplete = Promise.resolve(fetchImpl(url))
      .then((response) => {
        if (!response || response.ok !== true || typeof response.json !== 'function') throw academyI18nError('ACADEMY_I18N_LOAD_FAILED');
        return response.json();
      })
      .then((nextCatalogs) => {
        const normalized = normalizeCatalogs(nextCatalogs);
        assertSupportedLanguage(requestedLanguage, normalized);
        if (version === requestVersion) {
          catalogs = normalized;
          language = requestedLanguage;
          notifyLanguage(language);
        }
        return normalized;
      })
      .catch((error) => {
        throw error?.code ? error : academyI18nError('ACADEMY_I18N_LOAD_FAILED');
      });
    loadUrlResourcesComplete.catch(() => {});
    return loadUrlResourcesComplete;
  };

  const setLanguage = (nextLanguage) => {
    requestedLanguage = assertLanguage(nextLanguage);
    if (!catalogs) return loadUrlResources();
    assertSupportedLanguage(requestedLanguage, catalogs);
    loadUrlResourcesComplete = Promise.resolve().then(() => {
      language = requestedLanguage;
      notifyLanguage(language);
      return catalogs;
    });
    return loadUrlResourcesComplete;
  };

  const intlMsg = {
    get lang() { return requestedLanguage; },
    set lang(nextLanguage) { void setLanguage(nextLanguage); },
    get localesHost() { return localesHost; },
    set localesHost(nextHost) {
      if (typeof nextHost !== 'string') throw academyI18nError('ACADEMY_I18N_INVALID_INPUT');
      localesHost = nextHost;
    },
    get loadUrlResourcesComplete() { return loadUrlResourcesComplete; },
    loadUrlResources,
    setLanguage,
    t(key, values = {}) {
      if (typeof key !== 'string' || !isRecord(values)) throw academyI18nError('ACADEMY_I18N_INVALID_INPUT');
      const message = catalogs?.[language]?.[key];
      if (typeof message !== 'string') return key;
      return message
        .replace(/\\$\\{([A-Za-z0-9_]+)\\}/g, (_match, name) => values[name] == null ? '' : String(values[name]))
        .replace(/\\{([A-Za-z0-9_]+)\\}/g, (_match, name) => values[name] == null ? '' : String(values[name]));
    },
  };

  globalThis.IntlMsg = intlMsg;
  if (!catalogs && localesHost) void loadUrlResources();
  return intlMsg;
}
`;
}

export function scopedRegistryTestSetupSource(): string {
  return `import * as PropertySymbol from 'happy-dom/lib/PropertySymbol.js';

const scopedRegistry = Symbol('academyScopedRegistry');
const aliases = new WeakMap();
let aliasNumber = 0;

function aliasFor(constructor) {
  let alias = aliases.get(constructor);
  if (alias === undefined) {
    alias = 'academy-test-scoped-' + aliasNumber;
    aliasNumber += 1;
    customElements.define(alias, constructor);
    aliases.set(constructor, alias);
  }
  return alias;
}

function upgradeScopedChildren(root, fragment) {
  const registry = root[scopedRegistry];
  for (const [tagName, definition] of registry.entries()) {
    for (const placeholder of fragment.querySelectorAll(tagName)) {
      const element = document.createElement(definition.alias);
      for (const attribute of placeholder.attributes) element.setAttribute(attribute.name, attribute.value);
      element.append(...placeholder.childNodes);
      element[PropertySymbol.tagName] = tagName.toUpperCase();
      element[PropertySymbol.localName] = tagName;
      placeholder.replaceWith(element);
      element.connectedCallback();
    }
  }
  return fragment;
}

class TestScopedRegistry {
  constructor() { this.definitions = new Map(); }
  define(tagName, constructor) {
    if (this.definitions.has(tagName)) throw new Error('Duplicate scoped element: ' + tagName);
    this.definitions.set(tagName, { constructor, alias: aliasFor(constructor) });
  }
  get(tagName) { return this.definitions.get(tagName)?.constructor; }
  entries() { return this.definitions.entries(); }
}

globalThis.CustomElementRegistry = TestScopedRegistry;

const attachShadow = HTMLElement.prototype.attachShadow;
HTMLElement.prototype.attachShadow = function(options) {
  const root = attachShadow.call(this, options);
  const registry = options.registry ?? options.customElements;
  if (registry instanceof TestScopedRegistry) {
    root[scopedRegistry] = registry;
    const importScope = root.importNode === undefined ? root.ownerDocument : root;
    const importNode = importScope.importNode;
    root.importNode = function(node, deep) {
      return upgradeScopedChildren(root, importNode.call(importScope, node, deep));
    };
  }
  return root;
};
`;
}

export function createCellsComponentWorkspace(scaffold: CellsComponentScaffold): VersionedCellsWorkspace {
  if (!/^(?:academy|open-cells)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scaffold.name)) {
    throw new Error('El nombre debe comenzar por academy- u open-cells- y usar kebab-case.');
  }
  const namespace = scaffold.namespace ?? '@open-cells-learning';
  const tagName = scaffold.name;
  const className = classNameFor(tagName);
  const sourcePath = `src/${tagName}.js`;
  const componentScss = `:host {
  display: block;
  color: #072b25;
}

.learning-card {
  position: relative;
  display: grid;
  gap: 1rem;
  min-height: 15rem;
  padding: clamp(1.5rem, 6vw, 2.5rem);
  overflow: hidden;
  border: 1px solid #d8d3b2;
  border-radius: 1.5rem;
  background: var(--learning-card-background, linear-gradient(145deg, #fffef4 0%, #f8f1cf 100%));
  box-shadow: 0 1rem 2.5rem rgb(7 43 37 / 14%);
}

.learning-card::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(rgb(7 43 37 / 10%) 0.7px, transparent 0.7px);
  background-size: 8px 8px;
  content: '';
}

.learning-card > * {
  position: relative;
  z-index: 1;
}

.learning-card__eyebrow {
  width: max-content;
  margin: 0;
  padding: 0.35rem 0.7rem;
  border: 1px solid #7aa192;
  border-radius: 999px;
  color: #285d50;
  font: 700 0.7rem/1 system-ui, sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: rotate(-5deg);
}

academy-type-text {
  display: block;
}

academy-action-button {
  align-self: end;
  justify-self: start;
  margin-top: 1rem;
}`;
  const localeCatalog = {
    en: {
      'learningCard.eyebrow': 'Learning component',
      'learningCard.title': 'Welcome, ${name}',
      'learningCard.description': 'You are learning to build a real Cells component.',
      'learningCard.continue': 'Continue',
    },
    es: {
      'learningCard.eyebrow': 'Componente de aprendizaje',
      'learningCard.title': 'Bienvenido, ${name}',
      'learningCard.description': 'Estás aprendiendo a construir un componente Cells real.',
      'learningCard.continue': 'Continuar',
    },
  };

  const files: Record<string, WorkspaceFile> = {
    'package.json': file('package.json', `${JSON.stringify({
      name: `${namespace}/${tagName}`,
      version: '0.1.0',
      type: 'module',
      exports: { '.': './index.js', [`./${tagName}.js`]: `./${tagName}.js` },
      types: './types/open-cells.d.ts',
      scripts: {
        dev: 'cells component:dev',
        test: 'cells component:test',
        'test:coverage': 'cells component:test --coverage',
        locales: 'cells component:locales',
        documentation: 'cells component:documentation',
        sass: 'cells component:sass',
        build: 'cells component:build:demo',
      },
      dependencies: {
        '@open-wc/scoped-elements': '3.0.10',
        '@webcomponents/scoped-custom-element-registry': '0.0.10',
        lit: '3.3.3',
      },
      devDependencies: {
        '@vitest/coverage-v8': '3.2.4',
        'happy-dom': '20.11.2',
        vite: '7.3.6',
        vitest: '3.2.4',
      },
    }, null, 2)}\n`, 'json'),
    'index.js': file('index.js', `export { ${className} } from './src/${className}.js';\n`, 'javascript'),
    [`${tagName}.js`]: file(`${tagName}.js`, `
import '@webcomponents/scoped-custom-element-registry';
import { ${className} } from './src/${className}.js';

if (!customElements.get('${tagName}')) customElements.define('${tagName}', ${className});

export { ${className} };
`, 'javascript'),
    [`src/${className}.js`]: file(`src/${className}.js`, `export { ${className} } from './${tagName}.js';\n`, 'javascript'),
    [`src/${tagName}.scss`]: file(`src/${tagName}.scss`, `${componentScss}\n`, 'css'),
    [`src/${tagName}.css.js`]: file(`src/${tagName}.css.js`, `
import { css } from 'lit';

export default css\`
${componentScss}
\`;
`, 'javascript'),
    [sourcePath]: file(sourcePath, `
import { LitElement, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { WidgetMixin } from './mixins/WidgetMixin.js';
import styles from './${tagName}.css.js';
import { AcademyTypeText } from './components/academy-type-text.js';
import { AcademyActionButton } from './components/academy-action-button.js';

export class ${className} extends WidgetMixin(ScopedElementsMixin(LitElement)) {
  static get scopedElements() {
    return {
      ...super.scopedElements,
      'academy-type-text': AcademyTypeText,
      'academy-action-button': AcademyActionButton,
    };
  }

  static get properties() {
    return {
      ...super.properties,
      learnerName: { type: String, attribute: 'learner-name' },
    };
  }

  static styles = styles;

  constructor() {
    super();
    this.learnerName = 'Alex';
  }

  handleContinue() {
    this.emitEvent('continue', { learnerName: this.learnerName });
  }

  render() {
    return html\`
      <article class="learning-card">
        <p class="learning-card__eyebrow">${'${'}this.t('learningCard.eyebrow')}</p>
        <academy-type-text
          as="h2"
        >${'${'}this.t('learningCard.title', { name: this.learnerName })}</academy-type-text>
        <academy-type-text
          as="p"
        >${'${'}this.t('learningCard.description')}</academy-type-text>
        <academy-action-button
          @click=${'${'}this.handleContinue}
        >${'${'}this.t('learningCard.continue')}</academy-action-button>
      </article>
    \`;
  }
}

`, 'javascript'),
    'src/components/academy-type-text.js': file('src/components/academy-type-text.js', `
import { LitElement, html } from 'lit';

export class AcademyTypeText extends LitElement {
  static get properties() {
    return {
      ...super.properties,
      as: { type: String },
    };
  }

  constructor() {
    super();
    this.as = 'p';
  }

  render() {
    const tag = ['h2', 'h3', 'p', 'span'].includes(this.as) ? this.as : 'p';
    return tag === 'h2'
      ? html\`<h2><slot></slot></h2>\`
      : tag === 'h3'
        ? html\`<h3><slot></slot></h3>\`
        : tag === 'span'
          ? html\`<span><slot></slot></span>\`
          : html\`<p><slot></slot></p>\`;
  }
}
`, 'javascript'),
    'src/components/academy-action-button.js': file('src/components/academy-action-button.js', `
import { LitElement, css, html } from 'lit';

export class AcademyActionButton extends LitElement {
  static get properties() {
    return {
      ...super.properties,
      disabled: { type: Boolean, reflect: true },
    };
  }

  static styles = css\`
    button {
      padding: 0.9rem 1.35rem;
      border: 0;
      border-radius: 999px;
      background: #2d7462;
      color: white;
      box-shadow: 0 0.45rem 0 #0b382f;
      font: 700 0.78rem/1 system-ui, sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
    }
    button:active { transform: translateY(0.2rem); box-shadow: 0 0.25rem 0 #0b382f; }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
  \`;

  constructor() {
    super();
    this.disabled = false;
  }
  render() {
    return html\`<button type="button" ?disabled=\${this.disabled}><slot></slot></button>\`;
  }
}
`, 'javascript'),
    'src/mixins/WidgetMixin.js': file('src/mixins/WidgetMixin.js', widgetMixinSource(), 'javascript'),
    'src/runtime/academy-intl-msg.js': file('src/runtime/academy-intl-msg.js', intlMsgRuntimeSource(), 'javascript'),
    'locales/locales.json': file('locales/locales.json', `${JSON.stringify(localeCatalog, null, 2)}\n`, 'json'),
    'demo/locales/locales.json': file('demo/locales/locales.json', `${JSON.stringify(localeCatalog, null, 2)}\n`, 'json'),
    'test/unit/locales/locales.json': file('test/unit/locales/locales.json', `${JSON.stringify(localeCatalog, null, 2)}\n`, 'json'),
    'demo/index.html': file('demo/index.html', `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Laboratorio de ${tagName}</title>
  </head>
  <body>
    <main>
      <form aria-label="Controles de la demostración" onsubmit="return false">
        <label>Nombre <input id="learner-name" value="Ada"></label>
        <label>Idioma
          <select id="locale">
            <option value="es" selected>Español</option>
            <option value="en">English</option>
          </select>
        </label>
      </form>
      <${tagName} data-cells-demo-subject learner-name="Ada"></${tagName}>
      <output id="event-log" aria-live="polite"></output>
    </main>
    <script type="module" src="./demo.js"></script>
  </body>
</html>
`, 'html'),
    'demo/basic.html': file('demo/basic.html', `
<!doctype html>
<html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ejemplo básico</title></head>
  <body>
    <${tagName} learner-name="Ada"></${tagName}>
    <script type="module" src="./demo.js"></script>
  </body>
</html>
`, 'html'),
    'demo/demo.js': file('demo/demo.js', `
import { installIntlMsg } from '../src/runtime/academy-intl-msg.js';

const intlMsg = installIntlMsg({ language: document.documentElement.lang || 'es' });
intlMsg.localesHost = new URL('./locales/locales.json', import.meta.url).href;
void intlMsg.loadUrlResources();
await intlMsg.loadUrlResourcesComplete;
const { ${className} } = await import('../${tagName}.js');

const card = document.querySelector('${tagName}');
const nameInput = document.querySelector('#learner-name');
const localeSelect = document.querySelector('#locale');
const eventLog = document.querySelector('#event-log');

nameInput?.addEventListener('input', (event) => {
  card.learnerName = event.target.value;
});

localeSelect?.addEventListener('change', async (event) => {
  await intlMsg.setLanguage(event.target.value);
  document.documentElement.lang = event.target.value;
  await card?.updateComplete;
});

card?.addEventListener('${tagName}-continue', (event) => {
  if (eventLog) eventLog.textContent = event.type + ' · ' + JSON.stringify(event.detail);
});

export { ${className} };
`, 'javascript'),
    'demo/demo-build.js': file('demo/demo-build.js', `
import './demo.js';
`, 'javascript'),
    'test/unit/setup.js': file('test/unit/setup.js', scopedRegistryTestSetupSource(), 'javascript'),
    'test/unit/scoped-registry-polyfill.js': file('test/unit/scoped-registry-polyfill.js', `
// Happy DOM uses the scoped-registry bridge installed by setup.js.
export {};
`, 'javascript'),
    [`test/unit/${tagName}.test.js`]: file(`test/unit/${tagName}.test.js`, `
import catalogs from './locales/locales.json' with { type: 'json' };
import { AcademyActionButton } from '../../src/components/academy-action-button.js';
import { AcademyTypeText } from '../../src/components/academy-type-text.js';
import { installIntlMsg } from '../../src/runtime/academy-intl-msg.js';
import { ${className} } from '../../${tagName}.js';

async function renderComponent() {
  const component = document.createElement('${tagName}');
  component.learnerName = 'Ada';
  document.body.replaceChildren(component);
  await component.updateComplete;
  return component;
}

describe('${tagName}', () => {
  beforeEach(async () => {
    const intlMsg = installIntlMsg({ catalogs, language: 'es' });
    await intlMsg.loadUrlResourcesComplete;
  });

  afterEach(() => document.body.replaceChildren());

  it('renderiza español con dependencias scoped sin registro global', async () => {
    const component = await renderComponent();
    const typeText = component.shadowRoot.querySelector('academy-type-text');
    const button = component.shadowRoot.querySelector('academy-action-button');
    await typeText.updateComplete;
    await button.updateComplete;

    expect(${className}.scopedElements['academy-type-text']).toBe(AcademyTypeText);
    expect(${className}.scopedElements['academy-action-button']).toBe(AcademyActionButton);
    expect(typeText.constructor).toBe(AcademyTypeText);
    expect(button.constructor).toBe(AcademyActionButton);
    expect(customElements.get('academy-type-text')).toBeUndefined();
    expect(customElements.get('academy-action-button')).toBeUndefined();
    expect(component.shadowRoot.textContent).toContain('Bienvenido, Ada');
    expect(component.shadowRoot.textContent).toContain('Continuar');
  });

  it('cambia a inglés sobre el mismo host después de esperar recursos', async () => {
    const component = await renderComponent();
    const intlMsg = globalThis.IntlMsg;
    await intlMsg.setLanguage('en');
    await intlMsg.loadUrlResourcesComplete;
    await component.updateComplete;

    expect(component.shadowRoot.textContent).toContain('Welcome, Ada');
    expect(component.shadowRoot.textContent).toContain('Continue');
  });

  it('emite el evento público completo desde el control visible', async () => {
    const component = await renderComponent();
    const button = component.shadowRoot.querySelector('academy-action-button');
    await button.updateComplete;
    const received = new Promise((resolve) => component.addEventListener('${tagName}-continue', resolve, { once: true }));

    button.shadowRoot.querySelector('button').click();
    const event = await received;
    expect(event.detail).toEqual({ learnerName: 'Ada' });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.cancelable).toBe(true);
  });
});
`, 'javascript'),
    'custom-elements.json': file('custom-elements.json', `${JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [{
        kind: 'javascript-module',
        path: sourcePath,
        declarations: [{
          kind: 'class',
          name: className,
          tagName,
          description: 'Componente de aprendizaje que muestra contenido localizado y publica una acción de continuación.',
          members: [{
            kind: 'field',
            name: 'learnerName',
            attribute: 'learner-name',
            type: { text: 'string' },
            default: "'Alex'",
            description: 'Nombre que se incorpora al saludo localizado.',
          }],
          events: [{
            name: `${tagName}-continue`,
            type: { text: 'CustomEvent<{ learnerName: string }>' },
            description: 'Comunica que la persona activó la acción principal.',
          }],
          slots: [],
          cssProperties: [{
            name: '--learning-card-background',
            default: 'linear-gradient(145deg, #fffef4 0%, #f8f1cf 100%)',
            description: 'Fondo consumible del contenedor principal.',
          }],
        }],
        exports: [{ kind: 'custom-element-definition', name: tagName, declaration: { name: className, module: sourcePath } }],
      }],
    }, null, 2)}\n`, 'json'),
    'README.md': file('README.md', `
# ${tagName}

Componente Cells educativo con dependencias scoped, traducciones en inglés y español y un evento público.

## Desarrollo

- \`cells component:dev\` abre la demo consumidora.
- \`cells component:test\` ejecuta los contratos públicos.
- \`cells component:documentation\` actualiza la documentación de la API.

## Evento

\`${tagName}-continue\` incluye \`learnerName\` en \`event.detail\`.
`, 'markdown'),
    'vite.config.js': file('vite.config.js', `
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['test/unit/**/*.test.js'],
    setupFiles: ['test/unit/setup.js'],
    alias: {
      '@webcomponents/scoped-custom-element-registry': fileURLToPath(new URL('./test/unit/scoped-registry-polyfill.js', import.meta.url)),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/${tagName}.js'],
      thresholds: {
        'src/${tagName}.js': { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
`, 'javascript'),
    'types/open-cells.d.ts': file('types/open-cells.d.ts', `
declare module 'lit' {
  export class LitElement extends HTMLElement {
    /** Promesa que termina cuando Lit ha actualizado el DOM. */
    readonly updateComplete: Promise<boolean>;
  }
  /** Crea una plantilla HTML segura a partir de valores enlazados. */
  export function html(strings: TemplateStringsArray, ...values: unknown[]): unknown;
  /** Declara los estilos encapsulados del componente. */
  export function css(strings: TemplateStringsArray, ...values: unknown[]): unknown;
}

declare module '@open-wc/scoped-elements/lit-element.js' {
  type Constructor<T = object> = new (...args: any[]) => T;
  /** Añade un registro local de custom elements al host. */
  export function ScopedElementsMixin<T extends Constructor>(base: T): T;
}

interface CellsTestExpectation {
  toBe(expected: unknown): void;
  toBeUndefined(): void;
  toContain(expected: unknown): void;
  toEqual(expected: unknown): void;
}

declare function describe(name: string, callback: () => void): void;
declare function beforeEach(callback: () => void): void;
declare function afterEach(callback: () => void): void;
declare function it(name: string, callback: () => void | Promise<void>): void;
declare function expect(value: unknown): CellsTestExpectation;

`, 'typescript'),
  };

  const snapshot: WorkspaceSnapshot = { files, activeFilePath: sourcePath };
  return createVersionedCellsWorkspace(snapshot);
}

export type CellsComponentPracticeStage = 'scaffold' | 'api' | 'composition' | 'styles' | 'i18n' | 'demo' | 'tests' | 'delivery';

export function createCellsPracticeWorkspace(stage: CellsComponentPracticeStage = 'composition'): VersionedCellsWorkspace {
  const complete = createCellsComponentWorkspace({ name: 'academy-learning-card' });
  const path = 'src/academy-learning-card.js';
  if (stage === 'scaffold') {
    const manifestPath = 'package.json';
    const manifest = JSON.parse(complete.snapshot.files[manifestPath].content);
    delete manifest.exports;
    delete manifest.scripts.documentation;
    const changed = writeCellsFile(complete, manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: manifestPath }, 0);
  }
  if (stage === 'api') {
    const starter = complete.snapshot.files[path].content
      .replace("      learnerName: { type: String, attribute: 'learner-name' },", '      // TODO: declara learnerName como propiedad String y atributo learner-name.')
      .replace("    this.emitEvent('continue', { learnerName: this.learnerName });", '    // TODO: publica la intención con el nombre actual; no emitas el click crudo.');
    return createVersionedCellsWorkspace(writeCellsFile(complete, path, starter).snapshot, 0);
  }
  if (stage === 'composition') {
    const starter = complete.snapshot.files[path].content
      .replace("      'academy-action-button': AcademyActionButton,", '      // TODO: registra aquí el botón local que ya está importado.')
      .replace("    this.emitEvent('continue', { learnerName: this.learnerName });", '    // TODO: comunica la acción pública con el nombre de quien aprende.');
    return createVersionedCellsWorkspace(writeCellsFile(complete, path, starter).snapshot, 0);
  }
  if (stage === 'styles') {
    const stylePath = 'src/academy-learning-card.css.js';
    const staleRuntimeStyle = `import { css } from 'lit';\n\nexport default css\`:host { display: block; }\`;\n`;
    const changed = writeCellsFile(complete, stylePath, staleRuntimeStyle);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: stylePath }, 0);
  }
  if (stage === 'i18n') {
    const localePath = 'locales/locales.json';
    const catalog = JSON.parse(complete.snapshot.files[localePath].content);
    delete catalog.en['learningCard.continue'];
    catalog.es['learningCard.title'] = 'Bienvenido';
    const changed = writeCellsFile(complete, localePath, `${JSON.stringify(catalog, null, 2)}\n`);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: localePath }, 0);
  }
  if (stage === 'demo') {
    const demoPath = 'demo/demo.js';
    const controller = complete.snapshot.files[demoPath].content
      .replace("import('../academy-learning-card.js')", "import('../src/academy-learning-card.js')")
      .replace('  card.learnerName = event.target.value;', '  // TODO: conecta el valor del control con la propiedad pública del componente.');
    const changed = writeCellsFile(complete, demoPath, controller);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: demoPath }, 0);
  }
  if (stage === 'tests') {
    const testPath = 'test/unit/academy-learning-card.test.js';
    const testSource = complete.snapshot.files[testPath].content
      .replace('    expect(event.composed).toBe(true);', '    // TODO: comprueba que el evento también cruza el límite del Shadow DOM.');
    const changed = writeCellsFile(complete, testPath, testSource);
    return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: testPath }, 0);
  }
  const metadataPath = 'custom-elements.json';
  const metadata = JSON.parse(complete.snapshot.files[metadataPath].content);
  metadata.modules[0].declarations[0].tagName = 'academy-card-incompleta';
  const withMetadata = writeCellsFile(complete, metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  const readmePath = 'README.md';
  const changed = writeCellsFile(withMetadata, readmePath, '# academy-learning-card\n\nTODO: documenta propiedades, evento público, demo y comandos para continuar fuera del curso.\n');
  return createVersionedCellsWorkspace({ ...changed.snapshot, activeFilePath: metadataPath }, 0);
}
