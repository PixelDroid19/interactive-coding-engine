import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, BookOpenCheck, Inbox, MessageSquareText, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react';
import { staffDashboardApi, type LearnerDetail, type StaffLearner, type StaffOverview, type StaffThread } from '../services/staffDashboardApi';
import { useTheme } from '../themes/ThemeProvider';

type Tab = 'overview' | 'learners' | 'inbox' | 'access';

function date(value: unknown): string {
  if (typeof value !== 'string') return 'Sin actividad';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Sin actividad' : new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function score(value: unknown): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '—';
}

export function StaffDashboard({ canAdmin, onClose }: { canAdmin: boolean; onClose(): void }) {
  const { themeId } = useTheme();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [learners, setLearners] = useState<StaffLearner[]>([]);
  const [threads, setThreads] = useState<StaffThread[]>([]);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<LearnerDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [reply, setReply] = useState('');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, nextLearners, nextThreads, nextUsers] = await Promise.all([
        staffDashboardApi.overview(), staffDashboardApi.learners(), staffDashboardApi.threads(),
        canAdmin ? staffDashboardApi.users() : Promise.resolve([]),
      ]);
      setOverview(nextOverview);
      setLearners(nextLearners);
      setThreads(nextThreads);
      setUsers(nextUsers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar el panel.');
    } finally {
      setLoading(false);
    }
  }, [canAdmin]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? learners.filter((learner) => `${learner.displayName ?? ''} ${learner.email}`.toLowerCase().includes(normalized)) : learners;
  }, [learners, query]);

  const openLearner = async (id: string) => {
    setSelectedId(id);
    setSelected(null);
    setError(null);
    try { setSelected(await staffDashboardApi.learner(id)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'No pudimos abrir el seguimiento.'); }
  };

  const sendFeedback = async () => {
    if (!selectedId || !feedback.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await staffDashboardApi.leaveFeedback({ learnerUserId: selectedId, ...(courseSlug.trim() ? { courseSlug: courseSlug.trim() } : {}), message: feedback.trim() });
      setFeedback('');
      setSelected(await staffDashboardApi.learner(selectedId));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No pudimos guardar el feedback.'); }
    finally { setSaving(false); }
  };

  const sendReply = async (thread: StaffThread) => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await staffDashboardApi.reply(thread.id, reply.trim(), 'waiting_student');
      setReply('');
      setThreads(await staffDashboardApi.threads());
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No pudimos enviar la respuesta.'); }
    finally { setSaving(false); }
  };

  return (
    <div className={`staff-dashboard${themeId === 'cyber' ? ' staff-dashboard--cyber' : ''}`} role="dialog" aria-modal="true" aria-label="Panel de seguimiento">
      <aside className="staff-dashboard__rail">
        <div className="staff-dashboard__brand"><ShieldCheck size={22} /><span>Seguimiento</span></div>
        <nav aria-label="Secciones del panel">
          <button className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}><Activity size={18} />Resumen</button>
          <button className={tab === 'learners' ? 'is-active' : ''} onClick={() => setTab('learners')}><Users size={18} />Personas</button>
          <button className={tab === 'inbox' ? 'is-active' : ''} onClick={() => setTab('inbox')}><Inbox size={18} />Mensajes{overview?.openThreads ? <b>{overview.openThreads}</b> : null}</button>
          {canAdmin && <button className={tab === 'access' ? 'is-active' : ''} onClick={() => setTab('access')}><ShieldCheck size={18} />Permisos</button>}
        </nav>
        <p>Los cursos y prácticas siguen disponibles sin cuenta. Este espacio muestra solo datos vinculados.</p>
      </aside>
      <main className="staff-dashboard__main">
        <header className="staff-dashboard__header">
          <div><span>{canAdmin ? 'Administración' : 'Formación'}</span><h1>{tab === 'overview' ? 'Pulso de aprendizaje' : tab === 'learners' ? 'Seguimiento individual' : tab === 'inbox' ? 'Bandeja de acompañamiento' : 'Acceso y responsabilidades'}</h1></div>
          <div className="staff-dashboard__header-actions"><button onClick={() => void load()} aria-label="Actualizar"><RefreshCw size={18} /></button><button onClick={onClose} aria-label="Cerrar panel"><X size={20} /></button></div>
        </header>
        {error && <div className="staff-dashboard__error" role="alert">{error}</div>}
        {loading ? <div className="staff-dashboard__loading" role="status">Preparando datos de seguimiento…</div> : (
          <div className="staff-dashboard__content">
            {tab === 'overview' && overview && (
              <>
                <section className="staff-metrics" aria-label="Indicadores">
                  <article><span>Personas registradas</span><strong>{overview.learners}</strong><small>cuentas activas</small></article>
                  <article><span>Actividad reciente</span><strong>{overview.active30d}</strong><small>últimos 30 días</small></article>
                  <article><span>Avances cerrados</span><strong>{overview.completedItems}</strong><small>ítems completados</small></article>
                  <article className={overview.needsSupport ? 'is-alert' : ''}><span>Necesitan refuerzo</span><strong>{overview.needsSupport}</strong><small>patrones repetidos</small></article>
                </section>
                <section className="staff-dashboard__split">
                  <article className="staff-panel"><div className="staff-panel__heading"><h2>Prioridad de acompañamiento</h2><button onClick={() => setTab('learners')}>Ver todas</button></div>{learners.slice(0, 6).map((learner) => <LearnerRow key={learner.id} learner={learner} onOpen={() => { setTab('learners'); void openLearner(learner.id); }} />)}{learners.length === 0 && <Empty label="Todavía no hay personas registradas." />}</article>
                  <article className="staff-panel"><div className="staff-panel__heading"><h2>Conversaciones abiertas</h2><button onClick={() => setTab('inbox')}>Abrir bandeja</button></div>{threads.filter((thread) => thread.status !== 'resolved').slice(0, 5).map((thread) => <button className="staff-thread-preview" key={thread.id} onClick={() => { setTab('inbox'); setActiveThread(thread.id); }}><span>{thread.displayName || thread.email}</span><strong>{thread.subject}</strong><small>{date(thread.updatedAt)}</small></button>)}{threads.length === 0 && <Empty label="No hay mensajes pendientes." />}</article>
                </section>
              </>
            )}
            {tab === 'learners' && (
              <section className="staff-learners">
                <div className="staff-learners__list">
                  <label className="staff-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo" /></label>
                  {filtered.map((learner) => <LearnerRow key={learner.id} learner={learner} selected={selectedId === learner.id} onOpen={() => void openLearner(learner.id)} />)}
                  {filtered.length === 0 && <Empty label="No encontramos personas con ese filtro." />}
                </div>
                <div className="staff-learners__detail">
                  {!selectedId && <Empty label="Selecciona una persona para revisar su recorrido." />}
                  {selectedId && !selected && <div className="staff-dashboard__loading">Cargando recorrido…</div>}
                  {selected && <LearnerDetailView detail={selected} feedback={feedback} courseSlug={courseSlug} saving={saving} onFeedback={setFeedback} onCourse={setCourseSlug} onSend={() => void sendFeedback()} />}
                </div>
              </section>
            )}
            {tab === 'inbox' && (
              <section className="staff-inbox">
                <div className="staff-inbox__list">{threads.map((thread) => <button key={thread.id} className={activeThread === thread.id ? 'is-active' : ''} onClick={() => setActiveThread(thread.id)}><span>{thread.status === 'open' ? 'Necesita respuesta' : thread.status === 'resolved' ? 'Resuelto' : 'Esperando estudiante'}</span><strong>{thread.subject}</strong><small>{thread.displayName || thread.email} · {date(thread.updatedAt)}</small></button>)}{threads.length === 0 && <Empty label="La bandeja está al día." />}</div>
                <div className="staff-inbox__conversation">{activeThread ? (() => { const thread = threads.find((candidate) => candidate.id === activeThread); return thread ? <><header><button onClick={() => setActiveThread(null)}><ArrowLeft size={17} /></button><div><h2>{thread.subject}</h2><p>{thread.displayName || thread.email}</p></div></header><div className="staff-messages">{thread.messages.map((message) => <article key={message.id} className={message.authorUserId === thread.learnerId ? 'is-learner' : 'is-staff'}><p>{message.body}</p><time>{date(message.createdAt)}</time></article>)}</div><form onSubmit={(event) => { event.preventDefault(); void sendReply(thread); }}><label htmlFor="staff-reply">Responder con orientación concreta</label><textarea id="staff-reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={4000} /><button disabled={saving || !reply.trim()}>{saving ? 'Enviando…' : 'Enviar y esperar respuesta'}</button></form></> : null; })() : <Empty label="Elige una conversación para responder." />}</div>
              </section>
            )}
            {tab === 'access' && canAdmin && <AccessView users={users} reload={load} setError={setError} />}
          </div>
        )}
      </main>
    </div>
  );
}

function LearnerRow({ learner, selected, onOpen }: { learner: StaffLearner; selected?: boolean; onOpen(): void }) {
  return <button className={`staff-learner-row${selected ? ' is-active' : ''}`} onClick={onOpen}><span className="staff-avatar">{(learner.displayName || learner.email).slice(0, 2).toUpperCase()}</span><span><strong>{learner.displayName || learner.email.split('@')[0]}</strong><small>{learner.email}</small></span><span className="staff-learner-row__signal"><b>{learner.skillsAtRisk}</b><small>por reforzar</small></span></button>;
}

function Empty({ label }: { label: string }) { return <div className="staff-empty"><BookOpenCheck size={24} /><p>{label}</p></div>; }

function LearnerDetailView({ detail, feedback, courseSlug, saving, onFeedback, onCourse, onSend }: { detail: LearnerDetail; feedback: string; courseSlug: string; saving: boolean; onFeedback(value: string): void; onCourse(value: string): void; onSend(): void }) {
  const user = detail.user;
  return <><header className="staff-detail-header"><span className="staff-avatar is-large">{String(user.displayName || user.email).slice(0, 2).toUpperCase()}</span><div><h2>{String(user.displayName || user.email)}</h2><p>{String(user.email)} · última actividad {date(user.lastSeenAt)}</p></div></header><section className="staff-detail-stats"><span><b>{detail.progress.length}</b> avances</span><span><b>{detail.attempts.length}</b> intentos</span><span><b>{detail.skills.filter((skill) => Number(skill.score) < .55).length}</b> refuerzos</span></section><section className="staff-detail-section"><h3>Conceptos a reforzar</h3>{detail.skills.slice(0, 8).map((skill, index) => <div className="staff-skill" key={`${String(skill.skillKey)}-${index}`}><span><strong>{String(skill.skillKey)}</strong><small>{String(skill.capability)} · {String(skill.attempts)} intentos</small></span><b>{score(skill.score)}</b></div>)}{detail.skills.length === 0 && <Empty label="Aún no hay evidencia suficiente." />}</section><section className="staff-feedback-compose"><h3><MessageSquareText size={17} /> Dejar feedback</h3><input value={courseSlug} onChange={(event) => onCourse(event.target.value)} placeholder="Curso (opcional, ej. fundamentos)" /><textarea value={feedback} onChange={(event) => onFeedback(event.target.value)} maxLength={4000} placeholder="Explica qué hizo bien, qué patrón debe revisar y cuál es el siguiente paso concreto." /><button disabled={saving || !feedback.trim()} onClick={onSend}>{saving ? 'Guardando…' : 'Enviar feedback'}</button></section>{detail.feedback.length > 0 && <section className="staff-detail-section"><h3>Feedback anterior</h3>{detail.feedback.slice(0, 5).map((item) => <article className="staff-feedback-history" key={String(item.id)}><p>{String(item.message)}</p><small>{date(item.createdAt)} · {String(item.status)}</small></article>)}</section>}</>;
}

function AccessView({ users, reload, setError }: { users: Array<Record<string, unknown>>; reload(): Promise<void>; setError(value: string | null): void }) {
  const [busy, setBusy] = useState('');
  const change = async (user: Record<string, unknown>, role: 'tutor' | 'admin') => {
    const id = String(user.id); const roles = Array.isArray(user.roles) ? user.roles : []; const has = roles.includes(role);
    setBusy(`${id}:${role}`); setError(null);
    try { if (has) await staffDashboardApi.revokeRole(id, role); else await staffDashboardApi.grantRole(id, role); await reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos cambiar el permiso.'); }
    finally { setBusy(''); }
  };
  return <section className="staff-access"><div className="staff-access__intro"><ShieldCheck size={28} /><div><h2>Responsabilidades explícitas</h2><p>Estudiante aprende; formador acompaña y deja feedback; administrador gestiona contenido, acceso y permisos.</p></div></div><div className="staff-access__table">{users.map((user) => { const roles = Array.isArray(user.roles) ? user.roles : []; const id = String(user.id); return <article key={id}><span><strong>{String(user.displayName || user.email)}</strong><small>{String(user.email)}</small></span><div><button className={roles.includes('tutor') ? 'is-active' : ''} disabled={Boolean(busy)} onClick={() => void change(user, 'tutor')}>Formador</button><button className={roles.includes('admin') ? 'is-active' : ''} disabled={Boolean(busy)} onClick={() => void change(user, 'admin')}>Admin</button></div></article>; })}{users.length === 0 && <Empty label="No hay cuentas registradas todavía." />}</div></section>;
}
