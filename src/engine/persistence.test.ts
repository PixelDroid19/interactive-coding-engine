import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { ScrimLessonData, WorkspaceSnapshot } from '../types/scrim';
import { saveLearnerBranch, loadLearnerBranch, loadLastBranchForLesson, clearBranch, clearBranchesForLesson, saveLearnerBranchDebounced, flushBranchSave, markChallengeCompleted, markChallengeSkipped, markChallengeSolutionViewed, getChallengeState, clearChallengeState, getChallengeStates, saveAppNavigationState, loadAppNavigationState, loadDebuggingDraft, saveDebuggingDraft, loadCustomScrims, saveCustomScrim } from './persistence';
import { createInitialState } from './playerMachine';
import { cloneWorkspace } from './eventLog';

function makeWs(content = 'let x=1'): WorkspaceSnapshot {
  return {
    files: {
      'app.js': { name: 'app.js', path: 'app.js', content, language: 'javascript' },
    },
    activeFilePath: 'app.js',
  };
}

describe('persistence branches', () => {
  beforeEach(() => {
    // Mock localStorage for node env
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
    } as any;
    (globalThis as any).localStorage.clear();
    vi.useFakeTimers();
  });

  it('primera edición se persiste determinísticamente', () => {
    const branch = {
      id: 'branch-fundamentos-01-1',
      lessonId: 'fundamentos-01',
      baseTime: 1000,
      baseSequence: 0,
      workspace: makeWs('let nombre="Ana"'),
      isForked: true,
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    saveLearnerBranch(branch);
    const loaded = loadLearnerBranch(branch.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.workspace.files['app.js'].content).toBe('let nombre="Ana"');
    expect(loaded?.baseTime).toBe(1000);
  });

  it('conserva el audio binario de una clase personalizada después de recargar', async () => {
    vi.useRealTimers();
    const lesson: ScrimLessonData = {
      id: 'scrim-custom-with-audio',
      title: 'Clase grabada',
      description: 'Prueba de persistencia',
      templateId: 'vanilla-js',
      durationMs: 1200,
      initialWorkspace: makeWs(),
      events: [],
      snapshots: [],
      challenges: [],
      audioTrack: {
        audioBlob: new Blob(['voz persistida'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
        durationMs: 1200,
      },
      createdAt: 1,
      updatedAt: 1,
    };

    await saveCustomScrim(lesson);
    const restored = (await loadCustomScrims())[lesson.id];

    expect(restored.audioTrack?.audioBlob).toBeInstanceOf(Blob);
    expect(await restored.audioTrack?.audioBlob?.text()).toBe('voz persistida');
    expect(restored.audioTrack?.audioBlob?.type).toBe('audio/webm');
  });

  it('identifica una grabación antigua cuyo audio JSON ya no se puede reproducir', async () => {
    localStorage.setItem('aula_custom_scrims_v1', JSON.stringify({
      'scrim-custom-legacy': {
        id: 'scrim-custom-legacy',
        title: 'Clase antigua',
        description: '',
        templateId: 'vanilla-js',
        durationMs: 1000,
        initialWorkspace: makeWs(),
        events: [],
        snapshots: [],
        challenges: [],
        audioTrack: { audioBlob: {}, mimeType: 'audio/webm', durationMs: 1000 },
        createdAt: 1,
        updatedAt: 1,
      },
    }));

    const restored = (await loadCustomScrims())['scrim-custom-legacy'];

    expect(restored.audioTrack?.audioBlob).toBeUndefined();
    expect(restored.audioTrack?.audioError).toContain('no se puede recuperar');
  });

  it('mantiene disponibles las demás clases cuando falta un audio de IndexedDB', async () => {
    vi.useRealTimers();
    const baseLesson = {
      description: '',
      templateId: 'vanilla-js',
      durationMs: 1000,
      initialWorkspace: makeWs(),
      events: [],
      snapshots: [],
      challenges: [],
      createdAt: 1,
      updatedAt: 1,
    };
    localStorage.setItem('aula_custom_scrims_v1', JSON.stringify({
      'scrim-custom-missing-audio': {
        ...baseLesson,
        id: 'scrim-custom-missing-audio',
        title: 'Audio perdido',
        audioTrack: { audioStorageKey: 'blob-inexistente', mimeType: 'audio/webm', durationMs: 1000 },
      },
      'scrim-custom-without-audio': {
        ...baseLesson,
        id: 'scrim-custom-without-audio',
        title: 'Clase sin micrófono',
      },
    }));

    const restored = await loadCustomScrims();

    expect(restored['scrim-custom-without-audio'].title).toBe('Clase sin micrófono');
    expect(restored['scrim-custom-missing-audio'].audioTrack?.audioError).toContain('no se encontró');
  });

  it('no muta objetos de estado: save clona', () => {
    const ws = makeWs('let a=1');
    const branch = {
      id: 'b1',
      lessonId: 'fundamentos-01',
      baseTime: 0,
      baseSequence: 0,
      workspace: ws,
      isForked: true,
      lastSavedAt: Date.now(),
      executionCount: 0,
    };
    saveLearnerBranch(branch);
    // mutate original
    ws.files['app.js'].content = 'mutated';
    branch.workspace.files['app.js'].content = 'mutated2';
    const loaded = loadLearnerBranch('b1');
    expect(loaded?.workspace.files['app.js'].content).toBe('let a=1');
  });

  it('cada guardado contiene workspace, baseTime, fecha y executionCount coherentes', () => {
    const branch = {
      id: 'b2',
      lessonId: 'fundamentos-01',
      baseTime: 12345,
      baseSequence: 0,
      workspace: makeWs('let x=2'),
      isForked: true,
      lastSavedAt: 0,
      executionCount: 3,
    };
    saveLearnerBranch(branch);
    const loaded = loadLearnerBranch('b2')!;
    expect(loaded.baseTime).toBe(12345);
    expect(loaded.executionCount).toBe(3);
    expect(loaded.lastSavedAt).toBeGreaterThan(0);
    expect(loaded.workspace).toBeDefined();
  });

  it('recupera última rama de la lección', () => {
    const w1 = makeWs('v1');
    const w2 = makeWs('v2');
    saveLearnerBranch({ id: 'b-old', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: w1, isForked: true, lastSavedAt: Date.now() - 10000, executionCount: 0 });
    // need to ensure lastSavedAt difference: save overwrites with Date.now(), so we need to control via direct storage
    const now = Date.now();
    const raw = localStorage.getItem('aula_learner_branches_v1');
    const parsed = raw ? JSON.parse(raw) : {};
    parsed['b-old'].lastSavedAt = now - 10000;
    parsed['b-new'] = { id: 'b-new', lessonId: 'fundamentos-01', baseTime: 5000, baseSequence: 0, workspace: w2, isForked: true, lastSavedAt: now, executionCount: 1 };
    localStorage.setItem('aula_learner_branches_v1', JSON.stringify(parsed));
    const last = loadLastBranchForLesson('fundamentos-01');
    expect(last?.id).toBe('b-new');
    expect(last?.workspace.files['app.js'].content).toBe('v2');
  });

  it('ignora rama corrupta sin romper', () => {
    localStorage.setItem('aula_learner_branches_v1', 'not-json');
    const last = loadLastBranchForLesson('fundamentos-01');
    expect(last).toBeNull();
    // also load by id should not throw
    const byId = loadLearnerBranch('any');
    expect(byId).toBeNull();
  });

  it('varias ediciones persisten correctamente', () => {
    const ws1 = makeWs('v1');
    const branch1 = { id: 'b1', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws1, isForked: true, lastSavedAt: Date.now(), executionCount: 0 };
    saveLearnerBranch(branch1);
    const ws2 = makeWs('v2');
    const branch2 = { id: 'b1', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws2, isForked: true, lastSavedAt: Date.now(), executionCount: 1 };
    saveLearnerBranch(branch2);
    const loaded = loadLearnerBranch('b1')!;
    expect(loaded.workspace.files['app.js'].content).toBe('v2');
    expect(loaded.executionCount).toBe(1);
  });

  it('recarga y recuperación de rama', () => {
    const ws = makeWs('persisted content');
    const branch = { id: 'branch-fundamentos-01-999', lessonId: 'fundamentos-01', baseTime: 2000, baseSequence: 0, workspace: ws, isForked: true, lastSavedAt: Date.now(), executionCount: 2 };
    saveLearnerBranch(branch);
    // Simulate reload: clear in-memory but localStorage keeps
    const recovered = loadLastBranchForLesson('fundamentos-01');
    expect(recovered?.workspace.files['app.js'].content).toBe('persisted content');
    expect(recovered?.executionCount).toBe(2);
  });

  it('clearBranch elimina correctamente', () => {
    const ws = makeWs('x');
    saveLearnerBranch({ id: 'to-clear', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws, isForked: true, lastSavedAt: Date.now(), executionCount: 0 });
    expect(loadLearnerBranch('to-clear')).not.toBeNull();
    clearBranch('to-clear');
    expect(loadLearnerBranch('to-clear')).toBeNull();
  });

  it('distingue completed, skipped y solutionViewed', () => {
    markChallengeCompleted('reto-1');
    expect(getChallengeState('reto-1')?.status).toBe('completed');
    // skipped no sobrescribe completed
    markChallengeSkipped('reto-1');
    expect(getChallengeState('reto-1')?.status).toBe('completed');
    clearChallengeState('reto-1');
    markChallengeSkipped('reto-2');
    expect(getChallengeState('reto-2')?.status).toBe('skipped');
    markChallengeSolutionViewed('reto-3');
    expect(getChallengeState('reto-3')?.status).toBe('solutionViewed');
  });

  it('ver solución no marca como aprobado', () => {
    markChallengeSolutionViewed('reto-x');
    const state = getChallengeState('reto-x');
    expect(state?.status).toBe('solutionViewed');
    // completedChallenges no debe contener reto-x
    const all = getChallengeStates();
    expect(all['reto-x'].status).not.toBe('completed');
  });

  it('saltar por ahora no muestra solución', () => {
    markChallengeSkipped('reto-skip');
    expect(getChallengeState('reto-skip')?.status).toBe('skipped');
    expect(getChallengeState('reto-skip')?.status).not.toBe('solutionViewed');
  });

  it('conservar código al consultar resolución no muta rama', () => {
    const ws = makeWs('let nombre="Ana"');
    const branch = { id: 'b-keep', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws, isForked: true, lastSavedAt: Date.now(), executionCount: 0 };
    saveLearnerBranch(branch);
    markChallengeSolutionViewed('reto-keep');
    const loaded = loadLearnerBranch('b-keep');
    expect(loaded?.workspace.files['app.js'].content).toBe('let nombre="Ana"');
    expect(getChallengeState('reto-keep')?.status).toBe('solutionViewed');
  });

  it('navegación con rama sin guardar no la descarta silenciosamente', () => {
    const ws = makeWs('código con cambios');
    saveLearnerBranch({ id: 'b-nav', lessonId: 'fundamentos-01', baseTime: 1000, baseSequence: 0, workspace: ws, isForked: true, lastSavedAt: Date.now(), executionCount: 1 });
    // Simula navegación a siguiente elemento (no debe borrar rama automáticamente)
    const before = loadLastBranchForLesson('fundamentos-01');
    expect(before?.workspace.files['app.js'].content).toBe('código con cambios');
    // No llamamos a clearBranchesForLesson, la rama debe seguir
    const after = loadLastBranchForLesson('fundamentos-01');
    expect(after?.id).toBe('b-nav');
  });

  it('ausencia de autoplay al regresar se garantiza por awaitingStart', () => {
    const s = createInitialState('fundamentos-01');
    expect(s.awaitingStart).toBe(true);
    expect(s.status).toBe('awaitingStart');
  });

  it('flushBranchSave guarda el pendiente en vez de descartar', () => {
    const ws1 = makeWs('v1');
    saveLearnerBranch({ id: 'b-flush', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws1, isForked: true, lastSavedAt: Date.now(), executionCount: 0 });
    const ws2 = makeWs('v2');
    const pending = { id: 'b-flush', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws2, isForked: true, lastSavedAt: Date.now(), executionCount: 1 };
    saveLearnerBranchDebounced(pending, 10000);
    expect(loadLearnerBranch('b-flush')?.workspace.files['app.js'].content).toBe('v1');
    flushBranchSave('fundamentos-01');
    expect(loadLearnerBranch('b-flush')?.workspace.files['app.js'].content).toBe('v2');
  });

  it('Volver y descartar y Descarta y buscar borran de localStorage', () => {
    const ws = makeWs('para borrar');
    saveLearnerBranch({ id: 'b-del', lessonId: 'fundamentos-01', baseTime: 0, baseSequence: 0, workspace: ws, isForked: true, lastSavedAt: Date.now(), executionCount: 0 });
    expect(loadLastBranchForLesson('fundamentos-01')).not.toBeNull();
    clearBranchesForLesson('fundamentos-01');
    expect(loadLastBranchForLesson('fundamentos-01')).toBeNull();
  });

  it('persiste la ruta actual para restaurar la lección después de recargar', () => {
    const route = {
      view: 'scrim' as const,
      courseId: 'course-fundamentos',
      moduleId: 'mod-estructuras',
      itemId: 'fundamentos-07',
      timestampMs: 18400,
    };

    saveAppNavigationState(route);

    expect(loadAppNavigationState()).toEqual(route);
  });

  it('descarta una ruta persistida incompleta o corrupta', () => {
    localStorage.setItem('aula_app_navigation_v1', JSON.stringify({ view: 'scrim', itemId: 42 }));
    expect(loadAppNavigationState()).toBeNull();

    localStorage.setItem('aula_app_navigation_v1', 'no-json');
    expect(loadAppNavigationState()).toBeNull();
  });

  it('recupera el guardado de un ejercicio después de encontrar almacenamiento corrupto', () => {
    localStorage.setItem('aula_debugging_drafts_v1', 'no-json');
    const draft = { workspace: makeWs('const respuesta = 42'), revealedHints: 2 };

    saveDebuggingDraft('fundamentos-07-debug', draft);

    expect(loadDebuggingDraft('fundamentos-07-debug')).toEqual(draft);
  });
});
