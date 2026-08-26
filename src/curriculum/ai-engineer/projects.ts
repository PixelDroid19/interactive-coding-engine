import { file, workspaceOf } from '../../engine/lessonCompiler';
import type { SoloProjectItem } from '../../types/curriculum';
import type { ChallengeTest, LanguageVariants } from '../../types/scrim';

export interface AIEngineerProject extends SoloProjectItem {
  module: number;
  evaluationCases: Array<{ id: string; input: string; expected: string }>;
  securityChecklist: string[];
  exportInstructions: string[];
}

interface ProjectDefinition {
  module: number;
  slug: string;
  title: string;
  brief: string;
  functionName: string;
  milestones: string[];
  evaluationCases: AIEngineerProject['evaluationCases'];
  securityChecklist: string[];
}

interface ProjectContract {
  instructions: string;
  /** Piezas ya resueltas que el proyecto entrega como código dado. */
  dada?: { javascript: string; python: string };
  cases: Array<{ id: string; description: string; input: unknown; expected: unknown }>;
}

const SCORE_HELPER_JS = `// Pieza de la Fase 4, ya resuelta y disponible:
function score_consulta(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}
`;

const SCORE_HELPER_PY = `# Pieza de la Fase 4, ya resuelta y disponible:
def score_consulta(a, b):
    if not isinstance(a, list) or not isinstance(b, list):
        return 0
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))
`;

