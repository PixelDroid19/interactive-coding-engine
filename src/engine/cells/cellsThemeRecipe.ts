import type { AdvancedComponentRecipe } from './cellsAdvancedComponentRecipes';

const themeTokens = ['background', 'foreground', 'muted', 'border', 'accent', 'action-background', 'action-foreground', 'focus'];

export function themePreviewRecipe(): AdvancedComponentRecipe {
  return {
    devDependencies: { '@vitest/browser': '3.2.7', playwright: '1.63.0' },
    files: {
      'vite.config.js': `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/unit/**/*.test.js'],
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium', launch: { executablePath: process.env.CELLS_BROWSER_EXECUTABLE || undefined } }],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/academy-theme-preview.js'],
      thresholds: {
        'src/academy-theme-preview.js': { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
`,
    },
    properties: `      state: { type: String, attribute: 'state' },
      disabled: { type: Boolean, attribute: 'disabled' },`,
    initialize: `    this.state = 'success';
    this.disabled = false;`,
    methods: `  updated(changed) {
    if (changed.has('theme')) this.setAttribute('data-theme', this.theme === 'oscuro' ? 'oscuro' : 'claro');
  }`,
    markup: `<section class="theme-stage">
          <p>\${this.t('theme.preview.description')}</p>
          <output>\${this.theme}</output>
          <academy-state-panel .state=\${this.state}>
            <p>\${this.t('theme.preview.result')}</p>
          </academy-state-panel>
          <academy-action-button .label=\${this.t('theme.preview.action')} .disabled=\${this.disabled}
            @academy-action-button-activate=\${this.handleAction}></academy-action-button>
        </section>`,
    styles: `
:host {
  --_theme-background: #ffffff;
  --_theme-foreground: #172033;
  --_theme-muted: #f1f5f9;
  --_theme-border: #64748b;
  --_theme-accent: #1d4ed8;
  --_theme-action-background: #1d4ed8;
  --_theme-action-foreground: #ffffff;
  --_theme-focus: #1d4ed8;
  --academy-surface: var(--theme-preview-background, var(--_theme-background));
  --academy-foreground: var(--theme-preview-foreground, var(--_theme-foreground));
  --academy-muted-surface: var(--theme-preview-muted, var(--_theme-muted));
  --academy-border: var(--theme-preview-border, var(--_theme-border));
  --academy-accent: var(--theme-preview-accent, var(--_theme-accent));
  --academy-action-background: var(--theme-preview-action-background, var(--_theme-action-background));
  --academy-action-foreground: var(--theme-preview-action-foreground, var(--_theme-action-foreground));
  --academy-focus: var(--theme-preview-focus, var(--_theme-focus));
}
:host([data-theme="oscuro"]) {
  --_theme-background: #111827;
  --_theme-foreground: #f9fafb;
  --_theme-muted: #1f2937;
  --_theme-border: #94a3b8;
  --_theme-accent: #facc15;
  --_theme-action-background: #facc15;
  --_theme-action-foreground: #111827;
  --_theme-focus: #facc15;
}
.theme-stage { display: grid; gap: 1rem; min-width: 0; }
.theme-stage output { font-weight: 700; }
.theme-stage academy-state-panel { width: 100%; }
`,
    locales: {
      es: { 'theme.preview.result': 'El contenido y los controles comparten el ambiente visual.' },
      en: { 'theme.preview.result': 'Content and controls share the visual environment.' },
    },
    members: [
      { kind: 'field', name: 'state', attribute: 'state', type: { text: "'loading' | 'empty' | 'error' | 'success'" }, default: '"success"', description: 'Estado visible del panel compartido, independiente del tema.' },
      { kind: 'field', name: 'disabled', attribute: 'disabled', type: { text: 'boolean' }, default: 'false', description: 'Deshabilita la acción principal sin bloquear la selección del tema.' },
    ],
    cssProperties: themeTokens.filter((token) => token !== 'accent').map((token) => ({ name: `--theme-preview-${token}`, description: 'Decisión visual del consumidor; prevalece sobre la paleta del tema.' })),
    demoControls: `<fieldset>
      <legend>Ambiente y estados</legend>
      <label>Tema <select id="theme-choice"><option value="claro">Claro</option><option value="oscuro">Oscuro</option></select></label>
      <label>Estado <select id="theme-state"><option value="success">Resultado</option><option value="loading">Cargando</option><option value="empty">Vacío</option><option value="error">Error</option></select></label>
      <label><input id="theme-disabled" type="checkbox">Deshabilitar acción</label>
    </fieldset>`,
    demoSetup: `const themeChoice = document.querySelector('#theme-choice');
if (themeChoice) themeChoice.value = subject.theme;
themeChoice?.addEventListener('change', (event) => { subject.theme = event.target.value; });
document.querySelector('#theme-state')?.addEventListener('change', (event) => { subject.state = event.target.value; });
document.querySelector('#theme-disabled')?.addEventListener('change', (event) => { subject.disabled = event.target.checked; });`,
    tests: `
  it('propaga los tokens sin reemplazar la instancia compartida', async () => {
    const component = await renderComponent();
    const state = component.shadowRoot.querySelector('academy-state-panel');
    component.theme = 'claro';
    await component.updateComplete;
    await state.updateComplete;
    const light = getComputedStyle(state.shadowRoot.querySelector('.surface')).backgroundColor;
    component.theme = 'oscuro';
    component.state = 'error';
    await component.updateComplete;
    await state.updateComplete;
    expect(component.shadowRoot.querySelector('academy-state-panel')).toBe(state);
    expect(getComputedStyle(state.shadowRoot.querySelector('.surface')).backgroundColor).not.toBe(light);
    expect(state.shadowRoot.querySelector('[data-state]').getAttribute('data-state')).toBe('error');
    component.style.setProperty('--theme-preview-background', '#fff1f2');
    expect(getComputedStyle(state.shadowRoot.querySelector('.surface')).backgroundColor).toBe('rgb(255, 241, 242)');
  });
`,
    readme: '\n## Tema y tokens\n\n`theme` acepta `claro` u `oscuro`; otros valores conservan la entrada pública y usan la paleta clara. La estructura y las instancias compartidas no se reemplazan al cambiar de tema. La paleta solo define tokens; el panel de estados, el indicador y los botones consumen variables heredables `--academy-*`. Los tokens `--theme-preview-*` permiten al consumidor sustituir decisiones concretas. Las paletas incluidas mantienen contraste de texto y foco; al personalizarlas, el consumidor debe volver a verificarlo. `state` permite recorrer carga, vacío, error y resultado sin cambiar el tema. `disabled` bloquea la acción principal. El evento `change` conserva el tema actual como intención pública, sin modificar preferencias globales.\n'
      + '\n## Pruebas en navegador\n\nEste paquete ejecuta `cells component:test --coverage` en Chromium mediante Vitest Browser Mode: los colores calculados y la herencia de variables CSS requieren un navegador real. Después de instalar las dependencias, prepara Chromium con `npx playwright install chromium`, o define `CELLS_BROWSER_EXECUTABLE` con la ruta absoluta de una instalación disponible. La CLI no descarga navegadores automáticamente. La configuración conserva las comprobaciones de estilos y el umbral de cobertura del 100 %.\n',
  };
}
