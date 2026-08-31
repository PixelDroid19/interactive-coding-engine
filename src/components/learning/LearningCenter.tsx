import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, Brain, Cloud, CloudOff, LoaderCircle, LogIn, X } from 'lucide-react';
import { useAuthSession } from '../../auth/AuthSessionProvider';
import type { Course } from '../../types/curriculum';
import type { LearningEvidence, LearningProfile, ReviewRating } from '../../learning/types';
import { useModalDialog } from '../useModalDialog';
import { LearningNotebook } from './LearningNotebook';
import { LiveHelpSlot, type LiveHelpIntegration } from './LiveHelpSlot';
import { ReviewQueue } from './ReviewQueue';
import type { AuthSession } from '../../services/authSessionApi';
import {
  cacheLearningCenterSnapshot,
  createRemoteNotebook,
  deleteRemoteNotebook,
  fetchLearningCenter,
  getCachedLearningCenter,
  markRemoteReinforcementReviewed,
  rateRemoteReview,
  updateRemoteNotebook,
  type LearningCenterSnapshot,
  type RemoteNotebookEntry,
  type RemoteReinforcement,
  type RemoteReviewCard,
} from '../../services/learningCenterApi';
import type { NotebookSaveInput } from './LearningNotebook';
import { UiTabs } from '../ui/UiTabs';
import { UiButton } from '../ui/UiButton';
import { UiSurface } from '../ui/UiSurface';

type LearningTab = 'review' | 'notebook';
type RemoteStatus = 'loading' | 'ready' | 'cached' | 'error';

interface LearningCenterProps {
  course: Course;
  profile: LearningProfile;
  onClose: () => void;
  onSummaryChange?: (userId: string | null, summary: LearningCenterSnapshot['summary'] | null) => void;
  liveHelpIntegration?: LiveHelpIntegration;
}

interface ScopedSnapshot {
  userId: string;
  snapshot: LearningCenterSnapshot;
}

interface ScopedRemoteState {
  userId: string | null;
  status: RemoteStatus;
  message: string;
}

interface PendingRemoteState {
  notes: RemoteNotebookEntry[];
  deletedNoteIds: string[];
  ratedReviews: Array<{ reviewId: string; revision: string }>;
  reviewedReinforcements: Array<{ reinforcementId: string; revision: string }>;
}

const EMPTY_PENDING: PendingRemoteState = {
  notes: [],
  deletedNoteIds: [],
  ratedReviews: [],
  reviewedReinforcements: [],
};

const TABS: ReadonlyArray<Readonly<{ id: LearningTab; label: string; icon: React.ReactNode }>> = [
  { id: 'review', label: 'Repaso', icon: <Brain size={16} /> },
  { id: 'notebook', label: 'Mis notas', icon: <BookOpenText size={16} /> },
];

const LOGIN_LABEL: Record<'google' | 'microsoft', string> = {
  google: 'Continuar con Google',
  microsoft: 'Continuar con Microsoft',
};

function getAnonymousSession(session: AuthSession): Extract<AuthSession, { authenticated: false }> | null {
  return 'providers' in session ? session : null;
}

function toRemoteEvidence(course: Course, snapshot: LearningCenterSnapshot): LearningEvidence[] {
  const skillKeys = new Set([
    ...snapshot.reviews.map((entry) => entry.skillKey),
    ...snapshot.reinforcements.map((entry) => entry.skillKey),
    ...snapshot.skillGaps.map((entry) => entry.skillKey),
  ]);
  const timestamp = Date.parse(snapshot.generatedAt);
  return [...skillKeys].map((skillId, index) => ({
    id: `remote:${snapshot.courseSlug}:${skillId}`,
    courseId: course.id,
    itemId: snapshot.skillGaps.find((entry) => entry.skillKey === skillId)?.skillKey ?? `remote-${index}`,
    skillId,
    capability: 'recognize' as const,
    result: 'partial' as const,
    source: 'review' as const,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
  }));
}

function withoutCoursePersonalData(profile: LearningProfile, courseId: string): LearningProfile {
  return {
    ...profile,
    evidence: profile.evidence.filter((entry) => entry.courseId !== courseId),
    reviews: profile.reviews.filter((entry) => entry.courseId !== courseId),
    notebook: profile.notebook.filter((entry) => entry.courseId !== courseId),
    tutor: {
      ...profile.tutor,
      reinforcements: profile.tutor.reinforcements.filter((entry) => entry.courseId !== courseId),
    },
  };
}

