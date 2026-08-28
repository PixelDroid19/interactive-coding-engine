import type { ReviewCard, ReviewRating } from './types';

const DAY_MS = 86_400_000;
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

export function scheduleReview(card: ReviewCard, rating: ReviewRating, now = Date.now()): ReviewCard {
  const current = Math.max(0, Math.min(REVIEW_INTERVAL_DAYS.length - 1, card.intervalIndex));
  const nextIndex = rating === 'again'
    ? 0
    : rating === 'hard'
      ? Math.max(0, current - 1)
      : rating === 'easy'
        ? Math.min(REVIEW_INTERVAL_DAYS.length - 1, current + 2)
        : Math.min(REVIEW_INTERVAL_DAYS.length - 1, current + 1);
  return {
    ...card,
    intervalIndex: nextIndex,
    dueAt: now + REVIEW_INTERVAL_DAYS[nextIndex] * DAY_MS,
    lastReviewedAt: now,
    repetitions: rating === 'again' ? 0 : card.repetitions + 1,
  };
}
