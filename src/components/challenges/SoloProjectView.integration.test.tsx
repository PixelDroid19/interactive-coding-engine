// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

    expect(screen.getByText('Haz esto')).toBeTruthy();
    expect(screen.getByText('Resultado esperado')).toBeTruthy();
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

    const requirement = screen.getByRole('button', { name: /Contrato.*Devuelve el valor esperado/i });
    fireEvent.click(requirement);
    await waitFor(() => expect(requirement.getAttribute('aria-pressed')).toBe('true'));
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar proyecto' }));
    await waitFor(() => expect(screen.getByRole('region', { name: 'Comprueba tu dominio' })).toBeTruthy());
    const reflections = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.post-solve-studio textarea'));
    fireEvent.input(reflections[0], { target: { value: 'La función recibe una entrada, lee su valor y devuelve el doble sin depender de un ejemplo concreto.' } });
    fireEvent.input(reflections[1], { target: { value: 'Probaría un valor negativo y el cero para comprobar que la misma regla sigue funcionando.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar dominio del proyecto' }));
    await waitFor(() => expect(screen.getByText('Completado')).toBeTruthy());
  });

  it('permite recorrer los archivos abiertos del proyecto con el teclado', () => {
    const multiFileProject = structuredClone(project);
    multiFileProject.initialWorkspace.files['helpers.js'] = {
      name: 'helpers.js',
      path: 'helpers.js',
      language: 'javascript',
      content: 'export const doble = (valor) => valor * 2;',
    };
    render(<SoloProjectView project={multiFileProject} onBack={vi.fn()} />);

    const tabs = screen.getByRole('group', { name: 'Archivos abiertos' });
    const appFile = within(tabs).getByRole('button', { name: 'app.js' });
    const helperFile = within(tabs).getByRole('button', { name: 'helpers.js' });
    appFile.focus();

    fireEvent.keyDown(appFile, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(helperFile);
  });
});
