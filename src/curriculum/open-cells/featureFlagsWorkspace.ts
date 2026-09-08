import { writeCellsFile, type VersionedCellsWorkspace } from '../../engine/cells/cellsVirtualFileSystem';

const messages = {
  es: {
    'flags.kicker': 'Laboratorio / Capacidades',
    'flags.title': 'Una decisión. Dos formas de explorar.',
    'flags.help': 'Activa la vista compacta y compara las tarjetas. Cambia de página y vuelve: la decisión pertenece a la aplicación, no a cada tarjeta.',
    'flags.toggle': 'Vista compacta',
    'flags.enabled': 'Activada',
    'flags.disabled': 'Desactivada',
    'flags.scope': 'Se conserva durante esta sesión. Al recargar vuelve al valor inicial.'
  },
  en: {
    'flags.kicker': 'Lab / Capabilities',
    'flags.title': 'One decision. Two ways to explore.',
    'flags.help': 'Enable compact view and compare the cards. Visit another page and return: the decision belongs to the application, not to each card.',
    'flags.toggle': 'Compact view',
    'flags.enabled': 'Enabled',
    'flags.disabled': 'Disabled',
    'flags.scope': 'Kept for this session. Reloading restores the initial value.'
  }
};

const panel = `
        <section class="flags-lab" aria-labelledby="flags-title">
          <span class="flags-kicker">\${this.t('flags.kicker')}</span>
          <h2 id="flags-title">\${this.t('flags.title')}</h2>
          <p>\${this.t('flags.help')}</p>
          <div class="flags-control">
            <label><input type="checkbox" .checked=\${this.flags.compactCatalog} @change=\${this.changeCompactView}>\${this.t('flags.toggle')}</label>
            <output role="status">\${this.t(this.flags.compactCatalog ? 'flags.enabled' : 'flags.disabled')}</output>
          </div>
          <p class="flags-scope">\${this.t('flags.scope')}</p>
        </section>`;

const styles = `
.flags-lab { margin-bottom: 28px; padding: 28px; border: 2px solid #242520; background: #fffdf7; box-shadow: 4px 4px 0 #242520; }
.flags-kicker { display: inline-block; padding: 5px 9px; background: #ffe600; font: 700 11px/1.5 monospace; text-transform: uppercase; letter-spacing: .08em; }
.flags-lab h2 { margin: 18px 0 12px; font-size: clamp(24px, 3vw, 32px); }
.flags-lab p { max-width: 74ch; color: #62635b; font-size: 14px; }
.flags-control { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; margin: 22px 0 12px; }
.flags-control label { display: flex; align-items: center; gap: 12px; min-height: 44px; margin: 0; cursor: pointer; }
.flags-control input { width: 24px; min-height: 24px; height: 24px; margin: 0; accent-color: #242520; }
.flags-control output { border: 1px solid #242520; padding: 5px 12px; background: #f5f2eb; font-size: 12px; font-weight: 700; }
.flags-lab .flags-scope { font-size: 12px; }
@media (max-width: 500px) { .flags-lab { padding: 22px 18px; } }
`;

