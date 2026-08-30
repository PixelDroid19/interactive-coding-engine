// @vitest-environment happy-dom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FloatingBrowser } from './FloatingBrowser';
import { file, workspaceOf } from '../../engine/lessonCompiler';
import { createCellsPracticeWorkspace } from '../../engine/cells/cellsRecipes';

const workspace = workspaceOf('index.html', {
  'index.html': file('index.html', '<h1>Hola</h1>'),
});
const cellsWorkspace = createCellsPracticeWorkspace('styles').snapshot;

describe('FloatingBrowser', () => {
  afterEach(cleanup);

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
    expect(markup).toContain('aria-label="Ampliar vista previa"');
  });

  it('título Vista previa visible', () => {
    const markup = renderToStaticMarkup(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    expect(markup).toContain('Vista previa');
  });

  it('solo acepta mensajes de la vista previa que controla', async () => {
    const { container } = render(<FloatingBrowser workspace={workspace} isFloating autoReload={false} onToggleFloating={() => {}} />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const foreign = new MessageEvent('message', {
      data: { __preview_source: 'preview-sandbox', type: 'error', message: 'mensaje forjado' },
      source: window,
    });

    window.dispatchEvent(foreign);
    expect(screen.queryByText('mensaje forjado')).toBeNull();

    const own = new MessageEvent('message', {
      data: { __preview_source: 'preview-sandbox', type: 'error', message: 'error del preview' },
      source: iframe.contentWindow,
    });
    window.dispatchEvent(own);

    expect(await screen.findByText('error del preview')).toBeTruthy();
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

    await waitFor(() => expect(browserWindow.style.height).toBe('184px'));
    expect(browserWindow.style.top).toBe('96px');
  });

  it('muestra también el componente en teléfonos con altura suficiente', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });

    render(
      <FloatingBrowser
        workspace={cellsWorkspace}
        isFloating
        previewRuntime="cells"
        onToggleFloating={() => {}}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /Barra de vista previa/ });
    const browserWindow = toolbar.parentElement as HTMLElement;

    await waitFor(() => expect(browserWindow.style.height).toBe('430px'));
  });
});

describe('FloatingBrowser para una demo Cells', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  afterEach(cleanup);

  it('reserva un ancho cómodo para los controles de la demo sin cubrir todo el editor', async () => {
    render(
      <FloatingBrowser
        workspace={cellsWorkspace}
        isFloating
        previewRuntime="cells"
        onToggleFloating={() => {}}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: /Barra de vista previa/ });
    const browserWindow = toolbar.parentElement as HTMLElement;

    await waitFor(() => expect(Number.parseInt(browserWindow.style.width, 10)).toBeGreaterThanOrEqual(480));
    expect(Number.parseInt(browserWindow.style.width, 10)).toBeLessThanOrEqual(560);
  });

  it('ocupa toda la altura del preview sin dejar un bloque blanco bajo la consola', async () => {
    render(
      <FloatingBrowser
        workspace={cellsWorkspace}
        isFloating
        previewRuntime="cells"
        onToggleFloating={() => {}}
      />,
    );

    const preview = await screen.findByTestId('cells-preview-workbench');
    const viewport = preview.parentElement as HTMLElement;
    expect(viewport.classList.contains('browser-viewport--cells')).toBe(true);
    expect(preview.classList.contains('cells-studio')).toBe(true);
    expect(preview.style.position).toBe('absolute');
    expect(preview.style.inset).toBe('0');
    expect(preview.style.width).toBe('auto');
    expect(preview.style.height).toBe('auto');
  });

  it('abre el workbench completo desde la vista flotante compacta', async () => {
    render(
      <FloatingBrowser
        workspace={cellsWorkspace}
        isFloating
        previewRuntime="cells"
        onToggleFloating={() => {}}
      />,
    );

    expect(screen.queryByLabelText('Panel de propiedades')).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir herramientas de desarrollo' }));

    await waitFor(() => expect(screen.getByLabelText('Panel de propiedades')).toBeTruthy());
    expect(screen.getByLabelText('Inspector de eventos')).toBeTruthy();
  });
});
