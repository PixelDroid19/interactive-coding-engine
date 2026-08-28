// @vitest-environment happy-dom
import React, { createRef } from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CellsPreviewWorkbench, type ComponentDemo } from './CellsPreviewWorkbench';

const cellsStudioCss = readFileSync('src/index.css', 'utf8');

const demo: ComponentDemo = {
  tagName: 'academy-learning-card',
  packageName: '@open-cells-learning/academy-learning-card',
  packageVersion: '0.1.0',
  locales: ['es', 'en'],
  source: `import { LitElement, html } from 'lit';
export class AcademyLearningCard extends LitElement {
  static properties = {
    learnerName: { type: String, attribute: 'learner-name' },
  };
  learnerName = 'Alex';
  render() { return html\`<h1>Card</h1>\`; }
}`,
  htmlSource: '<academy-learning-card></academy-learning-card>',
  cssSource: ':host { display: block; }',
  cases: [
    { id: 'basic', label: 'Por defecto', sourcePath: 'demo/basic.html', markup: '<academy-learning-card></academy-learning-card>', properties: {} },
    { id: 'alternate', label: 'Nombre alternativo', sourcePath: 'demo/alternate.html', markup: '<academy-learning-card learner-name="Lina"></academy-learning-card>', properties: { learnerName: 'Lina' } },
  ],
  contract: [
    { term: 'Elemento', description: '<academy-learning-card>' },
    { term: 'Evento', description: 'academy-learning-card-continue' },
  ],
  documentation: {
    description: 'Componente interactivo para tarjetas didácticas.',
    properties: [
      { name: 'learnerName', attribute: 'learner-name', type: 'string', default: "'Alex'", description: 'Nombre del usuario' },
      { name: 'disabled', attribute: 'disabled', type: 'boolean', default: 'false', description: 'Deshabilita el botón' },
    ],
    events: [
      { name: 'academy-learning-card-continue', detail: '{ learnerName: string }', bubbles: true, composed: true, description: 'Se emite al pulsar continuar' },
    ],
    slots: [
      { name: 'default', description: 'Contenido principal' },
    ],
    cssProperties: [
      { name: '--card-background', default: '#faf8ec', description: 'Fondo' },
    ],
    examples: [
      { title: 'Uso en HTML', code: '<academy-learning-card></academy-learning-card>' },
    ],
  },
};

