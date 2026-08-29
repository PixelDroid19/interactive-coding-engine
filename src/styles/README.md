# CodeSilk Styles — SCSS Modular

> Reemplaza `src/index.css` (8483 líneas) + `src/themes/hud.css` (2905) + `hud-augmented.css` (650) por una arquitectura SCSS mantenible sin perder ni un pixel — sobre todo en modo **Cyber**.

## Estructura

```
src/styles/
  main.scss                 # Entry — importa tailwind + todo en orden de cascada
  abstracts/
    _variables.scss         # SCSS vars: breakpoints, z-index, colores base
    _mixins.scss            # Mixins: respond(), cyber-glow(), theme-cyber, aug-panel()
    _themes.scss            # Mapa central $themes + @mixin emit-cyber-tokens + on-cyber
  base/
    _tokens.scss            # :root — CodeSilk light (papel cálido)
    _reset.scss             # *, body, tipografía, scrollbars
  cells/
    _shell.scss             # playground-cells-shell, lectura ancha
    _lab.scss               # cells-lab base, header, brief, workbench
    _studio.scss            # cells-studio header, tabs, viewport, canvas
    _extras.scss            # console, code-docs, tests, terminal, empty
    _workbench.scss         # workbench quiet (ambos temas)
  layout/
    _app-shell.scss         # .app-screen, .studio-card, start-gate
    _catalog.scss           # CourseCatalog
    _roadmap.scss           # RoadmapHome
    _responsive.scss        # Media queries players/workspaces
    _debug-layout.scss      # DebuggingView dominante
  components/
    _socratic-tutor.scss    # Ayuda local Socrático
    _code.scss              # Code terminals + syntax highlight
    _player.scss            # ScrimPlayer / RunJS output
    _sidebar.scss           # FileTree / rails
    _editor.scss            # Tabs + gutter
    _browser.scss           # FloatingBrowser preview
    _challenges.scss        # ChallengeDrawer
    _modals.scss            # Explanation, confirm, closures
    _console.scss           # Consola flotante
    _timeline.scss          # Timeline bottom bar
    _debug-legacy.scss      # Debug legacy
    _learning.scss          # Dark-first learning surfaces
    _reasoning.scss         # Piensa (tablas, decisiones)
    _cyber-toggle.scss      # Toggle cyber con glitch
    _learning-center.scss   # Centro de aprendizaje
  themes/
    _dark.scss              # Override .dark (CodeSilk oscuro)
    cyber/
      _tokens.scss          # :root, .hud, .cyber, [data-theme="cyber"] via emit-cyber-tokens
      _layout.scss          # Superficies compartidas + topbar
      _sidebar.scss         # File explorer cyber
      _editor.scss          # Editor cyber
      _browser.scss         # Preview browser
      _player.scss          # Timeline cyber
      _catalog.scss         # Catalog + course-card (neon, hover, sweep)
      _roadmap.scss         # Roadmap nodos, líneas, popovers
      _reading.scss         # Reading hero, conceptos, terminales
      _modals.scss          # Scrim banners, closures
      _responsive.scss      # Responsive HUD
    cyber-augmented/
      _core.scss            # Topbar, sidebar, editor, player augmented-ui
      _components.scss      # Botones, tabs, file, url, hud-* 
      _cards.scss           # hug-card + hero
      _reading.scss         # Reading augmented
      _modals.scss          # Scrim modals augmented
```

**Regla de oro:** `main.scss` respeta el orden de cascada original: `index.css → hud.css → hud-augmented.css`. Cambiar el orden rompe la especificidad `!important` del tema cyber.

## Sistema de temas mejorado

### Antes
- Dos archivos gigantes con selectores `.hud` duplicados por todo el CSS.
- Tokens `--hud-*` hardcodeados en `:root, .hud {}`.
- Añadir un tema requería buscar/reemplazar hex en 3 archivos.

### Ahora
- `abstracts/_variables.scss` y `abstracts/_themes.scss` son **fuente única**.
- Mapa SCSS `$themes` central:

```scss
$themes: (
  normal: ( bg-main: #0d0f15, ... ),
  cyber:  ( bg: #040406, yellow: #ffe600, cyan: #00f0ff, ... )
);
```

- Mixin `emit-cyber-tokens` genera `--hud-*` desde el mapa. Cambias el hex en un sitio y todo el HUD se actualiza.
- Selector unificado en `themes/cyber/_tokens.scss`:

```scss
:root, .hud, .cyber, [data-theme="cyber"] {
  @include emit-cyber-tokens;
}
```

Compatible con `ThemeProvider` que pone clases `hud`/`cyber` **y** `data-theme="cyber"` (migra sin romper URLs `?hud=1` o `?theme=cyber`).

- Helpers `@mixin on-cyber` / `on-normal` para scoping limpio sin repetir `.hud` en cada archivo.

**Añadir un tema nuevo (ej. `neon`):**
1. Añade entrada `neon: ( ... )` en `$themes`.
2. Crea `themes/neon/_tokens.scss` con `@include emit-neon-tokens`.
3. Importa en `main.scss`. Listo — sin tocar componentes.

## Modo Cyber — verificación

- No se tocó la especificidad: los overrides siguen siendo `.hud ... !important` y `[data-augmented-ui]`.
- Scanline, holo-sweep, glitch y `augmented-ui` siguen intactos.
- Tests `visualContracts.test.ts` validan:
  - `grid-template-rows` del Learning Center
  - `--aug-border-bg` único por variante `green/yellow/red`
  - Silueta `hud-icon` / `hud-category`
  - Comportamiento compacto del `socratic-tutor`
  - Existencia de `main.scss`, centralización de tokens y división del monolito.

## Uso

```tsx
// src/main.tsx
import 'augmented-ui/augmented-ui.min.css';
import './styles/main.scss'; // tailwind + tokens + cyber
```

```bash
npm run dev    # Vite + sass compila SCSS en caliente
npm run build  # 428kB CSS gzip 64kB — idéntico al monolito
npm test       # 757 tests, incluye contratos cyber
```

## Migración — sin legacy

- `src/index.css`, `src/themes/hud.css` y `hud-augmented.css` **fueron eliminados** (12038 líneas). La única fuente es `src/styles/`.
- `src/main.tsx` importa exclusivamente `src/styles/main.scss`.
- Tests migrados a leer el agregado SCSS; `visualContracts` verifica que no exista ningún `index.css` legacy.
- `AGENTS.md` → tokens ahora viven en `src/styles/base/_tokens.scss` y `abstracts/_variables.scss`.
- Tailwind sigue vía `@import "tailwindcss"` al inicio de `main.scss` (gestionado por `@tailwindcss/vite`).

## Convenciones SCSS

- Parciales con `_` y `@import`/`@use` (Dart Sass 1.103). Se mantiene `@import` para componentes para preservar orden de cascada; `abstracts` usan `@use`.
- No añadir `* { margin:0; padding:0 }`.
- Evitar hardcodear `#ffe600` / `#00f0ff`; usa `vars.$brand-yellow` o `theme-token(cyber, yellow)`.
- Para estilos cyber, prefiere `@include on-cyber { ... }` dentro del componente en vez de crear archivos separados.
