import React, { useMemo, useState } from 'react';
import { buildExamQuestions, evaluateExamAnswers, type ExamEvaluation, type ExamQuestion } from '../../learning/exam';
import type { LearningProfile } from '../../learning/types';

interface ExamModeProps {
  courseId: string;
  profile: LearningProfile;
  onComplete: (questions: ExamQuestion[], result: ExamEvaluation) => Promise<void>;
}

export const ExamMode: React.FC<ExamModeProps> = ({ courseId, profile, onComplete }) => {
  const questions = useMemo(() => buildExamQuestions(profile, courseId), [courseId, profile]);
  const [answers, setAnswers] = useState<Partial<Record<ExamQuestion['capability'], string>>>({});
  const [result, setResult] = useState<ExamEvaluation | null>(null);

  const finish = async () => {
    const evaluation = evaluateExamAnswers(questions, answers);
    setResult(evaluation);
    await onComplete(questions, evaluation);
  };

  if (result) {
    const label = result.classification === 'green' ? 'Verde · dominio consistente' : result.classification === 'yellow' ? 'Amarillo · falta consolidar' : 'Rojo · conviene recuperar la base';
    return <section className={`exam-result is-${result.classification}`}><span>Resultado</span><h3>{label}</h3>{result.feedback.length ? <ul>{result.feedback.map((feedback) => <li key={feedback}>{feedback}</li>)}</ul> : <p>Puedes explicar, modificar y depurar el concepto sin depender del ejemplo original.</p>}<button type="button" onClick={() => { setAnswers({}); setResult(null); }}>Intentar otra vez</button></section>;
  }

  return (
    <section className="exam-mode">
      <div className="learning-notebook__intro"><h3>Examen mixto</h3><p>No mide memoria de sintaxis: mide si reconoces, explicas, modificas y depuras.</p></div>
      {questions.map((question, index) => (
        <label key={question.id}><span>{index + 1} · {question.capability}</span>{question.prompt}<small>{question.guidance}</small><textarea rows={3} value={answers[question.capability] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.capability]: event.target.value }))} /></label>
      ))}
      <button type="button" className="learning-primary" onClick={() => void finish()} disabled={questions.some((question) => (answers[question.capability]?.trim().length ?? 0) < 8)}>Evaluar respuestas</button>
    </section>
  );
};
