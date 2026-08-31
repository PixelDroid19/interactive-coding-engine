import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, Brain, ClipboardCheck, Cloud, CloudOff, LoaderCircle, LockKeyhole, MessagesSquare, Route, X } from 'lucide-react';
import { useTheme } from '../../themes/ThemeProvider';
import type { Course } from '../../types/curriculum';
import type { ExamEvaluation, ExamQuestion } from '../../learning/exam';
import type { LearningProfile, NotebookEntry, ReviewRating } from '../../learning/types';
import { ReviewQueue } from './ReviewQueue';
import { LearningNotebook } from './LearningNotebook';
import { ExamMode } from './ExamMode';
import { TechnologyPath } from './TechnologyPath';
import { useModalDialog } from '../useModalDialog';
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

type LearningTab = 'review' | 'notebook' | 'exam' | 'leader' | 'path';

interface LearningCenterProps {
  course: Course;
  profile: LearningProfile;
  onClose: () => void;
  onRateReview: (reviewId: string, rating: ReviewRating) => Promise<void>;
  onSaveNotebook: (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => Promise<void>;
  onCompleteExam: (questions: ExamQuestion[], result: ExamEvaluation) => Promise<void>;
  onReviewReinforcement: (reinforcementId: string) => Promise<void>;
  onSummaryChange?: (summary: LearningCenterSnapshot['summary']) => void;
}

const TABS: Array<{ id: LearningTab; label: string; icon: React.ReactNode; disabled?: boolean; note?: string }> = [
  { id: 'review', label: 'Repaso', icon: <Brain size={16} /> },
  { id: 'notebook', label: 'Cuaderno', icon: <BookOpenText size={16} /> },
  { id: 'exam', label: 'Examen', icon: <ClipboardCheck size={16} /> },
  { id: 'leader', label: 'Líder', icon: <MessagesSquare size={16} />, disabled: true, note: 'Requiere revisión externa' },
  { id: 'path', label: 'Ruta', icon: <Route size={16} /> },
];

function mergeRemoteProfile(profile: LearningProfile, course: Course, snapshot: LearningCenterSnapshot | null): LearningProfile {
  if (!snapshot) return profile;
  const remoteSkills = new Set([
    ...snapshot.reviews.map((entry) => entry.skillKey),
    ...snapshot.notes.map((entry) => entry.skillKey),
    ...snapshot.reinforcements.map((entry) => entry.skillKey),
    ...snapshot.skillGaps.map((entry) => entry.skillKey),
  ]);
  const syntheticEvidence = [...remoteSkills].map((skillId, index) => ({
    id: `remote:${snapshot.courseSlug}:${skillId}`,
    courseId: course.id,
    itemId: snapshot.skillGaps.find((entry) => entry.skillKey === skillId)?.skillKey ?? `remote-${index}`,
    skillId,
    capability: 'recognize' as const,
    result: 'partial' as const,
    source: 'review' as const,
    timestamp: Date.parse(snapshot.generatedAt),
  }));
  return {
    ...profile,
    evidence: [
      ...profile.evidence.filter((entry) => entry.courseId !== course.id),
      ...syntheticEvidence,
    ],
    reviews: [
      ...profile.reviews.filter((entry) => entry.courseId !== course.id),
      ...snapshot.reviews.map((entry) => ({
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
    ],
    notebook: [
      ...profile.notebook.filter((entry) => entry.courseId !== course.id),
      ...snapshot.notes.map((entry) => ({
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
    tutor: {
      ...profile.tutor,
      reinforcements: [
        ...profile.tutor.reinforcements.filter((entry) => entry.courseId !== course.id),
        ...snapshot.reinforcements.map((entry) => ({
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
      ],
    },
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
    if (!Number.isFinite(remoteUpdatedAt) || !Number.isFinite(confirmedUpdatedAt)) return true;
    return remoteUpdatedAt < confirmedUpdatedAt;
  });
}

export const LearningCenter: React.FC<LearningCenterProps> = ({ course, profile, onClose, onRateReview, onSaveNotebook, onCompleteExam, onReviewReinforcement, onSummaryChange }) => {
  const dialogRef = useModalDialog<HTMLElement>({ open: true, onClose });
  const [tab, setTab] = useState<LearningTab>('review');
  const cached = useMemo(() => getCachedLearningCenter(course.slug), [course.slug]);
  const [snapshot, setSnapshot] = useState<LearningCenterSnapshot | null>(cached?.snapshot ?? null);
  const snapshotRef = useRef<LearningCenterSnapshot | null>(snapshot);
  const [confirmedNotes, setConfirmedNotes] = useState<RemoteNotebookEntry[]>([]);
  const confirmedNotesRef = useRef<RemoteNotebookEntry[]>([]);
  const onSummaryChangeRef = useRef(onSummaryChange);
  const [remoteStatus, setRemoteStatus] = useState<'loading' | 'ready' | 'cached' | 'error'>(cached ? (cached.fresh ? 'ready' : 'cached') : 'loading');
  const [remoteMessage, setRemoteMessage] = useState('');
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';
  const effectiveProfile = useMemo(() => {
    const merged = mergeRemoteProfile(profile, course, snapshot);
    if (!confirmedNotes.length) return merged;
    const confirmedSkills = new Set(confirmedNotes.map((entry) => entry.skillKey));
    return {
      ...merged,
      notebook: [
        ...merged.notebook.filter((entry) => entry.courseId !== course.id || !confirmedSkills.has(entry.skillId)),
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
  }, [confirmedNotes, course, profile, snapshot]);
  const dueCount = snapshot?.summary.dueReviews ?? effectiveProfile.reviews.filter((entry) => entry.courseId === course.id && entry.dueAt <= Date.now()).length;
  const reinforcementCount = snapshot?.summary.reinforcements ?? effectiveProfile.tutor.reinforcements.filter((entry) => entry.courseId === course.id && !entry.reviewed).length;
  const noteCount = snapshot?.summary.notes ?? effectiveProfile.notebook.filter((entry) => entry.courseId === course.id).length;

  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  }, [onSummaryChange]);

  useEffect(() => {
    if (snapshot) onSummaryChangeRef.current?.(snapshot.summary);
  }, [snapshot]);

  const refresh = async (signal?: AbortSignal) => {
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
  };

  useEffect(() => {
    confirmedNotesRef.current = [];
    setConfirmedNotes([]);
  }, [course.slug]);

  useEffect(() => {
    if (cached?.fresh) {
      return;
    }
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  // cached se calcula por curso y no debe reiniciar la consulta por cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.slug]);

  const rateReview = async (reviewId: string, rating: ReviewRating) => {
    const isRemote = Boolean(snapshot?.reviews.some((entry) => entry.id === reviewId));
    if (isRemote) {
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
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot) {
      const next = withSavedNotebook(currentSnapshot, savedEntry);
      snapshotRef.current = next;
      setSnapshot(next);
      cacheLearningCenterSnapshot(next);
    }
  };

  const reviewReinforcement = async (reinforcementId: string) => {
    const isRemote = Boolean(snapshot?.reinforcements.some((entry) => entry.id === reinforcementId));
    if (isRemote) {
      await markRemoteReinforcementReviewed(reinforcementId);
      await refresh();
      return;
    }
    await onReviewReinforcement(reinforcementId);
  };
  return (
    <div className="learning-center-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="learning-center"
        role="dialog"
        aria-modal="true"
        aria-label="Centro de aprendizaje"
        onClick={(event) => event.stopPropagation()}
        data-augmented-ui={isCyber ? "learning-center-modal tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
      >
        <header><div><span>TU PROGRESO</span><h2>Centro de aprendizaje</h2><p>Repasa, explica y organiza lo que estás aprendiendo en {course.title}.</p><div className={`learning-center__sync is-${remoteStatus}`} role="status">{remoteStatus === 'loading' ? <LoaderCircle size={13} className="animate-spin" /> : remoteStatus === 'ready' ? <Cloud size={13} /> : <CloudOff size={13} />}<span>{remoteStatus === 'loading' ? 'Sincronizando tu progreso…' : remoteStatus === 'ready' ? 'Progreso sincronizado' : remoteStatus === 'cached' ? 'Mostrando la última copia disponible' : 'No pudimos recuperar tu progreso'}</span>{remoteMessage && <small>{remoteMessage}</small>}</div></div><button type="button" data-dialog-initial-focus onClick={onClose} aria-label="Cerrar centro de aprendizaje"><X size={19} /></button></header>
        <div className="learning-center__summary" aria-label="Resumen de aprendizaje">
          <span><strong>{dueCount}</strong> {dueCount === 1 ? 'repaso pendiente' : 'repasos pendientes'}</span>
          <span><strong>{reinforcementCount}</strong> por reforzar</span>
          <span><strong>{noteCount}</strong> {noteCount === 1 ? 'nota propia' : 'notas propias'}</span>
        </div>
        <nav aria-label="Herramientas de aprendizaje">{TABS.map((candidate) => <button key={candidate.id} type="button" className={tab === candidate.id ? 'is-active' : ''} disabled={candidate.disabled} aria-label={candidate.disabled ? `${candidate.label} · ${candidate.note}` : candidate.label} title={candidate.note} onClick={() => setTab(candidate.id)}>{candidate.disabled ? <LockKeyhole size={15} /> : candidate.icon}<span>{candidate.label}{candidate.note && <small>Próximamente</small>}</span></button>)}</nav>
        <main>
          {tab === 'review' && <ReviewQueue courseId={course.id} profile={effectiveProfile} onRate={rateReview} onReviewReinforcement={reviewReinforcement} />}
          {tab === 'notebook' && <LearningNotebook courseId={course.id} profile={effectiveProfile} onSave={saveNotebook} />}
          {tab === 'exam' && <ExamMode
            courseId={course.id}
            profile={effectiveProfile}
            fallbackConcepts={course.tags.map((label) => ({
              skillId: label.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              label,
            }))}
            onComplete={onCompleteExam}
          />}
          {tab === 'path' && <TechnologyPath currentCourseId={course.id} />}
        </main>
      </section>
    </div>
  );
};
