import { authoredLesson, decisionActivity, flowActivity, sequenceActivity, vectorRankingActivity } from '../authoring';

// Fase 3: Modelo local en el navegador.
// El TutorLocal deja las reglas y pasa a generar con un modelo real
// ejecutado sobre WebGPU dentro de un Worker.

export const AI_FASE_03 = [
  authoredLesson({
    number: 13, module: 2, title: 'WebGPU y Workers: la ruta local',
    summary: 'Comprueba si el dispositivo puede sostener inferencia local antes de prometer nada.',
    concepts: [
      ['WebGPU', 'Interfaz del navegador para ejecutar cálculo intensivo en la GPU.'],
      ['Web Worker', 'Hilo aislado que ejecuta trabajo pesado sin bloquear la interfaz.'],
      ['Inferencia local', 'Generación que ocurre en el dispositivo, sin enviar el texto a un servidor.'],
    ],
    requires: ['montar-conversacion'],
    skill: 'decidir-ruta-local',
    capacidad: { nombre: 'puede_ejecutar_local', descripcion: 'El chat decide con honestidad si este equipo puede cargar el motor local.' },
    integracion: 'Antes de ofrecer la pestaña Modelo local, el TutorLocal consulta puede_ejecutar_local. Sin WebGPU o sin memoria suficiente muestra una explicación educativa en lugar de un botón que falla.',
    mentalModel: 'La ruta local es una invitación condicional: primero se comprueba el venue, después se reparten entradas.',
    script: [
      'Generar texto con un modelo pequeño exige dos cosas del equipo: una GPU accesible mediante WebGPU y memoria libre suficiente.',
      'Además, la generación debe correr dentro de un Web Worker. Si corre en el hilo principal, la interfaz se congela en cuanto el modelo piensa.',
      'El ejemplo combina las condiciones con un y lógico: WebGPU presente y memoria por encima del mínimo exigido por el modelo.',
      'Completa puede_ejecutar_local con ambas comprobaciones. Las pruebas variarán memoria y disponibilidad por separado.',
    ],
    javascript: {
      example: `function puede_ejecutar_local(webgpuDisponible, memoriaGb, minimoGb) {
  return webgpuDisponible && memoriaGb >= minimoGb;
}

console.log(puede_ejecutar_local(true, 8, 4));`,
      starter: `function puede_ejecutar_local(webgpuDisponible, memoriaGb, minimoGb) {
  // Exige WebGPU y memoria igual o superior al mínimo del modelo.
}`,
      solution: `function puede_ejecutar_local(webgpuDisponible, memoriaGb, minimoGb) {
  return webgpuDisponible && memoriaGb >= minimoGb;
}`,
      debugStarter: `function puede_ejecutar_local(webgpuDisponible, memoriaGb, minimoGb) {
  return webgpuDisponible || memoriaGb >= minimoGb;
}`,
    },
    python: {
      example: `def puede_ejecutar_local(webgpu_disponible, memoria_gb, minimo_gb):
    return webgpu_disponible and memoria_gb >= minimo_gb

print(puede_ejecutar_local(True, 8, 4))`,
      starter: `def puede_ejecutar_local(webgpu_disponible, memoria_gb, minimo_gb):
    # Exige WebGPU y memoria igual o superior al mínimo del modelo.
    pass`,
      solution: `def puede_ejecutar_local(webgpu_disponible, memoria_gb, minimo_gb):
    return webgpu_disponible and memoria_gb >= minimo_gb`,
      debugStarter: `def puede_ejecutar_local(webgpu_disponible, memoria_gb, minimo_gb):
    return webgpu_disponible or memoria_gb >= minimo_gb`,
    },
    practice: {
      title: 'Comprueba el venue',
      instructions: 'Implementa puede_ejecutar_local(webgpuDisponible, memoriaGb, minimoGb). Devuelve true solo cuando haya WebGPU y la memoria alcance el mínimo del modelo.',
      functionName: 'puede_ejecutar_local',
      cases: [
        { args: [true, 8, 4], expected: true, description: 'Un equipo con sobra de memoria pasa la prueba' },
        { args: [false, 16, 4], expected: false, description: 'Sin WebGPU no hay ruta local aunque sobre memoria' },
        { args: [true, 2, 4], expected: false, description: 'La memoria insuficiente bloquea el modelo' },
        { args: [true, 4, 4], expected: true, description: 'Alcanzar justo el mínimo cuenta como suficiente' },
      ],
      hints: [
        'Las dos condiciones son obligatorias a la vez; revisa el conector.',
        'La memoria se compara contra el mínimo con igualdad incluida.',
        'Traza un caso que falle solo por WebGPU y otro que falle solo por memoria.',
      ],
    },
    reading: {
      core: 'Ejecutar un modelo en el navegador es posible gracias a dos piezas: WebGPU da acceso a la GPU y los Workers mantienen la interfaz viva durante la generación. Comprobar ambas antes de empezar convierte un fallo tardío en una explicación temprana.',
      mechanics: 'La detección pregunta por navigator.gpu y consulta adaptadores disponibles. El mínimo de memoria lo publica cada modelo según su tamaño y cuantización. El Worker recibe el paquete de conversación, carga el modelo y devuelve fragmentos de texto mientras genera.',
      decisions: 'Decide la ruta en tiempo de carga, no al pulsar enviar. Si falta compatibilidad, explica qué falta y ofrece alternativas honestas, como ejercicios sin generación. Nunca simules respuestas para disimular la carencia.',
      errors: 'Asumir WebGPU universal deja fuera a muchos equipos reales. Ejecutar el modelo en el hilo principal congela botones y scroll. Y confundir memoria de disco con memoria disponible para la GPU produce descargas que mueren a mitad.',
      keyPoints: [
        'WebGPU y memoria mínima forman la puerta de entrada local.',
        'El Worker protege la interfaz durante la generación.',
        'Un requisito no cumplido se comunica, nunca se finge.',
      ],
      question: '¿Por qué no basta con tener una GPU potente?',
      answer: 'El navegador necesita exponerla mediante WebGPU y reservar memoria compatible con el modelo elegido. Hardware capaz más navegador incompatible sigue siendo ruta bloqueada.',
      transfer: 'Inventa tres combinaciones de equipo y navegador y decide qué mostraría tu chat en cada una.',
      sources: ['webllm', 'transformers-js-v4'],
    },
    reasoning: {
      activity: decisionActivity('Decide si cada equipo accede a la ruta local.', [
        ['completo', 'Chrome moderno con WebGPU y ocho gigas libres', ['accede', 'bloqueado'], 'accede'],
        ['viejo', 'Navegador sin soporte WebGPU', ['accede', 'bloqueado'], 'bloqueado'],
        ['ajustado', 'WebGPU disponible y memoria bajo el mínimo', ['accede', 'bloqueado'], 'bloqueado'],
      ]),
      explanation: 'Las dos condiciones funcionan como puerta doble. Cualquier hoja cerrada mantiene la ruta local bloqueada y explicada.',
      hints: ['Revisa las dos señales por separado.', 'Bloquear incluye explicar el motivo.'],
    },
    debug: {
      title: 'Una condición abre la ruta',
      expected: 'WebGPU y memoria deben cumplirse juntas.',
      observed: 'Basta una sola condición para prometer inferencia local.',
      hints: ['Prueba sin WebGPU pero con mucha memoria.', 'El conector lógico es demasiado generoso.', 'Exige ambas condiciones con un y.'],
    },
  }),
  authoredLesson({
    number: 14, module: 2, title: 'Descarga, caché y progreso',
    summary: 'Informa progreso real de descarga y distingue completo de incompleto sin fingir estados.',
    concepts: [
      ['Caché del navegador', 'Almacenamiento local que evita repetir la descarga del modelo.'],
      ['Progreso', 'Fracción completada de una transferencia o preparación.'],
    ],
    requires: ['decidir-ruta-local'],
    skill: 'informar-descarga',
    capacidad: { nombre: 'estado_descarga', descripcion: 'El panel del motor muestra cuánto falta y cuándo está listo, con números reales.' },
    integracion: 'La primera vez que alguien abre el modelo local, el TutorLocal dedica su panel a estado_descarga: barra de progreso honesta, etiqueta de listo y aviso claro si algo se interrumpe.',
    mentalModel: 'Descargar un modelo es mudanza: pesas las cajas, informas el avance y solo gritas listo cuando el camión está vacío.',
    script: [
      'Los modelos locales pesan cientos de megabytes. La primera visita descarga; las siguientes aprovechan la caché del navegador.',
      'Mostrar progreso no es decoración: quien espera sabe que el programa vive y decide si esperar o cancelar. Los números salen de bytes reales recibidos.',
      'El ejemplo convierte bytes en porcentaje redondeado y marca completo solo al llegar a cien. Un total cero devuelve cero sin dividir entre nada.',
      'Completa estado_descarga con ambos campos. Las pruebas cubren mitad de camino, final y total vacío.',
    ],
    javascript: {
      example: `function estado_descarga(recibidos, totales) {
  if (totales <= 0) return { porcentaje: 0, completo: false };
  const porcentaje = Math.round((recibidos / totales) * 100);
  return { porcentaje, completo: porcentaje === 100 };
}

console.log(estado_descarga(50, 100));`,
      starter: `function estado_descarga(recibidos, totales) {
  // Devuelve { porcentaje, completo }.
  // Total cero: porcentaje cero y completo false.
}`,
      solution: `function estado_descarga(recibidos, totales) {
  if (totales <= 0) return { porcentaje: 0, completo: false };
  const porcentaje = Math.round((recibidos / totales) * 100);
  return { porcentaje, completo: porcentaje === 100 };
}`,
      debugStarter: `function estado_descarga(recibidos, totales) {
  return { porcentaje: Math.round((recibidos / totales) * 100), completo: true };
}`,
    },
    python: {
      example: `def estado_descarga(recibidos, totales):
    if totales <= 0:
        return {"porcentaje": 0, "completo": False}
    porcentaje = round(recibidos / totales * 100)
    return {"porcentaje": porcentaje, "completo": porcentaje == 100}

print(estado_descarga(50, 100))`,
      starter: `def estado_descarga(recibidos, totales):
    # Devuelve {"porcentaje", "completo"}.
    # Total cero: porcentaje cero y completo False.
    pass`,
      solution: `def estado_descarga(recibidos, totales):
    if totales <= 0:
        return {"porcentaje": 0, "completo": False}
    porcentaje = round(recibidos / totales * 100)
    return {"porcentaje": porcentaje, "completo": porcentaje == 100}`,
      debugStarter: `def estado_descarga(recibidos, totales):
    return {"porcentaje": round(recibidos / totales * 100), "completo": True}`,
    },
    practice: {
      title: 'Pesa las cajas',
      instructions: 'Implementa estado_descarga(recibidos, totales). Devuelve el porcentaje redondeado y completo solo al llegar a cien. Con total cero, porcentaje cero y completo false.',
      functionName: 'estado_descarga',
      cases: [
        { args: [50, 100], expected: { porcentaje: 50, completo: false }, description: 'Mitad de la mudanza reporta mitad exacta' },
        { args: [100, 100], expected: { porcentaje: 100, completo: true }, description: 'Solo el cien por cien declara listo' },
        { args: [30, 0], expected: { porcentaje: 0, completo: false }, description: 'Un total desconocido no permite promesas' },
      ],
      hints: [
        'El porcentaje nace de dividir recibidos entre totales y escalar a cien.',
        'Redondea antes de comparar para evitar decimales traicioneros.',
        'El caso de total cero merece su propia rama antes de dividir.',
      ],
    },
    reading: {
      core: 'La experiencia de descargar un modelo define la confianza en toda la app. Números reales de progreso, una etiqueta de listo que solo aparece al terminar y mensajes de error comprensibles valen más que cualquier animación.',
      mechanics: 'El runtime informa eventos con archivos, bytes recibidos y totales esperados. Tu función agrega y traduce a porcentaje. La caché del navegador guarda los artefactos por origen; borrar datos del sitio obliga a volver a descargar. Cancelar detiene la petición sin corromper lo ya guardado.',
      mechanicsExample: `estado_descarga(250_000_000, 500_000_000)
→ { porcentaje: 50, completo: false }`,
      decisions: 'Muestra peso total antes de iniciar: nadie acepta una descarga sorpresa. Separa visualmente primera carga de visitas cacheadas. Y ante fallo de red conserva lo descargado cuando el runtime lo permita, indicando cómo reintentar.',
      errors: 'Dividir entre total cero produce NaN y una barra rota. Declarar completo antes de tiempo rompe la confianza para siempre. Ocultar errores de descarga deja a la persona mirando una barra congelada sin explicación.',
      keyPoints: [
        'El progreso se calcula con bytes reales, nunca estimado a mano.',
        'Completo significa cien medido, no deseo.',
        'Total desconocido es un estado legítimo con su propio mensaje.',
      ],
      question: '¿Se descarga el modelo en cada visita?',
      answer: 'No necesariamente: la caché del navegador conserva los archivos mientras el origen y sus límites lo permitan. Por eso el panel muestra el estado de caché antes de iniciar cualquier transferencia.',
      transfer: 'Diseña los cuatro estados del panel de descarga: inicial, descargando, listo y error, con el texto que vería cada uno.',
      sources: ['webllm', 'hf-model-hub'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el ciclo de vida de una descarga de modelo.', [
        ['pesar', 'Informar tamaño total'],
        ['fluir', 'Reportar bytes recibidos'],
        ['cerrar', 'Confirmar cien por cien'],
        ['cachear', 'Registrar que la caché sirve próximas visitas'],
      ]),
      explanation: 'Primero se anuncia el coste, luego se informa el avance, después llega el listo verificado y por último la caché cambia el costo de las siguientes visitas.',
      hints: ['Nadie acepta descargar sin saber cuánto.', 'La caché actúa después de una descarga completa.'],
    },
    debug: {
      title: 'Todo parece completo',
      expected: 'Completo solo cuando el porcentaje medido llega a cien.',
      observed: 'La función declara completo incluso a mitad de descarga.',
      hints: ['Prueba mitad de los bytes.', 'El campo completo no puede ser una constante.', 'Deriva completo de la comparación contra cien.'],
    },
  }),
  authoredLesson({
    number: 15, module: 2, title: 'Elegir modelo según tu equipo',
    summary: 'Selecciona el candidato más capaz que quepa en la memoria disponible y admite cuando ninguno cabe.',
    concepts: [
      ['Cuantización', 'Versión del modelo con menor precisión y menor consumo.'],
      ['Requisito de memoria', 'Espacio que un modelo necesita para cargarse y operar.'],
    ],
    requires: ['informar-descarga'],
    skill: 'elegir-modelo-equipo',
    capacidad: { nombre: 'elegir_modelo', descripcion: 'El selector del chat propone siempre el mejor modelo que este dispositivo pueda cargar.' },
    integracion: 'El desplegable de modelos del TutorLocal ordena sus opciones con elegir_modelo: el candidato más grande que quepa queda marcado, y si ninguno cabe, la interfaz lo dice sin rodeos.',
    mentalModel: 'Elegir modelo es llenar una estantería con capacidad limitada: entra primero el libro más grueso que quepa entero.',
    script: [
      'Existen versiones pequeñas y cuantizadas de modelos capaces. Cuanta menos precisión, menos memoria, aunque puede cambiar la calidad.',
      'Tu trabajo como aplicación es honesto: elegir el candidato más capaz que quepa en la memoria disponible y decirlo claro cuando ninguno entre.',
      'El ejemplo filtra los que caben, ordena por tamaño descendente y toma el primero. Sin candidatos devuelve la palabra ninguno.',
      'Completa elegir_modelo para listas cualesquiera. Las pruebas alterarán tamaños, orden y memoria.',
    ],
    javascript: {
      example: `function elegir_modelo(memoriaMb, modelos) {
  const que_caben = modelos.filter((m) => m.mb <= memoriaMb);
  const ordenados = que_caben.sort((a, b) => b.mb - a.mb);
  return ordenados.length > 0 ? ordenados[0].id : 'ninguno';
}

console.log(elegir_modelo(700, [{ id: 'pequeño', mb: 400 }, { id: 'mediano', mb: 600 }]));`,
      starter: `function elegir_modelo(memoriaMb, modelos) {
  // Entre los que caben, devuelve el id del de mayor tamaño.
  // Si ninguno cabe, devuelve 'ninguno'.
}`,
      solution: `function elegir_modelo(memoriaMb, modelos) {
  const candidatos = modelos.filter((m) => m.mb <= memoriaMb).sort((a, b) => b.mb - a.mb);
  return candidatos.length > 0 ? candidatos[0].id : 'ninguno';
}`,
      debugStarter: `function elegir_modelo(memoriaMb, modelos) {
  return modelos[0].id;
}`,
    },
    python: {
      example: `def elegir_modelo(memoria_mb, modelos):
    candidatos = sorted([m for m in modelos if m["mb"] <= memoria_mb], key=lambda m: m["mb"], reverse=True)
    return candidatos[0]["id"] if candidatos else "ninguno"

print(elegir_modelo(700, [{"id": "pequeno", "mb": 400}, {"id": "mediano", "mb": 600}]))`,
      starter: `def elegir_modelo(memoria_mb, modelos):
    # Entre los que caben, devuelve el id del de mayor tamaño.
    # Si ninguno cabe, devuelve 'ninguno'.
    pass`,
      solution: `def elegir_modelo(memoria_mb, modelos):
    candidatos = sorted([m for m in modelos if m["mb"] <= memoria_mb], key=lambda m: m["mb"], reverse=True)
    return candidatos[0]["id"] if candidatos else "ninguno"`,
      debugStarter: `def elegir_modelo(memoria_mb, modelos):
    return modelos[0]["id"]`,
    },
    practice: {
      title: 'Ordena la estantería',
      instructions: "Implementa elegir_modelo(memoriaMb, modelos). Cada modelo trae id y mb. Devuelve el id del más grande que quepa en la memoria, o 'ninguno' si no cabe alguno.",
      functionName: 'elegir_modelo',
      cases: [
        { args: [700, [{ id: 'pequenio', mb: 400 }, { id: 'mediano', mb: 600 }, { id: 'coloso', mb: 9000 }]], expected: 'mediano', description: 'Ignora al coloso y toma el mayor viable' },
        { args: [200, [{ id: 'grande', mb: 500 }, { id: 'enorme', mb: 1200 }]], expected: 'ninguno', description: 'Memoria corta no carga a nadie' },
        { args: [1500, [{ id: 'b', mb: 800 }, { id: 'a', mb: 1200 }, { id: 'c', mb: 300 }]], expected: 'a', description: 'El orden de la lista no decide el ganador' },
      ],
      hints: [
        'Primero separa quién cabe; después compara tamaños solo entre ellos.',
        'Ordenar descendente coloca al ganador en la primera posición.',
        'La lista vacía tras filtrar necesita su propio resultado declarado.',
      ],
    },
    reading: {
      core: 'Los modelos publican variantes según precisión y tamaño. Una versión cuantizada ocupa menos memoria y descarga más rápido, a cambio de posibles diferencias de calidad. La elección correcta depende del dispositivo concreto donde correrá.',
      mechanics: 'Cada candidato declara identificador y requerimiento de memoria. Filtrar por capacidad elimina imposibles antes de comparar. Entre los viables gana el más capaz, porque calidad suele crecer con tamaño dentro de una misma familia.',
      mechanicsExample: `elegir_modelo(700, [{ id: 'a', mb: 400 }, { id: 'b', mb: 900 }])
→ 'a'`,
      decisions: 'Publica en la interfaz qué modelo quedó elegido y por qué: memoria disponible frente a requisitos. Permite elegir manualmente entre los viables para experimentar. Guarda la elección por dispositivo, porque otro equipo puede decidir distinto.',
      errors: 'Ofrecer modelos que el dispositivo no puede cargar termina en fallos misteriosos a mitad de carga. Comparar tamaños antes de filtrar puede coronar a un imposible. Y ocultar el motivo de la elección impide aprender del propio hardware.',
      keyPoints: [
        'Filtra por capacidad antes de comparar calidad o tamaño.',
        'Entre los viables, el mayor suele rendir mejor.',
        'Ningún candidato viable es un resultado válido y debe verse así.',
      ],
      question: '¿Más grande siempre es mejor?',
      answer: 'Dentro de una familia suele mejorar la calidad, pero crecen descarga, latencia y memoria. En tu equipo, el mejor es el más grande que quepa cómodo y responda a la velocidad que tu uso tolera.',
      transfer: 'Con cuatro gigas libres y tres variantes de un mismo modelo, decide cuál instalarías y qué comprobarías antes de confirmar.',
      sources: ['webllm', 'hf-model-hub', 'qwen25-webllm'],
    },
    reasoning: {
      activity: vectorRankingActivity('Ordena los modelos viables por preferencia de carga.', [
        ['coloso', 'Coloso, nueve gigas', 1],
        ['mediano', 'Mediano, seiscientos megas', 3],
        ['pequenio', 'Pequeño, cuatrocientos megas', 2],
      ]),
      explanation: 'Entre los que caben, el de mayor tamaño encabeza la preferencia. El que excede la memoria ni compite.',
      hints: ['Primero descarta lo que no cabe.', 'Mayor tamaño viable gana.'],
    },
    debug: {
      title: 'Siempre gana el primero de la lista',
      expected: 'Gana el mayor entre los que caben.',
      observed: 'La función devuelve el primer elemento sin filtrar ni comparar.',
      hints: ['Coloca al coloso primero y dale memoria corta.', 'Ni filtro ni comparación participan hoy.', 'Filtra por capacidad, ordena por tamaño y toma el primero.'],
    },
  }),
  authoredLesson({
    number: 16, module: 2, title: 'La llamada al modelo local',
    summary: 'Traduce el paquete de conversación al cuerpo que espera WebLLM, con streaming activo.',
    concepts: [
      ['WebLLM', 'Runtime que ejecuta modelos de lenguaje en el navegador mediante WebGPU.'],
      ['Adaptador', 'Capa que traduce contratos internos al formato del runtime.'],
    ],
    requires: ['elegir-modelo-equipo'],
    skill: 'preparar-webllm',
    capacidad: { nombre: 'cuerpo_webllm', descripcion: 'El despachador del chat habla ya el dialecto exacto del motor local.' },
    integracion: 'Con cuerpo_webllm, montar_conversacion consigue destino: el TutorLocal envía su paquete al Worker de WebLLM y recibe fragmentos en streaming para la burbuja que aprendió a pintar en la Fase 2.',
    mentalModel: 'El adaptador es un traductor jurado: tu paquete interno entra, sale el documento con el vocabulario exacto del runtime.',
    script: [
      'WebLLM espera un cuerpo con el identificador del modelo, la lista de mensajes con roles en inglés y streaming activado para recibir trozos.',
      'Tu chat ya habla español interno: sistema, usuario, asistente. El adaptador traduce nombres de campos sin inventar contenido.',
      'El ejemplo construye ese cuerpo con las tres piezas: modelo, mensajes y streaming verdadero. Los textos viajan intactos.',
      'Completa cuerpo_webllm respetando nombres exactos. Las pruebas cambian modelo y mensajes para detectar valores fijos.',
    ],
    javascript: {
      example: `function cuerpo_webllm(modeloId, sistema, mensajeUsuario) {
  return {
    model: modeloId,
    messages: [
      { role: 'system', content: sistema },
      { role: 'user', content: mensajeUsuario },
    ],
    stream: true,
  };
}

console.log(cuerpo_webllm('qwen-mini', 'Responde breve.', 'hola'));`,
      starter: `function cuerpo_webllm(modeloId, sistema, mensajeUsuario) {
  // Campos en inglés: model, messages, stream.
  // Roles system y user conservan el contenido recibido.
}`,
      solution: `function cuerpo_webllm(modeloId, sistema, mensajeUsuario) {
  return {
    model: modeloId,
    messages: [
      { role: 'system', content: sistema },
      { role: 'user', content: mensajeUsuario },
    ],
    stream: true,
  };
}`,
      debugStarter: `function cuerpo_webllm(modeloId, sistema, mensajeUsuario) {
  return { model: modeloId, messages: [], stream: false };
}`,
    },
    python: {
      example: `def cuerpo_webllm(modelo_id, sistema, mensaje_usuario):
    return {
        "model": modelo_id,
        "messages": [
            {"role": "system", "content": sistema},
            {"role": "user", "content": mensaje_usuario},
        ],
        "stream": True,
    }

print(cuerpo_webllm("qwen-mini", "Responde breve.", "hola"))`,
      starter: `def cuerpo_webllm(modelo_id, sistema, mensaje_usuario):
    # Campos en inglés: model, messages, stream.
    # Roles system y user conservan el contenido recibido.
    pass`,
      solution: `def cuerpo_webllm(modelo_id, sistema, mensaje_usuario):
    return {
        "model": modelo_id,
        "messages": [
            {"role": "system", "content": sistema},
            {"role": "user", "content": mensaje_usuario},
        ],
        "stream": True,
    }`,
      debugStarter: `def cuerpo_webllm(modelo_id, sistema, mensaje_usuario):
    return {"model": modelo_id, "messages": [], "stream": False}`,
    },
    practice: {
      title: 'Traduce al dialecto del motor',
      instructions: 'Implementa cuerpo_webllm(modeloId, sistema, mensajeUsuario). Construye el objeto con model, messages y stream activado, usando roles system y user con el contenido recibido.',
      functionName: 'cuerpo_webllm',
      cases: [
        { args: ['qwen-mini', 'Responde breve.', 'hola'], expected: { model: 'qwen-mini', messages: [{ role: 'system', content: 'Responde breve.' }, { role: 'user', content: 'hola' }], stream: true }, description: 'Traduce ficha y turno al formato del runtime' },
        { args: ['lfm-prueba', 'Sé amable.', '¿Qué es RAG?'], expected: { model: 'lfm-prueba', messages: [{ role: 'system', content: 'Sé amable.' }, { role: 'user', content: '¿Qué es RAG?' }], stream: true }, description: 'Otro modelo y otros textos producen otro cuerpo válido' },
      ],
      hints: [
        'Los nombres de campos van en inglés tal como los espera el runtime.',
        'Cada rol forma un objeto con role y content.',
        'Streaming se activa con el valor verdadero, no con texto.',
      ],
    },
    reading: {
      core: 'WebLLM ejecuta modelos de lenguaje dentro del navegador apoyándose en WebGPU. Su contrato recuerda a las APIs de chat conocidas: modelo, lista de mensajes y opciones de generación. Aprender a traducir hacia él te prepara para cualquier API similar.',
      mechanics: 'El flujo completo crea el cliente con el modelo elegido, envía el cuerpo desde el Worker y consume eventos de fragmentos hasta el cierre. El modo estructurado opcional guía la salida JSON mediante response_format; después tu validador de la Fase 2 comprueba el resultado igual que siempre.',
      mechanicsExample: `cuerpo_webllm('m', 'Regla', 'hi')
→ { model: 'm', messages: [...], stream: true }`,
      decisions: 'Centraliza la traducción en un único adaptador. Cuando llegue un backend seguro o una API remota experimental, escribirá otro adaptador y la interfaz no se enterará. Mantén streaming activado para alimentar la burbuja progresiva que ya construiste.',
      errors: 'Enviar roles en español rompe el reconocimiento del runtime. Desactivar streaming sin necesidad obliga a esperar la respuesta completa. Y construir el cuerpo disperso en varias pantallas multiplica lugares donde actualizar cuando cambies de motor.',
      keyPoints: [
        'El adaptador traduce nombres, nunca contenido.',
        'Streaming conecta el motor con la burbuja progresiva.',
        'Un solo lugar construye cuerpos; todos los proveedores se benefician.',
      ],
      question: '¿Dónde corre realmente la generación?',
      answer: 'En la GPU de tu equipo a través de WebGPU, dentro de un Worker coordinado por WebLLM. Ninguna palabra de tu conversación sale hacia un servidor de modelos.',
      transfer: 'Escribe en papel el segundo adaptador: ¿qué cambiaría si mañana el motor fuera una API remota experimental?',
      sources: ['webllm', 'qwen25-webllm', 'openai-prompting'],
    },
    reasoning: {
      activity: flowActivity('Recorre un turno completo en el TutorLocal.', [
        ['paquete', 'Montar conversación interna', 'start'],
        ['traducir', 'Adaptar al cuerpo del runtime', 'process'],
        ['worker', 'Enviar al Worker con WebGPU', 'process'],
        ['trozos', 'Recibir fragmentos en streaming', 'output'],
        ['validar', 'Validar y pintar la burbuja', 'end'],
      ], [
        ['paquete', 'traducir'],
        ['traducir', 'worker'],
        ['worker', 'trozos'],
        ['trozos', 'validar'],
      ]),
      explanation: 'El paquete interno nunca llega crudo al runtime: se traduce, viaja por el Worker y regresa en fragmentos que se validan antes de pintarse.',
      hints: ['La traducción va antes del Worker.', 'Validar pertenece al final del recorrido.'],
    },
    debug: {
      title: 'El cuerpo llega vacío y mudo',
      expected: 'Modelo, mensajes y streaming componen el cuerpo.',
      observed: 'La lista de mensajes sale vacía y el streaming desactivado.',
      hints: ['Prueba el cuerpo resultante con ojos del runtime.', 'Falta poblar la lista con los dos roles.', 'Activa el streaming con el valor booleano verdadero.'],
    },
  }),
];
