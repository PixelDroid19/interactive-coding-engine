import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Sistema actual: 100% SCSS modular — sin legacy CSS.
// Los antiguos src/index.css / hud.css fueron eliminados.
function readScssAggregate(): string {
  const root = new URL('../styles', import.meta.url);
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith('.scss')) files.push(full);
    }
  }
  try { walk(new URL(root).pathname); } catch { return ''; }
  return files.map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
}
const scssAggregate = readScssAggregate();
const mainScss = (() => {
  try { return readFileSync(new URL('../styles/main.scss', import.meta.url), 'utf8'); } catch { return ''; }
})();

describe('contratos visuales de superficies principales', () => {
  it('reserva una fila independiente para la navegación del Centro de aprendizaje', () => {
    expect(scssAggregate).toMatch(
      /\.learning-center\s*\{[^}]*grid-template-rows:\s*auto auto auto minmax\(0,\s*1fr\)/s,
    );
    expect(existsSync(new URL('../index.css', import.meta.url))).toBe(false);
    expect(existsSync(new URL('./hud.css', import.meta.url))).toBe(false);
  });

  it.each([
    ['green', '#00ff66'],
    ['yellow', '#ffe600'],
    ['red', '#ff0055'],
  ])('mantiene un solo color de borde en las tarjetas %s', (variant, color) => {
    const selector = new RegExp(
      `course-card--${variant}[^}]*--aug-border-bg:\\s*${color.replace('#', '\\#')}`,
      's',
    );
    expect(scssAggregate).toMatch(selector);
  });

  it('deja que augmented-ui dibuje una sola silueta clara para iconos y categorías', () => {
    expect(scssAggregate).toMatch(
      /\[data-augmented-ui~="hud-icon"\][^}]*--aug-inlay-bg:\s*#0a0a10/s,
    );
    expect(scssAggregate).toMatch(
      /\[data-augmented-ui~="hud-category"\][^}]*--aug-border-bg:\s*var\(--card-accent/s,
    );
    expect(scssAggregate).toMatch(
      /\.course-card__icon\s*\{[^}]*background:\s*transparent\s*!important/s,
    );
  });

  it('mantiene la acción de la ayuda local compacta y dentro del campo', () => {
    expect(scssAggregate).toMatch(/\.socratic-tutor__composer\s*\{[^}]*position:\s*relative/s);
    expect(scssAggregate).toMatch(/\.socratic-tutor__composer button\s*\{[^}]*position:\s*absolute[^}]*width:\s*2\.5rem/s);
    expect(scssAggregate).toMatch(/\.socratic-tutor__composer textarea\s*\{[^}]*padding-right:\s*3\.5rem/s);
  });

  it('no deja ningún CSS legacy monolítico', () => {
    expect(existsSync(new URL('../index.css', import.meta.url))).toBe(false);
    expect(existsSync(new URL('./hud.css', import.meta.url))).toBe(false);
    expect(existsSync(new URL('./hud-augmented.css', import.meta.url))).toBe(false);
    expect(scssAggregate.length).toBeGreaterThan(150000);
  });
});

describe('arquitectura SCSS modular y sistema de temas', () => {
  it('expone un entry SCSS principal que importa tokens, layout y temas cyber (sin @import deprecated)', () => {
    // Tailwind ahora vive en tailwind.css separado (moderno)
    const tailwindCss = (() => {
      try { return readFileSync(new URL('../styles/tailwind.css', import.meta.url), 'utf8'); } catch { return ''; }
    })();
    expect(tailwindCss).toMatch(/@import\s+"tailwindcss"/);
    expect(mainScss).not.toMatch(/@import\s+"tailwindcss"/);
    expect(mainScss).toMatch(/@use\s+"base\/tokens"/);
    expect(mainScss).toMatch(/@use\s+"themes\/cyber\/tokens"/);
    expect(mainScss).toMatch(/@use\s+"themes\/cyber-augmented\/core"/);
    const uses = (mainScss.match(/@use/g) || []).length;
    expect(uses).toBeGreaterThan(15);
    expect(mainScss).not.toMatch(/@import\s+"base\//);
  });

  it('centraliza los tokens cyber en abstracts/_themes.scss y los emite vía mixin', () => {
    const themesScss = (() => {
      try { return readFileSync(new URL('../styles/abstracts/_themes.scss', import.meta.url), 'utf8'); } catch { return ''; }
    })();
    expect(themesScss).toMatch(/\$themes:\s*\(/);
    expect(themesScss).toMatch(/@mixin emit-cyber-tokens/);
    const cyberTokens = (() => {
      try { return readFileSync(new URL('../styles/themes/cyber/_tokens.scss', import.meta.url), 'utf8'); } catch { return ''; }
    })();
    expect(cyberTokens).toMatch(/@include theme\.emit-cyber-tokens/);
    expect(cyberTokens).toMatch(/\[data-theme="cyber"\]/);
  });

  it('mantiene soporte legacy .hud y .cyber además de [data-theme="cyber"]', () => {
    const cyberTokens = (() => {
      try { return readFileSync(new URL('../styles/themes/cyber/_tokens.scss', import.meta.url), 'utf8'); } catch { return ''; }
    })();
    expect(cyberTokens).toMatch(/\.hud/);
    expect(cyberTokens).toMatch(/\.cyber/);
    expect(scssAggregate).toMatch(/\.hud/);
  });

  it('divide el monolito index.css (8483 líneas) en parciales SCSS mantenibles', () => {
    const expected = [
      '../styles/base/_tokens.scss',
      '../styles/base/_reset.scss',
      '../styles/cells/_lab.scss',
      '../styles/cells/_studio.scss',
      '../styles/layout/_app-shell.scss',
      '../styles/components/_socratic-tutor.scss',
      '../styles/components/_reasoning.scss',
      '../styles/themes/_dark.scss',
      '../styles/themes/cyber/_catalog.scss',
      '../styles/themes/cyber/_roadmap.scss',
    ];
    for (const p of expected) {
      expect(existsSync(new URL(p, import.meta.url))).toBe(true);
    }
    expect(scssAggregate.length).toBeGreaterThan(100000);
  });
});
