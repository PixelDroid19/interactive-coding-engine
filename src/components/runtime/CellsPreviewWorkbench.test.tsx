// @vitest-environment happy-dom
import React, { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CellsPreviewWorkbench } from './CellsPreviewWorkbench';

const demo = {
  tagName: 'academy-learning-card',
  packageName: '@open-cells-learning/academy-learning-card',
  source: 'export class AcademyLearningCard {}',
  cases: [
    { id: 'basic', label: 'Básico', properties: { learnerName: 'Ada' } },
    { id: 'alternate', label: 'Nombre alternativo', properties: { learnerName: 'Lina' } },
  ],
  contract: [{ term: 'Evento', description: 'academy-learning-card-continue' }],
};

describe('CellsPreviewWorkbench', () => {
  afterEach(() => cleanup());

  it('mantiene los controles fuera del iframe y comunica caso e idioma', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main>componente</main>" demo={demo} iframeRef={iframeRef} />);
    const postMessage = vi.fn();
    Object.defineProperty(iframeRef.current, 'contentWindow', { configurable: true, value: { postMessage } });

    fireEvent.change(screen.getByLabelText('Caso de demostración'), { target: { value: 'alternate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Inglés' }));
    fireEvent.load(screen.getByTitle('Vista previa del componente Cells'));

    expect(screen.getByText('Demostración de academy-learning-card')).toBeTruthy();
    expect(iframeRef.current?.getAttribute('srcdoc')).toBe('<main>componente</main>');
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'demo:set-case', caseId: 'alternate' }), '*');
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'locale:set', locale: 'en' }), '*');
  });

  it('ofrece código, documentación, viewport y eventos públicos', () => {
    const iframeRef = createRef<HTMLIFrameElement>();
    render(<CellsPreviewWorkbench html="<main />" demo={demo} iframeRef={iframeRef} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Código' }));
    expect(screen.getByText('export class AcademyLearningCard {}')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Documentación' }));
    expect(screen.getByText('academy-learning-card-continue')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Visual' }));
    fireEvent.click(screen.getByRole('button', { name: 'Móvil' }));
    expect(screen.getByTitle('Vista previa del componente Cells').parentElement?.getAttribute('style')).toContain('width: 375px');

    const message = new MessageEvent('message', {
      data: { source: 'open-cells-preview', type: 'component:event', name: 'academy-learning-card-continue', detail: { learnerName: 'Ada' } },
    });
    Object.defineProperty(message, 'source', { value: iframeRef.current?.contentWindow ?? null });
    fireEvent(window, message);
    expect(screen.getByText('{"learnerName":"Ada"}')).toBeTruthy();
  });
});
