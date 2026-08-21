// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ConceptSlideInset } from './ConceptSlideInset';

describe('ConceptSlideInset', () => {
  afterEach(cleanup);

  it('se abre y se cierra con nombres accesibles en español', () => {
    render(<ConceptSlideInset lessonTitle="Variables" concepts={['variable']} />);

    const open = screen.getByRole('button', { name: 'Abrir conceptos' });
    expect(open.getAttribute('title')).toBe('Abrir conceptos y notas');
    fireEvent.click(open);

    const close = screen.getByRole('button', { name: 'Cerrar conceptos' });
    fireEvent.click(close);

    expect(screen.getByRole('button', { name: 'Abrir conceptos' })).toBeTruthy();
  });
});
