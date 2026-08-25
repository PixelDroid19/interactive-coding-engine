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
    expect(screen.getByText('Embeddings locales con WebGPU')).toBeTruthy();
    expect(screen.getByText(/modelo multilingüe real en la GPU/i)).toBeTruthy();
    expect(screen.getByText(/backend seguro/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Probar embeddings con WebGPU' })).toBeTruthy();
  });

  it('no ofrece un ranking simulado cuando WebGPU no existe', () => {
    render(<AILearningLab webGpuAvailable={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Laboratorio de IA en el navegador/ }));

    expect(screen.getByRole('alert').textContent).toMatch(/no se mostrará un ranking simulado/i);
    expect((screen.getByRole('button', { name: 'Probar embeddings con WebGPU' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
