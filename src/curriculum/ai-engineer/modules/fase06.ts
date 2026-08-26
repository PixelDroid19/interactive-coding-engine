import { authoredLesson, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

// Fase 6: Un sistema más confiable.
// El TutorLocal gana memoria, herramientas controladas, defensas frente
// a la manipulación, evaluación de calidad y métricas visibles.

export const AI_FASE_06 = [
  authoredLesson({
    number: 29, module: 5, title: 'Memoria de conversación',
    summary: 'Conserva preferencias del usuario en una memoria separada que se actualiza sin destruir lo previo.',
    concepts: [
      ['Estado', 'Datos actuales necesarios para continuar una tarea.'],
      ['Memoria', 'Información seleccionada que sobrevive al turno actual.'],
      ['Actualización inmutable', 'Crear una versión nueva conservando los campos anteriores.'],
    ],
    requires: ['decidir-abstencion'],
    skill: 'actualizar-memoria',
    capacidad: { nombre: 'actualizar_memoria', descripcion: 'El chat recuerda tu nombre y tus preferencias entre sesiones sin mezclarlas con el historial.' },
    integracion: 'El panel Memoria del TutorLocal muestra el objeto que administra actualizar_memoria: nombre, tono favorito o idioma. Cada dato indica su origen y se puede borrar con un clic.',
    mentalModel: 'El historial es la grabación de la conversación; la memoria es la libreta de notas que sacas antes de cada nuevo encuentro.',
    script: [
      'Un modelo no recuerda nada entre llamadas. Todo recuerdo útil debe vivir en datos de tu aplicación.',
      'La memoria guarda poco y con propósito: nombre, tono preferido, nivel. Se actualiza creando un objeto nuevo para no romper lo que otras capas están leyendo.',
      'El ejemplo copia los campos existentes y añade o reemplaza uno usando la clave dinámica recibida.',
      'Completa actualizar_memoria conservando todo lo previo. Las pruebas comprobarán que ningún campo desaparece.',
    ],
    javascript: {
      example: `function actualizar_memoria(memoria, clave, valor) {
  return { ...memoria, [clave]: valor };
}

console.log(actualizar_memoria({ nombre: 'Ana' }, 'tono', 'breve'));`,
      starter: `function actualizar_memoria(memoria, clave, valor) {
  // Devuelve un objeto NUEVO con todos los campos previos
  // y la clave recibida establecida al valor dado.
}`,
      solution: `function actualizar_memoria(memoria, clave, valor) {
  return { ...memoria, [clave]: valor };
}`,
      debugStarter: `function actualizar_memoria(memoria, clave, valor) {
  return { [clave]: valor };
}`,
    },
    python: {
      example: `def actualizar_memoria(memoria, clave, valor):
    return {**memoria, clave: valor}

print(actualizar_memoria({"nombre": "Ana"}, "tono", "breve"))`,
      starter: `def actualizar_memoria(memoria, clave, valor):
    # Devuelve un objeto NUEVO con todos los campos previos
    # y la clave recibida establecida al valor dado.
    pass`,
      solution: `def actualizar_memoria(memoria, clave, valor):
    return {**memoria, clave: valor}`,
      debugStarter: `def actualizar_memoria(memoria, clave, valor):
    return {clave: valor}`,
    },
    practice: {
      title: 'La libreta no pierde hojas',
      instructions: 'Implementa actualizar_memoria(memoria, clave, valor). Devuelve un objeto nuevo que conserva todos los campos previos y añade o reemplaza solo la clave indicada.',
      functionName: 'actualizar_memoria',
      cases: [
        { args: [{ nombre: 'Ana' }, 'tono', 'breve'], expected: { nombre: 'Ana', tono: 'breve' }, description: 'Añade una preferencia sin borrar las existentes' },
        { args: [{ tono: 'detallado' }, 'tono', 'breve'], expected: { tono: 'breve' }, description: 'Reemplaza el valor de una clave ya conocida' },
        { args: [{}, 'idioma', 'es'], expected: { idioma: 'es' }, description: 'Partir de memoria vacía también funciona' },
      ],
      hints: [
        'Copia el objeto recibido antes de tocarlo.',
        'La clave llega como parámetro, no como nombre fijo.',
        'Devolver solo el campo nuevo borra el resto de la libreta.',
      ],
    },
    reading: {
      core: 'Estado, historial y memoria son capas distintas con ciclos de vida propios. El estado describe el presente, el historial registra el pasado y la memoria conserva lo elegido para futuras conversaciones. Mezclarlas produce recuerdos falsos y datos huérfanos.',
      mechanics: 'La memoria vive en tu aplicación, no en el modelo. Antes de cada llamada, las piezas pertinentes se inyectan en el contexto; después de la respuesta, lo aprendido explícitamente puede actualizarse. Cada campo lleva origen y fecha para poder auditar y borrar.',
      decisions: 'Guarda lo mínimo y con consentimiento: preferencias declaradas por la persona, no deducciones invasivas. Separa memoria por usuario y por proyecto. Ofrece inspección y borrado en la interfaz, porque una memoria invisible es una memoria sospechosa.',
      errors: 'Reenviar el historial completo como si fuera memoria encarece cada llamada y revive errores antiguos. Guardar secretos en la memoria los expone a cualquier script. Y deducir rasgos personales sin pedirlos convierte una función útil en vigilancia.',
      keyPoints: [
        'El modelo no posee memoria; la aplicación sí.',
        'Actualizar creando un objeto nuevo evita efectos cruzados.',
        'Toda memoria se inspecciona, se explica y se borra.',
      ],
      question: '¿Dónde vive esta memoria?',
      answer: 'En este curso, en el almacenamiento local de tu navegador bajo claves propias de la app. En producción migraría a un backend seguro con cuentas y borrado real; localStorage jamás guarda credenciales ni datos sensibles.',
      transfer: 'Clasifica cinco datos de un asistente hipotético como estado, historial, memoria legítima o dato que no guardarías.',
      sources: ['hf-llm-course', 'owasp-genai-top10'],
    },
    reasoning: {
      activity: decisionActivity('Clasifica cada dato en su capa correcta.', [
        ['paso', 'Paso actual de un formulario', ['estado', 'historial', 'memoria'], 'estado'],
        ['ayer', 'Mensaje enviado ayer', ['estado', 'historial', 'memoria'], 'historial'],
        ['tono', 'Tono preferido declarado por la persona', ['estado', 'historial', 'memoria'], 'memoria'],
      ]),
      explanation: 'Presente, pasado registrado y futuro consentido. Cada capa tiene tratamiento y caducidad distintos.',
      hints: ['Pregunta cuándo deja de ser útil ese dato.', 'Lo durable y consentido pertenece a la memoria.'],
    },
    debug: {
      title: 'Actualizar borra el resto',
      expected: 'El objeto nuevo conserva todos los campos previos.',
      observed: 'Solo queda la clave recién escrita.',
      hints: ['Comprueba un objeto con dos campos antes de actualizar.', 'Falta arrastrar la memoria anterior.', 'Combina la copia completa con la clave dinámica nueva.'],
    },
  }),
  authoredLesson({
    number: 30, module: 5, title: 'Herramientas declaradas',
    summary: 'Valida el nombre de herramienta contra una lista cerrada antes de considerar cualquier ejecución.',
    concepts: [
      ['Herramienta', 'Capacidad externa que el modelo puede proponer pero nunca ejecutar solo.'],
      ['Lista cerrada', 'Conjunto explícito de nombres válidos, sin interpretaciones creativas.'],
    ],
    requires: ['actualizar-memoria'],
    skill: 'permitir-tool',
    capacidad: { nombre: 'tool_permitida', descripcion: 'Las herramientas del chat existen solo si están declaradas; ninguna propuesta improvisada pasa.' },
    integracion: 'El TutorLocal declara hoy sus dos primeras herramientas de lectura: buscar_notas y resumir_documento. tool_permitida vigila la puerta cuando el modelo proponga acciones.',
    mentalModel: 'El modelo propone, la lista cerrada decide: si el nombre exacto no está en el cartel, la puerta no abre.',
    script: [
      'Function calling significa esto: el modelo propone una herramienta con argumentos y tu aplicación decide si existe y procede.',
      'La primera frontera es el nombre. Comparación exacta contra la lista declarada; nada de coincidencias parciales que abran puertas vecinas.',
      'El ejemplo comprueba pertenencia exacta. Un nombre peligroso que contenga uno válido sigue siendo desconocido.',
      'Completa tool_permitida con la comprobación estricta. Las pruebas traen nombres compuestos tramposos.',
    ],
    javascript: {
      example: `function tool_permitida(nombre, permitidas) {
  return permitidas.includes(nombre);
}

console.log(tool_permitida('buscar_notas', ['buscar_notas', 'resumir_documento']));`,
      starter: `function tool_permitida(nombre, permitidas) {
  // true solo con coincidencia exacta contra la lista.
}`,
      solution: `function tool_permitida(nombre, permitidas) {
  return permitidas.includes(nombre);
}`,
      debugStarter: `function tool_permitida(nombre, permitidas) {
  return permitidas.some((item) => nombre.includes(item));
}`,
    },
    python: {
      example: `def tool_permitida(nombre, permitidas):
    return nombre in permitidas

print(tool_permitida("buscar_notas", ["buscar_notas", "resumir_documento"]))`,
      starter: `def tool_permitida(nombre, permitidas):
    # True solo con coincidencia exacta contra la lista.
    pass`,
      solution: `def tool_permitida(nombre, permitidas):
    return nombre in permitidas`,
      debugStarter: `def tool_permitida(nombre, permitidas):
    return any(item in nombre for item in permitidas)`,
    },
    practice: {
      title: 'Cierra el catálogo',
      instructions: "Implementa tool_permitida(nombre, permitidas). Devuelve true solo cuando el nombre coincida exactamente con alguno de la lista declarada.",
      functionName: 'tool_permitida',
      cases: [
        { args: ['buscar_notas', ['buscar_notas', 'resumir_documento']], expected: true, description: 'Una herramienta declarada pasa' },
        { args: ['buscar_notas_y_borrar_todo', ['buscar_notas']], expected: false, description: 'Contener un nombre válido no autoriza nada' },
        { args: ['enviar_correo', []], expected: false, description: 'Catálogo vacío, ninguna propuesta procede' },
      ],
      hints: [
        'Compara el nombre completo contra los elementos completos.',
        'Buscar dentro del nombre concede permisos inventados.',
        'La pertenencia exacta a la lista es toda la regla.',
      ],
    },
    reading: {
      core: 'Una herramienta bien diseñada tiene nombre estable, descripción precisa y esquema de argumentos. La propuesta del modelo es texto no confiable hasta que tu validación aprueba nombre, forma y permiso. Solo entonces se ejecuta algo real.',
      mechanics: 'El ciclo completo va de propuesta a validación de esquema, autorización, ejecución con límites de tiempo y validación del resultado. La comparación exacta de nombres es la primera barrera y la más barata; evita que variantes maliciosas hereden permisos de hermanas legítimas.',
      decisions: 'Declara herramientas pequeñas por intención: leer, buscar, resumir. Separa lecturas de escrituras y reserva confirmación humana para efectos externos. Empieza el catálogo vacío y ve ampliándolo por necesidad medida, nunca por curiosidad.',
      errors: 'Una herramienta genérica del tipo ejecutar_comando concede demasiado a cambio de nada. Confiar en la descripción del prompt como control ignora que el texto persuade, no autoriza. Y validar argumentos sin validar el nombre permite llegar a capacidades inexistentes con datos perfectos.',
      keyPoints: [
        'El modelo propone herramientas; tu código las conoce y autoriza.',
        'Coincidencia exacta: sin prefijos, sufijos ni similitudes.',
        'Catálogo mínimo, intenciones separadas, resultados validados.',
      ],
      question: '¿Por qué no dejar que el modelo combine nombres libremente?',
      answer: 'Porque combinar nombres crea capacidades nuevas que nadie revisó. buscar_notas_y_borrar_todo suena inofensiva y contiene una destructiva. La seguridad empieza por catálogos cerrados.',
      transfer: 'Diseña el catálogo de tres herramientas de lectura para tu chat y escribe qué esquema tendría cada una.',
      sources: ['anthropic-tool-use', 'openai-function-calling'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el ciclo seguro de una herramienta.', [
        ['proponer', 'Modelo propone nombre y argumentos'],
        ['catalogar', 'Verificar el nombre contra la lista'],
        ['validar', 'Validar esquema de argumentos'],
        ['autorizar', 'Comprobar permiso del turno'],
        ['ejecutar', 'Ejecutar y validar el resultado'],
      ]),
      explanation: 'Cada frontera filtra algo distinto: existencia, forma, permiso y efecto. El modelo no salta ninguna.',
      hints: ['Antes de validar argumentos conviene saber si la herramienta existe.', 'La ejecución es siempre la última etapa.'],
    },
    debug: {
      title: 'Una subcadena obtiene permiso',
      expected: 'Solo nombres completos y declarados pasan.',
      observed: 'Un nombre peligroso que contiene otro válido consigue autorización.',
      hints: ['Prueba el nombre compuesto con borrar.', 'Buscar dentro del nombre amplía el catálogo sin permiso.', 'Exige igualdad total contra algún elemento.'],
    },
  }),
  authoredLesson({
    number: 31, module: 5, title: 'Confirmación humana en acciones sensibles',
    summary: 'Decide cuándo una acción necesita aprobación explícita antes de producir efectos.',
    concepts: [
      ['Efecto secundario', 'Cambio en el mundo exterior: enviar, escribir, borrar, pagar.'],
      ['Confirmación', 'Aceptación informada de una persona antes del efecto.'],
    ],
    requires: ['permitir-tool'],
    skill: 'pedir-confirmacion',
    capacidad: { nombre: 'requiere_confirmacion', descripcion: 'Las acciones de escritura o alto riesgo muestran su tarjeta de confirmación antes de mover un dedo.' },
    integracion: 'Cuando el modelo proponga una herramienta de escritura, el TutorLocal interrumpe con requiere_confirmacion: tarjeta con acción, objetivo y efecto, y dos botones honestos.',
    mentalModel: 'Leer es mirar por la ventana; escribir es entrar en casa ajena. Entrar pide permiso.',
    script: [
      'Consultar información es reversible. Enviar, modificar o borrar dejan rastro y merecen una pausa humana.',
      'La regla combina dos señales con un o lógico: riesgo declarado alto o acción que escribe en algún lugar exterior.',
      'El ejemplo devuelve true cuando cualquiera de las dos condiciones aparece. Las lecturas tranquilas siguen su camino sin interrupciones.',
      'Completa requiere_confirmacion sin endurecer de más. Pedir permiso para todo fatiga y anula el valor del aviso.',
    ],
    javascript: {
      example: `function requiere_confirmacion(riesgo, escribe) {
  return riesgo === 'alto' || escribe;
}

console.log(requiere_confirmacion('alto', false));`,
      starter: `function requiere_confirmacion(riesgo, escribe) {
  // true ante riesgo alto O ante acciones de escritura.
}`,
      solution: `function requiere_confirmacion(riesgo, escribe) {
  return riesgo === 'alto' || escribe;
}`,
      debugStarter: `function requiere_confirmacion(riesgo, escribe) {
  return riesgo === 'alto' && escribe;
}`,
    },
    python: {
      example: `def requiere_confirmacion(riesgo, escribe):
    return riesgo == "alto" or escribe

print(requiere_confirmacion("alto", False))`,
      starter: `def requiere_confirmacion(riesgo, escribe):
    # True ante riesgo alto O ante acciones de escritura.
    pass`,
      solution: `def requiere_confirmacion(riesgo, escribe):
    return riesgo == "alto" or escribe`,
      debugStarter: `def requiere_confirmacion(riesgo, escribe):
    return riesgo == "alto" and escribe`,
    },
    practice: {
      title: 'Coloca el freno',
      instructions: "Implementa requiere_confirmacion(riesgo, escribe). Devuelve true cuando el riesgo sea alto aunque no escriba, o cuando la acción escriba aunque el riesgo sea bajo.",
      functionName: 'requiere_confirmacion',
      cases: [
        { args: ['alto', false], expected: true, description: 'Riesgo alto basta por sí mismo' },
        { args: ['bajo', true], expected: true, description: 'Escribir hacia fuera exige pausa' },
        { args: ['bajo', false], expected: false, description: 'Una lectura tranquila continúa sin fricción' },
      ],
      hints: [
        'Cualquiera de las dos señales activa el freno; revisa el conector.',
        'Traza los tres casos por separado antes de decidir.',
        'Comparaciones exactas contra la cadena de riesgo alto.',
      ],
    },
    reading: {
      core: 'El control humano funciona cuando llega a tiempo y con contexto: acción propuesta, objetivo afectado y efecto esperado. Un botón de confirmar sin explicación es teatro de seguridad; una interrupción para todo es fatiga garantizada.',
      mechanics: 'La decisión precede al efecto y queda registrada junto al resultado. La interfaz presenta la tarjeta con datos verificables y opciones claras: aceptar, editar o rechazar. Rechazar también es un resultado exitoso del sistema y se documenta igual.',
      decisions: 'Reserva confirmación para efectos externos, irreversibles o de alto impacto según tu propia tabla de riesgos. Automatiza lecturas y cálculos internos. Cuando la confianza crezca con evidencia, relaja umbrales poco a poco y mide incidentes.',
      errors: 'Confirmar después de ejecutar es solo notificar un desastre. Interrumpir cada lectura entrena a la gente a aceptar sin leer. Y registrar quién confirmó sin guardar qué vio convierte la auditoría en adivinanza.',
      keyPoints: [
        'La confirmación ocurre antes del efecto y con contexto visible.',
        'Riesgo alto o escritura activan la pausa; ambas por separado.',
        'Rechazar es éxito del sistema, no fallo del usuario.',
      ],
      question: '¿Todo uso de IA debería pedir confirmación?',
      answer: 'No. Escala el control según impacto y reversibilidad. Buscar en tus notas no necesita fricción; proponer un correo masivo sí. El diseño está en distinguirlos sin agotar a nadie.',
      transfer: 'Enumera cinco acciones posibles de un asistente y marca cuáles pedirían confirmación con tu política.',
      sources: ['owasp-genai-top10', 'mcp-architecture'],
    },
    reasoning: {
      activity: decisionActivity('Decide si cada acción pide confirmación.', [
        ['lectura', 'Buscar en notas propias, riesgo bajo', ['confirmar', 'seguir'], 'seguir'],
        ['correo', 'Enviar un correo a todo el equipo', ['confirmar', 'seguir'], 'confirmar'],
        ['borrado', 'Eliminar un documento compartido, riesgo alto', ['confirmar', 'seguir'], 'confirmar'],
      ]),
      explanation: 'Las lecturas fluyen; los efectos externos y los riesgos altos se detienen ante una persona informada.',
      hints: ['Pregunta si el efecto sale de la burbuja del chat.', 'El riesgo alto decide aunque no haya escritura.'],
    },
    debug: {
      title: 'Solo frena el doble problema',
      expected: 'Cada señal por separado activa la confirmación.',
      observed: 'La función exige riesgo alto y escritura simultáneos.',
      hints: ['Prueba alto sin escritura.', 'El conector lógico es demasiado exigente.', 'Usa el o entre las dos señales.'],
    },
  }),
  authoredLesson({
    number: 32, module: 5, title: 'Inyección de prompts: los datos no mandan',
    summary: 'Clasifica cada bloque por su origen exacto y mantiene la frontera entre instrucciones y contenido.',
    concepts: [
      ['Prompt injection', 'Texto diseñado para hacer pasar órdenes por instrucciones del sistema.'],
      ['Inyección indirecta', 'La orden viaja escondida dentro de un documento o de un resultado recuperado.'],
    ],
    requires: ['pedir-confirmacion'],
    skill: 'clasificar-confianza',
    capacidad: { nombre: 'nivel_confianza', descripcion: 'Cada bloque del contexto lleva etiqueta de confianza según su origen, y los documentos nunca dan órdenes.' },
    integracion: 'Los fragmentos de tus documentos entran al contexto marcados como dato_no_confiable por nivel_confianza. Si un PDF grita instrucciones, el chat las verá como texto citable, no como política.',
    mentalModel: 'El origen otorga autoridad, nunca el tono del texto: una orden mayúscula dentro de un PDF sigue siendo un dato curioso.',
    script: [
      'Existen dos sabores de inyección. La directa llega en el mensaje del usuario. La indirecta viaja escondida en documentos, páginas web o resultados de herramientas.',
      'La defensa estructural clasifica bloques por origen con comparación exacta. Solo la palabra sistema designa instrucciones legítimas.',
      'El ejemplo devuelve instruccion únicamente para el origen sistema. Cualquier otra cadena, incluso parecida, queda como dato no confiable.',
      'Completa nivel_confianza sin usar búsquedas parciales. Las pruebas traerán orígenes compuestos tramposos.',
    ],
    javascript: {
      example: `function nivel_confianza(origen) {
  return origen === 'sistema' ? 'instruccion' : 'dato_no_confiable';
}

console.log(nivel_confianza('documento'));`,
      starter: `function nivel_confianza(origen) {
  // 'instruccion' solo para el origen exacto 'sistema'.
}`,
      solution: `function nivel_confianza(origen) {
  return origen === 'sistema' ? 'instruccion' : 'dato_no_confiable';
}`,
      debugStarter: `function nivel_confianza(origen) {
  return origen.includes('sistema') ? 'instruccion' : 'dato_no_confiable';
}`,
    },
    python: {
      example: `def nivel_confianza(origen):
    return "instruccion" if origen == "sistema" else "dato_no_confiable"

print(nivel_confianza("documento"))`,
      starter: `def nivel_confianza(origen):
    # 'instruccion' solo para el origen exacto 'sistema'.
    pass`,
      solution: `def nivel_confianza(origen):
    return "instruccion" if origen == "sistema" else "dato_no_confiable"`,
      debugStarter: `def nivel_confianza(origen):
    return "instruccion" if "sistema" in origen else "dato_no_confiable"`,
    },
    practice: {
      title: 'Guarda la frontera',
      instructions: "Implementa nivel_confianza(origen). Devuelve 'instruccion' únicamente cuando el origen sea exactamente 'sistema'; cualquier otra cosa es 'dato_no_confiable'.",
      functionName: 'nivel_confianza',
      cases: [
        { args: ['sistema'], expected: 'instruccion', description: 'La política de la app es la única instrucción' },
        { args: ['documento'], expected: 'dato_no_confiable', description: 'Un fragmento recuperado aporta datos, no órdenes' },
        { args: ['usuario_sistema'], expected: 'dato_no_confiable', description: 'Contener la palabra sistema no otorga autoridad' },
      ],
      hints: [
        'La comparación es de igualdad total, sin búsquedas internas.',
        'Piensa quién controla realmente cada origen.',
        'Solo hay dos salidas posibles.',
      ],
    },
    reading: {
      core: 'El modelo procesa texto sin una barrera de seguridad incorporada entre datos y órdenes. Por eso la arquitectura debe construirla: etiquetar procedencia, limitar herramientas, validar efectos y probar con contenido hostil de verdad.',
      mechanics: 'Cada bloque del contexto nace con su etiqueta de confianza derivada del origen. Los documentos recuperados llegan siempre como datos, envueltos en delimitadores claros. Las acciones sensibles exigen confirmación fuera del modelo. Los filtros de palabras sueltas son complemento, nunca defensa principal.',
      decisions: 'Minimiza el poder disponible detrás de cada llamada: pocas herramientas, permisos estrechos, efectos confirmados. Prueba con documentos adversarios reales durante el desarrollo, no después. Trata los resultados de herramientas como datos externos, porque lo son.',
      errors: 'Buscar la frase ignora instrucciones cubre una variante de miles. Encargarle la detección al propio modelo pone al objetivo trabajando de guardia. Y elevar contenido recuperado a política porque suena oficial entrega el mando al primer PDF hostil.',
      keyPoints: [
        'El origen define la autoridad; el tono no engaña a nadie serio.',
        'Documentos y resultados de herramientas son datos, siempre.',
        'La defensa es arquitectura probada, no una frase mágica.',
      ],
      question: '¿Un mensaje de sistema fuerte elimina este riesgo?',
      answer: 'Reduce algunos casos superficiales y nada más. La protección real combina etiquetado de origen, mínimos privilegios, confirmación de efectos y pruebas adversarias periódicas.',
      transfer: 'Coge un PDF cualquiera e imagina que contiene una orden camuflada. Recorre qué capas de tu chat la detendrían.',
      sources: ['owasp-prompt-injection', 'owasp-genai-top10'],
    },
    reasoning: {
      activity: flowActivity('Sigue un bloque hostil hasta su destino seguro.', [
        ['llega', 'Fragmento hostil entra al chat', 'start'],
        ['etiquetar', 'Etiquetar por origen', 'process'],
        ['marcar', 'Quedar como dato no confiable', 'decision'],
        ['citar', 'Poder citarse como texto', 'output'],
        ['mandar', 'Convertirse en instrucción', 'output'],
      ], [
        ['llega', 'etiquetar'],
        ['etiquetar', 'marcar'],
        ['marcar', 'citar', 'origen externo'],
      ]),
      explanation: 'El bloque externo queda etiquetado, citable y jamás ascendente. La rama de instrucción solo existe para el origen sistema.',
      hints: ['El origen se examina antes de decidir.', 'Citar no equivale a obedecer.'],
    },
    debug: {
      title: 'Una subcadena obtiene autoridad',
      expected: 'Solo el origen exacto sistema clasifica como instrucción.',
      observed: 'Orígenes que contienen la palabra sistema heredan autoridad.',
      hints: ['Prueba el origen compuesto.', 'Buscar dentro de la cadena amplía el permiso.', 'Exige igualdad completa con el único origen legítimo.'],
    },
  }),
  authoredLesson({
    number: 33, module: 5, title: 'Evaluar las respuestas del chat',
    summary: 'Mide la precisión de citas sobre casos reales y protege el denominador vacío.',
    concepts: [
      ['Precisión', 'Proporción de aciertos sobre el total intentado.'],
      ['Caso de evaluación', 'Pregunta con respuesta esperada y evidencia conocida.'],
    ],
    requires: ['clasificar-confianza'],
    skill: 'medir-precision',
    capacidad: { nombre: 'precision_citas', descripcion: 'El panel Calidad resume qué proporción de citas publicadas resistieron la verificación.' },
    integracion: 'Cada respuesta con citas alimenta precision_citas en segundo plano. Con unos pocos días de uso, el panel Calidad del TutorLocal te dirá si tu corpus y tus umbrales funcionan.',
    mentalModel: 'Sin número no hay mejora: medir precisión convierte opiniones sobre el chat en decisiones.',
    script: [
      'Cambiar prompts a ciegas es adivinanza. Una métrica sencilla y estable convierte cada ajuste en experimento.',
      'La precisión de citas divide las citas válidas entre las citas totales publicadas. Es la primera métrica de calidad del chat.',
      'El ejemplo aplica el total real y protege el caso vacío: sin citas evaluadas, cero sin drama ni división imposible.',
      'Completa precision_citas con el guardia del cero. Las pruebas traerán totales variados.',
    ],
    javascript: {
      example: `function precision_citas(validas, total) {
  if (total === 0) return 0;
  return validas / total;
}

console.log(precision_citas(3, 4));`,
      starter: `function precision_citas(validas, total) {
  // Proporción de válidas sobre el total observado.
  // Sin casos evaluados devuelve cero.
}`,
      solution: `function precision_citas(validas, total) {
  if (total === 0) return 0;
  return validas / total;
}`,
      debugStarter: `function precision_citas(validas, total) {
  return validas / 100;
}`,
    },
    python: {
      example: `def precision_citas(validas, total):
    if total == 0:
        return 0
    return validas / total

print(precision_citas(3, 4))`,
      starter: `def precision_citas(validas, total):
    # Proporción de válidas sobre el total observado.
    # Sin casos evaluados devuelve cero.
    pass`,
      solution: `def precision_citas(validas, total):
    if total == 0:
        return 0
    return validas / total`,
      debugStarter: `def precision_citas(validas, total):
    return validas / 100`,
    },
    practice: {
      title: 'Pon número a la calidad',
      instructions: 'Implementa precision_citas(validas, total). Divide las válidas entre el total real y devuelve cero cuando todavía no haya casos evaluados.',
      functionName: 'precision_citas',
      cases: [
        { args: [3, 4], expected: 0.75, description: 'Tres citas firmes de cuatro publicadas' },
        { args: [0, 0], expected: 0, description: 'Ningún caso evaluado no es cero por ciento mágico' },
        { args: [5, 5], expected: 1, description: 'Todas firmes da la proporción máxima' },
      ],
      hints: [
        'El denominador es el total recibido, no una cifra cómoda.',
        'El caso de total vacío merece su propia rama antes de dividir.',
        'Devuelve el cociente numérico tal cual.',
      ],
    },
    reading: {
      core: 'Evaluar convierte el chat en un sistema mejorable. Empezar por una métrica determinista como la precisión de citas enseña el hábito completo: definir caso, medir, comparar versiones y decidir con datos en lugar de impresiones.',
      mechanics: 'Un conjunto pequeño de preguntas fijas con evidencia conocida basta para empezar. Tras cada respuesta se registran citas propuestas y supervivientes. La proporción resume la salud; los casos individuales fallidos cuentan la historia y sugieren el arreglo.',
      decisions: 'Congela el conjunto de casos al comparar versiones; cambiar preguntas y prompt a la vez invalida la comparación. Segmenta por tipo de pregunta cuando notes patrones. Añade métricas de recuperación después; primero camina, luego corre.',
      errors: 'Medir solo con las preguntas fáciles produce cifras vanidosas. Dividir entre cien por costumbre fabrica decimales sin significado. Y celebrar una precisión alta ignorando qué preguntas ni se atrevieron a responder es optimismo estadístico.',
      keyPoints: [
        'Primera métrica: citas válidas entre citas publicadas.',
        'Total vacío vale cero y se declara como tal.',
        'Los casos individuales fallidos valen más que la cifra global.',
      ],
      question: '¿Esta métrica demuestra que el chat es bueno?',
      answer: 'Demuestra una cosa concreta: qué parte de la evidencia publicada era real. Calidad completa combina precisión, cobertura de recuperación, abstenciones oportunas y latencia. Empieza simple y suma capas.',
      transfer: 'Escribe tres preguntas fijas para evaluar tu propio documento y predice qué métrica daría hoy el chat.',
      sources: ['ragas-metrics', 'deepeval-evaluation'],
    },
    reasoning: {
      activity: decisionActivity('Interpreta cada resultado de evaluación.', [
        ['alta', 'Precisión alta sobre muchos casos variados', ['saludable', 'sospechoso'], 'saludable'],
        ['facil', 'Precisión perfecta midiendo solo preguntas triviales', ['saludable', 'sospechoso'], 'sospechoso'],
        ['vacío', 'Cero casos evaluados, métrica cero', ['fallo grave', 'sin datos'], 'sin datos'],
      ]),
      explanation: 'La métrica habla acompañada de contexto: cuántos casos, cuáles y qué cobertura. Sola, cualquier cifra miente elegantemente.',
      hints: ['Pregunta qué conjunto produjo el número.', 'Ausencia de datos no es un resultado.'],
    },
    debug: {
      title: 'La métrica supone cien casos',
      expected: 'El total real actúa de denominador.',
      observed: 'Divide siempre entre cien y fabrica proporciones.',
      hints: ['Prueba tres válidas de cuatro.', 'La constante no participa en tu realidad.', 'Usa el total recibido y cuida el caso cero.'],
    },
  }),
  authoredLesson({
    number: 34, module: 5, title: 'Observabilidad: eventos, errores y latencia',
    summary: 'Registra eventos estructurados con identificador y momento para depurar sin adivinar.',
    concepts: [
      ['Evento', 'Hecho observable del sistema con tipo, detalle y momento.'],
      ['Latencia', 'Tiempo transcurrido entre solicitud y respuesta.'],
    ],
    requires: ['medir-precision'],
    skill: 'registrar-traza',
    capacidad: { nombre: 'evento_traza', descripcion: 'Cada paso relevante del chat deja una ficha consultable: qué pasó, con qué detalle y cuándo.' },
    integracion: 'El panel Diagnóstico del TutorLocal lee el registro que alimenta evento_traza: descargas, errores WebGPU, latencias y abstenciones aparecen como fichas ordenadas, listas para entender un fallo.',
    mentalModel: 'Observabilidad es dejar luces de emergencia encendidas: cuando algo falle, el camino iluminado cuenta lo ocurrido.',
    script: [
      'Cuando el chat falle a mitad de una demo, querrás saber qué pasó sin repetirlo. Eso es observabilidad.',
      'Un buen evento es estructurado: tipo claro, detalle concreto y momento exacto. Las cadenas de texto libres envejecen mal.',
      'El ejemplo construye la ficha con un identificador compuesto de tipo y tiempo, más los tres campos recibidos.',
      'Completa evento_traza sin omitir campos ni inventar valores. Las pruebas registran tipos y momentos distintos.',
    ],
    javascript: {
      example: `function evento_traza(tipo, detalle, tiempo) {
  return { id: tipo + '-' + tiempo, tipo, detalle, tiempo };
}

console.log(evento_traza('consulta', 'buscar horario', 12));`,
      starter: `function evento_traza(tipo, detalle, tiempo) {
  // Devuelve id 'tipo-tiempo' más los tres campos recibidos.
}`,
      solution: `function evento_traza(tipo, detalle, tiempo) {
  return { id: tipo + '-' + tiempo, tipo, detalle, tiempo };
}`,
      debugStarter: `function evento_traza(tipo, detalle, tiempo) {
  return { id: 'evento', tipo: 'pensamiento', detalle };
}`,
    },
    python: {
      example: `def evento_traza(tipo, detalle, tiempo):
    return {"id": f"{tipo}-{tiempo}", "tipo": tipo, "detalle": detalle, "tiempo": tiempo}

print(evento_traza("consulta", "buscar horario", 12))`,
      starter: `def evento_traza(tipo, detalle, tiempo):
    # Devuelve id 'tipo-tiempo' más los tres campos recibidos.
    pass`,
      solution: `def evento_traza(tipo, detalle, tiempo):
    return {"id": f"{tipo}-{tiempo}", "tipo": tipo, "detalle": detalle, "tiempo": tiempo}`,
      debugStarter: `def evento_traza(tipo, detalle, tiempo):
    return {"id": "evento", "tipo": "pensamiento", "detalle": detalle}`,
    },
    practice: {
      title: 'Enciende las luces',
      instructions: "Implementa evento_traza(tipo, detalle, tiempo). Devuelve un objeto con id formado por tipo, guion y tiempo, además de los campos tipo, detalle y tiempo intactos.",
      functionName: 'evento_traza',
      cases: [
        { args: ['consulta', 'buscar horario', 12], expected: { id: 'consulta-12', tipo: 'consulta', detalle: 'buscar horario', tiempo: 12 }, description: 'Una consulta queda fichada con su momento' },
        { args: ['error', 'WebGPU ausente', 30], expected: { id: 'error-30', tipo: 'error', detalle: 'WebGPU ausente', tiempo: 30 }, description: 'Un error conserva tipo y detalle exactos' },
      ],
      hints: [
        'El identificador une tipo y tiempo con un guion.',
        'Los tres campos viajan con sus nombres exactos.',
        'No fijes ninguno de los valores recibidos.',
      ],
    },
    reading: {
      core: 'Un sistema sin trazas se depura con superstición. Registrar eventos estructurados desde el primer día convierte cada fallo futuro en una lectura en lugar de una investigación arqueológica con memoria humana.',
      mechanics: 'Cada span de la vida del chat puede ficharse: inicio de descarga, fragmento recibido, error, abstención, latencia por turno. Los identificadores componen tipos y momentos para ordenar y agrupar. El contenido sensible se minimiza: detalles técnicos sí, mensajes íntegros no.',
      decisions: 'Define pocos tipos y estables: descarga, error, generacion, recuperacion, abstencion. Registra duraciones junto a eventos para calcular latencias sin cronómetros externos. Decide retención y borrado desde el principio; un registro eterno es un pasivo.',
      errors: 'Registrar prompts completos duplica datos potencialmente sensibles. Tipos improvisados por pantalla impiden consultar nada después. Y guardar solo errores oculta las tendencias lentas que anticipan el desastre.',
      keyPoints: [
        'Eventos estructurados con tipo, detalle y momento.',
        'Identificadores compuestos permiten ordenar y agrupar.',
        'Minimiza contenido sensible desde el diseño del registro.',
      ],
      question: '¿Necesito una plataforma de observabilidad ahora?',
      answer: 'Necesitas registros, y tu panel local cumple. Las plataformas aportan búsqueda y paneles cuando el volumen o el equipo crecen. El esquema de eventos va primero; la herramienta viene después.',
      transfer: 'Diseña los cinco tipos de evento de tu chat y el detalle concreto que registrarías en cada uno.',
      sources: ['langfuse-docs', 'langsmith-observability'],
    },
    reasoning: {
      activity: decisionActivity('Decide qué entra en el registro.', [
        ['latencia', 'Duración de la generación en milisegundos', ['registrar', 'descartar'], 'registrar'],
        ['clave', 'Contenido completo de una credencial', ['registrar', 'descartar'], 'descartar'],
        ['abstencion', 'Consulta que terminó en tarjeta de no encontrado', ['registrar', 'descartar'], 'registrar'],
      ]),
      explanation: 'Se registran hechos operativos y señales de producto; los secretos no tienen negocio dentro de ningún archivo de trazas.',
      hints: ['Pregunta si el dato ayuda a depurar o mejorar.', 'Las credenciales viven en memoria breve, no en registros.'],
    },
    debug: {
      title: 'Todas las fichas dicen pensamiento',
      expected: 'Tipo, detalle y tiempo reales componen cada evento.',
      observed: 'El tipo está fijo y el tiempo desaparece.',
      hints: ['Prueba registrar un error.', 'Los parámetros deben atravesar la función.', 'Compón el id con el tipo y el tiempo recibidos.'],
    },
  }),
  authoredLesson({
    number: 35, module: 5, title: 'Caché y rendimiento',
    summary: 'Calcula los tokens realmente facturables tras aplicar la caché de contexto y entiende el ahorro.',
    concepts: [
      ['Caché de prompt', 'Reutilización de un prefijo estable para no reprocesarlo en cada llamada.'],
      ['Tokens facturables', 'Parte del contexto que sí se procesa de nuevo tras la caché.'],
    ],
    requires: ['registrar-traza'],
    skill: 'ahorrar-cache',
    capacidad: { nombre: 'tokens_facturables', descripcion: 'El panel Rendimiento muestra cuánto trabajo repite cada llamada gracias a la caché.' },
    integracion: 'Como la instrucción del sistema casi nunca cambia, el TutorLocal la declara como prefijo cacheable. tokens_facturables traduce esa decisión al número que le interesa a tu bolsillo y a tu batería.',
    mentalModel: 'La caché es un abono de temporada: pagas el prefijo una vez y las visitas siguientes pagan solo lo nuevo.',
    script: [
      'Enviar siempre el mismo prefijo grande desperdicia trabajo de procesamiento. Las cachés de prompt reutilizan ese prefijo estable.',
      'Tu chat ya tiene un candidato perfecto: la instrucción del sistema, que apenas cambia entre turnos.',
      'El ejemplo resta los tokens cacheados de los totales y protege el suelo en cero para casos imposibles.',
      'Completa tokens_facturables con la resta y el guardia. Las pruebas incluyen caché mayor que el total.',
    ],
    javascript: {
      example: `function tokens_facturables(totales, cacheados) {
  return Math.max(0, totales - cacheados);
}

console.log(tokens_facturables(1000, 600));`,
      starter: `function tokens_facturables(totales, cacheados) {
  // Resta lo cacheado del total, sin bajar de cero.
}`,
      solution: `function tokens_facturables(totales, cacheados) {
  return Math.max(0, totales - cacheados);
}`,
      debugStarter: `function tokens_facturables(totales, cacheados) {
  return totales + cacheados;
}`,
    },
    python: {
      example: `def tokens_facturables(totales, cacheados):
    return max(0, totales - cacheados)

print(tokens_facturables(1000, 600))`,
      starter: `def tokens_facturables(totales, cacheados):
    # Resta lo cacheado del total, sin bajar de cero.
    pass`,
      solution: `def tokens_facturables(totales, cacheados):
    return max(0, totales - cacheados)`,
      debugStarter: `def tokens_facturables(totales, cacheados):
    return totales + cacheados`,
    },
    practice: {
      title: 'Paga solo lo nuevo',
      instructions: 'Implementa tokens_facturables(totales, cacheados). Devuelve la diferencia entre totales y cacheados sin permitir resultados negativos.',
      functionName: 'tokens_facturables',
      cases: [
        { args: [1000, 600], expected: 400, description: 'Cuatrocientos tokens se procesan de nuevo' },
        { args: [500, 500], expected: 0, description: 'Prefijo completo en caché, nada que facturar' },
        { args: [300, 900], expected: 0, description: 'Caché imposible se corrige al suelo cero' },
      ],
      hints: [
        'La operación central es una resta entre los dos parámetros.',
        'Valores negativos carecen de sentido aquí; existe un helper para suelos.',
        'Traza el caso donde lo cacheado excede el total.',
      ],
    },
    reading: {
      core: 'El rendimiento de un chat depende de cuánto trabajo repite cada llamada. La caché de prompt reutiliza prefijos estables como la instrucción del sistema, reduciendo procesamiento, latencia percibida y coste donde exista facturación.',
      mechanics: 'Los proveedores definen qué cuenta como prefijo reutilizable, con reglas de tamaño, orden y caducidad. Localmente el beneficio es similar: menos cómputo por turno. Medir tokens facturables por llamada revela si tu estructura de contexto favorece o sabotea la reutilización.',
      decisions: 'Coloca lo estable al principio del paquete y lo variable al final; así el prefijo coincide entre llamadas. Evita insertar timestamps o aleatoriedad en la ficha de sistema. Revisa las reglas específicas del runtime antes de promediar ahorros.',
      errors: 'Meter el historial en medio del prefijo rompe la reutilización silenciosamente. Asumir caché automática sin comprobar reglas produce facturas sorpresa. Y optimizar latencia antes de tener métricas convierte la intuición en religión.',
      keyPoints: [
        'Estable arriba, variable abajo: así respira la caché.',
        'Tokens facturables traduce la estructura en números comparables.',
        'Sin métrica previa, toda optimización es una corazonada.',
      ],
      question: '¿La caché cambia la respuesta del modelo?',
      answer: 'No altera el contenido generado: reutiliza trabajo de procesamiento del prefijo. La respuesta con y sin caché debe ser equivalente bajo los mismos parámetros.',
      transfer: 'Reordena en papel tu paquete de conversación para maximizar el prefijo común entre dos turnos consecutivos.',
      sources: ['anthropic-prompt-caching', 'hf-llm-course'],
    },
    reasoning: {
      activity: decisionActivity('Decide cómo afecta cada cambio a la caché.', [
        ['estable', 'Dejar la instrucción del sistema primero y fija', ['favorece', 'rompe'], 'favorece'],
        ['fecha', 'Insertar la hora actual dentro de la instrucción', ['favorece', 'rompe'], 'rompe'],
        ['orden', 'Alternar la posición del historial en cada turno', ['favorece', 'rompe'], 'rompe'],
      ]),
      explanation: 'La caché ama la estabilidad del prefijo. Cualquier variación temprana obliga a reprocesar desde ahí.',
      hints: ['Pregunta qué parte del paquete cambia entre llamadas.', 'Lo cambiante debe vivir al final.'],
    },
    debug: {
      title: 'La caché cuesta más',
      expected: 'Lo cacheado descuenta del total.',
      observed: 'La función suma ambos números y dispara la factura.',
      hints: ['Prueba mil y seiscientos.', 'El signo de la operación está invertido.', 'Aplica el suelo cero tras restar.'],
    },
  }),
];
