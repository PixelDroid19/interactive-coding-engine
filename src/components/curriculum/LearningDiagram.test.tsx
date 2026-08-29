// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../themes/ThemeProvider';
import { LearningDiagram } from './LearningDiagram';

const diagram = { src: '/diagrams/variable.html', alt: 'Variable y memoria', caption: 'Sigue la flecha.', readingQuestion: '¿Qué cambia?', aspectRatio: '16/9' as const };

describe('LearningDiagram', () => {
  afterEach(cleanup);
  it('expone alternativa, guía y variante del tema sin sustituir el texto', () => {
    render(<ThemeProvider><LearningDiagram diagram={diagram} /></ThemeProvider>);
    const frame = screen.getByTitle('Variable y memoria') as HTMLIFrameElement;
    expect(frame.src).toContain('/diagrams/variable.html');
    expect(frame.getAttribute('loading')).toBe('eager');
    expect(screen.getByText('Cargando diagrama…')).toBeTruthy();
    fireEvent.load(frame);
    expect(screen.queryByText('Cargando diagrama…')).toBeNull();
    expect(screen.getByText(/Sigue la flecha/)).toBeTruthy();
    expect(screen.getByText('¿Qué cambia?')).toBeTruthy();
  });

  it('carga la variante cyber cuando ese tema está activo', () => {
    localStorage.setItem('theme', 'cyber');
    render(<ThemeProvider><LearningDiagram diagram={diagram} /></ThemeProvider>);
    expect((screen.getByTitle('Variable y memoria') as HTMLIFrameElement).src).toContain('/diagrams/variable-cyber.html');
    localStorage.removeItem('theme');
  });
});
