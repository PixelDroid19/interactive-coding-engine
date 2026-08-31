// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyLearningProfile } from '../../learning/mastery';
import type { LearningProfile, NotebookEntry } from '../../learning/types';
import { LearningNotebook } from './LearningNotebook';

function profileWith(...notes: NotebookEntry[]): LearningProfile {
  return { ...createEmptyLearningProfile(0), notebook: notes };
}

describe('LearningNotebook', () => {
  afterEach(cleanup);

  it('ofrece una nota libre aunque el curso todavía no tenga conceptos registrados', () => {
    render(<LearningNotebook courseId="course-1" profile={createEmptyLearningProfile(0)} onSave={vi.fn(async () => undefined)} onDelete={vi.fn(async () => undefined)} />);

    expect(screen.getByLabelText('Título de la nota')).toBeTruthy();
    expect(screen.getByLabelText('Nota')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar nota' })).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByLabelText('Modelo mental')).toBeNull();
    expect(screen.queryByLabelText('Patrón que quiero recordar')).toBeNull();
    expect(screen.queryByLabelText('Mi ejemplo')).toBeNull();
    expect(screen.queryByLabelText('Error que ya cometí')).toBeNull();
  });

  it('crea una nota con un único cuerpo y limpia el borrador confirmado', async () => {
    const onSave = vi.fn(async () => undefined);
    render(<LearningNotebook courseId="course-1" profile={createEmptyLearningProfile(0)} onSave={onSave} onDelete={vi.fn(async () => undefined)} />);

    fireEvent.change(screen.getByLabelText('Título de la nota'), { target: { value: '  Funciones puras  ' } });
    fireEvent.change(screen.getByLabelText('Nota'), { target: { value: '  La salida depende solo de la entrada.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      courseId: 'course-1',
      title: 'Funciones puras',
      body: 'La salida depende solo de la entrada.',
    }));
    expect((screen.getByLabelText('Título de la nota') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Nota') as HTMLTextAreaElement).value).toBe('');
  });

  it('edita una nota y conserva el borrador si llega una revisión remota más reciente', async () => {
    const original: NotebookEntry = {
      id: 'note-1',
      courseId: 'course-1',
      title: 'Retornos',
      body: 'Una función puede devolver un valor.',
      itemId: 'lesson-1',
      updatedAt: 1,
    };
    const onSave = vi.fn(async () => undefined);
    const view = render(<LearningNotebook courseId="course-1" profile={profileWith(original)} onSave={onSave} onDelete={vi.fn(async () => undefined)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar Retornos' }));
    fireEvent.change(screen.getByLabelText('Nota'), { target: { value: 'Mi cambio todavía sin guardar.' } });
    view.rerender(
      <LearningNotebook
        courseId="course-1"
        profile={profileWith({ ...original, body: 'La revisión remota más reciente.', updatedAt: 2 })}
        onSave={onSave}
        onDelete={vi.fn(async () => undefined)}
      />,
    );

    expect((screen.getByLabelText('Nota') as HTMLTextAreaElement).value).toBe('Mi cambio todavía sin guardar.');
    expect(screen.getByRole('alert').textContent).toContain('Conservamos tu borrador');
    fireEvent.click(screen.getByRole('button', { name: 'Recargar copia remota' }));
    expect((screen.getByLabelText('Nota') as HTMLTextAreaElement).value).toBe('La revisión remota más reciente.');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'note-1', body: 'La revisión remota más reciente.' })));
  });

  it('pide una confirmación local antes de eliminar una nota', async () => {
    const note: NotebookEntry = {
      id: 'note-2',
      courseId: 'course-1',
      title: '',
      body: 'Recordar comprobar el caso vacío.',
      updatedAt: 2,
    };
    const onDelete = vi.fn(async () => undefined);
    render(<LearningNotebook courseId="course-1" profile={profileWith(note)} onSave={vi.fn(async () => undefined)} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Nota sin título' }));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('note-2'));
  });
});
