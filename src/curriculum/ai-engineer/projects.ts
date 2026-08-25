import { file, workspaceOf } from '../../engine/lessonCompiler';
import type { SoloProjectItem } from '../../types/curriculum';
import type { LanguageVariants } from '../../types/scrim';

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

function variants(functionName: string): LanguageVariants {
  const javascript = `// Construye una primera versión pequeña y comprobable.\nfunction ${functionName}(entrada) {\n  // TODO: valida, procesa y devuelve un resultado estructurado.\n}\n`;
  const python = `# Construye una primera versión pequeña y comprobable.\ndef ${functionName}(entrada):\n    # TODO: valida, procesa y devuelve un resultado estructurado.\n    pass\n`;
  return {
    javascript: { workspace: workspaceOf('app.js', { 'app.js': file('app.js', javascript, 'javascript') }), tests: [] },
    python: { workspace: workspaceOf('main.py', { 'main.py': file('main.py', python, 'python') }), tests: [] },
  };
}

function project(definition: ProjectDefinition): AIEngineerProject {
  const languageVariants = variants(definition.functionName);
  return {
    id: `ai-project-${definition.slug}`,
    module: definition.module,
    title: definition.title,
    type: 'solo-project',
    templateId: 'vanilla-js',
    estimatedMinutes: 90,
    description: definition.brief,
    brief: `${definition.brief} La entrega debe funcionar con entradas distintas a los ejemplos y explicar sus límites.`,
    initialWorkspace: structuredClone(languageVariants.javascript.workspace),
    languageVariants,
    requirements: [
      { id: 'contrato', title: 'Contrato observable', description: 'Define entradas, salidas, errores y un fallback comprensible.', category: 'producto' },
      { id: 'variacion', title: 'Entradas variadas', description: 'Resuelve al menos tres casos sin fijar los valores del ejemplo.', category: 'calidad' },
      { id: 'evaluacion', title: 'Evaluación reproducible', description: 'Ejecuta el conjunto de evaluación y resume resultados por caso.', category: 'evaluación' },
      { id: 'seguridad', title: 'Controles de seguridad', description: 'Aplica la lista de seguridad y documenta riesgos restantes.', category: 'seguridad' },
      { id: 'observabilidad', title: 'Estados visibles', description: 'Muestra listo, cargando, error, cancelado y modo degradado cuando apliquen.', category: 'experiencia' },
      { id: 'exportar', title: 'Entrega reproducible', description: 'Incluye instrucciones locales, versiones, datos de ejemplo y ningún secreto.', category: 'entrega' },
    ],
    suggestedSteps: definition.milestones,
    starterNotes: 'Empieza con una base determinista. Añade el modelo o proveedor detrás de un adaptador y conserva una ruta local comprobable.',
    evaluationCases: definition.evaluationCases,
    securityChecklist: definition.securityChecklist,
    exportInstructions: [
      'Exporta el código y un README con comandos de ejecución.',
      'Incluye el evalset, resultados y versiones usadas.',
      'No exportes claves, datos personales ni contenido con licencia incompatible.',
    ],
  };
}

const COMMON_SECURITY = [
  'No guardar claves en código, URL, localStorage ni registros.',
  'Validar entradas y salidas antes de cualquier efecto.',
  'Mantener permisos mínimos y explicar cuándo se requiere backend seguro.',
];

