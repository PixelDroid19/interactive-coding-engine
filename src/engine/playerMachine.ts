export type PlayerStatus =
  | 'awaitingStart'
  | 'playing'
  | 'paused'
  | 'editing'
  | 'challenge'
  | 'completed';

export interface PlayerMachineState {
  status: PlayerStatus;
  awaitingStart: boolean;
  isForked: boolean;
  hasPendingEdits: boolean;
  activeChallengeId: string | null;
  isChallengeDrawerOpen: boolean;
  isChallengeMinimized: boolean;
  baseTime: number;
  lessonId: string;
}

export type PlayerAction =
  | { type: 'LESSON_CHANGE'; lessonId: string }
  | { type: 'START' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'FORK'; baseTime: number }
  | { type: 'EDIT' }
  | { type: 'RUN_DURING_PLAYBACK'; baseTime: number }
  | { type: 'CHALLENGE_TRIGGER'; challengeId: string; baseTime: number }
  | { type: 'CHALLENGE_CLOSE' }
  | { type: 'CHALLENGE_REOPEN' }
  | { type: 'CHALLENGE_TOGGLE_MINIMIZE' }
  | { type: 'CHALLENGE_RESET' }
  | { type: 'CHALLENGE_CONTINUE' }
  | { type: 'CHALLENGE_SKIP' }
  | { type: 'RETURN_TO_TAPE'; baseTime: number }
  | { type: 'SEEK'; targetMs: number; hasPendingEdits: boolean }
  | { type: 'COMPLETE' }
  | { type: 'RESTORE_BRANCH'; baseTime: number; challengeId?: string | null }
  | { type: 'DISCARD_BRANCH'; baseTime: number };

export function createInitialState(lessonId: string): PlayerMachineState {
  return {
    status: 'awaitingStart',
    awaitingStart: true,
    isForked: false,
    hasPendingEdits: false,
    activeChallengeId: null,
    isChallengeDrawerOpen: false,
    isChallengeMinimized: false,
    baseTime: 0,
    lessonId,
  };
}

