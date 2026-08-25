import { authoredLesson, decisionActivity, sequenceActivity, vectorRankingActivity } from '../authoring';

export const AI_MODULE_05 = [
  authoredLesson({
    number: 28, module: 5, title: 'Qué representa un embedding',
    summary: 'Interpreta un embedding como una representación aprendida y evita asignar significado fijo a cada dimensión.',
    concepts: [['Embedding', 'Vector aprendido que representa un elemento para una tarea o distribución de datos.'], ['Espacio vectorial', 'Sistema de coordenadas donde se comparan representaciones.']],
    requires: ['abstraer-proveedor'], skill: 'entender-embeddings', mentalModel: 'El vector es una ubicación útil para comparar; sus coordenadas aisladas no son etiquetas humanas.',
    script: ['Un embedding convierte texto, imagen u otro dato en una lista de números de dimensión fija.', 'La cercanía puede reflejar patrones semánticos aprendidos, pero depende del modelo, la tarea y el modo de preparar la entrada.', 'El ejemplo comprueba que dos vectores comparten dimensión antes de compararlos. Una forma incompatible no produce una distancia válida.', 'Completa la comprobación con listas distintas. No compares solo el primer número.'],
    javascript: { example: `function misma_dimension(a, b) {
  return a.length === b.length && a.length > 0;
}
console.log(misma_dimension([0.1, 0.2], [0.4, 0.5]));`, starter: `function misma_dimension(a, b) {
  // Exige longitud igual y no vacía.
}`, solution: `function misma_dimension(a, b) {
  return a.length === b.length && a.length > 0;
}`, debugStarter: `function misma_dimension(a, b) {
  return a[0] === b[0];
}` },
    python: { example: `def misma_dimension(a, b):
    return len(a) == len(b) and len(a) > 0

print(misma_dimension([0.1, 0.2], [0.4, 0.5]))`, starter: `def misma_dimension(a, b):
    # Exige longitud igual y no vacía.
    pass`, solution: `def misma_dimension(a, b):
    return len(a) == len(b) and len(a) > 0`, debugStarter: `def misma_dimension(a, b):
    return a[0] == b[0]` },
    practice: { title: 'Comprueba la forma', instructions: 'Implementa misma_dimension(a, b). Dos listas vacías no forman un vector útil.', functionName: 'misma_dimension', cases: [{ args: [[0.1, 0.2], [0.9, 0.3]], expected: true, description: 'Acepta vectores no vacíos con la misma dimensión' }, { args: [[1, 2, 3], [1, 2]], expected: false, description: 'Rechaza dimensiones incompatibles' }, { args: [[], []], expected: false, description: 'Rechaza representaciones vacías' }], hints: ['Compara longitudes completas.', 'Añade una condición para no vacío.', 'No compares el contenido de las coordenadas.'] },
    reading: { core: 'Un embedding es la salida de un modelo de representación. Mapea entradas a vectores para que operaciones matemáticas aproximen relaciones útiles, como similitud semántica.', mechanics: 'El modelo tokeniza, procesa y agrupa activaciones en un vector. La normalización puede llevar su longitud a uno. Todos los elementos de un mismo índice deben usar el mismo modelo y preprocesamiento.', decisions: 'Elige un modelo entrenado para tu modalidad, idioma y tarea. Guarda el id y revisión junto con cada vector. Reindexa cuando cambias de modelo.', errors: 'No existe una dimensión “precio” o “tono” garantizada. Comparar vectores de modelos distintos carece de contrato. Una cercanía alta tampoco demuestra identidad ni verdad.', keyPoints: ['La dimensión pertenece al modelo.', 'Modelo y preprocesamiento forman parte del índice.', 'La similitud es una señal que se evalúa.'], question: '¿Puedo leer el significado de una coordenada?', answer: 'Normalmente no de forma aislada. El significado se distribuye y depende del entrenamiento. Evalúa relaciones mediante tareas y conjuntos de datos.', transfer: 'Describe qué metadatos guardarías junto a un embedding para poder reproducirlo.', sources: ['sentence-transformers-semantic-search', 'transformers-js'] },
    reasoning: { activity: decisionActivity('Decide qué comparaciones tienen contrato.', [['mismo', 'Mismo modelo, revisión y dimensión', ['válida', 'inválida'], 'válida'], ['distinto', 'Modelos distintos con 384 dimensiones', ['válida', 'inválida'], 'inválida'], ['vacio', 'Dos listas vacías', ['válida', 'inválida'], 'inválida']]), explanation: 'Compartir dimensión no basta. La representación debe provenir del mismo contrato de modelo y preprocesamiento.', hints: ['Revisa el origen, no solo el tamaño.', 'Vacío no representa contenido.'] },
    debug: { title: 'Solo mira la primera coordenada', expected: 'Se comparan longitudes no vacías.', observed: 'La función compara el primer valor.', hints: ['Usa vectores distintos de igual tamaño.', 'El contenido no define la forma.', 'Compara length o len.'] },
  }),
  authoredLesson({
    number: 29, module: 5, title: 'Crear embeddings locales',
    summary: 'Carga un modelo bajo demanda, informa progreso y distingue el fallback didáctico de una representación semántica.',
    concepts: [['Feature extraction', 'Pipeline que produce características o embeddings.'], ['Inferencia local', 'Cálculo ejecutado en el navegador sin enviar el texto a una API.'], ['Fallback didáctico', 'Vector determinista para practicar flujo, no semántica real.']],
    requires: ['entender-embeddings'], skill: 'crear-embeddings-locales', mentalModel: 'La primera llamada prepara y descarga; las siguientes reutilizan el modelo y siempre devuelven un vector normalizado.',
    script: ['El curso calcula embeddings locales con Transformers.js dentro de un Worker. El texto no necesita salir hacia una API de modelo.', 'La primera ejecución descarga artefactos y puede tardar. La interfaz debe mostrar progreso, permitir cancelar y explicar la caché.', 'El ejemplo normaliza un vector pequeño. El servicio real hace lo mismo con la salida del modelo.', 'Completa la normalización. Si la longitud es cero, devuelve ceros en vez de dividir por cero.'],
    javascript: { example: `function normalizar_vector(vector) {
  const norma = Math.hypot(...vector);
  return norma === 0 ? vector.map(() => 0) : vector.map(valor => valor / norma);
}
console.log(normalizar_vector([3, 4]));`, starter: `function normalizar_vector(vector) {
  // Divide cada valor por la norma L2.
}`, solution: `function normalizar_vector(vector) {
  const norma = Math.hypot(...vector);
  return norma === 0 ? vector.map(() => 0) : vector.map(valor => valor / norma);
}`, debugStarter: `function normalizar_vector(vector) {
  const suma = vector.reduce((a, b) => a + b, 0);
  return vector.map(valor => valor / suma);
}` },
    python: { example: `import math

def normalizar_vector(vector):
    norma = math.sqrt(sum(valor * valor for valor in vector))
    return [0 for _ in vector] if norma == 0 else [valor / norma for valor in vector]

print(normalizar_vector([3, 4]))`, starter: `import math

def normalizar_vector(vector):
    # Divide cada valor por la norma L2.
    pass`, solution: `import math

def normalizar_vector(vector):
    norma = math.sqrt(sum(valor * valor for valor in vector))
    return [0 for _ in vector] if norma == 0 else [valor / norma for valor in vector]`, debugStarter: `def normalizar_vector(vector):
    total = sum(vector)
    return [valor / total for valor in vector]` },
    practice: { title: 'Normaliza una salida', instructions: 'Implementa normalizar_vector(vector) con norma L2 y conserva la longitud.', functionName: 'normalizar_vector', cases: [{ args: [[3, 4]], expected: [0.6, 0.8], description: 'Normaliza un vector conocido' }, { args: [[0, 0]], expected: [0, 0], description: 'Maneja una norma cero sin valores inválidos' }], hints: ['La norma usa cuadrados y raíz.', 'Divide cada coordenada por la misma norma.', 'Protege el caso norma cero.'] },
    reading: { core: 'Transformers.js puede ejecutar una pipeline de feature extraction en el navegador. El Worker evita bloquear React. El modelo se carga solo al abrir una práctica que lo necesita.', mechanics: 'El servicio envía un lote de textos, recibe progreso de archivos, ejecuta mean pooling y normalización, y devuelve vectores en el mismo orden. Una señal de cancelación descarta la petición.', decisions: 'Elige un modelo pequeño y multilingüe para el laboratorio. Muestra tamaño, id, dispositivo y modo. Si falla, usa un vector hash etiquetado para enseñar indexación sin fingir semántica.', errors: 'Un fallback determinista no es un modelo. Presentarlo como búsqueda semántica engaña. Cargar el modelo al iniciar toda la aplicación penaliza a estudiantes que aún no lo necesitan.', keyPoints: ['El modelo se carga bajo demanda en un Worker.', 'El orden del lote se conserva.', 'El fallback declara su limitación.'], question: '¿El texto sale del navegador?', answer: 'En el modo local, el texto se procesa en el dispositivo. La descarga del modelo sí requiere red la primera vez. Una API opcional es otro modo y se indica por separado.', transfer: 'Diseña tres estados visuales: descargando, listo y fallback. Escribe qué puede afirmar cada uno.', sources: ['transformers-js', 'hf-model-hub'] },
    reasoning: { activity: sequenceActivity('Ordena una inferencia local.', [['pedir', 'Recibir textos'], ['cargar', 'Cargar o reutilizar modelo'], ['inferir', 'Calcular lote'], ['normalizar', 'Normalizar vectores'], ['devolver', 'Devolver en el mismo orden']]), explanation: 'La carga ocurre una vez por modelo. La normalización prepara comparaciones consistentes.', hints: ['No normalices antes de inferir.', 'El orden de entrada se conserva.'] },
    debug: { title: 'Divide por la suma', expected: 'La norma euclidiana de [3,4] produce [0.6,0.8].', observed: 'La función divide por 7.', hints: ['Calcula cuadrados.', 'La norma de 3,4 es 5.', 'Protege el vector cero.'] },
  }),
  authoredLesson({
    number: 30, module: 5, title: 'Distancia, producto punto y similitud coseno',
    summary: 'Calcula coseno con vectores compatibles y entiende cuándo producto punto y distancia cuentan otra historia.',
    concepts: [['Producto punto', 'Suma de productos coordenada a coordenada.'], ['Similitud coseno', 'Ángulo entre vectores, independiente de magnitud no nula.'], ['Distancia euclidiana', 'Longitud del desplazamiento entre dos puntos.']],
    requires: ['crear-embeddings-locales'], skill: 'calcular-similitud', mentalModel: 'Producto punto mezcla dirección y magnitud; coseno compara dirección; distancia compara separación.',
    script: ['Dos vectores pueden compararse con métricas distintas. La métrica forma parte del contrato del modelo y del índice.', 'Para vectores normalizados, producto punto y coseno coinciden. Sin normalizar, la magnitud cambia el producto punto.', 'El ejemplo calcula producto punto recorriendo todas las coordenadas.', 'Completa la función y rechaza mentalmente dimensiones distintas antes de usarla en un sistema real.'],
    javascript: { example: `function producto_punto(a, b) {
  return a.reduce((total, valor, i) => total + valor * b[i], 0);
}
console.log(producto_punto([1, 2], [3, 4]));`, starter: `function producto_punto(a, b) {
  // Suma a[i] por b[i].
}`, solution: `function producto_punto(a, b) {
  return a.reduce((total, valor, i) => total + valor * b[i], 0);
}`, debugStarter: `function producto_punto(a, b) {
  return a.reduce((total, valor) => total + valor, 0);
}` },
    python: { example: `def producto_punto(a, b):
    return sum(x * y for x, y in zip(a, b))

print(producto_punto([1, 2], [3, 4]))`, starter: `def producto_punto(a, b):
    # Suma cada producto x por y.
    pass`, solution: `def producto_punto(a, b):
    return sum(x * y for x, y in zip(a, b))`, debugStarter: `def producto_punto(a, b):
    return sum(a)` },
    practice: { title: 'Compara coordenadas', instructions: 'Implementa producto_punto(a, b). Multiplica pares y suma todos los resultados.', functionName: 'producto_punto', cases: [{ args: [[1, 2], [3, 4]], expected: 11, description: 'Suma 1×3 y 2×4' }, { args: [[0.5, -1, 2], [2, 3, 0]], expected: -2, description: 'Respeta signos y todas las dimensiones' }], hints: ['Recorre índices o pares.', 'Multiplica antes de sumar.', 'No sumes solo el primer vector.'] },
    reading: { core: 'El producto punto suma productos por coordenada. El coseno divide ese resultado entre las normas. La distancia euclidiana calcula la raíz de la suma de diferencias al cuadrado.', mechanics: 'Muchos modelos entregan vectores normalizados; entonces el coseno se obtiene con producto punto. Un índice debe configurarse con la métrica para la que fue evaluado.', decisions: 'Sigue la recomendación del modelo y valida ranking. Usa coseno para dirección, producto punto cuando la magnitud tenga contrato y distancia cuando la geometría del modelo la favorezca.', errors: 'Comparar dimensiones distintas produce resultados sin sentido. Olvidar normalizar cambia ranking. Interpretar 0.8 como “80 % correcto” confunde similitud con probabilidad.', keyPoints: ['La métrica pertenece al contrato.', 'Coseno no es probabilidad.', 'Evalúa el ranking, no un umbral aislado.'], question: '¿Qué similitud es suficientemente alta?', answer: 'Depende de modelo, corpus y tarea. Elige umbrales con pares positivos y negativos representativos.', transfer: 'Calcula a mano producto punto y coseno de dos vectores bidimensionales normalizados.', sources: ['sentence-transformers-semantic-search', 'qdrant-vector-search'] },
    reasoning: { activity: decisionActivity('Elige una afirmación válida.', [['normal', 'Vectores normalizados', ['producto punto equivale a coseno', 'coseno es probabilidad'], 'producto punto equivale a coseno'], ['umbral', 'Coseno 0.8', ['80 % correcto', 'señal de similitud'], 'señal de similitud']]), explanation: 'La métrica produce una puntuación de ranking. Su interpretación se calibra con datos.', hints: ['Normalización elimina magnitud.', 'No conviertas similitud en probabilidad.'] },
    debug: { title: 'El segundo vector no participa', expected: 'Se multiplican coordenadas de ambos vectores.', observed: 'La función solo suma a.', hints: ['Cambia b y observa.', 'Falta usar el índice.', 'Multiplica valor por b[i].'] },
  }),
  authoredLesson({
    number: 31, module: 5, title: 'Búsqueda semántica y clasificación',
    summary: 'Ordena documentos por puntuación y separa recuperación de una decisión de clasificación.',
    concepts: [['Búsqueda semántica', 'Recuperación por cercanía entre representaciones.'], ['Clasificación por prototipos', 'Asignación según cercanía a ejemplos o etiquetas representadas.']],
    requires: ['calcular-similitud'], skill: 'ordenar-resultados-semanticos', mentalModel: 'El embedding propone vecinos; la aplicación filtra, ordena y decide cuántos usar.',
    script: ['Una consulta y cada documento se convierten con el mismo modelo. Luego se calcula una puntuación y se ordena.', 'La búsqueda devuelve candidatos, no una respuesta final. La clasificación puede comparar contra prototipos, pero necesita umbral y evaluación.', 'El ejemplo ordena resultados ya puntuados de mayor a menor y devuelve sus ids.', 'Completa el ranking sin depender del orden de entrada.'],
    javascript: { example: `function ordenar_resultados(resultados) {
  return [...resultados].sort((a, b) => b.puntuacion - a.puntuacion).map(item => item.id);
}
console.log(ordenar_resultados([{ id: 'a', puntuacion: 0.2 }, { id: 'b', puntuacion: 0.9 }]));`, starter: `function ordenar_resultados(resultados) {
  // Orden descendente y devuelve ids.
}`, solution: `function ordenar_resultados(resultados) {
  return [...resultados].sort((a, b) => b.puntuacion - a.puntuacion).map(item => item.id);
}`, debugStarter: `function ordenar_resultados(resultados) {
  return resultados.map(item => item.id);
}` },
    python: { example: `def ordenar_resultados(resultados):
    return [item["id"] for item in sorted(resultados, key=lambda item: item["puntuacion"], reverse=True)]

print(ordenar_resultados([{"id": "a", "puntuacion": 0.2}, {"id": "b", "puntuacion": 0.9}]))`, starter: `def ordenar_resultados(resultados):
    # Orden descendente y devuelve ids.
    pass`, solution: `def ordenar_resultados(resultados):
    return [item["id"] for item in sorted(resultados, key=lambda item: item["puntuacion"], reverse=True)]`, debugStarter: `def ordenar_resultados(resultados):
    return [item["id"] for item in resultados]` },
    practice: { title: 'Construye un ranking', instructions: 'Implementa ordenar_resultados(resultados). No modifiques la lista original y devuelve ids en orden descendente.', functionName: 'ordenar_resultados', cases: [{ args: [[{ id: 'a', puntuacion: 0.2 }, { id: 'b', puntuacion: 0.9 }]], expected: ['b', 'a'], description: 'Pone primero la mayor similitud' }, { args: [[{ id: 'x', puntuacion: -0.1 }, { id: 'y', puntuacion: 0.3 }, { id: 'z', puntuacion: 0.1 }]], expected: ['y', 'z', 'x'], description: 'Ordena cualquier rango de puntuaciones' }], hints: ['Ordena por puntuacion, no id.', 'La resta b menos a produce descendente.', 'Extrae ids después de ordenar.'] },
    reading: { core: 'La búsqueda semántica recupera vecinos de la consulta. La clasificación puede comparar una entrada con vectores de etiquetas o ejemplos. Ambos usos dependen de un espacio de representación evaluado.', mechanics: 'El flujo crea embedding de consulta, busca top-k, aplica filtros y devuelve ids, puntuaciones y metadatos. La aplicación decide si hay suficiente evidencia o debe abstenerse.', decisions: 'Mide recall cuando importa encontrar candidatos y precision cuando el ruido cuesta. Ajusta k y filtros. Para clasificación, incluye una clase desconocida o umbral de abstención.', errors: 'Tomar el primer resultado sin puntuación ni fuente oculta incertidumbre. Comparar strings con embeddings generados por modelos distintos rompe el índice. Un top-k fijo puede ser insuficiente o excesivo.', keyPoints: ['Recuperación produce candidatos.', 'El ranking conserva puntuaciones y metadatos.', 'La abstención evita forzar una clase.'], question: '¿Búsqueda semántica reemplaza palabras clave?', answer: 'No siempre. Nombres, códigos y términos exactos suelen beneficiarse de búsqueda léxica. La combinación híbrida puede mejorar cobertura.', transfer: 'Diseña tres consultas: una semántica, una exacta y una híbrida. Explica qué debería recuperar cada una.', sources: ['sentence-transformers-semantic-search', 'qdrant-vector-search'] },
    reasoning: { activity: vectorRankingActivity('Ordena los documentos por similitud.', [['cuenta', 'Restablecer la contraseña', 0.91], ['pago', 'Cambiar el método de pago', 0.42], ['cancelar', 'Cancelar una suscripción', 0.18]]), explanation: 'La puntuación mayor ocupa la primera posición; el ranking conserva id y valor para explicar el orden.', hints: ['Compara primero 0.91 y 0.42.', 'El orden es descendente.'] },
    debug: { title: 'El ranking conserva el orden original', expected: 'Mayor puntuación aparece primero.', observed: 'Solo se extraen ids.', hints: ['Invierte las puntuaciones.', 'map no ordena.', 'Copia, ordena y luego mapea.'] },
  }),
  authoredLesson({
    number: 32, module: 5, title: 'Elegir y evaluar un modelo de embeddings',
    summary: 'Compara modelos con pares y rankings del dominio, incluyendo idioma, tamaño y latencia.',
    concepts: [['Recall@k', 'Fracción de elementos pertinentes encontrados en los primeros k.'], ['Conjunto de pares', 'Ejemplos de entradas similares y no similares.'], ['Dimensión', 'Cantidad de coordenadas y coste de almacenamiento asociado.']],
    requires: ['ordenar-resultados-semanticos'], skill: 'evaluar-modelo-embeddings', mentalModel: 'El mejor modelo es el que ordena bien tus casos dentro de tus límites operativos.',
    script: ['Una tabla pública ayuda a descartar opciones, pero no sustituye consultas y documentos de tu dominio.', 'Prepara pares positivos, negativos difíciles y rankings esperados. Mide calidad, latencia, tamaño y primera carga.', 'La función calcula recall sobre ids relevantes y recuperados.', 'Completa el cálculo y maneja el conjunto relevante vacío sin inventar una puntuación.'],
    javascript: { example: `function recall(relevantes, recuperados) {
  if (relevantes.length === 0) return 0;
  const encontrados = relevantes.filter(id => recuperados.includes(id)).length;
  return encontrados / relevantes.length;
}
console.log(recall(['a', 'b'], ['b', 'c']));`, starter: `function recall(relevantes, recuperados) {
  // Fracción de relevantes presentes en recuperados.
}`, solution: `function recall(relevantes, recuperados) {
  if (relevantes.length === 0) return 0;
  return relevantes.filter(id => recuperados.includes(id)).length / relevantes.length;
}`, debugStarter: `function recall(relevantes, recuperados) {
  return recuperados.length / relevantes.length;
}` },
    python: { example: `def recall(relevantes, recuperados):
    if not relevantes:
        return 0
    encontrados = sum(1 for item in relevantes if item in recuperados)
    return encontrados / len(relevantes)

print(recall(["a", "b"], ["b", "c"]))`, starter: `def recall(relevantes, recuperados):
    # Fracción de relevantes presentes en recuperados.
    pass`, solution: `def recall(relevantes, recuperados):
    if not relevantes:
        return 0
    return sum(1 for item in relevantes if item in recuperados) / len(relevantes)`, debugStarter: `def recall(relevantes, recuperados):
    return len(recuperados) / len(relevantes)` },
    practice: { title: 'Mide recuperación', instructions: 'Implementa recall(relevantes, recuperados). Cuenta intersección y divide por relevantes.', functionName: 'recall', cases: [{ args: [['a', 'b'], ['b', 'c']], expected: 0.5, description: 'Encuentra uno de dos relevantes' }, { args: [[], ['x']], expected: 0, description: 'Maneja una consulta sin relevantes definidos' }, { args: [['a'], ['a', 'b', 'c']], expected: 1, description: 'No penaliza candidatos extra en recall' }], hints: ['Cuenta ids relevantes presentes.', 'El denominador es relevantes.', 'Protege la lista relevante vacía.'] },
    reading: { core: 'La evaluación de embeddings usa consultas, documentos pertinentes y negativos difíciles. Para similitud usa pares o tripletas; para búsqueda usa métricas de ranking.', mechanics: 'Congela corpus y casos, genera todos los vectores con cada modelo, construye índices equivalentes y mide recall@k, precisión, latencia, memoria y descarga.', decisions: 'Incluye español real, abreviaturas y términos del negocio. Un modelo algo menos preciso puede ganar por tamaño o privacidad si cumple el umbral de producto.', errors: 'Evaluar con las mismas frases usadas para elegir ejemplos sobreestima. Comparar un índice viejo con consultas de un modelo nuevo invalida resultados. Ignorar casos sin respuesta fuerza falsos positivos.', keyPoints: ['Evalúa la tarea final, no vectores aislados.', 'Reindexa por modelo y revisión.', 'Incluye negativos difíciles y abstención.'], question: '¿Una dimensión mayor significa mejor calidad?', answer: 'No. Aumenta almacenamiento y cálculo, pero la calidad depende del entrenamiento y la tarea. Mide ambas opciones.', transfer: 'Escribe cinco consultas y sus documentos pertinentes para un pequeño conjunto de evaluación.', sources: ['sentence-transformers-semantic-search', 'hf-model-hub', 'qdrant-vector-search'] },
    reasoning: { activity: sequenceActivity('Ordena una comparación justa.', [['corpus', 'Congelar corpus y casos'], ['generar', 'Generar vectores por modelo'], ['indexar', 'Crear índice por modelo'], ['medir', 'Medir ranking y operación'], ['elegir', 'Elegir según umbrales']]), explanation: 'Cada modelo tiene su propio índice. La decisión combina calidad y restricciones.', hints: ['No mezcles vectores.', 'Los umbrales se fijan antes de elegir.'] },
    debug: { title: 'Recall cuenta todo lo recuperado', expected: 'Solo cuenta relevantes encontrados.', observed: 'Divide la cantidad recuperada por relevantes.', hints: ['Añade candidatos irrelevantes.', 'El numerador es una intersección.', 'Protege relevantes vacío.'] },
  }),
];
