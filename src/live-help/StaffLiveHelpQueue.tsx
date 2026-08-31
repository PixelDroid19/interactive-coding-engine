import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileCode2, Headphones, RefreshCw, Send, UserRound } from 'lucide-react';
import { drainLiveHelpEvents, liveHelpApi } from '../services/liveHelpApi';
import { useTheme } from '../themes/ThemeProvider';
import type { LiveHelpConnectionState } from './socket';
import { LiveHelpSocket } from './socket';
import { isLiveHelpStaffRole, type LiveHelpActorRole, type LiveHelpEvent, type LiveHelpSession, type LiveHelpSnapshotPayload } from './protocol';

export interface StaffLiveHelpQueueProps {
  staffUserId: string | null;
  staffRoles: readonly LiveHelpActorRole[];
}

function contextLabel(session: LiveHelpSession): string {
  return `${session.context.courseSlug} · ${session.context.lessonKey ?? session.context.surface}`;
}

function mergeEvents(current: readonly LiveHelpEvent[], incoming: readonly LiveHelpEvent[]): LiveHelpEvent[] {
  const bySequence = new Map<number, LiveHelpEvent>();
  for (const event of current) bySequence.set(event.seq, event);
  for (const event of incoming) bySequence.set(event.seq, event);
  return [...bySequence.values()].sort((left, right) => left.seq - right.seq);
}

function snapshotFromEvents(events: readonly LiveHelpEvent[]): LiveHelpSnapshotPayload | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type === 'snapshot' && event.actorRole === 'student') return event.payload;
  }
  return null;
}

function chatFromEvent(event: LiveHelpEvent): string | null {
  return event.type === 'chat' ? event.payload.body : null;
}

function isTerminal(session: LiveHelpSession): boolean {
  return session.status === 'ended' || session.status === 'cancelled' || session.status === 'expired';
}

function staffRole(roles: readonly LiveHelpActorRole[]): 'tutor' | 'admin' | null {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('tutor')) return 'tutor';
  return null;
}

function identityKey(userId: string | null, roles: readonly LiveHelpActorRole[]): string {
  return `${userId ?? ''}\u0000${roles.filter(isLiveHelpStaffRole).slice().sort().join(',')}`;
}

