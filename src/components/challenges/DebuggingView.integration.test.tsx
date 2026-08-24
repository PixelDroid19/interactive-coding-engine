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

  it('una práctica lógica usa salida JavaScript y oculta archivos web', () => {
    const { container } = render(<DebuggingView exercise={exercise} onBack={() => {}} />);
    expect(container.querySelector('.debug-panel')).toBeTruthy();
    expect(container.textContent).toContain('Reto');
    expect(container.textContent).toContain('Resultado');
    expect(screen.queryByRole('tab', { name: 'index.html' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'style.css' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Vista previa' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Salida' }));
    expect(screen.getByRole('region', { name: 'Salida de JavaScript' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ejecutar lógica' })).toBeTruthy();
  });

  it('una práctica de DOM conserva archivos web y vista previa', () => {
    const domExercise = DEBUG_EXERCISES.find(e => e.id === 'fundamentos-10-debug')!;
    render(<DebuggingView exercise={domExercise} onBack={() => {}} />);

    expect(screen.getByRole('tab', { name: 'index.html' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'style.css' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Vista previa' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Salida de JavaScript' })).toBeNull();
  });

  it('pestañas funcionan con teclado', async () => {
    const { container } = render(<DebuggingView exercise={exercise} onBack={() => {}} />);
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    expect(tablist?.getAttribute('aria-label')).toBe('Panel contextual');
  });

  it('restaura el archivo activo y las pistas reveladas después de recargar', () => {
    const firstRender = render(<DebuggingView exercise={exercise} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar siguiente pista' }));
    firstRender.unmount();

    render(<DebuggingView exercise={exercise} onBack={() => {}} />);

    expect(screen.getByRole('tab', { name: 'app.js' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(`Pistas 1/${exercise.hints.length}`)).toBeTruthy();
  });

  it('muestra el texto de cada pista revelada', () => {
    render(<DebuggingView exercise={exercise} onBack={() => {}} />);

    exercise.hints.forEach((hint) => {
      fireEvent.click(screen.getByRole('button', { name: 'Mostrar siguiente pista' }));
      expect(screen.getByText(new RegExp(hint.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: 'Ver cómo se resuelve' })).toBeTruthy();
    expect(screen.queryByText(/getElementById\("linea2"\)\.textContent =/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Ver cómo se resuelve' }));
    const diagnosis = screen.getByRole('region', { name: 'Diagnóstico específico' });
    expect(diagnosis.className).toContain('debug-resolution-card');
    expect(diagnosis.querySelector('ol')?.className).toContain('debug-resolution-steps');
    expect(diagnosis.querySelector('[data-resolution-note]')).toBeTruthy();
    expect(screen.getAllByText(exercise.observedBehavior).length).toBeGreaterThan(0);
    exercise.hints.forEach((hint) => expect(screen.getAllByText(hint.text).length).toBeGreaterThan(0));
  });

  it('edición + Comprobar → Resultado con todas las comprobaciones y Resuelto (simulado)', async () => {
    const fixedJs = `console.log("Me llamo Ana");
console.log("Estoy aprendiendo JavaScript");`;
    const { runChallengeValidation } = await import('../../engine/testRunner');
    const ws = {
      files: {
        'app.js': { name: 'app.js', path: 'app.js', content: fixedJs, language: 'javascript' as const },
        'index.html': { name: 'index.html', path: 'index.html', content: exercise.initialWorkspace.files['index.html'].content, language: 'html' as const },
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
    const domExercise = DEBUG_EXERCISES.find(e => e.id === 'fundamentos-10-debug')!;
    render(<DebuggingView exercise={domExercise} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Vista previa' }));
    const iframe = await screen.findByTitle('Vista previa') as HTMLIFrameElement & { __generation?: number };
    await waitFor(() => expect(iframe.__generation).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('tab', { name: 'Reto' }));

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }));

    await waitFor(() => {
      expect(screen.getByText(`0 de ${domExercise.tests.length} comprobaciones superadas`)).toBeTruthy();
    });
    screen.getAllByLabelText('fallido').forEach((card) => {
      expect(card.className).toContain('text-rose-950');
    });
    expect(screen.queryByText(/La vista previa no estaba lista/)).toBeNull();
    expect(screen.queryAllByLabelText('error de evaluación')).toHaveLength(0);
  });

  it('Comprobar prepara la vista previa aunque el estudiante no abra esa pestaña', async () => {
    const domExercise = DEBUG_EXERCISES.find(e => e.id === 'fundamentos-10-debug')!;
    const browserExercise = {
      ...domExercise,
      executionMode: 'browser' as const,
      tests: [{
        id: 'browser-ready',
        description: 'La vista previa está disponible para la comprobación',
        validatorType: 'browser-script' as const,
        customValidatorScript: `({document}) => Boolean(document.querySelector('[data-never-present]'))`,
      }],
    };
    render(<DebuggingView exercise={browserExercise} onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }));

    await waitFor(() => {
      expect(screen.getByText('0 de 1 comprobaciones superadas')).toBeTruthy();
    });
    expect(screen.queryAllByLabelText('error de evaluación')).toHaveLength(0);
    expect(screen.queryByText(/La vista previa todavía no está lista/)).toBeNull();
  });

  it('editar y pulsar Comprobar rápido evalúa la última versión', async () => {
    const { runChallengeValidation } = await import('../../engine/testRunner');
    const jsRoto = `console.log("Me llamo Ana");`;
    const jsArreglado = `console.log("Me llamo Ana");
console.log("Estoy aprendiendo JavaScript");`;
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
