import React, { useState } from 'react';
import { BookOpenText, Brain, ClipboardCheck, LockKeyhole, MessagesSquare, Route, X } from 'lucide-react';
import { useTheme } from '../../themes/ThemeProvider';
import type { Course } from '../../types/curriculum';
import type { ExamEvaluation, ExamQuestion } from '../../learning/exam';
import type { LearningProfile, NotebookEntry, ReviewRating } from '../../learning/types';
import { ReviewQueue } from './ReviewQueue';
import { LearningNotebook } from './LearningNotebook';
import { ExamMode } from './ExamMode';
import { TechnologyPath } from './TechnologyPath';

type LearningTab = 'review' | 'notebook' | 'exam' | 'leader' | 'path';

interface LearningCenterProps {
  course: Course;
  profile: LearningProfile;
  onClose: () => void;
  onRateReview: (reviewId: string, rating: ReviewRating) => Promise<void>;
  onSaveNotebook: (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => Promise<void>;
  onCompleteExam: (questions: ExamQuestion[], result: ExamEvaluation) => Promise<void>;
  onReviewReinforcement: (reinforcementId: string) => Promise<void>;
}

const TABS: Array<{ id: LearningTab; label: string; icon: React.ReactNode; disabled?: boolean; note?: string }> = [
  { id: 'review', label: 'Repaso', icon: <Brain size={16} /> },
  { id: 'notebook', label: 'Cuaderno', icon: <BookOpenText size={16} /> },
  { id: 'exam', label: 'Examen', icon: <ClipboardCheck size={16} /> },
  { id: 'leader', label: 'Líder', icon: <MessagesSquare size={16} />, disabled: true, note: 'Requiere revisión externa' },
  { id: 'path', label: 'Ruta', icon: <Route size={16} /> },
];

export const LearningCenter: React.FC<LearningCenterProps> = ({ course, profile, onClose, onRateReview, onSaveNotebook, onCompleteExam, onReviewReinforcement }) => {
  const [tab, setTab] = useState<LearningTab>('review');
  const { themeId } = useTheme();
  const isCyber = themeId === 'cyber';
  const dueCount = profile.reviews.filter((entry) => entry.courseId === course.id && entry.dueAt <= Date.now()).length;
  const reinforcementCount = profile.tutor.reinforcements.filter((entry) => entry.courseId === course.id && !entry.reviewed).length;
  const noteCount = profile.notebook.filter((entry) => entry.courseId === course.id).length;
  return (
    <div className="learning-center-backdrop" onClick={onClose}>
      <section
        className="learning-center"
        role="dialog"
        aria-modal="true"
        aria-label="Centro de aprendizaje"
        onClick={(event) => event.stopPropagation()}
        data-augmented-ui={isCyber ? "learning-center-modal tl-clip tr-clip br-clip bl-clip border inlay" : undefined}
      >
        <header><div><span>TU PROGRESO</span><h2>Centro de aprendizaje</h2><p>Repasa, explica y organiza lo que estás aprendiendo en {course.title}.</p></div><button type="button" onClick={onClose} aria-label="Cerrar centro de aprendizaje"><X size={19} /></button></header>
        <div className="learning-center__summary" aria-label="Resumen de aprendizaje">
          <span><strong>{dueCount}</strong> {dueCount === 1 ? 'repaso pendiente' : 'repasos pendientes'}</span>
          <span><strong>{reinforcementCount}</strong> por reforzar</span>
          <span><strong>{noteCount}</strong> {noteCount === 1 ? 'nota propia' : 'notas propias'}</span>
        </div>
        <nav aria-label="Herramientas de aprendizaje">{TABS.map((candidate) => <button key={candidate.id} type="button" className={tab === candidate.id ? 'is-active' : ''} disabled={candidate.disabled} aria-label={candidate.disabled ? `${candidate.label} · ${candidate.note}` : candidate.label} title={candidate.note} onClick={() => setTab(candidate.id)}>{candidate.disabled ? <LockKeyhole size={15} /> : candidate.icon}<span>{candidate.label}{candidate.note && <small>Próximamente</small>}</span></button>)}</nav>
        <main>
          {tab === 'review' && <ReviewQueue courseId={course.id} profile={profile} onRate={onRateReview} onReviewReinforcement={onReviewReinforcement} />}
          {tab === 'notebook' && <LearningNotebook courseId={course.id} profile={profile} onSave={onSaveNotebook} />}
          {tab === 'exam' && <ExamMode courseId={course.id} profile={profile} onComplete={onCompleteExam} />}
          {tab === 'path' && <TechnologyPath currentCourseId={course.id} />}
        </main>
      </section>
    </div>
  );
};
