// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { LiveHelpContext } from '../../live-help/protocol';
import { PlaygroundView } from './PlaygroundView';

const cellsLab = vi.hoisted(() => ({
  props: null as null | { variant?: string; liveHelpContext?: LiveHelpContext },
}));

vi.mock('../runtime/CellsLearningLab', () => ({
  CellsLearningLab: (props: { variant?: string; liveHelpContext?: LiveHelpContext }) => {
    cellsLab.props = props;
    return <div data-testid="cells-runtime">Runtime Cells {props.variant}</div>;
  },
}));

describe('PlaygroundView', () => {
  beforeEach(() => {
    localStorage.clear();
    cellsLab.props = null;
  });

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

  it('permite recorrer las plantillas con el teclado sin perder el foco', () => {
    render(<PlaygroundView onBack={() => {}} />);

    const selector = screen.getByRole('group', { name: 'Plantilla inicial' });
    const htmlTemplate = within(selector).getByRole('button', { name: 'HTML, CSS y JavaScript' });
    const jsTemplate = within(selector).getByRole('button', { name: 'JavaScript puro' });
    htmlTemplate.focus();

    fireEvent.keyDown(htmlTemplate, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(jsTemplate);

    fireEvent.keyDown(jsTemplate, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(htmlTemplate);
  });

  it('permite recorrer los archivos abiertos con el teclado', () => {
    render(<PlaygroundView onBack={() => {}} />);

    const tabs = screen.getByRole('group', { name: 'Archivos abiertos' });
    const htmlFile = within(tabs).getByRole('button', { name: 'index.html' });
    const cssFile = within(tabs).getByRole('button', { name: 'style.css' });
    htmlFile.focus();

    fireEvent.keyDown(htmlFile, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cssFile);
  });

  it('abre proyectos Cells reales como plantillas independientes de Lit', () => {
    render(<PlaygroundView onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Componente Cells' }));

    expect(screen.getByTestId('cells-runtime').textContent).toContain('component');
    expect(screen.getByText('Proyecto Cells independiente')).toBeTruthy();
    expect(screen.queryByTitle('Vista previa')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicación Cells' }));
    expect(screen.getByTestId('cells-runtime').textContent).toContain('application');
  });

  it('aísla la sesión de ayuda por cada plantilla Cells', () => {
    const context: LiveHelpContext = { courseSlug: 'open-cells', lessonKey: 'playground', surface: 'editor' };
    render(<PlaygroundView onBack={() => {}} liveHelpContext={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Componente Cells' }));
    expect(cellsLab.props?.liveHelpContext).toEqual({ ...context, lessonKey: 'playground:cells-component' });

    fireEvent.click(screen.getByRole('button', { name: 'Aplicación Cells' }));
    expect(cellsLab.props?.liveHelpContext).toEqual({ ...context, lessonKey: 'playground:cells-application' });
  });

  it('permite ocultar y volver a mostrar el explorador de archivos', () => {
    render(<PlaygroundView onBack={() => {}} />);

    const hideFiles = screen.getByRole('button', { name: 'Ocultar archivos' });
    expect(hideFiles.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(hideFiles);

    const showFiles = screen.getByRole('button', { name: 'Mostrar archivos' });
    expect(showFiles.getAttribute('aria-expanded')).toBe('false');
  });

  it('renombra archivos sin perder su contenido ni la selección activa', () => {
    render(<PlaygroundView onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir app.js' }));
    fireEvent.click(screen.getByRole('button', { name: 'Renombrar app.js' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nuevo nombre para app.js' }), { target: { value: 'main.js' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));

    expect(screen.queryByRole('button', { name: 'Abrir app.js' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir main.js' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('textbox').textContent).toContain('Lógica interactiva en JavaScript');
  });

  it('restaura la plantilla y el estado del explorador después de recargar', () => {
    const firstRender = render(<PlaygroundView onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'JavaScript puro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar archivos' }));
    firstRender.unmount();

    render(<PlaygroundView onBack={() => {}} />);

    expect(screen.getByRole('button', { name: 'JavaScript puro' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Mostrar archivos' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('compila en la vista previa el workspace persistido completo', async () => {
    localStorage.setItem('aula_playground_draft_v1', JSON.stringify({
      templateId: 'vanilla-js',
      showFileTree: true,
      workspace: {
        activeFilePath: 'app.js',
        files: {
          'index.html': {
            name: 'index.html',
            path: 'index.html',
            language: 'html',
            content: '<!doctype html><html lang="es"><head><link rel="stylesheet" href="style.css"></head><body><h1 id="resultado">Integración</h1><script src="app.js"></script></body></html>',
          },
          'style.css': {
            name: 'style.css',
            path: 'style.css',
            language: 'css',
            content: '#resultado { color: tomato; }',
          },
          'app.js': {
            name: 'app.js',
            path: 'app.js',
            language: 'javascript',
            content: 'document.querySelector("#resultado").dataset.estado = "ejecutado";',
          },
        },
      },
    }));

    render(<PlaygroundView onBack={() => {}} />);
    const preview = screen.getByTitle('Vista previa') as HTMLIFrameElement;

    await waitFor(() => expect(preview.srcdoc).toContain('Integración'));
    expect(preview.srcdoc).toContain('#resultado { color: tomato; }');
    expect(preview.srcdoc).toContain('dataset.estado = "ejecutado"');
    expect(preview.srcdoc).not.toContain('href="style.css"');
    expect(preview.srcdoc).not.toContain('src="app.js"');
  });
});
