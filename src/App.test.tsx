// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { loadAppNavigationState } from './engine/persistence';
import { FUNDAMENTOS_COURSE } from './curriculum/fundamentos/course';

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

    expect(screen.queryByRole('heading', { name: '1. Tu primer programa' })).toBeNull();
    expect(screen.getByText('Cargando la clase guardada…')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Nueva lección' })).toBeTruthy();
  });

  it('explica que una grabación antigua perdió el audio en vez de abrirla en silencio', async () => {
    const customItem = {
      id: 'scrim-custom-legacy',
      title: 'Clase antigua',
      type: 'scrim' as const,
      estimatedMinutes: 1,
      scrimDataId: 'scrim-custom-legacy',
    };
    const savedCourse = {
      ...FUNDAMENTOS_COURSE,
      modules: FUNDAMENTOS_COURSE.modules.map((module, index) => index === 0
        ? { ...module, items: [...module.items, customItem] }
        : module),
    };
    localStorage.setItem('aula_custom_courses_v1', JSON.stringify([savedCourse]));
    localStorage.setItem('aula_custom_scrims_v1', JSON.stringify({
      'scrim-custom-legacy': {
        id: 'scrim-custom-legacy',
        title: 'Clase antigua',
        description: '',
        templateId: 'vanilla-js',
        durationMs: 1000,
        initialWorkspace: {
          activeFilePath: 'app.js',
          files: { 'app.js': { name: 'app.js', path: 'app.js', content: '', language: 'javascript' } },
        },
        events: [],
        snapshots: [],
        challenges: [],
        audioTrack: { audioBlob: {}, mimeType: 'audio/webm', durationMs: 1000 },
        createdAt: 1,
        updatedAt: 1,
      },
    }));
    localStorage.setItem('aula_app_navigation_v1', JSON.stringify({
      view: 'scrim',
      courseId: FUNDAMENTOS_COURSE.id,
      moduleId: FUNDAMENTOS_COURSE.modules[0].id,
      itemId: customItem.id,
      timestampMs: 0,
    }));

    render(<App />);

    expect((await screen.findByRole('alert')).textContent).toContain('no se puede recuperar');
    expect(screen.queryByRole('button', { name: 'Empezar la clase' })).toBeNull();
  });
});
