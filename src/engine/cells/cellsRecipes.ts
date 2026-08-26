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
  background: linear-gradient(145deg, #fffef4 0%, #f8f1cf 100%);
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
      'academy-type-text': AcademyTypeText,
      'academy-action-button': AcademyActionButton,
    };
  }

  static properties = {
    learnerName: { type: String, attribute: 'learner-name' },
  };

  static styles = styles;

  learnerName = 'Alex';

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
  static properties = {
    as: { type: String },
  };

  as = 'p';

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
  static properties = {
    disabled: { type: Boolean, reflect: true },
  };

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

  disabled = false;
  render() {
    return html\`<button type="button" ?disabled=\${this.disabled}><slot></slot></button>\`;
  }
}
`, 'javascript'),
    'src/mixins/WidgetMixin.js': file('src/mixins/WidgetMixin.js', `
/**
 * @template {new (...args: any[]) => HTMLElement} T
 * @param {T} Base Clase host que conserva su API de HTMLElement.
 */
export const WidgetMixin = (Base) => class extends Base {
  /** Traduce una clave del catálogo activo y reemplaza sus parámetros. */
  t(key, values = {}) {
    const intl = globalThis.IntlMsg;
    if (!intl || typeof intl.t !== 'function') throw new Error('El motor de idioma Cells no está instalado.');
    return intl.t(key, values);
  }

  /** Emite un evento público prefijado por el tag, con bubbles y composed activos por defecto. */
  emitEvent(type, detail = {}, options = {}) {
    return this.dispatchEvent(new CustomEvent(this.localName + '-' + type, {
      ...options,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
      cancelable: options.cancelable ?? true,
      detail,
    }));
  }
};
`, 'javascript'),
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
    <${tagName} data-cells-demo-subject learner-name="Ada"></${tagName}>
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
import { ${className} } from '../${tagName}.js';

export { ${className} };

const card = document.querySelector('${tagName}');
const nameInput = document.querySelector('#learner-name');
const localeSelect = document.querySelector('#locale');
const eventLog = document.querySelector('#event-log');

nameInput?.addEventListener('input', (event) => {
  card.learnerName = event.target.value;
});

localeSelect?.addEventListener('change', (event) => {
  globalThis.__OPEN_CELLS_LOCALE__ = event.target.value;
  card?.requestUpdate();
});

card?.addEventListener('${tagName}-continue', (event) => {
  if (eventLog) eventLog.textContent = event.type + ' · ' + JSON.stringify(event.detail);
});
`, 'javascript'),
    'demo/demo-build.js': file('demo/demo-build.js', `
import './demo.js';
`, 'javascript'),
    [`test/unit/${tagName}.test.js`]: file(`test/unit/${tagName}.test.js`, `
import { AcademyActionButton } from '../../src/components/academy-action-button.js';
import { AcademyTypeText } from '../../src/components/academy-type-text.js';
import { ${className} } from '../../${tagName}.js';

const catalogs = ${JSON.stringify({
  en: {
    'learningCard.title': 'Welcome, ${name}',
    'learningCard.description': 'You are learning to build a real Cells component.',
    'learningCard.continue': 'Continue',
  },
  es: {
    'learningCard.title': 'Bienvenido, ${name}',
    'learningCard.description': 'Estás aprendiendo a construir un componente Cells real.',
    'learningCard.continue': 'Continuar',
  },
})};

describe('${tagName}', () => {
  beforeEach(() => {
    globalThis.IntlMsg = {
      lang: 'es',
      t(key, values = {}) {
        const template = catalogs[this.lang][key];
        return Object.entries(values).reduce((text, [name, value]) => text.replaceAll('\${' + name + '}', String(value)), template);
      },
    };
  });

  afterEach(() => document.body.replaceChildren());

  it('declara dependencias scoped sin registro global', () => {
    expect(${className}.scopedElements['academy-type-text']).toBe(AcademyTypeText);
    expect(${className}.scopedElements['academy-action-button']).toBe(AcademyActionButton);
    expect(customElements.get('academy-type-text')).toBeUndefined();
    expect(customElements.get('academy-action-button')).toBeUndefined();
  });

  it('renderiza ambos idiomas con valores diferentes', async () => {
    const context = { learnerName: 'Ada', t: globalThis.IntlMsg.t.bind(globalThis.IntlMsg) };
    expect(${className}.prototype.render.call(context).values.join(' ')).toContain('Bienvenido, Ada');
    globalThis.IntlMsg.lang = 'en';
    expect(${className}.prototype.render.call(context).values.join(' ')).toContain('Welcome, Ada');
  });

  it('emite el evento público completo', async () => {
    const element = /** @type {${className}} */ (document.createElement('${tagName}'));
    element.learnerName = 'Lina';
    const received = new Promise((resolve) => element.addEventListener('${tagName}-continue', resolve, { once: true }));
    element.handleContinue();
    const event = await received;
    expect(event.detail).toEqual({ learnerName: 'Lina' });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});
`, 'javascript'),
    'custom-elements.json': file('custom-elements.json', `${JSON.stringify({
      schemaVersion: '1.0.0',
      modules: [{
        kind: 'javascript-module',
        path: sourcePath,
        declarations: [{ kind: 'class', name: className, tagName }],
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
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
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
      .replace("    learnerName: { type: String, attribute: 'learner-name' },", '    // TODO: declara learnerName como propiedad String y atributo learner-name.')
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
      .replace("from '../academy-learning-card.js'", "from '../src/academy-learning-card.js'")
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
