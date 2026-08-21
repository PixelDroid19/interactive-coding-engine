// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { loadAppNavigationState } from './engine/persistence';

describe('App navigation persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('restaura el Playground después de recargar la aplicación', () => {
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Playground' }));
    expect(screen.getByText('Playground independiente')).toBeTruthy();
    expect(loadAppNavigationState()).toEqual({ view: 'playground' });

    firstRender.unmount();
    render(<App />);

    expect(screen.getByText('Playground independiente')).toBeTruthy();
  });

  it('al salir del estudio conserva el roadmap después de recargar', () => {
    localStorage.setItem('aula_app_navigation_v1', JSON.stringify({ view: 'studio' }));
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Salir del estudio' }));
    expect(loadAppNavigationState()).toEqual({ view: 'home' });

    firstRender.unmount();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Fundamentos de programación' })).toBeTruthy();
  });

  it('conserva en el roadmap una clase publicada después de recargar', async () => {
    localStorage.setItem('aula_app_navigation_v1', JSON.stringify({ view: 'studio' }));
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Usar plantilla HTML, CSS y JavaScript' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar micrófono' }));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar grabación' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Detener y revisar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Publicar lección en el curso' }));

    expect(await screen.findByRole('button', { name: /Nueva lección/ })).toBeTruthy();
    firstRender.unmount();
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /Nueva lección/ }));
    expect(await screen.findByRole('heading', { name: 'Nueva lección' })).toBeTruthy();

    cleanup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Nueva lección' })).toBeTruthy();
  });
});
