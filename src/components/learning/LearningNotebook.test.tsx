// @vitest-environment happy-dom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { LearningNotebook } from './LearningNotebook';

describe('LearningNotebook', () => {
  it('no inventa un primer concepto cuando no hay evidencia ni notas reales', () => {
    render(<LearningNotebook
      courseId="course-1"
      profile={createEmptyLearningProfile(0)}
      onSave={vi.fn(async () => undefined)}
    />);

    expect(screen.getByRole('heading', { name: 'Aún no hay conceptos para anotar' })).toBeTruthy();
    expect(screen.queryByLabelText('Concepto')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Guardar nota' })).toBeNull();
  });
});
