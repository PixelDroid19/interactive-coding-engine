import {
  LEARNING_PROFILE_VERSION,
  type CapabilityMastery,
  type EvidenceResult,
  type LearningEvidence,
  type LearningProfile,
} from './types';

const RESULT_SCORE: Record<EvidenceResult, number> = {
  success: 1,
  partial: 0.55,
  failure: 0.15,
};

const MAX_EVIDENCE = 200;

export function createEmptyLearningProfile(now = Date.now()): LearningProfile {
  return {
    version: LEARNING_PROFILE_VERSION,
    updatedAt: now,
    skills: {},
    evidence: [],
    reviews: [],
    notebook: [],
    exams: [],
    tutor: {
      selectedModel: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
      downloadedModelIds: [],
      conversations: {},
      reinforcements: [],
    },
  };
}

function nextCapability(previous: CapabilityMastery | undefined, evidence: LearningEvidence): CapabilityMastery {
  const observed = RESULT_SCORE[evidence.result];
  const score = previous
    ? Math.min(1, Math.max(0, previous.score * 0.6 + observed * 0.4))
    : observed;
  return {
    score: Number(score.toFixed(3)),
    attempts: (previous?.attempts ?? 0) + 1,
    successes: (previous?.successes ?? 0) + (evidence.result === 'success' ? 1 : 0),
    lastPracticedAt: evidence.timestamp,
    lastResult: evidence.result,
  };
}

export function recordEvidence(profile: LearningProfile, evidence: LearningEvidence): LearningProfile {
  if (profile.evidence.some((candidate) => candidate.id === evidence.id)) return profile;
  const previousSkill = profile.skills[evidence.skillId];
  const previousCapability = previousSkill?.capabilities[evidence.capability];
  const skills = {
    ...profile.skills,
    [evidence.skillId]: {
      skillId: evidence.skillId,
      capabilities: {
        ...previousSkill?.capabilities,
        [evidence.capability]: nextCapability(previousCapability, evidence),
      },
      updatedAt: evidence.timestamp,
    },
  };
  return {
    ...profile,
    updatedAt: evidence.timestamp,
    skills,
    evidence: [...profile.evidence, evidence].slice(-MAX_EVIDENCE),
  };
}
