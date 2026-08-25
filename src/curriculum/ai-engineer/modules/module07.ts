import { authoredLesson, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_07 = [
  authoredLesson({
    number: 37, module: 7, title: 'Qué es RAG y cuándo usarlo', summary: 'Decide cuándo recuperar evidencia externa antes de generar.',
    concepts: [['RAG', 'Generación aumentada con recuperación de fuentes externas.'], ['Retriever', 'Componente que busca fragmentos pertinentes.']], requires: ['elegir-base-vectorial'], skill: 'entender-rag',
    mentalModel: 'RAG prepara un libro abierto para cada pregunta; el modelo sigue siendo quien redacta y puede equivocarse.',
    script: ['RAG añade una etapa de recuperación antes de generar. Sirve cuando la respuesta necesita conocimiento privado, reciente o citable.', 'El flujo busca fragmentos, los filtra, construye contexto y pide una respuesta vinculada a esas fuentes.', 'El ejemplo decide usar RAG cuando se requieren datos externos o citas.', 'Completa la decisión. Una conversación creativa sin evidencia puede usar generación directa.'],
    javascript: { example: `function usar_rag(datos_externos, necesita_citas) {
  return datos_externos || necesita_citas;
}
console.log(usar_rag(true, false));`, starter: `function usar_rag(datos_externos, necesita_citas) {
  // Cualquiera de las dos señales activa RAG.
}`, solution: `function usar_rag(datos_externos, necesita_citas) {
  return datos_externos || necesita_citas;
}`, debugStarter: `function usar_rag(datos_externos, necesita_citas) {
  return datos_externos && necesita_citas;
}` },
    python: { example: `def usar_rag(datos_externos, necesita_citas):
    return datos_externos or necesita_citas

print(usar_rag(True, False))`, starter: `def usar_rag(datos_externos, necesita_citas):
    # Cualquiera de las dos señales activa RAG.
    pass`, solution: `def usar_rag(datos_externos, necesita_citas):
    return datos_externos or necesita_citas`, debugStarter: `def usar_rag(datos_externos, necesita_citas):
    return datos_externos and necesita_citas` },
    practice: { title: 'Reconoce un caso RAG', instructions: 'Implementa usar_rag. Datos externos o citas bastan por separado.', functionName: 'usar_rag', cases: [{ args: [true, false], expected: true, description: 'Recupera conocimiento externo aunque no se pidan citas' }, { args: [false, true], expected: true, description: 'Recupera fuentes cuando deben citarse' }, { args: [false, false], expected: false, description: 'Evita complejidad en generación libre' }], hints: ['Combina con o.', 'Prueba cada señal aislada.', 'Devuelve booleano.'] },
    reading: { core: 'RAG combina una memoria paramétrica, los pesos del modelo, con memoria no paramétrica recuperada durante la consulta. La aplicación controla corpus, permisos y actualización.', mechanics: 'Consulta, embedding, búsqueda, filtros, reranking, selección de contexto, generación y citas forman etapas observables. Cada una puede medirse por separado.', decisions: 'Úsalo para manuales, políticas y contenido cambiante. No lo añadas si la tarea no necesita fuentes o una regla resuelve mejor.', errors: 'RAG no garantiza verdad. Un retriever puede omitir el fragmento y el generador puede ignorarlo. También puede recuperar instrucciones maliciosas.', keyPoints: ['RAG cambia contexto, no pesos.', 'La recuperación se evalúa separada de la generación.', 'Las fuentes conservan permisos y proveniencia.'], question: '¿RAG es una base vectorial?', answer: 'No. Una base vectorial puede implementar recuperación, pero RAG incluye ingesta, selección, generación, citas y evaluación.', transfer: 'Elige una función de tu producto que sí necesita RAG y otra que no. Justifica ambas.', sources: ['rag-paper', 'qdrant-vector-search'] },
    reasoning: { activity: flowActivity('Conecta el recorrido RAG.', [['pregunta', 'Pregunta', 'start'], ['buscar', 'Recuperar', 'process'], ['filtrar', 'Filtrar y rerankear', 'process'], ['contexto', 'Construir contexto', 'process'], ['generar', 'Generar con citas', 'process'], ['fin', 'Respuesta o abstención', 'end']], [['pregunta', 'buscar'], ['buscar', 'filtrar'], ['filtrar', 'contexto'], ['contexto', 'generar'], ['generar', 'fin']]), explanation: 'La respuesta llega después de recuperar y seleccionar. La abstención es válida si no hay evidencia.', hints: ['Buscar ocurre antes de generar.', 'Las citas nacen de fragmentos seleccionados.'] },
    debug: { title: 'RAG exige dos razones', expected: 'Una sola señal basta.', observed: 'La función usa y.', hints: ['Prueba true, false.', 'and es restrictivo.', 'Usa or.'] },
  }),
  authoredLesson({
    number: 38, module: 7, title: 'RAG frente a fine-tuning', summary: 'Elige entre contexto actualizable y cambio de conducta del modelo.',
    concepts: [['Conocimiento externo', 'Hechos que se recuperan y actualizan sin cambiar pesos.'], ['Ajuste de conducta', 'Cambio aprendido mediante fine-tuning y datos de entrenamiento.']], requires: ['entender-rag'], skill: 'elegir-rag-finetuning',
    mentalModel: 'RAG pone notas sobre la mesa; fine-tuning cambia hábitos aprendidos.',
    script: ['RAG y fine-tuning resuelven problemas distintos. RAG aporta hechos recuperables; el ajuste cambia conducta o formato.', 'Una política semanal pertenece a un corpus. Un estilo estable con muchos ejemplos puede justificar ajuste después de medir prompting.', 'La función elige RAG para hechos cambiantes y fine_tuning para conducta estable.', 'Completa los caminos y conserva prompting cuando ninguna necesidad justifica otra técnica.'],
    javascript: { example: `function estrategia_modelo(hechos_cambiantes, conducta_estable) {
  if (hechos_cambiantes) return 'rag';
  return conducta_estable ? 'fine_tuning' : 'prompting';
}`, starter: `function estrategia_modelo(hechos_cambiantes, conducta_estable) {
  // rag, fine_tuning o prompting.
}`, solution: `function estrategia_modelo(hechos_cambiantes, conducta_estable) {
  if (hechos_cambiantes) return 'rag';
  return conducta_estable ? 'fine_tuning' : 'prompting';
}`, debugStarter: `function estrategia_modelo(hechos_cambiantes, conducta_estable) {
  return conducta_estable ? 'rag' : 'fine_tuning';
}` },
    python: { example: `def estrategia_modelo(hechos_cambiantes, conducta_estable):
    if hechos_cambiantes:
        return "rag"
    return "fine_tuning" if conducta_estable else "prompting"`, starter: `def estrategia_modelo(hechos_cambiantes, conducta_estable):
    # rag, fine_tuning o prompting.
    pass`, solution: `def estrategia_modelo(hechos_cambiantes, conducta_estable):
    if hechos_cambiantes:
        return "rag"
    return "fine_tuning" if conducta_estable else "prompting"`, debugStarter: `def estrategia_modelo(hechos_cambiantes, conducta_estable):
    return "rag" if conducta_estable else "fine_tuning"` },
    practice: { title: 'Elige la intervención', instructions: 'Implementa estrategia_modelo con prioridad para hechos cambiantes.', functionName: 'estrategia_modelo', cases: [{ args: [true, false], expected: 'rag', description: 'Recupera conocimiento actualizable' }, { args: [false, true], expected: 'fine_tuning', description: 'Considera ajuste para conducta estable' }, { args: [false, false], expected: 'prompting', description: 'Empieza por la opción más simple' }], hints: ['Los hechos cambiantes se evalúan primero.', 'Conducta estable no significa hechos nuevos.', 'Añade un fallback prompting.'] },
    reading: { core: 'RAG inserta evidencia en inferencia. Fine-tuning modifica pesos con ejemplos. Prompting modifica instrucciones. Las tres técnicas pueden combinarse, pero cada una tiene coste y ciclo de actualización diferente.', mechanics: 'Actualizar RAG reingesta documentos. Actualizar fine-tuning prepara datos, entrena y evalúa una nueva versión. Prompting cambia una plantilla y vuelve a ejecutar casos.', decisions: 'Empieza por prompting, añade RAG para conocimiento y considera fine-tuning si persiste un patrón de conducta medible con datos suficientes.', errors: 'Usar fine-tuning como almacén de hechos dificulta citas y actualización. Usar RAG para enseñar un formato muy estable puede añadir ruido innecesario.', keyPoints: ['Hechos actualizables favorecen RAG.', 'Conducta repetible puede favorecer ajuste.', 'Mide una base antes de combinar.'], question: '¿Fine-tuning elimina la necesidad de prompts?', answer: 'No. Todavía defines tarea, entradas, límites y contexto. El ajuste cambia predisposición, no el contrato completo.', transfer: 'Clasifica tres fallos reales como prompt, conocimiento o conducta.', sources: ['rag-paper', 'hf-llm-course'] },
    reasoning: { activity: decisionActivity('Elige la técnica primaria.', [['politica', 'Política que cambia cada semana', ['rag', 'fine_tuning'], 'rag'], ['estilo', 'Formato estable con miles de ejemplos', ['rag', 'fine_tuning'], 'fine_tuning']]), explanation: 'La actualización de hechos y la modificación de conducta tienen pipelines distintos.', hints: ['Pregunta cómo se actualiza.', 'Las citas favorecen recuperación.'] },
    debug: { title: 'Las técnicas están invertidas', expected: 'Hechos usan RAG y conducta puede usar ajuste.', observed: 'La función asigna lo contrario.', hints: ['Prueba true, false.', 'Piensa qué cambia sin entrenar.', 'Añade prompting como fallback.'] },
  }),
  authoredLesson({
    number: 39, module: 7, title: 'Cargar, limpiar y dividir documentos', summary: 'Produce chunks trazables sin destruir estructura ni mezclar documentos.',
    concepts: [['Chunk', 'Fragmento indexable con contexto y metadatos.'], ['Solapamiento', 'Contenido repetido entre chunks para preservar continuidad.'], ['Parser', 'Componente que extrae estructura de un formato.']], requires: ['elegir-rag-finetuning'], skill: 'preparar-documentos-rag',
    mentalModel: 'El chunk es una ventana con dirección de regreso al documento original.',
    script: ['La calidad de RAG empieza antes de los embeddings. Un parser conserva títulos, listas y páginas; la limpieza elimina ruido sin borrar significado.', 'El tamaño del chunk equilibra contexto y precisión. El solapamiento ayuda en fronteras, pero también duplica resultados.', 'El ejemplo divide una lista de palabras en grupos de tamaño fijo.', 'Completa la división para tamaños distintos y conserva el último grupo incompleto.'],
    javascript: { example: `function dividir(items, tamano) {
  const partes = [];
  for (let i = 0; i < items.length; i += tamano) partes.push(items.slice(i, i + tamano));
  return partes;
}`, starter: `function dividir(items, tamano) {
  // Agrupa sin perder el último fragmento.
}`, solution: `function dividir(items, tamano) {
  const partes = [];
  for (let i = 0; i < items.length; i += tamano) partes.push(items.slice(i, i + tamano));
  return partes;
}`, debugStarter: `function dividir(items, tamano) {
  return [items.slice(0, tamano)];
}` },
    python: { example: `def dividir(items, tamano):
    return [items[i:i + tamano] for i in range(0, len(items), tamano)]`, starter: `def dividir(items, tamano):
    # Agrupa sin perder el último fragmento.
    pass`, solution: `def dividir(items, tamano):
    return [items[i:i + tamano] for i in range(0, len(items), tamano)]`, debugStarter: `def dividir(items, tamano):
    return [items[:tamano]]` },
    practice: { title: 'Divide sin perder contenido', instructions: 'Implementa dividir(items, tamano) y devuelve una lista de grupos.', functionName: 'dividir', cases: [{ args: [[1, 2, 3, 4, 5], 2], expected: [[1, 2], [3, 4], [5]], description: 'Conserva el último grupo incompleto' }, { args: [['a', 'b'], 5], expected: [['a', 'b']], description: 'Maneja un tamaño mayor que el documento' }], hints: ['Avanza de tamano en tamano.', 'Corta desde i hasta i más tamano.', 'Acumula todos los grupos.'] },
    reading: { core: 'La ingesta detecta formato, extrae estructura, normaliza texto, divide y adjunta metadatos. El documento original se conserva para citar y reingestar.', mechanics: 'Los chunks pueden seguir párrafos, títulos o ventanas de tokens. Cada uno guarda document_id, chunk_id, posición, sección, fecha y checksum.', decisions: 'Empieza con fronteras estructurales. Ajusta tamaño y solapamiento con consultas del dominio. Tablas y código necesitan estrategias propias.', errors: 'Partir por caracteres rompe tokens y estructura. Limpiar demasiado borra negaciones. Solapamiento alto duplica evidencia y sesga ranking.', keyPoints: ['Conserva estructura y proveniencia.', 'El tamaño se evalúa con consultas.', 'La ingesta debe ser idempotente.'], question: '¿Existe un tamaño de chunk universal?', answer: 'No. Depende de documento, modelo, consulta y tarea. Usa un valor inicial y compáralo con casos reales.', transfer: 'Propón reglas de chunking para un manual con títulos, pasos y tablas.', sources: ['rag-paper', 'qdrant-vector-search'] },
    reasoning: { activity: sequenceActivity('Ordena la ingesta de un PDF.', [['extraer', 'Extraer texto y estructura'], ['limpiar', 'Limpiar ruido'], ['dividir', 'Dividir por fronteras'], ['meta', 'Añadir metadatos'], ['guardar', 'Conservar original y chunks']]), explanation: 'Los metadatos nacen de la estructura extraída y acompañan cada fragmento.', hints: ['No generes embeddings antes de dividir.', 'El original no se destruye.'] },
    debug: { title: 'Solo existe el primer chunk', expected: 'Todos los grupos aparecen.', observed: 'La función corta una vez.', hints: ['Usa cinco elementos.', 'Necesitas repetición.', 'Avanza el índice por tamano.'] },
  }),
  authoredLesson({
    number: 40, module: 7, title: 'Embedding e indexación', summary: 'Versiona vectores y actualiza puntos de forma idempotente.',
    concepts: [['Idempotencia', 'Repetir una operación produce el mismo estado final.'], ['Versión de embedding', 'Modelo, revisión y preprocesamiento usados.']], requires: ['preparar-documentos-rag'], skill: 'indexar-pipeline-rag',
    mentalModel: 'Cada chunk y versión de modelo determinan un punto reproducible.',
    script: ['Después de dividir, el pipeline genera embeddings por lote y hace upsert con ids estables.', 'La versión del modelo viaja en metadatos. Cambiarla crea una reindexación controlada, no una mezcla silenciosa.', 'El ejemplo crea un id de punto a partir de documento y posición.', 'Completa el id sin valores fijos. Dos chunks del mismo documento deben ser distintos.'],
    javascript: { example: `function id_chunk(documento, posicion) {
  return documento + ':' + posicion;
}`, starter: `function id_chunk(documento, posicion) {
  // Une documento y posición con dos puntos.
}`, solution: `function id_chunk(documento, posicion) {
  return documento + ':' + posicion;
}`, debugStarter: `function id_chunk(documento, posicion) {
  return documento;
}` },
    python: { example: `def id_chunk(documento, posicion):
    return f"{documento}:{posicion}"`, starter: `def id_chunk(documento, posicion):
    # Une documento y posición con dos puntos.
    pass`, solution: `def id_chunk(documento, posicion):
    return f"{documento}:{posicion}"`, debugStarter: `def id_chunk(documento, posicion):
    return documento` },
    practice: { title: 'Crea ids estables', instructions: 'Implementa id_chunk(documento, posicion) con formato documento:posicion.', functionName: 'id_chunk', cases: [{ args: ['manual', 0], expected: 'manual:0', description: 'Identifica el primer chunk' }, { args: ['manual', 3], expected: 'manual:3', description: 'Distingue otra posición del mismo documento' }], hints: ['Usa ambos parámetros.', 'Convierte posición a texto al interpolar.', 'Separa con dos puntos.'] },
    reading: { core: 'La indexación genera vectores en lotes, valida dimensión y hace upsert. El id estable evita duplicados. Un manifiesto registra documentos, checksums y versión.', mechanics: 'Solo los chunks nuevos o modificados se recalculan. Los eliminados se borran. Una nueva versión de embedding usa otra colección o namespace hasta completar migración.', decisions: 'Controla tamaño de lote por memoria. Reintenta operaciones idempotentes. Verifica conteos y muestras antes de activar un índice nuevo.', errors: 'Mezclar versiones rompe similitud. Reintentar inserts con ids aleatorios duplica puntos. Activar un índice incompleto produce huecos silenciosos.', keyPoints: ['Ids estables permiten upsert.', 'La versión nunca se mezcla.', 'La activación ocurre después de verificar.'], question: '¿Debo reindexar si solo cambia un metadato?', answer: 'No necesariamente el vector. Puedes actualizar payload, pero si el texto que representa cambia, recalcula embedding y checksum.', transfer: 'Diseña un manifiesto de ingesta con estado pendiente, activo y fallido.', sources: ['qdrant-vector-search', 'transformers-js'] },
    reasoning: { activity: sequenceActivity('Ordena una actualización idempotente.', [['checksum', 'Comparar checksum'], ['cambiar', 'Detectar chunks cambiados'], ['embed', 'Generar lote'], ['upsert', 'Upsert por id estable'], ['verificar', 'Verificar y activar']]), explanation: 'El checksum evita trabajo; el id estable evita duplicados.', hints: ['Detecta cambios antes de inferir.', 'Activa después de verificar.'] },
    debug: { title: 'Todos los chunks comparten id', expected: 'La posición forma parte del id.', observed: 'Solo se devuelve documento.', hints: ['Crea dos posiciones.', 'Falta usar posicion.', 'Incluye separador.'] },
  }),
  authoredLesson({
    number: 41, module: 7, title: 'Recuperación, filtros y reranking', summary: 'Aumenta cobertura con candidatos y mejora orden con una segunda señal.',
    concepts: [['Candidate retrieval', 'Búsqueda rápida que prioriza cobertura.'], ['Reranker', 'Modelo o regla más costosa que reordena pocos candidatos.']], requires: ['indexar-pipeline-rag'], skill: 'recuperar-rerankear',
    mentalModel: 'El retriever abre la red; el reranker mira de cerca; el selector decide qué cabe.',
    script: ['La primera búsqueda usa top-k relativamente amplio para no perder evidencia. Los filtros eliminan lo no autorizado.', 'Un reranker lee consulta y candidato juntos y mejora el orden sobre un conjunto pequeño.', 'El ejemplo suma relevancia y vigencia para ordenar ids.', 'Completa el reranking sin usar solo una señal.'],
    javascript: { example: `function rerankear(items) {
  return [...items].sort((a, b) => (b.relevancia + b.vigencia) - (a.relevancia + a.vigencia)).map(x => x.id);
}`, starter: `function rerankear(items) {
  // Ordena por relevancia más vigencia.
}`, solution: `function rerankear(items) {
  return [...items].sort((a, b) => (b.relevancia + b.vigencia) - (a.relevancia + a.vigencia)).map(x => x.id);
}`, debugStarter: `function rerankear(items) {
  return [...items].sort((a, b) => b.relevancia - a.relevancia).map(x => x.id);
}` },
    python: { example: `def rerankear(items):
    return [x["id"] for x in sorted(items, key=lambda x: x["relevancia"] + x["vigencia"], reverse=True)]`, starter: `def rerankear(items):
    # Ordena por relevancia más vigencia.
    pass`, solution: `def rerankear(items):
    return [x["id"] for x in sorted(items, key=lambda x: x["relevancia"] + x["vigencia"], reverse=True)]`, debugStarter: `def rerankear(items):
    return [x["id"] for x in sorted(items, key=lambda x: x["relevancia"], reverse=True)]` },
    practice: { title: 'Reordena candidatos', instructions: 'Implementa rerankear(items) sumando relevancia y vigencia.', functionName: 'rerankear', cases: [{ args: [[{ id: 'viejo', relevancia: 0.9, vigencia: 0 }, { id: 'nuevo', relevancia: 0.7, vigencia: 0.4 }]], expected: ['nuevo', 'viejo'], description: 'La vigencia puede cambiar el orden' }, { args: [[{ id: 'a', relevancia: 0.2, vigencia: 0.1 }, { id: 'b', relevancia: 0.5, vigencia: 0.1 }]], expected: ['b', 'a'], description: 'Conserva relevancia cuando vigencia empata' }], hints: ['Calcula un total por item.', 'Orden descendente.', 'Extrae ids al final.'] },
    reading: { core: 'El retriever rápido busca muchos candidatos. Los filtros protegen alcance. El reranker aplica una señal más precisa o reglas del dominio. El selector corta al presupuesto.', mechanics: 'Guarda score inicial, score rerank y razones. Compara recall antes del rerank y precisión después. La latencia extra se mide por consulta.', decisions: 'Añade reranking si los documentos pertinentes aparecen pero en mal orden. Si no aparecen, mejora ingesta, embeddings, filtros o k.', errors: 'Rerankear no recupera un documento ausente. Aplicar filtros después puede exponer datos. Un reranker grande puede dominar latencia.', keyPoints: ['Diagnostica cobertura antes de orden.', 'Filtros protegen antes de entregar.', 'Conserva ambos scores.'], question: '¿Cuántos candidatos rerankear?', answer: 'Los suficientes para cubrir relevantes sin exceder latencia. Elige con recall y perfiles de tiempo.', transfer: 'Describe un fallo de recuperación y uno de reranking con la misma consulta.', sources: ['qdrant-vector-search', 'qdrant-filtering', 'ragas-metrics'] },
    reasoning: { activity: sequenceActivity('Ordena recuperación y reranking.', [['buscar', 'Recuperar candidatos'], ['filtrar', 'Aplicar permisos'], ['rerank', 'Reordenar pocos'], ['presupuesto', 'Cortar al presupuesto'], ['traza', 'Conservar scores']]), explanation: 'El reranker solo ve candidatos permitidos y no puede inventar ausentes.', hints: ['Primero necesitas candidatos.', 'El presupuesto se aplica al orden final.'] },
    debug: { title: 'La vigencia no participa', expected: 'La suma de señales define el orden.', observed: 'Solo relevancia ordena.', hints: ['Usa un documento viejo muy relevante.', 'Falta vigencia.', 'Suma ambas en el comparador.'] },
  }),
  authoredLesson({
    number: 42, module: 7, title: 'Generación con contexto y citas', summary: 'Vincula afirmaciones con ids recuperados y se abstiene cuando falta evidencia.',
    concepts: [['Cita', 'Referencia verificable a la fuente de una afirmación.'], ['Abstención', 'Respuesta explícita de insuficiencia de evidencia.']], requires: ['recuperar-rerankear'], skill: 'generar-con-citas',
    mentalModel: 'Una cita es un enlace comprobable entre frase y fragmento, no decoración al final.',
    script: ['El generador recibe fragmentos con ids. La instrucción limita la respuesta a evidencia y permite decir no encontrado.', 'Después el programa comprueba que cada cita exista entre los fragmentos enviados.', 'El ejemplo crea una respuesta solo si hay fuentes; de lo contrario se abstiene.', 'Completa el objeto con texto y fuentes reales.'],
    javascript: { example: `function respuesta_citable(texto, fuentes) {
  return fuentes.length === 0 ? { texto: 'sin evidencia', fuentes: [] } : { texto, fuentes };
}`, starter: `function respuesta_citable(texto, fuentes) {
  // Sin fuentes se abstiene; con fuentes conserva datos.
}`, solution: `function respuesta_citable(texto, fuentes) {
  return fuentes.length === 0 ? { texto: 'sin evidencia', fuentes: [] } : { texto, fuentes };
}`, debugStarter: `function respuesta_citable(texto, fuentes) {
  return { texto, fuentes: ['inventada'] };
}` },
    python: { example: `def respuesta_citable(texto, fuentes):
    return {"texto": "sin evidencia", "fuentes": []} if not fuentes else {"texto": texto, "fuentes": fuentes}`, starter: `def respuesta_citable(texto, fuentes):
    # Sin fuentes se abstiene; con fuentes conserva datos.
    pass`, solution: `def respuesta_citable(texto, fuentes):
    return {"texto": "sin evidencia", "fuentes": []} if not fuentes else {"texto": texto, "fuentes": fuentes}`, debugStarter: `def respuesta_citable(texto, fuentes):
    return {"texto": texto, "fuentes": ["inventada"]}` },
    practice: { title: 'Entrega evidencia o abstente', instructions: 'Implementa respuesta_citable. Nunca inventes una fuente.', functionName: 'respuesta_citable', cases: [{ args: ['La política cambió', ['doc-2']], expected: { texto: 'La política cambió', fuentes: ['doc-2'] }, description: 'Conserva texto y fuente recuperada' }, { args: ['suposición', []], expected: { texto: 'sin evidencia', fuentes: [] }, description: 'Se abstiene sin documentos' }], hints: ['Comprueba longitud de fuentes.', 'No añadas ids nuevos.', 'El caso vacío tiene texto fijo sin evidencia.'] },
    reading: { core: 'Una respuesta citable conserva ids de fragmentos y permite abrir la fuente. La cita se valida contra el conjunto realmente enviado al modelo.', mechanics: 'El modelo devuelve afirmaciones con ids o una estructura equivalente. El programa rechaza ids desconocidos, comprueba cobertura y renderiza enlaces con título y sección.', decisions: 'Permite abstención cuando ninguna fuente supera el umbral. Distingue una cita que respalda de una fuente solo relacionada.', errors: 'Inventar urls o citar el primer documento recuperado produce falsa confianza. Una cita correcta no garantiza que la afirmación interprete bien la fuente.', keyPoints: ['Los ids válidos vienen del contexto.', 'La abstención es parte del contrato.', 'La cobertura de citas se evalúa.'], question: '¿Debo citar cada oración?', answer: 'Cita afirmaciones verificables según el producto. Texto de enlace o transición puede no necesitar cita, pero los hechos importantes sí.', transfer: 'Escribe una respuesta de dos afirmaciones y asigna una fuente a cada una o marca falta de evidencia.', sources: ['rag-paper', 'ragas-metrics'] },
    reasoning: { activity: decisionActivity('Decide la salida.', [['fuente', 'Hay un fragmento que respalda la respuesta', ['responder con cita', 'inventar'], 'responder con cita'], ['vacio', 'No hay evidencia recuperada', ['abstenerse', 'adivinar'], 'abstenerse']]), explanation: 'La aplicación no obliga al modelo a llenar silencios con plausibilidad.', hints: ['Sin evidencia hay una salida explícita.', 'La cita debe existir en el contexto.'] },
    debug: { title: 'La cita es inventada', expected: 'Se conservan fuentes recibidas o ninguna.', observed: 'Siempre aparece inventada.', hints: ['Prueba doc-2.', 'No crees ids.', 'Devuelve el parámetro fuentes.'] },
  }),
  authoredLesson({
    number: 43, module: 7, title: 'Evaluar y depurar un sistema RAG', summary: 'Aísla fallos de ingesta, recuperación y generación con métricas y trazas.',
    concepts: [['Faithfulness', 'Grado en que una respuesta se apoya en el contexto.'], ['Context recall', 'Cobertura de evidencia relevante en lo recuperado.'], ['Golden set', 'Conjunto estable de consultas, fuentes y respuestas esperadas.']], requires: ['generar-con-citas'], skill: 'evaluar-rag',
    mentalModel: 'Si la respuesta falla, pregunta primero si la evidencia llegó al contexto antes de culpar al generador.',
    script: ['Un resultado incorrecto puede nacer en parser, chunks, embeddings, filtros, ranking, presupuesto o generación.', 'La traza conserva candidatos, scores, descartes, contexto final, respuesta y citas.', 'El ejemplo calcula precisión de citas válidas sobre citas producidas.', 'Completa la métrica y protege el caso sin citas.'],
    javascript: { example: `function precision_citas(validas, total) {
  return total === 0 ? 0 : validas / total;
}`, starter: `function precision_citas(validas, total) {
  // Devuelve cero si total es cero.
}`, solution: `function precision_citas(validas, total) {
  return total === 0 ? 0 : validas / total;
}`, debugStarter: `function precision_citas(validas, total) {
  return validas / 100;
}` },
    python: { example: `def precision_citas(validas, total):
    return 0 if total == 0 else validas / total`, starter: `def precision_citas(validas, total):
    # Devuelve cero si total es cero.
    pass`, solution: `def precision_citas(validas, total):
    return 0 if total == 0 else validas / total`, debugStarter: `def precision_citas(validas, total):
    return validas / 100` },
    practice: { title: 'Mide citas', instructions: 'Implementa precision_citas(validas, total). Usa el total observado.', functionName: 'precision_citas', cases: [{ args: [3, 4], expected: 0.75, description: 'Mide tres citas válidas de cuatro' }, { args: [0, 0], expected: 0, description: 'No divide por cero' }], hints: ['El denominador es total.', 'Añade el caso cero.', 'Devuelve proporción numérica.'] },
    reading: { core: 'Evalúa recuperación y generación por separado. Un golden set incluye consulta, ids relevantes, respuesta esperada, hechos y condiciones de abstención.', mechanics: 'Mide recall@k, precisión, MRR o nDCG para ranking; faithfulness, corrección y cobertura de citas para generación. Revisa también latencia y coste.', decisions: 'Empieza con métricas deterministas y revisión humana. Usa un modelo juez solo con rúbrica, ejemplos y calibración contra personas.', errors: 'Una métrica agregada oculta categorías. Cambiar corpus y prompts al mismo tiempo impide atribuir. Evaluar solo respuestas sin traza no localiza la etapa fallida.', keyPoints: ['Separa recuperación y generación.', 'Conserva trazas reproducibles.', 'Segmenta métricas por tipo de consulta.'], question: '¿Ragas o DeepEval sustituyen mi conjunto de casos?', answer: 'No. Proveen métricas y herramientas. Tú defines casos, fuentes, criterios y revisión adecuados al producto.', transfer: 'Toma una respuesta fallida y escribe una prueba para cada etapa que podría haberla causado.', sources: ['ragas-metrics', 'deepeval-evaluation', 'rag-paper'] },
    reasoning: { activity: sequenceActivity('Depura una respuesta sin cita.', [['fuente', '¿Existe evidencia en el corpus?'], ['recupero', '¿Aparece en candidatos?'], ['contexto', '¿Entró al contexto final?'], ['genero', '¿La respuesta la usó?'], ['cito', '¿La cita es válida?']]), explanation: 'El recorrido encuentra la primera etapa donde se pierde evidencia.', hints: ['Empieza por la fuente.', 'No ajustes el prompt si el fragmento nunca llegó.'] },
    debug: { title: 'La métrica supone cien citas', expected: 'El total real define el denominador.', observed: 'Siempre divide por cien.', hints: ['Prueba tres de cuatro.', 'Usa total.', 'Protege total cero.'] },
  }),
];
