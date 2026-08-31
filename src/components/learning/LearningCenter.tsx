import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, Brain, Cloud, CloudOff, LoaderCircle, LogIn, Route, X } from 'lucide-react';
import { useAuthSession } from '../../auth/AuthSessionProvider';
import type { Course } from '../../types/curriculum';
import type { LearningEvidence, LearningProfile, NotebookEntry, ReviewRating } from '../../learning/types';
import { useTheme } from '../../themes/ThemeProvider';
import { useModalDialog } from '../useModalDialog';
import { LearningNotebook } from './LearningNotebook';
import { LiveHelpSlot, type LiveHelpIntegration } from './LiveHelpSlot';
import { ReviewQueue } from './ReviewQueue';
import { TechnologyPath } from './TechnologyPath';
import type { AuthSession } from '../../services/authSessionApi';
import {
  cacheLearningCenterSnapshot,
  fetchLearningCenter,
  getCachedLearningCenter,
  markRemoteReinforcementReviewed,
  rateRemoteReview,
  saveRemoteNotebook,
  type LearningCenterSnapshot,
  type RemoteNotebookEntry,
  withSavedNotebook,
} from '../../services/learningCenterApi';

type LearningTab = 'review' | 'notebook' | 'path';

interface LearningCenterProps {
  course: Course;
  profile: LearningProfile;
  onClose: () => void;
  onRateReview: (reviewId: string, rating: ReviewRating) => Promise<void>;
  onSaveNotebook: (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => Promise<void>;
  onReviewReinforcement: (reinforcementId: string) => Promise<void>;
  onSummaryChange?: (summary: LearningCenterSnapshot['summary']) => void;
  liveHelpIntegration?: LiveHelpIntegration;
}

const TABS: ReadonlyArray<Readonly<{ id: LearningTab; label: string; icon: React.ReactNode }>> = [
  { id: 'review', label: 'Repaso', icon: <Brain size={16} /> },
  { id: 'notebook', label: 'Mis notas', icon: <BookOpenText size={16} /> },
  { id: 'path', label: 'Mi ruta', icon: <Route size={16} /> },
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
    ...snapshot.notes.map((entry) => entry.skillKey),
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

function mergeRemoteProfile(profile: LearningProfile, course: Course, snapshot: LearningCenterSnapshot | null): LearningProfile {
  if (!snapshot) return profile;

  const evidence = new Map(profile.evidence.map((entry) => [entry.id, entry]));
  toRemoteEvidence(course, snapshot).forEach((entry) => evidence.set(entry.id, entry));

  const reviews = new Map(profile.reviews.map((entry) => [entry.id, entry]));
  snapshot.reviews.forEach((entry) => {
    reviews.set(entry.id, {
      id: entry.id,
      courseId: course.id,
      itemId: entry.itemKey,
      skillId: entry.skillKey,
      prompt: entry.prompt,
      intervalIndex: entry.intervalIndex,
      dueAt: Date.parse(entry.dueAt),
      lastReviewedAt: entry.lastReviewedAt ? Date.parse(entry.lastReviewedAt) : 0,
      repetitions: entry.repetitions,
    });
  });

  const notebook = new Map(profile.notebook.map((entry) => [`${entry.courseId}:${entry.skillId}`, entry]));
  snapshot.notes.forEach((entry) => {
    notebook.set(`${course.id}:${entry.skillKey}`, {
      id: entry.id,
      courseId: course.id,
      skillId: entry.skillKey,
      concept: entry.concept,
      mentalModel: entry.mentalModel,
      pattern: entry.pattern,
      ownExample: entry.ownExample,
      personalMistake: entry.personalMistake,
      updatedAt: Date.parse(entry.updatedAt),
    });
  });

  const reinforcements = new Map(profile.tutor.reinforcements.map((entry) => [entry.id, entry]));
  snapshot.reinforcements.forEach((entry) => {
    reinforcements.set(entry.id, {
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
    });
  });

  return {
    ...profile,
    evidence: [...evidence.values()],
    reviews: [...reviews.values()],
    notebook: [...notebook.values()],
    tutor: { ...profile.tutor, reinforcements: [...reinforcements.values()] },
  };
}

function notesStillAwaitingRemoteConfirmation(
  remoteNotes: RemoteNotebookEntry[],
  confirmedNotes: RemoteNotebookEntry[],
): RemoteNotebookEntry[] {
  return confirmedNotes.filter((confirmed) => {
    const remote = remoteNotes.find((candidate) => candidate.skillKey === confirmed.skillKey);
    if (!remote) return true;

    const remoteUpdatedAt = Date.parse(remote.updatedAt);
    const confirmedUpdatedAt = Date.parse(confirmed.updatedAt);
    return !Number.isFinite(remoteUpdatedAt) || !Number.isFinite(confirmedUpdatedAt) || remoteUpdatedAt < confirmedUpdatedAt;
  });
}

function mergeConfirmedNotes(
  profile: LearningProfile,
  course: Course,
  confirmedNotes: RemoteNotebookEntry[],
): LearningProfile {
  if (!confirmedNotes.length) return profile;

  const confirmedSkillIds = new Set(confirmedNotes.map((entry) => entry.skillKey));
  return {
    ...profile,
    notebook: [
      ...profile.notebook.filter((entry) => entry.courseId !== course.id || !confirmedSkillIds.has(entry.skillId)),
      ...confirmedNotes.map((entry) => ({
        id: entry.id,
        courseId: course.id,
        skillId: entry.skillKey,
        concept: entry.concept,
        mentalModel: entry.mentalModel,
        pattern: entry.pattern,
        ownExample: entry.ownExample,
        personalMistake: entry.personalMistake,
        updatedAt: Date.parse(entry.updatedAt),
      })),
    ],
  };
}

function AccessState({
  title,
  description,
  action,
}: Readonly<{
  title: string;
  description: string;
  action?: React.ReactNode;
}>) {
  return (
    <main className="learning-center__access-state">
      <section className="learning-empty" aria-live="polite">
        <h3>{title}</h3>
        <p>{description}</p>
        {action}
      </section>
    </main>
  );
}

export const LearningCenter: React.FC<LearningCenterProps> = ({
  course,
  profile,
  onClose,
  onRateReview,
  onSaveNotebook,
  onReviewReinforcement,
  onSummaryChange,
  liveHelpIntegration,
}) => {
  const dialogRef = useModalDialog<HTMLElement>({ open: true, onClose });
  const auth = useAuthSession();
  const { themeId } = useTheme();
  const isStudent = auth.status === 'ready'
    && auth.session.authenticated
    && auth.session.user.roles.includes('student');
  const cached = useMemo(() => (isStudent ? getCachedLearningCenter(course.slug) : null), [course.slug, isStudent]);
  const [tab, setTab] = useState<LearningTab>('review');
  const [snapshot, setSnapshot] = useState<LearningCenterSnapshot | null>(cached?.snapshot ?? null);
  const snapshotRef = useRef<LearningCenterSnapshot | null>(snapshot);
  const [confirmedNotes, setConfirmedNotes] = useState<RemoteNotebookEntry[]>([]);
  const confirmedNotesRef = useRef<RemoteNotebookEntry[]>([]);
  const onSummaryChangeRef = useRef(onSummaryChange);
  const [remoteStatus, setRemoteStatus] = useState<'loading' | 'ready' | 'cached' | 'error'>(cached ? (cached.fresh ? 'ready' : 'cached') : 'loading');
  const [remoteMessage, setRemoteMessage] = useState('');
  const isCyber = themeId === 'cyber';

  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  }, [onSummaryChange]);