describe('CellsPreviewWorkbench', () => {
  afterEach(() => cleanup());

  it('mantiene legibles las opciones del selector nativo sobre su menú emergente', () => {
    expect(cellsStudioCss).toMatch(
      /\.cells-studio__select-wrapper\s+select\s+option\s*\{[^}]*background(?:-color)?\s*:[^;]+;[^}]*color\s*:[^;]+;/s,
    );
  });

  it('renderiza la interfaz nativa de la plataforma sin browser chrome ni /index.html', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main>componente</main>" demo={demo} iframeRef={iframeRef} />);

    expect(screen.getByText('academy-learning-card')).toBeTruthy();
    expect(screen.getByText('v0.1.0')).toBeTruthy();
    expect(screen.getByLabelText('Caso de demostración')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Visual/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Código/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Documentación/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Inglés' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Español' })).toBeTruthy();

    // Verify absence of browser chrome and /index.html
    expect(screen.queryByText('/index.html')).toBeNull();
    expect(screen.queryByLabelText('Ruta actual')).toBeNull();
    expect(screen.queryByLabelText('Atrás (no disponible)')).toBeNull();
  });

  it('evita controles redundantes cuando el proyecto solo contiene una demo', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={{ ...demo, cases: [demo.cases[0]] }} iframeRef={iframeRef} />);

    expect(screen.queryByLabelText('Caso de demostración')).toBeNull();
  });

  it('remonta el runtime visual cuando cambia el documento compilado', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    const view = render(<CellsPreviewWorkbench html="<main>primera revisión</main>" demo={demo} iframeRef={iframeRef} />);
    const firstFrame = screen.getByTitle('Vista previa del componente Cells');

    view.rerender(<CellsPreviewWorkbench html="<main>segunda revisión</main>" demo={{ ...demo, source: `${demo.source}\n// segunda revisión` }} iframeRef={iframeRef} />);

    const secondFrame = screen.getByTitle('Vista previa del componente Cells');
    expect(secondFrame).not.toBe(firstFrame);
    expect(secondFrame).toHaveProperty('srcdoc', '<main>segunda revisión</main>');
  });

  it('retira errores de la compilación anterior cuando llega un preview nuevo', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    const view = render(<CellsPreviewWorkbench html="<main>incompleto</main>" demo={demo} iframeRef={iframeRef} />);
    const errorMessage = new MessageEvent('message', {
      data: { source: 'open-cells-preview', type: 'error', message: 'export temporal ausente' },
    });
    Object.defineProperty(errorMessage, 'source', { value: iframeRef.current?.contentWindow ?? null });
    fireEvent(window, errorMessage);
    expect(screen.getByRole('button', { name: 'Errores (1)' })).toBeTruthy();

    view.rerender(<CellsPreviewWorkbench html="<main>completo</main>" demo={demo} iframeRef={iframeRef} />);
    expect(screen.queryByRole('button', { name: 'Errores (1)' })).toBeNull();
  });

  it('mantiene la vista flotante compacta y abre las herramientas completas', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    const onRequestExpand = vi.fn();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} compact onRequestExpand={onRequestExpand} />);

    expect(screen.queryByLabelText('Panel de propiedades')).toBeNull();
    expect(screen.queryByLabelText('Inspector de eventos')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir herramientas de desarrollo' }));
    expect(onRequestExpand).toHaveBeenCalledTimes(1);
  });

  it('no inventa documentación cuando el proyecto no la declara', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={{ ...demo, documentation: undefined }} iframeRef={iframeRef} />);

    fireEvent.click(screen.getByRole('tab', { name: /Documentación/ }));

    expect(screen.getByText('Este proyecto todavía no documenta su API pública.')).toBeTruthy();
    expect(screen.queryByText('Nombre de la persona que aprende.')).toBeNull();
  });

  it('no agrega mensajes de éxito ficticios cuando el iframe informa que está listo', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);
    const ready = new MessageEvent('message', { data: { source: 'open-cells-preview', type: 'ready' } });
    Object.defineProperty(ready, 'source', { value: iframeRef.current?.contentWindow ?? null });

    fireEvent(window, ready);
    fireEvent.click(screen.getByRole('button', { name: 'Consola' }));

    expect(screen.queryByText(/componente listo y montado/i)).toBeNull();
  });

  it('permite cambiar entre demos o casos y notifica al iframe vía postMessage', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main>componente</main>" demo={demo} iframeRef={iframeRef} />);
    const postMessage = vi.fn();
    Object.defineProperty(iframeRef.current, 'contentWindow', { configurable: true, value: { postMessage } });

    // Select alternate case (has properties { learnerName: 'Lina' })
    fireEvent.change(screen.getByLabelText('Caso de demostración'), { target: { value: 'alternate' } });
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'demo:set-case',
        caseId: 'alternate',
      }),
      '*',
    );
  });

  it('envía al iframe únicamente mensajes serializables cuando termina de cargar', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main>componente</main>" demo={demo} iframeRef={iframeRef} />);
    const postMessage = vi.fn();
    Object.defineProperty(iframeRef.current, 'contentWindow', { configurable: true, value: { postMessage } });

    fireEvent.load(screen.getByTitle('Vista previa del componente Cells'));

    expect(postMessage).toHaveBeenCalled();
    for (const [message] of postMessage.mock.calls) {
      expect(() => structuredClone(message)).not.toThrow();
    }
  });

  it('permite cambiar de idioma sin recargar la página', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main>componente</main>" demo={demo} iframeRef={iframeRef} />);
    const postMessage = vi.fn();
    Object.defineProperty(iframeRef.current, 'contentWindow', { configurable: true, value: { postMessage } });

    const btnEnglish = screen.getByRole('button', { name: 'Inglés' });
    const btnSpanish = screen.getByRole('button', { name: 'Español' });

    fireEvent.click(btnEnglish);
    expect(btnEnglish.getAttribute('aria-pressed')).toBe('true');
    expect(btnSpanish.getAttribute('aria-pressed')).toBe('false');
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'locale:set', locale: 'en' }),
      '*',
    );

    fireEvent.click(btnSpanish);
    expect(btnSpanish.getAttribute('aria-pressed')).toBe('true');
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'locale:set', locale: 'es' }),
      '*',
    );
  });

  it('permite interactuar con los controles en vivo del panel PROPS y sincronizar', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);
    const postMessage = vi.fn();
    Object.defineProperty(iframeRef.current, 'contentWindow', { configurable: true, value: { postMessage } });

    const nameInput = screen.getByLabelText('learnerName');
    expect(nameInput).toBeTruthy();
    fireEvent.change(nameInput, { target: { value: 'Carlos' } });

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'demo:set-case',
        properties: expect.objectContaining({ learnerName: 'Carlos' }),
      }),
      '*',
    );
  });

  it('restaura las propiedades reales del componente al pulsar Reset', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);
    const postMessage = vi.fn();
    const frameWindow = { postMessage };
    Object.defineProperty(iframeRef.current, 'contentWindow', { configurable: true, value: frameWindow });

    const readyEvent = new MessageEvent('message', {
      data: {
        source: 'open-cells-preview',
        type: 'ready',
        initialProps: { learnerName: 'NombreDesdeElCódigo' },
      },
    });
    Object.defineProperty(readyEvent, 'source', { value: frameWindow });
    fireEvent(window, readyEvent);

    const nameInput = screen.getByLabelText('learnerName');
    expect(nameInput).toHaveProperty('value', 'NombreDesdeElCódigo');
    fireEvent.change(nameInput, { target: { value: 'Carlos' } });
    expect(nameInput).toHaveProperty('value', 'Carlos');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(nameInput).toHaveProperty('value', 'NombreDesdeElCódigo');
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'demo:set-case',
        properties: expect.objectContaining({ learnerName: 'NombreDesdeElCódigo' }),
      }),
      '*',
    );
  });

  it('permite alternar entre las pestañas Visual, Código y Documentación', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);

    // Tab Código
    fireEvent.click(screen.getByRole('tab', { name: /Código/ }));
    expect(screen.getByText(/export class AcademyLearningCard/)).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'HTML' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'CSS / SCSS' })).toBeTruthy();

    // Tab Documentación
    fireEvent.click(screen.getByRole('tab', { name: /Documentación/ }));
    expect(screen.getByText('Propiedades y Atributos')).toBeTruthy();
    expect(screen.getByText('learnerName')).toBeTruthy();
    expect(screen.getAllByText('academy-learning-card-continue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('--card-background')).toBeTruthy();

    // Tab Visual
    fireEvent.click(screen.getByRole('tab', { name: /Visual/ }));
    expect(screen.getByLabelText('Panel de propiedades')).toBeTruthy();
  });

  it('aplica presets responsive modificando únicamente el viewport del componente', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Preset de dispositivo' }), {
      target: { value: '768' },
    });
    expect(screen.getByLabelText('Ancho personalizado')).toHaveProperty('value', '768');
    expect(screen.getByLabelText('Alto personalizado')).toHaveProperty('value', '900');

    fireEvent.change(screen.getByRole('combobox', { name: 'Preset de dispositivo' }), {
      target: { value: '1024' },
    });
    expect(screen.getByLabelText('Ancho personalizado')).toHaveProperty('value', '1024');
    expect(screen.getByLabelText('Alto personalizado')).toHaveProperty('value', '720');
  });

  it('aplica dimensiones personalizadas mientras se escriben, sin un paso adicional', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);

    const anchoInput = screen.getByLabelText('Ancho personalizado');
    const altoInput = screen.getByLabelText('Alto personalizado');

    fireEvent.change(anchoInput, { target: { value: '500' } });
    fireEvent.change(altoInput, { target: { value: '400' } });
    expect(anchoInput).toHaveProperty('value', '500');
    expect(altoInput).toHaveProperty('value', '400');
    const device = screen.getByTitle('Vista previa del componente Cells').parentElement as HTMLElement;
    expect(device.style.width).toBe('500px');
    expect(device.style.height).toBe('400px');
  });

  it('captura múltiples CustomEvents consecutivos con orden y payload en el inspector', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);

    const makeEvent = (name: string, detail: unknown) => {
      const msg = new MessageEvent('message', {
        data: {
          source: 'open-cells-preview',
          type: 'component:event',
          name,
          detail,
          bubbles: true,
          composed: true,
          timestamp: Date.now(),
        },
      });
      Object.defineProperty(msg, 'source', { value: iframeRef.current?.contentWindow ?? null });
      return msg;
    };

    fireEvent(window, makeEvent('academy-learning-card-continue', { learnerName: 'Ada' }));
    fireEvent(window, makeEvent('academy-learning-card-continue', { learnerName: 'Lina' }));

    expect(screen.getByText('01')).toBeTruthy();
    expect(screen.getByText('02')).toBeTruthy();
    expect(screen.getAllByText('academy-learning-card-continue').length).toBeGreaterThanOrEqual(2);
  });

  it('captura console logs y errores del runtime en el panel de consola', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);

    const consoleMsg = new MessageEvent('message', {
      data: { source: 'open-cells-preview', type: 'console', level: 'warn', args: ['custom warning'], timestamp: Date.now() },
    });
    Object.defineProperty(consoleMsg, 'source', { value: iframeRef.current?.contentWindow ?? null });
    fireEvent(window, consoleMsg);

    const errorMsg = new MessageEvent('message', {
      data: { source: 'open-cells-preview', type: 'error', message: 'test runtime error' },
    });
    Object.defineProperty(errorMsg, 'source', { value: iframeRef.current?.contentWindow ?? null });
    fireEvent(window, errorMsg);

    // Open console drawer
    fireEvent.click(screen.getByRole('button', { name: 'Consola' }));
    expect(screen.getByText('custom warning')).toBeTruthy();

    // Switch to errors tab
    fireEvent.click(screen.getByRole('button', { name: /Errores/ }));
    expect(screen.getByText('test runtime error')).toBeTruthy();
  });
});