export function playerReducer(state: PlayerMachineState, action: PlayerAction): PlayerMachineState {
  switch (action.type) {
    case 'LESSON_CHANGE': {
      return createInitialState(action.lessonId);
    }
    case 'START': {
      // First gesture starts audio and tape; always goes to playing unless already editing/challenge
      if (state.status === 'awaitingStart' || state.status === 'paused' || state.status === 'completed') {
        if (state.isForked) {
          // If forked, START means return to tape first
          return {
            ...state,
            status: 'playing',
            awaitingStart: false,
            isForked: false,
            hasPendingEdits: false,
            activeChallengeId: null,
            isChallengeDrawerOpen: false,
            isChallengeMinimized: false,
          };
        }
        return { ...state, status: 'playing', awaitingStart: false };
      }
      if (state.status === 'editing' || state.status === 'challenge') {
        // Start while editing should return to tape
        return {
          ...state,
          status: 'playing',
          awaitingStart: false,
          isForked: false,
          hasPendingEdits: false,
          activeChallengeId: null,
          isChallengeDrawerOpen: false,
        };
      }
      return state;
    }
    case 'PLAY': {
      if (state.status === 'awaitingStart') {
        return { ...state, status: 'playing', awaitingStart: false };
      }
      if (state.status === 'paused' || state.status === 'completed') {
        return { ...state, status: 'playing', awaitingStart: false };
      }
      // If editing/challenge, play should not happen directly; must return first
      return state;
    }
    case 'PAUSE': {
      if (state.status === 'playing') {
        return { ...state, status: 'paused' };
      }
      return state;
    }
    case 'FORK': {
      if (state.isForked) return state;
      return {
        ...state,
        status: state.activeChallengeId ? 'challenge' : 'editing',
        isForked: true,
        hasPendingEdits: false,
        baseTime: action.baseTime,
      };
    }
    case 'EDIT': {
      // First edit pauses tape before modifying workspace
      if (!state.isForked) {
        // Editing implies forked
        return {
          ...state,
          status: state.activeChallengeId ? 'challenge' : 'editing',
          isForked: true,
          hasPendingEdits: true,
        };
      }
      return { ...state, hasPendingEdits: true, status: state.activeChallengeId ? 'challenge' : 'editing' };
    }
    case 'RUN_DURING_PLAYBACK': {
      // Run must pause before creating branch
      if (!state.isForked) {
        return {
          ...state,
          status: state.activeChallengeId ? 'challenge' : 'editing',
          isForked: true,
          hasPendingEdits: false,
          baseTime: action.baseTime,
        };
      }
      return state;
    }
    case 'CHALLENGE_TRIGGER': {
      return {
        ...state,
        status: 'challenge',
        isForked: true,
        activeChallengeId: action.challengeId,
        isChallengeDrawerOpen: true,
        isChallengeMinimized: false,
        baseTime: action.baseTime,
        awaitingStart: false,
      };
    }
    case 'CHALLENGE_CLOSE': {
      // Close drawer but keep challenge active for reopen
      if (state.status !== 'challenge') return state;
      return { ...state, isChallengeDrawerOpen: false };
    }
    case 'CHALLENGE_REOPEN': {
      if (!state.activeChallengeId) return state;
      return { ...state, status: 'challenge', isChallengeDrawerOpen: true, isChallengeMinimized: false };
    }
    case 'CHALLENGE_TOGGLE_MINIMIZE': {
      return { ...state, isChallengeMinimized: !state.isChallengeMinimized };
    }
    case 'CHALLENGE_RESET': {
      // Keep challenge active but clear minimized? Reset handled by parent clearing validation
      return { ...state, isChallengeDrawerOpen: true, isChallengeMinimized: false };
    }
    case 'CHALLENGE_CONTINUE':
    case 'CHALLENGE_SKIP': {
      // After continue or skip, no longer in challenge, but still fork? Spec says after continue/skip, learner returns to tape: should clear fork?
      // Actually handleSkip/Continue should seek and play tape, so discard fork
      return {
        ...state,
        status: 'playing',
        isForked: false,
        hasPendingEdits: false,
        activeChallengeId: null,
        isChallengeDrawerOpen: false,
        isChallengeMinimized: false,
        awaitingStart: false,
      };
    }
    case 'RETURN_TO_TAPE': {
      return {
        ...state,
        status: 'playing',
        isForked: false,
        hasPendingEdits: false,
        activeChallengeId: null,
        isChallengeDrawerOpen: false,
        isChallengeMinimized: false,
        baseTime: action.baseTime,
        awaitingStart: false,
      };
    }
    case 'SEEK': {
      if (state.isForked && action.hasPendingEdits) {
        // Should not silently discard; caller must show confirmation dialog
        // We do not transition automatically
        return state;
      }
      if (state.isForked) {
        // Seek while forked without pending edits discards branch and returns to tape at target
        return {
          ...state,
          status: 'paused',
          isForked: false,
          hasPendingEdits: false,
          activeChallengeId: null,
          isChallengeDrawerOpen: false,
        };
      }
      // Normal seek while playing/paused preserves status but updates time via engine
      return state;
    }
    case 'DISCARD_BRANCH': {
      return {
        ...state,
        status: 'paused',
        isForked: false,
        hasPendingEdits: false,
        activeChallengeId: null,
        isChallengeDrawerOpen: false,
        isChallengeMinimized: false,
        baseTime: action.baseTime,
      };
    }
    case 'COMPLETE': {
      return { ...state, status: 'completed', awaitingStart: false };
    }
    case 'RESTORE_BRANCH': {
      return {
        ...state,
        status: action.challengeId ? 'challenge' : 'editing',
        isForked: true,
        hasPendingEdits: true,
        baseTime: action.baseTime,
        activeChallengeId: action.challengeId ?? null,
        isChallengeDrawerOpen: Boolean(action.challengeId),
        awaitingStart: false,
      };
    }
    default:
      return state;
  }
}

// Helper to derive UI flags
export function isPlayingState(s: PlayerMachineState): boolean {
  return s.status === 'playing';
}
export function isForkedState(s: PlayerMachineState): boolean {
  return s.isForked;
}
export function canShowReopenChallenge(s: PlayerMachineState): boolean {
  return Boolean(s.activeChallengeId && !s.isChallengeDrawerOpen);
}
