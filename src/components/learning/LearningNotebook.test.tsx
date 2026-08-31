// @vitest-environment happy-dom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { LearningNotebook } from './LearningNotebook';

describe('LearningNotebook', () => {
  it('no inventa un primer concepto cuando no hay evidencia ni notas reales', () => {
    render(<LearningNotebook courseId="course-1" profile={createEmptyLearningProfile(0)} onSave={vi.fn(async () => undefined)} />);

    expect(screen.getByRole('heading', { name: 'Aún no hay conceptos para anotar' })).toBeTruthy();
    expect(screen.queryByLabelText('Concepto')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Guardar nota' })).toBeNull();
  });

  it('conserva el borrador sucio ante una lectura remota y permite recargar explícitamente la revisión nueva', () => {
    const current = createEmptyLearningProfile(0);
    current.evidence.push({
      id: 'evidence:return-values',
      courseId: 'course-1',
      itemId: 'lesson-1',
      skillId: 'return-values',
      capability: 'explain',
      result: 'partial',
      source: 'challenge',
      timestamp: 1,
    });
    current.notebook.push({
      id: 'note-1',
      courseId: 'course-1',
      skillId: 'return-values',
      concept: 'return values',
      mentalModel: 'La revisión que abrí.',
      pattern: '',
      ownExample: '',
      personalMistake: '',
      updatedAt: 1,
    });
    const updated = {
      ...current,
      notebook: [
        {
          ...current.notebook[0]!,
          mentalModel: 'La revisión remota más reciente.',
          updatedAt: 2,
        },
      ],
    };
    const view = render(<LearningNotebook courseId="course-1" profile={current} onSave={vi.fn(async () => undefined)} />);
    const mentalModel = screen.getByLabelText('Modelo mental') as HTMLTextAreaElement;

    fireEvent.change(mentalModel, {
      target: { value: 'Mi borrador todavía sin guardar.' },
    });
    view.rerender(<LearningNotebook courseId="course-1" profile={updated} onSave={vi.fn(async () => undefined)} />);

    expect(mentalModel.value).toBe('Mi borrador todavía sin guardar.');
    expect(screen.getByRole('alert').textContent).toContain('Conservamos tu borrador');
    fireEvent.click(screen.getByRole('button', { name: 'Recargar copia remota' }));
    expect(mentalModel.value).toBe('La revisión remota más reciente.');
  });
});
