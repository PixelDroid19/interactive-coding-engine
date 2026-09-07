import type { LearningProfile, MasteryCapability } from './types';

export interface ExamQuestion {
  id: string;
  skillId: string;
  capability: Extract<MasteryCapability, 'recognize' | 'explain' | 'modify' | 'debug'>;
  prompt: string;
  guidance: string;
}

export interface ExamEvaluation {
  classification: 'ungraded';
  scores: Partial<Record<ExamQuestion['capability'], number>>;
  responses: Array<{ capability: ExamQuestion['capability']; prompt: string; answer: string }>;
  feedback: string[];
}

export type ExamConceptCandidate = string | Readonly<{
  skillId: string;
  label: string;
}>;

const CAPABILITIES: ExamQuestion['capability'][] = ['recognize', 'explain', 'modify', 'debug'];

function normalizeCandidate(candidate: ExamConceptCandidate): { skillId: string; label: string } {
  return typeof candidate === 'string'
    ? { skillId: candidate, label: candidate.replace(/-/g, ' ') }
    : candidate;
}

function weakestSkill(
  profile: LearningProfile,
  courseId: string,
  candidates: ExamConceptCandidate[] = [],
): { skillId: string; label: string } {
  const normalizedCandidates = candidates.map(normalizeCandidate);
  const labelsBySkill = new Map(normalizedCandidates.map((candidate) => [candidate.skillId, candidate.label]));
  const evidencedSkills = [...new Set(
    profile.evidence
      .filter((evidence) => evidence.courseId === courseId)
      .map((evidence) => evidence.skillId),
  )];
  if (!evidencedSkills.length) {
    return normalizedCandidates[0] ?? { skillId: 'fundamentos-del-curso', label: 'fundamentos del curso' };
  }
  const skillId = [...evidencedSkills].sort((left, right) => {
    const score = (skill: string) => {
      const values = Object.values(profile.skills[skill]?.capabilities ?? {}).map((capability) => capability.score);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    };
    return score(left) - score(right);
  })[0];
  return { skillId, label: labelsBySkill.get(skillId) ?? skillId.replace(/-/g, ' ') };
}

export function buildExamQuestions(
  profile: LearningProfile,
  courseId: string,
  candidates?: ExamConceptCandidate[],
): ExamQuestion[] {
  const { skillId, label: concept } = weakestSkill(profile, courseId, candidates);
  const prompts: Record<ExamQuestion['capability'], [string, string]> = {
    recognize: [`Define ${concept} sin usar la definición de memoria.`, 'Nombra su propósito y una señal para reconocerlo en código.'],
    explain: [`Explica el flujo de ${concept} con un ejemplo propio.`, 'Incluye entrada, pasos y resultado observable.'],
    modify: [`Un requisito cambia mientras trabajas con ${concept}. ¿Qué modificarías y cómo comprobarías que no rompiste lo anterior?`, 'Propón un cambio y al menos dos entradas de prueba.'],
    debug: [`El código que usa ${concept} falla. Formula una hipótesis y un experimento pequeño para refutarla.`, 'Separa causa posible, lugar donde mirar y prueba.'],
  };
  return CAPABILITIES.map((capability) => ({
    id: `exam:${skillId}:${capability}`,
    skillId,
    capability,
    prompt: prompts[capability][0],
    guidance: prompts[capability][1],
  }));
}

export function evaluateExamAnswers(
  questions: ExamQuestion[],
  answers: Partial<Record<ExamQuestion['capability'], string>>,
): ExamEvaluation {
  // Written answers require a human/content-aware review. Keywords and length
  // describe neither correctness nor the ability to transfer a concept.
  return {
    classification: 'ungraded',
    scores: {},
    responses: questions.map(question => ({ capability: question.capability, prompt: question.prompt, answer: (answers[question.capability] ?? '').trim().slice(0, 2000) })),
    feedback: ['Contrasta una de tus explicaciones con un ejemplo que puedas ejecutar.', 'Si algo todavía no está claro, conserva la pregunta y vuelve a la práctica de ese concepto.'],
  };
}