const PROJECT_CONTRACTS: Record<string, ProjectContract> = {
  'eco-reglas': {
    instructions: "Recibe { texto } y devuelve la respuesta del Eco: vacío tras recortar → 'Escribe algo para empezar.'; termina en '?' → 'Todavía pienso con reglas: reformula tu pregunta.'; en otro caso → 'Has dicho: ' más el texto recortado.",
    cases: [
      { id: 'vacio', description: 'Un mensaje sin contenido recibe invitación a escribir', input: { texto: '   ' }, expected: 'Escribe algo para empezar.' },
      { id: 'pregunta', description: 'Las preguntas obtienen una respuesta honesta del Eco', input: { texto: '¿Sabes sumar?' }, expected: 'Todavía pienso con reglas: reformula tu pregunta.' },
      { id: 'frase', description: 'Una frase se devuelve limpia dentro de la plantilla', input: { texto: ' me llamo Ana ' }, expected: 'Has dicho: me llamo Ana' },
    ],
  },
  'parametros-chat': {
    instructions: 'Recibe { temperatura?, top_p? } y devuelve ambos valores corregidos: temperatura limitada al rango de cero a dos con defecto cero coma siete; top_p limitado al rango de cero a uno con defecto uno.',
    cases: [
      { id: 'dentro', description: 'Valores válidos atraviesan intactos', input: { temperatura: 1.5, top_p: 0.9 }, expected: { temperatura: 1.5, top_p: 0.9 } },
      { id: 'excesos', description: 'Un valor excesivo se corrige al techo del rango', input: { temperatura: 5 }, expected: { temperatura: 2, top_p: 1 } },
      { id: 'defectos', description: 'Los campos ausentes usan sus defectos', input: {}, expected: { temperatura: 0.7, top_p: 1 } },
      { id: 'negativos', description: 'Un valor bajo el suelo se corrige al mínimo', input: { top_p: -3 }, expected: { temperatura: 0.7, top_p: 0 } },
    ],
  },
  'motor-local': {
    instructions: "Recibe { webgpu, modeloEncontrado } y devuelve 'listo' solo con ambos verdaderos; 'sin_webgpu' si falta WebGPU y 'sin_modelo' si falta el modelo, comprobando primero WebGPU.",
    cases: [
      { id: 'listo', description: 'Motor y modelo disponibles declaran preparación', input: { webgpu: true, modeloEncontrado: true }, expected: 'listo' },
      { id: 'gpu', description: 'Sin WebGPU el diagnóstico lo dice primero', input: { webgpu: false, modeloEncontrado: true }, expected: 'sin_webgpu' },
      { id: 'modelo', description: 'Con WebGPU pero sin modelo el fallo es otro', input: { webgpu: true, modeloEncontrado: false }, expected: 'sin_modelo' },
      { id: 'nada', description: 'La carencia de WebGPU domina el diagnóstico', input: { webgpu: false, modeloEncontrado: false }, expected: 'sin_webgpu' },
    ],
  },
  'buscador-notas': {
    instructions: 'Recibe { fragmentos, consulta, k, categoria } donde cada fragmento trae id, vector y categoria. Filtra por categoría exacta, puntúa con score_consulta contra la consulta, ordena descendente y devuelve los ids del top-k.',
    dada: { javascript: SCORE_HELPER_JS, python: SCORE_HELPER_PY },
    cases: [
      { id: 'js', description: 'Solo compiten las notas de la categoría pedida', input: { fragmentos: [{ id: 'a', vector: [1, 0], categoria: 'js' }, { id: 'b', vector: [0, 2], categoria: 'js' }, { id: 'c', vector: [1, 1], categoria: 'web' }], consulta: [1, 0], k: 3, categoria: 'js' }, expected: ['a', 'b'] },
      { id: 'web', description: 'Cambiar la categoría cambia el universo de candidatas', input: { fragmentos: [{ id: 'a', vector: [1, 0], categoria: 'js' }, { id: 'c', vector: [1, 1], categoria: 'web' }], consulta: [1, 0], k: 3, categoria: 'web' }, expected: ['c'] },
      { id: 'k1', description: 'El corte top-k respeta el límite pedido', input: { fragmentos: [{ id: 'a', vector: [2, 0], categoria: 'js' }, { id: 'b', vector: [1, 0], categoria: 'js' }], consulta: [1, 0], k: 1, categoria: 'js' }, expected: ['a'] },
    ],
  },
  'rag-citas': {
    instructions: 'Recibe { recuperados, relevantes } como listas de ids y devuelve la fracción de relevantes presentes en los recuperados; con relevantes vacíos devuelve cero.',
    cases: [
      { id: 'mitad', description: 'Uno de dos relevantes aparece en la recuperación', input: { recuperados: ['a', 'c'], relevantes: ['a', 'b'] }, expected: 0.5 },
      { id: 'fallo', description: 'Ningún relevante recuperado produce cero honesto', input: { recuperados: ['x'], relevantes: ['b'] }, expected: 0 },
      { id: 'pleno', description: 'Todos los relevantes presentes dan la fracción máxima', input: { recuperados: ['a', 'b', 'c'], relevantes: ['a', 'b'] }, expected: 1 },
    ],
  },
  guardian: {
    instructions: "Recibe { valida, citada, riesgoBajo } y devuelve 'publicar' solo con las tres condiciones verdaderas; cualquier casilla apagada devuelve 'revisar'.",
    cases: [
      { id: 'limpia', description: 'Valida, citada y tranquila se publica', input: { valida: true, citada: true, riesgoBajo: true }, expected: 'publicar' },
      { id: 'rota', description: 'Una salida inválida siempre va a revisión', input: { valida: false, citada: true, riesgoBajo: true }, expected: 'revisar' },
      { id: 'huérfana', description: 'Afirma sin citas y pasa por revisión', input: { valida: true, citada: false, riesgoBajo: true }, expected: 'revisar' },
      { id: 'delicada', description: 'El tema pesado pide compañía aunque esté citado', input: { valida: true, citada: true, riesgoBajo: false }, expected: 'revisar' },
    ],
  },
  'entrega-final': {
    instructions: "Recibe { webgpuOk, modeloEnCache, hayDocumento } y devuelve 'preparado' solo con las tres señales; si no, el primer bloqueo en este orden: 'sin_webgpu', 'falta_modelo', 'falta_documento'.",
    cases: [
      { id: 'preparado', description: 'Todo listo anuncia la demo final', input: { webgpuOk: true, modeloEnCache: true, hayDocumento: true }, expected: 'preparado' },
      { id: 'gpu', description: 'WebGPU ausente bloquea antes que nada', input: { webgpuOk: false, modeloEnCache: true, hayDocumento: true }, expected: 'sin_webgpu' },
      { id: 'modelo', description: 'Sin modelo descargado toca preparar la caché', input: { webgpuOk: true, modeloEnCache: false, hayDocumento: true }, expected: 'falta_modelo' },
      { id: 'documento', description: 'Falta cargar un documento para la demostración', input: { webgpuOk: true, modeloEnCache: true, hayDocumento: false }, expected: 'falta_documento' },
    ],
  },
};