function reviewRevision(entry: RemoteReviewCard): string {
  return `${entry.lastReviewedAt ?? 'never'}:${entry.repetitions}:${entry.dueAt}`;
}

function reinforcementRevision(entry: RemoteReinforcement): string {
  return `${entry.reviewedAt ?? 'pending'}:${entry.updatedAt}`;
}

function notesStillAwaitingRemoteConfirmation(remoteNotes: RemoteNotebookEntry[], pendingNotes: RemoteNotebookEntry[]): RemoteNotebookEntry[] {
  return pendingNotes.filter((pending) => {
    const remote = remoteNotes.find((candidate) => candidate.id === pending.id);
    if (!remote) return true;
    const remoteUpdatedAt = Date.parse(remote.updatedAt);
    const pendingUpdatedAt = Date.parse(pending.updatedAt);
    return !Number.isFinite(remoteUpdatedAt) || !Number.isFinite(pendingUpdatedAt) || remoteUpdatedAt < pendingUpdatedAt;
  });
}

function reconcilePending(snapshot: LearningCenterSnapshot, pending: PendingRemoteState): PendingRemoteState {
  return {
    notes: notesStillAwaitingRemoteConfirmation(snapshot.notes, pending.notes),
    deletedNoteIds: pending.deletedNoteIds.filter((id) => snapshot.notes.some((note) => note.id === id)),
    ratedReviews: pending.ratedReviews.filter((pendingReview) => {
      const remote = snapshot.reviews.find((entry) => entry.id === pendingReview.reviewId);
      return Boolean(remote && reviewRevision(remote) === pendingReview.revision);
    }),
    reviewedReinforcements: pending.reviewedReinforcements.filter((pendingReinforcement) => {
      const remote = snapshot.reinforcements.find((entry) => entry.id === pendingReinforcement.reinforcementId);
      return Boolean(remote && reinforcementRevision(remote) === pendingReinforcement.revision);
    }),
  };
}

function isPendingReview(entry: RemoteReviewCard, pending: PendingRemoteState): boolean {
  return pending.ratedReviews.some((candidate) => candidate.reviewId === entry.id && candidate.revision === reviewRevision(entry));
}

function isPendingReinforcement(entry: RemoteReinforcement, pending: PendingRemoteState): boolean {
  return pending.reviewedReinforcements.some((candidate) => candidate.reinforcementId === entry.id && candidate.revision === reinforcementRevision(entry));
}

function withPendingRemoteState(snapshot: LearningCenterSnapshot, pending: PendingRemoteState): LearningCenterSnapshot {
  const notes = new Map(snapshot.notes.filter((entry) => !pending.deletedNoteIds.includes(entry.id)).map((entry) => [entry.id, entry]));
  notesStillAwaitingRemoteConfirmation(snapshot.notes, pending.notes).forEach((entry) => notes.set(entry.id, entry));
  const reviews = snapshot.reviews.filter((entry) => !isPendingReview(entry, pending));
  const reinforcements = snapshot.reinforcements.filter((entry) => !isPendingReinforcement(entry, pending));
  return {
    ...snapshot,
    notes: [...notes.values()],
    reviews,
    reinforcements,
    summary: {
      ...snapshot.summary,
      dueReviews: Math.max(0, snapshot.summary.dueReviews - (snapshot.reviews.length - reviews.length)),
      reinforcements: Math.max(0, snapshot.summary.reinforcements - (snapshot.reinforcements.length - reinforcements.length)),
      notes: Math.max(snapshot.summary.notes, notes.size),
    },
  };
}

