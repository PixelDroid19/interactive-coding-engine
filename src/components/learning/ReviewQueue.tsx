import React, { useMemo, useState } from 'react';
import type { LearningProfile, ReviewRating } from '../../learning/types';

interface ReviewQueueProps {
  courseId: string;
  profile: LearningProfile;
  onRate: (reviewId: string, rating: ReviewRating) => Promise<void>;
  onReviewReinforcement: (reinforcementId: string) => Promise<void>;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ courseId, profile, onRate, onReviewReinforcement }) => {
  const due = useMemo(
    () => profile.reviews.filter((review) => review.courseId === courseId && review.dueAt <= Date.now()).sort((a, b) => a.dueAt - b.dueAt),
    [courseId, profile.reviews],
  );
  const upcoming = useMemo(
    () => profile.reviews.filter((review) => review.courseId === courseId && review.dueAt > Date.now()).sort((a, b) => a.dueAt - b.dueAt)[0],
    [courseId, profile.reviews],
  );
  const [answer, setAnswer] = useState('');
  const [compare, setCompare] = useState(false);
  const [saving, setSaving] = useState(false);
  const active = due[0];
  const reinforcements = profile.tutor.reinforcements.filter((entry) => entry.courseId === courseId && !entry.reviewed).sort((left, right) => right.updatedAt - left.updatedAt);

  const reinforcementCards = reinforcements.length > 0 && (
    <section className="tutor-reinforcements" aria-labelledby="tutor-reinforcements-title">
      <div className="learning-section-heading"><div><span>FEEDBACK DEL AGENTE</span><h3 id="tutor-reinforcements-title">Conceptos para reforzar</h3></div><strong>{reinforcements.length}</strong></div>
      <div className="tutor-reinforcements__grid">{reinforcements.map((entry) => (
        <article key={entry.id}>
          <div><strong>{entry.skillId.replace(/-/g, ' ')}</strong><span>{entry.occurrences} {entry.occurrences === 1 ? 'observación' : 'observaciones'}</span></div>
          <p>{entry.note}</p>
          <small>{entry.evidence}</small>
          <button type="button" onClick={() => void onReviewReinforcement(entry.id)} aria-label={`Marcar ${entry.skillId.replace(/-/g, ' ')} como repasado`}>Ya lo repasé</button>
        </article>
      ))}</div>
    </section>
  );

  if (!active) {
    return (
      <div className="review-overview">
        {reinforcementCards}
        <div className="learning-empty">
          <strong>Tu repaso programado está al día.</strong>
          <p>{upcoming ? `El próximo llega ${new Date(upcoming.dueAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.` : 'Completa una lectura o práctica para crear tu primera tarjeta.'}</p>
        </div>
      </div>
    );
  }

  const rate = async (rating: ReviewRating) => {
    setSaving(true);
    await onRate(active.id, rating);
    setAnswer('');
    setCompare(false);
    setSaving(false);
  };

  return (
    <section className="review-queue">
      {reinforcementCards}
      <div className="learning-progress-line"><span>{due.length} por recuperar</span><span>{active.skillId.replace(/-/g, ' ')}</span></div>
      <h3>{active.prompt}</h3>
      <label>
        Responde sin abrir la lección
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} placeholder="Explícalo con tus palabras y un ejemplo propio…" />
      </label>
      {!compare ? (
        <button type="button" className="learning-primary" onClick={() => setCompare(true)} disabled={answer.trim().length < 18}>Comparar mi respuesta</button>
      ) : (
        <div className="review-self-check">
          <strong>Comprueba antes de calificarte</strong>
          <ul>
            <li>¿Dijiste para qué sirve?</li>
            <li>¿Usaste un ejemplo distinto al de la clase?</li>
            <li>¿Explicaste cómo observarías si funciona?</li>
          </ul>
          <div className="review-rating" aria-label="Califica tu recuerdo">
            <button type="button" disabled={saving} onClick={() => void rate('again')}>No lo recordé</button>
            <button type="button" disabled={saving} onClick={() => void rate('hard')}>Con ayuda</button>
            <button type="button" disabled={saving} onClick={() => void rate('good')}>Lo expliqué</button>
            <button type="button" disabled={saving} onClick={() => void rate('easy')}>Puedo enseñarlo</button>
          </div>
        </div>
      )}
    </section>
  );
};
