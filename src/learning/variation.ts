export interface PostSolveVariation {
  id: string;
  changedRequirement: string;
  verificationPrompt: string;
  readingPrompt: string;
}

interface VariationInput {
  itemId: string;
  title: string;
  instructions?: string;
  kind: 'challenge' | 'debugging' | 'reasoning' | 'project';
}

const VARIATIONS = [
  {
    changedRequirement: 'Ahora debe funcionar también con un dato vacío o con el valor límite, sin romper el caso que ya resolviste.',
    verificationPrompt: 'Escribe dos casos: el límite nuevo y un caso anterior que debe seguir funcionando.',
  },
  {
    changedRequirement: 'El requisito cambió: la regla debe servir con dos valores diferentes a los usados en el ejemplo.',
    verificationPrompt: 'Anota qué entradas usarías y qué resultado observable esperas en cada una.',
  },
  {
    changedRequirement: 'Otra parte de la aplicación necesita reutilizar esta solución sin copiarla.',
    verificationPrompt: 'Explica qué entrada y qué salida formarían un contrato reutilizable.',
  },
  {
    changedRequirement: 'La interfaz debe conservar el comportamiento, pero el texto o dato inicial puede cambiar.',
    verificationPrompt: 'Indica qué parte cambiarías y qué parte no tocarías para evitar una regresión.',
  },
] as const;

function hash(text: string): number {
  let value = 0;
  for (const character of text) value = (value * 31 + character.charCodeAt(0)) >>> 0;
  return value;
}

export function buildPostSolveVariation(input: VariationInput): PostSolveVariation {
  const selected = VARIATIONS[hash(input.itemId) % VARIATIONS.length];
  const context = input.instructions?.trim().split(/\n|\.(?:\s|$)/)[0]?.trim();
  return {
    id: `variation:${input.itemId}`,
    changedRequirement: `${selected.changedRequirement}${context ? ` Parte del contrato original: “${context}”.` : ''}`,
    verificationPrompt: selected.verificationPrompt,
    readingPrompt: input.kind === 'debugging'
      ? `Sin volver a editar, explica cuál fue la primera diferencia observable en “${input.title}” y por qué tu cambio corrige la causa, no solo el síntoma.`
      : `Lee tu solución de arriba abajo y explica qué dato entra, qué decisión o transformación ocurre y qué resultado se puede observar en “${input.title}”.`,
  };
}
