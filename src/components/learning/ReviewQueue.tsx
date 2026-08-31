import React, { useMemo, useState } from 'react';
import type { LearningProfile, ReviewRating } from '../../learning/types';
import { UiButton } from '../ui/UiButton';
import { UiSurface } from '../ui/UiSurface';

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
  const [ratingError, setRatingError] = useState('');
  const [reviewingReinforcementId, setReviewingReinforcementId] = useState<string | null>(null);
  const [reinforcementError, setReinforcementError] = useState('');
  const active = due[0];
  const reinforcements = profile.tutor.reinforcements
    .filter((entry) => entry.courseId === courseId && !entry.reviewed)
    .sort((left, right) => right.updatedAt - left.updatedAt);
  const hasObservedActivity =
    profile.evidence.some((entry) => entry.courseId === courseId) || profile.notebook.some((entry) => entry.courseId === courseId) || reinforcements.length > 0;

  const rate = async (rating: ReviewRating) => {
    if (!active || saving) return;
    setSaving(true);
    setRatingError('');
    try {
      await onRate(active.id, rating);
      setAnswer('');
      setCompare(false);
    } catch {
      setRatingError('No se pudo registrar tu calificación. Inténtalo otra vez.');
    } finally {
      setSaving(false);
    }
  };

  const reviewReinforcement = async (reinforcementId: string) => {
    if (reviewingReinforcementId) return;
    setReviewingReinforcementId(reinforcementId);
    setReinforcementError('');
    try {
      await onReviewReinforcement(reinforcementId);
    } catch {
      setReinforcementError('No se pudo marcar este refuerzo como repasado. Inténtalo otra vez.');
    } finally {
      setReviewingReinforcementId(null);
    }
  };

  const introduction = (
    <header className="review-intro">
      <span>REPASO PROGRAMADO</span>
      <h3>Practica recordar, no volver a leer</h3>
      <p>La plataforma programa estas preguntas a partir de lo que ya trabajaste. Responde sin abrir la lección; después comparas y registras cuánto recordaste.</p>
    </header>
  );

  const reinforcementCards = reinforcements.length > 0 && (
    <section className="tutor-reinforcements" aria-labelledby="tutor-reinforcements-title">
      <div className="learning-section-heading">
        <div>
          <span>FEEDBACK DEL AGENTE</span>
          <h3 id="tutor-reinforcements-title">Conceptos para reforzar</h3>
        </div>
        <strong>{reinforcements.length}</strong>
      </div>
      {reinforcementError && (
        <p className="learning-notebook__error" role="alert">
          {reinforcementError}
        </p>
      )}
      <div className="tutor-reinforcements__grid">
        {reinforcements.map((entry) => (
          <UiSurface as="article" tone="soft" key={entry.id}>
            <div>
              <strong>{entry.skillId.replace(/-/g, ' ')}</strong>
              <span>
                {entry.occurrences} {entry.occurrences === 1 ? 'observación' : 'observaciones'}
              </span>
            </div>
            <p>{entry.note}</p>
            <small>{entry.evidence}</small>
            <UiButton
              variant="quiet"
              disabled={Boolean(reviewingReinforcementId)}
              onClick={() => void reviewReinforcement(entry.id)}
              aria-label={`Marcar ${entry.skillId.replace(/-/g, ' ')} como repasado`}
            >
              {reviewingReinforcementId === entry.id ? 'Marcando…' : 'Ya lo repasé'}
            </UiButton>
          </UiSurface>
        ))}
      </div>
    </section>
  );

  if (!active) {
    return (
      <div className="review-overview">
        {introduction}
        {reinforcementCards}
        <UiSurface className="learning-empty">
          <strong>
            {upcoming
              ? 'Tu repaso programado está al día.'
              : hasObservedActivity
                ? 'Tu actividad todavía no generó un repaso programado.'
                : 'Aún no tienes actividad para repasar.'}
          </strong>
          <p>
            {upcoming
              ? `El próximo llega ${new Date(upcoming.dueAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.`
              : hasObservedActivity
                ? 'Tu siguiente tarjeta aparecerá cuando haya evidencia suficiente para programarla.'
                : 'Completa una lectura, práctica o desafío para que aparezca tu primer repaso.'}
          </p>
        </UiSurface>
      </div>
    );
  }

  return (
    <section className="review-queue">
      {introduction}
      {reinforcementCards}
      <ol className="review-steps" aria-label="Pasos del repaso">
        <li aria-current={!compare ? 'step' : undefined}>1 · Responder</li>
        <li aria-current={compare ? 'step' : undefined}>2 · Comparar</li>
        <li>3 · Registrar recuerdo</li>
      </ol>
      <div className="learning-progress-line">
        <span>{due.length} por recuperar</span>
        <span>{active.skillId.replace(/-/g, ' ')}</span>
      </div>
      <h3>{active.prompt}</h3>
      <label>
        Responde sin abrir la lección
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} placeholder="Explícalo con tus palabras y un ejemplo propio…" />
      </label>
      {!compare ? (
        <UiButton variant="primary" onClick={() => setCompare(true)} disabled={answer.trim().length < 18}>
          Comparar mi respuesta
        </UiButton>
      ) : (
        <div className="review-self-check">
          <strong>Comprueba antes de calificarte</strong>
          <ul>
            <li>¿Dijiste para qué sirve?</li>
            <li>¿Usaste un ejemplo distinto al de la clase?</li>
            <li>¿Explicaste cómo observarías si funciona?</li>
          </ul>
          <div className="review-rating" aria-label="Califica tu recuerdo">
            <UiButton variant="secondary" disabled={saving} onClick={() => void rate('again')}>
              No lo recordé
            </UiButton>
            <UiButton variant="secondary" disabled={saving} onClick={() => void rate('hard')}>
              Con ayuda
            </UiButton>
            <UiButton variant="secondary" disabled={saving} onClick={() => void rate('good')}>
              Lo expliqué
            </UiButton>
            <UiButton variant="primary" disabled={saving} onClick={() => void rate('easy')}>
              Puedo enseñarlo
            </UiButton>
          </div>
          {ratingError && (
            <p className="learning-notebook__error" role="alert">
              {ratingError}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
