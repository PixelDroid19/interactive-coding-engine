// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import { StaffLiveHelpQueue } from './StaffLiveHelpQueue';

const api = vi.hoisted(() => ({ staffSessions: vi.fn(), claim: vi.fn(), createTicket: vi.fn(), events: vi.fn(), end: vi.fn() }));
const socket = vi.hoisted(() => {
  class FakeLiveHelpSocket {
    static instances: FakeLiveHelpSocket[] = [];
    readonly disconnect = vi.fn();
    readonly connect = vi.fn().mockResolvedValue(undefined);
    readonly send = vi.fn();

    constructor(readonly options: any) {
      FakeLiveHelpSocket.instances.push(this);
    }
  }
  return { LiveHelpSocket: FakeLiveHelpSocket };
});

const staffIdentity = { staffUserId: 'tutor-a', staffRoles: ['tutor'] as const };

vi.mock('../services/liveHelpApi', () => ({
  liveHelpApi: api,
  drainLiveHelpEvents: async (sessionId: string, lastSeq: number, onPage: (replay: any) => void, shouldContinue: () => boolean = () => true) => {
    let cursor = lastSeq;
    while (shouldContinue()) {
      const replay = await api.events(sessionId, cursor);
      if (!shouldContinue()) return null;
      onPage(replay);
      cursor = replay.lastSeq;
      if (!replay.hasMore) return cursor;
    }
    return null;
  },
}));
vi.mock('./socket', () => ({ LiveHelpSocket: socket.LiveHelpSocket }));

const queuedSession = {
  id: 'session-1', learnerUserId: 'learner-1', claimedByUserId: null, claimedRole: null, status: 'requested' as const,
  context: { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const },
  expiresAt: '2026-08-30T13:00:00.000Z', createdAt: '2026-08-30T12:00:00.000Z', updatedAt: '2026-08-30T12:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  socket.LiveHelpSocket.instances.length = 0;
  api.staffSessions.mockReset().mockResolvedValue([queuedSession]);
  api.claim.mockReset().mockResolvedValue({ ...queuedSession, claimedByUserId: 'tutor-1', claimedRole: 'tutor', status: 'claimed' });
  api.createTicket.mockReset();
  api.events.mockReset();
  api.end.mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  socket.LiveHelpSocket.instances.length = 0;
});