  useEffect(() => {
    if (snapshot) onSummaryChangeRef.current?.(snapshot.summary);
  }, [snapshot]);

  useEffect(() => {
    confirmedNotesRef.current = [];
    setConfirmedNotes([]);
    const nextSnapshot = isStudent ? cached?.snapshot ?? null : null;
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    setRemoteStatus(nextSnapshot ? (cached?.fresh ? 'ready' : 'cached') : 'loading');
    setRemoteMessage('');
  }, [cached?.fresh, cached?.snapshot, course.slug, isStudent]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const remote = await fetchLearningCenter(course.slug, signal);
      const pendingConfirmations = notesStillAwaitingRemoteConfirmation(remote.notes, confirmedNotesRef.current);
      confirmedNotesRef.current = pendingConfirmations;
      setConfirmedNotes(pendingConfirmations);
      const next = pendingConfirmations.reduce(withSavedNotebook, remote);
      snapshotRef.current = next;
      setSnapshot(next);
      cacheLearningCenterSnapshot(next);
      setRemoteStatus('ready');
      setRemoteMessage('');
    } catch (error) {
      if (signal?.aborted) return;
      setRemoteStatus(snapshotRef.current ? 'cached' : 'error');
      setRemoteMessage(error instanceof Error ? error.message : 'No se pudo sincronizar tu aprendizaje.');
    }
  }, [course.slug]);

  useEffect(() => {
    if (!isStudent || cached?.fresh) return;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [cached?.fresh, isStudent, refresh]);

  const effectiveProfile = useMemo(
    () => mergeConfirmedNotes(mergeRemoteProfile(profile, course, snapshot), course, confirmedNotes),
    [confirmedNotes, course, profile, snapshot],
  );
  const dueCount = snapshot?.summary.dueReviews ?? effectiveProfile.reviews.filter((entry) => entry.courseId === course.id && entry.dueAt <= Date.now()).length;
  const reinforcementCount = snapshot?.summary.reinforcements ?? effectiveProfile.tutor.reinforcements.filter((entry) => entry.courseId === course.id && !entry.reviewed).length;
  const noteCount = snapshot?.summary.notes ?? effectiveProfile.notebook.filter((entry) => entry.courseId === course.id).length;

  const rateReview = async (reviewId: string, rating: ReviewRating) => {
    if (snapshot?.reviews.some((entry) => entry.id === reviewId)) {
      await rateRemoteReview(reviewId, rating);
      await refresh();
      return;
    }
    await onRateReview(reviewId, rating);
  };

  const saveNotebook = async (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => {
    const savedEntry = await saveRemoteNotebook(entry.skillId, {
      courseSlug: course.slug,
      concept: entry.concept,
      mentalModel: entry.mentalModel,
      pattern: entry.pattern,
      ownExample: entry.ownExample,
      personalMistake: entry.personalMistake,
    });
    await onSaveNotebook(entry);

    const nextConfirmed = [
      ...confirmedNotesRef.current.filter((candidate) => candidate.skillKey !== savedEntry.skillKey),
      savedEntry,
    ];
    confirmedNotesRef.current = nextConfirmed;
    setConfirmedNotes(nextConfirmed);
    if (snapshotRef.current) {
      const next = withSavedNotebook(snapshotRef.current, savedEntry);
      snapshotRef.current = next;
      setSnapshot(next);
      cacheLearningCenterSnapshot(next);
    }
  };

  const reviewReinforcement = async (reinforcementId: string) => {
    if (snapshot?.reinforcements.some((entry) => entry.id === reinforcementId)) {
      await markRemoteReinforcementReviewed(reinforcementId);
      await refresh();
      return;
    }
    await onReviewReinforcement(reinforcementId);
  };

  const selectTabFromKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = event.key;
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(key)) {
      if (key === 'Enter' || key === ' ') setTab(TABS[index].id);
      return;
    }
    event.preventDefault();
    const direction = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 0;
    const nextIndex = key === 'Home' ? 0 : key === 'End' ? TABS.length - 1 : (index + direction + TABS.length) % TABS.length;
    const tabs = event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  };

  const renderStudentContent = () => (
    <>
      <div className="learning-center__summary" role="group" aria-label="Resumen de aprendizaje">
        <span><strong>{dueCount}</strong> {dueCount === 1 ? 'repaso pendiente' : 'repasos pendientes'}</span>
        <span><strong>{reinforcementCount}</strong> por reforzar</span>
        <span><strong>{noteCount}</strong> {noteCount === 1 ? 'nota propia' : 'notas propias'}</span>
      </div>
      <nav role="tablist" aria-label="Secciones de aprendizaje">
        {TABS.map((candidate, index) => {
          const selected = tab === candidate.id;
          return (
            <button
              key={candidate.id}
              id={`learning-tab-${candidate.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`learning-panel-${candidate.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'is-active' : ''}
              onClick={() => setTab(candidate.id)}
              onKeyDown={(event) => selectTabFromKeyboard(event, index)}
            >
              {candidate.icon}<span>{candidate.label}</span>
            </button>
          );
        })}
      </nav>
      <main
        id={`learning-panel-${tab}`}
        role="tabpanel"
        aria-label={TABS.find((candidate) => candidate.id === tab)?.label}
        aria-labelledby={`learning-tab-${tab}`}
        tabIndex={0}
      >
        {tab === 'review' && <>
          <ReviewQueue courseId={course.id} profile={effectiveProfile} onRate={rateReview} onReviewReinforcement={reviewReinforcement} />
          {liveHelpIntegration && <LiveHelpSlot integration={liveHelpIntegration} />}
        </>}
        {tab === 'notebook' && <LearningNotebook courseId={course.id} profile={effectiveProfile} onSave={saveNotebook} />}
        {tab === 'path' && <TechnologyPath currentCourseId={course.id} />}
      </main>
    </>
  );

  const renderAccessContent = () => {
    if (auth.status === 'loading') {
      return <AccessState title="Comprobando tu sesión" description="Tus cursos y prácticas seguirán disponibles mientras verificamos el acceso." />;
    }
    if (auth.status === 'error') {
      return <AccessState title="No pudimos comprobar tu sesión" description={auth.error} />;
    }
    const anonymousSession = getAnonymousSession(auth.session);
    if (anonymousSession) {
      return (
        <AccessState
          title="Inicia sesión para ver tu aprendizaje"
          description="Tus cursos y prácticas siguen disponibles; inicia sesión para recuperar tus repasos y notas personales."
          action={anonymousSession.providers.length > 0 ? (
            <div className="learning-center__login-actions">
              {anonymousSession.providers.map((provider) => (
                <button key={provider} type="button" className="learning-primary" disabled={auth.busy} onClick={() => auth.login(provider)}>
                  <LogIn size={16} aria-hidden="true" />{LOGIN_LABEL[provider]}
                </button>
              ))}
            </div>
          ) : undefined}
        />
      );
    }
    return <AccessState title="Esta cuenta no tiene acceso de alumno" description="El Centro de aprendizaje solo muestra datos personales a cuentas con el rol de alumno." />;
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
        data-augmented-ui={isCyber ? 'learning-center-modal tl-clip tr-clip br-clip bl-clip border inlay' : undefined}
      >
        <header>
          <div>
            <span>TU APRENDIZAJE</span>
            <h2>Centro de aprendizaje</h2>
            <p>Repasa, explica y organiza lo que estás aprendiendo en {course.title}.</p>
            {isStudent && <div className={`learning-center__sync is-${remoteStatus}`} role="status">
              {remoteStatus === 'loading' ? <LoaderCircle size={13} className="animate-spin" /> : remoteStatus === 'ready' ? <Cloud size={13} /> : <CloudOff size={13} />}
              <span>{remoteStatus === 'loading' ? 'Sincronizando tu progreso…' : remoteStatus === 'ready' ? 'Progreso sincronizado' : remoteStatus === 'cached' ? 'Mostrando la última copia disponible' : 'No pudimos recuperar tu progreso'}</span>
              {remoteMessage && <small>{remoteMessage}</small>}
            </div>}
          </div>
          <button type="button" data-dialog-initial-focus onClick={onClose} aria-label="Cerrar centro de aprendizaje"><X size={19} /></button>
        </header>
        {isStudent ? renderStudentContent() : renderAccessContent()}
      </section>
    </div>
  );
};
