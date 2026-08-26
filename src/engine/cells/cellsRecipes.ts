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
    [`src/${tagName}.scss`]: file(`src/${tagName}.scss`, `
:host {
  display: block;
  font-family: system-ui, sans-serif;
}

article {
  border: 2px solid #111827;
  padding: 1.25rem;
  background: #ffffff;
}
`, 'css'),
    [`src/${tagName}.css.js`]: file(`src/${tagName}.css.js`, `
import { css } from 'lit';

export default css\`
  :host { display: block; font-family: system-ui, sans-serif; }
  article { border: 2px solid #111827; padding: 1.25rem; background: #ffffff; }
\`;
`, 'javascript'),
    [sourcePath]: file(sourcePath, `
import { LitElement, css, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { WidgetMixin } from './mixins/WidgetMixin.js';
import { OpenCellsTypeText } from './components/OpenCellsTypeText.js';
import { OpenCellsButtonDefault } from './components/OpenCellsButtonDefault.js';

export class ${className} extends WidgetMixin(ScopedElementsMixin(LitElement)) {
  static get scopedElements() {
    return {
      'open-cells-type-text': OpenCellsTypeText,
      'open-cells-button-default': OpenCellsButtonDefault,
    };
  }

  static properties = {
    learnerName: { type: String, attribute: 'learner-name' },
  };

  static styles = css\`
    :host { display: block; font-family: system-ui, sans-serif; }
    article { border: 2px solid #111827; padding: 1.25rem; background: #ffffff; }
    open-cells-button-default { margin-top: 1rem; }
  \`;

  learnerName = 'Alex';

  handleContinue() {
    this.emitEvent('continue', { learnerName: this.learnerName });
  }

  render() {
    return html\`
      <article>
        <open-cells-type-text
          text="${'${'}this.t('learningCard.title', { name: this.learnerName })}"
        ></open-cells-type-text>
        <p>${'${'}this.t('learningCard.description')}</p>
        <open-cells-button-default
          text="${'${'}this.t('learningCard.continue')}"
          @click=${'${'}this.handleContinue}
        ></open-cells-button-default>
      </article>
    \`;
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
    'src/components/OpenCellsTypeText.js': file('src/components/OpenCellsTypeText.js', `
import { LitElement, html } from 'lit';

export class OpenCellsTypeText extends LitElement {
  static properties = { text: { type: String } };
  constructor() { super(); this.text = ''; }
  render() { return html\`<span part="text">\${this.text}</span>\`; }
}
`, 'javascript'),
    'src/components/OpenCellsButtonDefault.js': file('src/components/OpenCellsButtonDefault.js', `
import { LitElement, css, html } from 'lit';

export class OpenCellsButtonDefault extends LitElement {
  static properties = { text: { type: String }, disabled: { type: Boolean, reflect: true } };
  static styles = css\`button { font: inherit; padding: .7rem 1rem; border: 2px solid #111827; background: #ffe600; cursor: pointer; }\`;
  constructor() { super(); this.text = ''; this.disabled = false; }
  render() { return html\`<button type="button" ?disabled=\${this.disabled}>\${this.text}</button>\`; }
}
`, 'javascript'),
    'src/locales/en.js': file('src/locales/en.js', `
export default {
  'learningCard.title': 'Welcome, \${name}',
  'learningCard.description': 'You are learning to build a real Cells component.',
  'learningCard.continue': 'Continue',
};
`, 'javascript'),
    'src/locales/es.js': file('src/locales/es.js', `
export default {
  'learningCard.title': 'Bienvenido, \${name}',
  'learningCard.description': 'Estás aprendiendo a construir un componente Cells real.',
  'learningCard.continue': 'Continuar',
};
`, 'javascript'),
    'locales/locales.json': file('locales/locales.json', `${JSON.stringify({
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
    }, null, 2)}\n`, 'json'),
    'demo/locales/locales.json': file('demo/locales/locales.json', `${JSON.stringify({
      en: { 'learningCard.continue': 'Continue' },
      es: { 'learningCard.continue': 'Continuar' },
    }, null, 2)}\n`, 'json'),
    'test/unit/locales/locales.json': file('test/unit/locales/locales.json', `${JSON.stringify({
      en: { 'learningCard.continue': 'Continue' },
      es: { 'learningCard.continue': 'Continuar' },
    }, null, 2)}\n`, 'json'),
    'demo/index.html': file('demo/index.html', `
<!doctype html>
<html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body>
    <${tagName} learner-name="Ada"></${tagName}>
    <script type="module" src="../${tagName}.js"></script>
  </body>
</html>
`, 'html'),
    'index.html': file('index.html', `
<!doctype html>
<html lang="es"><body><script type="module" src="./demo/index.html"></script></body></html>
`, 'html'),
    [`test/unit/${tagName}.test.js`]: file(`test/unit/${tagName}.test.js`, `
import { OpenCellsButtonDefault } from '../../src/components/OpenCellsButtonDefault.js';
import { OpenCellsTypeText } from '../../src/components/OpenCellsTypeText.js';
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
    expect(${className}.scopedElements['open-cells-type-text']).toBe(OpenCellsTypeText);
    expect(${className}.scopedElements['open-cells-button-default']).toBe(OpenCellsButtonDefault);
    expect(customElements.get('open-cells-type-text')).toBeUndefined();
    expect(customElements.get('open-cells-button-default')).toBeUndefined();
  });

  it('renderiza ambos idiomas con valores diferentes', async () => {
    const context = { learnerName: 'Ada', t: globalThis.IntlMsg.t.bind(globalThis.IntlMsg) };
    expect(${className}.prototype.render.call(context).values.join(' ')).toContain('Bienvenido, Ada');
    globalThis.IntlMsg.lang = 'en';
    expect(${className}.prototype.render.call(context).values.join(' ')).toContain('Welcome, Ada');
  });

  it('emite el evento público completo', async () => {
    const element = document.createElement('${tagName}');
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

`, 'typescript'),
  };

  const snapshot: WorkspaceSnapshot = { files, activeFilePath: sourcePath };
  return createVersionedCellsWorkspace(snapshot);
}

export function createCellsPracticeWorkspace(): VersionedCellsWorkspace {
  const complete = createCellsComponentWorkspace({ name: 'academy-learning-card' });
  const path = 'src/academy-learning-card.js';
  const starter = complete.snapshot.files[path].content
    .replace("      'open-cells-button-default': OpenCellsButtonDefault,", '      // TODO: registra aquí el botón scoped que ya está importado.')
    .replace("    this.emitEvent('continue', { learnerName: this.learnerName });", '    // TODO: comunica la acción pública con el nombre de quien aprende.');
  const changed = writeCellsFile(complete, path, starter);
  return createVersionedCellsWorkspace(changed.snapshot, 0);
}
