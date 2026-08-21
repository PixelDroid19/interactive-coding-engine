// @vitest-environment happy-dom
import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExplainModal } from './ExplainModal';
import { FUNDAMENTOS_SCRIMS } from '../../curriculum/fundamentos/course';

describe('ExplainModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('expone un diálogo y devuelve el foco al control que lo abrió', async () => {
    const lesson = FUNDAMENTOS_SCRIMS['fundamentos-01'];
    const Harness = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Abrir explicación
          </button>
          <ExplainModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            lessonTitle={lesson.title}
            workspace={lesson.initialWorkspace}
          />
        </>
      );
    };

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Abrir explicación' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Explicar lección' });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBe(document.activeElement);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
