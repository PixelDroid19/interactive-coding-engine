import { authoredLesson, decisionActivity, sequenceActivity, vectorRankingActivity } from '../authoring';

// Fase 4: Embeddings y búsqueda semántica.
// El TutorLocal aprende a representar significado con vectores reales
// calculados por Transformers.js sobre WebGPU, y a buscar en ellos.

export const AI_FASE_04 = [
  authoredLesson({
    number: 17, module: 3, title: 'Embeddings: significado convertido en vectores',
    summary: 'Entiende un embedding como una lista de números comparable y aprende a validar su forma.',
    concepts: [
      ['Embedding', 'Vector producido por un modelo que representa el contenido de un texto.'],
      ['Dimensión', 'Cantidad de coordenadas del vector, fija para cada modelo.'],
    ],
    requires: ['preparar-webllm'],
    skill: 'entender-vectores',
    capacidad: { nombre: 'vector_valido', descripcion: 'El chat rechaza vectores mal formados antes de mezclarlos con su índice.' },
    integracion: 'Cada vez que Transformers.js devuelve vectores al TutorLocal, vector_valido comprueba dimensión y contenido. Así una actualización del modelo nunca contamina silenciosamente la búsqueda.',
    mentalModel: 'Un embedding es una posición en un mapa de significado: textos parecidos quedan cerca sin compartir palabras.',
    script: [
      'Un embedding convierte un texto en una lista de números con longitud fija. Esa lista se llama vector y su tamaño, dimensión.',
      'Lo importante no es leer cada número sino comparar posiciones. Textos con significado parecido producen vectores cercanos aunque usen otras palabras.',
      'El ejemplo valida la forma antes de aceptar un vector: longitud esperada y todas las coordenadas numéricas finitas.',
      'Completa vector_valido con las tres comprobaciones. Las pruebas traen longitudes equivocadas y coordenadas tramposas.',
    ],
    javascript: {
      example: `function vector_valido(vector, dimension) {
  if (dimension <= 0) return false;
  if (vector.length !== dimension) return false;
  return vector.every((valor) => typeof valor === 'number' && Number.isFinite(valor));
}

console.log(vector_valido([0.1, 0.2], 2));`,
      starter: `function vector_valido(vector, dimension) {
  // Exige dimensión positiva, longitud coincidente
  // y coordenadas numéricas finitas.
}`,
      solution: `function vector_valido(vector, dimension) {
  if (dimension <= 0) return false;
  if (vector.length !== dimension) return false;
  return vector.every((valor) => typeof valor === 'number' && Number.isFinite(valor));
}`,
      debugStarter: `function vector_valido(vector, dimension) {
  return vector[0] === vector[0];
}`,
    },
    python: {
      example: `import math

def vector_valido(vector, dimension):
    if dimension <= 0:
        return False
    if len(vector) != dimension:
        return False
    return all(isinstance(v, (int, float)) and math.isfinite(v) for v in vector)

print(vector_valido([0.1, 0.2], 2))`,
      starter: `import math

def vector_valido(vector, dimension):
    # Exige dimensión positiva, longitud coincidente
    # y coordenadas numéricas finitas.
    pass`,
      solution: `import math

def vector_valido(vector, dimension):
    if dimension <= 0:
        return False
    if len(vector) != dimension:
        return False
    return all(isinstance(v, (int, float)) and math.isfinite(v) for v in vector)`,
      debugStarter: `def vector_valido(vector, dimension):
    return True`,
    },
    practice: {
      title: 'Acepta solo vectores sanos',
      instructions: 'Implementa vector_valido(vector, dimension). Devuelve true solo si la dimensión pedida es positiva, la longitud coincide y cada coordenada es un número finito.',
      functionName: 'vector_valido',
      cases: [
        { args: [[0.12, -0.4, 0.9], 3], expected: true, description: 'Acepta un vector completo con decimales y negativos' },
        { args: [[0.1, 0.2, 0.3], 2], expected: false, description: 'Rechaza una longitud que no coincide' },
        { args: [[0.1, 'x'], 2], expected: false, description: 'Rechaza coordenadas que no son número' },
        { args: [[1], 0], expected: false, description: 'Una dimensión nula no representa nada' },
      ],
      hints: [
        'La dimensión pedida merece su propio chequeo antes de mirar el vector.',
        'Compara longitudes completas; el primer elemento no basta.',
        'Recorre todas las coordenadas comprobando tipo y finitud.',
      ],
    },
    reading: {
      core: 'Los modelos de embeddings traducen texto a posiciones numéricas donde las distancias reflejan relaciones de significado aprendidas durante el entrenamiento. La utilidad depende del modelo, del idioma y de la tarea; ninguna coordenada tiene significado humano aislado.',
      mechanics: 'El modelo tokeniza el texto, lo procesa por capas y condensa el resultado en un vector, normalmente normalizado a longitud uno. Todos los elementos de tu índice deben provenir del mismo modelo y preprocesamiento: mezclar vectores de modelos distintos carece de contrato.',
      decisions: 'Elige un modelo multilingüe pequeño para español y anota su identificador junto a cada índice. Si cambias de modelo, recalcula todo el índice. Guarda también la dimensión esperada para validar entradas como acabas de hacer.',
      errors: 'Buscar el significado de una coordenada concreta desemboca en lecturas inventadas. Aceptar vectores de cualquier origen rompe la comparación. Y confundir similitud alta con verdad hace que el chat repita errores del documento con confianza.',
      keyPoints: [
        'El embedding es una posición comparable, no un texto legible.',
        'La dimensión pertenece al modelo y se valida en la frontera.',
        'Modelo y preprocesamiento forman parte de la identidad del índice.',
      ],
      question: '¿Puedo decir qué significa cada número del vector?',
      answer: 'No de forma aislada. El significado está distribuido entre todas las coordenadas y depende del entrenamiento. Lo observable es la relación entre vectores, no la lectura individual.',
      transfer: 'Explica con tus palabras por qué dos preguntas distintas sobre contraseñas acabarían cerca en el mapa de significado.',
      sources: ['sentence-transformers-semantic-search', 'transformers-js'],
    },
    reasoning: {
      activity: decisionActivity('Decide qué comparaciones tienen contrato.', [
        ['mismo', 'Vectores del mismo modelo y misma dimensión', ['comparable', 'incomparable'], 'comparable'],
        ['mezcla', 'Uno del modelo A y otro del modelo B', ['comparable', 'incomparable'], 'incomparable'],
        ['vacio', 'Dos listas vacías', ['comparable', 'incomparable'], 'incomparable'],
      ]),
      explanation: 'Comparar exige mismo modelo, mismo preprocesamiento y misma forma. Sin eso, los números no cuentan la misma historia.',
      hints: ['Pregunta de dónde salió cada vector.', 'Vacío no representa ningún contenido.'],
    },
    debug: {
      title: 'Todo vector parece válido',
      expected: 'Forma completa y coordenadas numéricas se comprueban.',
      observed: 'Basta que exista el primer elemento para aceptar.',
      hints: ['Prueba una coordenada de texto.', 'Comparar consigo mismo no valida nada.', 'Exige dimensión positiva, longitud exacta y tipos numéricos.'],
    },
  }),
  authoredLesson({
    number: 18, module: 3, title: 'Embeddings reales con Transformers.js y WebGPU',
    summary: 'Normaliza la salida del modelo real y entiende el recorrido desde texto hasta vector en tu GPU.',
    concepts: [
      ['Transformers.js', 'Biblioteca que ejecuta modelos compatibles dentro del navegador.'],
      ['Normalización', 'Ajuste del vector a longitud uno para comparar direcciones justamente.'],
      ['WebGPU', 'Ruta de cálculo que ejecuta el modelo en la GPU del dispositivo.'],
    ],
    requires: ['entender-vectores'],
    skill: 'normalizar-salida',
    capacidad: { nombre: 'normalizar_vector', descripcion: 'Todos los vectores del índice del chat quedan en la misma escala antes de competir.' },
    integracion: 'En el laboratorio verás a Transformers.js descargar el modelo y producir vectores WebGPU reales. normalizar_vector es el último paso de ese recorrido y el primero del índice del TutorLocal.',
    mentalModel: 'Normalizar mide solo dirección: dos frases apuntando al mismo sitio obtienen la misma puntuación aunque una sea más larga.',
    script: [
      'Hoy toca modelo real: Transformers.js descarga artefactos, los guarda en caché y calcula embeddings en tu GPU mediante WebGPU.',
      'Antes de comparar vectores conviene igualar su escala. Normalizar divide cada coordenada entre la longitud del vector y deja la medida en uno.',
      'El ejemplo usa el clásico tres cuatro cinco: la raíz de nueve más dieciséis es cinco y el vector queda con coordenadas punto seis y punto ocho.',
      'Completa normalizar_vector protegiendo el vector cero. Dividir entre cero no es opción: devuelve ceros.',
    ],
    javascript: {
      example: `function normalizar_vector(vector) {
  const norma = Math.hypot(...vector);
  return norma === 0 ? vector.map(() => 0) : vector.map((valor) => valor / norma);
}

console.log(normalizar_vector([3, 4]));`,
      starter: `function normalizar_vector(vector) {
  // Divide cada coordenada por la norma L2.
  // Norma cero devuelve un vector de ceros.
}`,
      solution: `function normalizar_vector(vector) {
  const norma = Math.hypot(...vector);
  return norma === 0 ? vector.map(() => 0) : vector.map((valor) => valor / norma);
}`,
      debugStarter: `function normalizar_vector(vector) {
  const suma = vector.reduce((total, valor) => total + valor, 0);
  return vector.map((valor) => valor / suma);
}`,
    },
    python: {
      example: `import math

def normalizar_vector(vector):
    norma = math.sqrt(sum(v * v for v in vector))
    if norma == 0:
        return [0 for _ in vector]
    return [v / norma for v in vector]

print(normalizar_vector([3, 4]))`,
      starter: `import math

def normalizar_vector(vector):
    # Divide cada coordenada por la norma L2.
    # Norma cero devuelve un vector de ceros.
    pass`,
      solution: `import math

def normalizar_vector(vector):
    norma = math.sqrt(sum(v * v for v in vector))
    if norma == 0:
        return [0 for _ in vector]
    return [v / norma for v in vector]`,
      debugStarter: `def normalizar_vector(vector):
    total = sum(vector)
    return [v / total for v in vector]`,
    },
    practice: {
      title: 'Iguala la escala',
      instructions: 'Implementa normalizar_vector(vector). Calcula la norma L2, divide cada coordenada entre ella y devuelve ceros cuando la norma sea cero.',
      functionName: 'normalizar_vector',
      cases: [
        { args: [[3, 4]], expected: [0.6, 0.8], description: 'El triángulo clásico produce el vector unitario conocido' },
        { args: [[0, 0]], expected: [0, 0], description: 'Sin magnitud no hay división posible' },
        { args: [[10]], expected: [1], description: 'Un solo eje queda exactamente en uno' },
      ],
      hints: [
        'La norma eleva al cuadrado, suma y saca la raíz; hay helpers para eso.',
        'Todas las coordenadas se dividen entre la misma norma.',
        'Detecta la norma nula antes de dividir y responde con ceros.',
      ],
    },
    reading: {
      core: 'El laboratorio de esta clase ejecuta un pipeline de extracción de características con Transformers.js dentro de un Worker. El texto nunca sale hacia una API de modelo: la primera carga descarga artefactos y después la caché del navegador puede servirlos.',
      mechanics: 'El servicio envía el lote de textos, recibe progreso archivo a archivo, ejecuta el modelo con WebGPU, aplica promediado y normalización y devuelve los vectores en el orden pedido. La señal de cancelación descarta la operación sin dejar estados sucios.',
      decisions: 'Muestra siempre qué modelo corre, en qué dispositivo y en qué estado va la descarga. Si WebGPU falla, enseña el error real con una explicación educativa. Los vectores falsos o hash están prohibidos en este curso: preferimos el error honesto.',
      errors: 'Presentar un hash como embedding engaña sobre capacidades reales del sistema. Cargar el modelo al abrir la aplicación penaliza a quien aún no lo necesita. Y omitir la normalización sesga las comparaciones hacia textos largos.',
      keyPoints: [
        'El modelo se carga bajo demanda y corre en la GPU local.',
        'El orden del lote llega intacto; confiar en él simplifica el índice.',
        'Normalización previa hace justas las comparaciones de dirección.',
      ],
      question: '¿Mi texto sale del navegador?',
      answer: 'No se envía a ninguna API de modelo. La descarga inicial sí necesita red para traer los artefactos; después la caché puede reutilizarlos sin conexión.',
      transfer: 'Abre el laboratorio, lanza la práctica WebGPU y anota modelo, dispositivo y tiempo de primera carga frente a la segunda.',
      sources: ['transformers-js', 'transformers-js-v4', 'hf-model-hub'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el recorrido de un texto hasta el índice.', [
        ['texto', 'Texto entra al Worker'],
        ['modelo', 'Modelo WebGPU procesa'],
        ['salida', 'Vector crudo sale del modelo'],
        ['norma', 'Normalización ajusta escala'],
        ['indice', 'Vector entra al índice del chat'],
      ]),
      explanation: 'La normalización vive entre el modelo y el índice: garantiza que todas las posiciones compitan en la misma escala.',
      hints: ['El vector crudo aún no está listo para competir.', 'El índice recibe la última versión preparada.'],
    },
    debug: {
      title: 'Divide por la suma',
      expected: 'La norma euclidiana gobierna la división.',
      observed: 'La función divide entre la suma simple de coordenadas.',
      hints: ['Prueba el vector tres coma cuatro.', 'Sumar directo da siete, no cinco.', 'Eleva al cuadrado, suma, saca raíz y divide.'],
    },
  }),
  authoredLesson({
    number: 19, module: 3, title: 'Comparar vectores: producto punto y coseno',
    summary: 'Puntúa la relación entre consulta y fragmento con el producto interno y sus salvaguardas.',
    concepts: [
      ['Producto punto', 'Suma de productos coordenada a coordenada entre dos vectores.'],
      ['Similitud coseno', 'Medida del ángulo entre vectores; coincide con el producto punto cuando ambos están normalizados.'],
    ],
    requires: ['normalizar-salida'],
    skill: 'comparar-vectores',
    capacidad: { nombre: 'score_consulta', descripcion: 'Cada fragmento del documento recibe una puntuación de relación frente a la pregunta.' },
    integracion: 'Al llegar una pregunta, el TutorLocal llama a score_consulta contra cada fragmento indexado. Esas puntuaciones alimentan el ranking visible del panel Recuperación.',
    mentalModel: 'Producto punto multiplica coincidencias y castiga contradicciones; con vectores normalizados equivale al coseno del ángulo entre significados.',
    script: [
      'Para saber qué fragmento responde mejor a la pregunta comparamos sus vectores con el de la consulta.',
      'El producto punto multiplica coordenadas correspondientes y suma todo. Con vectores normalizados, ese número es directamente la similitud coseno.',
      'El ejemplo recorre pares de coordenadas y acumula productos. Vectores de longitudes distintas devuelven cero porque no tienen contrato.',
      'Completa score_consulta con las salvaguardas. Las pruebas traen ortogonales, vacías y tamaños dispares.',
    ],
    javascript: {
      example: `function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

console.log(score_consulta([1, 2], [3, 4]));`,
      starter: `function score_consulta(a, b) {
  // Suma los productos coordenada a coordenada.
  // Longitudes distintas o vacías devuelven cero.
}`,
      solution: `function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}`,
      debugStarter: `function score_consulta(a, b) {
  return a.reduce((total, valor) => total + valor, 0);
}`,
    },
    python: {
      example: `def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

print(score_consulta([1, 2], [3, 4]))`,
      starter: `def score_consulta(a, b):
    # Suma los productos coordenada a coordenada.
    # Longitudes distintas o vacías devuelven cero.
    pass`,
      solution: `def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))`,
      debugStarter: `def score_consulta(a, b):
    return sum(a)`,
    },
    practice: {
      title: 'Puntúa la relación',
      instructions: 'Implementa score_consulta(a, b). Multiplica coordenadas correspondientes, suma el total y aplica las salvaguardas: longitudes distintas o vacías valen cero.',
      functionName: 'score_consulta',
      cases: [
        { args: [[1, 2], [3, 4]], expected: 11, description: 'Los productos sumados dan once' },
        { args: [[1, 0], [0, 5]], expected: 0, description: 'Direcciones ortogonales no comparten nada' },
        { args: [[2, -1], [-2, 1]], expected: -5, description: 'Los signos opuestos restan relación' },
        { args: [[1, 2, 3], [4, 5]], expected: 0, description: 'Formas incompatibles no tienen contrato' },
      ],
      hints: [
        'Necesitas visitar ambas listas con el mismo índice en cada paso.',
        'Multiplicar antes de sumar; el orden de los factores no importa.',
        'Las salvaguardas van antes del bucle para responder rápido.',
      ],
    },
    reading: {
      core: 'Comparar vectores tiene métricas con significados distintos. El producto punto mezcla dirección y magnitud; el coseno mira solo el ángulo; la distancia euclidiana mide separación. Con vectores normalizados, producto punto y coseno coinciden, y por eso normalizamos en la clase anterior.',
      mechanics: 'La puntuación recorre índices compartidos multiplicando pares. Un cero limpio para formas incompatibles evita propagar NaN por el ranking. En producción, Transformers.js entrega vectores ya normalizados, así que este producto es directamente el coseno.',
      mechanicsExample: `score_consulta([1, 0], [0, 5])
→ 0`,
      decisions: 'Sigue la recomendación de la model card del modelo elegido respecto a la métrica. Evalúa el ranking completo con consultas reales en lugar de fiarte de umbrales universales. Y recuerda que la puntuación expresa relación estadística, no probabilidad de verdad.',
      errors: 'Comparar vectores de modelos distintos produce números sin sentido. Olvidar normalizar favorece a textos largos con magnitudes mayores. Interpretar cero coma ocho como ochenta por ciento de acierto confunde similitud con precisión.',
      keyPoints: [
        'Producto punto sobre normalizados equivale al coseno.',
        'Formas incompatibles devuelven cero, nunca explotan.',
        'La puntuación ordena candidatos; no certifica hechos.',
      ],
      question: '¿Qué valor de similitud es suficiente?',
      answer: 'Depende del modelo, del corpus y de la tarea. Se calibra observando pares positivos y negativos de tu dominio, no copiando umbrales de tutoriales.',
      transfer: 'Calcula a mano el producto punto de dos vectores pequeños y compruébalo con tu función.',
      sources: ['sentence-transformers-semantic-search', 'qdrant-vector-search'],
    },
    reasoning: {
      activity: decisionActivity('Elige la afirmación correcta.', [
        ['normalizados', 'Con ambos vectores normalizados', ['producto punto es coseno', 'el coseno es una probabilidad'], 'producto punto es coseno'],
        ['escala', 'Si un vector duplica su magnitud sin cambiar dirección', ['el coseno cambia', 'el coseno se mantiene'], 'el coseno se mantiene'],
      ]),
      explanation: 'La normalización elimina la magnitud del juego. Por eso el coseno se mantiene ante escalados y el producto punto coincide con él.',
      hints: ['El coseno mira el ángulo, no la longitud.', 'Similitud no es probabilidad.'],
    },
    debug: {
      title: 'El segundo vector no participa',
      expected: 'Ambos vectores aportan productos coordinados.',
      observed: 'Solo se suma el contenido del primero.',
      hints: ['Cambia el segundo vector y observa que nada varía.', 'Falta usar el índice para cruzar listas.', 'Multiplica cada elemento por su par antes de acumular.'],
    },
  }),
  authoredLesson({
    number: 20, module: 3, title: 'Búsqueda semántica sobre tus notas',
    summary: 'Ranking top-k de fragmentos por puntuación, listo para conectar con documentos reales.',
    concepts: [
      ['Búsqueda semántica', 'Recuperación ordenada por cercanía de significado entre consulta y contenidos.'],
      ['Top-k', 'Cantidad máxima de resultados que se devuelven.'],
    ],
    requires: ['comparar-vectores'],
    skill: 'buscar-top-k',
    capacidad: { nombre: 'buscar_fragmentos', descripcion: 'El chat contesta a cualquier consulta libre con el ranking de fragmentos pertinentes.' },
    integracion: 'buscar_fragmentos activa el panel Búsqueda del TutorLocal: escribes una consulta, el motor puntúa tus notas y ves el ranking con puntuaciones. En la próxima fase esas notas serán documentos enteros.',
    mentalModel: 'La búsqueda semántica convierte la pregunta en un punto del mapa y devuelve los vecinos más próximos, ordenados.',
    script: [
      'Con consultas y fragmentos convertidos en vectores, buscar es puntuar cada candidato y ordenar.',
      'El flujo repite tres gestos: puntuar todos, ordenar descendente y cortar en k resultados.',
      'El ejemplo reutiliza el producto interno de la clase anterior dentro de un ranking. Copiamos la lista antes de ordenar para no tocar el índice original.',
      'Completa buscar_fragmentos sin depender del orden de entrada. Las pruebas moverán los mejores candidatos a posiciones incómodas.',
    ],
    javascript: {
      example: `// Pieza de la clase anterior, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function buscar_fragmentos(consulta, fragmentos, k) {
  const puntuados = fragmentos.map((f) => ({ id: f.id, puntos: score_consulta(consulta, f.vector) }));
  const ordenados = [...puntuados].sort((a, b) => b.puntos - a.puntos);
  return ordenados.slice(0, k).map((f) => f.id);
}

const indice = [
  { id: 'nota-1', vector: [0.9, 0.1] },
  { id: 'nota-2', vector: [0.2, 0.9] },
];
console.log(buscar_fragmentos([1, 0], indice, 1));
// nota-1`,
      starter: `// Pieza de la clase anterior, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function buscar_fragmentos(consulta, fragmentos, k) {
  // Puntúa cada fragmento con score_consulta,
  // ordena descendente y devuelve los ids del top-k.
}`,
      solution: `// Pieza de la clase anterior, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function buscar_fragmentos(consulta, fragmentos, k) {
  const puntuados = fragmentos.map((f) => ({ id: f.id, puntos: score_consulta(consulta, f.vector) }));
  const ordenados = [...puntuados].sort((a, b) => b.puntos - a.puntos);
  return ordenados.slice(0, k).map((f) => f.id);
}`,
      debugStarter: `// Pieza de la clase anterior, ya resuelta y disponible:
function score_consulta(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * b[i];
  return total;
}

function buscar_fragmentos(consulta, fragmentos, k) {
  return fragmentos.slice(0, k).map((f) => f.id);
}`,
    },
    python: {
      example: `def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

def buscar_fragmentos(consulta, fragmentos, k):
    puntuados = [{"id": f["id"], "puntos": score_consulta(consulta, f["vector"])} for f in fragmentos]
    ordenados = sorted(puntuados, key=lambda f: f["puntos"], reverse=True)
    return [f["id"] for f in ordenados[:k]]

indice = [
    {"id": "nota-1", "vector": [0.9, 0.1]},
    {"id": "nota-2", "vector": [0.2, 0.9]},
]
print(buscar_fragmentos([1, 0], indice, 1))`,
      starter: `def buscar_fragmentos(consulta, fragmentos, k):
    # Puntúa cada fragmento con el producto interno,
    # ordena descendente y devuelve los ids del top-k.
    pass`,
      solution: `def score_consulta(a, b):
    if len(a) != len(b) or len(a) == 0:
        return 0
    return sum(x * y for x, y in zip(a, b))

def buscar_fragmentos(consulta, fragmentos, k):
    puntuados = [{"id": f["id"], "puntos": score_consulta(consulta, f["vector"])} for f in fragmentos]
    ordenados = sorted(puntuados, key=lambda f: f["puntos"], reverse=True)
    return [f["id"] for f in ordenados[:k]]`,
      debugStarter: `def buscar_fragmentos(consulta, fragmentos, k):
    return [f["id"] for f in fragmentos[:k]]`,
    },
    practice: {
      title: 'Devuelve los vecinos',
      instructions: 'Implementa buscar_fragmentos(consulta, fragmentos, k). Cada fragmento trae id y vector. Puntúa con el producto interno, ordena de mayor a menor y devuelve los ids del top-k.',
      functionName: 'buscar_fragmentos',
      cases: [
        { args: [[1, 0], [{ id: 'a', vector: [0.9, 0.1] }, { id: 'b', vector: [0.1, 0.95] }, { id: 'c', vector: [1, 0.05] }], 2], expected: ['c', 'a'], description: 'Los dos vecinos más próximos encabezan el ranking' },
        { args: [[0.5, 0.5], [{ id: 'x', vector: [1, 1] }, { id: 'y', vector: [0.2, 0.2] }], 1], expected: ['x'], description: 'El corte respeta el k pedido' },
        { args: [[1, 1], [], 3], expected: [], description: 'Índice vacío devuelve lista vacía' },
      ],
      hints: [
        'Primero construye pares de id y puntuación; ordenar viene después.',
        'Copiar antes de ordenar protege el índice original.',
        'El corte final decide cuántos ids sobreviven.',
      ],
    },
    reading: {
      core: 'La búsqueda semántica recupera candidatos por cercanía de significado, no por coincidencia literal. Eso permite encontrar la nota de claves escribiendo contraseña. Sigue siendo un ranking estadístico: propone vecinos, no verdades.',
      mechanics: 'El pipeline puntúa cada fragmento con la métrica acordada, ordena descendente y corta en k. Las puntuaciones viajan junto a los ids para explicar el orden. Con corpus grandes aparecerían índices aproximados; con miles de fragmentos, el cálculo directo es honesto y suficiente.',
      decisions: 'Elige k según lo que consumirá el siguiente paso: pocos fragmentos concentran contexto, muchos diluyen. Muestra puntuaciones en la interfaz para que puedas detectar recuperaciones absurdas. Y combina con búsqueda léxica cuando tu dominio tenga códigos exactos.',
      errors: 'Confundir el primer resultado con la respuesta correcta ignora que el ranking puede estar mal. Un k enorme arrastra ruido al contexto. Y ordenar sin copiar puede alterar el índice mientras otra capa lo lee.',
      keyPoints: [
        'Buscar es puntuar, ordenar y cortar; nada más.',
        'Las puntuaciones acompañan a los ids para explicar el orden.',
        'La recuperación propone candidatos que otra etapa evaluará.',
      ],
      question: '¿Esto sustituye a buscar con palabras?',
      answer: 'Se complementan. La semántica encuentra paráfrasis; las palabras exactas ganan con códigos, nombres propios o errores de tipeo. Los sistemas serias combinan ambas señales.',
      transfer: 'Escribe tres consultas para tus propias notas: una con sinónimos, otra con un término exacto y una imposible. Predice el ranking.',
      sources: ['sentence-transformers-semantic-search', 'qdrant-vector-search'],
    },
    reasoning: {
      activity: vectorRankingActivity('Ordena los resultados de la consulta sobre claves de acceso.', [
        ['contrasena', 'Restablecer tu contraseña', 0.91],
        ['pago', 'Cambiar método de pago', 0.42],
        ['cancelar', 'Cancelar suscripción', 0.18],
      ]),
      explanation: 'La puntuación ordena la fila: primero lo pertinente, con valores visibles que permiten discutir el ranking.',
      hints: ['Mayor puntuación, mejor puesto.', 'El ranking conserva los números para explicarse.'],
    },
    debug: {
      title: 'El ranking respeta la fila de entrada',
      expected: 'El orden sigue las puntuaciones calculadas.',
      observed: 'Se devuelven los primeros k ids tal como llegaron.',
      hints: ['Coloca al mejor candidato en última posición.', 'Ni puntuaciones ni orden participan todavía.', 'Calcula puntos, ordena descendente y corta.'],
    },
  }),
];
