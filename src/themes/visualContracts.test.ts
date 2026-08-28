import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const indexCss = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const hudCss = readFileSync(new URL('./hud.css', import.meta.url), 'utf8');
const hudAugmentedCss = readFileSync(new URL('./hud-augmented.css', import.meta.url), 'utf8');

describe('contratos visuales de superficies principales', () => {
  it('reserva una fila independiente para la navegación del Centro de aprendizaje', () => {
    expect(indexCss).toMatch(
      /\.learning-center\s*\{[^}]*grid-template-rows:\s*auto auto auto minmax\(0,\s*1fr\)/s,
    );
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
    expect(hudCss).toMatch(selector);
    expect(hudAugmentedCss).toMatch(selector);
  });

  it('deja que augmented-ui dibuje una sola silueta clara para iconos y categorías', () => {
    expect(hudAugmentedCss).toMatch(
      /\[data-augmented-ui~="hud-icon"\][^}]*--aug-inlay-bg:\s*#0a0a10/s,
    );
    expect(hudAugmentedCss).toMatch(
      /\[data-augmented-ui~="hud-category"\][^}]*--aug-border-bg:\s*var\(--card-accent/s,
    );
    expect(hudCss).toMatch(
      /\.course-card__icon\s*\{[^}]*background:\s*transparent\s*!important/s,
    );
  });

  it('mantiene la acción de la ayuda local compacta y dentro del campo', () => {
    expect(indexCss).toMatch(/\.socratic-tutor__composer\s*\{[^}]*position:\s*relative/s);
    expect(indexCss).toMatch(/\.socratic-tutor__composer button\s*\{[^}]*position:\s*absolute[^}]*width:\s*2\.5rem/s);
    expect(indexCss).toMatch(/\.socratic-tutor__composer textarea\s*\{[^}]*padding-right:\s*3\.5rem/s);
  });
});
