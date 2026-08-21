// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CreatorStudio } from './CreatorStudio';
import { RecorderEngine } from '../../engine/recorderEngine';

describe('CreatorStudio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('permite elegir una plantilla con controles accesibles y texto en español', () => {
    render(<CreatorStudio onBack={() => {}} onLessonPublished={() => {}} />);

    expect(screen.getByRole('button', { name: 'Salir del estudio' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Crear una clase interactiva' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Usar plantilla HTML, CSS y JavaScript' }));

    expect(screen.getByRole('button', { name: 'Desactivar micrófono' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Empezar grabación' })).toBeTruthy();
    expect(screen.queryByText('Start Recording')).toBeNull();
  });

  it('cancela el motor de grabación al salir del estudio', async () => {
    const cancelRecording = vi.spyOn(RecorderEngine.prototype, 'cancelRecording');
    const view = render(<CreatorStudio onBack={() => {}} onLessonPublished={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Usar plantilla HTML, CSS y JavaScript' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar micrófono' }));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar grabación' }));
    await screen.findByRole('button', { name: 'Detener y revisar' });

    view.unmount();

    expect(cancelRecording).toHaveBeenCalledTimes(1);
  });

  it('mantiene la revisión y muestra el error cuando no puede publicar', async () => {
    const onLessonPublished = vi.fn();
    render(<CreatorStudio onBack={() => {}} onLessonPublished={onLessonPublished} />);

    fireEvent.click(screen.getByRole('button', { name: 'Usar plantilla HTML, CSS y JavaScript' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar micrófono' }));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar grabación' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Detener y revisar' }));

    const originalSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'aula_custom_scrims_v1') throw new DOMException('Sin espacio', 'QuotaExceededError');
      originalSetItem(key, value);
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Publicar lección en el curso' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo publicar la clase');
    expect(onLessonPublished).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Publicar lección en el curso' })).toBeTruthy();
  });
});
