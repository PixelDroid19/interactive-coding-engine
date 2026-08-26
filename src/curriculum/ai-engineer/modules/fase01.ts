import { authoredLesson, decisionActivity, sequenceActivity } from '../authoring';

// Fase 1: Pensamiento y fundamentos.
// Aquí nace el TutorLocal: todavía piensa con reglas, pero ya tiene entrada,
// estados, datos y una forma de elegir respuestas que luego heredará el modelo.

export const AI_FASE_01 = [
  authoredLesson({
    number: 1, module: 0, title: 'Nace el chat: entrada, proceso y salida',
    summary: 'Define el contrato mínimo de un mensaje antes de escribir cualquier lógica de IA.',
    concepts: [
      ['Entrada', 'Dato que el programa recibe del mundo exterior.'],
      ['Proceso', 'Transformación que el programa aplica a la entrada.'],
      ['Salida', 'Resultado observable que el programa devuelve.'],
    ],
    skill: 'f1-definir-tarea',
    capacidad: { nombre: 'preparar_entrada', descripcion: 'El chat valida lo que la persona escribe antes de intentar responder.' },
    integracion: 'El TutorLocal abre su primera puerta: cada mensaje del chat pasa por preparar_entrada antes de tocar el historial. Toda capacidad futura se colgará de este mismo punto de control.',
    mentalModel: 'Un chat es un programa: recibe texto, lo transforma y devuelve texto. La IA es solo uno de los procesos posibles.',
    script: [
      'Durante todo el curso vas a construir un chat educativo que corre dentro de tu navegador. Su nombre es TutorLocal.',
      'Todo programa útil tiene tres partes: recibe una entrada, aplica un proceso y produce una salida. Un chat no es la excepción.',
      'Hoy el chat aprende su primera regla de entrada. Si el texto llega vacío no hay conversación posible, así que lo detectamos antes de continuar.',
      'Completa preparar_entrada para limpiar espacios y rechazar mensajes sin contenido. Las pruebas traerán frases distintas a las del ejemplo.',
    ],
    javascript: {
      example: `function preparar_entrada(texto) {
  const limpio = texto.trim();
  return limpio.length > 0 ? limpio : null;
}

console.log(preparar_entrada('  hola  '));`,
      starter: `function preparar_entrada(texto) {
  // Devuelve el texto sin espacios de los extremos, o null si queda vacío.
}`,
      solution: `function preparar_entrada(texto) {
  const limpio = texto.trim();
  return limpio.length > 0 ? limpio : null;
}`,
      debugStarter: `function preparar_entrada(texto) {
  return texto.trim();
}`,
    },
    python: {
      example: `def preparar_entrada(texto):
    limpio = texto.strip()
    return limpio if len(limpio) > 0 else None

print(preparar_entrada("  hola  "))`,
      starter: `def preparar_entrada(texto):
    # Devuelve el texto sin espacios de los extremos, o None si queda vacío.
    pass`,
      solution: `def preparar_entrada(texto):
    limpio = texto.strip()
    return limpio if len(limpio) > 0 else None`,
      debugStarter: `def preparar_entrada(texto):
    return texto.strip()`,
    },
    practice: {
      title: 'La puerta de entrada',
      instructions: 'Implementa preparar_entrada(texto). Limpia los espacios de los extremos y devuelve null cuando no quede contenido.',
      functionName: 'preparar_entrada',
      cases: [
        { args: ['  hola  '], expected: 'hola', description: 'Quita espacios sobrantes y conserva la frase' },
        { args: ['   '], expected: null, description: 'Rechaza un mensaje que solo contiene espacios' },
        { args: ['¿Qué es un token?'], expected: '¿Qué es un token?', description: 'Conserva intacta una pregunta con contenido' },
      ],
      hints: [
        'Existe un método que recorta espacios de ambos extremos antes de medir.',
        'Traza dos casos: una frase rodeada de espacios y una cadena que queda vacía al limpiarla.',
        'Cuando después de limpiar la longitud sea cero, la salida debe ser null.',
      ],
    },
    reading: {
      core: 'Antes de hablar de modelos conviene ver el chat como lo que es: un programa. Recibe el texto de una persona, decide qué hacer con él y devuelve algo visible. Esta vista simple sostiene todo el curso.',
      mechanics: 'La función de entrada hace tres pasos: limpia el texto, comprueba si queda contenido y devuelve el resultado o una señal de rechazo. Devolver null hace explícita la ausencia de mensaje; una cadena vacía obligaría a cada capa siguiente a volver a preguntarse si hay texto.',
      mechanicsExample: `preparar_entrada('  hola  ')
→ 'hola'
preparar_entrada('   ')
→ null`,
      decisions: 'Valida en la frontera, es decir, justo donde el dato entra. Un chequeo temprano evita propagar basura hacia el historial, hacia el modelo y hacia la pantalla. Delegar toda la validación al modelo cuesta dinero, tiempo y confianza.',
      errors: 'Contar los espacios como contenido deja pasar mensajes fantasma. Usar una cadena vacía como señal de error confunde un mensaje legítimo con la ausencia de mensaje. Y validar tarde obliga a repetir comprobaciones en cada capa.',
      keyPoints: [
        'Valida la entrada en la frontera, antes de gastar trabajo.',
        'null comunica ausencia de dato mejor que una cadena vacía.',
        'Cada capacidad nueva del chat empezará con un contrato pequeño como este.',
      ],
      question: '¿Hace falta validar si el modelo entiende cualquier texto?',
      answer: 'Entender no es aceptar. Un mensaje vacío gasta una llamada, ensucia el historial y confunde a quien lee la conversación. La validación protege al sistema, no al modelo.',
      transfer: 'Elige una aplicación que uses a diario y describe una de sus funciones con sus partes: entrada, proceso y salida.',
      sources: ['roadmap-ai-engineer', 'hf-llm-course'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el recorrido de un mensaje dentro del chat.', [
        ['texto', 'Texto escrito por la persona'],
        ['validar', 'Validar la entrada'],
        ['proceso', 'Aplicar la regla del chat'],
        ['salida', 'Producir respuesta o rechazo'],
      ]),
      explanation: 'El mensaje se valida antes de que cualquier proceso trabaje con él. La salida llega siempre: una respuesta o un rechazo claro.',
      hints: ['Nada procesa un texto que aún no pasó la validación.', 'El rechazo también es una salida observable.'],
    },
    debug: {
      title: 'El chat acepta espacios',
      expected: 'Una entrada sin contenido se rechaza con null.',
      observed: 'La función devuelve la cadena vacía y el flujo continúa como si hubiera mensaje.',
      hints: ['Ejecuta el caso de los tres espacios.', 'Recortar no basta: falta comprobar qué quedó después.', 'Compara la longitud del texto limpio con cero antes de devolverlo.'],
    },
  }),
  authoredLesson({
    number: 2, module: 0, title: 'Algoritmos y estados: cómo decide el chat',
    summary: 'Modela la conversación como un ciclo de estados con transiciones explícitas.',
    concepts: [
      ['Algoritmo', 'Secuencia finita de pasos que transforma una entrada en una salida.'],
      ['Estado', 'Información que resume la situación actual del programa.'],
    ],
    requires: ['f1-definir-tarea'],
    skill: 'f1-disenar-flujo',
    capacidad: { nombre: 'siguiente_estado', descripcion: 'El chat avanza por estados visibles mientras conversa, sin saltos misteriosos.' },
    integracion: 'Desde hoy el chat gira en torno a un ciclo de estados: esperando, procesando, respondiendo. Cuando llegue el modelo real al TutorLocal, cambiará el proceso interior, no el ciclo.',
    mentalModel: 'Una conversación es un mapa de estados; cada acción mueve el chat de un punto a otro por caminos dibujados.',
    script: [
      'Un algoritmo es una receta: pasos definidos que llevan de una entrada a una salida. Sin pasos claros, el chat improvisa y nadie puede depurarlo.',
      'Los programas con interfaz viven en estados. El nuestro espera tu mensaje, procesa y muestra la respuesta. Cada transición debe estar escrita.',
      'El ejemplo guarda las transiciones en una tabla y consulta la tabla con estado más acción. Si no existe la combinación, el chat se queda donde estaba.',
      'Completa la tabla de transiciones. Una acción desconocida nunca debe romper el ciclo ni inventar un estado nuevo.',
    ],
    javascript: {
      example: `function siguiente_estado(estado, accion) {
  const transiciones = {
    esperando_enviar: 'procesando',
    procesando_listo: 'respondiendo',
    respondiendo_enviar: 'esperando',
  };
  return transiciones[estado + '_' + accion] ?? estado;
}

console.log(siguiente_estado('esperando', 'enviar'));`,
      starter: `function siguiente_estado(estado, accion) {
  // Tabla: esperando+enviar, procesando+listo, respondiendo+enviar.
  // Si la combinación no existe, devuelve el estado recibido.
}`,
      solution: `function siguiente_estado(estado, accion) {
  const transiciones = {
    esperando_enviar: 'procesando',
    procesando_listo: 'respondiendo',
    respondiendo_enviar: 'esperando',
  };
  return transiciones[estado + '_' + accion] ?? estado;
}`,
      debugStarter: `function siguiente_estado(estado, accion) {
  return 'procesando';
}`,
    },
    python: {
      example: `def siguiente_estado(estado, accion):
    transiciones = {
        "esperando_enviar": "procesando",
        "procesando_listo": "respondiendo",
        "respondiendo_enviar": "esperando",
    }
    return transiciones.get(estado + "_" + accion, estado)

print(siguiente_estado("esperando", "enviar"))`,
      starter: `def siguiente_estado(estado, accion):
    # Tabla: esperando+enviar, procesando+listo, respondiendo+enviar.
    # Si la combinación no existe, devuelve el estado recibido.
    pass`,
      solution: `def siguiente_estado(estado, accion):
    transiciones = {
        "esperando_enviar": "procesando",
        "procesando_listo": "respondiendo",
        "respondiendo_enviar": "esperando",
    }
    return transiciones.get(estado + "_" + accion, estado)`,
      debugStarter: `def siguiente_estado(estado, accion):
    return "procesando"`,
    },
    practice: {
      title: 'Dibuja el ciclo',
      instructions: 'Implementa siguiente_estado(estado, accion) con la tabla de transiciones. Combinaciones desconocidas dejan el estado como está.',
      functionName: 'siguiente_estado',
      cases: [
        { args: ['esperando', 'enviar'], expected: 'procesando', description: 'Enviar un mensaje pone al chat a procesar' },
        { args: ['procesando', 'listo'], expected: 'respondiendo', description: 'Terminar el proceso lleva a mostrar la respuesta' },
        { args: ['respondiendo', 'enviar'], expected: 'esperando', description: 'Tras responder, el chat vuelve a esperar' },
        { args: ['esperando', 'escribir'], expected: 'esperando', description: 'Una acción sin transición declarada no mueve el ciclo' },
      ],
      hints: [
        'Una tabla con claves compuestas evita escribir condiciones anidadas.',
        'Traza las tres transiciones válidas antes de pensar en el caso raro.',
        'Para combinaciones fuera de la tabla, el valor por defecto es el propio estado.',
      ],
    },
    reading: {
      core: 'Un algoritmo convierte una intención en pasos comprobables. En un chat, esos pasos forman un ciclo: esperar la entrada, procesarla y devolver una salida. Dibujar el ciclo antes de codificar revela casos olvidados.',
      mechanics: 'La tabla de transiciones relaciona pares de estado y acción con el estado siguiente. Consultarla mantiene la lógica en un único lugar. La combinación ausente devuelve el estado actual: el programa nunca aterriza en un punto que nadie diseñó.',
      mechanicsExample: `siguiente_estado('esperando', 'enviar')
→ 'procesando'
siguiente_estado('esperando', 'bailar')
→ 'esperando'`,
      decisions: 'Prefiere tablas de datos ante condiciones encadenadas: crecen mejor y se leen de un vistazo. Declara un comportamiento por defecto para lo inesperado. Si un estado nuevo aparece en el papel, añádelo a la tabla antes de escribir código.',
      errors: 'Devolver siempre el mismo estado congela la conversación. Inventar estados no declarados crea caminos imposibles de depurar. Y olvidar el caso por defecto provoca valores nulos que explotan lejos de su origen.',
      keyPoints: [
        'El ciclo del chat es una tabla de transiciones, no magia.',
        'Toda acción necesita destino declarado o un quedarse quieto consciente.',
        'Las tablas de datos escalan mejor que las cadenas de if.',
      ],
      question: '¿Por qué no basta con una variable booleana ocupado?',
      answer: 'Un booleano solo distingue dos situaciones. El chat necesita distinguir esperar, procesar y responder para deshabilitar botones, mostrar progreso y evitar envíos duplicados.',
      transfer: 'Describe en papel el ciclo de estados de un semáforo o de una lavadora, con sus acciones y transiciones.',
      sources: ['roadmap-ai-engineer', 'hf-llm-course'],
    },
    reasoning: {
      activity: decisionActivity('Decide el estado siguiente en el ciclo del chat.', [
        ['enviar', 'Estás en esperando y pulsas enviar', ['procesando', 'respondiendo'], 'procesando'],
        ['listo', 'Estás en procesando y el trabajo termina', ['procesando', 'respondiendo'], 'respondiendo'],
        ['raro', 'Estás en esperando y llega una acción sin transición', ['cambia', 'se queda'], 'se queda'],
      ]),
      explanation: 'Las transiciones válidas avanzan el ciclo. Lo no declarado no mueve el estado: eso es previsibilidad.',
      hints: ['Revisa la tabla antes de decidir.', 'Sin transición declarada no hay movimiento.'],
    },
    debug: {
      title: 'El chat vive en procesando',
      expected: 'Cada transición válida lleva a su estado correcto.',
      observed: 'La función devuelve procesando para cualquier entrada.',
      hints: ['Prueba el par procesando y listo.', 'La respuesta fija ignora los argumentos.', 'Consulta una tabla construida con estado y acción.'],
    },
  }),
  authoredLesson({
    number: 3, module: 0, title: 'La lista de mensajes: datos antes que pantallas',
    summary: 'Guarda el historial como una estructura inmutable de mensajes con rol y texto.',
    concepts: [
      ['Estructura de datos', 'Forma de organizar información para usarla después.'],
      ['Inmutabilidad', 'Crear versiones nuevas en lugar de modificar las existentes.'],
    ],
    requires: ['f1-disenar-flujo'],
    skill: 'f1-modelar-mensajes',
    capacidad: { nombre: 'guardar_mensaje', descripcion: 'El historial del chat existe como datos fiables antes que como burbujas en pantalla.' },
    integracion: 'La lista que devuelve guardar_mensaje es el esqueleto del TutorLocal: el panel de conversación la dibuja, el presupuesto de tokens la medirá y la memoria la resumirá más adelante.',
    mentalModel: 'La conversación es una lista ordenada de objetos; la pantalla es solo una vista de esa lista.',
    script: [
      'Antes de dibujar burbujas bonitas necesitamos decidir cómo se guarda una conversación. Los datos bien elegidos hacen fácil todo lo demás.',
      'Cada mensaje será un objeto con dos campos: rol y texto. Toda la conversación será una lista de esos objetos, en orden.',
      'El ejemplo añade un mensaje creando una lista nueva en lugar de tocar la antigua. Así conservamos la historia anterior intacta para depurar o deshacer.',
      'Completa guardar_mensaje sin modificar la lista recibida. Las pruebas comprobarán que el mensaje anterior sigue ahí después de guardar.',
    ],
    javascript: {
      example: `function guardar_mensaje(mensajes, rol, texto) {
  return [...mensajes, { rol, texto }];
}

console.log(guardar_mensaje([], 'usuario', 'hola'));`,
      starter: `function guardar_mensaje(mensajes, rol, texto) {
  // Devuelve una lista NUEVA con los mensajes previos y el nuevo al final.
}`,
      solution: `function guardar_mensaje(mensajes, rol, texto) {
  return [...mensajes, { rol, texto }];
}`,
      debugStarter: `function guardar_mensaje(mensajes, rol, texto) {
  return { rol, texto };
}`,
    },
    python: {
      example: `def guardar_mensaje(mensajes, rol, texto):
    return [*mensajes, {"rol": rol, "texto": texto}]

print(guardar_mensaje([], "usuario", "hola"))`,
      starter: `def guardar_mensaje(mensajes, rol, texto):
    # Devuelve una lista NUEVA con los mensajes previos y el nuevo al final.
    pass`,
      solution: `def guardar_mensaje(mensajes, rol, texto):
    return [*mensajes, {"rol": rol, "texto": texto}]`,
      debugStarter: `def guardar_mensaje(mensajes, rol, texto):
    return {"rol": rol, "texto": texto}`,
    },
    practice: {
      title: 'Conserva la conversación',
      instructions: 'Implementa guardar_mensaje(mensajes, rol, texto). Devuelve una lista nueva que conserva todos los mensajes anteriores y añade el nuevo al final.',
      functionName: 'guardar_mensaje',
      cases: [
        { args: [[], 'usuario', 'hola'], expected: [{ rol: 'usuario', texto: 'hola' }], description: 'Arranca una conversación con el primer mensaje' },
        { args: [[{ rol: 'asistente', texto: '¡Hola!' }], 'usuario', '¿Cómo estás?'], expected: [{ rol: 'asistente', texto: '¡Hola!' }, { rol: 'usuario', texto: '¿Cómo estás?' }], description: 'Añade un mensaje sin borrar el anterior' },
      ],
      hints: [
        'Copiar la lista original antes de añadir protege el historial previo.',
        'El objeto nuevo lleva exactamente dos campos: rol y texto.',
        'Devolver solo el objeto nuevo pierde todo lo que ya había.',
      ],
    },
    reading: {
      core: 'Guardar bien los datos precede a cualquier inteligencia. Una conversación es una secuencia con orden y autores, y esa estructura se presta a búsquedas, recortes y resúmenes que vendrán después.',
      mechanics: 'Cada mensaje es un objeto pequeño con rol y texto. Añadir uno crea una lista nueva copiando la anterior. Este estilo, llamado inmutabilidad, deja rastro claro de cada versión y evita efectos sorpresa entre capas del programa.',
      mechanicsExample: `guardar_mensaje([], 'usuario', 'hola')
→ [{ rol: 'usuario', texto: 'hola' }]`,
      decisions: 'Elige campos mínimos y suficientes: rol dice quién habla y texto dice qué. Añade campos extra solo cuando una necesidad real los pida, como marcas de tiempo para ordenar o identificadores para citar.',
      errors: 'Mutar la lista recibida altera el historial que otras capas ya estaban leyendo. Guardar solo el último mensaje destruye el contexto. Y mezclar formatos, a veces texto plano y a veces objetos, rompe cualquier código que consuma la lista.',
      keyPoints: [
        'El historial es una lista de objetos con rol y texto.',
        'Crear una lista nueva evita efectos secundarios silenciosos.',
        'La interfaz del chat dibuja estos datos; no son los datos quienes imitan a la pantalla.',
      ],
      question: '¿Por qué importa la inmutabilidad en un chat?',
      answer: 'Varias capas leen el historial: la pantalla, el presupuesto de tokens y el futuro modelo. Si una capa lo modifica, las demás ven otra conversación. Copiar antes de añadir mantiene a todos de acuerdo.',
      transfer: 'Piensa en el carrito de una tienda online y define la estructura mínima de un ítem y de la lista completa.',
      sources: ['hf-llm-course', 'openai-prompting'],
    },
    reasoning: {
      activity: decisionActivity('Clasifica cada decisión sobre el historial.', [
        ['campos', 'Guardar rol y texto en cada mensaje', ['buena estructura', 'estructura frágil'], 'buena estructura'],
        ['mutar', 'Modificar directamente la lista compartida', ['buena estructura', 'estructura frágil'], 'estructura frágil'],
      ]),
      explanation: 'Campos mínimos y copias defensivas mantienen el historial estable para todas las capas que lo lean.',
      hints: ['Pregunta quién más lee esa lista.', 'Los objetos pequeños con campos claros viajan mejor.'],
    },
    debug: {
      title: 'El nuevo mensaje borra el pasado',
      expected: 'La lista resultante conserva los mensajes anteriores y añade el nuevo.',
      observed: 'Se devuelve únicamente el objeto del último mensaje.',
      hints: ['Comprueba cuántos elementos salen cuando la entrada ya tenía uno.', 'Falta arrastrar la lista recibida hacia la salida.', 'Copia los mensajes previos y concatena el objeto nuevo al final.'],
    },
  }),
  authoredLesson({
    number: 4, module: 0, title: 'Modelo e inferencia: elegir entre candidatas',
    summary: 'Entiende inferencia como una elección puntuada que tu código puede practicar hoy.',
    concepts: [
      ['Modelo', 'Sistema entrenado que propone salidas a partir de entradas.'],
      ['Inferencia', 'Ejecutar el modelo para obtener una salida concreta.'],
      ['Puntuación', 'Número que expresa la preferencia del modelo por cada opción.'],
    ],
    requires: ['f1-modelar-mensajes'],
    skill: 'f1-leer-inferencia',
    capacidad: { nombre: 'elegir_respuesta', descripcion: 'El chat elige su contestación entre candidatas puntuadas, el mismo gesto que luego hará el modelo.' },
    integracion: 'Hoy el chat elige su respuesta con una tabla de puntuaciones dentro de elegir_respuesta. En la Fase 3, Qwen2.5 sobre WebGPU producirá esas puntuaciones token a token dentro del TutorLocal, y esta función se jubilará con honores.',
    mentalModel: 'Un modelo de lenguaje propone candidatas con puntuaciones; responder es elegir una y devolverla.',
    script: [
      'Un modelo no adivina: calcula puntuaciones para varias salidas posibles y alguna estrategia elige una. Ese gesto se llama inferencia.',
      'Podemos practicar ese gesto sin redes neuronales. Con una tabla de respuestas candidatas y sus puntuaciones, elegir la mayor reproduce la idea central.',
      'El ejemplo recorre las candidatas y conserva la de puntuación máxima. Da igual el orden en que aparezcan: gana el número, no la posición.',
      'Completa elegir_respuesta para cualquier tabla. Las pruebas cambiarán nombres, tamaños y orden de las opciones.',
    ],
    javascript: {
      example: `function elegir_respuesta(distribucion) {
  let ganadora = null;
  let maxima = -Infinity;
  for (const [respuesta, puntos] of Object.entries(distribucion)) {
    if (puntos > maxima) { maxima = puntos; ganadora = respuesta; }
  }
  return ganadora;
}

console.log(elegir_respuesta({ 'Hola, ¿en qué te ayudo?': 0.7, 'No entiendo': 0.3 }));`,
      starter: `function elegir_respuesta(distribucion) {
  // Devuelve la clave con la puntuación más alta.
}`,
      solution: `function elegir_respuesta(distribucion) {
  let ganadora = null;
  let maxima = -Infinity;
  for (const [respuesta, puntos] of Object.entries(distribucion)) {
    if (puntos > maxima) { maxima = puntos; ganadora = respuesta; }
  }
  return ganadora;
}`,
      debugStarter: `function elegir_respuesta(distribucion) {
  return Object.keys(distribucion)[0];
}`,
    },
    python: {
      example: `def elegir_respuesta(distribucion):
    return max(distribucion, key=distribucion.get)

print(elegir_respuesta({"Hola, ¿en qué te ayudo?": 0.7, "No entiendo": 0.3}))`,
      starter: `def elegir_respuesta(distribucion):
    # Devuelve la clave con la puntuación más alta.
    pass`,
      solution: `def elegir_respuesta(distribucion):
    return max(distribucion, key=distribucion.get)`,
      debugStarter: `def elegir_respuesta(distribucion):
    return next(iter(distribucion))`,
    },
    practice: {
      title: 'Elige como un modelo',
      instructions: 'Implementa elegir_respuesta(distribucion). Recibe candidatas con sus puntuaciones y devuelve la frase ganadora sin importar el orden.',
      functionName: 'elegir_respuesta',
      cases: [
        { args: [{ 'Hola, ¿en qué te ayudo?': 0.7, 'No entiendo': 0.3 }], expected: 'Hola, ¿en qué te ayudo?', description: 'Gana la candidata con mayor puntuación' },
        { args: [{ 'Adiós': 0.2, 'Hasta luego': 0.8 }], expected: 'Hasta luego', description: 'El orden de escritura no decide nada' },
        { args: [{ 'a': 0.5, 'b': 0.25, 'c': 0.25 }], expected: 'a', description: 'Con tres candidatas sigue valiendo la máxima' },
      ],
      hints: [
        'Necesitas recordar la mejor candidata vista hasta ahora mientras recorres todas.',
        'Compara puntuaciones numéricas, no posiciones en la tabla.',
        'Devuelve la clave ganadora, nunca su puntuación.',
      ],
    },
    reading: {
      core: 'Inferir es ejecutar un modelo ya entrenado para producir una salida. El modelo calcula puntuaciones para cada candidata y una regla de elección las convierte en una única respuesta. Todo lo demás del curso se apoya en este gesto.',
      mechanics: 'En un modelo real las candidatas son tokens y las puntuaciones vienen de millones de operaciones. Aquí la tabla es pequeña y las puntuaciones las escribimos a mano. Cambia la escala, no el patrón: puntuar, comparar, devolver.',
      mechanicsExample: `elegir_respuesta({ 'saludo': 0.6, 'eco': 0.9 })
→ 'eco'`,
      decisions: 'Con puntuaciones a mano decides tú la política; con un modelo la política aprende de datos. En ambos casos conviene registrar qué opciones existían y qué puntuaron, porque explica la respuesta y prepara la depuración.',
      errors: 'Creer que la primera clave de la tabla es la favorita confunde orden de escritura con preferencia. Interpretar la puntuación como verdad absoluta también falla: expresa preferencia del modelo bajo ese contexto, no certidumbre.',
      keyPoints: [
        'La inferencia produce puntuaciones; la elección las convierte en respuesta.',
        'El orden de las candidatas no debería afectar al resultado.',
        'Registrar candidatas y puntuaciones facilita explicar por qué se respondió esto.',
      ],
      question: '¿Este ejercicio es realmente inferencia?',
      answer: 'Es la parte observable del patrón: candidatas, puntuaciones y elección. A la red neuronal la sustituimos por una tabla; el contrato con el resto del sistema queda idéntico.',
      transfer: 'Escribe tres candidatas de respuesta para un mensaje cotidiano y asigna puntuaciones que sumen uno. ¿Cuál ganaría?',
      sources: ['hf-llm-course', 'google-prompt-design'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena un paso de inferencia.', [
        ['candidatas', 'Tener candidatas posibles'],
        ['puntuar', 'Calcular puntuaciones'],
        ['comparar', 'Comparar puntuaciones'],
        ['devolver', 'Devolver la elegida'],
      ]),
      explanation: 'Primero existen opciones y números; la elección llega al final y cierra el paso de inferencia.',
      hints: ['Sin candidatas no hay nada que puntuar.', 'La comparación ocurre después de tener los números.'],
    },
    debug: {
      title: 'Gana la primera de la fila',
      expected: 'La candidata con la puntuación más alta resulta elegida.',
      observed: 'La función devuelve siempre la primera clave escrita.',
      hints: ['Coloca la mejor opción en última posición y observa.', 'Object.keys no mira números.', 'Recorre pares clave y puntuación guardando la máxima.'],
    },
  }),
];