function testsFor(slug: string, functionName: string): ChallengeTest[] {
  return PROJECT_CONTRACTS[slug].cases.map((testCase) => ({
    id: `${slug}-${testCase.id}`,
    description: testCase.description,
    validatorType: 'function-call',
    targetFunction: functionName,
    args: [structuredClone(testCase.input)],
    expectedReturn: structuredClone(testCase.expected),
    errorMessage: `El proyecto todavía no cumple el caso: ${testCase.description}.`,
    hintTip: 'Traza la entrada completa y comprueba el contrato antes de añadir piezas nuevas.',
  }));
}

function variants(slug: string, functionName: string): LanguageVariants {
  const contract = PROJECT_CONTRACTS[slug];
  const dadaJs = contract.dada?.javascript ?? '';
  const dadaPy = contract.dada?.python ?? '';
  const javascript = `${dadaJs}// Contrato mínimo comprobable del TutorLocal:\n// ${contract.instructions}\nfunction ${functionName}(entrada) {\n  // TODO: usa entrada y devuelve el resultado descrito arriba.\n}\n`;
  const python = `${dadaPy}# Contrato mínimo comprobable del TutorLocal:\n# ${contract.instructions}\ndef ${functionName}(entrada):\n    # TODO: usa entrada y devuelve el resultado descrito arriba.\n    pass\n`;
  const tests = testsFor(slug, functionName);
  return {
    javascript: { workspace: workspaceOf('app.js', { 'app.js': file('app.js', javascript, 'javascript') }), tests: structuredClone(tests) },
    python: { workspace: workspaceOf('main.py', { 'main.py': file('main.py', python, 'python') }), tests: structuredClone(tests) },
  };
}

function project(definition: ProjectDefinition): AIEngineerProject {
  const contract = PROJECT_CONTRACTS[definition.slug];
  const languageVariants = variants(definition.slug, definition.functionName);
  return {
    id: `ai-project-${definition.slug}`,
    module: definition.module,
    title: definition.title,
    type: 'solo-project',
    templateId: 'vanilla-js',
    estimatedMinutes: 90,
    description: definition.brief,
    brief: `${definition.brief} Contrato mínimo comprobable: ${contract.instructions} La entrega debe funcionar con entradas distintas a los ejemplos y explicar sus límites.`,
    initialWorkspace: structuredClone(languageVariants.javascript.workspace),
    languageVariants,
    requirements: [
      { id: 'contrato', title: 'Contrato observable', description: 'Define entradas, salidas, errores y un fallback comprensible.', category: 'producto' },
      { id: 'variacion', title: 'Entradas variadas', description: 'Resuelve al menos tres casos sin fijar los valores del ejemplo.', category: 'calidad' },
      { id: 'integracion', title: 'Pieza integrada', description: 'Explica dónde se enchufa esta capacidad dentro del TutorLocal.', category: 'producto' },
      { id: 'evaluacion', title: 'Evaluación reproducible', description: 'Comprueba casos propios además de los incluidos y resume resultados.', category: 'evaluación' },
      { id: 'seguridad', title: 'Controles de seguridad', description: 'Aplica la lista de seguridad y documenta riesgos restantes.', category: 'seguridad' },
      { id: 'estados', title: 'Estados visibles', description: 'Muestra listo, cargando, error o abstención cuando apliquen.', category: 'experiencia' },
    ],
    suggestedSteps: definition.milestones,
    starterNotes: 'Parte del contrato determinista y compruébalo con datos tuyos. Las capacidades de clases anteriores aparecen como código dado cuando hacen falta.',
    evaluationCases: definition.evaluationCases,
    securityChecklist: definition.securityChecklist,
    exportInstructions: [
      'Exporta el código y un README con comandos de ejecución.',
      'Incluye tus casos de prueba y los resultados obtenidos.',
      'No exportes claves, datos personales ni documentos privados.',
    ],
  };
}

