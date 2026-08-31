// @vitest-environment happy-dom
import React, { useEffect } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReadingItem } from '../../types/curriculum';
import type { LiveHelpContext } from '../../live-help/protocol';
import { ReadingView } from './ReadingView';

const mounts: Array<{ lessonId: string; artifactId: string; liveHelpContext?: LiveHelpContext }> = [];

vi.mock('../runtime/CellsLearningLab', () => ({
  CellsLearningLab: ({ lessonId, componentArtifactId, liveHelpContext }: { lessonId?: string; componentArtifactId?: string; liveHelpContext?: LiveHelpContext }) => {
    useEffect(() => {
      mounts.push({ lessonId: lessonId ?? 'sin-leccion', artifactId: componentArtifactId ?? 'sin-artefacto', liveHelpContext });
    }, []);
    return <div data-testid="cells-learning-lab" data-lesson-id={lessonId} data-artifact-id={componentArtifactId} data-live-help-key={liveHelpContext?.lessonKey} />;
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
    const context18: LiveHelpContext = { courseSlug: 'open-cells', lessonKey: 'open-cells-18-lectura', surface: 'lesson' };
    const context19: LiveHelpContext = { courseSlug: 'open-cells', lessonKey: 'open-cells-19-lectura', surface: 'lesson' };
    const view = render(<ReadingView reading={cellsReading(18)} onBack={vi.fn()} liveHelpContext={context18} />);

    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-lesson-id')).toBe('open-cells-18');
    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-artifact-id')).toBe('product-card');
    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-live-help-key')).toBe('open-cells-18-lectura');
    expect(mounts).toEqual([{ lessonId: 'open-cells-18', artifactId: 'product-card', liveHelpContext: context18 }]);

    view.rerender(<ReadingView reading={cellsReading(19)} onBack={vi.fn()} liveHelpContext={context19} />);

    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-lesson-id')).toBe('open-cells-19');
    expect(screen.getByTestId('cells-learning-lab').getAttribute('data-artifact-id')).toBe('product-list');
    expect(mounts).toEqual([
      { lessonId: 'open-cells-18', artifactId: 'product-card', liveHelpContext: context18 },
      { lessonId: 'open-cells-19', artifactId: 'product-list', liveHelpContext: context19 },
    ]);
  });
});