export function StaffLiveHelpQueue({ staffUserId, staffRoles }: StaffLiveHelpQueueProps) {
  const { themeId } = useTheme();
  const currentStaffRole = staffRole(staffRoles);
  const staffIdentityKey = identityKey(staffUserId, staffRoles);
  const canUseQueue = Boolean(staffUserId && currentStaffRole);
  const identityRef = useRef(staffIdentityKey);
  const identityEpochRef = useRef(0);
  const identityChanged = identityRef.current !== staffIdentityKey;
  if (identityChanged) {
    identityRef.current = staffIdentityKey;
    identityEpochRef.current += 1;
  }

  const [sessions, setSessions] = useState<LiveHelpSession[]>([]);
  const [selected, setSelected] = useState<LiveHelpSession | null>(null);
  const [events, setEvents] = useState<LiveHelpEvent[]>([]);
  const [connectionState, setConnectionState] = useState<LiveHelpConnectionState>('idle');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [proposalContent, setProposalContent] = useState('');
  const sequenceRef = useRef(0);
  const socketRef = useRef<LiveHelpSocket | null>(null);
  const socketSessionIdRef = useRef<string | null>(null);
  const selectedSessionIdRef = useRef<string | null>(null);
  const selectedRef = useRef<LiveHelpSession | null>(null);

  const isCurrentIdentity = useCallback((expectedIdentity: string, expectedEpoch: number) => (
    canUseQueue && identityRef.current === expectedIdentity && identityEpochRef.current === expectedEpoch
  ), [canUseQueue]);

  const disconnectSocket = useCallback((expected?: LiveHelpSocket) => {
    if (expected && socketRef.current !== expected) return;
    socketRef.current?.disconnect();
    socketRef.current = null;
    socketSessionIdRef.current = null;
    setConnectionState('idle');
  }, []);

  const setSelectedSession = useCallback((next: LiveHelpSession | null) => {
    selectedRef.current = next;
    selectedSessionIdRef.current = next?.id ?? null;
    setSelected(next);
  }, []);

  const clearSessionState = useCallback(() => {
    setSelectedSession(null);
    setEvents([]);
    sequenceRef.current = 0;
    setMessage('');
    setSummary('');
    setTargetPath('');
    setProposalContent('');
    setBusy(false);
  }, [setSelectedSession]);

  const resetSession = useCallback((target: LiveHelpSession) => {
    disconnectSocket();
    setSelectedSession(target);
    setEvents([]);
    sequenceRef.current = 0;
    setMessage('');
    setSummary('');
    setTargetPath('');
    setProposalContent('');
    setError(null);
    setBusy(false);
  }, [disconnectSocket, setSelectedSession]);

  const appendEvents = useCallback((incoming: readonly LiveHelpEvent[]) => {
    if (incoming.length === 0) return;
    setEvents((current) => {
      const next = mergeEvents(current, incoming);
      sequenceRef.current = Math.max(sequenceRef.current, ...next.map((event) => event.seq));
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    if (!canUseQueue) return;
    const expectedIdentity = identityRef.current;
    const expectedEpoch = identityEpochRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await liveHelpApi.staffSessions();
      if (!isCurrentIdentity(expectedIdentity, expectedEpoch)) return;
      setSessions(next);
      const current = selectedRef.current;
      const refreshed = current ? next.find((candidate) => candidate.id === current.id) ?? current : null;
      if (refreshed && isTerminal(refreshed)) disconnectSocket();
      selectedRef.current = refreshed;
      selectedSessionIdRef.current = refreshed?.id ?? null;
      setSelected(refreshed);
    } catch (cause) {
      if (isCurrentIdentity(expectedIdentity, expectedEpoch)) setError(cause instanceof Error ? cause.message : 'No pudimos cargar la cola de ayuda en vivo.');
    } finally {
      if (isCurrentIdentity(expectedIdentity, expectedEpoch)) setLoading(false);
    }
  }, [canUseQueue, disconnectSocket, isCurrentIdentity]);

  const openSession = useCallback(async (target: LiveHelpSession) => {
    if (!canUseQueue || !currentStaffRole) return;
    const expectedIdentity = identityRef.current;
    const expectedEpoch = identityEpochRef.current;
    const sessionId = target.id;
    const isCurrentSelection = () => (
      isCurrentIdentity(expectedIdentity, expectedEpoch) && selectedSessionIdRef.current === sessionId
    );
    resetSession(target);
    if (target.status !== 'accepted' && target.status !== 'active') return;
    setBusy(true);
    try {
      let endedInReplay = false;
      const lastSeq = await drainLiveHelpEvents(target.id, 0, (replay) => {
        if (!isCurrentSelection()) return;
        appendEvents(replay.items);
        sequenceRef.current = replay.lastSeq;
        if (replay.items.some((event) => event.type === 'end')) {
          endedInReplay = true;
          disconnectSocket();
          const ended = { ...target, status: 'ended' as const };
          setSelectedSession(ended);
          setSessions((current) => current.map((candidate) => candidate.id === sessionId ? ended : candidate));
        }
      }, () => isCurrentSelection() && !endedInReplay);
      if (!isCurrentSelection() || lastSeq === null || endedInReplay) return;
      sequenceRef.current = lastSeq;
      let socket: LiveHelpSocket;
      const isCurrentSocket = () => (
        isCurrentSelection()
        && socketRef.current === socket
        && socketSessionIdRef.current === sessionId
      );
      const endCurrentSession = () => {
        if (!isCurrentSocket()) return;
        disconnectSocket(socket);
        const current = selectedRef.current;
        const ended = current?.id === sessionId ? { ...current, status: 'ended' as const } : null;
        if (ended) setSelectedSession(ended);
        setSessions((currentSessions) => currentSessions.map((candidate) => candidate.id === sessionId ? { ...candidate, status: 'ended' as const } : candidate));
      };
      socket = new LiveHelpSocket({
        sessionId,
        lastSeq,
        getTicket: () => liveHelpApi.createTicket(sessionId),
        actorRole: currentStaffRole,
        allowedReadyRoles: staffRoles.filter(isLiveHelpStaffRole),
        onState: (state) => {
          if (!isCurrentSocket()) return;
          if (state === 'offline') {
            socketRef.current = null;
            socketSessionIdRef.current = null;
          }
          setConnectionState(state);
        },
        onFrame: (frame) => {
          if (isCurrentSocket() && frame.type === 'event' && frame.event.type === 'end') endCurrentSession();
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
      socketSessionIdRef.current = sessionId;
      await socket.connect();
    } catch (cause) {
      if (isCurrentSelection()) setError(cause instanceof Error ? cause.message : 'No pudimos abrir esta sesión.');
    } finally {
      if (isCurrentSelection()) setBusy(false);
    }
  }, [appendEvents, canUseQueue, currentStaffRole, disconnectSocket, isCurrentIdentity, resetSession, setSelectedSession, staffRoles]);

  useEffect(() => {
    disconnectSocket();
    clearSessionState();
    setSessions([]);
    setError(null);
    if (!canUseQueue) {
      setLoading(false);
      return;
    }
    void load();
  }, [canUseQueue, clearSessionState, disconnectSocket, load, staffIdentityKey]);

  useEffect(() => {
    if (!canUseQueue) return;
    const timer = window.setInterval(() => {
      void load().then(() => {
        const current = selectedRef.current;
        if (current && (current.status === 'accepted' || current.status === 'active') && !socketRef.current) void openSession(current);
      });
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [canUseQueue, load, openSession]);

  useEffect(() => () => disconnectSocket(), [disconnectSocket]);

  const claim = useCallback(async (target: LiveHelpSession) => {
    if (!canUseQueue) return;
    const expectedIdentity = identityRef.current;
    const expectedEpoch = identityEpochRef.current;
    setBusy(true);
    setError(null);
    try {
      const next = await liveHelpApi.claim(target.id);
      if (!isCurrentIdentity(expectedIdentity, expectedEpoch)) return;
      setSessions((current) => current.map((candidate) => candidate.id === next.id ? next : candidate));
      resetSession(next);
    } catch (cause) {
      if (isCurrentIdentity(expectedIdentity, expectedEpoch)) setError(cause instanceof Error ? cause.message : 'No pudimos reclamar la solicitud.');
    } finally {
      if (isCurrentIdentity(expectedIdentity, expectedEpoch)) setBusy(false);
    }
  }, [canUseQueue, isCurrentIdentity, resetSession]);

  const latestSnapshot = useMemo(() => snapshotFromEvents(events), [events]);
  useEffect(() => {
    const first = latestSnapshot?.files[0];
    if (!first || targetPath) return;
    setTargetPath(first.path);
    setProposalContent(first.content);
  }, [latestSnapshot, targetPath]);

  const sendChat = (event: React.FormEvent) => {
    event.preventDefault();
    const body = message.trim();
    if (!body || !canUseQueue) return;
    try {
      const socket = socketRef.current;
      if (!socket) throw new Error('La conexión de ayuda en vivo no está disponible.');
      socket.send({ type: 'chat', body });
      setMessage('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos enviar el mensaje.');
    }
  };

  const chooseFile = (path: string) => {
    setTargetPath(path);
    const file = latestSnapshot?.files.find((candidate) => candidate.path === path);
    setProposalContent(file?.content ?? '');
  };

  const sendProposal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!latestSnapshot || !targetPath || !summary.trim() || !canUseQueue) return;
    try {
      const socket = socketRef.current;
      if (!socket) throw new Error('La conexión de ayuda en vivo no está disponible.');
      socket.send({
        type: 'patch-proposal',
        proposalId: crypto.randomUUID(),
        summary: summary.trim(),
        targetPath,
        patch: {
          baseRevision: latestSnapshot.revision,
          files: [{ path: targetPath, content: proposalContent }],
        },
      });
      setSummary('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos enviar la propuesta.');
    }
  };

  const end = useCallback(async () => {
    if (!selected || !canUseQueue) return;
    const expectedIdentity = identityRef.current;
    const expectedEpoch = identityEpochRef.current;
    const sessionId = selected.id;
    const isCurrentEnd = () => isCurrentIdentity(expectedIdentity, expectedEpoch) && selectedSessionIdRef.current === sessionId;
    setBusy(true);
    try {
      const next = await liveHelpApi.end(sessionId);
      if (!isCurrentEnd()) return;
      disconnectSocket();
      setSelectedSession(next);
      setSessions((current) => current.map((candidate) => candidate.id === next.id ? next : candidate));
    } catch (cause) {
      if (isCurrentEnd()) setError(cause instanceof Error ? cause.message : 'No pudimos terminar la sesión.');
    } finally {
      if (isCurrentEnd()) setBusy(false);
    }
  }, [canUseQueue, disconnectSocket, isCurrentIdentity, selected, setSelectedSession]);

  const messages = events.map((event) => ({ event, body: chatFromEvent(event) })).filter((item): item is { event: LiveHelpEvent; body: string } => item.body !== null);

  if (!canUseQueue || identityChanged) return null;

  return <section className={`staff-live-help${themeId === 'cyber' ? ' staff-live-help--cyber' : ''}`} aria-label="Ayuda en vivo">
    <header className="staff-live-help__heading"><div><span>Ayuda en vivo</span><h2>Solicitudes de ayuda</h2><p>Reclama una sesión y trabaja sobre una copia. Las propuestas nunca escriben en el editor de la alumna por sí solas.</p></div><button type="button" onClick={() => void load()} aria-label="Actualizar cola de ayuda" disabled={loading || busy}><RefreshCw size={16} /></button></header>
    {error && <p className="staff-live-help__error" role="alert">{error}</p>}
    <div className="staff-live-help__layout">
      <aside className="staff-live-help__queue" aria-label="Solicitudes pendientes">
        {loading && <p role="status">Cargando solicitudes…</p>}
        {!loading && sessions.length === 0 && <p>No hay solicitudes de ayuda pendientes.</p>}
        {sessions.map((item) => <article key={item.id} className={selected?.id === item.id ? 'is-selected' : ''}><button type="button" aria-label={`Abrir solicitud de ${item.learnerUserId}`} onClick={() => void openSession(item)}><span><UserRound size={14} /> Alumna {item.learnerUserId.slice(0, 8)}</span><strong>{contextLabel(item)}</strong><small>{item.status === 'requested' ? 'Nueva solicitud' : item.status === 'claimed' ? 'Sesión reclamada' : item.status === 'accepted' ? 'Consentimiento confirmado' : item.status === 'active' ? 'Sesión activa' : 'Finalizada'}</small></button>{item.status === 'requested' && <button type="button" className="staff-live-help__claim" onClick={() => void claim(item)} disabled={busy}>Reclamar solicitud</button>}</article>)}
      </aside>
      <main className="staff-live-help__session">
        {!selected && <div className="staff-live-help__empty"><Headphones size={25} /><p>Selecciona una solicitud para preparar una sesión.</p></div>}
        {selected?.status === 'claimed' && <div className="staff-live-help__empty"><CheckCircle2 size={25} /><h3>Sesión reclamada</h3><p>Esperamos el consentimiento de la alumna antes de abrir el canal.</p></div>}
        {(selected?.status === 'accepted' || selected?.status === 'active') && <>
          <header className="staff-live-help__session-header"><div><span>Sesión con alumna {selected.learnerUserId.slice(0, 8)}</span><small>{connectionState === 'connected' ? 'En línea' : connectionState === 'reconnecting' ? 'Reconectando…' : 'Conectando…'}</small></div><button type="button" onClick={() => void end()} disabled={busy}>Terminar sesión</button></header>
          <div className="staff-live-help__columns">
            <section className="staff-live-help__conversation" aria-label="Chat de ayuda">
              <h3>Chat</h3>
              <div>{messages.length === 0 ? <p>Aún no hay mensajes.</p> : messages.map(({ event, body }) => <article key={event.seq} className={event.actorRole === 'student' ? 'is-learner' : 'is-staff'}><strong>{event.actorRole === 'student' ? 'Alumna' : 'Tú'}</strong><p>{body}</p></article>)}</div>
              <form onSubmit={sendChat}><label htmlFor="staff-live-help-message">Mensaje para la alumna</label><textarea id="staff-live-help-message" value={message} maxLength={4000} onChange={(event) => setMessage(event.target.value)} /><button type="submit" disabled={!message.trim()}><Send size={15} /> Enviar</button></form>
            </section>
            <section className="staff-live-help__workspace" aria-label="Copia de trabajo">
              <h3><FileCode2 size={16} /> Copia de trabajo</h3>
              {!latestSnapshot && <p>La alumna aún no compartió una copia del código.</p>}
              {latestSnapshot && <><p>Revisión {latestSnapshot.revision}. Esta copia es de solo lectura para el formador.</p><pre>{latestSnapshot.files.map((file) => `${file.path}\n${file.content}`).join('\n\n')}</pre><form onSubmit={sendProposal}><label>Archivo<select value={targetPath} onChange={(event) => chooseFile(event.target.value)}>{latestSnapshot.files.map((file) => <option key={file.path} value={file.path}>{file.path}</option>)}</select></label><label>Resumen de la propuesta<input value={summary} maxLength={4000} onChange={(event) => setSummary(event.target.value)} placeholder="Explica qué cambiará" /></label><label>Código propuesto<textarea value={proposalContent} onChange={(event) => setProposalContent(event.target.value)} /></label><button type="submit" disabled={!summary.trim() || !targetPath}><Send size={15} /> Enviar propuesta</button></form></>}
            </section>
          </div>
        </>}
      </main>
    </div>
  </section>;
}
