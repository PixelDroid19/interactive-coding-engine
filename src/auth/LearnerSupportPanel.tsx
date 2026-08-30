import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Inbox, MessageSquarePlus, Send, X } from 'lucide-react';
import { learnerSupportApi, type LearnerFeedback, type LearnerThread } from '../services/staffDashboardApi';

export function LearnerSupportPanel({ userId, onClose }: { userId: string; onClose(): void }) {
  const [threads, setThreads] = useState<LearnerThread[]>([]);
  const [feedback, setFeedback] = useState<LearnerFeedback[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [nextThreads, nextFeedback] = await Promise.all([learnerSupportApi.threads(), learnerSupportApi.feedback()]);
    setThreads(nextThreads); setFeedback(nextFeedback);
  };
  useEffect(() => { void load().catch(() => setError('No pudimos cargar tus mensajes.')); }, []);

  const create = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy(true); setError(null);
    try { await learnerSupportApi.createThread(subject.trim(), body.trim()); setSubject(''); setBody(''); setCompose(false); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos enviar el mensaje.'); }
    finally { setBusy(false); }
  };

  const reply = async (threadId: string) => {
    if (!body.trim()) return;
    setBusy(true); setError(null);
    try { await learnerSupportApi.reply(threadId, body.trim()); setBody(''); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos enviar la respuesta.'); }
    finally { setBusy(false); }
  };

  const thread = threads.find((candidate) => candidate.id === active);
  return <div className="learner-support" role="dialog" aria-modal="true" aria-label="Mensajes y feedback"><section><header><div><span>Tu acompañamiento</span><h2>Mensajes y feedback</h2></div><button onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header>{error && <p className="learner-support__error" role="alert">{error}</p>}{thread ? <div className="learner-conversation"><button className="learner-back" onClick={() => { setActive(null); setBody(''); }}><ArrowLeft size={17} /> Volver</button><h3>{thread.subject}</h3><div className="learner-messages">{thread.messages.map((message) => <article key={message.id} className={message.authorUserId === userId ? 'is-mine' : ''}><p>{message.body}</p><small>{new Date(message.createdAt).toLocaleString('es')}</small></article>)}</div><form onSubmit={(event) => { event.preventDefault(); void reply(thread.id); }}><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Escribe tu respuesta…" /><button disabled={busy || !body.trim()}><Send size={17} /> Enviar</button></form></div> : compose ? <form className="learner-compose" onSubmit={(event) => { event.preventDefault(); void create(); }}><button type="button" className="learner-back" onClick={() => setCompose(false)}><ArrowLeft size={17} /> Volver</button><label>Asunto<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} placeholder="¿En qué necesitas acompañamiento?" /></label><label>Mensaje<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Cuenta qué intentaste, qué esperabas y dónde te bloqueaste." /></label><button disabled={busy || subject.trim().length < 3 || !body.trim()}><Send size={17} /> Enviar mensaje</button></form> : <div className="learner-support__body"><button className="learner-support__new" onClick={() => { setCompose(true); setBody(''); }}><MessageSquarePlus size={18} /> Escribir al equipo formador</button><section><h3>Feedback recibido <span>{feedback.filter((item) => item.status === 'unread').length}</span></h3>{feedback.map((item) => <article className={`learner-feedback${item.status === 'unread' ? ' is-unread' : ''}`} key={item.id}><div><strong>{item.courseSlug || 'Seguimiento general'}</strong><small>{item.authorName || 'Equipo formador'} · {new Date(item.createdAt).toLocaleDateString('es')}</small></div><p>{item.message}</p>{item.status !== 'resolved' && <button onClick={() => void learnerSupportApi.markFeedback(item.id, 'resolved').then(load)}><Check size={15} /> Marcar atendido</button>}</article>)}{feedback.length === 0 && <p className="learner-support__empty">Cuando el equipo te deje una orientación, aparecerá aquí.</p>}</section><section><h3>Conversaciones <span>{threads.length}</span></h3>{threads.map((item) => <button className="learner-thread" key={item.id} onClick={() => { setActive(item.id); setBody(''); }}><Inbox size={18} /><span><strong>{item.subject}</strong><small>{item.status === 'resolved' ? 'Resuelta' : item.status === 'waiting_student' ? 'Esperando tu respuesta' : 'En revisión'}</small></span></button>)}{threads.length === 0 && <p className="learner-support__empty">Todavía no has iniciado conversaciones.</p>}</section></div>}</section></div>;
}
