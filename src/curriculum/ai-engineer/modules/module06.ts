import { authoredLesson, decisionActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_06 = [
  authoredLesson({
    number: 33, module: 6, title: 'Vector, documento, id y metadatos',
    summary: 'Diseña un registro vectorial reproducible que conserva contenido, proveniencia y filtros.',
    concepts: [['Punto vectorial', 'Registro con id, vector y payload.'], ['Metadatos', 'Campos estructurados usados para filtrar y citar.'], ['Payload', 'Datos asociados al vector que no forman parte de sus coordenadas.']],
    requires: ['evaluar-modelo-embeddings'], skill: 'modelar-registro-vectorial', mentalModel: 'El vector encuentra vecinos; el id y los metadatos permiten entender, filtrar y recuperar la fuente.',
    script: ['Guardar solo una lista de números crea un índice que no puede explicar de dónde salió un resultado.', 'Cada punto necesita id estable, vector, texto o referencia, metadatos y versión del modelo.', 'El ejemplo construye un registro sin mezclar categoría dentro del vector.', 'Completa la función con los valores recibidos. La prueba cambiará id, texto y categoría.'],
    javascript: { example: `function crear_registro(id, texto, categoria) {
  return { id, texto, metadatos: { categoria } };
}
console.log(crear_registro('d1', 'manual', 'soporte'));`, starter: `function crear_registro(id, texto, categoria) {
  // Devuelve id, texto y metadatos.categoria.
}`, solution: `function crear_registro(id, texto, categoria) {
  return { id, texto, metadatos: { categoria } };
}`, debugStarter: `function crear_registro(id, texto, categoria) {
  return { id: 'fijo', texto, categoria };
}` },
    python: { example: `def crear_registro(id, texto, categoria):
    return {"id": id, "texto": texto, "metadatos": {"categoria": categoria}}

print(crear_registro("d1", "manual", "soporte"))`, starter: `def crear_registro(id, texto, categoria):
    # Devuelve id, texto y metadatos.categoria.
    pass`, solution: `def crear_registro(id, texto, categoria):
    return {"id": id, "texto": texto, "metadatos": {"categoria": categoria}}`, debugStarter: `def crear_registro(id, texto, categoria):
    return {"id": "fijo", "texto": texto, "categoria": categoria}` },
    practice: { title: 'Construye un punto', instructions: 'Implementa crear_registro(id, texto, categoria) con categoria dentro de metadatos.', functionName: 'crear_registro', cases: [{ args: ['d1', 'manual', 'soporte'], expected: { id: 'd1', texto: 'manual', metadatos: { categoria: 'soporte' } }, description: 'Conserva proveniencia y filtro' }, { args: ['d2', 'política', 'legal'], expected: { id: 'd2', texto: 'política', metadatos: { categoria: 'legal' } }, description: 'Funciona con otro documento' }], hints: ['metadatos es un objeto anidado.', 'No fijes el id.', 'Conserva texto y categoría recibidos.'] },
    reading: { core: 'Una base vectorial guarda puntos con id, vector y payload. El payload puede contener texto, url, tenant, fecha, idioma, permisos y versión. El vector se usa para ranking; los metadatos para filtros y explicación.', mechanics: 'La ingesta asigna ids estables por documento y fragmento. Un cambio de contenido actualiza o reemplaza el punto. La fuente original se conserva fuera o dentro del payload según tamaño y privacidad.', decisions: 'Guarda campos que usarás para filtrar, citar o depurar. Evita duplicar datos sensibles innecesarios. Incluye versión de embedding y checksum del contenido.', errors: 'Ids aleatorios en cada ingesta duplican documentos. Metadatos sin tipo dificultan filtros. Guardar solo texto impide saber qué versión del vector está activa.', keyPoints: ['El id permite actualización idempotente.', 'Los metadatos no sustituyen el vector.', 'La proveniencia viaja hasta la cita.'], question: '¿Debo guardar el documento completo en la base vectorial?', answer: 'Depende del tamaño y arquitectura. Puedes guardar el fragmento y una referencia al original. Lo importante es recuperar el texto exacto y su proveniencia.', transfer: 'Diseña el payload de un fragmento de manual con seis campos y explica para qué sirve cada uno.', sources: ['qdrant-vector-search', 'qdrant-filtering'] },
    reasoning: { activity: decisionActivity('Asigna cada dato a su lugar.', [['coords', '384 números del embedding', ['vector', 'metadatos'], 'vector'], ['tenant', 'Id del equipo autorizado', ['vector', 'metadatos'], 'metadatos'], ['url', 'Enlace a la fuente', ['vector', 'metadatos'], 'metadatos']]), explanation: 'El vector participa en la métrica. Los campos estructurados filtran y explican.', hints: ['Un id de tenant no es coordenada semántica.', 'La url sirve para citar.'] },
    debug: { title: 'Id fijo y metadatos planos', expected: 'Cada registro conserva su id y anida categoría.', observed: 'Todos usan el mismo id y categoría queda fuera.', hints: ['Crea dos registros.', 'Usa el parámetro id.', 'Crea metadatos con categoria.'] },
  }),
  authoredLesson({
    number: 34, module: 6, title: 'Indexar y consultar',
    summary: 'Separa ingesta de consulta y devuelve top-k sin modificar el corpus original.',
    concepts: [['Índice', 'Estructura que acelera búsqueda de vecinos.'], ['Top-k', 'Cantidad máxima de candidatos devueltos.'], ['Upsert', 'Inserción o actualización idempotente por id.']],
    requires: ['modelar-registro-vectorial'], skill: 'indexar-consultar-vectores', mentalModel: 'La ingesta prepara puntos una vez; cada consulta crea su vector y busca vecinos en el índice.',
    script: ['Indexar y consultar son rutas distintas. La ingesta limpia, fragmenta, genera vectores y hace upsert.', 'La consulta genera un vector compatible, aplica filtros y solicita top-k. No vuelve a insertar todo el corpus.', 'El ejemplo ordena puntos por puntuación y corta k.', 'Completa top_resultados sin mutar la lista original.'],
    javascript: { example: `function top_resultados(puntos, k) {
  return [...puntos].sort((a, b) => b.score - a.score).slice(0, k).map(p => p.id);
}
console.log(top_resultados([{ id: 'a', score: 0.2 }, { id: 'b', score: 0.8 }], 1));`, starter: `function top_resultados(puntos, k) {
  // Ordena score descendente, corta k y devuelve ids.
}`, solution: `function top_resultados(puntos, k) {
  return [...puntos].sort((a, b) => b.score - a.score).slice(0, k).map(p => p.id);
}`, debugStarter: `function top_resultados(puntos, k) {
  return puntos.slice(0, k).map(p => p.id);
}` },
    python: { example: `def top_resultados(puntos, k):
    ordenados = sorted(puntos, key=lambda p: p["score"], reverse=True)
    return [p["id"] for p in ordenados[:k]]

print(top_resultados([{"id": "a", "score": 0.2}, {"id": "b", "score": 0.8}], 1))`, starter: `def top_resultados(puntos, k):
    # Ordena score descendente, corta k y devuelve ids.
    pass`, solution: `def top_resultados(puntos, k):
    return [p["id"] for p in sorted(puntos, key=lambda p: p["score"], reverse=True)[:k]]`, debugStarter: `def top_resultados(puntos, k):
    return [p["id"] for p in puntos[:k]]` },
    practice: { title: 'Consulta top-k', instructions: 'Implementa top_resultados(puntos, k). El orden de entrada no representa similitud.', functionName: 'top_resultados', cases: [{ args: [[{ id: 'a', score: 0.2 }, { id: 'b', score: 0.8 }], 1], expected: ['b'], description: 'Devuelve el vecino con mayor score' }, { args: [[{ id: 'x', score: 0.5 }, { id: 'y', score: 0.7 }, { id: 'z', score: 0.6 }], 2], expected: ['y', 'z'], description: 'Respeta top-k y ranking' }], hints: ['Copia antes de ordenar en JavaScript.', 'Orden descendente usa b menos a.', 'Corta antes de extraer ids.'] },
    reading: { core: 'Indexar transforma contenido en puntos buscables. Consultar transforma una pregunta en un vector y recupera vecinos. Un índice aproximado intercambia algo de exactitud por velocidad y memoria.', mechanics: 'Upsert usa ids estables. La consulta especifica vector, métrica implícita del índice, filtros, k y parámetros de búsqueda. La respuesta incluye id, score y payload.', decisions: 'Empieza con búsqueda exacta en corpus pequeño para una referencia. Añade índice aproximado cuando la escala lo justifique y mide recall contra esa referencia.', errors: 'Reindexar en cada consulta desperdicia trabajo. Cambiar métrica sin regenerar o reconfigurar rompe comparabilidad. Tomar k enorme traslada ruido al generador.', keyPoints: ['Ingesta y consulta son rutas independientes.', 'Top-k se elige con evaluación.', 'Los índices aproximados se comparan contra una referencia.'], question: '¿Una base vectorial garantiza el vecino exacto?', answer: 'Depende del índice y configuración. Muchos usan búsqueda aproximada. Puedes aumentar esfuerzo o usar exacta para evaluar.', transfer: 'Dibuja los datos que se calculan una vez y los que se calculan por consulta.', sources: ['qdrant-vector-search', 'sentence-transformers-semantic-search'] },
    reasoning: { activity: sequenceActivity('Ordena una consulta después de indexar.', [['entrada', 'Recibir consulta'], ['vector', 'Crear embedding'], ['filtros', 'Aplicar filtros'], ['buscar', 'Buscar top-k'], ['payload', 'Recuperar texto y metadatos']]), explanation: 'El corpus ya está indexado. La consulta solo genera su vector y busca.', hints: ['No vuelvas a fragmentar el corpus.', 'El payload llega con los ids.'] },
    debug: { title: 'Top-k corta antes de ordenar', expected: 'El mejor score aparece primero.', observed: 'Se toman los primeros puntos del arreglo.', hints: ['Pon el mejor al final.', 'slice no ordena.', 'Ordena antes de cortar.'] },
  }),
  authoredLesson({
    number: 35, module: 6, title: 'Filtros y búsqueda híbrida',
    summary: 'Combina permisos y metadatos con señales semánticas y léxicas sin filtrar después de exponer datos.',
    concepts: [['Filtro de payload', 'Condición estructurada aplicada durante la búsqueda.'], ['Búsqueda híbrida', 'Combinación de señales densas y léxicas.'], ['RRF', 'Fusión por posiciones que combina rankings sin igualar escalas.']],
    requires: ['indexar-consultar-vectores'], skill: 'filtrar-busqueda-hibrida', mentalModel: 'Los filtros deciden qué puede competir; el ranking híbrido decide el orden entre lo permitido.',
    script: ['La similitud no conoce permisos. El filtro de tenant, fecha o categoría debe formar parte de la consulta.', 'La búsqueda híbrida combina significado con coincidencias exactas útiles para códigos, nombres y términos raros.', 'El ejemplo filtra resultados por categoría antes de devolver ids.', 'Completa el filtro sin aceptar categorías parciales.'],
    javascript: { example: `function filtrar_categoria(resultados, categoria) {
  return resultados.filter(item => item.categoria === categoria).map(item => item.id);
}
console.log(filtrar_categoria([{ id: 'a', categoria: 'legal' }], 'legal'));`, starter: `function filtrar_categoria(resultados, categoria) {
  // Coincidencia exacta y devuelve ids.
}`, solution: `function filtrar_categoria(resultados, categoria) {
  return resultados.filter(item => item.categoria === categoria).map(item => item.id);
}`, debugStarter: `function filtrar_categoria(resultados, categoria) {
  return resultados.filter(item => item.categoria.includes(categoria)).map(item => item.id);
}` },
    python: { example: `def filtrar_categoria(resultados, categoria):
    return [item["id"] for item in resultados if item["categoria"] == categoria]

print(filtrar_categoria([{"id": "a", "categoria": "legal"}], "legal"))`, starter: `def filtrar_categoria(resultados, categoria):
    # Coincidencia exacta y devuelve ids.
    pass`, solution: `def filtrar_categoria(resultados, categoria):
    return [item["id"] for item in resultados if item["categoria"] == categoria]`, debugStarter: `def filtrar_categoria(resultados, categoria):
    return [item["id"] for item in resultados if categoria in item["categoria"]]` },
    practice: { title: 'Protege por categoría', instructions: 'Implementa filtrar_categoria con igualdad exacta.', functionName: 'filtrar_categoria', cases: [{ args: [[{ id: 'a', categoria: 'legal' }, { id: 'b', categoria: 'ventas' }], 'legal'], expected: ['a'], description: 'Conserva solo la categoría autorizada' }, { args: [[{ id: 'x', categoria: 'legal-interno' }], 'legal'], expected: [], description: 'No acepta coincidencias parciales' }], hints: ['Usa igualdad, no includes o in.', 'Filtra antes de mapear.', 'Devuelve solo ids permitidos.'] },
    reading: { core: 'Los filtros restringen candidatos por campos estructurados. La búsqueda híbrida combina embeddings con una señal léxica como BM25. Esto ayuda cuando una consulta incluye códigos exactos o vocabulario raro.', mechanics: 'El motor ejecuta ambas búsquedas, normaliza o fusiona rankings y aplica filtros dentro del motor. RRF usa posiciones para evitar comparar scores de escalas distintas.', decisions: 'Usa filtros para permisos y condiciones duras. Añade híbrida cuando los casos exactos fallan con semántica. Evalúa por segmentos de consulta.', errors: 'Filtrar en la interfaz después de recuperar puede exponer payload no autorizado. Sumar scores sin calibrar favorece una escala. Una coincidencia parcial de tenant es un fallo de aislamiento.', keyPoints: ['Permisos se aplican dentro de la consulta.', 'Híbrida combina señales complementarias.', 'La fusión se evalúa con consultas reales.'], question: '¿Puedo usar solo búsqueda por palabras?', answer: 'Sí cuando el dominio es exacto y conocido. La semántica aporta paráfrasis; la híbrida vale si mejora casos medidos.', transfer: 'Crea una consulta con un código de error y una descripción. Decide qué señal debería recuperar cada parte.', sources: ['qdrant-filtering', 'qdrant-vector-search'] },
    reasoning: { activity: sequenceActivity('Ordena una búsqueda híbrida segura.', [['permiso', 'Aplicar filtros obligatorios'], ['densa', 'Obtener ranking semántico'], ['lexica', 'Obtener ranking léxico'], ['fusionar', 'Fusionar posiciones'], ['entregar', 'Entregar payload permitido']]), explanation: 'Conceptualmente el filtro limita ambos rankings. Ningún payload no autorizado llega a la aplicación.', hints: ['Permisos no se aplican al final.', 'Fusionar ocurre después de ambas señales.'] },
    debug: { title: 'Legal coincide con legal-interno', expected: 'La categoría debe ser exactamente igual.', observed: 'Una subcadena parece autorizada.', hints: ['Prueba legal-interno.', 'includes acepta parciales.', 'Usa igualdad estricta.'] },
  }),
  authoredLesson({
    number: 36, module: 6, title: 'Elegir una base vectorial',
    summary: 'Compara una librería local y un servicio por escala, filtros, operación y despliegue.',
    concepts: [['FAISS', 'Biblioteca de índices vectoriales, no base de datos completa.'], ['Base vectorial gestionada', 'Servicio que opera almacenamiento, índices y API.'], ['Adaptador de índice', 'Contrato interno para upsert y search.']],
    requires: ['filtrar-busqueda-hibrida'], skill: 'elegir-base-vectorial', mentalModel: 'El índice resuelve vecinos; la base añade persistencia, filtros, aislamiento, backups y operación.',
    script: ['Chroma, Pinecone, Weaviate, FAISS, LanceDB, Qdrant, Supabase y MongoDB Atlas no son intercambiables solo por admitir vectores.', 'Compara despliegue, persistencia, filtros, híbrida, escala, backups, coste y experiencia del equipo.', 'La función elige local para un prototipo pequeño sin servicio compartido y servicio para una carga compartida.', 'Completa la decisión con las dos señales. El curso usa un índice local y exporta un adaptador de Qdrant como ejemplo.'],
    javascript: { example: `function tipo_indice(prototipo_pequeno, compartido) {
  return prototipo_pequeno && !compartido ? 'local' : 'servicio';
}
console.log(tipo_indice(true, false));`, starter: `function tipo_indice(prototipo_pequeno, compartido) {
  // Devuelve local o servicio.
}`, solution: `function tipo_indice(prototipo_pequeno, compartido) {
  return prototipo_pequeno && !compartido ? 'local' : 'servicio';
}`, debugStarter: `function tipo_indice(prototipo_pequeno, compartido) {
  return prototipo_pequeno ? 'local' : 'servicio';
}` },
    python: { example: `def tipo_indice(prototipo_pequeno, compartido):
    return "local" if prototipo_pequeno and not compartido else "servicio"

print(tipo_indice(True, False))`, starter: `def tipo_indice(prototipo_pequeno, compartido):
    # Devuelve local o servicio.
    pass`, solution: `def tipo_indice(prototipo_pequeno, compartido):
    return "local" if prototipo_pequeno and not compartido else "servicio"`, debugStarter: `def tipo_indice(prototipo_pequeno, compartido):
    return "local" if prototipo_pequeno else "servicio"` },
    practice: { title: 'Elige una operación inicial', instructions: 'Implementa tipo_indice. Un prototipo es local solo si además no necesita compartirse.', functionName: 'tipo_indice', cases: [{ args: [true, false], expected: 'local', description: 'Usa índice local para un prototipo contenido' }, { args: [true, true], expected: 'servicio', description: 'El uso compartido exige una capa de servicio' }, { args: [false, false], expected: 'servicio', description: 'Una carga mayor sale del prototipo local' }], hints: ['Las dos condiciones definen local.', 'Niega compartido.', 'Los demás casos usan servicio.'] },
    reading: { core: 'Una biblioteca como FAISS ofrece algoritmos de índice. Una base añade persistencia, API, filtros, réplicas y gestión. Algunos sistemas relacionales o documentales incorporan vectores junto a datos existentes.', mechanics: 'Un adaptador interno define upsert, delete y search con filtros. La implementación local usa arrays o una librería; la remota traduce a Qdrant u otro servicio.', decisions: 'Elige la opción más simple que cumpla escala, permisos, filtros, disponibilidad y operación. Considera dónde ya viven los metadatos y quién mantendrá backups.', errors: 'Adoptar un servicio por moda añade coste. Usar un índice en memoria para varios usuarios pierde consistencia. Comparar solo consultas por segundo ignora filtros y mantenimiento.', keyPoints: ['Biblioteca e infraestructura no son lo mismo.', 'El adaptador reduce acoplamiento.', 'La decisión incluye operación y equipo.'], question: '¿Cuál base vectorial es la mejor?', answer: 'No existe una universal. Define requisitos y prueba dos candidatas con tu corpus, filtros y carga. Una base ya operada por tu equipo puede ser la mejor integración.', transfer: 'Compara una opción local y una remota en seis criterios, incluyendo recuperación ante fallos.', sources: ['qdrant-vector-search', 'qdrant-filtering'] },
    reasoning: { activity: decisionActivity('Elige el punto de partida.', [['demo', 'Mil fragmentos, una persona, sin servidor', ['local', 'servicio'], 'local'], ['equipo', 'Varios usuarios y filtros de tenant', ['local', 'servicio'], 'servicio'], ['produccion', 'Backups y alta disponibilidad', ['local', 'servicio'], 'servicio']]), explanation: 'El índice local enseña el flujo. La producción compartida necesita persistencia y operación explícitas.', hints: ['Piensa quién comparte el estado.', 'Backups pertenecen a infraestructura.'] },
    debug: { title: 'Todo prototipo queda local', expected: 'Compartido obliga a servicio.', observed: 'La segunda señal se ignora.', hints: ['Prueba true, true.', 'Falta considerar compartido.', 'Local exige prototipo y no compartido.'] },
  }),
];
