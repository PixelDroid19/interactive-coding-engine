import { authoredLesson, contextBudgetActivity, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

// Fase 2: Conversación con modelos.
// El TutorLocal aprende a hablar: mensajes con roles, historial, instrucción
// del sistema, parámetros, streaming y salidas estructuradas.

export const AI_FASE_02 = [
  authoredLesson({
    number: 5, module: 1, title: 'Mensajes con roles',
    summary: 'Da a cada intervención un rol claro para que el modelo sepa quién habla.',
    concepts: [
      ['Mensaje', 'Unidad de conversación con rol y contenido.'],
      ['Rol', 'Etiqueta que indica quién habla: sistema, usuario o asistente.'],
    ],
    requires: ['f1-leer-inferencia'],
    skill: 'crear-mensaje-roles',
    capacidad: { nombre: 'crear_mensaje', descripcion: 'Cada intervención del chat lleva un rol explícito desde el primer día.' },
    integracion: 'Los tres roles de crear_mensaje son los mismos que entenderá el modelo local: el TutorLocal ya habla su idioma. El historial de la clase anterior pasa a almacenar estos objetos.',
    mentalModel: 'Una conversación es teatro con tres papeles: la dirección (sistema), el público (usuario) y el actor (asistente).',
    script: [
      'El chat ya guarda mensajes, pero le falta una pieza: saber quién habla. Para eso existen los roles.',
      'Hay tres papeles. El sistema fija la conducta, la persona escribe como usuario y el chat contesta como asistente.',
      'El ejemplo construye el mensaje validando el rol contra la lista permitida. Un rol desconocido devuelve null en lugar de colarse en la conversación.',
      'Completa crear_mensaje con las dos validaciones. Las pruebas intentarán colar roles inventados.',
    ],
    javascript: {
      example: `function crear_mensaje(rol, contenido) {
  const validos = ['sistema', 'usuario', 'asistente'];
  if (!validos.includes(rol)) return null;
  return { rol, contenido };
}

console.log(crear_mensaje('usuario', '¿Qué es RAG?'));`,
      starter: `function crear_mensaje(rol, contenido) {
  // Acepta solo sistema, usuario o asistente; otro rol devuelve null.
}`,
      solution: `function crear_mensaje(rol, contenido) {
  const validos = ['sistema', 'usuario', 'asistente'];
  if (!validos.includes(rol)) return null;
  return { rol, contenido };
}`,
      debugStarter: `function crear_mensaje(rol, contenido) {
  return { rol, contenido };
}`,
    },
    python: {
      example: `def crear_mensaje(rol, contenido):
    validos = ("sistema", "usuario", "asistente")
    if rol not in validos:
        return None
    return {"rol": rol, "contenido": contenido}

print(crear_mensaje("usuario", "¿Qué es RAG?"))`,
      starter: `def crear_mensaje(rol, contenido):
    # Acepta solo sistema, usuario o asistente; otro rol devuelve None.
    pass`,
      solution: `def crear_mensaje(rol, contenido):
    validos = ("sistema", "usuario", "asistente")
    if rol not in validos:
        return None
    return {"rol": rol, "contenido": contenido}`,
      debugStarter: `def crear_mensaje(rol, contenido):
    return {"rol": rol, "contenido": contenido}`,
    },
    practice: {
      title: 'Asigna el papel',
      instructions: 'Implementa crear_mensaje(rol, contenido). Devuelve el objeto con ambos campos cuando el rol sea sistema, usuario o asistente, y null con cualquier otro.',
      functionName: 'crear_mensaje',
      cases: [
        { args: ['usuario', 'Explícame los embeddings'], expected: { rol: 'usuario', contenido: 'Explícame los embeddings' }, description: 'Acepta un mensaje legítimo de la persona' },
        { args: ['asistente', 'Claro, empecemos'], expected: { rol: 'asistente', contenido: 'Claro, empecemos' }, description: 'Acepta la respuesta del chat' },
        { args: ['director', 'Hazme caso'], expected: null, description: 'Rechaza un rol fuera del reparto' },
      ],
      hints: [
        'Primero comprueba si el rol pertenece a la lista cerrada.',
        'Traza un rol válido y uno inventado antes de escribir la salida.',
        'Con rol válido devuelve un objeto con dos campos exactos: rol y contenido.',
      ],
    },
    reading: {
      core: 'Los modelos conversacionales no reciben una frase suelta: reciben turnos etiquetados. El rol del sistema expresa la política de la aplicación, el usuario trae la petición y el asistente responde. Sin etiquetas, el modelo confunde órdenes con datos.',
      mechanics: 'Cada proveedor serializa estos roles a su formato interno, pero el concepto es universal. La validación ocurre en tu código: si aceptas cualquier cadena como rol, el historial deja de ser confiable y el modelo puede interpretar un mensaje del usuario como instrucción propia.',
      mechanicsExample: `crear_mensaje('sistema', 'Responde en español')
→ { rol: 'sistema', contenido: 'Responde en español' }`,
      decisions: 'Reserva el rol sistema para instrucciones estables controladas por la aplicación. Todo lo que escriba la persona entra como usuario, sin excepciones amistosas. El asistente queda reservado a lo que genere el modelo o tus reglas.',
      errors: 'Permitir roles libres abre la puerta a suplantación: alguien puede enviar un mensaje con rol sistema. Guardar el contenido sin validar el rol rompe el contrato más adelante, cuando el historial viaje al modelo.',
      keyPoints: [
        'Tres roles bastan: sistema, usuario y asistente.',
        'La lista válida vive en tu código y se comprueba al crear cada mensaje.',
        'Un rol inválido se rechaza con null, nunca se corrige en silencio.',
      ],
      question: '¿Quién puede escribir mensajes de sistema?',
      answer: 'Solo la aplicación. El usuario siempre escribe con rol usuario, aunque su texto contenga órdenes. Distinguir autoría es la primera defensa frente a la confusión de instrucciones.',
      transfer: 'Piensa en un grupo de chat de trabajo: ¿quién haría de sistema, quiénes son usuarios y qué mensajes serían del asistente?',
      sources: ['openai-prompting', 'anthropic-prompt-engineering'],
    },
    reasoning: {
      activity: decisionActivity('Clasifica cada intervención por su rol correcto.', [
        ['politica', 'Texto fijo de la aplicación que limita la longitud', ['sistema', 'usuario', 'asistente'], 'sistema'],
        ['pregunta', 'Persona pregunta por horarios', ['sistema', 'usuario', 'asistente'], 'usuario'],
        ['respuesta', 'Contenido generado por el chat', ['sistema', 'usuario', 'asistente'], 'asistente'],
      ]),
      explanation: 'El rol describe quién controla el texto, no dónde aparece en pantalla.',
      hints: ['Pregunta quién escribió y quién controla ese texto.', 'Lo generado por el chat nunca es usuario.'],
    },
    debug: {
      title: 'Se cuelan roles inventados',
      expected: 'Solo sistema, usuario y asistente forman mensajes.',
      observed: 'Cualquier cadena se acepta como rol.',
      hints: ['Prueba el rol director.', 'Falta comparar contra la lista cerrada.', 'Devuelve null antes de construir el objeto cuando el rol no pertenece al reparto.'],
    },
  }),
  authoredLesson({
    number: 6, module: 1, title: 'Historial bajo presupuesto',
    summary: 'Recorta el historial conservando lo reciente para controlar el tamaño del contexto.',
    concepts: [
      ['Contexto', 'Información que el modelo puede ver en una llamada.'],
      ['Presupuesto', 'Espacio máximo disponible, medido en mensajes o tokens.'],
    ],
    requires: ['crear-mensaje-roles'],
    skill: 'recortar-historial',
    capacidad: { nombre: 'recortar_historial', descripcion: 'El chat decide qué parte del pasado cabe en cada llamada.' },
    integracion: 'Antes de cada envío, el TutorLocal pasará el historial por recortar_historial. Lo antiguo no desaparece de pantalla: solo deja de viajar al modelo cuando no cabe.',
    mentalModel: 'El contexto es una maleta pequeña: llevarlo todo es imposible, así que eliges lo reciente y lo útil.',
    script: [
      'Todo modelo tiene un límite de contexto. Si reenvías el historial completo cada vez, tarde o temprano no cabrá.',
      'La estrategia más sencilla y honesta es conservar los últimos mensajes hasta agotar el presupuesto. Lo antiguo sigue en pantalla, solo deja de viajar.',
      'El ejemplo corta desde el final con slice y copia la lista antes. Un presupuesto cero o negativo devuelve una lista vacía sin error.',
      'Completa recortar_historial para cualquier tamaño. Las pruebas usarán listas y presupuestos distintos a los del ejemplo.',
    ],
    javascript: {
      example: `function recortar_historial(mensajes, maximo) {
  if (maximo <= 0) return [];
  return mensajes.slice(-maximo);
}

console.log(recortar_historial(['a', 'b', 'c'], 2));`,
      starter: `function recortar_historial(mensajes, maximo) {
  // Conserva los últimos mensajes según el presupuesto.
  // Con presupuesto cero o negativo devuelve una lista vacía.
}`,
      solution: `function recortar_historial(mensajes, maximo) {
  if (maximo <= 0) return [];
  return mensajes.slice(-maximo);
}`,
      debugStarter: `function recortar_historial(mensajes, maximo) {
  return mensajes.slice(0, maximo);
}`,
    },
    python: {
      example: `def recortar_historial(mensajes, maximo):
    if maximo <= 0:
        return []
    return mensajes[-maximo:]

print(recortar_historial(["a", "b", "c"], 2))`,
      starter: `def recortar_historial(mensajes, maximo):
    # Conserva los últimos mensajes según el presupuesto.
    # Con presupuesto cero o negativo devuelve una lista vacía.
    pass`,
      solution: `def recortar_historial(mensajes, maximo):
    if maximo <= 0:
        return []
    return mensajes[-maximo:]`,
      debugStarter: `def recortar_historial(mensajes, maximo):
    return mensajes[:maximo]`,
    },
    practice: {
      title: 'Cierra la maleta',
      instructions: 'Implementa recortar_historial(mensajes, maximo). Devuelve los mensajes más recientes dentro del presupuesto y una lista vacía si no hay espacio.',
      functionName: 'recortar_historial',
      cases: [
        { args: [['m1', 'm2', 'm3'], 2], expected: ['m2', 'm3'], description: 'Conserva lo más reciente cuando falta espacio' },
        { args: [['m1', 'm2', 'm3'], 0], expected: [], description: 'Sin presupuesto no viaja nada' },
        { args: [['m1'], 5], expected: ['m1'], description: 'Un presupuesto holgado devuelve todo sin inventar' },
      ],
      hints: [
        'Lo reciente está al final de la lista, no al principio.',
        'El caso de presupuesto cero necesita una decisión explícita antes de cortar.',
        'Comprueba qué ocurre cuando el presupuesto supera la cantidad de mensajes.',
      ],
    },
    reading: {
      core: 'El contexto de un modelo es finito y compartido: instrucciones, documentos, historial y respuesta compiten por el mismo espacio. Recortar el historial es la primera herramienta de gestión y también la más barata.',
      mechanics: 'slice desde el final toma los últimos elementos sin mutar el original. El coste de esta operación es mínimo comparado con enviar tokens de más. Más adelante este mismo corte convivirá con resúmenes y memoria recuperada.',
      mechanicsExample: `recortar_historial(['a', 'b', 'c', 'd'], 2)
→ ['c', 'd']`,
      decisions: 'Define cuántos mensajes viajan según el ancho medio de tus mensajes, no por superstición. Si la conversación depende de algo dicho hace tiempo, ese hecho debe vivir en la instrucción del sistema o en memoria, no esperar milagros del recorte.',
      errors: 'Cortar desde el principio conserva lo viejo y tira lo nuevo. Un corte silencioso sin explicación en la interfaz hace creer al usuario que el chat olvidó algo por capricho. Y devolver el mismo arreglo mutado corrompe el historial visible.',
      keyPoints: [
        'El presupuesto existe porque el contexto del modelo es finito.',
        'Lo reciente suele pesar más que lo antiguo en una conversación.',
        'El recorte cambia lo que viaja al modelo, no lo que ve la persona.',
      ],
      question: '¿Recortar el historial hace que el chat olvide?',
      answer: 'Deja de ver lo recortado en esa llamada. Si un dato antiguo importa, súbalo a la instrucción del sistema o guárdelo en memoria; el recorte solo gestiona espacio, no significado.',
      transfer: 'Una conversación dura una hora. Decide qué guardaría completo, qué resumiría y qué dejaría fuera del contexto.',
      sources: ['hf-llm-course', 'anthropic-prompt-caching'],
    },
    reasoning: {
      activity: contextBudgetActivity('Selecciona qué bloques viajan al modelo con 10 unidades de presupuesto.', 10, [
        ['sistema', 'Instrucción del sistema', 3, true],
        ['usuario', 'Mensaje actual', 2, true],
        ['historial', 'Historial antiguo', 6],
        ['resumen', 'Resumen de lo anterior', 3],
      ], ['sistema', 'usuario', 'resumen']),
      explanation: 'Lo obligatorio consume cinco unidades. Entre historial antiguo y resumen, el resumen aporta contexto con menos coste.',
      hints: ['Los dos bloques obligatorios viajan siempre.', 'Quedan cinco unidades para elegir entre los opcionales.'],
    },
    debug: {
      title: 'Conserva lo viejo y pierde lo nuevo',
      expected: 'El recorte mantiene los mensajes finales.',
      observed: 'La función toma los primeros elementos de la lista.',
      hints: ['Prueba con tres mensajes y presupuesto dos.', 'El índice inicial no representa recencia.', 'Corta contando desde el final de la lista.'],
    },
  }),
  authoredLesson({
    number: 7, module: 1, title: 'La instrucción del sistema',
    summary: 'Compone la voz y las reglas del chat en un mensaje de sistema con valores por defecto sensatos.',
    concepts: [
      ['Instrucción del sistema', 'Mensaje estable que orienta la conducta del modelo.'],
      ['Valor por defecto', 'Alternativa usada cuando falta un dato de configuración.'],
    ],
    requires: ['recortar-historial'],
    skill: 'construir-sistema',
    capacidad: { nombre: 'construir_sistema', descripcion: 'El panel del chat puede editar personalidad y reglas, y siempre produce una instrucción completa.' },
    integracion: 'El TutorLocal gana su primer ajuste editable: la caja Instrucción del sistema llama a construir_sistema cada vez que la persona cambia la configuración. Los ejemplos incluidos enseñan al modelo el formato esperado.',
    mentalModel: 'El mensaje de sistema es la ficha de personaje del chat: personalidad más reglas escritas antes de la función.',
    script: [
      'Hasta ahora el chat improvisaba su tono. La instrucción del sistema lo define una sola vez y aplica a toda la conversación.',
      'Una buena instrucción junta dos piezas: quién es el asistente y qué reglas debe respetar. Si falta una pieza, entrará un valor por defecto razonable.',
      'El ejemplo une personalidad y reglas con punto y separador, y reserva textos por defecto para los huecos. Nada queda a medias.',
      'Completa construir_sistema con los dos valores por defecto. Las pruebas omitirán piezas distintas para comprobar cada hueco.',
    ],
    javascript: {
      example: `function construir_sistema(personalidad, reglas) {
  const quien = personalidad.trim() ? personalidad.trim() : 'Eres un tutor educativo.';
  const que = reglas.trim() ? reglas.trim() : 'Responde en español.';
  return quien + ' ' + que;
}

console.log(construir_sistema('Un tutor paciente.', 'Usa ejemplos cortos.'));`,
      starter: `function construir_sistema(personalidad, reglas) {
  // Une ambas partes con un espacio.
  // Personalidad ausente: 'Eres un tutor educativo.'
  // Reglas ausentes: 'Responde en español.'
}`,
      solution: `function construir_sistema(personalidad, reglas) {
  const quien = personalidad.trim() ? personalidad.trim() : 'Eres un tutor educativo.';
  const que = reglas.trim() ? reglas.trim() : 'Responde en español.';
  return quien + ' ' + que;
}`,
      debugStarter: `function construir_sistema(personalidad, reglas) {
  return 'Eres un tutor educativo. Responde en español.';
}`,
    },
    python: {
      example: `def construir_sistema(personalidad, reglas):
    quien = personalidad.strip() or "Eres un tutor educativo."
    que = reglas.strip() or "Responde en español."
    return quien + " " + que

print(construir_sistema("Un tutor paciente.", "Usa ejemplos cortos."))`,
      starter: `def construir_sistema(personalidad, reglas):
    # Une ambas partes con un espacio.
    # Personalidad ausente: 'Eres un tutor educativo.'
    # Reglas ausentes: 'Responde en español.'
    pass`,
      solution: `def construir_sistema(personalidad, reglas):
    quien = personalidad.strip() or "Eres un tutor educativo."
    que = reglas.strip() or "Responde en español."
    return quien + " " + que`,
      debugStarter: `def construir_sistema(personalidad, reglas):
    return "Eres un tutor educativo. Responde en español."`,
    },
    practice: {
      title: 'Redacta la ficha',
      instructions: "Implementa construir_sistema(personalidad, reglas). Une las dos partes con un espacio tras limpiar espacios. Usa 'Eres un tutor educativo.' si la personalidad queda vacía y 'Responde en español.' si faltan las reglas.",
      functionName: 'construir_sistema',
      cases: [
        { args: ['Un tutor paciente.', 'Usa ejemplos cortos.'], expected: 'Un tutor paciente. Usa ejemplos cortos.', description: 'Une personalidad y reglas proporcionadas' },
        { args: ['  ', 'Sé breve.'], expected: 'Eres un tutor educativo. Sé breve.', description: 'Aplica la personalidad por defecto cuando falta' },
        { args: ['Un mentor práctico.', '   '], expected: 'Un mentor práctico. Responde en español.', description: 'Aplica la regla por defecto cuando falta' },
      ],
      hints: [
        'Limpia cada parte antes de decidir si está vacía.',
        'Traza los tres casos: todo presente, falta personalidad y faltan reglas.',
        'El resultado siempre contiene las dos piezas separadas por un espacio.',
      ],
    },
    reading: {
      core: 'La instrucción del sistema concentra la identidad del chat: propósito, tono y límites. Escribirla como plantilla con valores por defecto convierte una frase artesanal en una pieza configurable y evaluable.',
      mechanics: 'La función limpia ambas partes, sustituye huecos por defectos declarados y une el resultado. Ese texto viaja con rol sistema en todas las llamadas. Cambiarlo altera la conducta sin tocar código, y por eso el panel del chat puede editarlo.',
      mechanicsExample: `construir_sistema('', '')
→ 'Eres un tutor educativo. Responde en español.'`,
      decisions: 'Escribe personalidades breves y observables. Una regla útil se puede comprobar: idioma, longitud, formato o prohibiciones concretas. Incluye ejemplos dentro de las reglas cuando el formato importe, porque muestran la frontera mejor que adjetivos.',
      errors: 'Personalidades grandilocuentes consumen contexto y prometen cualidades que nada garantiza. Reglas contradictorias dejan al modelo eligiendo al azar. Y confiar en que la instrucción basta, sin validaciones posteriores, confunde deseo con control.',
      keyPoints: [
        'Personalidad más reglas componen el mensaje de sistema.',
        'Los valores por defecto evitan instrucciones a medias.',
        'Toda regla importante se acompaña de una comprobación en código.',
      ],
      question: '¿Cuántas reglas caben en la instrucción?',
      answer: 'Las mínimas que resuelvan fallos observados. Cada regla añade lectura para el modelo y riesgo de contradicción. Empieza con dos o tres y mide su efecto antes de ampliar.',
      transfer: 'Redacta personalidad y tres reglas para un chat de biblioteca que recomienda libros sin revelar preferencias políticas.',
      sources: ['anthropic-prompt-engineering', 'google-prompt-design'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena cómo nace la instrucción del sistema.', [
        ['limpiar', 'Limpiar las partes recibidas'],
        ['defectos', 'Aplicar valores por defecto a los huecos'],
        ['unir', 'Unir personalidad y reglas'],
        ['enviar', 'Enviarla con rol sistema en cada llamada'],
      ]),
      explanation: 'La plantilla normaliza primero y compone después. El resultado estable viaja entero en cada turno.',
      hints: ['No unas textos sucios con espacios sobrantes.', 'La instrucción viaja en todos los turnos, no solamente en el primero.'],
    },
    debug: {
      title: 'La ficha ignora tu configuración',
      expected: 'Personalidad y reglas recibidas aparecen en el resultado.',
      observed: 'Siempre se devuelven los dos textos por defecto.',
      hints: ['Prueba con ambas partes presentes.', 'Los parámetros no participan en la salida.', 'Usa cada valor limpio y recurre al defecto solo si queda vacío.'],
    },
  }),
  authoredLesson({
    number: 8, module: 1, title: 'Restricciones que el código puede comprobar',
    summary: 'Convierte límites escritos en lenguaje humano en comprobaciones automáticas de salida.',
    concepts: [
      ['Restricción', 'Límite explícito sobre contenido o forma de la respuesta.'],
      ['Validación de salida', 'Comprobación automática antes de mostrar o usar un texto.'],
    ],
    requires: ['construir-sistema'],
    skill: 'validar-restricciones',
    capacidad: { nombre: 'salida_valida', descripcion: 'Ninguna respuesta cruza hacia la pantalla sin pasar el filtro de longitud y palabras prohibidas.' },
    integracion: 'salida_valida se instala justo después de recibir texto del modelo. Si falla, el TutorLocal muestra el aviso de restricción incumplida en lugar de la respuesta, y la conversación continúa con confianza.',
    mentalModel: 'Las reglas del prompt comunican intención; la validación impone cumplimiento. Uno persuade, la otra impide.',
    script: [
      'Pedir por favor que la respuesta sea corta ayuda, pero no garantiza nada. Las restricciones importantes necesitan un portero.',
      'Hoy instalamos ese portero: longitud máxima y lista de palabras prohibidas, ignorando mayúsculas y minúsculas.',
      'El ejemplo combina dos condiciones con un y lógico. Basta una violación para rechazar todo el texto.',
      'Completa salida_valida con ambas comprobaciones. Las pruebas traerán prohibidas distintas y longitudes al límite.',
    ],
    javascript: {
      example: `function salida_valida(texto, maximo, prohibidas) {
  const minusculas = texto.toLowerCase();
  const sin_prohibidas = !prohibidas.some((palabra) => minusculas.includes(palabra.toLowerCase()));
  return texto.length <= maximo && sin_prohibidas;
}

console.log(salida_valida('Respuesta breve', 30, ['secreto']));`,
      starter: `function salida_valida(texto, maximo, prohibidas) {
  // true solo si la longitud respeta el máximo
  // y ninguna palabra prohibida aparece, sin fijarse en mayúsculas.
}`,
      solution: `function salida_valida(texto, maximo, prohibidas) {
  const minusculas = texto.toLowerCase();
  const sin_prohibidas = !prohibidas.some((palabra) => minusculas.includes(palabra.toLowerCase()));
  return texto.length <= maximo && sin_prohibidas;
}`,
      debugStarter: `function salida_valida(texto, maximo, prohibidas) {
  return texto.length <= maximo || !prohibidas.some((p) => texto.includes(p));
}`,
    },
    python: {
      example: `def salida_valida(texto, maximo, prohibidas):
    minusculas = texto.lower()
    limpio = all(p.lower() not in minusculas for p in prohibidas)
    return len(texto) <= maximo and limpio

print(salida_valida("Respuesta breve", 30, ["secreto"]))`,
      starter: `def salida_valida(texto, maximo, prohibidas):
    # True solo si la longitud respeta el máximo
    # y ninguna palabra prohibida aparece, sin fijarse en mayúsculas.
    pass`,
      solution: `def salida_valida(texto, maximo, prohibidas):
    minusculas = texto.lower()
    sin_prohibidas = all(p.lower() not in minusculas for p in prohibidas)
    return len(texto) <= maximo and sin_prohibidas`,
      debugStarter: `def salida_valida(texto, maximo, prohibidas):
    return len(texto) <= maximo or all(p not in texto for p in prohibidas)`,
    },
    practice: {
      title: 'Instala el portero',
      instructions: 'Implementa salida_valida(texto, maximo, prohibidas). Devuelve true solo cuando el texto respeta la longitud máxima y evita todas las palabras prohibidas, sin distinguir mayúsculas.',
      functionName: 'salida_valida',
      cases: [
        { args: ['La clave es práctica diaria.', 40, ['secreto']], expected: true, description: 'Acepta un texto dentro de límites y limpio' },
        { args: ['Esto guarda el SECRETO del examen.', 60, ['secreto']], expected: false, description: 'Detecta la palabra prohibida en mayúsculas' },
        { args: ['Respuesta demasiado extensa para el panel', 10, []], expected: false, description: 'Rechaza un texto que excede la longitud' },
        { args: ['Breve.', 10, ['largo']], expected: true, description: 'Sin coincidencias reales, el texto pasa' },
      ],
      hints: [
        'Normaliza el texto a minúsculas una sola vez y compara contra él.',
        'Las dos condiciones deben cumplirse juntas; revisa el conector.',
        'Compara longitudes con menor o igual para aceptar el límite exacto.',
      ],
    },
    reading: {
      core: 'Una restricción bien diseñada tiene dos mitades: la frase que informa al modelo y la comprobación que verifica el resultado. Solo la segunda es exigible. Esta separación convierte deseos en contratos.',
      mechanics: 'La validación normaliza mayúsculas para evitar evasiones triviales, mide longitud con menor o igual y busca cada palabra prohibida como subcadena. Cualquier fallo invalida el texto completo: no se recortan ni se censuran trozos, se rechaza y se explica.',
      mechanicsExample: `salida_valida('SECRETO encontrado', 50, ['secreto'])
→ false`,
      decisions: 'Prohibe por listas pequeñas y justificadas; las listas enormes generan falsos positivos. Elige máximos de longitud acordes al panel donde se muestra. Cuando una restricción no pueda comprobarse con código, necesitará revisión humana en lugar de automatismo.',
      errors: 'Validar con o en lugar de con y abre la puerta a cualquier fallo único. Buscar la palabra exacta con distinción de mayúsculas deja pasar SECRETOS. Y censurar silenciosamente sin avisar convierte un control en un misterio para quien usa el chat.',
      keyPoints: [
        'Prompt persuade; validación impone.',
        'Normalizar mayúsculas cierra la evasión más simple.',
        'Un rechazo siempre viene acompañado de una razón visible.',
      ],
      question: '¿Basta con escribir en el sistema que no diga ciertas palabras?',
      answer: 'Reduce probabilidades, no garantiza nada. El modelo puede fallar y el texto puede llegar por otra vía. La palabra crítica exige comprobación posterior porque el coste de dejarla pasar es real.',
      transfer: 'Escribe tres restricciones para un chat infantil y marca cuáles podrías comprobar con código y cuáles no.',
      sources: ['google-prompt-design', 'owasp-genai-top10'],
    },
    reasoning: {
      activity: flowActivity('Recorre una respuesta hasta la pantalla.', [
        ['generar', 'Recibir propuesta del modelo', 'start'],
        ['medir', 'Comprobar longitud', 'process'],
        ['buscar', 'Buscar prohibidas', 'decision'],
        ['mostrar', 'Mostrar al usuario', 'end'],
        ['avisar', 'Mostrar motivo de rechazo', 'output'],
      ], [
        ['generar', 'medir'],
        ['medir', 'buscar'],
        ['buscar', 'mostrar', 'limpia'],
        ['buscar', 'avisar', 'prohibida'],
      ]),
      explanation: 'La salida pasa por dos puertas consecutivas. Cualquier puerta cerrada desvía hacia un aviso comprensible en lugar de un bloqueo mudo.',
      hints: ['Longitud y contenido se miden antes de mostrar.', 'Un rechazo también merece un mensaje.'],
    },
    debug: {
      title: 'Una condición basta',
      expected: 'Longitud y contenido deben ser válidos a la vez.',
      observed: 'La función acepta cuando cualquiera de las dos condiciones se cumple.',
      hints: ['Prueba un texto corto con palabra prohibida.', 'El conector lógico es demasiado permisivo.', 'Exige ambas comprobaciones con un y y compara en minúsculas.'],
    },
  }),
  authoredLesson({
    number: 9, module: 1, title: 'Temperatura y top-p: controlar la variedad',
    summary: 'Aplica top-p sobre candidatas puntuadas y observa cuándo la variedad ayuda o estorba.',
    concepts: [
      ['Temperatura', 'Parámetro que ajusta la concentración de la distribución.'],
      ['Top-p', 'Corte que conserva el conjunto mínimo de candidatas cuya probabilidad acumulada alcanza el umbral.'],
    ],
    requires: ['validar-restricciones'],
    skill: 'controlar-top-p',
    capacidad: { nombre: 'aplicar_top_p', descripcion: 'El panel de parámetros del chat traduce el top-p elegido a un conjunto concreto de candidatas.' },
    integracion: 'Cuando el TutorLocal genere con el modelo local, aplicar_top_p explicará en el panel qué opciones quedaron vivas tras el corte. Ver la lista hace tangible un parámetro abstracto.',
    mentalModel: 'Top-p llena una bolsa con las candidatas más probables hasta alcanzar la masa acordada; el azar solo elige dentro de esa bolsa.',
    script: [
      'Los parámetros de generación no cambian lo que el modelo sabe: cambian cómo se elige entre sus propuestas.',
      'Top-p ordena las candidatas de mayor a menor probabilidad y las mete en la bolsa hasta superar el umbral. Con umbral bajo la bolsa es casi determinista; con uno alto admite sorpresas.',
      'El ejemplo ordena, acumula y detiene la bolsa en cuanto alcanza el umbral. La candidata que cruza la línea entra.',
      'Completa aplicar_top_p para umbrales bajos y altos. Con umbral uno entran todas.',
    ],
    javascript: {
      example: `function aplicar_top_p(distribucion, umbral) {
  const ordenadas = Object.entries(distribucion).sort((a, b) => b[1] - a[1]);
  const bolsa = [];
  let acumulado = 0;
  for (const [clave, puntos] of ordenadas) {
    bolsa.push(clave);
    acumulado += puntos;
    if (acumulado >= umbral) break;
  }
  return bolsa;
}

console.log(aplicar_top_p({ a: 0.5, b: 0.3, c: 0.2 }, 0.7));`,
      starter: `function aplicar_top_p(distribucion, umbral) {
  // Ordena por puntuación descendente y acumula
  // hasta alcanzar el umbral; la que lo cruza entra.
}`,
      solution: `function aplicar_top_p(distribucion, umbral) {
  const ordenadas = Object.entries(distribucion).sort((a, b) => b[1] - a[1]);
  const bolsa = [];
  let acumulado = 0;
  for (const [clave, puntos] of ordenadas) {
    bolsa.push(clave);
    acumulado += puntos;
    if (acumulado >= umbral) break;
  }
  return bolsa;
}`,
      debugStarter: `function aplicar_top_p(distribucion, umbral) {
  return Object.keys(distribucion).slice(0, umbral);
}`,
    },
    python: {
      example: `def aplicar_top_p(distribucion, umbral):
    bolsa = []
    acumulado = 0
    for clave, puntos in sorted(distribucion.items(), key=lambda item: item[1], reverse=True):
        bolsa.append(clave)
        acumulado += puntos
        if acumulado >= umbral:
            break
    return bolsa

print(aplicar_top_p({"a": 0.5, "b": 0.3, "c": 0.2}, 0.7))`,
      starter: `def aplicar_top_p(distribucion, umbral):
    # Ordena por puntuación descendente y acumula
    # hasta alcanzar el umbral; la que lo cruza entra.
    pass`,
      solution: `def aplicar_top_p(distribucion, umbral):
    bolsa = []
    acumulado = 0
    for clave, puntos in sorted(distribucion.items(), key=lambda item: item[1], reverse=True):
        bolsa.append(clave)
        acumulado += puntos
        if acumulado >= umbral:
            break
    return bolsa`,
      debugStarter: `def aplicar_top_p(distribucion, umbral):
    return list(distribucion)[:int(umbral)]`,
    },
    practice: {
      title: 'Llena la bolsa',
      instructions: 'Implementa aplicar_top_p(distribucion, umbral). Ordena por puntuación descendente, acumula y detente justo cuando el total alcance o supere el umbral. Devuelve las claves de la bolsa.',
      functionName: 'aplicar_top_p',
      cases: [
        { args: [{ a: 0.5, b: 0.3, c: 0.2 }, 0.7], expected: ['a', 'b'], description: 'Dos candidatas cruzan el umbral setenta' },
        { args: [{ a: 0.5, b: 0.3, c: 0.2 }, 1], expected: ['a', 'b', 'c'], description: 'Umbral uno conserva toda la distribución' },
        { args: [{ x: 0.9, y: 0.1 }, 0.5], expected: ['x'], description: 'Una dominante basta para cubrir el umbral' },
        { args: [{ p: 0.4, q: 0.35, r: 0.25 }, 0.74], expected: ['p', 'q'], description: 'La candidata que cruza la línea entra completa' },
      ],
      hints: [
        'Sin ordenar primero, la acumulación depende del orden de escritura.',
        'Lleva un contador de masa acumulada mientras llenas la bolsa.',
        'La condición de parada se comprueba después de añadir cada candidata.',
      ],
    },
    reading: {
      core: 'Después de puntuar candidatas, la generación decide cuántas quedan en juego. Temperatura reescala las puntuaciones y top-p corta por masa acumulada. Ambos definen el equilibrio entre estabilidad y sorpresa.',
      mechanics: 'Ordenar convierte un diccionario en una fila ordenada por preferencia. Acumular suma probabilidades hasta el umbral y la candidata que cruza la línea entra completa aunque la sobre pase. El conjunto resultante es el único territorio donde el azar puede moverse.',
      mechanicsExample: `aplicar_top_p({ a: 0.5, b: 0.3, c: 0.2 }, 0.7)
→ ['a', 'b']`,
      decisions: 'Para tareas estructuradas como JSON o herramientas, umbrales bajos reducen variabilidad indeseada. Para proponer ideas o nombres, umbrales altos alimentan la exploración. El parámetro acompaña a la tarea; no existe un número universalmente correcto.',
      errors: 'Creer que bajar la temperatura arregla respuestas falsas confunde variedad con verdad. Cortar antes de ordenar produce bolsas arbitrarias. Y asumir que el umbral garantiza calidad ignora que las candidatas malas pueden dominar si el contexto fue pobre.',
      keyPoints: [
        'Los parámetros moldean la elección, no el conocimiento.',
        'Top-p corta por masa acumulada y la que cruza entra.',
        'Configura según la tarea y comprueba el efecto con casos propios.',
      ],
      question: '¿Qué top-p debería usar mi chat?',
      answer: 'Empieza alto para charlar y bajo para extraer datos. Luego decide con experimentos: haz la misma pregunta varias veces y observa si la variabilidad te sirve o molesta.',
      transfer: 'Elige configuración para un generador de nombres de mascotas y para un extractor de facturas. Justifica cada elección.',
      sources: ['hf-llm-course', 'google-prompt-design'],
    },
    reasoning: {
      activity: decisionActivity('Relaciona la tarea con el parámetro adecuado.', [
        ['json', 'Extraer un objeto JSON repetible', ['variedad alta', 'variedad baja'], 'variedad baja'],
        ['ideas', 'Proponer diez títulos creativos', ['variedad alta', 'variedad baja'], 'variedad alta'],
      ]),
      explanation: 'La estructura premia repetición; la creatividad pide candidatos diversos. En ambos casos la salida se valida igual.',
      hints: ['Pregunta qué pasa si dos ejecuciones difieren.', 'El JSON roto cuesta más que una idea repetida.'],
    },
    debug: {
      title: 'La bolsa corta por posición',
      expected: 'El corte sigue la masa acumulada tras ordenar.',
      observed: 'Se toman las primeras claves escritas usando el umbral como cantidad.',
      hints: ['Prueba un diccionario cuya mejor opción esté última.', 'El umbral es una masa de probabilidad, no un número de elementos.', 'Ordena descendente y acumula antes de decidir el corte.'],
    },
  }),
  authoredLesson({
    number: 10, module: 1, title: 'Streaming: responder por partes',
    summary: 'Divide un texto en fragmentos pequeños para mostrar la respuesta mientras llega.',
    concepts: [
      ['Streaming', 'Entrega de la respuesta en trozos conforme se genera.'],
      ['Fragmento', 'Porción pequeña de texto lista para mostrarse.'],
    ],
    requires: ['controlar-top-p'],
    skill: 'fragmentar-stream',
    capacidad: { nombre: 'fragmentar_stream', descripcion: 'La burbuja del chat crece palabra a palabra en lugar de aparecer completa de golpe.' },
    integracion: 'En la Fase 3 el modelo local del chat emitirá tokens reales en streaming. fragmentar_stream enseña hoy a la interfaz a pintar esos trozos, así el cambio de motor no tocará la pantalla.',
    mentalModel: 'Generar texto es un grifo: el streaming muestra el vaso llenándose en lugar de servirlo de golpe.',
    script: [
      'Esperar quince segundos mirando una pantalla en blanco se siente roto, incluso si la respuesta era buena. El streaming existe por eso.',
      'Un stream entrega fragmentos pequeños en orden. La interfaz los concatena y la respuesta crece ante tus ojos.',
      'El ejemplo agrupa palabras de tamaño fijo conservando el último grupo incompleto. Es la misma forma en que llegará el modelo real.',
      'Completa fragmentar_stream para tamaños cualesquiera. Texto vacío produce una lista vacía, no un fragmento fantasma.',
    ],
    javascript: {
      example: `function fragmentar_stream(texto, palabrasPorFragmento) {
  const palabras = texto.split(' ').filter(Boolean);
  const fragmentos = [];
  for (let i = 0; i < palabras.length; i += palabrasPorFragmento) {
    fragmentos.push(palabras.slice(i, i + palabrasPorFragmento).join(' '));
  }
  return fragmentos;
}

console.log(fragmentar_stream('uno dos tres cuatro cinco', 2));`,
      starter: `function fragmentar_stream(texto, palabrasPorFragmento) {
  // Agrupa palabras en fragmentos del tamaño dado.
  // El último grupo puede quedar incompleto.
}`,
      solution: `function fragmentar_stream(texto, palabrasPorFragmento) {
  const palabras = texto.split(' ').filter(Boolean);
  const fragmentos = [];
  for (let i = 0; i < palabras.length; i += palabrasPorFragmento) {
    fragmentos.push(palabras.slice(i, i + palabrasPorFragmento).join(' '));
  }
  return fragmentos;
}`,
      debugStarter: `function fragmentar_stream(texto, palabrasPorFragmento) {
  return [texto];
}`,
    },
    python: {
      example: `def fragmentar_stream(texto, palabras_por_fragmento):
    palabras = [p for p in texto.split(" ") if p]
    return [" ".join(palabras[i:i + palabras_por_fragmento]) for i in range(0, len(palabras), palabras_por_fragmento)]

print(fragmentar_stream("uno dos tres cuatro cinco", 2))`,
      starter: `def fragmentar_stream(texto, palabras_por_fragmento):
    # Agrupa palabras en fragmentos del tamaño dado.
    # El último grupo puede quedar incompleto.
    pass`,
      solution: `def fragmentar_stream(texto, palabras_por_fragmento):
    palabras = [p for p in texto.split(" ") if p]
    return [" ".join(palabras[i:i + palabras_por_fragmento]) for i in range(0, len(palabras), palabras_por_fragmento)]`,
      debugStarter: `def fragmentar_stream(texto, palabras_por_fragmento):
    return [texto]`,
    },
    practice: {
      title: 'Abre el grifo',
      instructions: 'Implementa fragmentar_stream(texto, palabrasPorFragmento). Agrupa las palabras en fragmentos del tamaño pedido, conserva el último incompleto y devuelve una lista vacía si no hay palabras.',
      functionName: 'fragmentar_stream',
      cases: [
        { args: ['uno dos tres cuatro cinco', 2], expected: ['uno dos', 'tres cuatro', 'cinco'], description: 'Avanza por grupos y conserva el resto final' },
        { args: ['hola mundo', 3], expected: ['hola mundo'], description: 'Un tamaño mayor que el texto devuelve un solo fragmento' },
        { args: ['   ', 2], expected: [], description: 'Texto sin palabras produce lista vacía' },
      ],
      hints: [
        'Separar por espacios deja cadenas vacías cuando hay espacios repetidos: filtra antes de agrupar.',
        'El índice avanza sumando el tamaño del grupo en cada vuelta.',
        'Cada fragmento vuelve a unirse con espacios internos.',
      ],
    },
    reading: {
      core: 'Streaming significa recibir la respuesta mientras se genera, no al terminar. Mejora la percepción de velocidad, permite cancelar a tiempo y expone problemas pronto. Su contrapartida es manejar estados incompletos con disciplina.',
      mechanics: 'El runtime del modelo emite eventos con trozos de texto. Tu código acumula los trozos en orden y redibuja la burbuja. Validaciones completas, como parsear un JSON, esperan al cierre; mientras tanto solo se muestra progreso.',
      mechanicsExample: `fragmentar_stream('uno dos tres', 2)
→ ['uno dos', 'tres']`,
      decisions: 'Muestra fragmentos crudos durante la generación y valida al final. Ofrece un botón cancelar desde el primer trozo. Para tareas estructuradas, considera un indicador de construcción en lugar de semibold JSON a medias.',
      errors: 'Parsear JSON parcial rompe en cuanto llega. Mostrar el último trozo duplicado por un render descuidado ensucia el texto. Y bloquear la interfaz mientras llega el stream anula el beneficio psicológico del streaming.',
      keyPoints: [
        'El stream entrega orden y fragmentos; tu código aporta acumulación.',
        'La validación fuerte espera al texto completo.',
        'Cancelar pronto es parte del contrato de streaming.',
      ],
      question: '¿Streaming cambia lo que responde el modelo?',
      answer: 'No cambia el contenido generado; cambia cuándo lo recibes. La misma llamada con streaming produce el mismo recorrido de tokens, solo visible antes.',
      transfer: 'Diseña los estados visibles de una burbuja de chat: vacío, recibiendo, completo y cancelado.',
      sources: ['hf-llm-course', 'webllm'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el ciclo de un stream en la interfaz.', [
        ['abrir', 'Empezar a recibir trozos'],
        ['pintar', 'Concatenar y redibujar'],
        ['cerrar', 'Detectar el fin del stream'],
        ['validar', 'Validar el texto completo'],
      ]),
      explanation: 'Durante la llegada solo se pinta; la validación fuerte pertenece al cierre.',
      hints: ['Pintar ocurre muchas veces; validar una sola.', 'El fin del stream precede a cualquier parseo.'],
    },
    debug: {
      title: 'Todo llega de golpe',
      expected: 'El texto sale dividido en fragmentos del tamaño pedido.',
      observed: 'La función devuelve una lista con el texto entero.',
      hints: ['Prueba cinco palabras con tamaño dos.', 'Falta recorrer la lista de palabras.', 'Agrupa con cortes que avancen el índice por el tamaño del grupo.'],
    },
  }),
  authoredLesson({
    number: 11, module: 1, title: 'Salidas JSON con validación',
    summary: 'Pide estructura al modelo y valida forma y valores antes de que el programa la use.',
    concepts: [
      ['Salida estructurada', 'Respuesta restringida a una forma que el programa puede consumir.'],
      ['JSON', 'Formato de texto con objetos, listas y valores simples.'],
      ['Validador', 'Código que comprueba forma y valores antes de aceptar datos.'],
    ],
    requires: ['fragmentar-stream'],
    skill: 'validar-json',
    capacidad: { nombre: 'extraer_intencion', descripcion: 'El chat entiende órdenes estructuradas y rechaza silenciosamente lo que no cumple el esquema.' },
    integracion: 'extraer_intencion habilita el modo comando del TutorLocal: si el texto parsea y cumple el esquema, la barra lateral ejecuta la acción; si no, cae al chat normal con su aviso correspondiente.',
    mentalModel: 'Pedir JSON es mitad del camino: el validador decide qué entra al programa.',
    script: [
      'Cuando otra parte del programa necesita consumir la respuesta, el texto libre no basta. Pedimos JSON y validamos antes de usarlo.',
      'Validar son dos pasos: parsear el texto para convertirlo en datos y comprobar campos, tipos y valores permitidos. Ningún paso sustituye al otro.',
      'El ejemplo parsea con protección de errores y luego revisa acción contra una lista cerrada y texto no vacío. Cualquier fallo devuelve null.',
      'Completa extraer_intencion con las tres comprobaciones. Las pruebas traen JSON roto y acciones desconocidas.',
    ],
    javascript: {
      example: `function extraer_intencion(texto) {
  let dato;
  try {
    dato = JSON.parse(texto);
  } catch {
    return null;
  }
  if (dato === null || typeof dato !== 'object') return null;
  if (!['responder', 'buscar'].includes(dato.accion)) return null;
  if (typeof dato.texto !== 'string' || dato.texto.length === 0) return null;
  return dato;
}

console.log(extraer_intencion('{"accion":"buscar","texto":"RAG"}'));`,
      starter: `function extraer_intencion(texto) {
  // Parsea con protección y valida: accion en responder|buscar,
  // texto de tipo cadena y no vacío. Cualquier fallo devuelve null.
}`,
      solution: `function extraer_intencion(texto) {
  let dato;
  try {
    dato = JSON.parse(texto);
  } catch {
    return null;
  }
  if (dato === null || typeof dato !== 'object') return null;
  if (!['responder', 'buscar'].includes(dato.accion)) return null;
  if (typeof dato.texto !== 'string' || dato.texto.length === 0) return null;
  return dato;
}`,
      debugStarter: `function extraer_intencion(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}`,
    },
    python: {
      example: `import json

def extraer_intencion(texto):
    try:
        dato = json.loads(texto)
    except ValueError:
        return None
    if not isinstance(dato, dict):
        return None
    if dato.get("accion") not in ("responder", "buscar"):
        return None
    campo = dato.get("texto")
    if not isinstance(campo, str) or len(campo) == 0:
        return None
    return dato

print(extraer_intencion('{"accion":"buscar","texto":"RAG"}'))`,
      starter: `import json

def extraer_intencion(texto):
    # Parsea con protección y valida: accion en responder|buscar,
    # texto de tipo cadena y no vacío. Cualquier fallo devuelve None.
    pass`,
      solution: `import json

def extraer_intencion(texto):
    try:
        dato = json.loads(texto)
    except ValueError:
        return None
    if not isinstance(dato, dict):
        return None
    if dato.get("accion") not in ("responder", "buscar"):
        return None
    campo = dato.get("texto")
    if not isinstance(campo, str) or len(campo) == 0:
        return None
    return dato`,
      debugStarter: `import json

def extraer_intencion(texto):
    try:
        return json.loads(texto)
    except ValueError:
        return None`,
    },
    practice: {
      title: 'Vigila la frontera JSON',
      instructions: 'Implementa extraer_intencion(texto). Parsea con protección y acepta solo objetos con accion igual a responder o buscar y un texto de tipo cadena no vacío. En cualquier otro caso devuelve null.',
      functionName: 'extraer_intencion',
      cases: [
        { args: ['{"accion":"buscar","texto":"historial"}'], expected: { accion: 'buscar', texto: 'historial' }, description: 'Acepta una orden completa y válida' },
        { args: ['esto no es json'], expected: null, description: 'Rechaza texto que no parsea' },
        { args: ['{"accion":"borrar_todo","texto":"x"}'], expected: null, description: 'Rechaza una acción fuera de la lista cerrada' },
        { args: ['{"accion":"responder","texto":""}'], expected: null, description: 'Rechaza un campo texto vacío' },
      ],
      hints: [
        'El parseo necesita protección porque el texto puede venir roto.',
        'Tras parsear, comprueba el tipo del dato antes de leer campos.',
        'La acción se compara contra una lista cerrada y el texto exige cadena con contenido.',
      ],
    },
    reading: {
      core: 'Una salida estructurada convierte al modelo en un componente programable: en lugar de prosa, entrega datos. Pero el JSON recibido es una hipótesis hasta que tu validador lo aprueba. Parsear y validar son pasos distintos e insustituibles.',
      mechanics: 'El flujo completo pide el esquema en el prompt o mediante herramientas del runtime, recibe texto, intenta parsearlo y comprueba tipos, enumeraciones y presencia. Después vendrían reglas del dominio, como verificar que un identificador pertenece a la persona actual.',
      mechanicsExample: `extraer_intencion('{"accion":"buscar","texto":"RAG"}')
→ { accion: 'buscar', texto: 'RAG' }`,
      decisions: "Usa listas cerradas siempre que puedas: comparar contra dos valores es más robusto que confiar en la imaginación del modelo. En el laboratorio de esta clase el modo JSON nativo del runtime, activado mediante response_format, guía la generación hacia tu esquema. Devuelve null o un error tipado en lugar de lanzar excepciones que nadie captura, y registra el texto original cuando la validación falle porque será tu evidencia para mejorar el prompt.",
      errors: 'Usar el objeto parseado sin comprobar campos produce errores lejos del origen. Aceptar cualquier acción convierte el validador en decoración. Y confiar porque el proveedor promete cumplir el esquema ignora redes rotas y versiones antiguas del modelo.',
      keyPoints: [
        'Parsear convierte texto en datos; validar decide si sirven.',
        'Listas cerradas y tipos explícitos hacen el contrato firme.',
        'null es una respuesta digna para datos que no cumplen.',
      ],
      question: '¿El laboratorio del curso activa JSON nativo del modelo?',
      answer: 'Sí: la práctica con el modelo local usa el modo estructurado para guiar la generación, y después vuelve a validar en JavaScript. Guía y validación se refuerzan; ninguno sustituye al otro.',
      transfer: 'Diseña el esquema mínimo para una orden de tu vida diaria: acción, objetivo y un campo opcional. ¿Qué validaciones añadirías?',
      sources: ['google-structured-output', 'openai-function-calling', 'transformers-js', 'webllm', 'qwen25-webllm', 'lfm25-350m', 'transformers-js-v4', 'codepen-transformers-js'],
    },
    reasoning: {
      activity: flowActivity('Conecta el camino de una salida JSON.', [
        ['pedir', 'Pedir esquema al modelo', 'start'],
        ['parsear', 'Intentar parseo', 'process'],
        ['validar', 'Validar forma y valores', 'decision'],
        ['usar', 'Entregar datos al programa', 'end'],
        ['descartar', 'Registrar fallo y avisar', 'output'],
      ], [
        ['pedir', 'parsear'],
        ['parsear', 'validar'],
        ['validar', 'usar', 'válida'],
        ['validar', 'descartar', 'inválida'],
      ]),
      explanation: 'El dato solo entra al programa después de dos filtros: parseo protegido y validación de contrato.',
      hints: ['El parseo puede fallar antes de validar nada.', 'Descartar incluye registrar evidencia.'],
    },
    debug: {
      title: 'Parsear parece suficiente',
      expected: 'Forma y valores se comprueban después del parseo.',
      observed: 'Cualquier JSON válido entra aunque incumpla el esquema.',
      hints: ['Prueba una acción desconocida con JSON bien formado.', 'El try protege el parseo, no el contrato.', 'Añade comprobaciones de tipo, lista cerrada y texto no vacío.'],
    },
  }),
  authoredLesson({
    number: 12, module: 1, title: 'Montar la conversación completa',
    summary: 'Integra sistema, historial y turno actual en el paquete exacto que espera un modelo.',
    concepts: [
      ['Payload', 'Paquete de datos que se envía a una API de chat.'],
      ['Turno', 'Intervención actual del usuario dentro de la secuencia.'],
    ],
    requires: ['validar-json'],
    skill: 'montar-conversacion',
    capacidad: { nombre: 'montar_conversacion', descripcion: 'El chat produce el paquete completo listo para cualquier proveedor local o remoto.' },
    integracion: 'montar_conversacion es el despachador central del TutorLocal: une la instrucción editable, el historial recortado y el mensaje nuevo. Toda fase futura enchufa aquí, sin reescribir la interfaz.',
    mentalModel: 'Enviar un turno es preparar una carpeta: la ficha de personaje arriba, la historia en medio, el mensaje nuevo al final.',
    script: [
      'Ya tienes piezas: mensajes con roles, historial recortado e instrucción de sistema. Hoy las unes en el paquete que cualquier API de chat espera.',
      'El orden importa: primero la ficha de sistema, después la historia tal como ocurrió y al final el mensaje nuevo de la persona.',
      'El ejemplo construye la carpeta con objetos consistentes. La instrucción llega como texto y se convierte en el primer mensaje.',
      'Completa montar_conversacion respetando posiciones. Las pruebas cambiarán historiales y mensajes para detectar atajos.',
    ],
    javascript: {
      example: `function montar_conversacion(sistema, historial, mensajeUsuario) {
  return [
    { rol: 'sistema', contenido: sistema },
    ...historial,
    { rol: 'usuario', contenido: mensajeUsuario },
  ];
}

console.log(montar_conversacion('Responde en español.', [], 'hola'));`,
      starter: `function montar_conversacion(sistema, historial, mensajeUsuario) {
  // Sistema primero, historial en medio, turno del usuario al final.
}`,
      solution: `function montar_conversacion(sistema, historial, mensajeUsuario) {
  return [
    { rol: 'sistema', contenido: sistema },
    ...historial,
    { rol: 'usuario', contenido: mensajeUsuario },
  ];
}`,
      debugStarter: `function montar_conversacion(sistema, historial, mensajeUsuario) {
  return [{ rol: 'usuario', contenido: mensajeUsuario }];
}`,
    },
    python: {
      example: `def montar_conversacion(sistema, historial, mensaje_usuario):
    return [{"rol": "sistema", "contenido": sistema}, *historial, {"rol": "usuario", "contenido": mensaje_usuario}]

print(montar_conversacion("Responde en español.", [], "hola"))`,
      starter: `def montar_conversacion(sistema, historial, mensaje_usuario):
    # Sistema primero, historial en medio, turno del usuario al final.
    pass`,
      solution: `def montar_conversacion(sistema, historial, mensaje_usuario):
    return [{"rol": "sistema", "contenido": sistema}, *historial, {"rol": "usuario", "contenido": mensaje_usuario}]`,
      debugStarter: `def montar_conversacion(sistema, historial, mensaje_usuario):
    return [{"rol": "usuario", "contenido": mensaje_usuario}]`,
    },
    practice: {
      title: 'Prepara la carpeta',
      instructions: 'Implementa montar_conversacion(sistema, historial, mensajeUsuario). Devuelve la lista con el mensaje de sistema primero, el historial intacto en medio y el turno del usuario al final.',
      functionName: 'montar_conversacion',
      cases: [
        { args: ['Responde en español.', [], 'hola'], expected: [{ rol: 'sistema', contenido: 'Responde en español.' }, { rol: 'usuario', contenido: 'hola' }], description: 'Con historial vacío quedan ficha y turno' },
        { args: ['Sé breve.', [{ rol: 'usuario', contenido: 'a' }, { rol: 'asistente', contenido: 'b' }], 'siguiente'], expected: [{ rol: 'sistema', contenido: 'Sé breve.' }, { rol: 'usuario', contenido: 'a' }, { rol: 'asistente', contenido: 'b' }, { rol: 'usuario', contenido: 'siguiente' }], description: 'Conserva el orden exacto de la conversación previa' },
      ],
      hints: [
        'La ficha de sistema se construye dentro de la función a partir del texto recibido.',
        'El historial entra tal cual, sin copiar sus objetos uno a uno.',
        'El turno nuevo siempre cierra la lista.',
      ],
    },
    reading: {
      core: 'Una llamada de chat es un paquete con orden significativo: política arriba, historia en medio, turno abajo. Centralizar ese armado en una única función evita divergencias entre pantallas, pruebas y proveedores.',
      mechanics: 'La función no decide contenido: compone. Por eso convive con recortar_historial, que ya dejó la historia en su tamaño final, y con construir_sistema, que entregó el texto estable. Cada capa aporta lo suyo y el paquete sale predecible.',
      mechanicsExample: `montar_conversacion('Regla', [], 'hola')
→ [{ rol: 'sistema', contenido: 'Regla' }, { rol: 'usuario', contenido: 'hola' }]`,
      decisions: 'Mantén este punto libre de lógica de negocio: si empieza a decidir cosas, otras rutas lo saltarán. Cualquier proveedor nuevo recibe el mismo paquete y su adaptador traduce nombres de campos. Así migrar de API o al backend futuro no toca la interfaz.',
      errors: 'Olvidar el mensaje de sistema desactiva la personalidad del chat sin ningún error visible. Duplicar el turno del usuario al copiar el historial confunde al modelo. Y mutar el historial recibido para insertarlo acopla esta capa con todas las demás.',
      keyPoints: [
        'Orden del paquete: sistema, historial, turno actual.',
        'El armado centralizado es el único lugar que conoce el formato.',
        'Los adaptadores de proveedor traducen; no reconstruyen.',
      ],
      question: '¿Este paquete sirve para el modelo local?',
      answer: 'Sí. WebLLM y las APIs compatibles consumen exactamente esta forma de lista de mensajes. En la próxima fase la misma función alimentará al modelo que corre en tu navegador.',
      transfer: 'Añade en papel un tercer caso: ¿qué pasaría si quisieras regenerar la última respuesta sin repetir el turno?',
      sources: ['openai-prompting', 'webllm'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena las capas del paquete enviado al modelo.', [
        ['ficha', 'Mensaje de sistema'],
        ['pasado', 'Historial recortado'],
        ['turno', 'Mensaje nuevo del usuario'],
        ['respuesta', 'Espacio para la salida'],
      ]),
      explanation: 'La política abre, la historia contextualiza y el turno cierra. La respuesta ocupa su propio lugar después.',
      hints: ['La ficha no va en medio.', 'El turno nuevo es lo último que escribe la persona.'],
    },
    debug: {
      title: 'El paquete perdió la ficha y el pasado',
      expected: 'Sistema, historial y turno aparecen en ese orden.',
      observed: 'Solo viaja el mensaje nuevo del usuario.',
      hints: ['Prueba con un historial de dos mensajes.', 'Faltan las dos primeras piezas del paquete.', 'Construye la lista empezando por el mensaje de sistema.'],
    },
  }),
];
