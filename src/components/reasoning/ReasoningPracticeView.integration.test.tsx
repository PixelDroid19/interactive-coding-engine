// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReasoningExerciseItem } from '../../types/curriculum';
import { OPEN_CELLS_COURSE } from '../../curriculum/open-cells/course';
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

  it('exige construir y explicar el modelo antes de habilitar Siguiente', async () => {
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
    expect((screen.getByRole('button', { name: /Siguiente/ }) as HTMLButtonElement).disabled).toBe(true);
    const reflections = screen.getAllByRole('textbox');
    fireEvent.change(reflections[0], { target: { value: 'Primero entra el nombre, después se forma el saludo y finalmente se muestra la salida.' } });
    fireEvent.change(reflections[1], { target: { value: 'Probaría con un nombre vacío y con Ada para conservar el caso anterior.' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrar comprensión/ }));
    await waitFor(() => expect((screen.getByRole('button', { name: /Siguiente/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('revela pistas gradualmente y no enseña la explicación desde el inicio', () => {
    render(<ReasoningPracticeView item={item} onBack={() => {}} />);
    expect(screen.getByText('Haz esto')).toBeTruthy();
    expect(screen.getByText('Debe ocurrir')).toBeTruthy();
    expect(screen.getByText('Necesito ayuda')).toBeTruthy();
    expect(screen.queryByText(item.explanation)).toBeNull();
    fireEvent.click(screen.getByText('Necesito ayuda'));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar una pista' }));
    expect(screen.getByText(/Primero necesitas el dato/)).toBeTruthy();
    expect(screen.getByText('Ver explicación completa')).toBeTruthy();
  });

  it('permite resolver una tabla de decisión generada desde una lección Cells real', () => {
    const generated = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items)
      .find((entry): entry is ReasoningExerciseItem => entry.type === 'reasoning' && entry.activity.kind === 'decision-table' && entry.id === 'open-cells-09-razona');
    expect(generated).toBeDefined();
    if (!generated || generated.activity.kind !== 'decision-table') return;

    render(<ReasoningPracticeView item={generated} onBack={() => {}} onNext={() => {}} />);
    for (const currentCase of generated.activity.cases) {
      fireEvent.change(screen.getByLabelText(currentCase.label), {
        target: { value: generated.activity.expectedOutcomes[currentCase.id] },
      });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi razonamiento' }));
    expect(screen.getByRole('heading', { name: 'Resuelto' })).toBeTruthy();
  });

  it('permite construir un mapa de dependencias generado desde una lección Cells real', () => {
    const generated = OPEN_CELLS_COURSE.modules.flatMap((module) => module.items)
      .find((entry): entry is ReasoningExerciseItem => entry.type === 'reasoning' && entry.activity.kind === 'dependency-map' && entry.id === 'open-cells-08-razona');
    expect(generated).toBeDefined();
    if (!generated || generated.activity.kind !== 'dependency-map') return;

    render(<ReasoningPracticeView item={generated} onBack={() => {}} onNext={() => {}} />);
    const labels = Object.fromEntries(generated.activity.modules.map((module) => [module.id, module.label]));
    for (const connection of generated.activity.expectedDependencies) {
      fireEvent.click(screen.getByRole('checkbox', {
        name: `${labels[connection.from]} → ${labels[connection.to]}`,
      }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi razonamiento' }));
    expect(screen.getByRole('heading', { name: 'Resuelto' })).toBeTruthy();
  });
});