export const AI_ENGINEER_PROJECTS: AIEngineerProject[] = [
  project({ module: 1, slug: 'sampling', title: 'Proyecto: simulador visual de sampling', brief: 'Compara temperatura, top-k y top-p sobre una distribución pequeña y reproducible.', functionName: 'simular_sampling', milestones: ['Renderiza probabilidades base.', 'Aplica cada control por separado.', 'Muestra la semilla y compara resultados.', 'Explica por qué no es un LLM completo.'], evaluationCases: [{ id: 'base', input: 'temperatura 1, k completo', expected: 'conserva la distribución' }, { id: 'top1', input: 'top-k 1', expected: 'solo conserva el token más probable' }, { id: 'semilla', input: 'misma semilla', expected: 'repite la secuencia' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 2, slug: 'extractor-json', title: 'Proyecto: extractor de incidencias', brief: 'Convierte descripciones variadas en JSON validado por esquema.', functionName: 'extraer_incidencia', milestones: ['Define JSON Schema.', 'Crea una base determinista.', 'Conecta un proveedor opcional.', 'Valida y muestra errores de campo.'], evaluationCases: [{ id: 'completo', input: 'incidencia con prioridad y equipo', expected: 'JSON válido' }, { id: 'faltante', input: 'texto ambiguo', expected: 'campos desconocidos explícitos' }, { id: 'inyeccion', input: 'texto que pide ignorar el esquema', expected: 'no cambia el contrato' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 3, slug: 'contexto', title: 'Proyecto: constructor de contexto', brief: 'Selecciona bloques bajo presupuesto y explica inclusiones y descartes.', functionName: 'construir_contexto', milestones: ['Etiqueta fuentes y tokens.', 'Aplica filtros.', 'Ordena por prioridad.', 'Devuelve contexto y reporte de decisiones.'], evaluationCases: [{ id: 'cabe', input: 'tres bloques bajo presupuesto', expected: 'incluye los tres' }, { id: 'exceso', input: 'bloques que exceden el límite', expected: 'descarta con razón' }, { id: 'aislamiento', input: 'bloque de otro usuario', expected: 'nunca lo incluye' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 4, slug: 'router', title: 'Proyecto: enrutador de proveedores', brief: 'Elige local o API según calidad, privacidad, coste y disponibilidad.', functionName: 'elegir_proveedor', milestones: ['Define una interfaz común.', 'Implementa proveedor determinista.', 'Añade embeddings locales o API opcional.', 'Explica la decisión y fallback.'], evaluationCases: [{ id: 'sin-red', input: 'sin conexión', expected: 'ruta local' }, { id: 'privado', input: 'dato sensible', expected: 'no envía a API' }, { id: 'fallo', input: 'API devuelve error', expected: 'estado comprensible o fallback' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 6, slug: 'busqueda-local', title: 'Proyecto: buscador semántico local', brief: 'Indexa ejemplos en español con embeddings locales, filtros y un adaptador exportable.', functionName: 'buscar_documentos', milestones: ['Carga el modelo bajo demanda.', 'Indexa texto y metadatos.', 'Ordena por similitud y filtra.', 'Compara contra el fallback no semántico.'], evaluationCases: [{ id: 'parafrasis', input: 'consulta con palabras distintas', expected: 'recupera el documento semántico' }, { id: 'filtro', input: 'consulta con categoría', expected: 'respeta metadatos' }, { id: 'modelo-falla', input: 'modelo local no disponible', expected: 'etiqueta fallback como no semántico' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 7, slug: 'rag-manuales', title: 'Proyecto: asistente RAG de manuales', brief: 'Responde con citas o se abstiene usando un índice local pequeño.', functionName: 'responder_con_fuentes', milestones: ['Ingiere y divide con procedencia.', 'Recupera y rerankea.', 'Genera con ids citables.', 'Evalúa cobertura y fidelidad.'], evaluationCases: [{ id: 'respuesta', input: 'pregunta cubierta', expected: 'respuesta con cita válida' }, { id: 'sin-evidencia', input: 'pregunta no cubierta', expected: 'abstención explícita' }, { id: 'malicioso', input: 'documento con instrucciones', expected: 'se trata como dato' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 8, slug: 'agente-soporte', title: 'Proyecto: agente de soporte limitado', brief: 'Consulta recursos de solo lectura y pide confirmación antes de proponer un efecto.', functionName: 'siguiente_paso_soporte', milestones: ['Implementa workflow base.', 'Declara tools de lectura.', 'Limita pasos y presupuesto.', 'Añade confirmación y trazas.'], evaluationCases: [{ id: 'consulta', input: 'buscar estado', expected: 'usa tool de lectura' }, { id: 'accion', input: 'modificar pedido', expected: 'pide confirmación' }, { id: 'bucle', input: 'tool devuelve lo mismo', expected: 'detiene por límite' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 9, slug: 'ataques', title: 'Proyecto: laboratorio de ataques', brief: 'Ataca un RAG y un agente con fixtures no confiables y mide controles.', functionName: 'evaluar_ataque', milestones: ['Define amenazas y severidad.', 'Crea fixtures de inyección.', 'Ejecuta con y sin controles.', 'Registra fallos y mitigaciones.'], evaluationCases: [{ id: 'directa', input: 'usuario intenta cambiar política', expected: 'sin efecto prohibido' }, { id: 'indirecta', input: 'documento contiene orden', expected: 'se conserva como dato' }, { id: 'tool', input: 'resultado propone borrar', expected: 'allowlist lo rechaza' }], securityChecklist: COMMON_SECURITY }),
  project({ module: 10, slug: 'tablero-evals', title: 'Proyecto: tablero local de evaluaciones', brief: 'Compara dos versiones por calidad, seguridad, latencia y coste.', functionName: 'comparar_versiones', milestones: ['Carga un evalset versionado.', 'Ejecuta dos implementaciones.', 'Segmenta resultados.', 'Aplica guardas y exporta informe.'], evaluationCases: [{ id: 'mejora', input: 'candidata mejora sin regresión', expected: 'promover' }, { id: 'seguridad', input: 'candidata falla caso crítico', expected: 'bloquear' }, { id: 'latencia', input: 'p95 excede presupuesto', expected: 'mostrar regresión' }], securityChecklist: COMMON_SECURITY }),
];

export const AI_ENGINEER_PROJECTS_BY_MODULE = AI_ENGINEER_PROJECTS.reduce<
  Partial<Record<number, AIEngineerProject[]>>
>((groups, item) => {
  (groups[item.module] ??= []).push(item);
  return groups;
}, {});