function mergeRemoteProfile(profile: LearningProfile, course: Course, snapshot: LearningCenterSnapshot | null, pending: PendingRemoteState): LearningProfile {
  const base = withoutCoursePersonalData(profile, course.id);
  if (!snapshot) return base;
  const notes = new Map(snapshot.notes.filter((entry) => !pending.deletedNoteIds.includes(entry.id)).map((entry) => [entry.id, entry]));
  notesStillAwaitingRemoteConfirmation(snapshot.notes, pending.notes).forEach((entry) => notes.set(entry.id, entry));
  const reviews = snapshot.reviews.filter((entry) => !isPendingReview(entry, pending));
  const reinforcements = snapshot.reinforcements.filter((entry) => !isPendingReinforcement(entry, pending));
  return {
    ...base,
    evidence: [...base.evidence, ...toRemoteEvidence(course, snapshot)],
    reviews: reviews.map((entry) => ({
      id: entry.id,
      courseId: course.id,
      itemId: entry.itemKey,
      skillId: entry.skillKey,
      prompt: entry.prompt,
      intervalIndex: entry.intervalIndex,
      dueAt: Date.parse(entry.dueAt),
      lastReviewedAt: entry.lastReviewedAt ? Date.parse(entry.lastReviewedAt) : 0,
      repetitions: entry.repetitions,
    })),
    notebook: [...notes.values()].map((entry) => ({
      id: entry.id,
      courseId: course.id,
      title: entry.title,
      body: entry.body,
      ...(entry.itemKey ? { itemId: entry.itemKey } : {}),
      updatedAt: Date.parse(entry.updatedAt),
    })),
    tutor: {
      ...base.tutor,
      reinforcements: reinforcements.map((entry) => ({
        id: entry.id,
        courseId: course.id,
        itemId: entry.itemKey,
        skillId: entry.skillKey,
        note: entry.note,
        evidence: entry.evidence,
        occurrences: entry.occurrences,
        reviewed: Boolean(entry.reviewedAt),
        createdAt: Date.parse(entry.createdAt),
        updatedAt: Date.parse(entry.updatedAt),
      })),
    },
  };
}

function summaryWithPending(snapshot: LearningCenterSnapshot | null, pending: PendingRemoteState): LearningCenterSnapshot['summary'] | null {
  if (!snapshot) return null;
  const awaitingNotes = notesStillAwaitingRemoteConfirmation(snapshot.notes, pending.notes);
  const hiddenReviews = snapshot.reviews.filter((entry) => isPendingReview(entry, pending)).length;
  const hiddenReinforcements = snapshot.reinforcements.filter((entry) => isPendingReinforcement(entry, pending)).length;
  return {
    ...snapshot.summary,
    dueReviews: Math.max(0, snapshot.summary.dueReviews - hiddenReviews),
    reinforcements: Math.max(0, snapshot.summary.reinforcements - hiddenReinforcements),
    notes: Math.max(0, new Map([...snapshot.notes.filter((entry) => !pending.deletedNoteIds.includes(entry.id)), ...awaitingNotes].map((entry) => [entry.id, entry])).size),
  };
}

function AccessState({ title, description, action }: Readonly<{ title: string; description: string; action?: React.ReactNode }>) {
  return (
    <main className="learning-center__access-state">
      <UiSurface className="learning-empty" aria-live="polite">
        <h3>{title}</h3>
        <p>{description}</p>
        {action}
      </UiSurface>
    </main>
  );
}

