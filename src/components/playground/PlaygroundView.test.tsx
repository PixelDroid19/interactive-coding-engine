// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PlaygroundView } from './PlaygroundView';

describe('PlaygroundView', () => {
  afterEach(() => {
    cleanup();
  });

  it('presenta el Playground y sus acciones en español', () => {
    render(<PlaygroundView onBack={() => {}} />);

    expect(screen.getByText('Playground independiente')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reiniciar código' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'JavaScript puro' })).toBeTruthy();
    expect(screen.queryByText('Independent Playground')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });

  it('expone qué plantilla está seleccionada', () => {
    render(<PlaygroundView onBack={() => {}} />);

    const selector = screen.getByRole('group', { name: 'Plantilla inicial' });
    const htmlTemplate = within(selector).getByRole('button', { name: 'HTML, CSS y JavaScript' });
    const jsTemplate = within(selector).getByRole('button', { name: 'JavaScript puro' });

    expect(htmlTemplate.getAttribute('aria-pressed')).toBe('true');
    expect(jsTemplate.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(jsTemplate);

    expect(htmlTemplate.getAttribute('aria-pressed')).toBe('false');
    expect(jsTemplate.getAttribute('aria-pressed')).toBe('true');
  });

  it('permite ocultar y volver a mostrar el explorador de archivos', () => {
    render(<PlaygroundView onBack={() => {}} />);

    const hideFiles = screen.getByRole('button', { name: 'Ocultar archivos' });
    expect(hideFiles.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(hideFiles);

    const showFiles = screen.getByRole('button', { name: 'Mostrar archivos' });
    expect(showFiles.getAttribute('aria-expanded')).toBe('false');
  });
});
