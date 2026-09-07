// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GuidedPractice } from './GuidedPractice';
import * as practice from '../../learning/guidedPractice';

const session = vi.hoisted(() => ({ current: { status: 'ready', session: { authenticated: false, user: { id: 'a' } } } }));
vi.mock('../../auth/AuthSessionProvider', () => ({ useAuthSession: () => session.current }));
// CodeMirror uses browser layout APIs. Its real editor is exercised in @Browser.
vi.mock('../editor/CodeEditor', () => ({ CodeEditor: ({ file, onCodeChange }: { file: { content: string }; onCodeChange: (code: string) => void }) =>
  <textarea aria-label="Editor de practica.js" value={file.content} onChange={event => onCodeChange(event.target.value)} />,
}));

beforeEach(() => { localStorage.clear(); session.current.session.authenticated = false; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function reachCode() {
  fireEvent.click(screen.getByRole('button', { name: 'No lo sé todavía' }));
  await screen.findByText('La salida real es:');
  fireEvent.click(screen.getByRole('button', { name: 'Ahora lo intento' }));
}
const answer = 'function agregarReservas(actuales,nuevas){ return actuales+nuevas; }';

it('un visitante completa una práctica sin login, sin mínimo de texto y con pruebas reales', async () => {
  render(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  await reachCode();
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi código' }));
  await screen.findByText('Revisa el caso marcado y vuelve a probar.');
  expect((screen.getByRole('button', { name: 'Explicar lo que hice' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Editor de practica.js'), { target: { value: answer } });
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi código' }));
  await screen.findByText('Tu código pasó los 3 casos.');
  fireEvent.click(screen.getByRole('button', { name: 'Explicar lo que hice' }));
  fireEvent.click(screen.getByRole('button', { name: 'Con ayuda' }));
  await screen.findByRole('heading', { name: 'Un paso más, a tu ritmo' });
  expect(localStorage.getItem('aula_learning_sync_v1')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Otro ejemplo de este tema' }));
  expect(screen.getByRole('heading', { name: 'Reservas de un taller' })).toBeTruthy();
});

it('retoma un intento al cerrar y volver, sin mezclar cuentas', async () => {
  const view = render(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  await reachCode();
  fireEvent.change(screen.getByLabelText('Editor de practica.js'), { target: { value: 'mi borrador' } });
  view.unmount();
  const reopened = render(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  expect((screen.getByLabelText('Editor de practica.js') as HTMLTextAreaElement).value).toBe('mi borrador');
  session.current.session.authenticated = true;
  reopened.rerender(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  expect(screen.queryByLabelText('Editor de practica.js')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Entradas para el cine' })).toBeTruthy();
});

it('ignora el resultado pendiente si se editó el código mientras se ejecutaba', async () => {
  let resolve!: (checks: practice.GuidedCheck[]) => void;
  vi.spyOn(practice, 'checkGuidedCode').mockImplementation(() => new Promise(done => { resolve = done; }));
  render(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  await reachCode();
  fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi código' }));
  fireEvent.change(screen.getByLabelText('Editor de practica.js'), { target: { value: 'otro intento' } });
  resolve([{ input: 'f()', expected: '3', actual: '3', passed: true }]);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Comprobar mi código' }) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.queryByText('Tu código pasó los 3 casos.')).toBeNull();
  expect((screen.getByRole('button', { name: 'Explicar lo que hice' }) as HTMLButtonElement).disabled).toBe(true);
});

it('registra un fallo del evaluador como intento sin calificar', async () => {
  session.current.session.authenticated = true;
  vi.spyOn(practice, 'checkGuidedCode').mockRejectedValue(new Error('El entorno aislado no respondió.'));
  render(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  await reachCode();

  fireEvent.click(screen.getByRole('button', { name: 'Comprobar mi código' }));

  await screen.findByRole('alert');
  const queue = JSON.parse(localStorage.getItem('aula_learning_sync_v1') ?? '{}') as {
    attempts?: Array<{ result: string; diagnostics?: Record<string, unknown> }>;
  };
  expect(queue.attempts).toHaveLength(2);
  expect(queue.attempts?.at(-1)).toMatchObject({
    result: 'ungraded',
    diagnostics: { mode: 'guided-practice', stage: 'modify', evaluation: 'ungraded' },
  });
});

it('conserva cada tema en memoria aunque el navegador no permita guardarlo', async () => {
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('storage denied'); });
  render(<GuidedPractice courseSlug="fundamentos" onClose={vi.fn()} />);
  await reachCode();
  fireEvent.change(screen.getByLabelText('Editor de practica.js'), { target: { value: 'borrador temporal' } });
  fireEvent.click(screen.getByText('Tema: Seguir una variable · Cambiar'));
  fireEvent.click(screen.getByRole('button', { name: 'Calcular una compra' }));
  expect(screen.getByRole('heading', { name: 'Una compra de cuadernos' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Seguir una variable' }));
  expect((screen.getByLabelText('Editor de practica.js') as HTMLTextAreaElement).value).toBe('borrador temporal');
});
