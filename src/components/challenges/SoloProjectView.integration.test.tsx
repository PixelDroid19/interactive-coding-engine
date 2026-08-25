// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SoloProjectView } from './SoloProjectView';
import type { SoloProjectItem } from '../../types/curriculum';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const project: SoloProjectItem = {
  id: 'project-test',
  title: 'Proyecto comprobable',
  type: 'solo-project',
  templateId: 'vanilla-js',
  estimatedMinutes: 30,
  brief: 'Implementa decidir(entrada).',
  requirements: [{ id: 'contrato', title: 'Contrato', description: 'Devuelve el valor esperado.' }],
  initialWorkspace: {
    activeFilePath: 'app.js',
    files: {
      'app.js': { name: 'app.js', path: 'app.js', language: 'javascript', content: 'function decidir(entrada) {\n  // TODO\n}' },
    },
  },
  tests: [{
    id: 'caso-1',
    description: 'Usa la entrada',
    validatorType: 'function-call',
    targetFunction: 'decidir',
    args: [{ valor: 2 }],
    expectedReturn: 4,
  }],
};

describe('SoloProjectView', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() }),
    });
  });
  afterEach(cleanup);

  it('comprueba el codigo y no permite completar el proyecto solo marcando una lista', async () => {
    render(<SoloProjectView project={project} onBack={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Marcar proyecto como completado/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar proyecto' }));

    await waitFor(() => expect(screen.getByText('0 de 1 comprobaciones superadas')).toBeTruthy());
    expect(screen.getByText('Usa la entrada')).toBeTruthy();
    expect(screen.queryByText('Completado')).toBeNull();
  });

  it('exige aprobar el codigo y revisar los requisitos antes de completar', async () => {
    const solved = structuredClone(project);
    solved.initialWorkspace.files['app.js'].content = 'function decidir(entrada) { return entrada.valor * 2; }';
    render(<SoloProjectView project={solved} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar proyecto' }));
    await waitFor(() => expect(screen.getByText('1 de 1 comprobaciones superadas')).toBeTruthy());
    expect(screen.getByText(/Falta revisar la lista de requisitos/i)).toBeTruthy();
    expect(screen.queryByText('Completado')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Contrato.*Devuelve el valor esperado/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar proyecto' }));
    await waitFor(() => expect(screen.getByText('Completado')).toBeTruthy());
  });
});
