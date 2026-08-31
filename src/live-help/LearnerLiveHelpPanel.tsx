import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileCode2, Headphones, MessageCircleMore, Send, X } from 'lucide-react';
import { useTheme } from '../themes/ThemeProvider';
import type { LiveHelpConnectionState } from './socket';
import { isLiveHelpStaffRole, type LiveHelpEvent, type LiveHelpProposalEvent, type LiveHelpSession } from './protocol';
import type { PatchProposalOutcome } from './workspace';

type ProposalEvent = LiveHelpProposalEvent;
type ProposalDecision = 'accepted' | 'rejected';

export interface LearnerLiveHelpPanelProps {
  session: LiveHelpSession | null;
  workspaceMatchesSession?: boolean;
  connectionState: LiveHelpConnectionState;
  events: readonly LiveHelpEvent[];
  error: string | null;
  onClose(): void;
  onRequest(): void | Promise<void>;
  onAccept(): void | Promise<void>;
  onSendChat(body: string): void | Promise<void>;
  onSendSnapshot(): void | Promise<void>;
  onDecision(proposalId: string, decision: 'accepted' | 'rejected'): void | Promise<void>;
  onApplyProposal(event: ProposalEvent): PatchProposalOutcome;
  onEnd(): void | Promise<void>;
}

function isProposal(event: LiveHelpEvent): event is ProposalEvent {
  return event.type === 'patch-proposal' && isLiveHelpStaffRole(event.actorRole);
}

function chatBody(event: LiveHelpEvent): string | null {
  return event.type === 'chat' ? (event.payload as Readonly<{ body: string }>).body : null;
}

