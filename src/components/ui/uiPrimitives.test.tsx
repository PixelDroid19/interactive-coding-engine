// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiButton } from './UiButton';
import { UiField } from './UiField';
import { UiTabs } from './UiTabs';

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
});
