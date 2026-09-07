// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SoloProjectView } from './SoloProjectView';
import type { SoloProjectItem } from '../../types/curriculum';
import * as testRunner from '../../engine/testRunner';

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
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('no esconde condiciones del proyecto dentro de la ayuda', () => {
    render(<SoloProjectView project={{ ...project,
      brief: 'Construye el formulario. Conserva la entrada anterior cuando el siguiente intento no sea válido y permite corregirla sin reiniciar todo el proyecto ni perder los datos que ya escribió la persona.',
      starterNotes: 'Puedes inspeccionar el evento.',
    }} onBack={vi.fn()} />);
    const contract = screen.getByText('Conserva la entrada anterior cuando el siguiente intento no sea válido y permite corregirla sin reiniciar todo el proyecto ni perder los datos que ya escribió la persona.');
    expect(contract.closest('details')).toBeNull();
    expect(screen.getByText('Puedes inspeccionar el evento.').closest('details')?.open).toBe(false);
  });

  it('no completa con requisitos retirados mientras espera una comprobación', async () => {
    const solved = structuredClone(project);
    solved.initialWorkspace.files['app.js'].content = 'function decidir(entrada) { return entrada.valor * 2; }';
    const realValidation = testRunner.runChallengeValidation;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    vi.spyOn(testRunner, 'runChallengeValidation').mockImplementation(async (...args) => {
      await pending;
      return realValidation(...args);
    });
    render(<SoloProjectView project={solved} onBack={vi.fn()} />);
    const requirement = screen.getByRole('button', { name: /Contrato.*Devuelve el valor esperado/i });
    fireEvent.click(requirement);
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar proyecto' }));
    fireEvent.click(requirement);
    release();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Comprobar proyecto' }).hasAttribute('disabled')).toBe(false));
    expect(screen.queryByRole('region', { name: 'Reflexiona sobre tu solución' })).toBeNull();
  });

  it.each(['reset', 'unmount'] as const)('no registra una evaluación obsoleta después de %s', async (action) => {
    const realValidation = testRunner.runChallengeValidation;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    let finished!: () => void;
    const evaluated = new Promise<void>((resolve) => { finished = resolve; });
    vi.spyOn(testRunner, 'runChallengeValidation').mockImplementation(async (...args) => {
      await pending;
      const result = await realValidation(...args);
      finished();
      return result;
    });
    const onAttempt = vi.fn();
    const view = render(<SoloProjectView project={project} onBack={vi.fn()} onAttempt={onAttempt} />);
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar proyecto' }));
    if (action === 'reset') fireEvent.click(screen.getByRole('button', { name: 'Restaurar plantilla inicial' }));
    else view.unmount();
    release();
    await evaluated;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.queryByText('0 de 1 comprobaciones superadas')).toBeNull();
  });

  it('un proyecto sin comprobaciones conserva la entrega sin inventar un 100', async () => {
    const onCompleted = vi.fn();
    render(<SoloProjectView project={{ ...project, tests: [] }} onBack={vi.fn()} onCompleted={onCompleted} />);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar proyecto como completado' }));
    expect(screen.getByRole('region', { name: 'Reflexiona sobre tu solución' }).textContent).not.toMatch(/código ya pasó las pruebas/i);
    const reflections = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.post-solve-studio textarea'));
    fireEvent.input(reflections[0], { target: { value: 'No sé explicarlo todavía.' } });
    fireEvent.input(reflections[1], { target: { value: 'No sé qué otro caso probar.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar el proyecto y continuar' }));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1));
    expect(onCompleted.mock.calls[0][0]).not.toHaveProperty('score');
    expect(onCompleted.mock.calls[0][0].diagnostics).toMatchObject({ evaluation: 'ungraded' });
  });

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
    await waitFor(() => expect(screen.getByRole('region', { name: 'Reflexiona sobre tu solución' })).toBeTruthy());
    const reflections = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.post-solve-studio textarea'));
    fireEvent.input(reflections[0], { target: { value: 'La función recibe una entrada, lee su valor y devuelve el doble sin depender de un ejemplo concreto.' } });
    fireEvent.input(reflections[1], { target: { value: 'Probaría un valor negativo y el cero para comprobar que la misma regla sigue funcionando.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar el proyecto y continuar' }));
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
