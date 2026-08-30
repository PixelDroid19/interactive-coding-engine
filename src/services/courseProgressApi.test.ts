import { describe, expect, it } from 'vitest';
import type { UserProgressRecord } from '../types/curriculum';
import { mergeRemoteProgress } from './courseProgressApi';

describe('mergeRemoteProgress', () => {
  it('restaura completados del backend y conserva operaciones locales todavía no sincronizadas', () => {
    const local: UserProgressRecord = {
      completedItemIds: ['javascript-01-local'],
      completedChallenges: [],
      passedSoloProjects: [],
      savedLearnerBranches: {},
      recentActivity: [],
    };

    const merged = mergeRemoteProgress(local, [
      {
        courseSlug: 'javascript', itemKey: 'javascript-01', status: 'completed', playbackMs: 2500,
        score: 90, version: 2, updatedAt: '2026-08-29T00:00:00.000Z',
      },
      {
        courseSlug: 'javascript', itemKey: 'javascript-02', status: 'in_progress', playbackMs: 500,
        score: null, version: 1, updatedAt: '2026-08-29T00:01:00.000Z',
      },
    ]);

    expect(merged.completedItemIds).toEqual(['javascript-01-local', 'javascript-01']);
  });
});
