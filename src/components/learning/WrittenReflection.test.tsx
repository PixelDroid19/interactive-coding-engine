// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile } from '../../learning/mastery';
import { ExamMode } from './ExamMode';
import { LeaderMode } from './LeaderMode';

afterEach(cleanup);

it('guarda respuestas breves sin presentar una calificación de comprensión', async () => {
  let saved: unknown;
  render(<ExamMode courseId="lit" profile={createEmptyLearningProfile()} fallbackConcepts={['eventos']} onComplete={async (_questions, result) => { saved = result; }} />);
  for (const input of screen.getAllByRole('textbox')) fireEvent.change(input, { target: { value: 'No sé' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar reflexión' }));
  expect(await screen.findByRole('heading', { name: 'Reflexión guardada, sin calificar' })).toBeTruthy();
  expect(saved).toMatchObject({ classification: 'ungraded', scores: {} });
  expect(screen.queryByText(/dominio consistente/i)).toBeNull();
});

it('un fallo al guardar mantiene las respuestas y no muestra éxito', async () => {
  render(<ExamMode courseId="lit" profile={createEmptyLearningProfile()} fallbackConcepts={['eventos']} onComplete={async () => { throw new Error('No hay espacio'); }} />);
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'No sé' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar reflexión' }));
  expect((await screen.findByRole('alert')).textContent).toContain('No hay espacio');
  expect((screen.getAllByRole('textbox')[0] as HTMLTextAreaElement).value).toBe('No sé');
  expect(screen.queryByRole('heading', { name: 'Reflexión guardada, sin calificar' })).toBeNull();
});

it('la entrevista permite reconocer una dificultad y no afirma transferencia', async () => {
  const onComplete = vi.fn(async () => undefined);
  render(<LeaderMode courseId="lit" profile={createEmptyLearningProfile()} onComplete={onComplete} />);
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'No sé' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar entrevista' }));
  await waitFor(() => expect(onComplete).toHaveBeenCalledWith('fundamentos-del-curso', ['No sé', '', '']));
  expect(await screen.findByText(/sin calificar/i)).toBeTruthy();
  expect(screen.queryByText(/evidencia de transferencia/i)).toBeNull();
});