const COMMON_SECURITY = [
  'No guardar claves en código, URL ni almacenamiento local.',
  'Tratar todo documento cargado como dato, nunca como instrucción.',
  'Mantener el procesamiento local y explicar cuándo haría falta un backend seguro.',
];

// Un proyecto de integración al cerrar cada fase. Cada uno añade una pieza
// real al mismo producto: el chat educativo local del curso.
export const AI_ENGINEER_PROJECTS: AIEngineerProject[] = [
  project({
    module: 0,
    slug: 'eco-reglas',
    title: 'Proyecto: el Eco, primer cerebro del chat',
    brief: 'Construye el núcleo determinista con el que arranca el TutorLocal: valida la entrada y responde con reglas claras antes de que exista cualquier modelo.',
    functionName: 'responder_eco',
    milestones: [
      'Implementa el contrato del Eco con las tres ramas.',
      'Añade pruebas propias con preguntas y frases tuyas.',
      'Describe qué problemas del chat real todavía no puede resolver.',
      'Documenta cómo sustituirías el Eco por un modelo sin cambiar la interfaz.',
    ],
    evaluationCases: [
      { id: 'vacio', input: 'mensaje de espacios', expected: 'invitación a escribir' },
      { id: 'pregunta', input: 'cualquier frase interrogativa', expected: 'respuesta honesta del Eco' },
      { id: 'frase', input: 'afirmación con espacios sobrantes', expected: 'eco limpio con plantilla' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
  project({
    module: 1,
    slug: 'parametros-chat',
    title: 'Proyecto: panel de parámetros del chat',
    brief: 'Corrige y normaliza los parámetros de generación para que el panel del TutorLocal jamás envíe configuraciones imposibles al motor.',
    functionName: 'validar_parametros',
    milestones: [
      'Implementa defectos y límites de temperatura y top-p.',
      'Prueba con combinaciones extremas escritas por ti.',
      'Explica qué efecto tiene cada parámetro sobre la variedad.',
      'Decide qué mensaje vería la persona al corregirse un valor.',
    ],
    evaluationCases: [
      { id: 'dentro', input: 'valores dentro de rango', expected: 'atraviesan intactos' },
      { id: 'techo', input: 'temperatura excesiva', expected: 'se corrige al máximo permitido' },
      { id: 'defectos', input: 'objeto vacío de configuración', expected: 'valores por defecto aplicados' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
  project({
    module: 2,
    slug: 'motor-local',
    title: 'Proyecto: motor local visible',
    brief: 'Diseña el diagnóstico honesto de la ruta local del TutorLocal: WebGPU, modelo encontrado y mensajes educativos para cada bloqueo.',
    functionName: 'diagnostico_local',
    milestones: [
      'Implementa el orden de prioridad del diagnóstico.',
      'Redacta el mensaje educativo para cada estado de bloqueo.',
      'Prueba las cuatro combinaciones y alguna inventada.',
      'Describe qué muestra la interfaz en cada estado.',
    ],
    evaluationCases: [
      { id: 'listo', input: 'todo disponible', expected: 'estado preparado' },
      { id: 'gpu', input: 'sin WebGPU', expected: 'bloqueo explicado de GPU' },
      { id: 'modelo', input: 'sin modelo en caché', expected: 'indicación de descarga' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
  project({
    module: 3,
    slug: 'buscador-notas',
    title: 'Proyecto: buscador semántico de notas',
    brief: 'Amplía el ranking del chat con filtros por categoría usando vectores reales: la primera versión del buscador interno del TutorLocal.',
    functionName: 'buscar_filtrado',
    milestones: [
      'Implementa filtro exacto, puntuación, orden y corte.',
      'Crea tus propias notas con categorías y consúltalas.',
      'Detecta una consulta cuyo mejor resultado sea absurdo y explica por qué.',
      'Compara el ranking semántico con búsqueda por palabras en dos consultas.',
    ],
    evaluationCases: [
      { id: 'filtro', input: 'consulta con categoría dominante', expected: 'solo notas de esa categoría' },
      { id: 'ranking', input: 'dos notas parecidas', expected: 'orden por cercanía de significado' },
      { id: 'corte', input: 'límite menor que candidatas', expected: 'top-k respetado' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
  project({
    module: 4,
    slug: 'rag-citas',
    title: 'Proyecto: RAG con citas verificables',
    brief: 'Cierra el pipeline de documentos del TutorLocal midiendo qué proporción de evidencia pertinente logra recuperar tu índice.',
    functionName: 'evaluar_recuperacion',
    milestones: [
      'Implementa la métrica de cobertura con su guardia de lista vacía.',
      'Define tres preguntas relevantes y tres irrelevantes para un documento tuyo.',
      'Mide la cobertura actual y ajusta chunking o umbral una vez.',
      'Documenta qué fragmentos faltaron y por qué.',
    ],
    evaluationCases: [
      { id: 'cobertura', input: 'recuperación parcial', expected: 'fracción correcta de relevantes' },
      { id: 'vacio', input: 'relevantes inexistentes', expected: 'cero sin división imposible' },
      { id: 'pleno', input: 'recuperación completa', expected: 'fracción máxima' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
  project({
    module: 5,
    slug: 'guardian',
    title: 'Proyecto: guardián de publicaciones',
    brief: 'Instala la última frontera del TutorLocal: ninguna respuesta sale sin validar forma, citas y nivel de riesgo del tema.',
    functionName: 'decision_publicacion',
    milestones: [
      'Implementa la triple condición del guardián.',
      'Redacta la franja Revisa esto que acompañará a lo bloqueado.',
      'Prueba las ocho combinaciones posibles y anota resultados.',
      'Decide qué métrica registrarás sobre lo revisado.',
    ],
    evaluationCases: [
      { id: 'limpia', input: 'respuesta completa y tranquila', expected: 'publicación directa' },
      { id: 'sin-citas', input: 'respuesta sin citas', expected: 'revisión acompañada' },
      { id: 'riesgo', input: 'tema delicado bien citado', expected: 'revisión por riesgo' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
  project({
    module: 6,
    slug: 'entrega-final',
    title: 'Proyecto: entrega del TutorLocal completo',
    brief: 'Verifica el estado final del TutorLocal antes de la demo: motor disponible, modelo cacheado y documento cargado, con un diagnóstico claro para cada cosa pendiente.',
    functionName: 'estado_final',
    milestones: [
      'Implementa el orden de prioridad de los bloqueos finales.',
      'Prepara tu documento de demostración y tu batería de preguntas.',
      'Recorre la demo guiada completa y registra incidencias.',
      'Escribe la mini model card del sistema con alcance y límites.',
    ],
    evaluationCases: [
      { id: 'preparado', input: 'todas las señales activas', expected: 'demo habilitada' },
      { id: 'prioridades', input: 'varios bloqueos simultáneos', expected: 'el primero del orden manda' },
      { id: 'documento', input: 'solo falta el documento', expected: 'indicación concreta' },
    ],
    securityChecklist: COMMON_SECURITY,
  }),
];

export const AI_ENGINEER_PROJECTS_BY_MODULE = AI_ENGINEER_PROJECTS.reduce<
  Partial<Record<number, AIEngineerProject[]>>
>((groups, item) => {
  (groups[item.module] ??= []).push(item);
  return groups;
}, {});
