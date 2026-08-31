import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '../auth/AuthSessionProvider';
import { drainLiveHelpEvents, liveHelpApi } from '../services/liveHelpApi';
import { LearnerLiveHelpPanel } from './LearnerLiveHelpPanel';
import type { LiveHelpConnectionState } from './socket';
import { LiveHelpSocket } from './socket';
import { liveHelpContextKey, type ClientFrame, type LiveHelpContext, type LiveHelpEvent, type LiveHelpProposalEvent, type LiveHelpSession, type LiveHelpSnapshotPayload } from './protocol';
import type { PatchProposalOutcome } from './workspace';

export interface LiveHelpWorkspaceAdapter {
  getContext(): LiveHelpContext;
  captureSnapshot(): LiveHelpSnapshotPayload;
  applyProposal(event: LiveHelpProposalEvent): PatchProposalOutcome;
}

interface LiveHelpContextValue {
  canUseLiveHelp: boolean;
  session: LiveHelpSession | null;
  events: readonly LiveHelpEvent[];
  workspaceMatchesSession: boolean;
  connectionState: LiveHelpConnectionState;
  error: string | null;
  panelOpen: boolean;
  registerWorkspace(adapter: LiveHelpWorkspaceAdapter): () => void;
  openPanel(): void;
  closePanel(): void;
  requestHelp(): Promise<void>;
  acceptSession(): Promise<void>;
  sendChat(body: string): Promise<void>;
  sendSnapshot(): Promise<void>;
  decideProposal(proposalId: string, decision: 'accepted' | 'rejected'): Promise<void>;
  endSession(): Promise<void>;
}

const LiveHelpContext = createContext<LiveHelpContextValue | null>(null);
const CONTEXT_MISMATCH_MESSAGE = 'Vuelve a la actividad donde abriste esta sesión o termínala y solicita una nueva antes de compartir o aplicar código.';

function dedupeEvents(current: readonly LiveHelpEvent[], incoming: readonly LiveHelpEvent[]): LiveHelpEvent[] {
  const bySequence = new Map<number, LiveHelpEvent>();
  for (const event of current) bySequence.set(event.seq, event);
  for (const event of incoming) bySequence.set(event.seq, event);
  return [...bySequence.values()].sort((left, right) => left.seq - right.seq);
}

function isTerminalStatus(status: LiveHelpSession['status']): boolean {
  return status === 'ended' || status === 'cancelled' || status === 'expired';
}

function workspaceMatchesSessionContext(session: LiveHelpSession | null, adapter: LiveHelpWorkspaceAdapter | null): boolean {
  if (!session || !adapter) return false;
  try {
    return liveHelpContextKey(session.context) === liveHelpContextKey(adapter.getContext());
  } catch {
    return false;
  }
}

