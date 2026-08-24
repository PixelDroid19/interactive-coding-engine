import { ReasoningExerciseItem } from '../../types/curriculum';
import { ComponentCourseLessonSpec } from './types';

export function buildReasoning(spec: ComponentCourseLessonSpec): ReasoningExerciseItem {
  const lessonId = `componentes-lit-${String(spec.number).padStart(2, '0')}`;
  const ids = spec.reasoningSteps.map((_, index) => `paso-${index + 1}`);
  return {
    id: `${lessonId}-razonamiento`,
    relatedLessonId: lessonId,
    title: `Dibuja el flujo: ${spec.title}`,
    type: 'reasoning',
    estimatedMinutes: 7,
    description: 'Ordena el comportamiento antes de tocar el código.',
    activity: {
      kind: 'sequence',
      prompt: spec.reading.diagram,
      steps: spec.reasoningSteps.map((label, index) => ({ id: ids[index], label })),
      expectedOrder: ids,
    },
    hints: [
      { level: 1, text: 'Empieza por la entrada que puede observar quien usa el componente.' },
      { level: 2, text: 'Después identifica qué ciclo o actualización procesa esa entrada.' },
      { level: 3, text: 'El último paso debe ser un resultado visible o un evento público.' },
    ],
    explanation: spec.reading.walkthrough,
  };
}