export function LearnerLiveHelpPanel({
  session, workspaceMatchesSession = true, connectionState, events, error, onClose, onRequest, onAccept, onSendChat, onSendSnapshot, onDecision, onApplyProposal, onEnd,
}: LearnerLiveHelpPanelProps) {
  const { themeId } = useTheme();
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDecisions, setPendingDecisions] = useState<Record<string, ProposalDecision>>({});
  const decisionsInFlightRef = useRef(new Set<string>());
  const [decisionsInFlight, setDecisionsInFlight] = useState<ReadonlySet<string>>(new Set());
  const proposals = useMemo(() => events.filter(isProposal), [events]);
  const durableDecisions = useMemo(() => {
    const decisions = new Map<string, ProposalDecision>();
    for (const event of events) {
      if (event.type === 'patch-decision' && event.actorRole === 'student') decisions.set(event.proposalId, event.payload.decision);
    }
    return decisions;
  }, [events]);
  const messages = useMemo(() => events.map((event) => ({ event, body: chatBody(event) })).filter((entry): entry is { event: LiveHelpEvent; body: string } => entry.body !== null), [events]);

  useEffect(() => {
    setPendingDecisions((current) => {
      let changed = false;
      const next = { ...current };
      for (const proposalId of durableDecisions.keys()) {
        if (proposalId in next) {
          delete next[proposalId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [durableDecisions]);

  const act = (operation: () => void | Promise<void>) => {
    setNotice(null);
    void Promise.resolve(operation()).catch((cause: unknown) => setNotice(cause instanceof Error ? cause.message : 'No pudimos completar esta acción.'));
  };

  const confirmDecision = async (proposalId: string, decision: ProposalDecision) => {
    if (durableDecisions.has(proposalId) || decisionsInFlightRef.current.has(proposalId)) return;
    decisionsInFlightRef.current.add(proposalId);
    setDecisionsInFlight(new Set(decisionsInFlightRef.current));
    setPendingDecisions((current) => current[proposalId] === decision ? current : { ...current, [proposalId]: decision });
    setNotice(null);
    try {
      await onDecision(proposalId, decision);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'No pudimos confirmar esta decisión. Puedes reintentarlo.');
    } finally {
      decisionsInFlightRef.current.delete(proposalId);
      setDecisionsInFlight(new Set(decisionsInFlightRef.current));
    }
  };

  const apply = (event: ProposalEvent) => {
    const pendingDecision = pendingDecisions[event.proposalId];
    if (durableDecisions.has(event.proposalId) || pendingDecision) {
      if (pendingDecision) void confirmDecision(event.proposalId, pendingDecision);
      return;
    }
    const outcome = onApplyProposal(event);
    if (outcome.outcome === 'conflict') {
      setNotice('El código cambió desde que llegó esta propuesta. Pide una propuesta actualizada antes de aplicarla.');
      return;
    }
    if (outcome.outcome === 'blocked') {
      setNotice(outcome.message);
      return;
    }
    void confirmDecision(event.proposalId, 'accepted');
  };
  const reject = (event: ProposalEvent) => {
    const pendingDecision = pendingDecisions[event.proposalId];
    if (durableDecisions.has(event.proposalId) || pendingDecision) {
      if (pendingDecision) void confirmDecision(event.proposalId, pendingDecision);
      return;
    }
    void confirmDecision(event.proposalId, 'rejected');
  };

  return (
    <aside className={`live-help-panel${themeId === 'cyber' ? ' live-help-panel--cyber' : ''}`} aria-label="Ayuda del formador" role="complementary">
      <header className="live-help-panel__header">
        <span><Headphones size={16} aria-hidden="true" /> Ayuda del formador</span>
        <div><small className={`live-help-panel__state is-${connectionState}`}>{session?.status === 'active' ? 'Sesión activa' : session?.status === 'accepted' ? 'Conectando' : session?.status === 'claimed' ? 'Esperando consentimiento' : session?.status === 'requested' ? 'Solicitud enviada' : 'Sin sesión'}</small><button type="button" onClick={onClose} aria-label="Cerrar ayuda en vivo"><X size={16} /></button></div>
      </header>
      {error && <p className="live-help-panel__notice" role="alert">{error}</p>}
      {notice && <p className="live-help-panel__notice" role="alert">{notice}</p>}

      {(!session || session.status === 'ended' || session.status === 'cancelled' || session.status === 'expired') && (
        <section className="live-help-panel__empty">
          <MessageCircleMore aria-hidden="true" size={28} />
          <h2>{session ? 'La sesión terminó' : '¿Necesitas una mirada?'}</h2>
          <p>{session ? 'Vuelve a esta actividad o solicita una nueva sesión cuando necesites acompañamiento.' : 'Envía una solicitud con el contexto de esta actividad. Tú decides si después compartes una copia del código.'}</p>
          <button type="button" className="live-help-panel__primary" onClick={() => act(onRequest)}>Solicitar ayuda</button>
        </section>
      )}
      {session?.status === 'requested' && <section className="live-help-panel__empty"><h2>Solicitud enviada</h2><p>Esperamos a que una persona formadora reclame esta sesión. Puedes seguir trabajando mientras tanto.</p></section>}
      {session?.status === 'claimed' && (
        <section className="live-help-panel__consent">
          <h2>Consentimiento antes de conectar</h2>
          <p>El formador podrá leer el chat y las copias de trabajo que elijas enviar. Nunca podrá cambiar tu editor directamente.</p>
          <button type="button" className="live-help-panel__primary" onClick={() => act(onAccept)}>Aceptar y abrir sesión</button>
        </section>
      )}
      {session?.status === 'accepted' && <section className="live-help-panel__empty"><h2>Consentimiento confirmado</h2><p>Estamos conectando el canal seguro con el formador.</p></section>}
      {session?.status === 'active' && (
        <>
          <div className="live-help-panel__tools"><button type="button" onClick={() => act(onSendSnapshot)} disabled={!workspaceMatchesSession}><FileCode2 size={15} /> Compartir copia del código</button><span>{connectionState === 'connected' ? 'Conectada' : connectionState === 'reconnecting' ? 'Reconectando…' : 'Sin conexión'}</span></div>
          {!workspaceMatchesSession && <p className="live-help-panel__notice" role="status">Esta sesión pertenece a otra actividad. Vuelve a la actividad original o termina la sesión y solicita una nueva antes de compartir o aplicar código.</p>}
          <section className="live-help-panel__chat" aria-label="Conversación de ayuda" aria-live="polite">
            {messages.length === 0 ? <p className="live-help-panel__muted">La conversación aparecerá aquí.</p> : messages.map(({ event, body }) => <article key={event.seq} className={event.actorRole === 'student' ? 'is-learner' : 'is-staff'}><strong>{event.actorRole === 'student' ? 'Tú' : 'Formador'}</strong><p>{body}</p></article>)}
          </section>
          <form className="live-help-panel__compose" onSubmit={(event) => { event.preventDefault(); const body = message.trim(); if (!body) return; act(() => onSendChat(body)); setMessage(''); }}>
            <label htmlFor="live-help-message">Escribe un mensaje al formador</label>
            <div><textarea id="live-help-message" value={message} maxLength={4000} onChange={(event) => setMessage(event.target.value)} /><button type="submit" aria-label="Enviar mensaje" disabled={!message.trim()}><Send size={16} /></button></div>
          </form>
          <section className="live-help-panel__proposals" aria-label="Propuestas de cambio">
            <h2>Propuestas ({proposals.length})</h2>
            {proposals.length === 0 && <p className="live-help-panel__muted">Aún no hay propuestas de cambios.</p>}
            {proposals.map((event) => {
              const result = durableDecisions.get(event.proposalId);
              const pendingDecision = pendingDecisions[event.proposalId];
              const decisionPending = decisionsInFlight.has(event.proposalId);
              const retry = () => {
                if (pendingDecision) void confirmDecision(event.proposalId, pendingDecision);
              };
              return <article key={event.proposalId}><header><span>Propuesta</span><small>{result === 'accepted' ? 'Aplicada' : result === 'rejected' ? 'Rechazada' : pendingDecision === 'accepted' ? 'Aplicada sin confirmar' : pendingDecision === 'rejected' ? 'Rechazo sin confirmar' : 'Pendiente'}</small></header><p>{event.payload.summary}</p><pre>{event.payload.patch.files.map((file) => `${file.path}\n${file.content}`).join('\n\n')}</pre>{!result && <div>{pendingDecision ? <button type="button" className="live-help-panel__primary" onClick={retry} disabled={decisionPending}><Check size={15} /> {pendingDecision === 'accepted' ? 'Reintentar confirmación' : 'Reintentar rechazo'}</button> : <><button type="button" className="live-help-panel__primary" onClick={() => apply(event)} disabled={decisionPending || !workspaceMatchesSession}><Check size={15} /> Aplicar cambio</button><button type="button" onClick={() => reject(event)} disabled={decisionPending}>Rechazar</button></>}</div>}</article>;
            })}
          </section>
          <button type="button" className="live-help-panel__end" onClick={() => act(onEnd)}>Terminar sesión</button>
        </>
      )}
    </aside>
  );
}