export const LearningCenter: React.FC<LearningCenterProps> = ({ course, profile, onClose, onSummaryChange, liveHelpIntegration }) => {
  const dialogRef = useModalDialog<HTMLElement>({ open: true, onClose });
  const auth = useAuthSession();
  const studentUserId =
    auth.status === 'ready' && auth.session.authenticated && auth.session.user.roles.includes('student') && auth.session.user.id.trim()
      ? auth.session.user.id.trim()
      : null;
  const isStudent = studentUserId !== null;
  const cached = useMemo(() => (studentUserId ? getCachedLearningCenter(studentUserId, course.slug) : null), [course.slug, studentUserId]);
  const [tab, setTab] = useState<LearningTab>('review');
  const [scopedSnapshot, setScopedSnapshot] = useState<ScopedSnapshot | null>(null);
  const [pendingRemote, setPendingRemote] = useState<PendingRemoteState>(EMPTY_PENDING);
  const [remoteState, setRemoteState] = useState<ScopedRemoteState>({
    userId: null,
    status: 'loading',
    message: '',
  });
  const snapshotRef = useRef<ScopedSnapshot | null>(null);
  const pendingRemoteRef = useRef<PendingRemoteState>(EMPTY_PENDING);
  const currentUserRef = useRef<string | null>(studentUserId);
  const requestVersionRef = useRef(0);
  const scopeGenerationRef = useRef(0);
  const scopeControllerRef = useRef<AbortController | null>(null);
  const onSummaryChangeRef = useRef(onSummaryChange);

  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  }, [onSummaryChange]);

  const replacePendingForUser = useCallback((userId: string, next: PendingRemoteState): boolean => {
    if (currentUserRef.current !== userId) return false;
    pendingRemoteRef.current = next;
    setPendingRemote(next);
    return true;
  }, []);

  const isCurrentScope = useCallback((userId: string, generation: number, signal: AbortSignal): boolean => {
    return !signal.aborted && currentUserRef.current === userId && scopeGenerationRef.current === generation;
  }, []);

  const commitSnapshot = useCallback(
    (userId: string, nextSnapshot: LearningCenterSnapshot, generation: number, signal: AbortSignal): boolean => {
      if (!isCurrentScope(userId, generation, signal)) return false;
      cacheLearningCenterSnapshot(userId, nextSnapshot);
      if (!isCurrentScope(userId, generation, signal)) return false;
      const scoped = { userId, snapshot: nextSnapshot };
      snapshotRef.current = scoped;
      setScopedSnapshot(scoped);
      return true;
    },
    [isCurrentScope],
  );

  const getCurrentScope = useCallback((userId: string): { generation: number; signal: AbortSignal } | null => {
    const controller = scopeControllerRef.current;
    if (!controller || !isCurrentScope(userId, scopeGenerationRef.current, controller.signal)) return null;
    return { generation: scopeGenerationRef.current, signal: controller.signal };
  }, [isCurrentScope]);

  const refresh = useCallback(
    async (userId: string, signal: AbortSignal, generation: number) => {
      const requestVersion = ++requestVersionRef.current;
      try {
        const remote = await fetchLearningCenter(userId, course.slug, signal);
        if (!isCurrentScope(userId, generation, signal) || requestVersion !== requestVersionRef.current) return;
        const reconciledPending = reconcilePending(remote, pendingRemoteRef.current);
        const nextSnapshot = withPendingRemoteState(remote, reconciledPending);
        if (!commitSnapshot(userId, nextSnapshot, generation, signal)) return;
        replacePendingForUser(userId, reconciledPending);
        setRemoteState({ userId, status: 'ready', message: '' });
      } catch (error) {
        if (!isCurrentScope(userId, generation, signal) || requestVersion !== requestVersionRef.current) return;
        const hasCachedSnapshot = snapshotRef.current?.userId === userId;
        setRemoteState({
          userId,
          status: hasCachedSnapshot ? 'cached' : 'error',
          message: error instanceof Error ? error.message : 'No se pudo sincronizar tu aprendizaje.',
        });
      }
    },
    [commitSnapshot, course.slug, isCurrentScope, replacePendingForUser],
  );

  useEffect(() => {
    const controller = new AbortController();
    const generation = ++scopeGenerationRef.current;
    scopeControllerRef.current?.abort();
    scopeControllerRef.current = controller;
    currentUserRef.current = studentUserId;
    requestVersionRef.current += 1;
    pendingRemoteRef.current = EMPTY_PENDING;
    setPendingRemote(EMPTY_PENDING);
    setTab('review');
    const nextSnapshot = studentUserId && cached ? { userId: studentUserId, snapshot: cached.snapshot } : null;
    snapshotRef.current = nextSnapshot;
    setScopedSnapshot(nextSnapshot);
    setRemoteState({
      userId: studentUserId,
      status: nextSnapshot ? 'cached' : 'loading',
      message: '',
    });
    if (studentUserId) void refresh(studentUserId, controller.signal, generation);
    return () => {
      controller.abort();
      if (scopeControllerRef.current === controller) scopeControllerRef.current = null;
      if (scopeGenerationRef.current === generation) scopeGenerationRef.current += 1;
    };
  }, [cached, course.slug, refresh, studentUserId]);

  const snapshot = scopedSnapshot?.userId === studentUserId ? scopedSnapshot.snapshot : null;
  const activeRemoteState = remoteState.userId === studentUserId ? remoteState : { userId: studentUserId, status: 'loading' as const, message: '' };
  const visibleSummary = useMemo(() => summaryWithPending(snapshot, pendingRemote), [pendingRemote, snapshot]);
  useEffect(() => {
    onSummaryChangeRef.current?.(studentUserId, visibleSummary);
  }, [studentUserId, visibleSummary]);
  useEffect(
    () => () => {
      onSummaryChangeRef.current?.(null, null);
    },
    [],
  );

  const effectiveProfile = useMemo(() => mergeRemoteProfile(profile, course, snapshot, pendingRemote), [course, pendingRemote, profile, snapshot]);
  const dueCount = visibleSummary?.dueReviews ?? 0;
  const reinforcementCount = visibleSummary?.reinforcements ?? 0;
  const noteCount = visibleSummary?.notes ?? 0;

  const rateReview = async (reviewId: string, rating: ReviewRating) => {
    const userId = studentUserId;
    const scoped = snapshotRef.current;
    const review = scoped?.userId === userId ? scoped.snapshot.reviews.find((entry) => entry.id === reviewId) : undefined;
    const scope = userId ? getCurrentScope(userId) : null;
    if (!userId || !review || !scope) throw new Error('Este repaso ya no está disponible. Actualiza tu aprendizaje e inténtalo otra vez.');
    await rateRemoteReview(reviewId, rating);
    if (!isCurrentScope(userId, scope.generation, scope.signal)) return;
    const nextPending = {
      ...pendingRemoteRef.current,
      ratedReviews: [...pendingRemoteRef.current.ratedReviews.filter((entry) => entry.reviewId !== reviewId), { reviewId, revision: reviewRevision(review) }],
    };
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot?.userId !== userId) return;
    const nextSnapshot = withPendingRemoteState(currentSnapshot.snapshot, nextPending);
    if (!commitSnapshot(userId, nextSnapshot, scope.generation, scope.signal)) return;
    replacePendingForUser(userId, nextPending);
    await refresh(userId, scope.signal, scope.generation);
  };

  const saveNotebook = async (entry: NotebookSaveInput) => {
    const userId = studentUserId;
    const scope = userId ? getCurrentScope(userId) : null;
    if (!userId || !scope) throw new Error('Inicia sesión para guardar una nota personal.');
    const payload = {
      courseSlug: course.slug,
      title: entry.title,
      body: entry.body,
      ...(entry.itemId ? { itemKey: entry.itemId } : {}),
    };
    const savedEntry = entry.id ? await updateRemoteNotebook(entry.id, payload) : await createRemoteNotebook(payload);
    if (entry.id && savedEntry.id !== entry.id) throw new Error('La respuesta no corresponde a la nota que estabas editando.');
    if (!isCurrentScope(userId, scope.generation, scope.signal)) return;
    const nextPending = {
      ...pendingRemoteRef.current,
      notes: [...pendingRemoteRef.current.notes.filter((candidate) => candidate.id !== savedEntry.id), savedEntry],
      deletedNoteIds: pendingRemoteRef.current.deletedNoteIds.filter((id) => id !== savedEntry.id),
    };
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot?.userId !== userId) return;
    const nextSnapshot = withPendingRemoteState(currentSnapshot.snapshot, nextPending);
    if (!commitSnapshot(userId, nextSnapshot, scope.generation, scope.signal)) return;
    replacePendingForUser(userId, nextPending);
    await refresh(userId, scope.signal, scope.generation);
  };

  const deleteNotebook = async (noteId: string) => {
    const userId = studentUserId;
    const scope = userId ? getCurrentScope(userId) : null;
    if (!userId || !scope) throw new Error('Inicia sesión para eliminar una nota personal.');
    await deleteRemoteNotebook(noteId);
    if (!isCurrentScope(userId, scope.generation, scope.signal)) return;
    const nextPending = {
      ...pendingRemoteRef.current,
      notes: pendingRemoteRef.current.notes.filter((entry) => entry.id !== noteId),
      deletedNoteIds: [...new Set([...pendingRemoteRef.current.deletedNoteIds, noteId])],
    };
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot?.userId !== userId) return;
    const nextSnapshot = withPendingRemoteState(currentSnapshot.snapshot, nextPending);
    if (!commitSnapshot(userId, nextSnapshot, scope.generation, scope.signal)) return;
    replacePendingForUser(userId, nextPending);
    await refresh(userId, scope.signal, scope.generation);
  };

  const reviewReinforcement = async (reinforcementId: string) => {
    const userId = studentUserId;
    const scoped = snapshotRef.current;
    const reinforcement = scoped?.userId === userId ? scoped.snapshot.reinforcements.find((entry) => entry.id === reinforcementId) : undefined;
    const scope = userId ? getCurrentScope(userId) : null;
    if (!userId || !reinforcement || !scope) throw new Error('Este refuerzo ya no está disponible. Actualiza tu aprendizaje e inténtalo otra vez.');
    await markRemoteReinforcementReviewed(reinforcementId);
    if (!isCurrentScope(userId, scope.generation, scope.signal)) return;
    const nextPending = {
      ...pendingRemoteRef.current,
      reviewedReinforcements: [
        ...pendingRemoteRef.current.reviewedReinforcements.filter((entry) => entry.reinforcementId !== reinforcementId),
        { reinforcementId, revision: reinforcementRevision(reinforcement) },
      ],
    };
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot?.userId !== userId) return;
    const nextSnapshot = withPendingRemoteState(currentSnapshot.snapshot, nextPending);
    if (!commitSnapshot(userId, nextSnapshot, scope.generation, scope.signal)) return;
    replacePendingForUser(userId, nextPending);
    await refresh(userId, scope.signal, scope.generation);
  };

  const renderStudentContent = () => (
    <>
      <div className="learning-center__summary" role="group" aria-label="Resumen de aprendizaje">
        <span>
          <strong>{dueCount}</strong> {dueCount === 1 ? 'repaso pendiente' : 'repasos pendientes'}
        </span>
        <span>
          <strong>{reinforcementCount}</strong> por reforzar
        </span>
        <span>
          <strong>{noteCount}</strong> {noteCount === 1 ? 'nota propia' : 'notas propias'}
        </span>
      </div>
      <UiTabs ariaLabel="Secciones de aprendizaje" activeId={tab} tabs={TABS} onChange={(next) => setTab(next as LearningTab)} />
      <main
        id={`ui-panel-${tab}`}
        role="tabpanel"
        aria-label={TABS.find((candidate) => candidate.id === tab)?.label}
        aria-labelledby={`ui-tab-${tab}`}
        tabIndex={0}
      >
        {tab === 'review' && (
          <>
            <ReviewQueue courseId={course.id} profile={effectiveProfile} onRate={rateReview} onReviewReinforcement={reviewReinforcement} />
            {liveHelpIntegration && <LiveHelpSlot integration={liveHelpIntegration} />}
          </>
        )}
        {tab === 'notebook' && <LearningNotebook courseId={course.id} profile={effectiveProfile} onSave={saveNotebook} onDelete={deleteNotebook} />}
      </main>
    </>
  );

  const renderAccessContent = () => {
    if (auth.status === 'loading')
      return <AccessState title="Comprobando tu sesión" description="Tus cursos y prácticas seguirán disponibles mientras verificamos el acceso." />;
    if (auth.status === 'error') return <AccessState title="No pudimos comprobar tu sesión" description={auth.error} />;
    const anonymousSession = getAnonymousSession(auth.session);
    if (anonymousSession) {
      return (
        <AccessState
          title="Inicia sesión para ver tu aprendizaje"
          description="Tus cursos y prácticas siguen disponibles; inicia sesión para recuperar tus repasos y notas personales."
          action={
            anonymousSession.providers.length > 0 ? (
              <div className="learning-center__login-actions">
                {anonymousSession.providers.map((provider) => (
                  <UiButton
                    key={provider}
                    variant={provider === 'google' ? 'primary' : 'secondary'}
                    className={`learning-login-btn learning-login-btn--${provider}`}
                    disabled={auth.busy}
                    onClick={() => auth.login(provider)}
                  >
                    <LogIn size={16} aria-hidden="true" className="learning-login-btn__icon" />
                    <span className="learning-login-btn__label">{LOGIN_LABEL[provider]}</span>
                  </UiButton>
                ))}
              </div>
            ) : undefined
          }
        />
      );
    }
    return (
      <AccessState
        title="Esta cuenta no tiene acceso de alumno"
        description="El Centro de aprendizaje solo muestra datos personales a cuentas con el rol de alumno."
      />
    );
  };

  return (
    <div className="learning-center-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className={`learning-center${isStudent ? '' : ' learning-center--access'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Centro de aprendizaje"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>TU APRENDIZAJE</span>
            <h2>Centro de aprendizaje</h2>
            <p>Repasa, explica y organiza lo que estás aprendiendo en {course.title}.</p>
            {isStudent && (
              <div className={`learning-center__sync is-${activeRemoteState.status}`} role="status">
                {activeRemoteState.status === 'loading' ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : activeRemoteState.status === 'ready' ? (
                  <Cloud size={13} />
                ) : (
                  <CloudOff size={13} />
                )}
                <span>
                  {activeRemoteState.status === 'loading'
                    ? 'Sincronizando tu progreso…'
                    : activeRemoteState.status === 'ready'
                      ? 'Progreso sincronizado'
                      : activeRemoteState.status === 'cached'
                        ? 'Mostrando la última copia disponible'
                        : 'No pudimos recuperar tu progreso'}
                </span>
                {activeRemoteState.message && <small>{activeRemoteState.message}</small>}
              </div>
            )}
          </div>
          <UiButton variant="icon" data-dialog-initial-focus onClick={onClose} aria-label="Cerrar centro de aprendizaje">
            <X size={19} />
          </UiButton>
        </header>
        {isStudent ? renderStudentContent() : renderAccessContent()}
      </section>
    </div>
  );
};
