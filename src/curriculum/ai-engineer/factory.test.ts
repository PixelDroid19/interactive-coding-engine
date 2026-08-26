import { describe, expect, it } from 'vitest';
import { buildAiLessonBundle } from './factory';
import { AI_ENGINEER_MODULES } from './course';
import type { AIEngineerLessonSpec } from './types';

const spec: AIEngineerLessonSpec = {
  number: 1,
  module: 0,
  title: 'Qué hace un AI Engineer',
  summary: 'Distingue una necesidad de producto, una capacidad de IA y el código que las conecta.',
  concepts: [{ label: 'AI Engineer', desc: 'Construye funciones de producto que usan modelos y datos.' }],
  skillsRequired: [],
  skillsIntroduced: ['traducir-problema-producto'],
  capacidad: { nombre: 'debe_escalar', descripcion: 'El chat decide cuándo una incidencia necesita atención humana.' },
  integracion: 'La función debe_escalar se conecta a la bandeja del chat para marcar incidencias críticas.',
  mentalModel: 'El modelo es una pieza del sistema, no el producto completo.',
  script: [
    'Empieza por una persona con un problema, no por un modelo de moda.',
    'Una función de IA recibe datos, pide una capacidad al modelo y comprueba la salida.',
    'En este ejemplo una regla decide si hace falta escalar una incidencia.',
    'Completa la función con tus propias condiciones y comprueba dos casos distintos.',
  ],
  javascript: {
    example: 'function debe_escalar(prioridad) {\n  return prioridad === "alta";\n}\n\nconsole.log(debe_escalar("alta"));',
    starter: 'function debe_escalar(prioridad) {\n  // Devuelve true solo para prioridad alta.\n}',
    solution: 'function debe_escalar(prioridad) {\n  return prioridad === "alta";\n}',
    debugStarter: 'function debe_escalar(prioridad) {\n  return true;\n}',
  },
  python: {
    example: 'def debe_escalar(prioridad):\n    return prioridad == "alta"\n\nprint(debe_escalar("alta"))',
    starter: 'def debe_escalar(prioridad):\n    # Devuelve True solo para prioridad alta.\n    pass',
    solution: 'def debe_escalar(prioridad):\n    return prioridad == "alta"',
    debugStarter: 'def debe_escalar(prioridad):\n    return True',
  },
  practice: {
    title: 'Decide cuándo escalar',
    instructions: 'Completa debe_escalar(prioridad). Debe funcionar con cualquier texto de prioridad.',
    functionName: 'debe_escalar',
    cases: [
      { args: ['alta'], expected: true, description: 'Escala una prioridad alta' },
      { args: ['baja'], expected: false, description: 'No escala una prioridad baja' },
    ],
    hints: [
      'Compara el valor recibido; no escribas una respuesta fija.',
      'Traza los casos alta y baja antes de editar.',
      'La función debe devolver un booleano.',
    ],
  },
  reading: {
    sections: [
      { title: 'Del problema al sistema', content: 'Una función de IA existe para cambiar una decisión o una tarea de una persona.' },
      { title: 'Dónde entra el modelo', content: 'El modelo transforma una entrada, pero el programa prepara datos y valida la salida.' },
      { title: 'Qué observar', content: 'Mide calidad, coste, latencia y fallos con casos concretos.' },
      { title: 'Errores comunes', content: 'Elegir un modelo antes de definir el resultado impide saber si la función sirve.' },
    ],
    keyPoints: ['Empieza por un resultado observable.', 'Valida la salida del modelo.'],
    questions: [{ question: '¿Todo producto necesita un modelo?', answer: 'No. Una regla suele ser mejor cuando el problema es estable y explícito.' }],
    transfer: 'Describe una tarea cotidiana que resolverías primero con una regla.',
    sourceIds: ['roadmap-ai-engineer', 'hf-llm-course'],
  },
  reasoning: {
    activity: {
      kind: 'sequence',
      prompt: 'Ordena el flujo de una función de IA.',
      steps: [
        { id: 'problema', label: 'Definir el problema' },
        { id: 'entrada', label: 'Preparar la entrada' },
        { id: 'modelo', label: 'Llamar al modelo' },
        { id: 'validar', label: 'Validar la salida' },
      ],
      expectedOrder: ['problema', 'entrada', 'modelo', 'validar'],
    },
    explanation: 'El orden conserva la intención del producto y trata la salida como dato no confiable.',
    hints: ['La llamada al modelo no es el primer paso.', 'La salida se valida antes de usarla.'],
  },
  debug: {
    title: 'La regla escala todo',
    expected: 'Solo las incidencias de prioridad alta se escalan.',
    observed: 'Todas las incidencias se escalan.',
    hints: ['Prueba una prioridad baja.', 'La respuesta fija ignora el argumento.', 'Compara prioridad con alta.'],
  },
};

describe('fábrica del curso AI Engineer', () => {
  it('construye clase silenciosa y cintas independientes por lenguaje', () => {
    const bundle = buildAiLessonBundle(spec);

    expect(bundle.lesson.narrationMode).toBe('silent');
    expect(bundle.lesson.audioTrack?.url).toBeUndefined();
    expect(bundle.lesson.languageVariants?.javascript.workspace.activeFilePath).toBe('app.js');
    expect(bundle.lesson.languageVariants?.python.workspace.activeFilePath).toBe('main.py');
    expect(bundle.lesson.languageVariants?.python.lessonTape?.events.some((event) => 'filePath' in event && event.filePath === 'main.py')).toBe(true);
    expect(bundle.lesson.challenges[0].languageVariants?.python.tests).toHaveLength(2);
  });

  it('crea lectura con fuentes, razonamiento y laboratorio dual', () => {
    const bundle = buildAiLessonBundle(spec);

    expect(bundle.reading.sections).toHaveLength(4);
    expect(bundle.reading.sources).toHaveLength(2);
    expect(bundle.reasoning.activity.kind).toBe('sequence');
    expect(bundle.debug.languageVariants?.javascript.workspace.files['app.js'].content).toContain('return true');
    expect(bundle.debug.languageVariants?.python.workspace.files['main.py'].content).toContain('return True');
    expect(bundle.debug.tests).toHaveLength(2);
  });

  it('declara las siete fases en el orden pedagógico acordado', () => {
    expect(AI_ENGINEER_MODULES.map((module) => module.id)).toEqual([
      'ai-fase-1-fundamentos',
      'ai-fase-2-conversacion',
      'ai-fase-3-modelo-local',
      'ai-fase-4-busqueda',
      'ai-fase-5-rag',
      'ai-fase-6-confiable',
      'ai-fase-7-final',
    ]);
  });
});
