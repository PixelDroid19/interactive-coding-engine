// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import type { LiveHelpEvent, LiveHelpSession } from './protocol';
import { LearnerLiveHelpPanel } from './LearnerLiveHelpPanel';

const session: LiveHelpSession = {
  id: 'session-1', learnerUserId: 'learner-1', claimedByUserId: 'tutor-1', claimedRole: 'tutor', status: 'active',
  context: { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' },
  expiresAt: '2026-08-30T13:00:00.000Z', createdAt: '2026-08-30T12:00:00.000Z', updatedAt: '2026-08-30T12:01:00.000Z',
};

const proposal: LiveHelpEvent = {
  seq: 3, type: 'patch-proposal', proposalId: '30000000-0000-4000-8000-000000000003', actorRole: 'tutor', createdAt: '2026-08-30T12:01:00.000Z',
  payload: {
    summary: 'Mostrar un saludo al iniciar.',
    patch: { baseRevision: 0, files: [{ path: 'app.js', content: 'console.log("hola")' }] },
  },
};

function decisionEvent(decision: 'accepted' | 'rejected'): LiveHelpEvent {
  return {
    seq: 4,
    type: 'patch-decision',
    proposalId: '30000000-0000-4000-8000-000000000003',
    actorRole: 'student',
    createdAt: '2026-08-30T12:02:00.000Z',
    payload: { decision },
  };
}

const baseProps = {
  session,
  connectionState: 'connected' as const,
  events: [proposal],
  error: null,
  onClose: vi.fn(),
  onRequest: vi.fn(),
  onAccept: vi.fn(),
  onSendChat: vi.fn(),
  onSendSnapshot: vi.fn(),
  onDecision: vi.fn(),
  onEnd: vi.fn(),
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('panel de ayuda en vivo de la alumna', () => {
  it('presenta la propuesta sin aplicarla hasta que la alumna pulsa Aplicar cambio', () => {
    const onApplyProposal = vi.fn().mockReturnValue({ outcome: 'applied', revision: 1 });
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onApplyProposal={onApplyProposal} /></ThemeProvider>);

    expect(screen.getByRole('complementary', { name: 'Ayuda del formador' })).toBeTruthy();
    expect(screen.getByText('Mostrar un saludo al iniciar.')).toBeTruthy();
    expect(onApplyProposal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(onApplyProposal).toHaveBeenCalledWith(proposal);
    expect(baseProps.onDecision).toHaveBeenCalledWith('30000000-0000-4000-8000-000000000003', 'accepted');
  });

  it('explica el conflicto de revisión y no confirma una mutación que no ocurrió', () => {
    const onDecision = vi.fn();
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onDecision={onDecision} onApplyProposal={() => ({ outcome: 'conflict' })} /></ThemeProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(screen.getByRole('alert').textContent).toContain('El código cambió desde que llegó esta propuesta');
    expect(onDecision).not.toHaveBeenCalled();
  });

  it('muestra un bloqueo temporal sin confirmar una decisión', () => {
    const onDecision = vi.fn();
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onDecision={onDecision} onApplyProposal={() => ({ outcome: 'blocked', message: 'El entorno está ocupado.' })} /></ThemeProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(screen.getByRole('alert').textContent).toContain('El entorno está ocupado.');
    expect(onDecision).not.toHaveBeenCalled();
  });

  it('permite reintentar la confirmación si aplicar localmente funcionó pero la decisión no salió', async () => {
    const onDecision = vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(undefined);
    const onApplyProposal = vi.fn().mockReturnValue({ outcome: 'applied', revision: 1 });
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onDecision={onDecision} onApplyProposal={onApplyProposal} /></ThemeProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Sin conexión');
    expect(screen.getByRole('button', { name: 'Reintentar confirmación' })).toBeTruthy();
    expect(onApplyProposal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar confirmación' }));
    await waitFor(() => expect(onDecision).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Reintentar confirmación' })).toBeTruthy();
    expect(onDecision).toHaveBeenNthCalledWith(2, '30000000-0000-4000-8000-000000000003', 'accepted');
  });

  it('hidrata una aceptación persistida del replay y no vuelve a aplicar ni enviar una decisión', () => {
    const onDecision = vi.fn();
    const onApplyProposal = vi.fn().mockReturnValue({ outcome: 'applied', revision: 1 });
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} events={[proposal, decisionEvent('accepted')]} onDecision={onDecision} onApplyProposal={onApplyProposal} /></ThemeProvider>);

    expect(screen.getByText('Aplicada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Aplicar cambio' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull();
    expect(onApplyProposal).not.toHaveBeenCalled();
    expect(onDecision).not.toHaveBeenCalled();
  });

  it('hidrata un rechazo persistido del replay y no deja acciones locales pendientes', () => {
    const onDecision = vi.fn();
    const onApplyProposal = vi.fn().mockReturnValue({ outcome: 'applied', revision: 1 });
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} events={[proposal, decisionEvent('rejected')]} onDecision={onDecision} onApplyProposal={onApplyProposal} /></ThemeProvider>);

    expect(screen.getByText('Rechazada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Aplicar cambio' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull();
    expect(onApplyProposal).not.toHaveBeenCalled();
    expect(onDecision).not.toHaveBeenCalled();
  });

  it('mantiene una decisión enviada sin echo como sin confirmar, permite reintentar sin reaplicar y la cierra al recibir echo', async () => {
    const onDecision = vi.fn().mockResolvedValue(undefined);
    const onApplyProposal = vi.fn().mockReturnValue({ outcome: 'applied', revision: 1 });
    const view = render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onDecision={onDecision} onApplyProposal={onApplyProposal} /></ThemeProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar cambio' }));
    expect(await screen.findByText('Aplicada sin confirmar')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar confirmación' })).toBeTruthy();
    expect(onApplyProposal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar confirmación' }));
    await waitFor(() => expect(onDecision).toHaveBeenCalledTimes(2));
    expect(onApplyProposal).toHaveBeenCalledTimes(1);

    view.rerender(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} events={[proposal, decisionEvent('accepted')]} onDecision={onDecision} onApplyProposal={onApplyProposal} /></ThemeProvider>);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reintentar confirmación' })).toBeNull());
    expect(screen.getByText('Aplicada')).toBeTruthy();
    expect(onApplyProposal).toHaveBeenCalledTimes(1);
  });

  it('solo presenta propuestas emitidas por un formador', () => {
    const proposalFromStudent: LiveHelpEvent = { ...proposal, actorRole: 'student' };
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} events={[proposalFromStudent]} onApplyProposal={() => ({ outcome: 'applied', revision: 1 })} /></ThemeProvider>);

    expect(screen.getByText('Propuestas (0)')).toBeTruthy();
    expect(screen.queryByText('Mostrar un saludo al iniciar.')).toBeNull();
  });

  it('no envía dos decisiones cuando se pulsa una propuesta mientras la primera sigue en vuelo', () => {
    const onDecision = vi.fn(() => new Promise<void>(() => undefined));
    render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onDecision={onDecision} onApplyProposal={() => ({ outcome: 'applied', revision: 1 })} /></ThemeProvider>);

    const apply = screen.getByRole('button', { name: 'Aplicar cambio' });
    fireEvent.click(apply);
    fireEvent.click(apply);

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(apply).toHaveProperty('disabled', true);
  });

  it('conserva una estructura con nombre accesible y adopta los tokens cyber', () => {
    localStorage.setItem('theme', 'cyber');
    const { container } = render(<ThemeProvider><LearnerLiveHelpPanel {...baseProps} onApplyProposal={() => ({ outcome: 'applied', revision: 1 })} /></ThemeProvider>);

    expect(container.querySelector('.live-help-panel--cyber')).toBeTruthy();
    expect(screen.getByLabelText('Escribe un mensaje al formador')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cerrar ayuda en vivo' })).toBeTruthy();
  });
});
