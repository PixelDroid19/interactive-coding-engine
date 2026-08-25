// @vitest-environment happy-dom
import React, { forwardRef, useImperativeHandle } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEBUG_EXERCISES } from '../../curriculum/fundamentos/debugExercises';
import { DebuggingView } from './DebuggingView';

const { runLogicPreview, runChallengeValidation } = vi.hoisted(() => ({
  runLogicPreview: vi.fn(async () => ({ success: true, consoleLogs: [], executionTimeMs: 1 })),
  runChallengeValidation: vi.fn(async (challenge: { tests: unknown[] }) => ({
    allPassed: false,
    passedCount: 0,
    totalCount: challenge.tests.length,
    tests: challenge.tests.map((_, index) => ({
      id: `test-${index}`,
      description: `Prueba ${index + 1}`,
      passed: false,
      status: 'failed' as const,
    })),
    feedbackMessage: 'Todavía falta corregir la función.',
  })),
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../engine/testRunner', () => ({ runChallengeValidation }));
vi.mock('../preview/LogicRunnerPanel', () => ({
  LogicRunnerPanel: forwardRef((_props: unknown, ref) => {
    useImperativeHandle(ref, () => ({ run: runLogicPreview }));
    return <div role="region" aria-label="Salida de Python" />;
  }),
}));

describe('DebuggingView con Python', () => {
  beforeEach(() => {
    localStorage.clear();
    runLogicPreview.mockClear();
    runChallengeValidation.mockClear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((media: string) => ({
        matches: true,
        media,
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

  it('pulsa Comprobar una sola vez: evalúa Python sin ejecutar antes la consola', async () => {
    const exercise = DEBUG_EXERCISES.find((item) => item.id === 'fundamentos-15-debug')!;
    render(<DebuggingView exercise={exercise} language="python" onBack={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }));

    await waitFor(() => expect(runChallengeValidation).toHaveBeenCalledTimes(1));
    expect(runLogicPreview).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Volver a comprobar' })).toBeTruthy();
  });
});
