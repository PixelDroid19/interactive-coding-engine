// @vitest-environment happy-dom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FloatingBrowser } from './FloatingBrowser';
import { file, workspaceOf } from '../../engine/lessonCompiler';

const workspace = workspaceOf('index.html', {
  'index.html': file('index.html', '<h1>Hola</h1>'),
});

describe('FloatingBrowser', () => {
  it('badge traducido refleja estado real', () => {
    const markupLive = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload onToggleFloating={() => {}} />);
    expect(markupLive).toContain('En vivo');
    expect(markupLive).not.toContain('>live<');

    const markupExec = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    expect(markupExec).toContain('Ejecutado');
  });

  it('botones Atrás/Adelante deshabilitados semánticamente', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('Navegación no disponible');
    expect(markup).toContain('disabled');
  });

  it('URL no es input editable, es texto', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('/index.html');
    expect(markup).not.toContain('browser-url-input');
    expect(markup).toContain('browser-url-text');
  });

  it('botones de icono tienen aria-label en español', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('aria-label="Recargar vista previa"');
    expect(markup).toContain('aria-label="Ejecutar código"');
    expect(markup).toContain('aria-label="Minimizar vista previa"');
  });

  it('título Vista previa visible', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('Vista previa');
  });
});

describe('FloatingBrowser en viewport móvil', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 640 });
  });

  afterEach(cleanup);

  it('cabe completo dentro del ancho visible', async () => {
    render(
      <FloatingBrowser
        workspace={workspace}
        isFloating
        onToggleFloating={() => {}}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /Barra de vista previa/ });
    const browserWindow = toolbar.parentElement as HTMLElement;

    await waitFor(() => expect(browserWindow.style.width).toBe('304px'));
    expect(browserWindow.style.left).toBe('8px');
  });

  it('no permite mover la ventana fuera del borde derecho', async () => {
    render(
      <FloatingBrowser
        workspace={workspace}
        isFloating
        onToggleFloating={() => {}}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /Barra de vista previa/ });
    const browserWindow = toolbar.parentElement as HTMLElement;
    await waitFor(() => expect(browserWindow.style.width).toBe('304px'));

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });

    expect(browserWindow.style.left).toBe('8px');
  });

  it('adapta la altura cuando el viewport es bajo', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 400 });

    render(
      <FloatingBrowser
        workspace={workspace}
        isFloating
        onToggleFloating={() => {}}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /Barra de vista previa/ });
    const browserWindow = toolbar.parentElement as HTMLElement;

    await waitFor(() => expect(browserWindow.style.height).toBe('348px'));
    expect(browserWindow.style.top).toBe('44px');
  });
});
