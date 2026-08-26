import { authoredLesson, contextBudgetActivity, decisionActivity, flowActivity, sequenceActivity, vectorRankingActivity } from '../authoring';

// Fase 5: Documentos y RAG.
// El TutorLocal aprende a leer tus archivos, dividirlos, buscar en ellos
// y responder con citas verificables o abstenerse con elegancia.

export const AI_FASE_05 = [
  authoredLesson({
    number: 21, module: 4, title: 'Leer documentos con seguridad',
    summary: 'Acepta solo archivos de texto permitidos y dentro de un tamaño razonable antes de leerlos.',
    concepts: [
      ['Carga local', 'Lectura de un archivo por el navegador sin subirlo a ningún servidor.'],
      ['Validación de archivo', 'Comprobación de extensión y tamaño antes de abrirlo.'],
    ],
    requires: ['buscar-top-k'],
    skill: 'aceptar-archivo',
    capacidad: { nombre: 'archivo_aceptado', descripcion: 'La zona Preparar datos del chat filtra lo que puede leer antes de intentarlo.' },
    integracion: 'El botón Cargar documento del TutorLocal pasa cada archivo por archivo_aceptado. Lo rechazado recibe una explicación concreta; lo aceptado avanza al lector local del navegador.',
    mentalModel: 'El chat es un comedor educado: mira el menú y el tamaño del plato antes de sentarse a la mesa.',
    script: [
      'El chat va a leer documentos tuyos. La lectura ocurre entera en tu navegador: nada se sube a servidor alguno.',
      'Antes de leer conviene filtrar. Extensiones de texto permitidas y un tamaño máximo evitan sorpresas como PDFs binarios o archivos gigantes.',
      'El ejemplo comprueba que el nombre termine en punto txt o punto md y que el tamaño respete el límite.',
      'Completa archivo_aceptado ignorando mayúsculas en la extensión. Las pruebas traerán formatos y tamaños variados.',
    ],
    javascript: {
      example: `function archivo_aceptado(nombre, tamanoKb, limiteKb) {
  const minusculas = nombre.toLowerCase();
  const formatoOk = minusculas.endsWith('.txt') || minusculas.endsWith('.md');
  return formatoOk && tamanoKb <= limiteKb;
}

console.log(archivo_aceptado('apuntes.TXT', 50, 200));`,
      starter: `function archivo_aceptado(nombre, tamanoKb, limiteKb) {
  // Acepta .txt y .md sin distinguir mayúsculas,
  // siempre que el tamaño respete el límite.
}`,
      solution: `function archivo_aceptado(nombre, tamanoKb, limiteKb) {
  const minusculas = nombre.toLowerCase();
  const formatoOk = minusculas.endsWith('.txt') || minusculas.endsWith('.md');
  return formatoOk && tamanoKb <= limiteKb;
}`,
      debugStarter: `function archivo_aceptado(nombre, tamanoKb, limiteKb) {
  return tamanoKb <= limiteKb;
}`,
    },
    python: {
      example: `def archivo_aceptado(nombre, tamano_kb, limite_kb):
    minusculas = nombre.lower()
    formato_ok = minusculas.endswith(".txt") or minusculas.endswith(".md")
    return formato_ok and tamano_kb <= limite_kb

print(archivo_aceptado("apuntes.TXT", 50, 200))`,
      starter: `def archivo_aceptado(nombre, tamano_kb, limite_kb):
    # Acepta .txt y .md sin distinguir mayúsculas,
    # siempre que el tamaño respete el límite.
    pass`,
      solution: `def archivo_aceptado(nombre, tamano_kb, limite_kb):
    minusculas = nombre.lower()
    formato_ok = minusculas.endswith(".txt") or minusculas.endswith(".md")
    return formato_ok and tamano_kb <= limite_kb`,
      debugStarter: `def archivo_aceptado(nombre, tamano_kb, limite_kb):
    return tamano_kb <= limite_kb`,
    },
    practice: {
      title: 'Filtra la puerta de datos',
      instructions: "Implementa archivo_aceptado(nombre, tamanoKb, limiteKb). Devuelve true solo para nombres terminados en .txt o .md sin distinguir mayúsculas y con tamaño igual o menor al límite.",
      functionName: 'archivo_aceptado',
      cases: [
        { args: ['apuntes.txt', 120, 200], expected: true, description: 'Un texto dentro del límite pasa' },
        { args: ['INFORME.PDF', 10, 200], expected: false, description: 'Un formato no permitido se rechaza aunque sea ligero' },
        { args: ['enciclopedia.txt', 900, 200], expected: false, description: 'Un tamaño excesivo se rechaza aunque el formato valga' },
        { args: ['Notas.MD', 40, 100], expected: true, description: 'Mayúsculas en la extensión no engañan al filtro' },
      ],
      hints: [
        'Normaliza el nombre a minúsculas una vez y comprueba cómo termina.',
        'Las dos condiciones deben cumplirse juntas.',
        'Compara el tamaño contra el límite incluyendo la igualdad.',
      ],
    },
    reading: {
      core: 'Todo pipeline de documentos empieza con una frontera: qué entra y qué no. Validar extensión y tamaño protege al usuario de errores confusos y al sistema de procesar cosas que no sabe leer.',
      mechanics: 'El navegador ofrece el archivo como objeto con nombre, tipo y peso sin enviarlo a ninguna parte. Tu filtro decide si procede; después FileReader o text() extraen el contenido en memoria. El documento original permanece en tu equipo durante todo el curso.',
      decisions: 'Empieza con formatos de texto plano porque se leen sin dependencias. Publica los límites junto al botón de carga. Cuando añadas formatos ricos, cada uno traerá su propio extractor y sus propias validaciones.',
      errors: 'Confiar en el tipo declarado por el sistema operativo permite colar ejecutables renombrados. Aceptar cualquier tamaño congela la pestaña con archivos enormes. Y olvidar normalizar mayúsculas rechaza archivos legítimos como NOTAS.TXT.',
      keyPoints: [
        'Validación primero, lectura después, servidor nunca.',
        'Los límites se publican, no se descubren por error.',
        'Cada formato nuevo trae su propio contrato de extracción.',
      ],
      question: '¿Por qué solo texto plano en este curso?',
      answer: 'Porque se lee con las herramientas del navegador sin dependencias ni riesgos. Los formatos binarios como PDF exigen extractores especializados y serán una extensión natural más adelante.',
      transfer: 'Define tu propia política de carga: tres formatos aceptados, dos rechazados y el mensaje exacto para cada rechazo.',
      sources: ['transformers-js', 'owasp-genai-top10'],
    },
    reasoning: {
      activity: decisionActivity('Decide qué hace el filtro con cada archivo.', [
        ['notas', 'notas.txt de cincuenta kilobytes', ['aceptar', 'rechazar'], 'aceptar'],
        ['binario', 'programa.exe renombrado a notas.txt', ['confiar', 'sospechar'], 'sospechar'],
        ['pesado', 'libro.md de quinientos megabytes', ['aceptar', 'rechazar'], 'rechazar'],
      ]),
      explanation: 'Extensión y tamaño filtran lo obvio, pero el contenido sigue siendo dato no confiable hasta procesarse con cuidado.',
      hints: ['La extensión describe, no garantiza.', 'Los límites existen para proteger la experiencia.'],
    },
    debug: {
      title: 'El tamaño manda solo',
      expected: 'Formato y tamaño participan juntos en la decisión.',
      observed: 'Cualquier archivo ligero pasa, sea cual sea su formato.',
      hints: ['Prueba un PDF diminuto.', 'Falta examinar el nombre.', 'Comprueba la terminación en minúsculas además del límite.'],
    },
  }),
  authoredLesson({
    number: 22, module: 4, title: 'Chunking: dividir el documento',
    summary: 'Divide el texto en fragmentos solapados configurables, conservando cada palabra.',
    concepts: [
      ['Fragmento', 'Trozo de documento con tamaño pensado para indexarse.'],
      ['Solapamiento', 'Palabras repetidas entre fragmentos vecinos para no cortar ideas por la mitad.'],
    ],
    requires: ['aceptar-archivo'],
    skill: 'dividir-chunks',
    capacidad: { nombre: 'dividir_documento', descripcion: 'El chat trocea cualquier texto tuyo con tamaño y solapamiento a tu gusto.' },
    integracion: 'dividir_documento alimenta la vista Fragmentos del TutorLocal: verás tu documento convertido en piezas numeradas y podrás cambiar tamaño y solapamiento observando el efecto al instante.',
    mentalModel: 'Partir un documento es cortar un tebeo en viñetas con margen compartido: cada viñeta conserva un trozo de la anterior para no perder el hilo.',
    script: [
      'Un documento entero no cabe bien en un embedding: se divide en fragmentos de tamaño controlado.',
      'El solapamiento repite algunas palabras entre fragmentos vecinos. Así una idea cortada por el corte vive completa en al menos una pieza.',
      'El ejemplo avanza con paso tamaño menos solapamiento y corta ventanas hasta cubrir todas las palabras, incluida la última incompleta.',
      'Completa dividir_documento y valida la configuración: solapamientos imposibles devuelven lista vacía en lugar de romper.',
    ],
    javascript: {
      example: `function dividir_documento(texto, tamano, solapamiento) {
  if (tamano < 1 || solapamiento < 0 || solapamiento >= tamano) return [];
  const palabras = texto.split(' ').filter(Boolean);
  const partes = [];
  const paso = tamano - solapamiento;
  for (let i = 0; i < palabras.length; i += paso) {
    partes.push(palabras.slice(i, i + tamano).join(' '));
  }
  return partes;
}

console.log(dividir_documento('a b c d e f g', 3, 1));`,
      starter: `function dividir_documento(texto, tamano, solapamiento) {
  // Configuración imposible devuelve [].
  // Avanza con paso tamaño menos solapamiento
  // y conserva el último grupo incompleto.
}`,
      solution: `function dividir_documento(texto, tamano, solapamiento) {
  if (tamano < 1 || solapamiento < 0 || solapamiento >= tamano) return [];
  const palabras = texto.split(' ').filter(Boolean);
  const partes = [];
  const paso = tamano - solapamiento;
  for (let i = 0; i < palabras.length; i += paso) {
    partes.push(palabras.slice(i, i + tamano).join(' '));
  }
  return partes;
}`,
      debugStarter: `function dividir_documento(texto, tamano, solapamiento) {
  const palabras = texto.split(' ').filter(Boolean);
  return [palabras.slice(0, tamano).join(' ')];
}`,
    },
    python: {
      example: `def dividir_documento(texto, tamano, solapamiento):
    if tamano < 1 or solapamiento < 0 or solapamiento >= tamano:
        return []
    palabras = [p for p in texto.split(" ") if p]
    partes = []
    paso = tamano - solapamiento
    for i in range(0, len(palabras), paso):
        partes.append(" ".join(palabras[i:i + tamano]))
    return partes

print(dividir_documento("a b c d e f g", 3, 1))`,
      starter: `def dividir_documento(texto, tamano, solapamiento):
    # Configuración imposible devuelve [].
    # Avanza con paso tamaño menos solapamiento
    # y conserva el último grupo incompleto.
    pass`,
      solution: `def dividir_documento(texto, tamano, solapamiento):
    if tamano < 1 or solapamiento < 0 or solapamiento >= tamano:
        return []
    palabras = [p for p in texto.split(" ") if p]
    partes = []
    paso = tamano - solapamiento
    for i in range(0, len(palabras), paso):
        partes.append(" ".join(palabras[i:i + tamano]))
    return partes`,
      debugStarter: `def dividir_documento(texto, tamano, solapamiento):
    palabras = texto.split(" ")
    return [" ".join(palabras[:tamano])]`,
    },
    practice: {
      title: 'Corta con margen',
      instructions: 'Implementa dividir_documento(texto, tamano, solapamiento). Divide por palabras con ventanas de tamaño dado, avance igual a tamaño menos solapamiento y último grupo incompleto permitido. Configuraciones imposibles devuelven lista vacía.',
      functionName: 'dividir_documento',
      cases: [
        { args: ['a b c d e f g', 3, 1], expected: ['a b c', 'c d e', 'e f g', 'g'], description: 'Solape de una palabra comparte frontera entre piezas' },
        { args: ['uno dos tres cuatro', 2, 0], expected: ['uno dos', 'tres cuatro'], description: 'Sin solape las ventanas no repiten contenido' },
        { args: ['hola mundo', 5, 5], expected: [], description: 'Solapamiento igual al tamaño es imposible' },
        { args: ['solo', 4, 0], expected: ['solo'], description: 'Texto corto produce una única pieza' },
      ],
      hints: [
        'Calcula el paso restando el solapamiento al tamaño; ese será tu salto entre cortes.',
        'Traza siete palabras con tamaño tres y solape uno sobre papel antes de codificar.',
        'La validación de configuración va antes de partir nada.',
      ],
    },
    reading: {
      core: 'Chunking equilibra dos tensiones: fragmentos grandes dan contexto pero diluyen el significado del embedding; pequeños puntúan fino pero pierden el hilo. El solapamiento suaviza las fronteras repitiendo un margen entre piezas vecinas.',
      mechanics: 'El algoritmo avanza con paso igual a tamaño menos solapamiento, así cada ventana arranca donde la anterior tenía contenido vivo. La última ventana puede quedar incompleta y eso está bien. Cada pieza recibirá después identificador y metadatos de procedencia.',
      decisions: 'Empieza con valores clásicos como tamaño ocho palabras y solape dos, luego experimenta con el panel del chat. Documentos con listas o tablas merecen reglas propias. Mide el efecto con consultas reales: el número correcto es el que recupera bien tu material.',
      errors: 'Solapamiento mayor o igual al tamaño hace que el avance sea nulo o negativo y el bucle se descontrola. Partir por caracteres rompe palabras. Y solapes enormes duplican evidencia y sesgan los rankings hacia las fronteras.',
      keyPoints: [
        'Tamaño y solapamiento son knobs con efectos observables.',
        'Configuración imposible se rechaza con lista vacía, no con caída.',
        'La última pieza incompleta conserva el final del documento.',
      ],
      question: '¿Cuál es el tamaño de fragmento perfecto?',
      answer: 'No existe universal. Depende del tipo de documento, del modelo de embeddings y de tus consultas. Usa el panel del chat para comparar configuraciones con preguntas reales y quédate con la que recupere mejor.',
      transfer: 'Toma un párrafo tuyo y divídelo a mano con tamaño cinco y solape dos. Compara tu resultado con el de la función.',
      sources: ['rag-paper', 'qdrant-vector-search'],
    },
    reasoning: {
      activity: flowActivity('Ordena la ingesta de un documento en el chat.', [
        ['leer', 'Leer el texto completo', 'start'],
        ['partir', 'Dividir en fragmentos', 'process'],
        ['identificar', 'Numerar cada fragmento', 'process'],
        ['vectorizar', 'Calcular embeddings', 'process'],
        ['indexar', 'Guardar en el índice', 'end'],
      ], [
        ['leer', 'partir'],
        ['partir', 'identificar'],
        ['identificar', 'vectorizar'],
        ['vectorizar', 'indexar'],
      ]),
      explanation: 'Primero se lee, luego se parte, después cada pieza gana identidad y vector. El índice llega al final con todo ordenado.',
      hints: ['No hay embeddings sin fragmentos previos.', 'La numeración precede al cálculo pesado.'],
    },
    debug: {
      title: 'Solo existe la primera viñeta',
      expected: 'Todas las ventanas aparecen, incluida la final incompleta.',
      observed: 'La función corta una sola vez y descarta el resto del texto.',
      hints: ['Prueba siete palabras con tamaño tres.', 'Falta repetir el corte avanzando el índice.', 'Suma el paso en cada vuelta hasta agotar las palabras.'],
    },
  }),
  authoredLesson({
    number: 23, module: 4, title: 'Fragmentos con identidad',
    summary: 'Numera cada fragmento con un identificador estable que viajará hasta las citas.',
    concepts: [
      ['Identificador estable', 'Nombre predecible que permite referirse a una pieza sin ambigüedad.'],
      ['Procedencia', 'Registro del origen de cada dato: documento y posición.'],
    ],
    requires: ['dividir-chunks'],
    skill: 'identificar-fragmentos',
    capacidad: { nombre: 'numerar_fragmentos', descripcion: 'Cada pieza del documento lleva matrícula propia, requisito para citar después.' },
    integracion: 'Tras dividir, el TutorLocal llama a numerar_fragmentos. Esos identificadores aparecerán en la vista de fragmentos, en el ranking de recuperación y finalmente dentro de las citas de la respuesta.',
    mentalModel: 'Sin matrícula no hay cita: cada fragmento necesita un nombre que sobreviva a búsquedas y rankings.',
    script: [
      'Una cita útil apunta a una pieza concreta de un documento concreto. Para eso, cada fragmento necesita un identificador estable.',
      'La fórmula sencilla une el nombre del documento con la posición del fragmento usando dos puntos como separador.',
      'El ejemplo transforma una lista de textos en objetos con id y texto. La posición empieza en cero y crece con el orden.',
      'Completa numerar_fragmentos sin fijar nombres. Las pruebas usarán documentos y cantidades distintas.',
    ],
    javascript: {
      example: `function numerar_fragmentos(documentoId, textos) {
  return textos.map((texto, posicion) => ({ id: documentoId + ':' + posicion, texto }));
}

console.log(numerar_fragmentos('manual', ['paso uno', 'paso dos']));`,
      starter: `function numerar_fragmentos(documentoId, textos) {
  // Devuelve objetos con id 'documento:posicion' y el texto.
}`,
      solution: `function numerar_fragmentos(documentoId, textos) {
  return textos.map((texto, posicion) => ({ id: documentoId + ':' + posicion, texto }));
}`,
      debugStarter: `function numerar_fragmentos(documentoId, textos) {
  return textos.map((texto) => ({ id: documentoId, texto }));
}`,
    },
    python: {
      example: `def numerar_fragmentos(id_documento, textos):
    return [{"id": f"{id_documento}:{posicion}", "texto": texto} for posicion, texto in enumerate(textos)]

print(numerar_fragmentos("manual", ["paso uno", "paso dos"]))`,
      starter: `def numerar_fragmentos(id_documento, textos):
    # Devuelve objetos con id 'documento:posicion' y el texto.
    pass`,
      solution: `def numerar_fragmentos(id_documento, textos):
    return [{"id": f"{id_documento}:{posicion}", "texto": texto} for posicion, texto in enumerate(textos)]`,
      debugStarter: `def numerar_fragmentos(id_documento, textos):
    return [{"id": id_documento, "texto": texto} for texto in textos]`,
    },
    practice: {
      title: 'Pon matrículas',
      instructions: "Implementa numerar_fragmentos(documentoId, textos). Devuelve objetos con id formado por documento, dos puntos y posición empezando en cero, junto al texto recibido.",
      functionName: 'numerar_fragmentos',
      cases: [
        { args: ['manual', ['paso uno', 'paso dos']], expected: [{ id: 'manual:0', texto: 'paso uno' }, { id: 'manual:1', texto: 'paso dos' }], description: 'Dos piezas del mismo documento obtienen matrículas distintas' },
        { args: ['politica', []], expected: [], description: 'Documento sin fragmentos no inventa piezas' },
        { args: ['faq', ['respuesta']], expected: [{ id: 'faq:0', texto: 'respuesta' }], description: 'Otro documento usa su propio prefijo' },
      ],
      hints: [
        'Recorre la lista llevando la cuenta de la posición actual.',
        'El identificador une documento, dos puntos y número.',
        'Cada objeto lleva exactamente los campos id y texto.',
      ],
    },
    reading: {
      core: 'Los identificadores estables convierten fragmentos anónimos en piezas citables. Un id que combina documento y posición se puede reconstruir, verificar y explicar ante cualquiera que pregunte de dónde salió una frase.',
      mechanics: 'La numeración ocurre justo después de dividir y antes de calcular vectores. El mismo documento procesado dos veces produce los mismos ids, lo que permite actualizar sin duplicar. Los metadatos adicionales, como fecha o sección, acompañan al id cuando existan.',
      decisions: 'Prefiere identificadores deterministas antes que aleatorios: permiten reingestas idempotentes. Incluye el nombre del documento en el id para evitar colisiones entre archivos. Si cambias el algoritmo de división, asume que los ids cambian y reindexa.',
      errors: 'Usar el mismo id para todos los fragmentos impide citar con precisión. Ids aleatorios en cada ingesta multiplican duplicados silenciosos. Y numerar desde uno cuando el resto del sistema espera cero crea confusiones difíciles de rastrear.',
      keyPoints: [
        'Documento más posición componen un id estable y explicable.',
        'Mismos datos producen mismos ids: eso permite actualizar sin duplicar.',
        'El id nace antes del embedding y sobrevive hasta la cita.',
      ],
      question: '¿Puedo usar números aleatorios como ids?',
      answer: 'Funciona mientras no vuelvas a ingestar, pero rompe la reingesta: el mismo fragmento recibiría otra matrícula y aparecería duplicado. Los ids deterministas hacen el proceso repetible.',
      transfer: 'Inventa un esquema de ids para una enciclopedia con volúmenes y páginas. ¿Qué campos incluirías?',
      sources: ['rag-paper', 'qdrant-vector-search'],
    },
    reasoning: {
      activity: decisionActivity('Evalúa cada esquema de identificadores.', [
        ['estable', 'Manual punto tres para el cuarto fragmento', ['estable', 'frágil'], 'estable'],
        ['aleatorio', 'Número aleatorio nuevo en cada ingesta', ['estable', 'frágil'], 'frágil'],
        ['repetido', 'El mismo id para todos los fragmentos', ['estable', 'frágil'], 'frágil'],
      ]),
      explanation: 'Un id sirve si se puede reconstruir y distinguir. Determinismo y unicidad son sus dos requisitos.',
      hints: ['Imagina reingestar el mismo documento.', 'Citar exige apuntar a una sola pieza.'],
    },
    debug: {
      title: 'Todos los fragmentos comparten matrícula',
      expected: 'La posición distingue piezas dentro del documento.',
      observed: 'Todos los ids coinciden con el nombre del documento.',
      hints: ['Compara los ids resultantes de dos piezas.', 'Falta incorporar el índice del recorrido.', 'Une documento, dos puntos y posición.'],
    },
  }),
  authoredLesson({
    number: 24, module: 4, title: 'Recuperar los fragmentos pertinentes',
    summary: 'Combina puntuación, umbral de calidad y top-k para decidir qué piezas llegan al modelo.',
    concepts: [
      ['Umbral', 'Puntuación mínima exigida a un candidato para participar.'],
      ['Ranking filtrado', 'Orden descendente aplicado solo a quienes superan el umbral.'],
    ],
    requires: ['identificar-fragmentos'],
    skill: 'recuperar-contexto',
    capacidad: { nombre: 'recuperar_contexto', descripcion: 'El panel Recuperación muestra qué fragmentos pasaron el filtro y por qué puntuación.' },
    integracion: 'recuperar_contexto es el corazón del buscador interno del chat: puntúa tu índice contra la pregunta, aplica el umbral y entrega el top-k con el que se construirá el contexto.',
    mentalModel: 'El umbral es el control de calidad del club: sin puntuación suficiente no se entra, aunque queden plazas libres.',
    script: [
      'Buscar bien no es traer mucho: es traer lo que supera una barra mínima de relación con la pregunta.',
      'El flujo puntúa cada candidato, descarta a los que quedan bajo el umbral, ordena descendente y corta en k plazas.',
      'El ejemplo reutiliza score_consulta de la Fase cuatro y añade las dos decisiones nuevas: umbral y corte.',
      'Completa recuperar_contexto respetando el orden de filtros. Con índice vacío la respuesta es una lista vacía.',
    ],
    javascript: {
      example: `// Pieza de la Fase 4, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function recuperar_contexto(consulta, indice, k, umbral) {
  return indice
    .map((f) => ({ id: f.id, puntos: score_consulta(consulta, f.vector) }))
    .filter((f) => f.puntos >= umbral)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, k)
    .map((f) => f.id);
}

console.log(recuperar_contexto([1, 0], [{ id: 'a', vector: [1, 1] }, { id: 'b', vector: [0, 2] }], 2, 0.5));`,
      starter: `// Pieza de la Fase 4, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function recuperar_contexto(consulta, indice, k, umbral) {
  // Puntúa, filtra por umbral, ordena descendente
  // y devuelve los ids del top-k.
}`,
      solution: `// Pieza de la Fase 4, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function recuperar_contexto(consulta, indice, k, umbral) {
  return indice
    .map((f) => ({ id: f.id, puntos: score_consulta(consulta, f.vector) }))
    .filter((f) => f.puntos >= umbral)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, k)
    .map((f) => f.id);
}`,
      debugStarter: `// Pieza de la Fase 4, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function recuperar_contexto(consulta, indice, k, umbral) {
  return indice.slice(0, k).map((f) => f.id);
}`,
    },
    python: {
      example: `# Pieza de la Fase 4, ya resuelta y disponible:
def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

def recuperar_contexto(consulta, indice, k, umbral):
    puntuados = [{"id": f["id"], "puntos": score_consulta(consulta, f["vector"])} for f in indice]
    validos = [f for f in puntuados if f["puntos"] >= umbral]
    ordenados = sorted(validos, key=lambda f: f["puntos"], reverse=True)
    return [f["id"] for f in ordenados[:k]]

print(recuperar_contexto([1, 0], [{"id": "a", "vector": [1, 1]}, {"id": "b", "vector": [0, 2]}], 2, 0.5))`,
      starter: `# Pieza de la Fase 4, ya resuelta y disponible:
def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

def recuperar_contexto(consulta, indice, k, umbral):
    # Puntúa, filtra por umbral, ordena descendente
    # y devuelve los ids del top-k.
    pass`,
      solution: `# Pieza de la Fase 4, ya resuelta y disponible:
def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

def recuperar_contexto(consulta, indice, k, umbral):
    puntuados = [{"id": f["id"], "puntos": score_consulta(consulta, f["vector"])} for f in indice]
    validos = [f for f in puntuados if f["puntos"] >= umbral]
    ordenados = sorted(validos, key=lambda f: f["puntos"], reverse=True)
    return [f["id"] for f in ordenados[:k]]`,
      debugStarter: `def recuperar_contexto(consulta, indice, k, umbral):
    return [f["id"] for f in indice[:k]]`,
    },
    practice: {
      title: 'Aplica el control de calidad',
      instructions: 'Implementa recuperar_contexto(consulta, indice, k, umbral). Puntúa cada candidato con score_consulta, conserva solo los que alcanzan el umbral, ordena descendente y devuelve los ids del top-k.',
      functionName: 'recuperar_contexto',
      cases: [
        { args: [[1, 0], [{ id: 'a', vector: [1, 1] }, { id: 'b', vector: [0, 2] }, { id: 'c', vector: [2, 0] }], 2, 0.5], expected: ['c', 'a'], description: 'Solo quienes superan el umbral compiten por las plazas' },
        { args: [[1, 0], [{ id: 'a', vector: [1, 1] }, { id: 'b', vector: [0, 2] }, { id: 'c', vector: [2, 0] }], 3, 1.5], expected: ['c'], description: 'Umbral estricto deja fuera a casi todos' },
        { args: [[1, 1], [], 3, 0], expected: [], description: 'Índice vacío devuelve lista vacía' },
      ],
      hints: [
        'El orden correcto es puntuar, filtrar, ordenar y cortar.',
        'Alcanzar exactamente el umbral cuenta como aprobado.',
        'El filtro actúa sobre puntuaciones; el corte actúa sobre posiciones.',
      ],
    },
    reading: {
      core: 'Entre buscar y generar existe una decisión editorial: qué candidatos merecen entrar. Umbral y top-k expresan esa política. El umbral protege contra relaciones flojas; k limita cuántas voces hablan en el contexto.',
      mechanics: 'La puntuación viene de la métrica acordada con el modelo de embeddings. El filtro compara contra el umbral con igualdad incluida. Ordenar antes de cortar garantiza que las plazas las ocupen los mejores supervivientes, no los primeros de la fila.',
      decisions: 'Subir el umbral reduce ruido y riesgo de abstención por falta de piezas; bajarlo invita al contexto irrelevante. Ajusta ambos controles con consultas reales y observa el panel de recuperación: cada cambio debe explicarse en puntuaciones visibles.',
      errors: 'Cortar antes de filtrar llena plazas con candidatos flojos. Umbral cero admite cualquier cosa con puntuación positiva. Y confiar en el orden del índice como ranking hereda el azar de la ingesta.',
      keyPoints: [
        'Puntuar, filtrar, ordenar y cortar: el orden define la política.',
        'El umbral incluye la igualdad; el corte decide plazas.',
        'Ver puntuaciones en pantalla convierte la magia en criterio.',
      ],
      question: '¿Qué pasa si nadie supera el umbral?',
      answer: 'Se recupera una lista vacía y el chat entrará en modo directo o abstendrá según su política. Esa señal es valiosa: indica que el documento probablemente no contiene la respuesta.',
      transfer: 'Elige umbral y k para un chat médico y para uno de ocio. Justifica la diferencia con el coste del error.',
      sources: ['qdrant-vector-search', 'rag-paper'],
    },
    reasoning: {
      activity: vectorRankingActivity('Ordena los supervivientes tras aplicar umbral cero coma cinco.', [
        ['manual', 'Fragmento del manual, punto nueve', 0.9],
        ['faq', 'Fragmento de faq, punto seis', 0.6],
        ['chisme', 'Fragmento ajeno, punto dos', 0.2],
      ]),
      explanation: 'El chisme queda bajo el umbral y ni compite. Los otros dos se ordenan por puntuación y ocupan las plazas disponibles.',
      hints: ['Primero elimina a quien no llega al umbral.', 'Después ordena por valor.'],
    },
    debug: {
      title: 'El umbral decora',
      expected: 'Nadie bajo el umbral ocupa plaza.',
      observed: 'Se entregan los primeros ids sin mirar puntuaciones.',
      hints: ['Baja todos los vectores y observa quién entra.', 'Ni filtro ni orden participan hoy.', 'Puntúa, filtra por umbral, ordena y corta.'],
    },
  }),
  authoredLesson({
    number: 25, module: 4, title: 'Presupuesto de contexto',
    summary: 'Selecciona fragmentos completos hasta agotar el presupuesto de tokens sin partir piezas.',
    concepts: [
      ['Presupuesto de tokens', 'Espacio máximo que el contexto recuperado puede ocupar.'],
      ['Selección acumulativa', 'Añadir bloques completos mientras el total respete el límite.'],
    ],
    requires: ['recuperar-contexto'],
    skill: 'presupuestar-bloques',
    capacidad: { nombre: 'construir_contexto', descripcion: 'El chat arma el paquete de evidencia cabiendo piezas enteras dentro del cupo de tokens.' },
    integracion: 'Después del ranking, construir_contexto decide qué entra realmente en cada llamada del chat. El panel Contexto mostrará incluidos y descartes con sus razones: presupuesto alcanzado o pieza demasiado grande.',
    mentalModel: 'El contexto es una maleta de capacidad fija: metes piezas enteras en orden de utilidad hasta que la siguiente ya no cabe.',
    script: [
      'Los fragmentos recuperados compiten por un espacio limitado de tokens. Alguien debe decidir quiénes viajan.',
      'La política honesta recorre la lista por prioridad, suma tokens y solo añade piezas enteras que quepan. Nada se parte a escondidas.',
      'El ejemplo mantiene un contador acumulado. Si la siguiente pieza excede el cupo, se salta y se sigue probando con las demás.',
      'Completa construir_contexto con el acumulador. Las pruebas combinarán piezas grandes y pequeñas en órdenes distintos.',
    ],
    javascript: {
      example: `function construir_contexto(bloques, presupuesto) {
  const elegidos = [];
  let usados = 0;
  for (const bloque of bloques) {
    if (usados + bloque.tokens <= presupuesto) {
      elegidos.push(bloque.id);
      usados += bloque.tokens;
    }
  }
  return elegidos;
}

console.log(construir_contexto([{ id: 'a', tokens: 2 }, { id: 'b', tokens: 3 }, { id: 'c', tokens: 4 }], 5));`,
      starter: `function construir_contexto(bloques, presupuesto) {
  // Añade bloques enteros mientras el total acumulado quepa.
  // Un bloque que no cabe se salta; el recorrido continúa.
}`,
      solution: `function construir_contexto(bloques, presupuesto) {
  const elegidos = [];
  let usados = 0;
  for (const bloque of bloques) {
    if (usados + bloque.tokens <= presupuesto) {
      elegidos.push(bloque.id);
      usados += bloque.tokens;
    }
  }
  return elegidos;
}`,
      debugStarter: `function construir_contexto(bloques, presupuesto) {
  return bloques.filter((b) => b.tokens <= presupuesto).map((b) => b.id);
}`,
    },
    python: {
      example: `def construir_contexto(bloques, presupuesto):
    elegidos = []
    usados = 0
    for bloque in bloques:
        if usados + bloque["tokens"] <= presupuesto:
            elegidos.append(bloque["id"])
            usados += bloque["tokens"]
    return elegidos

print(construir_contexto([{"id": "a", "tokens": 2}, {"id": "b", "tokens": 3}, {"id": "c", "tokens": 4}], 5))`,
      starter: `def construir_contexto(bloques, presupuesto):
    # Añade bloques enteros mientras el total acumulado quepa.
    # Un bloque que no cabe se salta; el recorrido continúa.
    pass`,
      solution: `def construir_contexto(bloques, presupuesto):
    elegidos = []
    usados = 0
    for bloque in bloques:
        if usados + bloque["tokens"] <= presupuesto:
            elegidos.append(bloque["id"])
            usados += bloque["tokens"]
    return elegidos`,
      debugStarter: `def construir_contexto(bloques, presupuesto):
    return [b["id"] for b in bloques if b["tokens"] <= presupuesto]`,
    },
    practice: {
      title: 'Llena la maleta',
      instructions: 'Implementa construir_contexto(bloques, presupuesto). Cada bloque trae id y tokens. Añade bloques enteros mientras el total acumulado respete el presupuesto; salta los que no caben y continúa con el resto.',
      functionName: 'construir_contexto',
      cases: [
        { args: [[{ id: 'a', tokens: 2 }, { id: 'b', tokens: 3 }, { id: 'c', tokens: 4 }], 5], expected: ['a', 'b'], description: 'El tercero excede el cupo y se descarta' },
        { args: [[{ id: 'grande', tokens: 10 }, { id: 's1', tokens: 2 }, { id: 's2', tokens: 2 }], 4], expected: ['s1', 's2'], description: 'Saltar al grande permite aprovechar a los pequeños' },
        { args: [[{ id: 'unico', tokens: 1 }], 5], expected: ['unico'], description: 'Sobrar espacio no impide llevar lo disponible' },
      ],
      hints: [
        'Necesitas recordar cuántos tokens has gastado hasta ahora.',
        'La comparación usa el acumulado más el candidato, no el candidato solo.',
        'Descartar un bloque no termina el recorrido.',
      ],
    },
    reading: {
      core: 'El presupuesto de contexto obliga a priorizar. Una maleta bien hecha lleva piezas completas en orden de utilidad y documenta lo que se quedó fuera. Esa documentación convierte un corte técnico en una decisión explicable.',
      mechanics: 'El selector recorre bloques ya ordenados por relevancia, mantiene el total gastado y añade solo quien cabe entero. El registro de descartes acompaña al paquete: saber que el bloque grande no cupo explica respuestas que ignoran esa parte del documento.',
      decisions: 'Reserva primero lo obligatorio, como instrucciones, y reparte el resto por ranking. Registrar razones de descarte cuesta poco y paga en depuración. Si muchas piezas útiles quedan fuera, quizá toca reducir el tamaño de fragmento o subir el presupuesto.',
      errors: 'Comparar cada bloque contra el presupuesto total ignora lo ya gastado y desborda. Detener el recorrido al primer bloque que no cabe desperdicia piezas menores valiosas. Partir bloques silenciosamente rompe frases y citas.',
      keyPoints: [
        'El presupuesto es acumulado, no individual.',
        'Piezas enteras viajan; las que no caben quedan registradas.',
        'Un descarte documentado explica futuras respuestas parciales.',
      ],
      question: '¿Debería llenar siempre el presupuesto completo?',
      answer: 'No necesariamente. Espacio libre ahorra coste y latencia, y evita meter relleno. Añade bloques porque aporten, no para completar la maleta.',
      transfer: 'Con presupuesto diez y cinco bloques de pesos variados, decide a mano qué llevarías y qué registrarías como descartado.',
      sources: ['anthropic-prompt-caching', 'hf-llm-course'],
    },
    reasoning: {
      activity: contextBudgetActivity('Arma el contexto con un presupuesto de diez tokens.', 10, [
        ['instruccion', 'Instrucción del sistema', 3, true],
        ['pregunta', 'Pregunta del usuario', 2, true],
        ['manual-a', 'Fragmento manual A', 3],
        ['historial', 'Historial antiguo', 6],
      ], ['instruccion', 'pregunta', 'manual-a']),
      explanation: 'Lo obligatorio gasta cinco. Entre los opcionales, el fragmento del manual cabe exactamente; el historial antiguo excede y se descarta con razón.',
      hints: ['Los obligatorios consumen cinco tokens.', 'Quedan cinco para los opcionales.'],
    },
    debug: {
      title: 'Cada bloque parece caber',
      expected: 'El total acumulado nunca supera el presupuesto.',
      observed: 'Cada bloque se compara solo contra el máximo y la suma desborda.',
      hints: ['Prueba bloques de cuatro y cuatro con cupo de seis.', 'Falta memoria de lo gastado.', 'Lleva un acumulador y súmalo al candidato antes de decidir.'],
    },
  }),
  authoredLesson({
    number: 26, module: 4, title: 'El modo RAG del chat',
    summary: 'Enruta cada pregunta entre generación directa y generación con documentos, llevando el contexto consigo.',
    concepts: [
      ['RAG', 'Generación aumentada con recuperación: responder apoyándose en documentos recuperados.'],
      ['Modo directo', 'Responder sin evidencia externa, con el conocimiento general del modelo.'],
    ],
    requires: ['presupuestar-bloques'],
    skill: 'activar-rag',
    capacidad: { nombre: 'preparar_rag', descripcion: 'El despachador distingue preguntas con documentos de preguntas libres y adjunta el contexto elegido.' },
    integracion: 'preparar_rag se sienta entre el input y montar_conversacion. Con documentos seleccionados activa el modo rag y adjunta el contexto; sin ellos declara modo directo. La interfaz del chat muestra siempre qué modo corre.',
    mentalModel: 'RAG es examen con libros abiertos: si hay libros sobre la mesa se consultan; si no, se contesta con lo aprendido y se dice.',
    script: [
      'No toda pregunta necesita documentos. RAG vale la pena cuando hay evidencia pertinente que aportar.',
      'Hoy construimos el enrutador: si el contexto recuperado trae fragmentos, el modo es rag y el paquete lleva la evidencia; si no, modo directo y contexto vacío.',
      'El ejemplo devuelve un objeto con pregunta, modo y contexto. Ese objeto alimentará al modelo con transparencia total sobre qué usó.',
      'Completa preparar_rag con la condición sobre la cantidad de fragmentos. Las pruebas alternarán contextos llenos y vacíos.',
    ],
    javascript: {
      example: `function preparar_rag(pregunta, fragmentos) {
  const hayEvidencia = fragmentos.length > 0;
  return {
    pregunta,
    modo: hayEvidencia ? 'rag' : 'directo',
    contexto: [...fragmentos],
  };
}

console.log(preparar_rag('¿Cuál es el horario?', ['frag-1']));`,
      starter: `function preparar_rag(pregunta, fragmentos) {
  // Devuelve { pregunta, modo, contexto }.
  // Con fragmentos el modo es 'rag'; sin ellos, 'directo'.
}`,
      solution: `function preparar_rag(pregunta, fragmentos) {
  const hayEvidencia = fragmentos.length > 0;
  return {
    pregunta,
    modo: hayEvidencia ? 'rag' : 'directo',
    contexto: [...fragmentos],
  };
}`,
      debugStarter: `function preparar_rag(pregunta, fragmentos) {
  return { pregunta, modo: 'rag', contexto: [...fragmentos] };
}`,
    },
    python: {
      example: `def preparar_rag(pregunta, fragmentos):
    hay_evidencia = len(fragmentos) > 0
    return {
        "pregunta": pregunta,
        "modo": "rag" if hay_evidencia else "directo",
        "contexto": list(fragmentos),
    }

print(preparar_rag("¿Cuál es el horario?", ["frag-1"]))`,
      starter: `def preparar_rag(pregunta, fragmentos):
    # Devuelve {"pregunta", "modo", "contexto"}.
    # Con fragmentos el modo es 'rag'; sin ellos, 'directo'.
    pass`,
      solution: `def preparar_rag(pregunta, fragmentos):
    hay_evidencia = len(fragmentos) > 0
    return {
        "pregunta": pregunta,
        "modo": "rag" if hay_evidencia else "directo",
        "contexto": list(fragmentos),
    }`,
      debugStarter: `def preparar_rag(pregunta, fragmentos):
    return {"pregunta": pregunta, "modo": "rag", "contexto": list(fragmentos)}`,
    },
    practice: {
      title: 'Abre el libro adecuado',
      instructions: "Implementa preparar_rag(pregunta, fragmentos). Devuelve un objeto con la pregunta, el modo rag cuando haya fragmentos o directo en caso contrario, y una copia de los fragmentos como contexto.",
      functionName: 'preparar_rag',
      cases: [
        { args: ['¿Cuál es el horario?', ['frag-1', 'frag-2']], expected: { pregunta: '¿Cuál es el horario?', modo: 'rag', contexto: ['frag-1', 'frag-2'] }, description: 'Con evidencia el modo rag lleva el contexto completo' },
        { args: ['Recomiéndame una lectura', []], expected: { pregunta: 'Recomiéndame una lectura', modo: 'directo', contexto: [] }, description: 'Sin evidencia el chat declara modo directo' },
      ],
      hints: [
        'La cantidad de fragmentos decide el modo; revisa la condición.',
        'El contexto copia la lista para que nadie la muté por detrás.',
        'Los tres campos del objeto tienen nombres exactos: pregunta, modo y contexto.',
      ],
    },
    reading: {
      core: 'RAG significa responder consultando fuentes recuperadas en lugar de fiarlo todo a la memoria del modelo. Su valor aparece con conocimiento privado, cambiante o citable. Saber cuándo no usarlo también forma parte del diseño.',
      mechanics: 'El enrutador inspecciona el resultado de recuperación. Con fragmentos, el paquete incluye contexto y la instrucción pedirá basarse en él; sin ellos, la pregunta viaja limpia. En ambas ramas el objeto registra el modo para que la interfaz y las métricas puedan auditarlo.',
      decisions: 'Activa rag automáticamente cuando el umbral dejó supervivientes y muestra el interruptor en pantalla para experimentar. Declara el modo en cada respuesta: mezclar modos sin avisar destruye la confianza en las citas.',
      errors: 'Forzar rag con contexto vacío empuja al modelo a inventar sobre nada. Ocultar el modo impide interpretar respuestas sin citas. Y pegar los documentos dentro del mensaje del usuario borra la frontera entre datos y petición.',
      keyPoints: [
        'El modo depende de la evidencia disponible, no del capricho.',
        'El objeto transporta pregunta, modo y contexto juntos.',
        'Mostrar el modo activo es parte del contrato con quien lee.',
      ],
      question: '¿RAG hace que el modelo sea más listo?',
      answer: 'No cambia sus capacidades: cambia lo que ve en esta llamada. Le da acceso a tus hechos y la oportunidad de citarlos. La inteligencia para usarlos sigue siendo del modelo y de tu validación.',
      transfer: 'Piensa tres preguntas tuyas: ¿cuál usaría modo rag, cuál directo y por qué?',
      sources: ['rag-paper', 'langchain-retrieval'],
    },
    reasoning: {
      activity: decisionActivity('Elige el modo correcto para cada turno.', [
        ['horario', 'Hay dos fragmentos del manual con el horario', ['rag', 'directo'], 'rag'],
        ['creativo', 'Pide un chiste y el umbral dejó el índice vacío', ['rag', 'directo'], 'directo'],
        ['oculto', 'Hay evidencia pero prefieres no mostrar el modo', ['transparente', 'engañoso'], 'engañoso'],
      ]),
      explanation: 'El modo sigue a la evidencia y se declara siempre. Ocultarlo rompe la auditabilidad que las citas necesitan.',
      hints: ['Contexto con piezas implica rag.', 'Declarar el modo es parte de la honestidad del sistema.'],
    },
    debug: {
      title: 'Siempre abre el libro',
      expected: 'Sin fragmentos el modo es directo y el contexto vacío.',
      observed: 'El modo rag se devuelve incluso sin evidencia.',
      hints: ['Prueba con una lista vacía.', 'El modo fijo ignora los fragmentos.', 'Deriva el modo de la cantidad de piezas.'],
    },
  }),
  authoredLesson({
    number: 27, module: 4, title: 'Citas verificables',
    summary: 'Filtra las referencias de una respuesta contra los fragmentos realmente enviados, sin duplicados.',
    concepts: [
      ['Cita', 'Referencia a un fragmento enviado que respalda una afirmación.'],
      ['Cita inventada', 'Identificador que nunca estuvo en el contexto y debe eliminarse.'],
    ],
    requires: ['activar-rag'],
    skill: 'verificar-citas',
    capacidad: { nombre: 'filtrar_citas', descripcion: 'Las citas que muestra cada respuesta pertenecen, una por una, al contexto real.' },
    integracion: 'Antes de pintar las marcas de cita bajo la respuesta, el TutorLocal pasa la lista por filtrar_citas. Lo que no estaba en el contexto desaparece; lo válido queda en orden y sin repetidos.',
    mentalModel: 'Una cita es un ticket de entrada: solo vale si corresponde a la función a la que se dijo que asististe.',
    script: [
      'Pedir citas no basta: el modelo puede mencionar fragmentos que nunca enviamos. La verificación es tarea del programa.',
      'El filtro conserva los identificadores presentes en el contexto, respeta el orden original y elimina repetidos para no inflar la evidencia.',
      'El ejemplo recorre los ids usados y guarda los que pertenecen al conjunto enviado, llevando la cuenta de los ya vistos.',
      'Completa filtrar_citas con las tres reglas. Las pruebas incluyen inventadas, repetidas y válidas mezcladas.',
    ],
    javascript: {
      example: `function filtrar_citas(usadas, enviadas) {
  const conjunto = new Set(enviadas);
  const vistas = new Set();
  const limpias = [];
  for (const id of usadas) {
    if (conjunto.has(id) && !vistas.has(id)) {
      vistas.add(id);
      limpias.push(id);
    }
  }
  return limpias;
}

console.log(filtrar_citas(['d2', 'd9', 'd2', 'd1'], ['d1', 'd2']));`,
      starter: `function filtrar_citas(usadas, enviadas) {
  // Conserva solo ids presentes en enviadas,
  // en el orden original y sin duplicados.
}`,
      solution: `function filtrar_citas(usadas, enviadas) {
  const conjunto = new Set(enviadas);
  const vistas = new Set();
  const limpias = [];
  for (const id of usadas) {
    if (conjunto.has(id) && !vistas.has(id)) {
      vistas.add(id);
      limpias.push(id);
    }
  }
  return limpias;
}`,
      debugStarter: `function filtrar_citas(usadas, enviadas) {
  return usadas;
}`,
    },
    python: {
      example: `def filtrar_citas(usadas, enviadas):
    conjunto = set(enviadas)
    vistas = set()
    limpias = []
    for id_fragmento in usadas:
        if id_fragmento in conjunto and id_fragmento not in vistas:
            vistas.add(id_fragmento)
            limpias.append(id_fragmento)
    return limpias

print(filtrar_citas(["d2", "d9", "d2", "d1"], ["d1", "d2"]))`,
      starter: `def filtrar_citas(usadas, enviadas):
    # Conserva solo ids presentes en enviadas,
    # en el orden original y sin duplicados.
    pass`,
      solution: `def filtrar_citas(usadas, enviadas):
    conjunto = set(enviadas)
    vistas = set()
    limpias = []
    for id_fragmento in usadas:
        if id_fragmento in conjunto and id_fragmento not in vistas:
            vistas.add(id_fragmento)
            limpias.append(id_fragmento)
    return limpias`,
      debugStarter: `def filtrar_citas(usadas, enviadas):
    return usadas`,
    },
    practice: {
      title: 'Audita los tickets',
      instructions: 'Implementa filtrar_citas(usadas, enviadas). Conserva los ids usados que figuren entre los enviados, mantén el orden original y elimina duplicados.',
      functionName: 'filtrar_citas',
      cases: [
        { args: [['d2', 'd9', 'd2', 'd1'], ['d1', 'd2']], expected: ['d2', 'd1'], description: 'La inventada desaparece y el repetido no se infla' },
        { args: [['x9'], ['d1', 'd2']], expected: [], description: 'Nada legítimo, lista vacía' },
        { args: [[], ['d1']], expected: [], description: 'Respuesta sin citas no genera evidencia' },
      ],
      hints: [
        'Convertir enviadas en conjunto hace la pertenencia rápida.',
        'Un segundo conjunto recuerda qué ids ya aceptaste.',
        'El orden lo marca la lista usadas, no la enviadas.',
      ],
    },
    reading: {
      core: 'Las citas transforman una respuesta en algo auditable: cada afirmación importante puede rastrearse hasta su fragmento. Pero una cita solo vale si el fragmento estuvo realmente en el contexto. Validarla es tan obligatorio como pedirla.',
      mechanics: 'La verificación compara cada id propuesto contra el conjunto exacto enviado en el paquete. Se conservan orden y unicidad para que la UI pinte marcas limpias. Las citas eliminadas se registran como incidencia: indican que el modelo intentó decorar su respuesta.',
      decisions: 'Muestra las citas como chips clicables que abren el fragmento. Registra cuántas fueron descartadas: un patrón alto sugiere prompts débiles. Nunca sustituyas citas eliminadas por otras inventadas por el sistema.',
      errors: 'Confiar en los ids del modelo sin comprobarlos fabrica evidencia falsa. Eliminar duplicados cambiando el orden desorienta a quien contrasta. Y castigar toda la respuesta por una cita mala desperdicia el resto de la evidencia válida.',
      keyPoints: [
        'Solo cuentan citas cuyo fragmento viajó en el paquete.',
        'Orden original y sin duplicados: la evidencia no se infla.',
        'Las citas eliminadas son señal de diagnóstico, no ruido.',
      ],
      question: '¿Una cita válida garantiza que la afirmación es cierta?',
      answer: 'Garantiza trazabilidad, no verdad: el fragmento pudo malinterpretarse. Por eso la evaluación de respuestas de la próxima fase mide también si la cita respalda el contenido y no solamente si existe.',
      transfer: 'Revisa una respuesta con citas de cualquier app y clasifica cada marca: verificable, vaga o puramente decorativa.',
      sources: ['rag-paper', 'ragas-metrics'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena la auditoría de citas de una respuesta.', [
        ['enviado', 'Recordar qué fragmentos viajaron'],
        ['proponer', 'Leer los ids propuestos'],
        ['cruzar', 'Cruzar propuesta contra enviado'],
        ['limpiar', 'Eliminar inventadas y repetidas'],
        ['mostrar', 'Pintar las citas válidas'],
      ]),
      explanation: 'La auditoría compara siempre contra la realidad del paquete enviado, nunca contra la memoria del modelo.',
      hints: ['El conjunto enviado es la única fuente de verdad.', 'Limpiar precede a pintar.'],
    },
    debug: {
      title: 'Las citas se aceptan sin revisar',
      expected: 'Solo pasan ids presentes en el contexto enviado.',
      observed: 'Devuelve la lista tal cual llegó, inventadas incluidas.',
      hints: ['Busca un id que nunca viajó.', 'Falta cruzar contra enviadas.', 'Además de filtrar, recuerda eliminar duplicados conservando el orden.'],
    },
  }),
  authoredLesson({
    number: 28, module: 4, title: 'Abstenerse cuando falta evidencia',
    summary: 'Declara que no hay base suficiente en lugar de fabricar una respuesta convincente.',
    concepts: [
      ['Abstención', 'Respuesta explícita de insuficiencia de evidencia.'],
      ['Umbral de respuesta', 'Puntuación mínima de la mejor evidencia para intentar contestar.'],
    ],
    requires: ['verificar-citas'],
    skill: 'decidir-abstencion',
    capacidad: { nombre: 'decidir_abstencion', descripcion: 'Cuando el documento calla, el chat lo dice: aparece la tarjeta de abstención en lugar de una ficción.' },
    integracion: 'Con el ranking vacío o raquítico, decidir_abstencion activa la tarjeta No encuentro eso en tu documento, que sugiere reformular la pregunta. En el TutorLocal, decir no sé pasa a ser una respuesta de primera clase.',
    mentalModel: 'Mejor un no informado que un sí inventado: la abstención es el freno de mano del chat.',
    script: [
      'El peor fallo de un chat educativo no es no saber: es inventar con seguridad. La abstención existe para eso.',
      'La regla compara la mejor puntuación de recuperación contra un umbral. Alcanzarlo exacto cuenta como suficiente para intentarlo.',
      'El ejemplo devuelve responder o abstenerse según esa comparación. La decisión pertenece al programa, no al entusiasmo del modelo.',
      'Completa decidir_abstencion incluyendo la igualdad. Las pruebas rozarán el umbral por arriba y por abajo.',
    ],
    javascript: {
      example: `function decidir_abstencion(mejorPuntuacion, umbral) {
  return mejorPuntuacion >= umbral ? 'responder' : 'abstenerse';
}

console.log(decidir_abstencion(0.82, 0.5));`,
      starter: `function decidir_abstencion(mejorPuntuacion, umbral) {
  // 'responder' cuando la mejor puntuación alcanza el umbral.
}`,
      solution: `function decidir_abstencion(mejorPuntuacion, umbral) {
  return mejorPuntuacion >= umbral ? 'responder' : 'abstenerse';
}`,
      debugStarter: `function decidir_abstencion(mejorPuntuacion, umbral) {
  return 'responder';
}`,
    },
    python: {
      example: `def decidir_abstencion(mejor_puntuacion, umbral):
    return "responder" if mejor_puntuacion >= umbral else "abstenerse"

print(decidir_abstencion(0.82, 0.5))`,
      starter: `def decidir_abstencion(mejor_puntuacion, umbral):
    # 'responder' cuando la mejor puntuación alcanza el umbral.
    pass`,
      solution: `def decidir_abstencion(mejor_puntuacion, umbral):
    return "responder" if mejor_puntuacion >= umbral else "abstenerse"`,
      debugStarter: `def decidir_abstencion(mejor_puntuacion, umbral):
    return "responder"`,
    },
    practice: {
      title: 'Aprende a decir no',
      instructions: "Implementa decidir_abstencion(mejorPuntuacion, umbral). Devuelve 'responder' cuando la mejor puntuación alcance el umbral, incluida la igualdad, y 'abstenerse' en caso contrario.",
      functionName: 'decidir_abstencion',
      cases: [
        { args: [0.82, 0.5], expected: 'responder', description: 'Buena evidencia autoriza el intento' },
        { args: [0.21, 0.5], expected: 'abstenerse', description: 'Relación débil invita a declararlo' },
        { args: [0.5, 0.5], expected: 'responder', description: 'Tocar el umbral exacto todavía sirve' },
      ],
      hints: [
        'La comparación clave incluye el caso de igualdad.',
        'Solo interviene la mejor puntuación, no el promedio.',
        'Devuelve una de las dos cadenas exactas.',
      ],
    },
    reading: {
      core: 'Un sistema honesto necesita una salida digna para la ignorancia. La abstención comunica que el documento no contiene la respuesta, evita fabricaciones y enseña a quien pregunta a reformular o buscar otra fuente.',
      mechanics: 'La decisión usa la mejor evidencia disponible frente al umbral acordado. Con abstención, el flujo salta la llamada al generador y presenta una tarjeta explicativa con sugerencias. Todo el episodio queda registrado para métricas de cobertura del corpus.',
      decisions: 'Calibra el umbral observando dónde empiezan las respuestas malas de tu propio documento. Redacta el mensaje de abstención con utilidad: qué pasó, qué probar. Distingue abstención de error técnico: una es conocimiento del corpus, la otra es un fallo del sistema.',
      errors: 'Obligar al modelo a responder siempre fabrica ficciones con tono seguro. Un umbral altísimo convierte el chat en un muro. Confundir abstención con error rompe la confianza en ambas direcciones y ensucia las métricas.',
      keyPoints: [
        'Decir no sé con elegancia es una capacidad diseñada.',
        'La mejor puntuación frente al umbral decide el intento.',
        'La tarjeta de abstención educa en lugar de dejar en blanco.',
      ],
      question: '¿No debería el modelo decir solo que no sabe?',
      answer: 'Los modelos tienden a complacer y rellenar. Delegar la decisión en tu código con umbrales visibles produce conducta consistente, evaluable y ajustable sin rezar.',
      transfer: 'Redacta el texto exacto de tu tarjeta de abstención: qué informa, qué sugiere y qué tono usa.',
      sources: ['rag-paper', 'deepeval-evaluation'],
    },
    reasoning: {
      activity: decisionActivity('Decide la salida para cada situación.', [
        ['fuerte', 'Mejor puntuación cero coma nueve con umbral cero coma cinco', ['responder', 'abstenerse'], 'responder'],
        ['floja', 'Mejor puntuación cero coma uno con umbral cero coma cinco', ['responder', 'abstenerse'], 'abstenerse'],
        ['inventada', 'Sin evidencia pero presión por responder algo', ['fabricar', 'abstener'], 'abstener'],
      ]),
      explanation: 'La evidencia decide. Bajo el umbral, la salida honesta es la tarjeta de abstención, jamás una ficción complaciente.',
      hints: ['Compara contra el umbral con igualdad.', 'Fabricar nunca es una opción del sistema.'],
    },
    debug: {
      title: 'El chat nunca duda',
      expected: 'Evidencia débil conduce a abstenerse.',
      observed: 'La función responde siempre, sin mirar puntuaciones.',
      hints: ['Prueba la puntuación baja con umbral alto.', 'La respuesta fija ignora ambos argumentos.', 'Compara la mejor puntuación contra el umbral incluyendo igualdad.'],
    },
  }),
];
