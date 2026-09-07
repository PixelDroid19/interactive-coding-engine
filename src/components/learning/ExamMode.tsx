import React, { useMemo, useRef, useState } from 'react';
import { buildExamQuestions, evaluateExamAnswers, type ExamConceptCandidate, type ExamEvaluation, type ExamQuestion } from '../../learning/exam';
import type { LearningProfile } from '../../learning/types';
import { UiButton } from '../ui/UiButton';

interface ExamModeProps {
  courseId: string;
  profile: LearningProfile;
  fallbackConcepts?: ExamConceptCandidate[];
  onComplete: (questions: ExamQuestion[], result: ExamEvaluation) => Promise<void>;
}

export const ExamMode: React.FC<ExamModeProps> = ({ courseId, profile, fallbackConcepts, onComplete }) => {
  const questions = useMemo(
    () => buildExamQuestions(profile, courseId, fallbackConcepts),
    [courseId, fallbackConcepts, profile],
  );
  const [answers, setAnswers] = useState<Partial<Record<ExamQuestion['capability'], string>>>({});
  const [result, setResult] = useState<ExamEvaluation | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const working = useRef(false);

  const finish = async () => {
    if (working.current) return;
    working.current = true;
    setSaving(true);
    setError('');
    const evaluation = evaluateExamAnswers(questions, answers);
    try {
      await onComplete(questions, evaluation);
      setResult(evaluation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos guardar la reflexión. Tus respuestas siguen aquí.');
    } finally { working.current = false; setSaving(false); }
  };

  if (result) {
    return <section className="exam-result"><h3>Reflexión guardada, sin calificar</h3><p>Lo que escribiste sirve para conversar y revisar dudas; no demuestra por sí solo dominio del concepto.</p><ul>{result.feedback.map((feedback) => <li key={feedback}>{feedback}</li>)}</ul><UiButton variant="secondary" onClick={() => setResult(null)}>Revisar mis respuestas</UiButton></section>;
  }

  return (
    <section className="exam-mode">
      <div className="learning-notebook__intro"><h3>Revisa cómo lo explicarías</h3><p>Una frase basta. Puedes dejar una pregunta pendiente o escribir «No sé». Esta reflexión no tiene nota automática.</p></div>
      {questions.map((question, index) => (
        <label key={question.id}><span>{index + 1}</span>{question.prompt}<small>{question.guidance}</small><textarea rows={3} maxLength={2000} disabled={saving} value={answers[question.capability] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.capability]: event.target.value }))} /></label>
      ))}
      {error && <p role="alert">{error}</p>}
      <UiButton variant="primary" onClick={() => void finish()} disabled={saving || !Object.values(answers).some(answer => answer?.trim())}>{saving ? 'Guardando…' : 'Guardar reflexión'}</UiButton>
    </section>
  );
};
