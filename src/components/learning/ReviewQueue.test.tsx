// @vitest-environment happy-dom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { ReviewQueue } from './ReviewQueue';

describe('ReviewQueue', () => {
  it('explica con honestidad que todavía no hay actividad cuando no existe evidencia real', () => {
    render(<ReviewQueue
      courseId="course-1"
      profile={createEmptyLearningProfile(0)}
      onRate={vi.fn(async () => undefined)}
      onReviewReinforcement={vi.fn(async () => undefined)}
    />);

    expect(screen.getByText('Aún no tienes actividad para repasar.')).toBeTruthy();
  });
});
