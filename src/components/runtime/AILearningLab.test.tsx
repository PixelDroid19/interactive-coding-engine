// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AILearningLab } from './AILearningLab';

afterEach(cleanup);

describe('AILearningLab', () => {
  it('explica el modo local y la frontera de seguridad de APIs', () => {
    render(<AILearningLab />);
    fireEvent.click(screen.getByRole('button', { name: /Laboratorio de IA en el navegador/ }));
    expect(screen.getByText('Embeddings locales')).toBeTruthy();
    expect(screen.getByText(/texto se procesa en este dispositivo/i)).toBeTruthy();
    expect(screen.getByText(/backend seguro/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Probar embeddings' })).toBeTruthy();
  });
});
