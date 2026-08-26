export interface RoadmapCoverageTopic {
  id: string;
  label: string;
  aliases: string[];
  area: string;
}

// Matriz de cobertura del curso AI Engineer reorganizado.
// Cada alias aparece literalmente en el material de alguna clase
// (normalmente como concepto enseñado), y el área corresponde a una fase.
export const AI_ENGINEER_ROADMAP_TOPICS: RoadmapCoverageTopic[] = [
  { id: 'tutorlocal', label: 'El TutorLocal: un chat que crece contigo', aliases: ['TutorLocal'], area: 'producto' },
  { id: 'entrada-salida', label: 'Entradas, procesos y salidas', aliases: ['Entrada', 'Proceso', 'Salida'], area: 'fase-1-fundamentos' },
  { id: 'algoritmos-estados', label: 'Algoritmos y estados', aliases: ['Algoritmo', 'Estado'], area: 'fase-1-fundamentos' },
  { id: 'datos-historial', label: 'Datos e inmutabilidad', aliases: ['Estructura de datos', 'Inmutabilidad'], area: 'fase-1-fundamentos' },
  { id: 'modelo-inferencia', label: 'Modelo e inferencia', aliases: ['Modelo', 'Inferencia', 'Puntuación'], area: 'fase-1-fundamentos' },
  { id: 'roles', label: 'Mensajes y roles', aliases: ['Mensaje', 'Rol'], area: 'fase-2-conversacion' },
  { id: 'contexto-presupuesto', label: 'Contexto y presupuesto', aliases: ['Contexto', 'Presupuesto'], area: 'fase-2-conversacion' },
  { id: 'instruccion-sistema', label: 'Instrucción del sistema', aliases: ['Instrucción del sistema', 'Valor por defecto'], area: 'fase-2-conversacion' },
  { id: 'restricciones', label: 'Restricciones comprobables', aliases: ['Restricción', 'Validación de salida'], area: 'fase-2-conversacion' },
  { id: 'parametros', label: 'Temperatura y top-p', aliases: ['Temperatura', 'Top-p'], area: 'fase-2-conversacion' },
  { id: 'streaming', label: 'Streaming por partes', aliases: ['Streaming', 'Fragmento'], area: 'fase-2-conversacion' },
  { id: 'salidas-json', label: 'Salidas estructuradas en JSON', aliases: ['Salida estructurada', 'JSON', 'Validador'], area: 'fase-2-conversacion' },
  { id: 'payload', label: 'El paquete de conversación', aliases: ['Payload', 'Turno'], area: 'fase-2-conversacion' },
  { id: 'webgpu-workers', label: 'WebGPU y Workers', aliases: ['WebGPU', 'Web Worker', 'Inferencia local'], area: 'fase-3-modelo-local' },
  { id: 'descarga-cache', label: 'Descarga, caché y progreso', aliases: ['Caché del navegador', 'Progreso'], area: 'fase-3-modelo-local' },
  { id: 'cuantizacion', label: 'Cuantización y requisitos de memoria', aliases: ['Cuantización', 'Requisito de memoria'], area: 'fase-3-modelo-local' },
  { id: 'webllm', label: 'WebLLM y adaptadores', aliases: ['WebLLM', 'Adaptador'], area: 'fase-3-modelo-local' },
  { id: 'embeddings', label: 'Qué es un embedding', aliases: ['Embedding', 'Dimensión'], area: 'fase-4-busqueda' },
  { id: 'transformers-js', label: 'Transformers.js y normalización', aliases: ['Transformers.js', 'Normalización'], area: 'fase-4-busqueda' },
  { id: 'similitud', label: 'Producto punto y similitud coseno', aliases: ['Producto punto', 'Similitud coseno'], area: 'fase-4-busqueda' },
  { id: 'busqueda-top-k', label: 'Búsqueda semántica top-k', aliases: ['Búsqueda semántica', 'Top-k'], area: 'fase-4-busqueda' },
  { id: 'carga-documentos', label: 'Carga segura de documentos', aliases: ['Carga local', 'Validación de archivo'], area: 'fase-5-rag' },
  { id: 'chunking', label: 'Chunking configurable', aliases: ['Solapamiento', 'Chunking'], area: 'fase-5-rag' },
  { id: 'identificadores', label: 'Fragmentos con identidad', aliases: ['Identificador estable', 'Procedencia'], area: 'fase-5-rag' },
  { id: 'recuperacion', label: 'Recuperación con umbral', aliases: ['Umbral', 'Ranking filtrado'], area: 'fase-5-rag' },
  { id: 'presupuesto-contexto', label: 'Presupuesto de contexto RAG', aliases: ['Presupuesto de tokens', 'Selección acumulativa'], area: 'fase-5-rag' },
  { id: 'modo-rag', label: 'RAG frente a modo directo', aliases: ['RAG', 'Modo directo'], area: 'fase-5-rag' },
  { id: 'citas', label: 'Citas verificables', aliases: ['Cita', 'Cita inventada'], area: 'fase-5-rag' },
  { id: 'abstencion', label: 'Abstención sin evidencia', aliases: ['Abstención', 'Umbral de respuesta'], area: 'fase-5-rag' },
  { id: 'memoria', label: 'Memoria de conversación', aliases: ['Memoria', 'Actualización inmutable'], area: 'fase-6-confiable' },
  { id: 'herramientas', label: 'Herramientas declaradas', aliases: ['Herramienta', 'Lista cerrada'], area: 'fase-6-confiable' },
  { id: 'confirmacion', label: 'Confirmación humana', aliases: ['Efecto secundario', 'Confirmación'], area: 'fase-6-confiable' },
  { id: 'inyeccion', label: 'Inyección de prompts', aliases: ['Prompt injection', 'Inyección indirecta'], area: 'fase-6-confiable' },
  { id: 'evaluacion', label: 'Evaluar respuestas', aliases: ['Precisión', 'Caso de evaluación'], area: 'fase-6-confiable' },
  { id: 'observabilidad', label: 'Observabilidad y latencia', aliases: ['Evento', 'Latencia'], area: 'fase-6-confiable' },
  { id: 'cache-rendimiento', label: 'Caché de prompt y rendimiento', aliases: ['Caché de prompt', 'Tokens facturables'], area: 'fase-6-confiable' },
  { id: 'arquitectura', label: 'Pipeline y enrutador', aliases: ['Pipeline', 'Enrutador'], area: 'fase-7-final' },
  { id: 'conjunto-prueba', label: 'Medir calidad propia', aliases: ['Conjunto de prueba', 'Tasa de éxito'], area: 'fase-7-final' },
  { id: 'sin-evidencia', label: 'Respuestas sin evidencia', aliases: ['Respuesta sin evidencia', 'Revisión'], area: 'fase-7-final' },
  { id: 'entrega', label: 'Entrega reproducible', aliases: ['Entrega reproducible', 'Model card del sistema'], area: 'fase-7-final' },
];
