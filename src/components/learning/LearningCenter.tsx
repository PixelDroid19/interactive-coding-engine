import React, { useState } from 'react';
import { BookOpenText, Brain, ClipboardCheck, MessagesSquare, Route, X } from 'lucide-react';
import type { Course } from '../../types/curriculum';
import type { ExamEvaluation, ExamQuestion } from '../../learning/exam';
import type { LearningProfile, NotebookEntry, ReviewRating } from '../../learning/types';
import { ReviewQueue } from './ReviewQueue';
import { LearningNotebook } from './LearningNotebook';
import { ExamMode } from './ExamMode';
import { LeaderMode } from './LeaderMode';
import { TechnologyPath } from './TechnologyPath';

type LearningTab = 'review' | 'notebook' | 'exam' | 'leader' | 'path';

interface LearningCenterProps {
  course: Course;
  profile: LearningProfile;
  onClose: () => void;
  onRateReview: (reviewId: string, rating: ReviewRating) => Promise<void>;
  onSaveNotebook: (entry: Omit<NotebookEntry, 'id' | 'updatedAt'>) => Promise<void>;
  onCompleteExam: (questions: ExamQuestion[], result: ExamEvaluation) => Promise<void>;
  onCompleteLeader: (skillId: string, answers: string[]) => Promise<void>;
}

const TABS: Array<{ id: LearningTab; label: string; icon: React.ReactNode }> = [
  { id: 'review', label: 'Repaso', icon: <Brain size={16} /> },
  { id: 'notebook', label: 'Cuaderno', icon: <BookOpenText size={16} /> },
  { id: 'exam', label: 'Examen', icon: <ClipboardCheck size={16} /> },
  { id: 'leader', label: 'Líder', icon: <MessagesSquare size={16} /> },
  { id: 'path', label: 'Ruta', icon: <Route size={16} /> },
];

export const LearningCenter: React.FC<LearningCenterProps> = ({ course, profile, onClose, onRateReview, onSaveNotebook, onCompleteExam, onCompleteLeader }) => {
  const [tab, setTab] = useState<LearningTab>('review');
  return (
    <div className="learning-center-backdrop" onClick={onClose}>
      <section className="learning-center" role="dialog" aria-modal="true" aria-label="Centro de aprendizaje" onClick={(event) => event.stopPropagation()}>
        <header><div><span>DOMINIO PERSONAL</span><h2>Centro de aprendizaje</h2><p>{course.title}</p></div><button type="button" onClick={onClose} aria-label="Cerrar centro de aprendizaje"><X size={19} /></button></header>
        <nav aria-label="Herramientas de aprendizaje">{TABS.map((candidate) => <button key={candidate.id} type="button" className={tab === candidate.id ? 'is-active' : ''} onClick={() => setTab(candidate.id)}>{candidate.icon}{candidate.label}</button>)}</nav>
        <main>
          {tab === 'review' && <ReviewQueue courseId={course.id} profile={profile} onRate={onRateReview} />}
          {tab === 'notebook' && <LearningNotebook courseId={course.id} profile={profile} onSave={onSaveNotebook} />}
          {tab === 'exam' && <ExamMode courseId={course.id} profile={profile} onComplete={onCompleteExam} />}
          {tab === 'leader' && <LeaderMode courseId={course.id} profile={profile} onComplete={onCompleteLeader} />}
          {tab === 'path' && <TechnologyPath currentCourseId={course.id} />}
        </main>
      </section>
    </div>
  );
};
