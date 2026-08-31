import type { LearningProfile, MasteryCapability } from './types';

export interface ExamQuestion {
  id: string;
  skillId: string;
  capability: Extract<MasteryCapability, 'recognize' | 'explain' | 'modify' | 'debug'>;
  prompt: string;
  guidance: string;
}

export interface ExamEvaluation {
  classification: 'green' | 'yellow' | 'red';
  scores: Record<ExamQuestion['capability'], number>;
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

function writtenScore(capability: ExamQuestion['capability'], answer: string): number {
  const normalized = answer.trim().toLowerCase();
  if (normalized.length < 12) return 0.1;
  const lengthScore = Math.min(0.55, normalized.length / 180);
  const terms: Record<ExamQuestion['capability'], RegExp[]> = {
    recognize: [/prop[oó]sito|sirve|permite|agrupa|representa/, /c[oó]digo|nombre|valor|instrucci[oó]n/],
    explain: [/ejemplo|por ejemplo/, /entrada|recibe|dato/, /salida|devuelve|resultado/],
    modify: [/cambi|modific/, /prueba|comprobar|verificar|test/, /entrada|caso|valor/],
    debug: [/hip[oó]tesis|posible|sospech/, /prueba|experimento|test/, /error|consola|resultado|línea|linea/],
  };
  const termScore = terms[capability].filter((pattern) => pattern.test(normalized)).length / terms[capability].length * 0.45;
  return Number(Math.min(1, lengthScore + termScore).toFixed(2));
}

export function evaluateExamAnswers(
  questions: ExamQuestion[],
  answers: Partial<Record<ExamQuestion['capability'], string>>,
): ExamEvaluation {
  const scores = Object.fromEntries(CAPABILITIES.map((capability) => [capability, 0])) as ExamEvaluation['scores'];
  for (const question of questions) scores[question.capability] = writtenScore(question.capability, answers[question.capability] ?? '');
  const average = Object.values(scores).reduce((sum, score) => sum + score, 0) / CAPABILITIES.length;
  const classification = average >= 0.72 && Math.min(...Object.values(scores)) >= 0.45
    ? 'green'
    : average >= 0.35
      ? 'yellow'
      : 'red';
  const feedback = CAPABILITIES
    .filter((capability) => scores[capability] < 0.55)
    .map((capability) => `Refuerza ${capability === 'recognize' ? 'reconocer el propósito' : capability === 'explain' ? 'explicar con entradas y salida' : capability === 'modify' ? 'modificar y verificar' : 'formular hipótesis y pruebas'}.`);
  return { classification, scores, feedback };
}
