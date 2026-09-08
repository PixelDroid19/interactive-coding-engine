export interface AdvancedComponentRecipe {
  markup: string;
  imports?: string;
  properties?: string;
  initialize?: string;
  methods?: string;
  styles?: string;
  locales?: Record<'en' | 'es', Record<string, string>>;
  files?: Record<string, string>;
  demoImports?: string;
  demoControls?: string;
  demoSetup?: string;
  demoControlChanged?: string;
  tests?: string;
  readme?: string;
  members?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
  dependencies?: Record<string, string>;
}

export function advancedComponentRecipe(id: string): AdvancedComponentRecipe | undefined {
  if (id === 'context-panel') return {
    imports: `import { ContextConsumer } from '@lit/context';
import { densityContext } from './context/density-context.js';`,
    initialize: `    this._densityContext = new ContextConsumer(this, {
      context: densityContext,
      subscribe: true,
      callback: (value) => { this.density = value; },
    });`,
    markup: `<section class="state-grid" data-density=\${this.density}>
          <academy-status-badge .status=\${this.density}></academy-status-badge>
          <academy-action-button .label=\${this.t('context.panel.action')} @academy-action-button-activate=\${this.handleAction}></academy-action-button>
        </section>`,
    styles: '\n.state-grid[data-density="compacta"] { gap: .25rem; padding: .25rem; }\n',
    dependencies: { '@lit/context': '1.1.6' },
    files: {
      'src/context/density-context.js': `import { createContext } from '@lit/context';

/** @type {import('@lit/context').Context<symbol, string>} */
export const densityContext = createContext(Symbol('academy-density'));
`,
      'src/context/academy-density-provider.js': `import { LitElement, html } from 'lit';
import { ContextProvider } from '@lit/context';
import { densityContext } from './density-context.js';

export class AcademyDensityProvider extends LitElement {
  static get properties() { return { density: { type: String } }; }

  constructor() {
    super();
    this.density = 'cómoda';
    this._context = new ContextProvider(this, { context: densityContext, initialValue: this.density });
  }

  updated(changed) {
    if (changed.has('density')) this._context.setValue(this.density);
  }

  render() { return html\`<slot></slot>\`; }
}
`,
      'types/lit-context.d.ts': `declare module '@lit/context' {
  export type Context<Key, Value> = Key & { __context__: Value };
  export type ContextType<C> = C extends Context<unknown, infer Value> ? Value : never;
  export function createContext<Value, Key = unknown>(key: Key): Context<Key, Value>;
  export class ContextConsumer<C extends Context<unknown, unknown>> {
    constructor(host: HTMLElement, options: { context: C; subscribe?: boolean; callback?: (value: ContextType<C>, dispose?: () => void) => void });
    value?: ContextType<C>;
    hostConnected(): void;
    hostDisconnected(): void;
  }
  export class ContextProvider<C extends Context<unknown, unknown>> {
    constructor(host: HTMLElement, options: { context: C; initialValue?: ContextType<C> });
    setValue(value: ContextType<C>, force?: boolean): void;
    hostConnected(): void;
  }
}
`,
    },
    demoImports: `import { AcademyDensityProvider } from '../src/context/academy-density-provider.js';`,
    demoControlChanged: 'densityProvider.density = event.target.value;',
    demoSetup: `if (!customElements.get('academy-density-provider')) customElements.define('academy-density-provider', AcademyDensityProvider);
const densityProvider = document.createElement('academy-density-provider');
densityProvider.density = control?.value || 'cómoda';
const peer = document.createElement('academy-context-panel');
subject.replaceWith(densityProvider);
densityProvider.append(subject, peer);`,
    tests: `
  it('propaga el contexto, aísla proveedores y libera la suscripción', async () => {
    const { AcademyDensityProvider } = await import('../../src/context/academy-density-provider.js');
    if (!customElements.get('academy-density-provider')) customElements.define('academy-density-provider', AcademyDensityProvider);
    const provider = new AcademyDensityProvider();
    const other = new AcademyDensityProvider();
    const first = document.createElement('academy-context-panel');
    const second = document.createElement('academy-context-panel');
    provider.append(first, second);
    document.body.append(provider, other);
    provider.density = 'compacta';
    await provider.updateComplete;
    await Promise.all([first.updateComplete, second.updateComplete]);
    expect(first.density).toBe('compacta');
    expect(second.density).toBe('compacta');
    other.append(second);
    await other.updateComplete;
    await second.updateComplete;
    expect(second.density).toBe('cómoda');
    expect(first.density).toBe('compacta');
    second.remove();
    other.density = 'compacta';
    await other.updateComplete;
    expect(second.density).toBe('cómoda');
    other.append(second);
    await second.updateComplete;
    expect(second.density).toBe('compacta');
  });
`,
    readme: '\n## Contexto por subárbol\n\nEl proveedor de la demo usa `ContextProvider` y los paneles usan `ContextConsumer` de `@lit/context`. Ambos importan la misma clave desde `src/context/density-context.js`. Cambia la densidad del proveedor para actualizar los dos consumidores; otro proveedor mantiene su propio valor. La suscripción se libera al desconectar el consumidor y se solicita de nuevo al reconectar. Sin proveedor, `density` conserva su valor público de respaldo. No se usa estado global.\n',
  };
  if (id !== 'lifecycle-panel') return undefined;
  return {
    properties: `      online: { state: true },
      observedChanges: { state: true },`,
    initialize: `    this.online = navigator.onLine;
    this.observedChanges = 0;
    this._onOnline = () => this.observeConnection(true);
    this._onOffline = () => this.observeConnection(false);`,
    methods: `  connectedCallback() {
    super.connectedCallback();
    this.online = navigator.onLine;
    window.addEventListener('online', this._onOnline);
    window.addEventListener('offline', this._onOffline);
  }

  disconnectedCallback() {
    window.removeEventListener('online', this._onOnline);
    window.removeEventListener('offline', this._onOffline);
    super.disconnectedCallback();
  }

  observeConnection(online) {
    this.online = online;
    this.observedChanges += 1;
  }`,
    markup: `<section class="state-grid">
          <strong>\${this.connectionState}</strong>
          <academy-status-badge .status=\${this.t(this.online ? 'lifecycle.panel.online' : 'lifecycle.panel.offline')}></academy-status-badge>
          <output data-observation-count=\${this.observedChanges} aria-live="polite">\${this.t('lifecycle.panel.observed', { count: this.observedChanges })}</output>
          <academy-action-button .label=\${this.t('lifecycle.panel.action')} @academy-action-button-activate=\${this.handleAction}></academy-action-button>
        </section>`,
    locales: {
      es: {
        'lifecycle.panel.online': 'Con conexión',
        'lifecycle.panel.offline': 'Sin conexión',
        'lifecycle.panel.observed': 'Cambios observados: ${count}',
      },
      en: {
        'lifecycle.panel.online': 'Online',
        'lifecycle.panel.offline': 'Offline',
        'lifecycle.panel.observed': 'Observed changes: ${count}',
      },
    },
    demoControls: `<div aria-label="Simulación del ciclo de vida">
      <button id="simulate-online" type="button">Simular conexión</button>
      <button id="simulate-offline" type="button">Simular desconexión</button>
      <button id="reconnect-host" type="button">Desmontar y volver a montar</button>
    </div>`,
    demoSetup: `document.querySelector('#simulate-online')?.addEventListener('click', () => window.dispatchEvent(new Event('online')));
document.querySelector('#simulate-offline')?.addEventListener('click', () => window.dispatchEvent(new Event('offline')));
document.querySelector('#reconnect-host')?.addEventListener('click', () => {
  const position = document.createComment('Posición del componente');
  subject.replaceWith(position);
  position.replaceWith(subject);
});`,
    tests: `
  it('libera la observación al desconectar y no la duplica al reconectar', async () => {
    const component = await renderComponent();
    const count = () => component.shadowRoot.querySelector('output').getAttribute('data-observation-count');
    expect(count()).toBe('0');
    window.dispatchEvent(new Event('offline'));
    await component.updateComplete;
    expect(count()).toBe('1');
    component.remove();
    window.dispatchEvent(new Event('online'));
    await component.updateComplete;
    expect(count()).toBe('1');
    document.body.append(component);
    await component.updateComplete;
    window.dispatchEvent(new Event('online'));
    await component.updateComplete;
    expect(count()).toBe('2');
  });
`,
    readme: '\n## Observación y cleanup\n\nEl panel observa los eventos `online` y `offline` mientras está conectado. El contador registra notificaciones, no renders ni reconexiones. Los callbacks se crean una vez y se retiran al desconectar. `connectionState` conserva la etiqueta pública del consumidor; `online` y `observedChanges` son estado interno. La demo permite simular señales y desmontar el host sin afirmar que cambió la conectividad real del equipo.\n',
  };
}
