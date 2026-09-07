// @vitest-environment happy-dom
import { beforeEach, expect, it, vi, afterEach } from 'vitest';
import { createGuidedDraft } from './guidedPractice';
import { guidedStorageKey, loadGuidedDraft, saveGuidedDraft } from './guidedPracticeStorage';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
it('retoma el código y las pistas en la cuenta y curso correctos', () => {
  const key = guidedStorageKey('user:a', 'fundamentos');
  const draft = { ...createGuidedDraft('bucles'), stage: 'modify' as const, code: 'mi intento', hintCount: 1, usedHelp: true };
  expect(saveGuidedDraft(key, draft)).toBe(true);
  expect(loadGuidedDraft(key).draft).toMatchObject({ code: 'mi intento', topicId: 'bucles', hintCount: 1 });
  expect(loadGuidedDraft(guidedStorageKey('user:b', 'fundamentos')).draft.code).not.toBe('mi intento');
  expect(loadGuidedDraft(guidedStorageKey('user:a', 'javascript')).draft.code).not.toBe('mi intento');
});
it('no reutiliza un aprobado guardado como si hubiera ejecutado las pruebas', () => {
  const draft = { ...createGuidedDraft(), stage: 'explain' as const, checks: [{ input: 'x', actual: '1', expected: '1', passed: true }] };
  localStorage.setItem('draft', JSON.stringify(draft));
  const restored = loadGuidedDraft('draft');
  expect(restored.draft.stage).toBe('modify');
  expect(restored.draft.checks).toBeNull();
});
it('conserva un guardado corrupto y avisa en vez de sobrescribirlo', () => {
  localStorage.setItem('draft', '{broken');
  expect(loadGuidedDraft('draft')).toMatchObject({ writable: false, notice: expect.stringMatching(/recuperar/i) });
  expect(saveGuidedDraft('draft', createGuidedDraft())).toBe(false);
  expect(localStorage.getItem('draft')).toBe('{broken');
});
it('rechaza estructuras que harían fallar la interfaz', () => {
  localStorage.setItem('draft', JSON.stringify({ ...createGuidedDraft(), history: [null] }));
  expect(loadGuidedDraft('draft').writable).toBe(false);
});
it('un almacenamiento bloqueado no impide practicar en la sesión', () => {
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota'); });
  expect(saveGuidedDraft('draft', createGuidedDraft())).toBe(false);
});
