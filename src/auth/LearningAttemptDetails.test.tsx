// @vitest-environment happy-dom
import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { LearnerAttempt } from '../services/staffDashboardApi';
import { LearningAttemptDetails, learningAttemptLabel } from './LearningAttemptDetails';

afterEach(cleanup);
const attempt: LearnerAttempt = { id: '1', courseSlug: 'fundamentos', itemKey: 'guided:variables:0', kind: 'challenge', result: 'partial', score: null,
  occurredAt: '2026-09-04T12:00:00Z', diagnostics: { mode: 'guided-practice', topicTitle: 'Seguir una variable', stage: 'explain', evaluation: 'ungraded', usedHelp: true },
  response: { code: 'return a+b;', explanation: 'No entiendo return.', confidence: 'supported' } };
it('el instructor puede leer el código y la dificultad sin una nota de comprensión inventada', () => {
  render(<LearningAttemptDetails attempt={attempt} />);
  expect(screen.getByText('No entiendo return.')).toBeTruthy();
  expect(screen.getByText('return a+b;')).toBeTruthy();
  expect(learningAttemptLabel(attempt)).toEqual({ title: 'Seguir una variable', result: 'Reflexión sin calificar' });
});
it('trata el contenido del estudiante como texto, no como HTML', () => {
  const result = render(<LearningAttemptDetails attempt={{ ...attempt, response: { ...attempt.response, explanation: '<img src=x onerror=alert(1)>' } }} />);
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
  expect(result.container.querySelector('img')).toBeNull();
});
it('una autoevaluación no se muestra como éxito aunque el cliente envíe un score', () => {
  expect(learningAttemptLabel({ ...attempt, score: 100, result: 'success' }).result).toBe('Reflexión sin calificar');
});
it('un proyecto sin pruebas se muestra sin calificar aunque no tenga metadatos de reflexión', () => {
  expect(learningAttemptLabel({ ...attempt, kind: 'project', result: 'ungraded', diagnostics: {} }).result).toBe('Sin calificar');
});
