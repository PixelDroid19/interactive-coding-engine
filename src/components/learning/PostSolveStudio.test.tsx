// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PostSolveStudio } from './PostSolveStudio';

afterEach(cleanup);

describe('reflexión después de resolver', () => {
  it('presenta la reflexión de un modelo sin afirmar que se probó código', () => {
    render(<PostSolveStudio itemId="reasoning" title="Ordena el flujo del monitor" kind="reasoning" onComplete={vi.fn()} />);
    const reflection = screen.getByRole('region', { name: 'Reflexiona sobre tu solución' });
    expect(reflection.textContent).toContain('Ordena el flujo del monitor');
    expect(reflection.textContent).not.toMatch(/tu código ya pasó las pruebas/i);
    expect(screen.getByLabelText('Respuesta de lectura mental').getAttribute('placeholder')).not.toMatch(/primero entra/i);
  });

  it('acepta una explicación breve sin premiar el número de caracteres', () => {
    const onComplete = vi.fn();
    render(<PostSolveStudio itemId="example" title="Sumar" kind="challenge" onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText('Respuesta de lectura mental'), { target: { value: 'Suma dos precios.' } });
    fireEvent.change(screen.getByLabelText('Respuesta de cambio de requisito'), { target: { value: '2 y 0 dan 2.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onComplete).toHaveBeenCalledWith('Suma dos precios.', '2 y 0 dan 2.');
  });

  it('permite continuar con las pruebas aprobadas aunque la reflexión cueste', () => {
    const onComplete = vi.fn();
    render(<PostSolveStudio itemId="example" title="Sumar" kind="challenge" onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar sin escribir' }));
    expect(onComplete).toHaveBeenCalledWith('', '');
  });

  it('conserva las respuestas si falla su registro', async () => {
    render(<PostSolveStudio itemId="example" title="Sumar" kind="challenge" onComplete={async () => { throw new Error('offline'); }} />);
    fireEvent.change(screen.getByLabelText('Respuesta de lectura mental'), { target: { value: 'Suma dos precios.' } });
    fireEvent.change(screen.getByLabelText('Respuesta de cambio de requisito'), { target: { value: '2 y 0 dan 2.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/inténtalo/i);
    expect((screen.getByLabelText('Respuesta de lectura mental') as HTMLTextAreaElement).value).toBe('Suma dos precios.');
  });
});