/** Connects app-owned capability resolution to a presentational card variant. */
export function connectFeatureFlagsWorkspace(base: VersionedCellsWorkspace): VersionedCellsWorkspace {
  let workspace = base;
  const put = (path: string, content: string) => { workspace = writeCellsFile(workspace, path, content); };
  put('app/config/feature-state.js', `import { resolveFeatureFlags } from './feature-flags.js';

let flags = Object.freeze(resolveFeatureFlags());
export function getFeatureFlags() { return flags; }
export function setFeatureFlags(input) {
  flags = Object.freeze(resolveFeatureFlags(input));
  return flags;
}
`);
  put('test/unit/feature-flags.test.js', `import { describe, expect, it } from 'vitest';
import { getFeatureFlags, setFeatureFlags } from '../../app/config/feature-state.js';

describe('application feature state', () => {
  it('accepts explicit booleans without exposing mutable configuration', () => {
    try {
      setFeatureFlags({ compactCatalog: true });
      expect(getFeatureFlags().compactCatalog).toBe(true);
      expect(() => { getFeatureFlags().compactCatalog = false; }).toThrow(TypeError);
      for (const value of [null, {}, { compactCatalog: 'true' }, { compactCatalog: 1 }, { compactCatalog: false }]) {
        setFeatureFlags(value);
        expect(getFeatureFlags()).toEqual({ compactCatalog: false });
      }
    } finally { setFeatureFlags({ compactCatalog: false }); }
  });
});
`);
  put('docs/feature-flags.md', `# Una capacidad controlada por la aplicación

La configuración se resuelve en [feature-flags.js](../app/config/feature-flags.js). Solo acepta valores booleanos; una entrada ausente o inválida deja la vista compacta desactivada.

[feature-state.js](../app/config/feature-state.js) conserva una configuración inmutable durante la sesión. La página de inicio lee esa decisión y pasa una propiedad compact a cada tarjeta. La tarjeta no conoce el nombre del flag ni decide cuándo activarlo.

## Comprueba el recorrido

1. Activa Vista compacta: desaparece la ilustración, pero permanecen ambos proyectos y sus acciones.
2. Abre un proyecto y vuelve. La decisión sigue activa aunque la página se haya creado de nuevo.
3. Desactívala: vuelven las ilustraciones. Cambia de idioma y repite.
4. Recarga la aplicación: se recupera el valor inicial del resolvedor. No hay almacenamiento persistente ni servicio remoto.
5. Tras exportar, ejecuta cells app:test y cells app:build -c prod.js. La prueba de estado no sustituye el recorrido visual.

Este ejemplo es una política de la aplicación, no una API de feature flags del framework. No uses una capacidad visual como control de autorización.
`);
  const home = 'app/pages/academy-home-page/academy-home-page';
  put(`${home}.js`, `import { getFeatureFlags, setFeatureFlags } from '../../config/feature-state.js';\n` + workspace.snapshot.files[`${home}.js`].content
    .replace('products: { state: true },', 'products: { state: true },\n      flags: { state: true },')
    .replace("this.lastSelection = '';", "this.lastSelection = '';\n    this.flags = getFeatureFlags();")
    .replace('  onPageEnter() {', '  changeCompactView(event) {\n    this.flags = setFeatureFlags({ compactCatalog: event.target.checked });\n  }\n\n  onPageEnter() {\n    this.flags = getFeatureFlags();')
    .replace('        </header>', `        </header>\n${panel}`)
    .replace('<academy-product-card .product=', '<academy-product-card .compact=${this.flags.compactCatalog} .product='));
  const card = 'app/components/academy-product-card/academy-product-card';
  put(`${card}.js`, workspace.snapshot.files[`${card}.js`].content
    .replace('product: { type: Object, attribute: false },', 'product: { type: Object, attribute: false },\n      compact: { type: Boolean, reflect: true },')
    .replace('constructor() { super();', 'constructor() { super(); this.compact = false;'));
  for (const [path, extra] of [[home, styles], [card, '\n:host([compact]) .project-art { display: none; }\n:host([compact]) .project-body { padding: 16px 20px; gap: 8px; }\n:host([compact]) h2 { font-size: 21px; }\n']]) {
    const scss = workspace.snapshot.files[`${path}.scss`].content + extra;
    put(`${path}.scss`, scss);
    put(`${path}.css.js`, `import { css } from 'lit';\nexport default css\`\n${scss}\n\`;\n`);
  }
  const localePath = 'app/locales-app/locales.json';
  const catalogs = JSON.parse(workspace.snapshot.files[localePath].content);
  for (const lang of ['es', 'en'] as const) Object.assign(catalogs[lang], messages[lang]);
  put(localePath, JSON.stringify(catalogs, null, 2));
  const messagesPath = 'app/scripts/app-messages.js';
  const source = workspace.snapshot.files[messagesPath].content;
  const match = source.match(/Object\.freeze\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('No se encontró el catálogo de la aplicación.');
  const merged = JSON.parse(match[1]);
  for (const lang of ['es', 'en'] as const) Object.assign(merged[lang], messages[lang]);
  put(messagesPath, source.replace(match[0], `Object.freeze(${JSON.stringify(merged, null, 2)});`));
  return workspace;
}
