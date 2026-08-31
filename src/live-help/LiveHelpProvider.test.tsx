// @vitest-environment happy-dom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../themes/ThemeProvider';
import type { WorkspaceSnapshot } from '../types/scrim';
import { LiveHelpProvider, type LiveHelpWorkspaceAdapter, useLiveHelp } from './LiveHelpProvider';
import { LiveHelpWorkspaceBridge } from './LiveHelpWorkspaceBridge';

const auth = vi.hoisted(() => ({ useAuthSession: vi.fn() }));
const api = vi.hoisted(() => ({ mySessions: vi.fn(), accept: vi.fn(), events: vi.fn() }));
const learnerPanel = vi.hoisted(() => ({ props: [] as any[] }));
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

vi.mock('../auth/AuthSessionProvider', () => ({ useAuthSession: auth.useAuthSession }));
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
vi.mock('./LearnerLiveHelpPanel', () => ({
  LearnerLiveHelpPanel: (props: any) => {
    learnerPanel.props.push(props);
    return null;
  },
}));

function Probe() {
  const liveHelp = useLiveHelp();
  return <><span>{liveHelp.canUseLiveHelp ? 'Disponible para estudiante' : 'No disponible'}</span><button type="button" onClick={() => void liveHelp.requestHelp()}>Solicitar desde prueba</button></>;
}

function SessionProbe() {
  const liveHelp = useLiveHelp();
  return <><span>{liveHelp.session?.id ?? 'Sin sesión'}</span><span>Eventos {liveHelp.events.length}</span></>;
}

function PanelProbe() {
  const liveHelp = useLiveHelp();
  return <button type="button" onClick={liveHelp.openPanel}>Abrir panel de prueba</button>;
}

function AcceptProbe() {
  const liveHelp = useLiveHelp();
  return <button type="button" onClick={() => void liveHelp.acceptSession()}>Aceptar desde prueba</button>;
}

function ChatProbe() {
  const liveHelp = useLiveHelp();
  return <button type="button" onClick={() => void liveHelp.sendChat('Hola desde B').catch(() => undefined)}>Enviar chat desde prueba</button>;
}

function WorkspaceProbe({ adapter }: { adapter: LiveHelpWorkspaceAdapter }) {
  const { registerWorkspace } = useLiveHelp();
  React.useEffect(() => registerWorkspace(adapter), [adapter, registerWorkspace]);
  return null;
}

function WorkspaceMatchProbe() {
  const { workspaceMatchesSession } = useLiveHelp();
  return <span>{workspaceMatchesSession ? 'Espacio de trabajo coincide' : 'Espacio de trabajo distinto'}</span>;
}

function workspaceSnapshot(content: string): WorkspaceSnapshot {
  return {
    activeFilePath: 'app.js',
    files: {
      'app.js': { name: 'app.js', path: 'app.js', content, language: 'javascript' },
    },
  };
}

const requestedSession = {
  id: 'session-a', learnerUserId: 'student-a', claimedByUserId: null, claimedRole: null, status: 'requested' as const,
  context: { courseSlug: 'fundamentos', lessonKey: 'fundamentos-01', surface: 'lesson' as const },
  expiresAt: '2026-08-30T13:00:00.000Z', createdAt: '2026-08-30T12:00:00.000Z', updatedAt: '2026-08-30T12:00:00.000Z',
};

function studentSession(id: string) {
  return {
    status: 'ready' as const,
    session: {
      authenticated: true as const,
      user: { id, email: `${id}@example.com`, displayName: id, roles: ['student'] },
      csrfToken: 'csrf-live-help-test-token',
    },
    error: null,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  socket.LiveHelpSocket.instances.length = 0;
  learnerPanel.props.length = 0;
});

