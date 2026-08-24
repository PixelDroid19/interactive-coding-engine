// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReasoningExerciseItem } from '../../types/curriculum';
import { ReasoningPracticeView } from './ReasoningPracticeView';

const item: ReasoningExerciseItem = {
  id: 'reasoning-test',
  title: 'Ordena el saludo',
  type: 'reasoning',
  relatedLessonId: 'lesson-test',
  estimatedMinutes: 3,
  activity: {
    kind: 'sequence',
    prompt: 'Ordena entrada, proceso y salida.',
    steps: [
      { id: 'salida', label: 'Mostrar saludo' },
      { id: 'entrada', label: 'Leer nombre' },
      { id: 'proceso', label: 'Formar saludo' },
    ],
    expectedOrder: ['entrada', 'proceso', 'salida'],
  },
  hints: [{ level: 1, text: 'Primero necesitas el dato.' }],
  explanation: 'La salida depende del proceso y el proceso de la entrada.',
};

describe('ReasoningPracticeView', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('exige construir el modelo correcto antes de habilitar Siguiente', () => {
    const onNext = vi.fn();
    const onCompleted = vi.fn();
    render(<ReasoningPracticeView item={item} onBack={() => {}} onNext={onNext} onCompleted={onCompleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi razonamiento' }));
    expect(screen.getByRole('heading', { name: 'Todavía no' })).toBeTruthy();
    expect((screen.getByRole('button', { name: /Siguiente/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getAllByRole('button', { name: 'Subir' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Subir' })[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi razonamiento' }));

    expect(screen.getByRole('heading', { name: 'Resuelto' })).toBeTruthy();
    expect(onCompleted).toHaveBeenCalledOnce();
    expect((screen.getByRole('button', { name: /Siguiente/ }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('revela pistas gradualmente y no enseña la explicación desde el inicio', () => {
    render(<ReasoningPracticeView item={item} onBack={() => {}} />);
    expect(screen.queryByText(item.explanation)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar una pista' }));
    expect(screen.getByText(/Primero necesitas el dato/)).toBeTruthy();
    expect(screen.getByText('Ver explicación completa')).toBeTruthy();
  });
});
