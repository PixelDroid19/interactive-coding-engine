import { authoredLesson, decisionActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_04 = [
  authoredLesson({
    number: 23, module: 4, title: 'Modelos preentrenados, cerrados y abiertos',
    summary: 'Distingue acceso a pesos, licencia, servicio y capacidad sin reducir la elección a abierto contra cerrado.',
    concepts: [['Modelo preentrenado', 'Pesos aprendidos antes de la tarea actual.'], ['Pesos abiertos', 'Artefactos descargables bajo una licencia concreta.'], ['API cerrada', 'Servicio cuyo proveedor opera el modelo y expone un contrato.']],
    requires: ['aislar-contexto'], skill: 'clasificar-modelos', mentalModel: 'Modelo, licencia, artefactos y servicio son capas distintas que se evalúan por separado.',
    script: ['Un modelo puede tener arquitectura publicada, pesos descargables o solo una API. La palabra abierto no responde por sí sola qué puedes hacer.', 'Revisa licencia, datos, tamaño, tarea, artefactos y condiciones del servicio. Después compara capacidad y operación.', 'La función clasifica la forma de acceso según si puedes descargar pesos o solo llamar un servicio.', 'Completa los tres resultados. Publicar una descripción no equivale a entregar pesos.'],
    javascript: { example: `function tipo_acceso(pesos_descargables, solo_api) {
  if (pesos_descargables) return 'pesos';
  if (solo_api) return 'servicio';
  return 'desconocido';
}
console.log(tipo_acceso(true, false));`, starter: `function tipo_acceso(pesos_descargables, solo_api) {
  // Devuelve pesos, servicio o desconocido.
}`, solution: `function tipo_acceso(pesos_descargables, solo_api) {
  if (pesos_descargables) return 'pesos';
  return solo_api ? 'servicio' : 'desconocido';
}`, debugStarter: `function tipo_acceso(pesos_descargables, solo_api) {
  return pesos_descargables ? 'abierto' : 'cerrado';
}` },
    python: { example: `def tipo_acceso(pesos_descargables, solo_api):
    if pesos_descargables:
        return "pesos"
    if solo_api:
        return "servicio"
    return "desconocido"

print(tipo_acceso(True, False))`, starter: `def tipo_acceso(pesos_descargables, solo_api):
    # Devuelve pesos, servicio o desconocido.
    pass`, solution: `def tipo_acceso(pesos_descargables, solo_api):
    if pesos_descargables:
        return "pesos"
    return "servicio" if solo_api else "desconocido"`, debugStarter: `def tipo_acceso(pesos_descargables, solo_api):
    return "abierto" if pesos_descargables else "cerrado"` },
    practice: { title: 'Describe el acceso', instructions: 'Implementa tipo_acceso. Describe el mecanismo, no una etiqueta vaga de abierto o cerrado.', functionName: 'tipo_acceso', cases: [{ args: [true, false], expected: 'pesos', description: 'Reconoce artefactos descargables' }, { args: [false, true], expected: 'servicio', description: 'Reconoce acceso solo por API' }, { args: [false, false], expected: 'desconocido', description: 'No inventa una condición no documentada' }], hints: ['Evalúa pesos primero.', 'solo_api tiene su propio resultado.', 'Sin evidencia devuelve desconocido.'] },
    reading: { core: 'Un modelo preentrenado sirve como base para inferencia o ajuste. El acceso puede incluir pesos, código, arquitectura, datos o solo una API. Cada artefacto tiene licencia y condiciones propias.', mechanics: 'Con pesos operas runtime, hardware, cuantización y actualizaciones. Con una API delegas operación y recibes límites, precios, regiones y políticas del proveedor.', decisions: 'Elige por contrato del producto: calidad, privacidad, control, latencia, coste total, equipo y licencia. Compara modelos con tus casos. Una tabla pública solo orienta.', errors: '"Open source" puede usarse sin precisar licencia o disponibilidad de datos. Descargar pesos no elimina obligaciones. Una API cómoda tampoco garantiza estabilidad o residencia de datos.', keyPoints: ['Describe artefactos y licencia por separado.', 'Operar pesos añade responsabilidades.', 'Evalúa con casos del producto.'], question: '¿Pesos abiertos significan uso comercial libre?', answer: 'No. Debes leer la licencia del repositorio y sus restricciones. La disponibilidad técnica no concede automáticamente todos los derechos.', transfer: 'Compara dos opciones: una API alojada y un modelo con pesos. Escribe una ventaja y una obligación operativa de cada una.', sources: ['hf-model-hub', 'roadmap-ai-engineer'] },
    reasoning: { activity: decisionActivity('Clasifica la forma de acceso.', [['descarga', 'Repositorio con pesos y licencia', ['pesos', 'servicio'], 'pesos'], ['endpoint', 'Endpoint sin artefactos descargables', ['pesos', 'servicio'], 'servicio']]), explanation: 'La clasificación describe qué recibes. La evaluación de licencia y calidad viene después.', hints: ['Un endpoint es un servicio.', 'Un repositorio se revisa archivo por archivo.'] },
    debug: { title: 'Solo existen abierto y cerrado', expected: 'La función describe pesos, servicio o desconocido.', observed: 'Devuelve etiquetas que ocultan el mecanismo.', hints: ['Mira los textos exigidos.', 'No uses abierto ni cerrado.', 'Añade el caso sin información.'] },
  }),
  authoredLesson({
    number: 24, module: 4, title: 'Modelos locales y modelos alojados',
    summary: 'Elige despliegue local o alojado según red, privacidad, hardware y operación.',
    concepts: [['Modelo local', 'Inferencia en el dispositivo o infraestructura controlada.'], ['Modelo alojado', 'Inferencia operada por un proveedor remoto.'], ['Cuantización', 'Reducción de precisión para bajar memoria y cómputo.']],
    requires: ['clasificar-modelos'], skill: 'elegir-despliegue-modelo', mentalModel: 'Local mueve control y coste operativo hacia ti; alojado mueve infraestructura hacia el proveedor.',
    script: ['Local y alojado describen dónde corre la inferencia, no la calidad del modelo.', 'Un modelo local puede funcionar sin red y mantener datos en el dispositivo, pero necesita memoria, descarga y compatibilidad.', 'La función elige local cuando la tarea exige operar sin red o mantener datos sensibles en el dispositivo.', 'Completa la decisión. En los demás casos devuelve alojado como punto de partida, no como regla universal.'],
    javascript: { example: `function elegir_despliegue(sin_red, datos_sensibles) {
  return sin_red || datos_sensibles ? 'local' : 'alojado';
}
console.log(elegir_despliegue(true, false));`, starter: `function elegir_despliegue(sin_red, datos_sensibles) {
  // Devuelve local o alojado.
}`, solution: `function elegir_despliegue(sin_red, datos_sensibles) {
  return sin_red || datos_sensibles ? 'local' : 'alojado';
}`, debugStarter: `function elegir_despliegue(sin_red, datos_sensibles) {
  return sin_red && datos_sensibles ? 'local' : 'alojado';
}` },
    python: { example: `def elegir_despliegue(sin_red, datos_sensibles):
    return "local" if sin_red or datos_sensibles else "alojado"

print(elegir_despliegue(True, False))`, starter: `def elegir_despliegue(sin_red, datos_sensibles):
    # Devuelve local o alojado.
    pass`, solution: `def elegir_despliegue(sin_red, datos_sensibles):
    return "local" if sin_red or datos_sensibles else "alojado"`, debugStarter: `def elegir_despliegue(sin_red, datos_sensibles):
    return "local" if sin_red and datos_sensibles else "alojado"` },
    practice: { title: 'Elige dónde inferir', instructions: 'Implementa elegir_despliegue. Cualquiera de las dos restricciones activa local.', functionName: 'elegir_despliegue', cases: [{ args: [true, false], expected: 'local', description: 'Opera local cuando no hay red' }, { args: [false, true], expected: 'local', description: 'Mantiene datos sensibles en el entorno controlado' }, { args: [false, false], expected: 'alojado', description: 'Permite servicio alojado sin esas restricciones' }], hints: ['Las señales se combinan con o.', 'Prueba cada una de forma aislada.', 'Devuelve texto exacto.'] },
    reading: { core: 'Inferencia local ocurre en navegador, móvil, escritorio o infraestructura propia. Inferencia alojada usa una API. También existen despliegues híbridos que enrutan según tarea y riesgo.', mechanics: 'En este curso Transformers.js ejecuta un modelo ONNX cuantizado en un Worker y solicita WebGPU. La primera sesión descarga los artefactos; las siguientes pueden usar caché. q4 reduce memoria y transferencia, aunque puede cambiar la calidad y debe validarse en el dispositivo real.', decisions: 'Compara tiempo de primera carga, latencia sostenida, privacidad, coste por uso, disponibilidad sin red y capacidad del equipo. Prueba en dispositivos reales y ofrece un error claro cuando WebGPU no esté disponible.', errors: 'Local no significa automáticamente privado si la aplicación envía telemetría o descarga datos externos. Alojar no elimina responsabilidades de consentimiento y retención. WebGPU tampoco está garantizado en todos los navegadores o equipos.', keyPoints: ['Mide en el dispositivo objetivo.', 'Local y alojado pueden coexistir.', 'La privacidad depende del flujo completo.'], question: '¿Un modelo en el navegador funciona sin internet?', answer: 'Después de descargar y cachear artefactos puede hacerlo, según implementación. La primera carga y modelos no cacheados sí necesitan red.', transfer: 'Diseña un enrutador para una app móvil: qué tareas harías localmente y cuáles enviarías a una API.', sources: ['transformers-js', 'transformers-js-v4', 'lfm25-350m', 'hf-model-hub', 'pyodide-worker'] },
    reasoning: { activity: decisionActivity('Elige un punto de partida.', [['avion', 'Asistente durante un vuelo sin conexión', ['local', 'alojado'], 'local'], ['potente', 'Modelo grande con hardware insuficiente', ['local', 'alojado'], 'alojado'], ['sensible', 'Clasificación de notas privadas', ['local', 'alojado'], 'local']]), explanation: 'La elección sigue restricciones. Después se valida calidad y rendimiento en el entorno real.', hints: ['Sin red descarta una API remota.', 'El hardware limita modelos locales.'] },
    debug: { title: 'Local exige dos restricciones', expected: 'Sin red o datos sensibles bastan por separado.', observed: 'La función exige ambas.', hints: ['Prueba true, false.', 'and es demasiado estricto.', 'Usa or.'] },
  }),
  authoredLesson({
    number: 25, module: 4, title: 'Elegir por calidad, coste, latencia y privacidad',
    summary: 'Calcula una puntuación transparente y conserva métricas separadas para no ocultar compensaciones.',
    concepts: [['Latencia', 'Tiempo entre solicitud y respuesta o primer token.'], ['Coste total', 'Uso, infraestructura, desarrollo y operación.'], ['Restricción dura', 'Condición que una opción debe cumplir antes de puntuar.']],
    requires: ['elegir-despliegue-modelo'], skill: 'comparar-modelos', mentalModel: 'Filtra por condiciones obligatorias y luego puntúa; una media no debe compensar una violación de privacidad.',
    script: ['Elegir un modelo es una decisión multiobjetivo. Calidad, coste y latencia compiten; privacidad puede ser una restricción no negociable.', 'Primero elimina opciones que incumplen límites. Después normaliza métricas y aplica pesos visibles.', 'El ejemplo calcula una puntuación simple donde calidad suma y coste y latencia restan.', 'Completa la fórmula con los tres valores. No codifiques una respuesta para un modelo concreto.'],
    javascript: { example: `function puntuar_modelo(calidad, coste, latencia) {
  return calidad * 2 - coste - latencia;
}
console.log(puntuar_modelo(0.9, 0.2, 0.1));`, starter: `function puntuar_modelo(calidad, coste, latencia) {
  // calidad pesa doble; coste y latencia restan.
}`, solution: `function puntuar_modelo(calidad, coste, latencia) {
  return calidad * 2 - coste - latencia;
}`, debugStarter: `function puntuar_modelo(calidad, coste, latencia) {
  return calidad + coste + latencia;
}` },
    python: { example: `def puntuar_modelo(calidad, coste, latencia):
    return calidad * 2 - coste - latencia

print(puntuar_modelo(0.9, 0.2, 0.1))`, starter: `def puntuar_modelo(calidad, coste, latencia):
    # calidad pesa doble; coste y latencia restan.
    pass`, solution: `def puntuar_modelo(calidad, coste, latencia):
    return calidad * 2 - coste - latencia`, debugStarter: `def puntuar_modelo(calidad, coste, latencia):
    return calidad + coste + latencia` },
    practice: { title: 'Puntúa una opción', instructions: 'Implementa puntuar_modelo con calidad por dos menos coste y latencia.', functionName: 'puntuar_modelo', cases: [{ args: [0.9, 0.2, 0.1], expected: 1.5, description: 'Premia calidad y penaliza coste y latencia' }, { args: [0.5, 0.4, 0.3], expected: 0.3, description: 'Funciona con otra combinación' }], hints: ['Multiplica calidad por dos.', 'Coste y latencia se restan.', 'Conserva el resultado numérico.'] },
    reading: { core: 'Una comparación comienza con requisitos duros como región, licencia, modalidad y límite de latencia. Solo las opciones válidas pasan a una matriz de calidad, coste, velocidad y operación.', mechanics: 'Mide las mismas entradas varias veces, registra percentiles de latencia y separa tokens de entrada y salida. Normaliza métricas antes de ponderar para que las unidades no dominen.', decisions: 'Mantén la tabla original junto con la puntuación. Realiza análisis de sensibilidad cambiando pesos. Si una pequeña variación cambia al ganador, la decisión es frágil.', errors: 'Usar benchmarks ajenos como sustituto de casos propios engaña. Sumar métricas sin normalizar mezcla dólares y milisegundos. Una media oculta colas lentas y fallos críticos.', keyPoints: ['Las restricciones duras se filtran primero.', 'Los pesos son una decisión de producto.', 'Conserva métricas crudas y casos fallidos.'], question: '¿Debo elegir un solo modelo para todo?', answer: 'No necesariamente. Un enrutador puede usar modelos distintos por riesgo o complejidad, si la ganancia justifica esa operación adicional.', transfer: 'Crea una matriz con tres modelos y cuatro métricas. Marca una restricción que no se pueda compensar.', sources: ['roadmap-ai-engineer', 'hf-model-hub', 'deepeval-evaluation'] },
    reasoning: { activity: sequenceActivity('Ordena una selección reproducible.', [['casos', 'Fijar casos y restricciones'], ['filtrar', 'Eliminar opciones inválidas'], ['medir', 'Medir métricas'], ['normalizar', 'Normalizar y ponderar'], ['revisar', 'Revisar sensibilidad y fallos']]), explanation: 'La puntuación solo tiene sentido después de medir opciones que cumplen las condiciones obligatorias.', hints: ['No puntúes una opción prohibida.', 'Los pesos se aplican a métricas comparables.'] },
    debug: { title: 'Coste y latencia parecen ventajas', expected: 'Calidad suma; coste y latencia restan.', observed: 'La función suma todas las métricas.', hints: ['Una cifra alta de coste es peor.', 'Revisa los signos.', 'Calidad además pesa doble.'] },
  }),
  authoredLesson({
    number: 26, module: 4, title: 'Hugging Face Hub, tareas y Transformers.js',
    summary: 'Lee una model card, elige una tarea compatible y carga inferencia local bajo demanda.',
    concepts: [['Model card', 'Documento de uso, datos, métricas y límites de un modelo.'], ['Pipeline', 'Interfaz que agrupa preprocesamiento, modelo y posprocesamiento.'], ['Feature extraction', 'Tarea que devuelve representaciones numéricas.']],
    requires: ['comparar-modelos'], skill: 'usar-model-hub', mentalModel: 'El Hub distribuye artefactos y documentación; la pipeline ejecuta una tarea concreta sobre ellos.',
    script: ['Un nombre de modelo no basta. La model card explica tarea, idiomas, licencia, datos, métricas y uso previsto.', 'Transformers.js carga modelos compatibles en el navegador y ofrece pipelines como feature extraction o clasificación.', 'La función relaciona una necesidad con el nombre de tarea que pedirías a la pipeline.', 'Completa clasificación y embeddings. Una tarea desconocida debe devolver no_disponible.'],
    javascript: { example: `function tarea_pipeline(necesidad) {
  const tareas = { clasificar: 'text-classification', embeddings: 'feature-extraction' };
  return tareas[necesidad] ?? 'no_disponible';
}
console.log(tarea_pipeline('embeddings'));`, starter: `function tarea_pipeline(necesidad) {
  // Mapea clasificar y embeddings.
}`, solution: `function tarea_pipeline(necesidad) {
  return ({ clasificar: 'text-classification', embeddings: 'feature-extraction' })[necesidad] ?? 'no_disponible';
}`, debugStarter: `function tarea_pipeline(necesidad) {
  return 'text-generation';
}` },
    python: { example: `def tarea_pipeline(necesidad):
    tareas = {"clasificar": "text-classification", "embeddings": "feature-extraction"}
    return tareas.get(necesidad, "no_disponible")

print(tarea_pipeline("embeddings"))`, starter: `def tarea_pipeline(necesidad):
    # Mapea clasificar y embeddings.
    pass`, solution: `def tarea_pipeline(necesidad):
    return {"clasificar": "text-classification", "embeddings": "feature-extraction"}.get(necesidad, "no_disponible")`, debugStarter: `def tarea_pipeline(necesidad):
    return "text-generation"` },
    practice: { title: 'Elige una tarea', instructions: 'Implementa tarea_pipeline. Usa los nombres exactos de las dos pipelines y un fallback.', functionName: 'tarea_pipeline', cases: [{ args: ['clasificar'], expected: 'text-classification', description: 'Selecciona clasificación de texto' }, { args: ['embeddings'], expected: 'feature-extraction', description: 'Selecciona extracción de características' }, { args: ['traducir'], expected: 'no_disponible', description: 'No inventa una tarea no configurada' }], hints: ['Usa un mapa de necesidad a tarea.', 'El fallback es no_disponible.', 'Devuelve el nombre exacto con guion.'] },
    reading: { core: 'El Hub alberga pesos, configuración, tokenizador, código, datasets y model cards. El laboratorio usa onnx-community/LFM2.5-350M-ONNX: un modelo pequeño con soporte declarado para español, preparado para la tarea text-generation en Transformers.js.', mechanics: 'Transformers.js v4 crea una pipeline de generación con device webgpu y dtype q4. ModelRegistry permite consultar archivos, tamaño, formatos y caché antes de descargar. La inferencia corre en un Worker, entrega progreso y muestra texto conforme se genera.', decisions: 'Revisa licencia, tarea, idiomas, tamaño, cuantización y compatibilidad web. Fija una revisión cuando necesites reproducibilidad. Mide por separado primera carga y generación posterior.', errors: 'Copiar un id sin leer la card puede cargar una tarea incorrecta o un archivo enorme. Confiar en latest sin control cambia comportamiento. Si WebGPU produce texto corrupto, no lo presentes como respuesta: informa la incompatibilidad del equipo.', keyPoints: ['La model card forma parte del contrato.', 'La tarea determina pre y posprocesamiento.', 'La carga local necesita consentimiento, progreso y caché visibles.'], question: '¿El modelo se descarga en cada visita?', answer: 'El navegador puede cachearlo, pero depende de almacenamiento, origen y políticas. La interfaz debe funcionar también durante descarga o si la caché se borra.', transfer: 'Elige una model card y anota tarea, idioma, licencia, tamaño, métrica y una limitación.', sources: ['hf-model-hub', 'transformers-js', 'transformers-js-v4', 'lfm25-350m', 'codepen-transformers-js'] },
    reasoning: { activity: sequenceActivity('Ordena una carga responsable.', [['card', 'Leer model card y licencia'], ['artefacto', 'Elegir revisión y cuantización'], ['progreso', 'Mostrar descarga y caché'], ['inferir', 'Ejecutar en Worker'], ['evaluar', 'Evaluar en casos propios']]), explanation: 'La ejecución viene después de entender el artefacto. El resultado se evalúa en el producto.', hints: ['La licencia se revisa antes de descargar.', 'La inferencia no es la aceptación final.'] },
    debug: { title: 'Todo parece generación', expected: 'Cada necesidad usa su pipeline o fallback.', observed: 'Siempre devuelve text-generation.', hints: ['Prueba embeddings.', 'La respuesta fija ignora necesidad.', 'Usa un mapa y fallback.'] },
  }),
  authoredLesson({
    number: 27, module: 4, title: 'APIs, SDKs y contratos compatibles',
    summary: 'Aísla diferencias de proveedores detrás de un contrato y prepara la migración a un backend seguro.',
    concepts: [['SDK', 'Biblioteca cliente que empaqueta un contrato de API.'], ['API compatible', 'Servicio que imita parte de la forma de otra API.'], ['Adaptador', 'Capa que traduce un contrato interno al proveedor.']],
    requires: ['usar-model-hub'], skill: 'abstraer-proveedor', mentalModel: 'El currículo habla con una interfaz propia; cada proveedor traduce mensajes, headers y respuestas.',
    script: ['Los proveedores difieren en endpoints, mensajes, tools, streaming, errores y uso. Un SDK facilita, pero no elimina esas diferencias.', 'Define un contrato interno pequeño. El adaptador recibe la clave en memoria, construye la solicitud y normaliza la respuesta.', 'El ejemplo crea una solicitud neutral con modelo y mensajes. No guarda una clave ni la añade a la URL.', 'Completa el objeto. Esta frontera permitirá mover la misma llamada a un backend sin reescribir el curso.'],
    javascript: { example: `function solicitud_modelo(modelo, mensaje) {
  return { modelo, mensajes: [{ rol: 'usuario', contenido: mensaje }] };
}
console.log(solicitud_modelo('local', 'hola'));`, starter: `function solicitud_modelo(modelo, mensaje) {
  // Devuelve modelo y una lista con el mensaje de usuario.
}`, solution: `function solicitud_modelo(modelo, mensaje) {
  return { modelo, mensajes: [{ rol: 'usuario', contenido: mensaje }] };
}`, debugStarter: `function solicitud_modelo(modelo, mensaje) {
  return { modelo: 'fijo', mensajes: [] };
}` },
    python: { example: `def solicitud_modelo(modelo, mensaje):
    return {"modelo": modelo, "mensajes": [{"rol": "usuario", "contenido": mensaje}]}

print(solicitud_modelo("local", "hola"))`, starter: `def solicitud_modelo(modelo, mensaje):
    # Devuelve modelo y una lista con el mensaje de usuario.
    pass`, solution: `def solicitud_modelo(modelo, mensaje):
    return {"modelo": modelo, "mensajes": [{"rol": "usuario", "contenido": mensaje}]}`, debugStarter: `def solicitud_modelo(modelo, mensaje):
    return {"modelo": "fijo", "mensajes": []}` },
    practice: { title: 'Construye una solicitud neutral', instructions: 'Implementa solicitud_modelo(modelo, mensaje) con los nombres de campos indicados.', functionName: 'solicitud_modelo', cases: [{ args: ['modelo-a', 'hola'], expected: { modelo: 'modelo-a', mensajes: [{ rol: 'usuario', contenido: 'hola' }] }, description: 'Conserva modelo y mensaje' }, { args: ['modelo-b', 'resume esto'], expected: { modelo: 'modelo-b', mensajes: [{ rol: 'usuario', contenido: 'resume esto' }] }, description: 'No depende de valores de demostración' }], hints: ['mensajes es una lista con un objeto.', 'El rol es usuario.', 'modelo y contenido vienen de parámetros.'] },
    reading: { core: 'No toda IA del navegador usa el mismo contrato. Transformers.js carga un modelo elegido por la aplicación. Chrome también ofrece APIs especializadas como Prompt, Summarizer y Writer cuando la versión, el equipo y la disponibilidad lo permiten.', mechanics: 'Primero detecta la API y consulta availability. Después crea una sesión y usa prompt, summarize o write. El laboratorio conserva Transformers.js como ruta local principal porque permite escoger el modelo; las APIs integradas se estudian como otra implementación posible del mismo objetivo.', decisions: 'Expón solo capacidades comprobadas. Summarizer está disponible en versiones estables recientes de Chrome, mientras Writer y Prompt pueden depender de versión, prueba de origen o configuración. Conserva detección de capacidad y una ruta alternativa.', errors: 'Asumir que una API experimental existe rompe la experiencia. Una abstracción demasiado grande oculta diferencias de formatos y límites. No sustituyas una salida real con texto simulado cuando el motor no está disponible.', keyPoints: ['Detecta cada capacidad antes de usarla.', 'Transformers.js permite elegir y cachear el modelo local.', 'Las APIs integradas tienen contratos y disponibilidad propios.'], question: '¿Necesito una clave para practicar localmente?', answer: 'No. Transformers.js y las APIs integradas compatibles ejecutan el modelo en el dispositivo. Las APIs remotas sí deben pasar más adelante por un backend que proteja credenciales y aplique cuotas.', transfer: 'Define un contrato interno para resumir y dos adaptadores: Transformers.js y Summarizer cuando esté disponible.', sources: ['transformers-js', 'chrome-built-in-ai', 'chrome-prompt-api', 'chrome-summarizer-api', 'chrome-writer-api', 'openai-function-calling'] },
    reasoning: { activity: sequenceActivity('Ordena una llamada a través de un adaptador.', [['interno', 'Crear solicitud interna'], ['traducir', 'Traducir al proveedor'], ['enviar', 'Enviar con timeout'], ['validar', 'Validar respuesta'], ['normalizar', 'Normalizar resultado']]), explanation: 'La traducción se concentra en el borde. El resto de la aplicación consume una forma estable.', hints: ['La solicitud interna no conoce headers.', 'Normalizar ocurre después de validar.'] },
    debug: { title: 'La solicitud perdió sus datos', expected: 'Modelo y mensaje reales llegan al contrato.', observed: 'El modelo está fijo y la lista vacía.', hints: ['Prueba dos modelos.', 'Usa los parámetros.', 'Construye el objeto del mensaje dentro de la lista.'] },
  }),
];