export function LiveHelpProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthSession();
  const authenticated = auth.status === 'ready' && auth.session.authenticated;
  const studentUserId = authenticated && auth.session.authenticated && auth.session.user.roles.includes('student') ? auth.session.user.id : null;
  const canUseLiveHelp = studentUserId !== null;
  const [workspace, setWorkspace] = useState<LiveHelpWorkspaceAdapter | null>(null);
  const [workspaceRegistrationVersion, setWorkspaceRegistrationVersion] = useState(0);
  const workspaceRef = useRef<LiveHelpWorkspaceAdapter | null>(null);
  const [session, setSession] = useState<LiveHelpSession | null>(null);
  const [events, setEvents] = useState<LiveHelpEvent[]>([]);
  const eventSequenceRef = useRef(0);
  const [connectionState, setConnectionState] = useState<LiveHelpConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const socketRef = useRef<LiveHelpSocket | null>(null);
  const socketSessionIdRef = useRef<string | null>(null);
  const currentStudentRef = useRef<string | null>(studentUserId);
  const sessionOwnerRef = useRef<string | null>(null);
  const sessionRef = useRef<LiveHelpSession | null>(null);
  const identityEpochRef = useRef(0);

  const replaceSession = useCallback((next: LiveHelpSession | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const appendEvents = useCallback((incoming: readonly LiveHelpEvent[]) => {
    if (incoming.length === 0) return;
    setEvents((current) => {
      const next = dedupeEvents(current, incoming);
      eventSequenceRef.current = Math.max(eventSequenceRef.current, ...next.map((event) => event.seq));
      return next;
    });
  }, []);

  const disconnectSocket = useCallback((expected?: LiveHelpSocket) => {
    if (expected && socketRef.current !== expected) return;
    socketRef.current?.disconnect();
    socketRef.current = null;
    socketSessionIdRef.current = null;
    setConnectionState('idle');
  }, []);

  const connectSocket = useCallback((target: LiveHelpSession) => {
    const socketOwnerId = currentStudentRef.current;
    const targetSessionId = target.id;
    disconnectSocket();
    let socket: LiveHelpSocket;
    const isCurrentSocket = () => (
      currentStudentRef.current === socketOwnerId
      && sessionOwnerRef.current === socketOwnerId
      && sessionRef.current?.id === targetSessionId
      && socketRef.current === socket
      && socketSessionIdRef.current === targetSessionId
    );
    const endCurrentSession = () => {
      if (!isCurrentSocket()) return;
      disconnectSocket(socket);
      const current = sessionRef.current;
      if (current?.id === targetSessionId) replaceSession({ ...current, status: 'ended' });
    };
    socket = new LiveHelpSocket({
      sessionId: target.id,
      lastSeq: eventSequenceRef.current,
      getTicket: () => liveHelpApi.createTicket(target.id),
      actorRole: 'student',
      allowedReadyRoles: ['student'],
      onState: (state) => {
        if (!isCurrentSocket()) return;
        if (state === 'offline') {
          socketRef.current = null;
          socketSessionIdRef.current = null;
        }
        setConnectionState(state);
      },
      onFrame: (frame) => {
        if (!isCurrentSocket()) return;
        if (frame.type === 'event' && frame.event.type === 'end') endCurrentSession();
      },
      onEvents: (incoming) => {
        if (!isCurrentSocket()) return;
        appendEvents(incoming);
        if (incoming.some((event) => event.type === 'end')) endCurrentSession();
      },
      onError: (cause) => {
        if (isCurrentSocket()) setError(cause.message);
      },
    });
    socketRef.current = socket;
    socketSessionIdRef.current = targetSessionId;
    void socket.connect().catch((cause: unknown) => {
      if (isCurrentSocket()) setError(cause instanceof Error ? cause.message : 'No pudimos conectar la ayuda en vivo.');
    });
  }, [appendEvents, disconnectSocket, replaceSession]);

  const refreshSessions = useCallback(async () => {
    if (!canUseLiveHelp) return;
    const requesterId = studentUserId;
    const identityEpoch = identityEpochRef.current;
    try {
      const sessions = await liveHelpApi.mySessions();
      if (currentStudentRef.current !== requesterId || identityEpochRef.current !== identityEpoch) return;
      const ownedSession = sessionOwnerRef.current === requesterId ? sessionRef.current : null;
      if (ownedSession && isTerminalStatus(ownedSession.status)) {
        disconnectSocket();
        return;
      }
      const next = ownedSession
        ? sessions.find((candidate) => candidate.id === ownedSession.id) ?? null
        : sessions.find((candidate) => ['active', 'accepted', 'claimed', 'requested'].includes(candidate.status)) ?? null;
      sessionOwnerRef.current = requesterId;
      replaceSession(next);
      if (!next || isTerminalStatus(next.status)) {
        disconnectSocket();
        return;
      }
      if ((next.status === 'accepted' || next.status === 'active') && socketSessionIdRef.current !== next.id) connectSocket(next);
    } catch (cause) {
      // Session discovery runs in the background. A local/dev client can be
      // authenticated in the UI while the optional live-help API is offline;
      // do not turn that background check into a global toast that covers the
      // lesson controls. Explicit actions still surface their own errors.
      if (panelOpen && currentStudentRef.current === requesterId && identityEpochRef.current === identityEpoch) {
        setError(cause instanceof Error ? cause.message : 'No pudimos consultar las sesiones de ayuda en vivo.');
      }
    }
  }, [canUseLiveHelp, connectSocket, disconnectSocket, panelOpen, replaceSession, studentUserId]);

  useEffect(() => {
    if (currentStudentRef.current === studentUserId) return;
    currentStudentRef.current = studentUserId;
    identityEpochRef.current += 1;
    disconnectSocket();
    sessionOwnerRef.current = null;
    replaceSession(null);
    setEvents([]);
    eventSequenceRef.current = 0;
    setError(null);
    setPanelOpen(false);
  }, [disconnectSocket, replaceSession, studentUserId]);

  useEffect(() => {
    if (!canUseLiveHelp) {
      disconnectSocket();
      sessionOwnerRef.current = null;
      replaceSession(null);
      setEvents([]);
      eventSequenceRef.current = 0;
      setError(null);
      setPanelOpen(false);
      return;
    }
    void refreshSessions();
    const timer = window.setInterval(() => void refreshSessions(), 15_000);
    return () => window.clearInterval(timer);
  }, [canUseLiveHelp, disconnectSocket, refreshSessions, replaceSession]);

  useEffect(() => () => disconnectSocket(), [disconnectSocket]);

  const registerWorkspace = useCallback((adapter: LiveHelpWorkspaceAdapter) => {
    workspaceRef.current = adapter;
    setWorkspace(adapter);
    setWorkspaceRegistrationVersion((version) => version + 1);
    return () => {
      if (workspaceRef.current === adapter) {
        workspaceRef.current = null;
        setWorkspace(null);
        setWorkspaceRegistrationVersion((version) => version + 1);
      }
    };
  }, []);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const requireAuthenticated = useCallback(() => {
    if (!authenticated) {
      setError('Inicia sesión antes de solicitar ayuda en vivo.');
      return false;
    }
    if (!canUseLiveHelp) {
      setError('La ayuda en vivo está disponible desde una cuenta de estudiante.');
      return false;
    }
    return true;
  }, [authenticated, canUseLiveHelp]);

  const requestHelp = useCallback(async () => {
    if (!requireAuthenticated()) return;
    const requesterId = studentUserId;
    const identityEpoch = identityEpochRef.current;
    sessionOwnerRef.current = requesterId;
    const adapter = workspaceRef.current;
    if (!adapter) {
      setError('Abre una actividad con editor para solicitar ayuda en vivo.');
      return;
    }
    setError(null);
    setPanelOpen(true);
    try {
      const next = await liveHelpApi.createSession(adapter.getContext());
      if (currentStudentRef.current !== requesterId || identityEpochRef.current !== identityEpoch) return;
      sessionOwnerRef.current = requesterId;
      replaceSession(next);
      setEvents([]);
      eventSequenceRef.current = 0;
    } catch (cause) {
      if (currentStudentRef.current === requesterId && identityEpochRef.current === identityEpoch) setError(cause instanceof Error ? cause.message : 'No pudimos enviar la solicitud de ayuda.');
    }
  }, [replaceSession, requireAuthenticated, studentUserId]);

  const acceptSession = useCallback(async () => {
    if (!requireAuthenticated() || sessionOwnerRef.current !== studentUserId || !session || session.status !== 'claimed') return;
    const requesterId = studentUserId;
    const identityEpoch = identityEpochRef.current;
    const sessionId = session.id;
    const isCurrentAcceptance = () => (
      currentStudentRef.current === requesterId
      && identityEpochRef.current === identityEpoch
      && sessionOwnerRef.current === requesterId
      && sessionRef.current?.id === sessionId
    );
    setError(null);
    try {
      const next = await liveHelpApi.accept(sessionId);
      if (!isCurrentAcceptance()) return;
      sessionOwnerRef.current = requesterId;
      replaceSession(next);
      let endedInReplay = false;
      const lastSeq = await drainLiveHelpEvents(next.id, eventSequenceRef.current, (replay) => {
        if (!isCurrentAcceptance()) return;
        appendEvents(replay.items);
        eventSequenceRef.current = replay.lastSeq;
        if (replay.items.some((event) => event.type === 'end')) {
          endedInReplay = true;
          disconnectSocket();
          const current = sessionRef.current;
          if (current?.id === sessionId) replaceSession({ ...current, status: 'ended' });
        }
      }, () => isCurrentAcceptance() && !endedInReplay);
      if (!isCurrentAcceptance() || lastSeq === null || endedInReplay || isTerminalStatus(sessionRef.current?.status ?? next.status)) return;
      eventSequenceRef.current = lastSeq;
      connectSocket(next);
    } catch (cause) {
      if (isCurrentAcceptance()) setError(cause instanceof Error ? cause.message : 'No pudimos aceptar esta sesión.');
    }
  }, [appendEvents, connectSocket, disconnectSocket, replaceSession, requireAuthenticated, session, studentUserId]);

  const sendFrame = useCallback(async (frame: ClientFrame) => {
    if (!requireAuthenticated()) return;
    try {
      const current = sessionRef.current;
      if (!current || sessionOwnerRef.current !== studentUserId || socketSessionIdRef.current !== current.id) {
        throw new Error('La conexión de ayuda en vivo no está disponible.');
      }
      const socket = socketRef.current;
      if (!socket) throw new Error('La conexión de ayuda en vivo no está disponible.');
      socket.send(frame);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No pudimos enviar el mensaje de ayuda.';
      setError(message);
      throw new Error(message);
    }
  }, [requireAuthenticated, studentUserId]);

  const sendChat = useCallback(async (body: string) => {
    await sendFrame({ type: 'chat', body: body.trim() });
  }, [sendFrame]);

  const sendSnapshot = useCallback(async () => {
    const adapter = workspaceRef.current;
    if (!adapter || !workspaceMatchesSessionContext(sessionRef.current, adapter)) {
      setError(CONTEXT_MISMATCH_MESSAGE);
      throw new Error(CONTEXT_MISMATCH_MESSAGE);
    }
    const snapshot = adapter.captureSnapshot();
    await sendFrame({ type: 'snapshot', ...snapshot });
  }, [sendFrame]);

  const applyProposal = useCallback((event: LiveHelpProposalEvent): PatchProposalOutcome => {
    const adapter = workspaceRef.current;
    if (!adapter || !workspaceMatchesSessionContext(sessionRef.current, adapter)) {
      setError(CONTEXT_MISMATCH_MESSAGE);
      return { outcome: 'conflict' };
    }
    return adapter.applyProposal(event);
  }, []);

  const decideProposal = useCallback(async (proposalId: string, decision: 'accepted' | 'rejected') => {
    await sendFrame({ type: 'patch-decision', proposalId, decision });
  }, [sendFrame]);

  const endSession = useCallback(async () => {
    if (!requireAuthenticated() || sessionOwnerRef.current !== studentUserId || !session) return;
    const requesterId = studentUserId;
    const identityEpoch = identityEpochRef.current;
    const sessionId = session.id;
    setError(null);
    try {
      const next = await liveHelpApi.end(sessionId);
      if (currentStudentRef.current !== requesterId || identityEpochRef.current !== identityEpoch || sessionRef.current?.id !== sessionId) return;
      disconnectSocket();
      sessionOwnerRef.current = requesterId;
      replaceSession(next);
    } catch (cause) {
      if (currentStudentRef.current === requesterId && identityEpochRef.current === identityEpoch && sessionRef.current?.id === sessionId) setError(cause instanceof Error ? cause.message : 'No pudimos terminar la sesión.');
    }
  }, [disconnectSocket, replaceSession, requireAuthenticated, session, studentUserId]);

  const hasCurrentSessionOwner = sessionOwnerRef.current === studentUserId;
  const exposedSession = hasCurrentSessionOwner ? session : null;
  const exposedEvents = hasCurrentSessionOwner ? events : [];
  const exposedError = currentStudentRef.current === studentUserId ? error : null;
  const workspaceMatchesSession = useMemo(
    () => workspaceMatchesSessionContext(exposedSession, workspace),
    [exposedSession, workspace, workspaceRegistrationVersion],
  );

  const value = useMemo<LiveHelpContextValue>(() => ({
    canUseLiveHelp, session: exposedSession, events: exposedEvents, workspaceMatchesSession, connectionState, error: exposedError, panelOpen, registerWorkspace, openPanel, closePanel,
    requestHelp, acceptSession, sendChat, sendSnapshot, decideProposal, endSession,
  }), [acceptSession, canUseLiveHelp, closePanel, connectionState, decideProposal, endSession, exposedError, exposedEvents, exposedSession, openPanel, panelOpen, registerWorkspace, requestHelp, sendChat, sendSnapshot, workspaceMatchesSession]);

  return (
    <LiveHelpContext.Provider value={value}>
      {children}
      {!panelOpen && exposedError && <p className="live-help-global-error" role="alert">{exposedError}</p>}
      {canUseLiveHelp && panelOpen && <LearnerLiveHelpPanel
        session={exposedSession}
        workspaceMatchesSession={workspaceMatchesSession}
        connectionState={connectionState}
        events={exposedEvents}
        error={exposedError}
        onClose={closePanel}
        onRequest={requestHelp}
        onAccept={acceptSession}
        onSendChat={sendChat}
        onSendSnapshot={sendSnapshot}
        onDecision={decideProposal}
        onApplyProposal={applyProposal}
        onEnd={endSession}
      />}
    </LiveHelpContext.Provider>
  );
}

export function useLiveHelp(): LiveHelpContextValue {
  const value = useContext(LiveHelpContext);
  if (!value) throw new Error('useLiveHelp debe usarse dentro de LiveHelpProvider.');
  return value;
}

export function useOptionalLiveHelp(): LiveHelpContextValue | null {
  return useContext(LiveHelpContext);
}
