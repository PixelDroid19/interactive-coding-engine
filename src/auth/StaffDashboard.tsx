import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, BookOpenCheck, CheckCircle2, Clock3, Inbox, LibraryBig, MessageSquareText, RefreshCw, Search, ShieldCheck, Trash2, TriangleAlert, Users, X } from 'lucide-react';
import { staffDashboardApi, type AdminCourse, type IdentityAccessRule, type LearnerDetail, type StaffAdminUser, type StaffLearner, type StaffOverview, type StaffThread, type UserCourseAccess } from '../services/staffDashboardApi';
import { useTheme } from '../themes/ThemeProvider';
import { useModalDialog } from '../components/useModalDialog';

type Tab = 'overview' | 'learners' | 'inbox' | 'access' | 'content';

function date(value: unknown): string {
  if (typeof value !== 'string') return 'Sin actividad';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Sin actividad' : new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function score(value: unknown): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '—';
}

function duration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 'Sin reproducción';
  const minutes = Math.max(1, Math.round(milliseconds / 60_000));
  return `${minutes} min`;
}

export function StaffDashboard({ canAdmin, onClose }: { canAdmin: boolean; onClose(): void }) {
  const { themeId } = useTheme();
  const dialogRef = useModalDialog<HTMLDivElement>({ open: true, onClose });
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [learners, setLearners] = useState<StaffLearner[]>([]);
  const [threads, setThreads] = useState<StaffThread[]>([]);
  const [users, setUsers] = useState<StaffAdminUser[]>([]);
  const [accessRules, setAccessRules] = useState<IdentityAccessRule[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [selected, setSelected] = useState<LearnerDetail | null>(null);
  const [selectedCourseAccess, setSelectedCourseAccess] = useState<UserCourseAccess[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [itemKey, setItemKey] = useState('');
  const [skillKey, setSkillKey] = useState('');
  const [reply, setReply] = useState('');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
        staffDashboardApi.overview(), staffDashboardApi.learners(), staffDashboardApi.threads(),
        canAdmin ? staffDashboardApi.users() : Promise.resolve([]),
        canAdmin ? staffDashboardApi.accessRules() : Promise.resolve([]),
        canAdmin ? staffDashboardApi.courses() : Promise.resolve([]),
      ] as const);
    const [nextOverview, nextLearners, nextThreads, nextUsers, nextRules, nextCourses] = results;
    if (nextOverview.status === 'fulfilled') setOverview(nextOverview.value);
    if (nextLearners.status === 'fulfilled') setLearners(nextLearners.value);
    if (nextThreads.status === 'fulfilled') setThreads(nextThreads.value);
    if (nextUsers.status === 'fulfilled') setUsers(nextUsers.value);
    if (nextRules.status === 'fulfilled') setAccessRules(nextRules.value);
    if (nextCourses.status === 'fulfilled') setCourses(nextCourses.value);
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      const first = failed[0]?.status === 'rejected' ? failed[0].reason : null;
      setError(`${failed.length === 1 ? 'Una sección no respondió' : `${failed.length} secciones no respondieron`}. ${first instanceof Error ? first.message : 'Puedes actualizar para reintentarlo.'}`);
    }
    setLoading(false);
  }, [canAdmin]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (tab !== 'learners' || loading) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void staffDashboardApi.learners(query).then((items) => {
        if (active) setLearners(items);
      }).catch((searchError) => {
        if (active) setError(searchError instanceof Error ? searchError.message : 'No pudimos completar la búsqueda.');
      }).finally(() => { if (active) setSearching(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [loading, query, tab]);

  const openLearner = async (id: string) => {
    setSelectedId(id);
    setSelected(null);
    setSelectedLoading(true);
    setSelectedError(null);
    setError(null);
    try {
      const [detail, access] = await Promise.all([
        staffDashboardApi.learner(id),
        canAdmin ? staffDashboardApi.courseAccess(id) : Promise.resolve([]),
      ]);
      setSelected(detail);
      setSelectedCourseAccess(access);
    }
    catch (loadError) { setSelectedError(loadError instanceof Error ? loadError.message : 'No pudimos abrir el seguimiento.'); }
    finally { setSelectedLoading(false); }
  };

  const sendFeedback = async () => {
    if (!selectedId || !feedback.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await staffDashboardApi.leaveFeedback({
        learnerUserId: selectedId,
        ...(courseSlug ? { courseSlug } : {}),
        ...(itemKey ? { itemKey } : {}),
        ...(skillKey ? { skillKey } : {}),
        message: feedback.trim(),
      });
      setFeedback('');
      setSelected(await staffDashboardApi.learner(selectedId));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No pudimos guardar el feedback.'); }
    finally { setSaving(false); }
  };

  const sendReply = async (thread: StaffThread, status: 'waiting_student' | 'resolved') => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await staffDashboardApi.reply(thread.id, reply.trim(), status);
      setReply('');
      setThreads(await staffDashboardApi.threads());
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No pudimos enviar la respuesta.'); }
    finally { setSaving(false); }
  };

  return (
    <div ref={dialogRef} className={`staff-dashboard${themeId === 'cyber' ? ' staff-dashboard--cyber' : ''}`} role="dialog" aria-modal="true" aria-label="Panel de seguimiento">
      <aside className="staff-dashboard__rail">
        <div className="staff-dashboard__brand"><ShieldCheck size={22} /><span>Seguimiento</span></div>
        <nav aria-label="Secciones del panel">
          <button className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}><Activity size={18} />Resumen</button>
          <button className={tab === 'learners' ? 'is-active' : ''} onClick={() => setTab('learners')}><Users size={18} />Personas</button>
          <button className={tab === 'inbox' ? 'is-active' : ''} onClick={() => setTab('inbox')}><Inbox size={18} />Mensajes{overview?.openThreads ? <b>{overview.openThreads}</b> : null}</button>
          {canAdmin && <button className={tab === 'access' ? 'is-active' : ''} onClick={() => setTab('access')}><ShieldCheck size={18} />Permisos</button>}
          {canAdmin && <button className={tab === 'content' ? 'is-active' : ''} onClick={() => setTab('content')}><LibraryBig size={18} />Cursos</button>}
        </nav>
        <p>Los cursos y prácticas siguen disponibles sin cuenta. Este espacio muestra solo datos vinculados.</p>
      </aside>
      <main className="staff-dashboard__main">
        <header className="staff-dashboard__header">
          <div><span>{canAdmin ? 'Administración' : 'Formación'}</span><h1>{tab === 'overview' ? 'Pulso de aprendizaje' : tab === 'learners' ? 'Seguimiento individual' : tab === 'inbox' ? 'Bandeja de acompañamiento' : tab === 'content' ? 'Gestión de cursos' : 'Acceso y responsabilidades'}</h1></div>
          <div className="staff-dashboard__header-actions"><button onClick={() => void load()} aria-label="Actualizar"><RefreshCw size={18} /></button><button data-dialog-initial-focus onClick={onClose} aria-label="Cerrar panel"><X size={20} /></button></div>
        </header>
        {error && <div className="staff-dashboard__error" role="alert">{error}</div>}
        {loading ? <div className="staff-dashboard__loading" role="status">Preparando datos de seguimiento…</div> : (
          <div className="staff-dashboard__content">
            {tab === 'overview' && overview && (
              <>
                <section className="staff-metrics" aria-label="Indicadores">
                  <article><span>Personas registradas</span><strong>{overview.learners}</strong><small>cuentas activas</small></article>
                  <article><span>Actividad reciente</span><strong>{overview.active7d}</strong><small>personas y visitas · 7 días</small></article>
                  <article><span>Avances cerrados</span><strong>{overview.completedItems}</strong><small>registrados · {overview.anonymousCompletedItems} anónimos</small></article>
                  <article className={overview.needsSupport ? 'is-alert' : ''}><span>Necesitan refuerzo</span><strong>{overview.needsSupport}</strong><small>patrones repetidos</small></article>
                </section>
                <section className="staff-operations" aria-label="Estado operativo">
                  <span><CheckCircle2 size={16} /><b>{overview.verifiedLearners}</b> correos verificados</span>
                  <span className={overview.verificationPending ? 'is-warning' : ''}><Clock3 size={16} /><b>{overview.verificationPending}</b> verificaciones pendientes</span>
                  <span className={overview.failedAttempts30d ? 'is-warning' : ''}><TriangleAlert size={16} /><b>{overview.failedAttempts30d}</b> intentos para revisar</span>
                  <span><MessageSquareText size={16} /><b>{overview.pendingFeedback}</b> feedback sin leer</span>
                  <small>Último dato recibido: {date(overview.latestActivityAt)}</small>
                </section>
                <section className="staff-dashboard__insights">
                  <article className="staff-panel staff-activity-panel">
                    <div className="staff-panel__heading"><div><span>Últimos 7 días</span><h2>Actividad registrada</h2></div><small>{overview.attempts30d} intentos en 30 días</small></div>
                    <ActivityBars points={overview.activity7d} />
                  </article>
                  <article className="staff-panel staff-course-health">
                    <div className="staff-panel__heading"><div><span>Por curso</span><h2>Avance y dificultad</h2></div></div>
                    <div className="staff-course-health__rows">{overview.courses.slice(0, 6).map((course) => <div key={course.courseSlug}><span><strong>{course.title}</strong><small>{course.learners} personas · {course.completedItems}/{course.progressItems} avances cerrados</small></span><span className={course.attemptsToReview ? 'is-warning' : ''}><b>{course.attemptsToReview}</b><small>por revisar</small></span></div>)}{overview.courses.length === 0 && <Empty label="Aún no hay actividad por curso." />}</div>
                  </article>
                </section>
                <section className="staff-dashboard__split">
                  <article className="staff-panel"><div className="staff-panel__heading"><h2>Prioridad de acompañamiento</h2><button onClick={() => setTab('learners')}>Ver todas</button></div>{learners.slice(0, 6).map((learner) => <LearnerRow key={learner.id} learner={learner} onOpen={() => { setTab('learners'); void openLearner(learner.id); }} />)}{learners.length === 0 && <Empty label="Todavía no hay personas registradas." />}</article>
                  <article className="staff-panel"><div className="staff-panel__heading"><h2>Conversaciones abiertas</h2><button onClick={() => setTab('inbox')}>Abrir bandeja</button></div>{threads.filter((thread) => thread.status !== 'resolved').slice(0, 5).map((thread) => <button className="staff-thread-preview" key={thread.id} onClick={() => { setTab('inbox'); setActiveThread(thread.id); }}><span>{thread.displayName || thread.email}</span><strong>{thread.subject}</strong><small>{date(thread.updatedAt)}</small></button>)}{threads.length === 0 && <Empty label="No hay mensajes pendientes." />}</article>
                </section>
              </>
            )}
            {tab === 'overview' && !overview && <Empty label="No pudimos recuperar el resumen. Usa actualizar para reintentarlo." />}
            {tab === 'learners' && (
              <section className="staff-learners">
                <div className="staff-learners__list">
                  <label className={`staff-search${searching ? ' is-searching' : ''}`}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo" /><span>{searching ? 'Buscando…' : `${learners.length} resultados`}</span></label>
                  {learners.map((learner) => <LearnerRow key={learner.id} learner={learner} selected={selectedId === learner.id} onOpen={() => void openLearner(learner.id)} />)}
                  {learners.length === 0 && !searching && <Empty label="No encontramos personas con ese filtro." />}
                </div>
                <div className={`staff-learners__detail${selectedId ? ' is-open' : ''}`}>
                  {!selectedId && <Empty label="Selecciona una persona para revisar su recorrido." />}
                  {selectedId && selectedLoading && <div className="staff-dashboard__loading">Cargando recorrido…</div>}
                  {selectedId && selectedError && <div className="staff-detail-error" role="alert"><TriangleAlert size={20} /><p>{selectedError}</p><button onClick={() => void openLearner(selectedId)}>Reintentar</button></div>}
                  {selected && <LearnerDetailView detail={selected} feedback={feedback} courseSlug={courseSlug} itemKey={itemKey} skillKey={skillKey} saving={saving} onBack={() => { setSelectedId(null); setSelected(null); setSelectedCourseAccess([]); setSelectedError(null); }} onFeedback={setFeedback} onCourse={setCourseSlug} onItem={setItemKey} onSkill={setSkillKey} onSend={() => void sendFeedback()} adminCourses={canAdmin ? courses : []} courseAccess={selectedCourseAccess} onCourseAccess={setSelectedCourseAccess} setError={setError} />}
                </div>
              </section>
            )}
            {tab === 'inbox' && (
              <section className="staff-inbox">
                <div className="staff-inbox__list">{threads.map((thread) => <button key={thread.id} className={activeThread === thread.id ? 'is-active' : ''} onClick={() => setActiveThread(thread.id)}><span>{thread.status === 'open' ? 'Necesita respuesta' : thread.status === 'resolved' ? 'Resuelto' : 'Esperando estudiante'}</span><strong>{thread.subject}</strong><small>{thread.displayName || thread.email} · {date(thread.updatedAt)}</small></button>)}{threads.length === 0 && <Empty label="La bandeja está al día." />}</div>
                <div className={`staff-inbox__conversation${activeThread ? ' is-open' : ''}`}>{activeThread ? (() => { const thread = threads.find((candidate) => candidate.id === activeThread); return thread ? <><header><button onClick={() => setActiveThread(null)}><ArrowLeft size={17} /></button><div><h2>{thread.subject}</h2><p>{thread.displayName || thread.email} · {thread.status === 'resolved' ? 'resuelto' : thread.status === 'waiting_student' ? 'esperando estudiante' : 'necesita respuesta'}</p></div></header><div className="staff-messages">{thread.messages.map((message) => <article key={message.id} className={message.authorUserId === thread.learnerId ? 'is-learner' : 'is-staff'}><p>{message.body}</p><time>{date(message.createdAt)}</time></article>)}</div><form onSubmit={(event) => { event.preventDefault(); void sendReply(thread, 'waiting_student'); }}><label htmlFor="staff-reply">Responder con orientación concreta</label><textarea id="staff-reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={4000} /><div className="staff-reply-actions"><button disabled={saving || !reply.trim()}>{saving ? 'Enviando…' : 'Enviar y esperar respuesta'}</button><button type="button" className="is-secondary" disabled={saving || !reply.trim()} onClick={() => void sendReply(thread, 'resolved')}>Responder y resolver</button></div></form></> : null; })() : <Empty label="Elige una conversación para responder." />}</div>
              </section>
            )}
            {tab === 'access' && canAdmin && <AccessView users={users} rules={accessRules} reload={load} setError={setError} />}
            {tab === 'content' && canAdmin && <ContentView courses={courses} reload={load} setError={setError} />}
          </div>
        )}
      </main>
    </div>
  );
}

function ActivityBars({ points }: { points: StaffOverview['activity7d'] }) {
  const maximum = Math.max(1, ...points.map((point) => point.events));
  return <div className="staff-activity-bars">{points.map((point) => {
    const parsed = new Date(`${point.day}T12:00:00`);
    const label = Number.isNaN(parsed.getTime()) ? point.day : new Intl.DateTimeFormat('es', { weekday: 'short' }).format(parsed);
    return <div key={point.day} title={`${point.events} eventos · ${point.activeActors} personas · ${point.completions} cierres`}><span><i style={{ height: `${Math.max(point.events ? 12 : 3, (point.events / maximum) * 100)}%` }} /></span><b>{point.events}</b><small>{label}</small></div>;
  })}</div>;
}

function LearnerRow({ learner, selected, onOpen }: { learner: StaffLearner; selected?: boolean; onOpen(): void }) {
  return <button className={`staff-learner-row${selected ? ' is-active' : ''}`} onClick={onOpen}><span className="staff-avatar">{(learner.displayName || learner.email).slice(0, 2).toUpperCase()}</span><span><strong>{learner.displayName || learner.email.split('@')[0]}</strong><small>{learner.email}</small></span><span className="staff-learner-row__signal"><b>{learner.skillsAtRisk}</b><small>por reforzar</small></span></button>;
}

function Empty({ label }: { label: string }) { return <div className="staff-empty"><BookOpenCheck size={24} /><p>{label}</p></div>; }

function LearnerDetailView({ detail, feedback, courseSlug, itemKey, skillKey, saving, onBack, onFeedback, onCourse, onItem, onSkill, onSend, adminCourses, courseAccess, onCourseAccess, setError }: {
  detail: LearnerDetail; feedback: string; courseSlug: string; itemKey: string; skillKey: string; saving: boolean;
  onBack(): void; onFeedback(value: string): void; onCourse(value: string): void; onItem(value: string): void;
  onSkill(value: string): void; onSend(): void; adminCourses: AdminCourse[]; courseAccess: UserCourseAccess[];
  onCourseAccess(value: UserCourseAccess[]): void; setError(value: string | null): void;
}) {
  const user = detail.user;
  const courses = useMemo(() => [...new Set([
    ...detail.progress.map((item) => item.courseSlug),
    ...detail.attempts.map((item) => item.courseSlug),
    ...detail.skills.map((item) => item.courseSlug),
  ])].sort(), [detail]);
  const items = useMemo(() => [...new Set([
    ...detail.progress.filter((item) => !courseSlug || item.courseSlug === courseSlug).map((item) => item.lessonKey),
    ...detail.attempts.filter((item) => !courseSlug || item.courseSlug === courseSlug).map((item) => item.itemKey),
  ])].sort(), [courseSlug, detail]);
  const skills = useMemo(() => [...new Set(detail.skills
    .filter((item) => !courseSlug || item.courseSlug === courseSlug)
    .map((item) => item.skillKey))].sort(), [courseSlug, detail.skills]);
  const skillsAtRisk = useMemo(() => detail.skills.filter((skill) => skill.score < .55), [detail.skills]);
  const selectCourse = (value: string) => { onCourse(value); onItem(''); onSkill(''); };

  return <>
    <button className="staff-detail-back" onClick={onBack}><ArrowLeft size={17} /> Volver a personas</button>
    <header className="staff-detail-header"><span className="staff-avatar is-large">{String(user.displayName || user.email).slice(0, 2).toUpperCase()}</span><div><h2>{String(user.displayName || user.email)}</h2><p>{String(user.email)} · última actividad {date(user.lastSeenAt)}</p></div></header>
    <section className="staff-detail-stats"><span><b>{detail.progress.length}</b> avances</span><span><b>{detail.attempts.length}</b> intentos</span><span><b>{detail.skills.filter((skill) => skill.score < .55).length}</b> refuerzos</span><span><b>{detail.progress.filter((item) => item.status === 'completed').length}</b> completados</span></section>

    <section className="staff-detail-section"><div className="staff-detail-section__heading"><h3>Conceptos a reforzar</h3><small>Selecciona uno para contextualizar el feedback</small></div>{skillsAtRisk.slice(0, 8).map((skill, index) => <button className="staff-skill" key={`${skill.courseSlug}:${skill.skillKey}:${index}`} onClick={() => { selectCourse(skill.courseSlug); onSkill(skill.skillKey); }}><span><strong>{skill.skillKey}</strong><small>{skill.courseSlug} · {skill.capability} · {skill.attempts} intentos</small></span><b>{score(skill.score)}</b></button>)}{skillsAtRisk.length === 0 && <Empty label="No hay conceptos por debajo del umbral de refuerzo." />}</section>

    <section className="staff-detail-grid">
      <div className="staff-detail-section"><h3>Progreso reciente</h3>{detail.progress.slice(0, 8).map((progress) => <article className="staff-progress-row" key={`${progress.courseSlug}:${progress.lessonKey}`}><span><strong>{progress.lessonKey}</strong><small>{progress.courseSlug} · {duration(progress.playbackMs)} · {date(progress.updatedAt)}</small></span><b className={`is-${progress.status}`}>{progress.status === 'completed' ? 'Completado' : progress.status === 'in_progress' ? 'En curso' : 'Sin iniciar'}</b></article>)}{detail.progress.length === 0 && <Empty label="No hay progreso remoto todavía." />}</div>
      <div className="staff-detail-section"><h3>Intentos recientes</h3>{detail.attempts.slice(0, 8).map((attempt) => <button className="staff-attempt-row" key={attempt.id} onClick={() => { selectCourse(attempt.courseSlug); onItem(attempt.itemKey); }}><span><strong>{attempt.itemKey}</strong><small>{attempt.courseSlug} · {attempt.kind} · {date(attempt.occurredAt)}</small></span><b className={`is-${attempt.result}`}>{attempt.score === null ? attempt.result : `${attempt.score}/100`}</b></button>)}{detail.attempts.length === 0 && <Empty label="No hay intentos registrados." />}</div>
    </section>

    <section className="staff-feedback-compose"><h3><MessageSquareText size={17} /> Dejar feedback contextual</h3><div className="staff-feedback-context"><label>Curso<select value={courseSlug} onChange={(event) => selectCourse(event.target.value)}><option value="">General</option>{courses.map((course) => <option key={course} value={course}>{course}</option>)}</select></label><label>Actividad<select value={itemKey} onChange={(event) => onItem(event.target.value)}><option value="">Sin actividad concreta</option>{items.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Concepto<select value={skillKey} onChange={(event) => onSkill(event.target.value)}><option value="">Sin concepto concreto</option>{skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></label></div><textarea value={feedback} onChange={(event) => onFeedback(event.target.value)} maxLength={4000} placeholder="Explica qué hizo bien, qué patrón debe revisar y cuál es el siguiente paso concreto." /><div className="staff-feedback-compose__footer"><small>{feedback.length}/4000 · llegará al centro de mensajes de la persona</small><button disabled={saving || !feedback.trim()} onClick={onSend}>{saving ? 'Guardando…' : 'Enviar feedback'}</button></div></section>
    {adminCourses.length > 0 && <LearnerCourseAccess userId={user.id} courses={adminCourses} access={courseAccess} onChange={onCourseAccess} setError={setError} />}
    {detail.feedback.length > 0 && <section className="staff-detail-section"><h3>Feedback anterior</h3>{detail.feedback.slice(0, 8).map((item) => <article className="staff-feedback-history" key={item.id}><p>{item.message}</p><small>{date(item.createdAt)} · {item.status}{item.courseSlug ? ` · ${item.courseSlug}` : ''}{item.itemKey ? ` · ${item.itemKey}` : ''}</small></article>)}</section>}
  </>;
}

function LearnerCourseAccess({ userId, courses, access, onChange, setError }: {
  userId: string; courses: AdminCourse[]; access: UserCourseAccess[];
  onChange(value: UserCourseAccess[]): void; setError(value: string | null): void;
}) {
  const [courseSlug, setCourseSlug] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const available = courses.filter((course) => !access.some((item) => item.courseSlug === course.slug));
  const lock = async () => {
    if (!courseSlug || !reason.trim()) return;
    setBusy(courseSlug); setError(null);
    try {
      await staffDashboardApi.lockCourseForUser(userId, courseSlug, reason.trim());
      onChange(await staffDashboardApi.courseAccess(userId));
      setCourseSlug(''); setReason('');
    } catch (error) { setError(error instanceof Error ? error.message : 'No pudimos restringir el curso.'); }
    finally { setBusy(''); }
  };
  const unlock = async (course: UserCourseAccess) => {
    setBusy(course.courseSlug); setError(null);
    try { await staffDashboardApi.unlockCourseForUser(userId, course.courseSlug); onChange(await staffDashboardApi.courseAccess(userId)); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos restaurar el acceso.'); }
    finally { setBusy(''); }
  };
  return <section className="staff-detail-section staff-personal-access"><div className="staff-detail-section__heading"><h3>Acceso individual a cursos</h3><small>Solo afecta a esta persona; el bloqueo general se administra en Cursos.</small></div><div className="staff-personal-access__form"><label>Curso a restringir<select value={courseSlug} onChange={(event) => setCourseSlug(event.target.value)}><option value="">Selecciona un curso</option>{available.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}</select></label><label>Motivo para esta persona<input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Explica qué debe ocurrir antes de continuar" /></label><button disabled={Boolean(busy) || !courseSlug || !reason.trim()} onClick={() => void lock()}>Bloquear solo para esta persona</button></div><div className="staff-personal-access__list">{access.map((item) => <article key={item.courseSlug}><span><strong>{item.title}</strong><small>{item.reason}</small></span><button disabled={Boolean(busy)} aria-label={`Restaurar acceso a ${item.title}`} onClick={() => void unlock(item)}>Restaurar acceso</button></article>)}{access.length === 0 && <p>No hay cursos restringidos para esta persona.</p>}</div></section>;
}

function AccessView({ users, rules, reload, setError }: { users: StaffAdminUser[]; rules: IdentityAccessRule[]; reload(): Promise<void>; setError(value: string | null): void }) {
  const [busy, setBusy] = useState('');
  const [provider, setProvider] = useState<'google' | 'microsoft'>('google');
  const [ruleType, setRuleType] = useState<'email' | 'domain'>('email');
  const [value, setValue] = useState('');
  const change = async (user: StaffAdminUser, role: 'tutor' | 'admin') => {
    const id = user.id; const has = user.roles.includes(role);
    setBusy(`${id}:${role}`); setError(null);
    try { if (has) await staffDashboardApi.revokeRole(id, role); else await staffDashboardApi.grantRole(id, role); await reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos cambiar el permiso.'); }
    finally { setBusy(''); }
  };
  const changeStatus = async (user: StaffAdminUser) => {
    const id = user.id; const next = user.status === 'blocked' ? 'active' : 'blocked';
    setBusy(`${id}:status`); setError(null);
    try { await staffDashboardApi.setUserStatus(id, next); await reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos cambiar el estado de la cuenta.'); }
    finally { setBusy(''); }
  };
  const addRule = async (event: React.FormEvent) => {
    event.preventDefault(); if (!value.trim()) return;
    setBusy('rule:new'); setError(null);
    try { await staffDashboardApi.upsertAccessRule({ provider, ruleType, value: value.trim(), enabled: true }); setValue(''); await reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos guardar la regla de acceso.'); }
    finally { setBusy(''); }
  };
  const removeRule = async (id: string) => {
    setBusy(`rule:${id}`); setError(null);
    try { await staffDashboardApi.deleteAccessRule(id); await reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos eliminar la regla de acceso.'); }
    finally { setBusy(''); }
  };
  return <section className="staff-access"><div className="staff-access__intro"><ShieldCheck size={28} /><div><h2>Responsabilidades explícitas</h2><p>Estudiante aprende; formador acompaña y deja feedback; administrador gestiona contenido, acceso y permisos.</p></div></div><div className="staff-access__grid"><section className="staff-access__section"><header><div><span>Cuentas</span><h2>Roles y estado</h2></div><small>Bloquear revoca las sesiones abiertas.</small></header><div className="staff-access__table">{users.map((user) => { const roles = Array.isArray(user.roles) ? user.roles : []; const id = String(user.id); const blocked = user.status === 'blocked'; return <article key={id}><span><strong>{String(user.displayName || user.email)}</strong><small>{String(user.email)} · {blocked ? 'bloqueada' : 'activa'}</small></span><div><button className={roles.includes('tutor') ? 'is-active' : ''} disabled={Boolean(busy) || blocked} onClick={() => void change(user, 'tutor')}>Formador</button><button className={roles.includes('admin') ? 'is-active' : ''} disabled={Boolean(busy) || blocked} onClick={() => void change(user, 'admin')}>Admin</button><button className={blocked ? 'is-warning' : ''} disabled={Boolean(busy)} onClick={() => void changeStatus(user)}>{blocked ? 'Reactivar' : 'Bloquear'}</button></div></article>; })}{users.length === 0 && <Empty label="No hay cuentas registradas todavía." />}</div></section><section className="staff-access__section"><header><div><span>Inicio de sesión</span><h2>Quién puede registrarse</h2></div><small>Google admite correos concretos; Microsoft también dominios EPAM.</small></header><form className="staff-rule-form" onSubmit={(event) => void addRule(event)}><label>Proveedor<select value={provider} onChange={(event) => { const next = event.target.value as 'google' | 'microsoft'; setProvider(next); if (next === 'google') setRuleType('email'); }}><option value="google">Google</option><option value="microsoft">Microsoft</option></select></label><label>Tipo<select value={ruleType} onChange={(event) => setRuleType(event.target.value as 'email' | 'domain')}><option value="email">Correo exacto</option><option value="domain" disabled={provider === 'google'}>Dominio</option></select></label><label className="staff-rule-form__value">Valor<input type={ruleType === 'email' ? 'email' : 'text'} value={value} onChange={(event) => setValue(event.target.value)} placeholder={ruleType === 'email' ? 'persona@empresa.com' : 'empresa.com'} /></label><button disabled={Boolean(busy) || !value.trim()}>Agregar acceso</button></form><div className="staff-rule-list">{rules.map((rule) => <article key={rule.id}><span><b>{rule.provider === 'google' ? 'Google' : 'Microsoft'}</b><strong>{rule.value}</strong><small>{rule.ruleType === 'email' ? 'Correo exacto' : 'Dominio completo'} · {rule.enabled ? 'activo' : 'desactivado'}</small></span><button aria-label={`Eliminar acceso ${rule.value}`} disabled={Boolean(busy)} onClick={() => void removeRule(rule.id)}><Trash2 size={16} /></button></article>)}{rules.length === 0 && <Empty label="No hay reglas adicionales configuradas." />}</div></section></div></section>;
}

function ContentView({ courses, reload, setError }: { courses: AdminCourse[]; reload(): Promise<void>; setError(value: string | null): void }) {
  const [busy, setBusy] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const change = async (course: AdminCourse, availability: AdminCourse['availability']) => {
    setBusy(course.slug); setError(null);
    try { await staffDashboardApi.setCourseAvailability(course.slug, availability, availability === 'available' ? undefined : reasons[course.slug] ?? course.availabilityReason ?? 'Disponible próximamente.'); await reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos cambiar la disponibilidad del curso.'); }
    finally { setBusy(''); }
  };
  return <section className="staff-content"><div className="staff-access__intro"><LibraryBig size={28} /><div><h2>Contenido y publicación</h2><p>Edita la ficha pública con campos seguros y controla el acceso general. Cada cambio de contenido crea una versión nueva sin alterar las lecciones publicadas.</p></div></div><div className="staff-course-list">{courses.map((course) => <article key={course.slug}><CourseContentEditor course={course} disabled={Boolean(busy)} reload={reload} setError={setError} /><div className="staff-course-list__controls"><label>Disponibilidad general<select value={course.availability} disabled={Boolean(busy)} onChange={(event) => void change(course, event.target.value as AdminCourse['availability'])}><option value="available">Disponible</option><option value="locked">Bloqueado</option><option value="hidden">Oculto</option></select></label><label>Mensaje público<input value={reasons[course.slug] ?? course.availabilityReason ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [course.slug]: event.target.value }))} placeholder="Ej. Disponible próximamente" /></label><button disabled={Boolean(busy)} onClick={() => void change(course, course.availability)}>{busy === course.slug ? 'Guardando…' : `Guardar acceso general de ${course.slug}`}</button></div></article>)}{courses.length === 0 && <Empty label="Todavía no hay cursos publicados en el backend." />}</div></section>;
}

function CourseContentEditor({ course, disabled, reload, setError }: { course: AdminCourse; disabled: boolean; reload(): Promise<void>; setError(value: string | null): void }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [tagline, setTagline] = useState(typeof course.metadata.tagline === 'string' ? course.metadata.tagline : '');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setTitle(course.title);
    setDescription(course.description);
    setTagline(typeof course.metadata.tagline === 'string' ? course.metadata.tagline : '');
  }, [course.description, course.metadata.tagline, course.title]);
  const save = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true); setError(null);
    try {
      await staffDashboardApi.updateCourseContent(course.slug, {
        title: title.trim(), description: description.trim(),
        metadata: { ...course.metadata, tagline: tagline.trim() },
      });
      await reload();
    } catch (error) { setError(error instanceof Error ? error.message : 'No pudimos actualizar el contenido del curso.'); }
    finally { setSaving(false); }
  };
  return <div className="staff-course-content"><span>{course.slug}</span><label>Título de {course.slug}<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} /></label><label>Descripción de {course.slug}<textarea value={description} maxLength={1000} onChange={(event) => setDescription(event.target.value)} /></label><label>Frase corta de {course.slug}<input value={tagline} maxLength={180} onChange={(event) => setTagline(event.target.value)} /></label><button aria-label={`Guardar contenido de ${course.slug}`} disabled={disabled || saving || !title.trim() || !description.trim()} onClick={() => void save()}>{saving ? 'Guardando versión…' : 'Guardar contenido'}</button></div>;
}
