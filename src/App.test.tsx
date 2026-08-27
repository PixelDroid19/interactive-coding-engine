// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { loadAppNavigationState, loadUserProgress } from './engine/persistence';
import { FUNDAMENTOS_COURSE } from './curriculum/fundamentos/course';
import { AI_ENGINEER_COURSE } from './curriculum/ai-engineer/course';
import { OPEN_CELLS_COURSE } from './curriculum/open-cells/course';

describe('App navigation persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('inicia toda la experiencia en modo oscuro', () => {
    render(<App />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('registra el curso completo de AI Engineer y abre su primera clase', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: `Ver recorrido: ${AI_ENGINEER_COURSE.title}` })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Ver recorrido: ${AI_ENGINEER_COURSE.title}` }));
    expect(screen.getByRole('heading', { name: AI_ENGINEER_COURSE.title })).toBeTruthy();
    expect(screen.getByText(/39 lecciones/)).toBeTruthy();

    const first = AI_ENGINEER_COURSE.modules[0].items.find((item) => item.type === 'scrim')!;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${first.title}`) }));
    expect(screen.getByRole('heading', { name: first.title })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Lenguaje del ejercicio' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Python' })).toBeTruthy();
    expect(screen.getByText('Clase visual guiada')).toBeTruthy();
  });

  it('mantiene Open Cells como un curso independiente con su propio recorrido', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: `Ver recorrido: ${OPEN_CELLS_COURSE.title}` })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Ver recorrido: ${OPEN_CELLS_COURSE.title}` }));
    expect(screen.getByRole('heading', { name: OPEN_CELLS_COURSE.title })).toBeTruthy();
    const practiceCount = OPEN_CELLS_COURSE.modules.reduce(
      (sum, module) => sum + module.items.filter((item) => item.type === 'reasoning' || item.type === 'debugging' || (item.type === 'reading' && Boolean(item.handsOnLab))).length,
      0,
    );
    expect(screen.getByText(new RegExp(`68 lecciones · ${practiceCount} prácticas`))).toBeTruthy();
    expect(screen.getByRole('button', { name: /^6\. Crear tu primer componente Cells/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^46\. onPageLeave y cleanup/ })).toBeTruthy();
  });

  it('aplica los recortes augmented-ui solo mientras el tema Cyber está activo', async () => {
    render(<App />);

    const icon = document.querySelector('.course-card__icon');
    expect(icon?.hasAttribute('data-augmented-ui')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a tema cyberpunk' }));
    await vi.waitFor(() => expect(icon?.getAttribute('data-augmented-ui')).toContain('hud-icon'));

    const detachedCyberBorder = document.createElement('div');
    detachedCyberBorder.setAttribute('data-augmented-ui', 'hud-orphan border');
    detachedCyberBorder.setAttribute('data-augmented-ui-reset', '');
    document.body.append(detachedCyberBorder);

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a tema por defecto' }));
    await vi.waitFor(() => expect(icon?.hasAttribute('data-augmented-ui')).toBe(false));
    expect(detachedCyberBorder.hasAttribute('data-augmented-ui')).toBe(false);
    expect(detachedCyberBorder.hasAttribute('data-augmented-ui-reset')).toBe(false);
  });

  it('abre un curso desde el inicio del roadmap aunque el catálogo estuviera desplazado', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: `Ver recorrido: ${AI_ENGINEER_COURSE.title}` }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
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

  it('mantiene una lección intermedia y permite recorrer clase, lectura, depuración y módulo siguiente', async () => {
    const lesson02 = FUNDAMENTOS_COURSE.modules[0].items.find((item) => item.id === 'fundamentos-03')!;
    const reading02 = FUNDAMENTOS_COURSE.modules[0].items.find((item) => item.id === 'fundamentos-03-lectura')!;
    const reasoning02 = FUNDAMENTOS_COURSE.modules[0].items.find((item) => item.id === 'fundamentos-03-reasoning')!;
    const debug02 = FUNDAMENTOS_COURSE.modules[0].items.find((item) => item.id === 'fundamentos-03-debug')!;
    const lesson03 = FUNDAMENTOS_COURSE.modules[1].items.find((item) => item.id === 'fundamentos-04')!;
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: `Ver recorrido: ${FUNDAMENTOS_COURSE.title}` }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${lesson02.title}`) }));
    expect(screen.getByRole('heading', { name: lesson02.title })).toBeTruthy();
    expect(loadAppNavigationState()).toMatchObject({
      view: 'scrim',
      moduleId: FUNDAMENTOS_COURSE.modules[0].id,
      itemId: lesson02.id,
    });

    firstRender.unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: lesson02.title })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    const readingHeading = screen.getByRole('heading', { name: reading02.title });
    expect(readingHeading).toBeTruthy();
    expect(document.activeElement).toBe(readingHeading);
    const readingContent = screen.getByRole('main', { name: 'Contenido de la lectura' });
    expect(readingContent.className).toContain('overflow-y-auto');
    expect(readingContent.className).toContain('select-text');
    expect(loadAppNavigationState()).toMatchObject({ view: 'reading', itemId: reading02.id });

    fireEvent.click(screen.getByRole('button', { name: 'Ir a la práctica' }));
    expect(screen.getByRole('heading', { name: reasoning02.title })).toBeTruthy();
    expect(loadAppNavigationState()).toMatchObject({ view: 'reasoning', itemId: reasoning02.id });
    fireEvent.input(screen.getByRole('textbox', { name: 'let intentos = 0, intentos' }), { target: { value: '0' } });
    fireEvent.input(screen.getByRole('textbox', { name: 'intentos = 1, intentos' }), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi razonamiento' }));
    expect(screen.getByRole('heading', { name: 'Resuelto' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(screen.getByText(debug02.title)).toBeTruthy();
    expect(loadAppNavigationState()).toMatchObject({ view: 'debugging', itemId: debug02.id });
    expect(loadUserProgress().completedItemIds).toContain(reading02.id);

    cleanup();
    render(<App />);
    expect(screen.getByText(debug02.title)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByRole('heading', { name: reasoning02.title })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Anterior' })[0]);
    expect(screen.getByRole('heading', { name: reading02.title })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ir a la práctica' }));
    fireEvent.input(screen.getByRole('textbox', { name: 'let intentos = 0, intentos' }), { target: { value: '0' } });
    fireEvent.input(screen.getByRole('textbox', { name: 'intentos = 1, intentos' }), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi razonamiento' }));
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading', { name: lesson03.title })).toBeTruthy();
    expect(loadAppNavigationState()).toMatchObject({
      view: 'scrim',
      moduleId: FUNDAMENTOS_COURSE.modules[1].id,
      itemId: lesson03.id,
    });
  });

  it('al salir del estudio conserva el roadmap después de recargar', () => {
    localStorage.setItem('aula_app_navigation_v1', JSON.stringify({ view: 'studio' }));
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Salir del estudio' }));
    expect(loadAppNavigationState()).toEqual({ view: 'home', courseId: FUNDAMENTOS_COURSE.id });

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
