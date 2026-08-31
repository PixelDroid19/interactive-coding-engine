// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiButton } from './UiButton';
import { UiField } from './UiField';
import { UiNav } from './UiNav';
import { UiSurface } from './UiSurface';
import { UiTabs } from './UiTabs';
import { buttonAugmentation, navItemAugmentation, surfaceAugmentation } from './uiAugmentation';

describe('primitivas visuales compartidas', () => {
  afterEach(cleanup);

  it('expone variantes semánticas sin estilos por pantalla', () => {
    render(<UiButton variant="primary">Guardar</UiButton>);
    expect(screen.getByRole('button', { name: 'Guardar' }).className).toContain('ui-button--primary');
  });

  it('conecta etiqueta, ayuda y error con el control', () => {
    render(<UiField label="Nota" hint="Una idea basta" error="No se pudo guardar"><textarea /></UiField>);
    const control = screen.getByRole('textbox', { name: 'Nota' });
    expect(control.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('No se pudo guardar');
  });

  it('navega las pestañas con teclado', () => {
    const onChange = vi.fn();
    render(<UiTabs ariaLabel="Secciones" activeId="review" onChange={onChange} tabs={[{ id: 'review', label: 'Repaso' }, { id: 'notes', label: 'Mis notas' }]} />);
    const review = screen.getByRole('tab', { name: 'Repaso' });
    fireEvent.keyDown(review, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Mis notas' }));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('notes');
  });

  it('mantiene la misma superficie semántica en cualquier tema', () => {
    const { container, rerender } = render(<UiSurface as="article" tone="accent">Contenido</UiSurface>);
    const normalSurface = container.querySelector('article');
    expect(normalSurface?.className).toContain('ui-surface--accent');

    document.documentElement.dataset.theme = 'cyber';
    rerender(<UiSurface as="article" tone="accent">Contenido</UiSurface>);
    expect(container.querySelector('article')?.className).toBe(normalSurface?.className);
    delete document.documentElement.dataset.theme;
  });

  it('expone navegación lateral accesible sin estilos propios de la pantalla', () => {
    const onChange = vi.fn();
    render(<UiNav ariaLabel="Secciones" activeId="summary" onChange={onChange} items={[
      { id: 'summary', label: 'Resumen' },
      { id: 'people', label: 'Personas', badge: 2 },
    ]} />);

    expect(screen.getByRole('button', { name: 'Resumen' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Personas 2' }));
    expect(onChange).toHaveBeenCalledWith('people');
  });

  it('activa la geometría HUD desde las primitivas y no desde cada pantalla', () => {
    expect(surfaceAugmentation('normal', 'metric')).toBeUndefined();
    expect(surfaceAugmentation('cyber', 'metric')).toContain('ui-surface-metric');
    expect(buttonAugmentation('cyber', 'icon')).toContain('ui-button-icon');
    expect(navItemAugmentation('cyber', true)).toContain('ui-nav-item-active');
  });
});
