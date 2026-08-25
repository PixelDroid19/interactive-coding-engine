import { authoredLesson, decisionActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_01 = [
  authoredLesson({
    number: 5, module: 1, title: 'Texto, tokens y tokenización',
    summary: 'Explica por qué un modelo procesa tokens y estima su coste sin confundirlos con palabras.',
    concepts: [['Token', 'Unidad numérica que el tokenizador asigna a una porción de texto.'], ['Tokenización', 'Conversión reversible entre texto y una secuencia de identificadores.']],
    requires: ['proteger-claves-api'], skill: 'entender-tokenizacion',
    mentalModel: 'El modelo no recibe palabras: recibe identificadores de fragmentos y predice otro identificador.',
    script: ['El navegador muestra letras, pero el modelo trabaja con una secuencia de tokens. Un token puede ser una palabra, una parte o un signo.', 'Cada familia de modelos usa un tokenizador. Por eso dos modelos pueden contar distinto el mismo texto y el número de palabras solo sirve como estimación.', 'El ejemplo estima tokens a partir de palabras para practicar presupuestos. Lo etiqueta como aproximación, no como contador exacto.', 'Completa la estimación y maneja espacios repetidos. En producción consultarías el tokenizador del modelo elegido.'],
    javascript: { example: `function estimar_tokens(texto) {
  const palabras = texto.trim().split(/\\s+/).filter(Boolean).length;
  return Math.ceil(palabras * 1.4);
}
console.log(estimar_tokens('hola mundo'));`, starter: `function estimar_tokens(texto) {
  // Aproxima 1.4 tokens por palabra y redondea hacia arriba.
}`, solution: `function estimar_tokens(texto) {
  const palabras = texto.trim() ? texto.trim().split(/\\s+/).length : 0;
  return Math.ceil(palabras * 1.4);
}`, debugStarter: `function estimar_tokens(texto) {
  return texto.length;
}` },
    python: { example: `import math

def estimar_tokens(texto):
    palabras = len(texto.split())
    return math.ceil(palabras * 1.4)

print(estimar_tokens("hola mundo"))`, starter: `import math

def estimar_tokens(texto):
    # Aproxima 1.4 tokens por palabra y redondea hacia arriba.
    pass`, solution: `import math

def estimar_tokens(texto):
    return math.ceil(len(texto.split()) * 1.4)`, debugStarter: `def estimar_tokens(texto):
    return len(texto)` },
    practice: { title: 'Estima un presupuesto', instructions: 'Implementa estimar_tokens(texto) con una aproximación de 1.4 tokens por palabra. Los espacios vacíos no cuentan.', functionName: 'estimar_tokens', cases: [{ args: ['hola mundo'], expected: 3, description: 'Redondea dos palabras hacia arriba' }, { args: [''], expected: 0, description: 'Un texto vacío no consume tokens de contenido' }, { args: ['uno   dos tres'], expected: 5, description: 'Ignora espacios repetidos' }], hints: ['Cuenta unidades separadas por espacios, no caracteres.', 'Limpia el texto antes de separar.', 'Usa redondeo hacia arriba después de multiplicar.'] },
    reading: { core: 'Un tokenizador divide texto y asigna un id a cada fragmento. El vocabulario se aprende antes de la inferencia. Palabras frecuentes pueden ocupar un token; nombres raros, código o idiomas distintos pueden necesitar varios.', mechanics: 'La entrada se convierte en ids, el modelo produce puntuaciones para posibles ids siguientes y el tokenizador vuelve a texto. Los límites y precios de proveedores suelen expresarse en tokens de entrada y salida.', decisions: 'Usa el contador oficial cuando necesites límites exactos. Para diseñar una interfaz basta una estimación conservadora y una respuesta clara cuando el contenido no cabe.', errors: 'Contar caracteres o palabras como si fueran tokens exactos produce fallos cerca del límite. También es incorrecto asumir que un token siempre representa cuatro caracteres en todos los idiomas y modelos.', keyPoints: ['Los tokens dependen del tokenizador.', 'Entrada y salida comparten un presupuesto limitado.', 'Una estimación debe declararse como tal.'], question: '¿Por qué una palabra en español puede costar más que otra?', answer: 'El vocabulario refleja patrones del entrenamiento. Una palabra frecuente puede existir completa; otra se divide en fragmentos más pequeños.', transfer: 'Compara una frase cotidiana, una URL y un fragmento de código. Predice cuál se dividirá en más partes y explica por qué.', sources: ['hf-llm-course', 'transformers-js'] },
    reasoning: { activity: sequenceActivity('Ordena el viaje de una frase por el modelo.', [['texto', 'Texto de entrada'], ['tokens', 'Ids de tokens'], ['modelo', 'Puntuaciones del modelo'], ['salida', 'Token elegido y texto']]), explanation: 'El tokenizador rodea al modelo: codifica antes de inferir y decodifica después de elegir.', hints: ['El modelo no recibe la cadena directamente.', 'La decodificación ocurre al final.'] },
    debug: { title: 'Caracteres tratados como tokens', expected: 'La estimación depende de palabras y redondea.', observed: 'Cada carácter cuenta como un token.', hints: ['Prueba hola mundo.', 'length mide caracteres.', 'Separa palabras y multiplica después.'] },
  }),
  authoredLesson({
    number: 6, module: 1, title: 'Ventana de contexto y presupuesto de tokens',
    summary: 'Distribuye tokens entre instrucciones, datos, historial y respuesta sin superar la ventana.',
    concepts: [['Ventana de contexto', 'Máximo de tokens visibles durante una inferencia.'], ['Presupuesto', 'Reparto intencional del espacio entre bloques de entrada y salida.']],
    requires: ['entender-tokenizacion'], skill: 'presupuestar-contexto',
    mentalModel: 'La ventana es una maleta: reservar espacio para la respuesta obliga a escoger qué entrada llevar.',
    script: ['Una ventana grande sigue siendo finita. Instrucciones, documentos, mensajes y respuesta compiten por el mismo espacio.', 'El presupuesto reserva primero la salida y los bloques obligatorios. Solo después admite contexto adicional por prioridad.', 'La función comprueba si los tokens usados, los nuevos y la reserva caben. No corta texto a escondidas.', 'Completa la suma y prueba un caso justo en el límite y otro que lo supere.'],
    javascript: { example: `function cabe_en_contexto(limite, usados, nuevos, reserva_salida) {
  return usados + nuevos + reserva_salida <= limite;
}
console.log(cabe_en_contexto(100, 40, 30, 20));`, starter: `function cabe_en_contexto(limite, usados, nuevos, reserva_salida) {
  // Comprueba la suma completa.
}`, solution: `function cabe_en_contexto(limite, usados, nuevos, reserva_salida) {
  return usados + nuevos + reserva_salida <= limite;
}`, debugStarter: `function cabe_en_contexto(limite, usados, nuevos, reserva_salida) {
  return usados + nuevos <= limite;
}` },
    python: { example: `def cabe_en_contexto(limite, usados, nuevos, reserva_salida):
    return usados + nuevos + reserva_salida <= limite

print(cabe_en_contexto(100, 40, 30, 20))`, starter: `def cabe_en_contexto(limite, usados, nuevos, reserva_salida):
    # Comprueba la suma completa.
    pass`, solution: `def cabe_en_contexto(limite, usados, nuevos, reserva_salida):
    return usados + nuevos + reserva_salida <= limite`, debugStarter: `def cabe_en_contexto(limite, usados, nuevos, reserva_salida):
    return usados + nuevos <= limite` },
    practice: { title: 'Protege la ventana', instructions: 'Implementa cabe_en_contexto(limite, usados, nuevos, reserva_salida). Incluye siempre la reserva para la respuesta.', functionName: 'cabe_en_contexto', cases: [{ args: [100, 40, 30, 30], expected: true, description: 'Acepta una suma exactamente igual al límite' }, { args: [100, 60, 30, 20], expected: false, description: 'Rechaza una entrada que deja sin espacio la respuesta' }], hints: ['Los cuatro números afectan la decisión.', 'Suma antes de comparar.', 'El límite se acepta con menor o igual.'] },
    reading: { core: 'La ventana de contexto limita lo que el modelo puede atender en una llamada. Incluye tokens del sistema, mensajes, herramientas, documentos y la salida que se generará.', mechanics: 'Un constructor de contexto calcula tamaños, reserva salida, añade bloques obligatorios y ordena los opcionales. Si algo no cabe, registra qué descartó o resume con una política explícita.', decisions: 'Una ventana mayor reduce algunos cortes, pero aumenta coste y puede diluir señales importantes. Seleccionar fragmentos pertinentes suele ser mejor que enviar todo.', errors: 'Llenar la ventana con entrada y olvidar la salida causa respuestas truncadas. Cortar por caracteres puede romper JSON o separar una afirmación de su fuente.', keyPoints: ['Reserva tokens de salida antes de añadir contexto.', 'Registra inclusiones y descartes.', 'Más contexto no implica mejor contexto.'], question: '¿El modelo recuerda mensajes anteriores fuera de la ventana?', answer: 'No por sí solo. La aplicación debe reenviar historial, resumen o memoria recuperada en cada llamada.', transfer: 'Diseña un presupuesto de 1.000 tokens para instrucciones, historial, documentos y salida. Justifica cada reserva.', sources: ['hf-llm-course', 'anthropic-prompt-caching'] },
    reasoning: { activity: decisionActivity('Decide si cada conjunto cabe en una ventana de 100 tokens.', [['exacto', '40 usados + 30 nuevos + 30 salida', ['cabe', 'no cabe'], 'cabe'], ['exceso', '60 usados + 30 nuevos + 20 salida', ['cabe', 'no cabe'], 'no cabe']]), explanation: 'La reserva de salida forma parte del total. El caso exacto cabe; cualquier exceso requiere descartar o resumir.', hints: ['Suma los tres bloques.', 'Menor o igual acepta el límite exacto.'] },
    debug: { title: 'La respuesta no tiene sitio', expected: 'La decisión reserva tokens para generar.', observed: 'La función solo suma contexto usado y nuevo.', hints: ['Prueba 60, 30 y una reserva de 20.', 'Falta un sumando.', 'Incluye reserva_salida antes de comparar.'] },
  }),
  authoredLesson({
    number: 7, module: 1, title: 'Inferencia: predecir el siguiente token',
    summary: 'Interpreta una distribución de probabilidades y elige el candidato más probable de forma determinista.',
    concepts: [['Inferencia', 'Ejecución de un modelo ya entrenado para producir una salida.'], ['Logits', 'Puntuaciones que se convierten en probabilidades para los tokens posibles.']],
    requires: ['presupuestar-contexto'], skill: 'leer-distribucion-token',
    mentalModel: 'Generar texto repite un ciclo: puntuar candidatos, elegir uno, añadirlo al contexto y volver a empezar.',
    script: ['El modelo no escribe una frase completa de una vez. Calcula puntuaciones para el siguiente token a partir del contexto visible.', 'Después una estrategia transforma esas puntuaciones en una elección. Si siempre tomas el máximo, la ejecución es determinista para esa distribución.', 'El ejemplo recorre un objeto de candidatos y conserva el de mayor probabilidad. Así vemos la decisión sin una red neuronal real.', 'Completa la selección y no dependas del nombre del token. Las pruebas usarán distribuciones diferentes.'],
    javascript: { example: `function token_mas_probable(distribucion) {
  return Object.entries(distribucion).sort((a, b) => b[1] - a[1])[0][0];
}
console.log(token_mas_probable({ gato: 0.7, perro: 0.3 }));`, starter: `function token_mas_probable(distribucion) {
  // Devuelve la clave con mayor probabilidad.
}`, solution: `function token_mas_probable(distribucion) {
  let mejor = null;
  for (const token in distribucion) if (mejor === null || distribucion[token] > distribucion[mejor]) mejor = token;
  return mejor;
}`, debugStarter: `function token_mas_probable(distribucion) {
  return Object.keys(distribucion)[0];
}` },
    python: { example: `def token_mas_probable(distribucion):
    return max(distribucion, key=distribucion.get)

print(token_mas_probable({"gato": 0.7, "perro": 0.3}))`, starter: `def token_mas_probable(distribucion):
    # Devuelve la clave con mayor probabilidad.
    pass`, solution: `def token_mas_probable(distribucion):
    return max(distribucion, key=distribucion.get)`, debugStarter: `def token_mas_probable(distribucion):
    return next(iter(distribucion))` },
    practice: { title: 'Elige el siguiente token', instructions: 'Implementa token_mas_probable(distribucion). Lee las puntuaciones y devuelve la clave ganadora.', functionName: 'token_mas_probable', cases: [{ args: [{ gato: 0.7, perro: 0.3 }], expected: 'gato', description: 'Elige el token con probabilidad 0.7' }, { args: [{ azul: 0.1, verde: 0.25, rojo: 0.65 }], expected: 'rojo', description: 'Funciona con nombres y tamaños distintos' }], hints: ['Compara valores, no el orden de las claves.', 'Conserva el mejor token visto.', 'Devuelve la clave, no la probabilidad.'] },
    reading: { core: 'Durante inferencia el modelo calcula logits para cada token del vocabulario. Softmax los convierte en una distribución. La aplicación o el runtime usa esa distribución para escoger el siguiente token.', mechanics: 'El token elegido se agrega a la secuencia y el ciclo se repite hasta una condición de parada. El contexto crece en cada paso; por eso la generación consume tiempo y tokens de salida.', decisions: 'Elegir siempre el máximo ayuda en tareas repetibles. Muestrear puede aportar variedad. La elección depende del producto: extraer JSON requiere estabilidad; idear nombres puede admitir diversidad.', errors: 'Una probabilidad alta no es una garantía de verdad. Solo indica preferencia del modelo bajo ese contexto. También es incorrecto interpretar cada token como una palabra completa.', keyPoints: ['La inferencia no cambia los pesos del modelo.', 'Cada paso depende de los tokens anteriores.', 'Probabilidad no equivale a veracidad.'], question: '¿Por qué dos respuestas pueden empezar igual y terminar distinto?', answer: 'Cada token elegido cambia la distribución del paso siguiente. Una elección diferente puede desviar toda la continuación.', transfer: 'Escribe tres candidatos para completar una frase y asigna probabilidades que sumen uno. Explica cuál elegiría un decodificador codicioso.', sources: ['hf-llm-course', 'google-prompt-design'] },
    reasoning: { activity: sequenceActivity('Ordena un paso de generación.', [['contexto', 'Leer contexto'], ['puntuar', 'Calcular logits'], ['probabilidad', 'Obtener distribución'], ['elegir', 'Elegir token'], ['anadir', 'Añadirlo al contexto']]), explanation: 'La salida de un paso se convierte en entrada del siguiente. Ese bucle construye la secuencia.', hints: ['Los logits aparecen antes de las probabilidades.', 'El token se añade después de elegirlo.'] },
    debug: { title: 'Gana la primera clave', expected: 'Gana el valor más alto sin importar el orden.', observed: 'La función devuelve la primera clave del objeto.', hints: ['Invierte el orden de candidatos.', 'Object.keys no compara valores.', 'Recorre pares de token y puntuación.'] },
  }),
  authoredLesson({
    number: 8, module: 1, title: 'Temperatura, top-k y top-p',
    summary: 'Compara controles de muestreo y aplica un top-k pequeño sin confundir diversidad con calidad.',
    concepts: [['Temperatura', 'Escala la distribución antes de muestrear.'], ['Top-k', 'Restringe candidatos a los k mejor puntuados.'], ['Top-p', 'Conserva el conjunto mínimo cuya masa acumulada alcanza p.']],
    requires: ['leer-distribucion-token'], skill: 'controlar-sampling',
    mentalModel: 'Los controles de sampling cambian cómo eliges entre candidatos; no añaden conocimiento al modelo.',
    script: ['Temperatura, top-k y top-p actúan sobre la distribución del siguiente token. Ninguno verifica hechos.', 'Top-k conserva una cantidad fija de candidatos. Top-p conserva una masa de probabilidad y por eso su cantidad puede variar.', 'El ejemplo ordena candidatos y devuelve los dos mejores. Es una versión visible de top-k sin azar.', 'Completa la función para cualquier k. Si k supera los candidatos, devuelve todos sin inventar elementos.'],
    javascript: { example: `function aplicar_top_k(distribucion, k) {
  return Object.entries(distribucion).sort((a, b) => b[1] - a[1]).slice(0, k).map(([token]) => token);
}
console.log(aplicar_top_k({ a: 0.5, b: 0.3, c: 0.2 }, 2));`, starter: `function aplicar_top_k(distribucion, k) {
  // Devuelve las claves de los k valores mayores.
}`, solution: `function aplicar_top_k(distribucion, k) {
  return Object.entries(distribucion).sort((a, b) => b[1] - a[1]).slice(0, k).map(([token]) => token);
}`, debugStarter: `function aplicar_top_k(distribucion, k) {
  return Object.keys(distribucion).slice(0, k);
}` },
    python: { example: `def aplicar_top_k(distribucion, k):
    ordenados = sorted(distribucion, key=distribucion.get, reverse=True)
    return ordenados[:k]

print(aplicar_top_k({"a": 0.5, "b": 0.3, "c": 0.2}, 2))`, starter: `def aplicar_top_k(distribucion, k):
    # Devuelve las claves de los k valores mayores.
    pass`, solution: `def aplicar_top_k(distribucion, k):
    return sorted(distribucion, key=distribucion.get, reverse=True)[:k]`, debugStarter: `def aplicar_top_k(distribucion, k):
    return list(distribucion)[:k]` },
    practice: { title: 'Filtra candidatos', instructions: 'Implementa aplicar_top_k(distribucion, k). Ordena por puntuación descendente y devuelve solo claves.', functionName: 'aplicar_top_k', cases: [{ args: [{ a: 0.5, b: 0.3, c: 0.2 }, 2], expected: ['a', 'b'], description: 'Conserva los dos candidatos más probables' }, { args: [{ x: 0.1, y: 0.9 }, 5], expected: ['y', 'x'], description: 'Devuelve todos si k supera el tamaño' }], hints: ['Ordena pares por el valor numérico.', 'El orden es descendente.', 'Después del corte devuelve las claves.'] },
    reading: { core: 'La temperatura modifica cuán concentrada queda la distribución. Top-k corta por cantidad. Top-p ordena y acumula probabilidades hasta alcanzar un umbral. Se pueden combinar, pero cada control reduce o amplía candidatos de forma distinta.', mechanics: 'Con temperatura baja, diferencias pequeñas se amplifican y el máximo domina. Con temperatura alta, candidatos menores ganan oportunidad. El muestreo usa azar sobre la distribución filtrada.', decisions: 'Para JSON, clasificación y herramientas usa valores conservadores y validación. Para exploración creativa puedes permitir variedad y generar varias opciones. Mide el comportamiento en casos reales.', errors: 'Subir temperatura no vuelve al modelo más inteligente. Bajarla no elimina alucinaciones. Un top-k de uno equivale a elegir siempre el máximo y puede repetir patrones.', keyPoints: ['Sampling controla diversidad, no conocimiento.', 'Top-k y top-p filtran de manera distinta.', 'La configuración se evalúa junto con la tarea.'], question: '¿Qué valor de temperatura es el correcto?', answer: 'No existe uno universal. Depende de tarea, modelo y proveedor. Compara configuraciones con un conjunto de casos y una métrica útil.', transfer: 'Elige una configuración para extracción de facturas y otra para lluvia de ideas. Justifica estabilidad o diversidad.', sources: ['hf-llm-course', 'google-prompt-design'] },
    reasoning: { activity: decisionActivity('Elige el objetivo de cada configuración.', [['json', 'Extraer JSON estable', ['baja diversidad', 'alta diversidad'], 'baja diversidad'], ['ideas', 'Proponer nombres variados', ['baja diversidad', 'alta diversidad'], 'alta diversidad']]), explanation: 'La configuración acompaña el contrato del producto. En ambos casos la salida se valida.', hints: ['JSON premia repetibilidad.', 'Una lluvia de ideas necesita opciones.'] },
    debug: { title: 'Top-k respeta el orden de escritura', expected: 'Los candidatos se ordenan por puntuación.', observed: 'Se cortan las primeras claves sin comparar.', hints: ['Usa un objeto con la mejor opción al final.', 'slice no ordena.', 'Ordena antes de cortar.'] },
  }),
  authoredLesson({
    number: 9, module: 1, title: 'Penalizaciones y repetición',
    summary: 'Reduce puntuaciones de tokens repetidos y distingue repetición de falta de información.',
    concepts: [['Penalización de frecuencia', 'Reduce según cuántas veces apareció un token.'], ['Penalización de presencia', 'Reduce por el hecho de haber aparecido.']],
    requires: ['controlar-sampling'], skill: 'regular-repeticion',
    mentalModel: 'Una penalización cambia la preferencia de salida; no corrige el contexto ni los hechos.',
    script: ['Los modelos pueden entrar en bucles o repetir frases porque cada token vuelve a influir en el siguiente paso.', 'Una penalización resta puntuación a candidatos ya usados. La de frecuencia crece con el conteo; la de presencia solo mira si apareció.', 'El ejemplo resta penalización por cada repetición. Así podemos observar el efecto sin muestreo aleatorio.', 'Completa el cálculo y conserva la puntuación cuando el token todavía no apareció.'],
    javascript: { example: `function penalizar(puntuacion, repeticiones, factor) {
  return puntuacion - repeticiones * factor;
}
console.log(penalizar(0.9, 2, 0.1));`, starter: `function penalizar(puntuacion, repeticiones, factor) {
  // Resta repeticiones por factor.
}`, solution: `function penalizar(puntuacion, repeticiones, factor) {
  return puntuacion - repeticiones * factor;
}`, debugStarter: `function penalizar(puntuacion, repeticiones, factor) {
  return puntuacion - factor;
}` },
    python: { example: `def penalizar(puntuacion, repeticiones, factor):
    return puntuacion - repeticiones * factor

print(penalizar(0.9, 2, 0.1))`, starter: `def penalizar(puntuacion, repeticiones, factor):
    # Resta repeticiones por factor.
    pass`, solution: `def penalizar(puntuacion, repeticiones, factor):
    return puntuacion - repeticiones * factor`, debugStarter: `def penalizar(puntuacion, repeticiones, factor):
    return puntuacion - factor` },
    practice: { title: 'Ajusta una puntuación', instructions: 'Implementa penalizar(puntuacion, repeticiones, factor). Usa las tres entradas.', functionName: 'penalizar', cases: [{ args: [0.9, 2, 0.1], expected: 0.7, description: 'Resta dos veces el factor' }, { args: [0.4, 0, 0.2], expected: 0.4, description: 'No cambia un token que no se repitió' }], hints: ['La resta crece con repeticiones.', 'Multiplica antes de restar.', 'Con cero repeticiones el valor queda igual.'] },
    reading: { core: 'Las penalizaciones modifican logits antes de elegir. La frecuencia usa el número de apariciones; la presencia aplica un ajuste al aparecer al menos una vez. Los nombres y fórmulas exactas cambian entre proveedores.', mechanics: 'El runtime mantiene conteos de tokens generados. En cada paso ajusta puntuaciones y vuelve a normalizar. El efecto se acumula durante esa respuesta, no altera los pesos del modelo.', decisions: 'Úsalas cuando observas repetición medible. Si el problema es una instrucción ambigua o contexto duplicado, corrige esas causas primero. Ajusta poco y evalúa fluidez.', errors: 'Una penalización alta puede impedir repetir términos necesarios, nombres o claves JSON. También puede ocultar un síntoma sin resolver documentos duplicados o una parada mal configurada.', keyPoints: ['La penalización actúa durante decodificación.', 'Frecuencia y presencia no son equivalentes.', 'Primero investiga por qué se repite.'], question: '¿Una penalización evita todas las respuestas repetitivas?', answer: 'No. Puede reducir tokens usados, pero el modelo puede parafrasear o repetir estructuras. Revisa prompt, contexto, parada y sampling.', transfer: 'Imagina un resumen que repite el título. Escribe una hipótesis de prompt, otra de contexto y otra de sampling.', sources: ['hf-llm-course', 'anthropic-prompt-engineering'] },
    reasoning: { activity: decisionActivity('Elige la primera intervención.', [['duplicado', 'El documento aparece dos veces en contexto', ['deduplicar contexto', 'subir penalización'], 'deduplicar contexto'], ['bucle', 'El texto repite una frase sin contexto duplicado', ['probar penalización', 'añadir más documentos'], 'probar penalización']]), explanation: 'La intervención sigue la causa observada. Sampling no debe reemplazar una corrección de datos.', hints: ['Corrige duplicados en su origen.', 'Una penalización es una hipótesis de decodificación.'] },
    debug: { title: 'El conteo no importa', expected: 'La resta aumenta con cada repetición.', observed: 'La función resta el factor una sola vez.', hints: ['Compara una y tres repeticiones.', 'Falta usar repeticiones.', 'Multiplica repeticiones por factor.'] },
  }),
  authoredLesson({
    number: 10, module: 1, title: 'Entrenamiento, ajuste e inferencia',
    summary: 'Distingue cuándo cambian los pesos del modelo y cuándo solo cambia la entrada.',
    concepts: [['Entrenamiento', 'Optimiza pesos con muchos ejemplos.'], ['Fine-tuning', 'Ajusta un modelo preentrenado para datos o conductas específicas.'], ['Inferencia', 'Usa pesos fijos para producir una salida.']],
    requires: ['regular-repeticion'], skill: 'distinguir-fases-modelo',
    mentalModel: 'El entrenamiento cambia el modelo; el prompt y RAG cambian lo que ve durante una llamada.',
    script: ['Entrenar, ajustar e inferir son fases distintas. Mezclarlas lleva a elegir soluciones caras para problemas de contexto.', 'Durante entrenamiento o fine-tuning se optimizan pesos. Durante inferencia los pesos permanecen fijos y cambian los tokens de entrada y salida.', 'La función clasifica una operación usando dos señales: si procesa una solicitud o si actualiza pesos.', 'Completa la clasificación. Un ajuste también cambia pesos; una llamada normal solo ejecuta inferencia.'],
    javascript: { example: `function fase_modelo(actualiza_pesos, atiende_solicitud) {
  if (actualiza_pesos) return 'entrenamiento';
  if (atiende_solicitud) return 'inferencia';
  return 'preparacion';
}
console.log(fase_modelo(false, true));`, starter: `function fase_modelo(actualiza_pesos, atiende_solicitud) {
  // Devuelve entrenamiento, inferencia o preparacion.
}`, solution: `function fase_modelo(actualiza_pesos, atiende_solicitud) {
  if (actualiza_pesos) return 'entrenamiento';
  return atiende_solicitud ? 'inferencia' : 'preparacion';
}`, debugStarter: `function fase_modelo(actualiza_pesos, atiende_solicitud) {
  return atiende_solicitud ? 'entrenamiento' : 'inferencia';
}` },
    python: { example: `def fase_modelo(actualiza_pesos, atiende_solicitud):
    if actualiza_pesos:
        return "entrenamiento"
    if atiende_solicitud:
        return "inferencia"
    return "preparacion"

print(fase_modelo(False, True))`, starter: `def fase_modelo(actualiza_pesos, atiende_solicitud):
    # Devuelve entrenamiento, inferencia o preparacion.
    pass`, solution: `def fase_modelo(actualiza_pesos, atiende_solicitud):
    if actualiza_pesos:
        return "entrenamiento"
    return "inferencia" if atiende_solicitud else "preparacion"`, debugStarter: `def fase_modelo(actualiza_pesos, atiende_solicitud):
    return "entrenamiento" if atiende_solicitud else "inferencia"` },
    practice: { title: 'Identifica la fase', instructions: 'Implementa fase_modelo(actualiza_pesos, atiende_solicitud). Prioriza el cambio de pesos.', functionName: 'fase_modelo', cases: [{ args: [true, false], expected: 'entrenamiento', description: 'Reconoce una operación que modifica pesos' }, { args: [false, true], expected: 'inferencia', description: 'Reconoce una solicitud con pesos fijos' }, { args: [false, false], expected: 'preparacion', description: 'Separa preparación de las dos fases' }], hints: ['Pregunta primero si cambian pesos.', 'Una solicitud normal no entrena.', 'Sin ambas señales devuelve preparacion.'] },
    reading: { core: 'El preentrenamiento aprende patrones generales a gran escala. El fine-tuning continúa la optimización con datos específicos. La inferencia aplica los pesos resultantes a nuevas entradas.', mechanics: 'Entrenar calcula una pérdida, gradientes y actualizaciones de parámetros. Inferir hace pases hacia adelante y decodifica tokens. Prompting, herramientas y RAG se ejecutan alrededor de la inferencia.', decisions: 'Usa prompting para instrucciones, RAG para conocimiento actualizable y fine-tuning cuando necesitas una conducta o formato estable respaldado por datos suficientes. Mide una base antes de ajustar.', errors: 'Fine-tuning no es una base de datos confiable ni una forma sencilla de actualizar hechos cada día. Confundir historial de chat con entrenamiento también crea expectativas falsas de memoria.', keyPoints: ['Inferencia mantiene pesos fijos.', 'RAG cambia contexto, no pesos.', 'Fine-tuning necesita datos y evaluación.'], question: '¿El modelo aprende de mi mensaje durante la conversación?', answer: 'No en el sentido de actualizar sus pesos durante esa llamada. La aplicación puede guardar el mensaje y reenviarlo como contexto; eso es estado, no entrenamiento.', transfer: 'Para una política que cambia cada semana, compara prompting, RAG y fine-tuning. Elige uno y explica la actualización.', sources: ['hf-llm-course', 'rag-paper'] },
    reasoning: { activity: decisionActivity('Clasifica cada cambio.', [['pesos', 'Optimizar con ejemplos etiquetados', ['entrenamiento', 'inferencia', 'RAG'], 'entrenamiento'], ['documento', 'Recuperar una política reciente', ['entrenamiento', 'inferencia', 'RAG'], 'RAG'], ['respuesta', 'Generar con pesos fijos', ['entrenamiento', 'inferencia', 'RAG'], 'inferencia']]), explanation: 'La señal decisiva es dónde vive el cambio: parámetros, contexto recuperado o salida de una llamada.', hints: ['RAG aporta documentos.', 'Solo una opción actualiza pesos.'] },
    debug: { title: 'Una solicitud parece entrenamiento', expected: 'Atender una solicitud con pesos fijos es inferencia.', observed: 'La función invierte las fases.', hints: ['Pregunta qué cambia.', 'atiende_solicitud no implica gradientes.', 'Evalúa actualiza_pesos primero.'] },
  }),
  authoredLesson({
    number: 11, module: 1, title: 'Alucinaciones, límites y términos comunes',
    summary: 'Trata una respuesta fluida como una hipótesis y decide cuándo exigir fuentes o revisión humana.',
    concepts: [['Alucinación', 'Salida plausible que no está respaldada por evidencia o es incorrecta.'], ['Grounding', 'Vinculación de la respuesta con datos verificables.'], ['Confianza calibrada', 'Relación entre una señal de confianza y la frecuencia real de aciertos.']],
    requires: ['distinguir-fases-modelo'], skill: 'verificar-salidas-modelo',
    mentalModel: 'Fluidez es una propiedad del texto; verdad es una propiedad que el sistema debe comprobar.',
    script: ['Un modelo optimiza la continuación probable, no una consulta automática a la verdad. Puede sonar seguro y estar equivocado.', 'El sistema reduce daño con fuentes, validación, límites de acción, casos sin respuesta y revisión humana según el riesgo.', 'La función decide si una salida necesita verificación. Un riesgo alto o la ausencia de evidencia activa la revisión.', 'Completa la política. No uses una confianza numérica como permiso universal para actuar.'],
    javascript: { example: `function requiere_revision(riesgo, tiene_fuente) {
  return riesgo === 'alto' || !tiene_fuente;
}
console.log(requiere_revision('alto', true));`, starter: `function requiere_revision(riesgo, tiene_fuente) {
  // Revisa riesgo alto o respuesta sin fuente.
}`, solution: `function requiere_revision(riesgo, tiene_fuente) {
  return riesgo === 'alto' || !tiene_fuente;
}`, debugStarter: `function requiere_revision(riesgo, tiene_fuente) {
  return riesgo === 'alto' && !tiene_fuente;
}` },
    python: { example: `def requiere_revision(riesgo, tiene_fuente):
    return riesgo == "alto" or not tiene_fuente

print(requiere_revision("alto", True))`, starter: `def requiere_revision(riesgo, tiene_fuente):
    # Revisa riesgo alto o respuesta sin fuente.
    pass`, solution: `def requiere_revision(riesgo, tiene_fuente):
    return riesgo == "alto" or not tiene_fuente`, debugStarter: `def requiere_revision(riesgo, tiene_fuente):
    return riesgo == "alto" and not tiene_fuente` },
    practice: { title: 'Aplica una política de revisión', instructions: 'Implementa requiere_revision(riesgo, tiene_fuente). Cualquiera de las dos señales puede exigir revisión.', functionName: 'requiere_revision', cases: [{ args: ['alto', true], expected: true, description: 'El riesgo alto requiere revisión aunque exista fuente' }, { args: ['bajo', false], expected: true, description: 'La falta de fuente requiere revisión' }, { args: ['bajo', true], expected: false, description: 'Permite un caso bajo y respaldado' }], hints: ['Las condiciones se combinan con o.', 'Prueba cada causa por separado.', 'Niega tiene_fuente para detectar ausencia.'] },
    reading: { core: 'Una alucinación es una afirmación o estructura no respaldada. Puede surgir por datos de entrenamiento, contexto insuficiente, conflicto entre fuentes, sampling o una tarea que exige adivinar.', mechanics: 'El sistema puede recuperar evidencia, exigir citas, validar JSON, comprobar valores con herramientas y abstenerse cuando faltan datos. La revisión humana se reserva para decisiones cuyo error tiene consecuencias altas.', decisions: 'Define niveles de riesgo antes de lanzar. Una recomendación recreativa y una acción médica no comparten el mismo umbral. Reduce permisos aunque la respuesta parezca confiable.', errors: 'Pedir al modelo que no alucine no crea una garantía. Una cita también puede estar inventada si no se valida contra documentos recuperados. La confianza declarada por el propio modelo no suele estar calibrada.', keyPoints: ['Trata la salida como dato no confiable.', 'El control crece con el impacto del error.', 'Abstenerse es un resultado válido.'], question: '¿RAG elimina las alucinaciones?', answer: 'No. Aporta evidencia, pero la recuperación puede fallar y el modelo puede ignorar o tergiversar fragmentos. Debes evaluar recuperación, citas y generación.', transfer: 'Define una política de revisión para un asistente que responde horarios y otra para uno que propone transferencias de dinero.', sources: ['owasp-genai-top10', 'rag-paper', 'deepeval-evaluation'] },
    reasoning: { activity: decisionActivity('Elige si debe intervenir una persona.', [['horario', 'Horario con fuente oficial y bajo impacto', ['revisar', 'mostrar'], 'mostrar'], ['pago', 'Orden de pago propuesta por el modelo', ['revisar', 'mostrar'], 'revisar'], ['sinfuente', 'Afirmación sin evidencia', ['revisar', 'mostrar'], 'revisar']]), explanation: 'La política considera evidencia e impacto. Una acción financiera requiere confirmación incluso con contexto.', hints: ['El impacto puede bastar para revisar.', 'Sin evidencia no se muestra como hecho.'] },
    debug: { title: 'Solo revisa si fallan dos cosas', expected: 'Riesgo alto o falta de fuente activan revisión por separado.', observed: 'La función exige que ambas condiciones ocurran juntas.', hints: ['Prueba alto con fuente.', 'and es demasiado restrictivo.', 'Usa una disyunción.'] },
  }),
];
