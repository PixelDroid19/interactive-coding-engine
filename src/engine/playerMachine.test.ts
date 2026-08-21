import { describe, it, expect } from 'vitest';
import { playerReducer, createInitialState } from './playerMachine';

describe('playerMachine', () => {
  it('inicia en awaitingStart', () => {
    const s = createInitialState('fundamentos-01');
    expect(s.status).toBe('awaitingStart');
    expect(s.awaitingStart).toBe(true);
    expect(s.isForked).toBe(false);
  });

  it('START pasa a playing y limpia awaitingStart', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    expect(s.status).toBe('playing');
    expect(s.awaitingStart).toBe(false);
  });

  it('PAUSE no crea rama', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    s = playerReducer(s, { type: 'PAUSE' });
    expect(s.status).toBe('paused');
    expect(s.isForked).toBe(false);
  });

  it('FORK crea rama editing y guarda baseTime', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    s = playerReducer(s, { type: 'FORK', baseTime: 12345 });
    expect(s.status).toBe('editing');
    expect(s.isForked).toBe(true);
    expect(s.baseTime).toBe(12345);
  });

  it('primera edición pausa antes de modificar (RUN_DURING_PLAYBACK pausa y crea rama)', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    // Simula play -> run sin rama
    s = playerReducer(s, { type: 'RUN_DURING_PLAYBACK', baseTime: 5000 });
    expect(s.isForked).toBe(true);
    expect(s.status).toBe('editing');
  });

  it('CHALLENGE_TRIGGER entra en challenge y abre drawer', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 109400 });
    expect(s.status).toBe('challenge');
    expect(s.isForked).toBe(true);
    expect(s.activeChallengeId).toBe('reto-1');
    expect(s.isChallengeDrawerOpen).toBe(true);
  });

  it('cerrar reto no abandona silenciosamente: mantiene activeChallengeId', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 1000 });
    s = playerReducer(s, { type: 'CHALLENGE_CLOSE' });
    expect(s.isChallengeDrawerOpen).toBe(false);
    expect(s.activeChallengeId).toBe('reto-1');
    expect(s.status).toBe('challenge');
  });

  it('reabrir reto vuelve a abrir drawer', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 1000 });
    s = playerReducer(s, { type: 'CHALLENGE_CLOSE' });
    s = playerReducer(s, { type: 'CHALLENGE_REOPEN' });
    expect(s.isChallengeDrawerOpen).toBe(true);
  });

  it('CHALLENGE_SKIP continua la lección sin re-disparo inmediato', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 1000 });
    s = playerReducer(s, { type: 'CHALLENGE_SKIP' });
    expect(s.status).toBe('playing');
    expect(s.isForked).toBe(false);
    expect(s.activeChallengeId).toBe(null);
    expect(s.isChallengeDrawerOpen).toBe(false);
  });

  it('CHALLENGE_CONTINUE también limpia y pasa a playing', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 1000 });
    s = playerReducer(s, { type: 'CHALLENGE_CONTINUE' });
    expect(s.status).toBe('playing');
    expect(s.isForked).toBe(false);
  });

  it('RETURN_TO_TAPE reconstruye baseTime y limpia', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 5000 });
    s = playerReducer(s, { type: 'RETURN_TO_TAPE', baseTime: 5000 });
    expect(s.status).toBe('playing');
    expect(s.isForked).toBe(false);
    expect(s.baseTime).toBe(5000);
  });

  it('SEEK con pending edits no descarta silenciosamente', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    s = playerReducer(s, { type: 'FORK', baseTime: 1000 });
    // Simulate pending edits
    s = { ...s, hasPendingEdits: true };
    const next = playerReducer(s, { type: 'SEEK', targetMs: 5000, hasPendingEdits: true });
    expect(next).toEqual(s); // no transition, caller must show dialog
  });

  it('SEEK sin pending edits descarta rama y va a paused', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'START' });
    s = playerReducer(s, { type: 'FORK', baseTime: 1000 });
    s = playerReducer(s, { type: 'SEEK', targetMs: 0, hasPendingEdits: false });
    expect(s.isForked).toBe(false);
    expect(s.status).toBe('paused');
  });

  it('LESSON_CHANGE limpia estado anterior', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'CHALLENGE_TRIGGER', challengeId: 'reto-1', baseTime: 1000 });
    s = playerReducer(s, { type: 'LESSON_CHANGE', lessonId: 'fundamentos-02' });
    expect(s.lessonId).toBe('fundamentos-02');
    expect(s.status).toBe('awaitingStart');
    expect(s.isForked).toBe(false);
    expect(s.activeChallengeId).toBe(null);
  });

  it('RESTORE_BRANCH recupera rama', () => {
    let s = createInitialState('fundamentos-01');
    s = playerReducer(s, { type: 'RESTORE_BRANCH', baseTime: 5000, challengeId: 'reto-1' });
    expect(s.isForked).toBe(true);
    expect(s.status).toBe('challenge');
    expect(s.baseTime).toBe(5000);
  });
});
