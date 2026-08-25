import type { ScrimChallenge, ScrimLessonData } from '../types/scrim';

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function verificationTool(lesson: ScrimLessonData, challenge: ScrimChallenge): string {
  const functions = unique(
    challenge.tests
      .filter((test) => test.validatorType === 'function-call')
      .map((test) => test.targetFunction ?? ''),
  );
  if (functions.length > 0) {
    return `La evaluación llamará directamente ${functions.map((name) => `${name}(...)`).join(' y ')} con datos distintos. Devuelve el resultado; console.log es opcional y solo sirve para investigar.`;
  }
  if (lesson.executionMode === 'browser') {
    return 'Ejecuta la vista previa y prueba la interacción visible antes de pulsar Comprobar.';
  }
  return 'Ejecuta el programa y compara la salida real con cada criterio antes de pulsar Comprobar.';
}

export function guidedChallengeInstructions(
  lesson: ScrimLessonData,
  challenge: ScrimChallenge,
): string {
  if (/\bCómo comprobarlo\b/i.test(challenge.instructions)) return challenge.instructions;
  const model = lesson.mentalModel?.trim() || lesson.description.trim();
  const concepts = unique(lesson.concepts ?? []).slice(0, 4);
  const criteria = challenge.tests.map((test) => `- ${test.description.trim()}`);
  const conceptReminder = concepts.length > 0
    ? `Conceptos disponibles: ${concepts.join(', ')}.`
    : 'Usa únicamente las ideas presentadas en esta clase y en las anteriores.';

  return [
    challenge.instructions.trim(),
    '',
    'Antes de empezar',
    `Modelo que ya conoces: ${model}`,
    conceptReminder,
    '',
    'Punto de partida',
    `Modifica el starter que aparece en ${lesson.initialWorkspace.activeFilePath}. Conserva los nombres que mencionan el enunciado y las pruebas; cambia solo lo necesario para cumplir el contrato.`,
    '',
    'Cómo comprobarlo',
    ...criteria,
    verificationTool(lesson, challenge),
    '',
    'Si te atascas, abre las pistas de una en una. Cada pista reduce el problema sin sustituir tu código ni revelar una solución completa.',
  ].join('\n');
}

export function withGuidedChallenges(lesson: ScrimLessonData): ScrimLessonData {
  return {
    ...lesson,
    challenges: lesson.challenges.map((challenge) => ({
      ...challenge,
      instructions: guidedChallengeInstructions(lesson, challenge),
    })),
  };
}
