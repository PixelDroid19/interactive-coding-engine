// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { compile } from 'sass';
import { ThemeProvider } from '../../themes/ThemeProvider';
import { PostSolveStudio } from './PostSolveStudio';

let css: string;
beforeAll(() => {
  css = compile('src/styles/main.scss').css;
});
afterEach(() => {
  cleanup();
  document.head.querySelector('[data-contrast-test]')?.remove();
  document.documentElement.className = '';
  delete document.documentElement.dataset.theme;
  localStorage.removeItem('theme');
});

function luminance(color: string): number {
  const channels = /^#[0-9a-f]{6}$/i.test(color)
    ? [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16))
    : color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unresolved color: ${color}`);
  const linear = channels.map(value => value / 255 <= .04045 ? value / 255 / 12.92 : ((value / 255 + .055) / 1.055) ** 2.4);
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

describe.each(['normal', 'cyber'])('contraste de reflexión: %s', theme => {
  it('mantiene legible continuar sin escribir sobre el panel real', () => {
    localStorage.setItem('theme', theme);
    const style = document.createElement('style');
    style.dataset.contrastTest = '';
    style.textContent = css;
    document.head.append(style);
    render(<ThemeProvider><div className="challenge-drawer"><PostSolveStudio itemId="contrast" title="Sumar" kind="challenge" onComplete={() => {}} /></div></ThemeProvider>);
    const button = screen.getByRole('button', { name: 'Continuar sin escribir' });
    const panel = screen.getByRole('region', { name: 'Reflexiona sobre tu solución' });
    const buttonStyle = getComputedStyle(button);
    const panelStyle = getComputedStyle(panel);
    // Cyber paints its opaque surfaces through augmented-ui's inlay.
    const background = theme === 'cyber'
      ? buttonStyle.getPropertyValue('--aug-inlay-bg').trim()
      : panelStyle.backgroundColor;
    expect(contrast(buttonStyle.color, background)).toBeGreaterThanOrEqual(4.5);
  });
  it('mantiene legible la acción deshabilitada sin desvanecer su texto', () => {
    localStorage.setItem('theme', theme);
    const style = document.createElement('style');
    style.dataset.contrastTest = '';
    style.textContent = css;
    document.head.append(style);
    render(<ThemeProvider><div className="challenge-drawer"><PostSolveStudio itemId="contrast" title="Sumar" kind="challenge" onComplete={() => {}} /></div></ThemeProvider>);
    const button = screen.getByRole('button', { name: 'Continuar' });
    const styles = getComputedStyle(button);
    const background = theme === 'cyber' ? styles.getPropertyValue('--aug-inlay-bg').trim() : styles.backgroundColor;
    expect(contrast(styles.color, background)).toBeGreaterThanOrEqual(4.5);
    expect(styles.opacity).toBe('1');
  });
});
