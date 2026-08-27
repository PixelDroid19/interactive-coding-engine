// @vitest-environment happy-dom
import React, { useEffect } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReadingItem } from '../../types/curriculum';
import { ReadingView } from './ReadingView';

const mounts: string[] = [];

vi.mock('../runtime/CellsLearningLab', () => ({
  CellsLearningLab: ({ lessonId }: { lessonId?: string }) => {
    useEffect(() => {
      mounts.push(lessonId ?? 'sin-leccion');
    }, []);
    return <div data-testid="cells-learning-lab" data-lesson-id={lessonId} />;
  },
}));

function cellsReading(number: number): ReadingItem {
  const suffix = String(number).padStart(2, '0');
  return {
    id: `open-cells-${suffix}-lectura`,
    relatedLessonId: `open-cells-${suffix}`,
    title: `Lección Cells ${number}`,
    type: 'reading',
    estimatedMinutes: 12,
    summary: 'Práctica aislada por lección.',
    sections: [{ title: 'Contrato', content: 'Observa y modifica un proyecto real.' }],
    keyPoints: ['Cada lección conserva su propio workspace.'],
    handsOnLab: 'open-cells-playground',
  };
}

describe('ReadingView con laboratorios Cells', () => {
  afterEach(() => {
    cleanup();
    mounts.length = 0;
  });

  it('aísla el runtime y el borrador cuando cambia la lección', () => {
    const view = render(<ReadingView reading={cellsReading(18)} onBack={vi.fn()} />);

    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-lesson-id')).toBe('open-cells-18');
    expect(mounts).toEqual(['open-cells-18']);

    view.rerender(<ReadingView reading={cellsReading(19)} onBack={vi.fn()} />);

    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-lesson-id')).toBe('open-cells-19');
    expect(mounts).toEqual(['open-cells-18', 'open-cells-19']);
  });
});
