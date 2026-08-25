import type {
  LearningGenerationRequest,
  LearningGenerationResult,
  LearningModelProvider,
} from './learningProvider';

export interface DeterministicFixture {
  match: RegExp;
  response: string;
}

const DEFAULT_FIXTURES: DeterministicFixture[] = [
  {
    match: /\b(rag|recuperaci[oó]n)\b/i,
    response: 'RAG primero busca fragmentos pertinentes y luego los incluye como contexto para que el modelo responda con evidencia recuperada.',
  },
  {
    match: /\bembedding|vector\b/i,
    response: 'Un embedding representa un texto como una lista de números. Textos con significado parecido suelen quedar cerca según una medida como el coseno.',
  },
  {
    match: /\bagente|herramienta\b/i,
    response: 'Un agente combina un modelo, instrucciones, estado y herramientas. El modelo propone una acción; el programa valida y ejecuta esa acción.',
  },
];

export class DeterministicChatProvider implements LearningModelProvider {
  constructor(private readonly fixtures: DeterministicFixture[] = DEFAULT_FIXTURES) {}

  async generate(request: LearningGenerationRequest): Promise<LearningGenerationResult> {
    const prompt = request.messages.map((message) => message.content).join('\n');
    const fixture = this.fixtures.find((candidate) => candidate.match.test(prompt));
    return {
      text: fixture?.response
        ?? 'Este simulador no improvisa respuestas. Prueba una pregunta sobre RAG, embeddings, agentes o herramientas.',
      model: 'simulador-didáctico-v1',
      provider: 'deterministic',
    };
  }
}