describe('cola de ayuda en vivo del formador', () => {
  it('muestra la solicitud contextual y la reclama sin abrir una mutación del editor de la alumna', async () => {
    render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);

    expect(await screen.findByRole('heading', { name: 'Solicitudes de ayuda' })).toBeTruthy();
    expect(screen.getByText('fundamentos · fundamentos-01')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reclamar solicitud' }));

    await waitFor(() => expect(api.claim).toHaveBeenCalledWith('session-1'));
    expect(screen.queryByRole('button', { name: /Aplicar cambio/i })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Sesión reclamada' })).toBeTruthy();
  });

  it('desconecta la sesión activa al seleccionar una solicitud distinta antes de su consentimiento', async () => {
    const active = { ...queuedSession, status: 'active' as const };
    const waiting = { ...queuedSession, id: 'session-2', learnerUserId: 'learner-2', status: 'requested' as const };
    api.staffSessions.mockResolvedValue([active, waiting]);
    api.events.mockResolvedValue({ items: [], lastSeq: 0, hasMore: false });
    render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir solicitud de learner-1' }));
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    const activeSocket = socket.LiveHelpSocket.instances[0]!;
    fireEvent.click(screen.getByRole('button', { name: 'Abrir solicitud de learner-2' }));

    expect(activeSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(activeSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('cierra el socket y descarta callbacks del canal terminado', async () => {
    const active = { ...queuedSession, status: 'active' as const };
    api.staffSessions.mockResolvedValue([active]);
    api.events.mockResolvedValue({ items: [], lastSeq: 0, hasMore: false });
    render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir solicitud de learner-1' }));
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    const activeSocket = socket.LiveHelpSocket.instances[0]!;
    activeSocket.options.onFrame({
      type: 'event',
      event: { seq: 1, type: 'end', actorRole: 'student', createdAt: '2026-08-30T12:02:00.000Z', payload: {} },
    });

    await waitFor(() => expect(activeSocket.disconnect).toHaveBeenCalledTimes(1));
    activeSocket.options.onEvents([{
      seq: 2, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:03:00.000Z', payload: { body: 'No debe mezclarse' },
    }]);
    expect(screen.queryByText('No debe mezclarse')).toBeNull();
    expect(activeSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('no deja que un end del socket anterior cierre la nueva sesión seleccionada', async () => {
    const first = { ...queuedSession, id: 'session-1', learnerUserId: 'student1', status: 'active' as const };
    const second = { ...queuedSession, id: 'session-2', learnerUserId: 'student2', status: 'active' as const };
    api.staffSessions.mockResolvedValue([first, second]);
    api.events.mockResolvedValue({ items: [], lastSeq: 0, hasMore: false });
    render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir solicitud de student1' }));
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    const oldSocket = socket.LiveHelpSocket.instances[0]!;
    fireEvent.click(screen.getByRole('button', { name: 'Abrir solicitud de student2' }));
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(2));
    const newSocket = socket.LiveHelpSocket.instances[1]!;

    oldSocket.options.onFrame({
      type: 'event',
      event: { seq: 1, type: 'end', actorRole: 'student', createdAt: '2026-08-30T12:02:00.000Z', payload: {} },
    });

    expect(newSocket.disconnect).not.toHaveBeenCalled();
    expect(screen.getByText('Sesión con alumna student2')).toBeTruthy();
  });

  it('aísla chat, snapshot y callbacks cuando cambia la identidad del formador', async () => {
    const active = { ...queuedSession, status: 'active' as const };
    api.staffSessions.mockResolvedValue([active]);
    api.events.mockResolvedValue({ items: [], lastSeq: 0, hasMore: false });
    const view = render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir solicitud de learner-1' }));
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    const activeSocket = socket.LiveHelpSocket.instances[0]!;
    activeSocket.options.onEvents([{
      seq: 1, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:01:00.000Z', payload: { body: 'Solo tutor A puede ver esto' },
    }]);
    expect(await screen.findByText('Solo tutor A puede ver esto')).toBeTruthy();

    view.rerender(<ThemeProvider><StaffLiveHelpQueue staffUserId="tutor-b" staffRoles={['tutor']} /></ThemeProvider>);

    await waitFor(() => expect(activeSocket.disconnect).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Solo tutor A puede ver esto')).toBeNull();
    activeSocket.options.onEvents([{
      seq: 2, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:02:00.000Z', payload: { body: 'Callback tardío de A' },
    }]);
    expect(screen.queryByText('Callback tardío de A')).toBeNull();
  });

  it('descarta una carga de cola que llega después de perder el rol de formador', async () => {
    let resolveFirst: ((value: Array<typeof queuedSession>) => void) | undefined;
    api.staffSessions
      .mockImplementationOnce(() => new Promise<Array<typeof queuedSession>>((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce([]);
    const view = render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);
    await waitFor(() => expect(api.staffSessions).toHaveBeenCalledTimes(1));

    view.rerender(<ThemeProvider><StaffLiveHelpQueue staffUserId="tutor-a" staffRoles={[]} /></ThemeProvider>);
    resolveFirst?.([queuedSession]);

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Abrir solicitud de learner-1' })).toBeNull());
  });

  it('drena todas las páginas antes de abrir el socket de la sesión', async () => {
    const active = { ...queuedSession, status: 'active' as const };
    api.staffSessions.mockResolvedValue([active]);
    api.events
      .mockResolvedValueOnce({
        items: [{ seq: 1, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:01:00.000Z', payload: { body: 'primero' } }],
        lastSeq: 1, hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ seq: 2, type: 'chat', actorRole: 'tutor', createdAt: '2026-08-30T12:02:00.000Z', payload: { body: 'segundo' } }],
        lastSeq: 2, hasMore: false,
      });
    render(<ThemeProvider><StaffLiveHelpQueue {...staffIdentity} /></ThemeProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir solicitud de learner-1' }));

    await waitFor(() => expect(api.events).toHaveBeenNthCalledWith(2, 'session-1', 1));
    expect(socket.LiveHelpSocket.instances[0]?.options.lastSeq).toBe(2);
    expect(screen.getByText('segundo')).toBeTruthy();
  });
});
