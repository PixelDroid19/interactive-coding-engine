// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No network in tests')));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('una reflexión larga sin evaluar no acredita explicar ni modificar código', async () => {
  const { getCurriculumSkillIndex, recordPostSolveEvidence } = await import('./curriculumEvidence');
  const target = Object.values(getCurriculumSkillIndex())[0];
  const profile = await recordPostSolveEvidence(target.itemId, 'x'.repeat(120), 'x'.repeat(120));
  expect(profile.evidence).toEqual([]);
  expect(profile.skills).toEqual({});
});

it('guardar un examen escrito conserva las respuestas sin crear evidencias ni repasos aprobados', async () => {
  const { saveExamEvaluation } = await import('./curriculumEvidence');
  const { buildExamQuestions, evaluateExamAnswers } = await import('./exam');
  const { createEmptyLearningProfile } = await import('./mastery');
  const questions = buildExamQuestions(createEmptyLearningProfile(), 'course-fundamentos', ['variables']);
  const result = evaluateExamAnswers(questions, { recognize: 'No sé', explain: 'x'.repeat(600), modify: 'prueba entrada cambia '.repeat(12), debug: 'hipótesis prueba error '.repeat(12) });
  const profile = await saveExamEvaluation('course-fundamentos', questions, result);
  expect(profile.evidence).toEqual([]);
  expect(profile.skills).toEqual({});
  expect(profile.reviews).toEqual([]);
  expect(profile.exams[0]).toMatchObject({ classification: 'ungraded', scores: {}, responses: [expect.objectContaining({ answer: 'No sé' }), expect.anything(), expect.anything(), expect.anything()] });
});

it('una entrevista larga no prueba transferencia y conserva lo escrito', async () => {
  const { saveLeaderInterview } = await import('./curriculumEvidence');
  const answers = ['a'.repeat(100), 'b'.repeat(100), 'c'.repeat(100)];
  const profile = await saveLeaderInterview('course-fundamentos', 'variables', answers);
  expect(profile.evidence).toEqual([]);
  expect(profile.skills).toEqual({});
  expect(profile.exams[0]).toMatchObject({ kind: 'interview', classification: 'ungraded', responses: answers.map(answer => expect.objectContaining({ answer })) });
});

it('terminar lecturas o clases y migrar progreso no inventa evaluaciones', async () => {
  const { curriculumEvidence, getCurriculumSkillIndex } = await import('./curriculumEvidence');
  const targets = Object.values(getCurriculumSkillIndex());
  for (const source of ['reading', 'lesson']) {
    const target = targets.find(entry => entry.source === source)!;
    expect((await curriculumEvidence.record(target.itemId)).evidence).toEqual([]);
  }
  const profile = await curriculumEvidence.migrate({ completedItemIds: targets.slice(0, 10).map(entry => entry.itemId), completedChallenges: [targets.find(entry => entry.source === 'challenge')!.itemId], passedSoloProjects: [], savedLearnerBranches: {}, recentActivity: [] });
  expect(profile.skills).toEqual({});
  expect(profile.evidence).toEqual([]);
});

it('valorar un repaso reprograma la tarjeta sin calificar la respuesta', async () => {
  const { rateCurriculumReview } = await import('./curriculumEvidence');
  const { LocalLearningRepository } = await import('./localLearningRepository');
  const repository = new LocalLearningRepository();
  await repository.update(profile => ({ ...profile, reviews: [{ id: 'review-1', courseId: 'course-fundamentos', itemId: 'fundamentos-01', skillId: 'variables', prompt: 'Explica', intervalIndex: 0, dueAt: 0, lastReviewedAt: 0, repetitions: 0 }] }));
  const profile = await rateCurriculumReview('review-1', 'easy');
  expect(profile.reviews[0].repetitions).toBe(1);
  expect(profile.reviews[0].dueAt).toBeGreaterThan(Date.now());
  expect(profile.skills).toEqual({});
  expect(profile.evidence).toEqual([]);
});

it('completar sin comprobaciones no da dominio y cada intento evaluado conserva su resultado real', async () => {
  const { curriculumEvidence, getCurriculumSkillIndex } = await import('./curriculumEvidence');
  const target = Object.values(getCurriculumSkillIndex()).find(entry => entry.source === 'debugging')!;
  expect((await curriculumEvidence.record(target.itemId)).evidence).toEqual([]);
  expect((await curriculumEvidence.recordAttempt(target.itemId, { score: 100 })).evidence).toEqual([]);
  await curriculumEvidence.recordAttempt(target.itemId, { diagnostics: { tests: [{ passed: false }] } });
  await curriculumEvidence.recordAttempt(target.itemId, { diagnostics: { tests: [{ passed: true }] } });
  const latest = await curriculumEvidence.recordAttempt(target.itemId, { diagnostics: { tests: [{ passed: false }] } });
  const evidence = latest.evidence.filter(entry => entry.skillId === target.skillIds[0]);
  expect(evidence.map(entry => entry.result)).toEqual(['failure', 'success', 'failure']);
  expect(new Set(evidence.map(entry => entry.id)).size).toBe(3);
});
