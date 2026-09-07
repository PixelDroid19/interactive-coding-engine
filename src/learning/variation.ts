export interface PostSolveVariation {
  id: string;
  changedRequirement: string;
  verificationPrompt: string;
  readingPrompt: string;
  readingPlaceholder: string;
}

interface VariationInput {
  itemId: string;
  title: string;
  instructions?: string;
  kind: 'challenge' | 'debugging' | 'reasoning' | 'project';
}

const REFLECTIONS = {
  challenge: {
    readingPrompt: '¿Qué pone en marcha tu solución, qué cambia y qué puedes observar?',
    readingPlaceholder: 'Empieza cuando…; cambia…; puedo observar…',
    changedRequirement: 'Elige una condición de uso distinta para este reto. Explica qué cambiarías y qué debería seguir funcionando.',
    verificationPrompt: 'Probaría… y debería ocurrir…',
  },
  debugging: {
    readingPrompt: '¿Qué estaba pasando y qué cambió al corregirlo?',
    readingPlaceholder: 'Antes ocurría…; cambié…; ahora observo…',
    changedRequirement: 'Elige otra situación de uso en la que podría reaparecer el fallo. ¿Cómo comprobarías que la corrección también funciona allí?',
    verificationPrompt: 'Para intentar reproducirlo haría… y debería ocurrir…',
  },
  reasoning: {
    readingPrompt: '¿Por qué organizaste el modelo así? Explica una relación entre dos de sus partes.',
    readingPlaceholder: 'Estas partes se relacionan porque…',
    changedRequirement: 'Elige una condición del problema y cámbiala. ¿Qué parte del modelo revisarías y qué relación debería mantenerse?',
    verificationPrompt: 'Cambiaría…; mantendría…; lo comprobaría…',
  },
  project: {
    readingPrompt: '¿Qué requisito resolviste y cómo puede comprobarlo otra persona?',
    readingPlaceholder: 'El requisito era…; lo resolví…; se comprueba…',
    changedRequirement: 'Elige un requisito del proyecto y cambia una condición de uso. Explica qué adaptarías y qué comportamiento conservarías.',
    verificationPrompt: 'Cambiaría esta condición… y comprobaría…',
  },
} satisfies Record<VariationInput['kind'], Omit<PostSolveVariation, 'id'>>;

export function buildPostSolveVariation(input: VariationInput): PostSolveVariation {
  const selected = REFLECTIONS[input.kind];
  return {
    ...selected,
    id: `variation:${input.itemId}`,
    readingPrompt: `${input.title.trim() ? `Sobre «${input.title.trim()}»: ` : ''}${selected.readingPrompt}`,
  };
}
