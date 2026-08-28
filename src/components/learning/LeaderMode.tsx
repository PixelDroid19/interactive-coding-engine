import React, { useMemo, useState } from 'react';
import type { LearningProfile } from '../../learning/types';

interface LeaderModeProps {
  courseId: string;
  profile: LearningProfile;
  onComplete: (skillId: string, answers: string[]) => Promise<void>;
}

export const LeaderMode: React.FC<LeaderModeProps> = ({ courseId, profile, onComplete }) => {
  const skillId = useMemo(() => {
    const skills = [...new Set(profile.evidence.filter((evidence) => evidence.courseId === courseId).map((evidence) => evidence.skillId))];
    return skills.sort((left, right) => (profile.skills[left]?.capabilities.transfer?.score ?? 0) - (profile.skills[right]?.capabilities.transfer?.score ?? 0))[0] ?? 'fundamentos-del-curso';
  }, [courseId, profile]);
  const concept = skillId.replace(/-/g, ' ');
  const prompts = [
    `¿Qué problema resuelve ${concept} y cuándo no lo usarías?`,
    'Si mañana cambia el requisito, ¿qué parte de tu diseño debería cambiar y cuál debería permanecer estable?',
    '¿Qué prueba o evidencia usarías para defender que tu solución funciona?',
  ];
  const [answers, setAnswers] = useState(['', '', '']);
  const [done, setDone] = useState(false);

  if (done) return <div className="learning-empty"><strong>Entrevista registrada.</strong><p>Tu siguiente repaso usará esta evidencia de transferencia.</p></div>;
  return (
    <section className="leader-mode">
      <div className="learning-notebook__intro"><h3>Defiende tus decisiones</h3><p>Responde como si otra persona fuera a mantener tu código. No buscamos una frase perfecta.</p></div>
      {prompts.map((prompt, index) => <label key={prompt}>{prompt}<textarea rows={3} value={answers[index]} onChange={(event) => setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))} /></label>)}
      <button type="button" className="learning-primary" disabled={answers.some((answer) => answer.trim().length < 20)} onClick={async () => { await onComplete(skillId, answers); setDone(true); }}>Registrar entrevista</button>
    </section>
  );
};
