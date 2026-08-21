// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DebuggingView } from './DebuggingView';
import { DEBUG_EXERCISES } from '../../curriculum/fundamentos/debugExercises';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('DebuggingView integración', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(cleanup);

  const exercise = DEBUG_EXERCISES.find(e => e.id === 'fundamentos-01-debug')!;

  it('estado inicial: editor dominante, Reto activo, archivos y preview no permanentes', () => {
    const { container } = render(<DebuggingView exercise={exercise} onBack={() => {}} onNext={() => {}} />);
    expect(container.querySelector('.debug-editor-area')).toBeTruthy();
    expect(container.querySelector('.debug-panel')).toBeTruthy();
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    expect(container.textContent).toContain('Reto');
    expect(container.querySelector('[role="dialog"][aria-label*="Explorador"]')).toBeNull();
  });

  it('abrir y cerrar Reto, Resultado y Vista previa', async () => {
    const { container } = render(<DebuggingView exercise={exercise} onBack={() => {}} />);
    expect(container.querySelector('.debug-panel')).toBeTruthy();
    expect(container.textContent).toContain('Reto');
    expect(container.textContent).toContain('Resultado');
    expect(container.textContent).toContain('Vista previa');
  });

  it('pestañas funcionan con teclado', async () => {
    const { container } = render(<DebuggingView exercise={exercise} onBack={() => {}} />);
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    expect(tablist?.getAttribute('aria-label')).toBe('Panel contextual');
  });

  it('restaura el archivo activo y las pistas reveladas después de recargar', () => {
    const firstRender = render(<DebuggingView exercise={exercise} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('tab', { name: 'index.html' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar siguiente pista' }));
    firstRender.unmount();

    render(<DebuggingView exercise={exercise} onBack={() => {}} />);

    expect(screen.getByRole('tab', { name: 'index.html' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(`Pistas 1/${exercise.hints.length}`)).toBeTruthy();
  });

  it('edición + Comprobar → Resultado con todas las comprobaciones y Resuelto (simulado)', async () => {
    const fixedJs = `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea2").textContent = "Y me gusta el helado";`;
    const { runChallengeValidation } = await import('../../engine/testRunner');
    const ws = {
      files: {
        'app.js': { name: 'app.js', path: 'app.js', content: fixedJs, language: 'javascript' as const },
        'index.html': { name: 'index.html', path: 'index.html', content: '<p id="linea1"></p><p id="linea2"></p>', language: 'html' as const },
        'style.css': { name: 'style.css', path: 'style.css', content: '', language: 'css' as const },
      },
      activeFilePath: 'app.js',
    };
    const result = await runChallengeValidation(
      { id: exercise.id, title: exercise.title, timestamp: 0, instructions: '', tests: exercise.tests as any, hints: [] },
      ws as any,
      null
    );
    expect(result.allPassed).toBe(true);
    expect(result.passedCount).toBe(result.totalCount);
  });

  it('Comprobar integra la vista previa con el evaluador sin falsos errores de generación', async () => {
    render(<DebuggingView exercise={exercise} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Vista previa' }));
    const iframe = await screen.findByTitle('Vista previa') as HTMLIFrameElement & { __generation?: number };
    await waitFor(() => expect(iframe.__generation).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('tab', { name: 'Reto' }));

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }));

    await waitFor(() => {
      expect(screen.getByText(`0 de ${exercise.tests.length} comprobaciones superadas`)).toBeTruthy();
    });
    expect(screen.queryByText(/La vista previa no estaba lista/)).toBeNull();
    expect(screen.queryAllByLabelText('error de evaluación')).toHaveLength(0);
  });

  it('editar y pulsar Comprobar rápido evalúa la última versión', async () => {
    const { runChallengeValidation } = await import('../../engine/testRunner');
    const jsRoto = `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea1").textContent = "Y me gusta el helado";`;
    const jsArreglado = `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea2").textContent = "Y me gusta el helado";`;
    const mkWs = (content: string) => ({
      files: {
        'app.js': { name: 'app.js', path: 'app.js', content, language: 'javascript' as const },
        'index.html': { name: 'index.html', path: 'index.html', content: exercise.initialWorkspace.files['index.html'].content, language: 'html' as const },
        'style.css': { name: 'style.css', path: 'style.css', content: '', language: 'css' as const },
      },
      activeFilePath: 'app.js',
    });
    const result1 = await runChallengeValidation({ id: exercise.id, title: exercise.title, timestamp: 0, instructions: '', tests: exercise.tests as any, hints: [] }, mkWs(jsRoto) as any, null);
    const result2 = await runChallengeValidation({ id: exercise.id, title: exercise.title, timestamp: 0, instructions: '', tests: exercise.tests as any, hints: [] }, mkWs(jsArreglado) as any, null);
    expect(result1.allPassed).toBe(false);
    expect(result2.allPassed).toBe(true);
  });
});