describe('provider de ayuda en vivo', () => {
  it('no consulta ni crea una sesión si la persona no inició sesión', () => {
    auth.useAuthSession.mockReturnValue({
      status: 'ready', session: { authenticated: false, providers: ['google'] }, error: null,
    });
    render(<LiveHelpProvider><Probe /></LiveHelpProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar desde prueba' }));

    expect(screen.getByRole('alert').textContent).toContain('Inicia sesión antes de solicitar ayuda en vivo');
    expect(api.mySessions).not.toHaveBeenCalled();
  });

  it('no consulta sesiones de estudiante ni expone ayuda de alumna a un formador', () => {
    auth.useAuthSession.mockReturnValue({
      status: 'ready', session: {
        authenticated: true,
        user: { id: 'tutor-1', email: 'tutor@example.com', displayName: 'Formador', roles: ['tutor'] },
        csrfToken: 'csrf-live-help-test-token',
      }, error: null,
    });
    render(<LiveHelpProvider><Probe /></LiveHelpProvider>);

    expect(screen.getByText('No disponible')).toBeTruthy();
    expect(api.mySessions).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar desde prueba' }));
    expect(screen.getByRole('alert').textContent).toContain('cuenta de estudiante');
  });

  it('aísla sesión y eventos cuando cambia la identidad de estudiante A a B', async () => {
    let currentAuth = studentSession('student-a');
    auth.useAuthSession.mockImplementation(() => currentAuth);
    api.mySessions.mockResolvedValueOnce([{ ...requestedSession, status: 'active' }]).mockResolvedValueOnce([]);
    const view = render(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    expect(await screen.findByText('session-a')).toBeTruthy();
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    socket.LiveHelpSocket.instances[0]?.options.onEvents([{
      seq: 1, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:01:00.000Z', payload: { body: 'Mi código no corre' },
    }]);
    expect(await screen.findByText('Eventos 1')).toBeTruthy();
    currentAuth = studentSession('student-b');
    view.rerender(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    await waitFor(() => expect(screen.getByText('Sin sesión')).toBeTruthy());
    expect(screen.getByText('Eventos 0')).toBeTruthy();
    expect(socket.LiveHelpSocket.instances[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('no entrega al panel props de A durante el cambio de identidad a B', async () => {
    let currentAuth = studentSession('student-a');
    auth.useAuthSession.mockImplementation(() => currentAuth);
    api.mySessions.mockResolvedValueOnce([{ ...requestedSession, status: 'active' }]).mockResolvedValueOnce([]);
    const view = render(<LiveHelpProvider><PanelProbe /></LiveHelpProvider>);

    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    socket.LiveHelpSocket.instances[0]?.options.onEvents([{
      seq: 1, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:01:00.000Z', payload: { body: 'Solo A ve esto' },
    }]);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir panel de prueba' }));
    await waitFor(() => expect(learnerPanel.props.at(-1)?.events).toHaveLength(1));

    currentAuth = studentSession('student-b');
    view.rerender(<LiveHelpProvider><PanelProbe /></LiveHelpProvider>);

    await waitFor(() => expect(learnerPanel.props.some((props) => props.session === null && props.events.length === 0)).toBe(true));
  });

  it('envía mensajes con la identidad actual después de cambiar de estudiante A a B', async () => {
    let currentAuth = studentSession('student-a');
    auth.useAuthSession.mockImplementation(() => currentAuth);
    const sessionB = { ...requestedSession, id: 'session-b', learnerUserId: 'student-b', status: 'active' as const };
    api.mySessions.mockResolvedValueOnce([{ ...requestedSession, status: 'active' }]).mockResolvedValueOnce([sessionB]);
    const view = render(<LiveHelpProvider><SessionProbe /><ChatProbe /></LiveHelpProvider>);

    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    currentAuth = studentSession('student-b');
    view.rerender(<LiveHelpProvider><SessionProbe /><ChatProbe /></LiveHelpProvider>);
    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar chat desde prueba' }));

    await waitFor(() => expect(socket.LiveHelpSocket.instances[1]?.send).toHaveBeenCalledWith({ type: 'chat', body: 'Hola desde B' }));
  });

  it('cierra el socket al llegar end y no deja un reconector activo', async () => {
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'active' }]);
    render(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    const activeSocket = socket.LiveHelpSocket.instances[0]!;
    activeSocket.options.onFrame({
      type: 'event',
      event: { seq: 1, type: 'end', actorRole: 'tutor', createdAt: '2026-08-30T12:02:00.000Z', payload: {} },
    });

    await waitFor(() => expect(activeSocket.disconnect).toHaveBeenCalledTimes(1));
    expect(activeSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('cierra el socket cuando el sondeo informa un estado terminal', async () => {
    vi.useFakeTimers();
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions
      .mockResolvedValueOnce([{ ...requestedSession, status: 'active' }])
      .mockResolvedValueOnce([{ ...requestedSession, status: 'cancelled' }]);
    render(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    await vi.advanceTimersByTimeAsync(0);
    expect(socket.LiveHelpSocket.instances).toHaveLength(1);
    const activeSocket = socket.LiveHelpSocket.instances[0]!;
    await vi.advanceTimersByTimeAsync(15_000);

    expect(activeSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(activeSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('conserva el chat pero bloquea snapshot y aplicación al cambiar de actividad A a B, incluso con revisión 0', async () => {
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'active' }]);
    const proposal = {
      seq: 1, type: 'patch-proposal', actorRole: 'tutor', proposalId: '30000000-0000-4000-8000-000000000003',
      createdAt: '2026-08-30T12:01:00.000Z', payload: {
        summary: 'Cambio de A', patch: { baseRevision: 0, files: [{ path: 'app.js', content: 'const actividad = "A";' }] },
      },
    } as const;
    const adapterA = {
      getContext: () => requestedSession.context,
      captureSnapshot: vi.fn(() => ({ revision: 0, activeFile: 'app.js', files: [{ path: 'app.js', content: 'A' }] })),
      applyProposal: vi.fn(() => ({ outcome: 'applied' as const, revision: 1 })),
    };
    const adapterB = {
      getContext: () => ({ courseSlug: 'fundamentos', lessonKey: 'fundamentos-02', surface: 'lesson' as const }),
      captureSnapshot: vi.fn(() => ({ revision: 0, activeFile: 'app.js', files: [{ path: 'app.js', content: 'B' }] })),
      applyProposal: vi.fn(() => ({ outcome: 'applied' as const, revision: 1 })),
    };
    const view = render(<LiveHelpProvider><PanelProbe /><WorkspaceProbe adapter={adapterA} /></LiveHelpProvider>);

    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir panel de prueba' }));
    await waitFor(() => expect(learnerPanel.props.at(-1)?.session?.id).toBe('session-a'));

    view.rerender(<LiveHelpProvider><PanelProbe /><WorkspaceProbe adapter={adapterB} /></LiveHelpProvider>);
    await waitFor(() => expect(learnerPanel.props.at(-1)?.onSendSnapshot).toBeTruthy());
    const panel = learnerPanel.props.at(-1)!;
    await expect(panel.onSendSnapshot()).rejects.toThrow('Vuelve a la actividad');
    expect(panel.onApplyProposal(proposal)).toEqual({ outcome: 'conflict' });
    expect(adapterB.captureSnapshot).not.toHaveBeenCalled();
    expect(adapterB.applyProposal).not.toHaveBeenCalled();

    await panel.onSendChat('El chat sí continúa');
    expect(socket.LiveHelpSocket.instances[0]?.send).toHaveBeenCalledWith({ type: 'chat', body: 'El chat sí continúa' });
  });

  it('actualiza visualmente la coincidencia cuando el puente cambia de contexto sin desmontarse', async () => {
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'active' }]);
    const onWorkspaceChange = vi.fn();
    const contextB = { courseSlug: 'fundamentos', lessonKey: 'fundamentos-02', surface: 'lesson' as const };
    const view = render(
      <ThemeProvider><LiveHelpProvider><WorkspaceMatchProbe /><LiveHelpWorkspaceBridge context={requestedSession.context} workspace={workspaceSnapshot('const actividad = "A";')} onWorkspaceChange={onWorkspaceChange} /></LiveHelpProvider></ThemeProvider>,
    );

    expect(await screen.findByText('Espacio de trabajo coincide')).toBeTruthy();

    view.rerender(
      <ThemeProvider><LiveHelpProvider><WorkspaceMatchProbe /><LiveHelpWorkspaceBridge context={contextB} workspace={workspaceSnapshot('const actividad = "B";')} onWorkspaceChange={onWorkspaceChange} /></LiveHelpProvider></ThemeProvider>,
    );

    expect(await screen.findByText('Espacio de trabajo distinto')).toBeTruthy();
  });

  it('drena el replay HTTP completo al aceptar y conecta desde la última secuencia segura', async () => {
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'claimed' }]);
    api.accept.mockResolvedValue({ ...requestedSession, status: 'active' });
    api.events
      .mockResolvedValueOnce({
        items: [{ seq: 1, type: 'chat', actorRole: 'student', createdAt: '2026-08-30T12:01:00.000Z', payload: { body: 'primero' } }],
        lastSeq: 1, hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ seq: 2, type: 'chat', actorRole: 'tutor', createdAt: '2026-08-30T12:02:00.000Z', payload: { body: 'segundo' } }],
        lastSeq: 2, hasMore: false,
      });
    render(<LiveHelpProvider><AcceptProbe /><SessionProbe /></LiveHelpProvider>);

    expect(await screen.findByText('session-a')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar desde prueba' }));

    await waitFor(() => expect(api.events).toHaveBeenNthCalledWith(2, 'session-a', 1));
    expect(socket.LiveHelpSocket.instances[0]?.options.lastSeq).toBe(2);
    expect(screen.getByText('Eventos 2')).toBeTruthy();
  });

  it('procesa end recibido dentro de replay y no permite que ese socket quede vivo', async () => {
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'active' }]);
    render(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    await waitFor(() => expect(socket.LiveHelpSocket.instances).toHaveLength(1));
    const activeSocket = socket.LiveHelpSocket.instances[0]!;
    activeSocket.options.onEvents([{
      seq: 1, type: 'end', actorRole: 'tutor', createdAt: '2026-08-30T12:02:00.000Z', payload: {},
    }]);

    await waitFor(() => expect(activeSocket.disconnect).toHaveBeenCalledTimes(1));
    expect(screen.getByText('session-a')).toBeTruthy();
  });

  it('libera el socket offline para que el sondeo vuelva a conectar la sesión activa', async () => {
    vi.useFakeTimers();
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'active' }]);
    render(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    await vi.advanceTimersByTimeAsync(0);
    const firstSocket = socket.LiveHelpSocket.instances[0]!;
    firstSocket.options.onState('offline');
    await vi.advanceTimersByTimeAsync(15_000);

    expect(socket.LiveHelpSocket.instances).toHaveLength(2);
  });

  it('ignora un end tardío del socket reemplazado por el mismo canal de sesión', async () => {
    vi.useFakeTimers();
    auth.useAuthSession.mockReturnValue(studentSession('student-a'));
    api.mySessions.mockResolvedValue([{ ...requestedSession, status: 'active' }]);
    render(<LiveHelpProvider><SessionProbe /></LiveHelpProvider>);

    await vi.advanceTimersByTimeAsync(0);
    const oldSocket = socket.LiveHelpSocket.instances[0]!;
    oldSocket.options.onState('offline');
    await vi.advanceTimersByTimeAsync(15_000);
    const replacement = socket.LiveHelpSocket.instances[1]!;

    oldSocket.options.onFrame({
      type: 'event',
      event: { seq: 1, type: 'end', actorRole: 'tutor', createdAt: '2026-08-30T12:02:00.000Z', payload: {} },
    });

    expect(replacement.disconnect).not.toHaveBeenCalled();
    expect(screen.getByText('session-a')).toBeTruthy();
  });
});
