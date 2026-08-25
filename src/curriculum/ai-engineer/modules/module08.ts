import { authoredLesson, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_08 = [
  authoredLesson({
    number: 44, module: 8, title: 'Flujo fijo frente a agente', summary: 'Usa un workflow cuando conoces los pasos y reserva un agente para decisiones que requieren adaptación.',
    concepts: [['Workflow', 'Secuencia programada de pasos y decisiones.'], ['Agente', 'Bucle donde un modelo elige entre acciones permitidas según estado.']], requires: ['evaluar-rag'], skill: 'distinguir-workflow-agente', mentalModel: 'Un workflow es una ruta; un agente elige cruces dentro de un mapa y límites definidos.',
    script: ['Un agente añade autonomía y superficie de fallo. Si los pasos son conocidos, un workflow suele ser más simple y comprobable.', 'El agente tiene sentido cuando debe decidir qué herramienta usar, repetir una búsqueda o adaptar el plan con información nueva.', 'El ejemplo elige workflow para pasos conocidos y agente cuando la tarea necesita adaptación.', 'Completa la decisión. No llames agente a una secuencia fija con una sola llamada.'],
    javascript: { example: `function elegir_orquestacion(pasos_conocidos, necesita_adaptar) {
  return pasos_conocidos && !necesita_adaptar ? 'workflow' : 'agente';
}`, starter: `function elegir_orquestacion(pasos_conocidos, necesita_adaptar) {
  // Devuelve workflow o agente.
}`, solution: `function elegir_orquestacion(pasos_conocidos, necesita_adaptar) {
  return pasos_conocidos && !necesita_adaptar ? 'workflow' : 'agente';
}`, debugStarter: `function elegir_orquestacion(pasos_conocidos, necesita_adaptar) {
  return 'agente';
}` },
    python: { example: `def elegir_orquestacion(pasos_conocidos, necesita_adaptar):
    return "workflow" if pasos_conocidos and not necesita_adaptar else "agente"`, starter: `def elegir_orquestacion(pasos_conocidos, necesita_adaptar):
    # Devuelve workflow o agente.
    pass`, solution: `def elegir_orquestacion(pasos_conocidos, necesita_adaptar):
    return "workflow" if pasos_conocidos and not necesita_adaptar else "agente"`, debugStarter: `def elegir_orquestacion(pasos_conocidos, necesita_adaptar):
    return "agente"` },
    practice: { title: 'Elige la orquestación', instructions: 'Implementa elegir_orquestacion. Workflow exige pasos conocidos y ninguna adaptación.', functionName: 'elegir_orquestacion', cases: [{ args: [true, false], expected: 'workflow', description: 'Usa flujo fijo para pasos conocidos' }, { args: [true, true], expected: 'agente', description: 'Usa agente cuando debe adaptar decisiones' }, { args: [false, false], expected: 'agente', description: 'Reconoce una ruta no especificada' }], hints: ['Workflow requiere ambas condiciones.', 'Niega necesita_adaptar.', 'Los demás casos son agente.'] },
    reading: { core: 'Un workflow codifica orden y ramas. Un agente observa estado, propone acción, recibe resultado y repite. La autonomía solo aporta valor si la tarea no cabe en una ruta fija.', mechanics: 'Ambos usan modelos y tools. La diferencia es quién decide el siguiente paso. El agente necesita límite de pasos, permisos, presupuesto, trazas y condición de parada.', decisions: 'Empieza con workflow. Añade una decisión agentic solo donde los casos demuestren necesidad. Mantén pasos sensibles fuera del control directo del modelo.', errors: 'Llamar agente a cualquier chat oculta arquitectura. Dar autonomía sin evaluación crea bucles, coste y acciones inesperadas.', keyPoints: ['Workflow es la opción inicial.', 'Autonomía se concede por necesidad medida.', 'Toda iteración tiene límites y traza.'], question: '¿Un agente siempre usa herramientas?', answer: 'Un agente útil suele actuar o consultar, pero puede decidir entre pasos internos. Sin opciones ni bucle, probablemente es una llamada o workflow.', transfer: 'Toma un proceso de tres pasos y marca cuál, si alguno, necesita una decisión agentic.', sources: ['anthropic-tool-use', 'roadmap-ai-engineer'] },
    reasoning: { activity: decisionActivity('Elige workflow o agente.', [['factura', 'Extraer, validar y guardar con pasos fijos', ['workflow', 'agente'], 'workflow'], ['investigar', 'Elegir fuentes según hallazgos', ['workflow', 'agente'], 'agente']]), explanation: 'La adaptabilidad justifica el agente; la secuencia conocida favorece código explícito.', hints: ['Pregunta quién elige el siguiente paso.', 'No añadas autonomía por nombre.'] },
    debug: { title: 'Todo se llama agente', expected: 'El caso fijo usa workflow.', observed: 'Siempre devuelve agente.', hints: ['Prueba true, false.', 'Usa ambas señales.', 'Añade una condición.'] },
  }),
  authoredLesson({
    number: 45, module: 8, title: 'Herramientas y esquemas', summary: 'Declara tools con argumentos mínimos y valida nombre, esquema y permisos antes de ejecutar.',
    concepts: [['Tool', 'Capacidad externa descrita por nombre, propósito y esquema.'], ['Allowlist', 'Lista explícita de acciones permitidas.']], requires: ['distinguir-workflow-agente'], skill: 'disenar-tools', mentalModel: 'Una tool es una API con un llamador no confiable; el esquema valida forma y la política valida permiso.',
    script: ['El modelo no ejecuta funciones por sí solo. Propone un nombre y argumentos según herramientas declaradas.', 'La aplicación valida tool, tipos, valores, usuario y estado antes de llamar al sistema real.', 'El ejemplo acepta solo nombres presentes en una allowlist.', 'Completa la comprobación exacta. Una coincidencia parcial no concede permiso.'],
    javascript: { example: `function tool_permitida(nombre, permitidas) {
  return permitidas.includes(nombre);
}`, starter: `function tool_permitida(nombre, permitidas) {
  // Coincidencia exacta.
}`, solution: `function tool_permitida(nombre, permitidas) {
  return permitidas.includes(nombre);
}`, debugStarter: `function tool_permitida(nombre, permitidas) {
  return permitidas.some(item => nombre.includes(item));
}` },
    python: { example: `def tool_permitida(nombre, permitidas):
    return nombre in permitidas`, starter: `def tool_permitida(nombre, permitidas):
    # Coincidencia exacta.
    pass`, solution: `def tool_permitida(nombre, permitidas):
    return nombre in permitidas`, debugStarter: `def tool_permitida(nombre, permitidas):
    return any(item in nombre for item in permitidas)` },
    practice: { title: 'Protege una tool', instructions: 'Implementa tool_permitida con coincidencia exacta.', functionName: 'tool_permitida', cases: [{ args: ['buscar_pedido', ['buscar_pedido', 'leer_manual']], expected: true, description: 'Acepta un nombre declarado' }, { args: ['buscar_pedido_y_borrar', ['buscar_pedido']], expected: false, description: 'Rechaza un nombre que solo contiene uno permitido' }], hints: ['La lista ya contiene nombres completos.', 'No uses includes sobre el nombre.', 'Comprueba pertenencia exacta.'] },
    reading: { core: 'Una definición de tool incluye nombre estable, descripción concreta y JSON Schema. La respuesta del modelo es una propuesta no confiable.', mechanics: 'El coordinador valida esquema, normaliza valores, aplica allowlist y autorización, ejecuta con timeout y devuelve un resultado estructurado.', decisions: 'Diseña tools pequeñas y específicas. Separa lectura de escritura. Pide confirmación para efectos irreversibles o de alto impacto.', errors: 'Una tool genérica ejecutar_comando concede demasiado. La descripción no reemplaza permisos. Usar argumentos sin validar abre inyección en APIs posteriores.', keyPoints: ['Esquema y permiso son controles distintos.', 'Lectura y escritura se separan.', 'El resultado también se valida.'], question: '¿Puedo confiar en argumentos porque cumplen JSON Schema?', answer: 'No. El esquema valida forma. Todavía debes validar rangos, ids, pertenencia y autorización del usuario.', transfer: 'Diseña una tool de solo lectura para consultar un pedido y enumera validaciones.', sources: ['anthropic-tool-use', 'openai-function-calling', 'google-function-calling'] },
    reasoning: { activity: sequenceActivity('Ordena una llamada de tool.', [['proponer', 'Modelo propone nombre y argumentos'], ['esquema', 'Validar esquema'], ['permiso', 'Autorizar usuario y acción'], ['ejecutar', 'Ejecutar con timeout'], ['resultado', 'Validar resultado']]), explanation: 'La ejecución ocurre solo después de dos fronteras: forma y permiso.', hints: ['El modelo no autoriza.', 'El resultado externo puede fallar.'] },
    debug: { title: 'Un nombre peligroso contiene otro permitido', expected: 'Solo nombres exactos pasan.', observed: 'La subcadena concede permiso.', hints: ['Prueba buscar_pedido_y_borrar.', 'No busques dentro del nombre.', 'Usa pertenencia a la lista.'] },
  }),
  authoredLesson({
    number: 46, module: 8, title: 'Bucle manual de un agente', summary: 'Implementa observar, decidir, actuar y detener con estados explícitos.',
    concepts: [['Agent loop', 'Ciclo de observación, decisión, acción y resultado.'], ['Condición de parada', 'Regla que termina el ciclo por éxito, límite o error.']], requires: ['disenar-tools'], skill: 'implementar-bucle-agente', mentalModel: 'Cada vuelta consume presupuesto y debe acercar a un estado terminal.',
    script: ['Un bucle de agente no es while true. Tiene estado, pasos máximos, tools permitidas y una salida terminal.', 'El modelo decide entre responder o proponer tool. El coordinador ejecuta y añade el resultado como nueva observación.', 'La función elige detener cuando ya hay respuesta; de lo contrario usa tool si hace falta.', 'Completa los tres estados y evita un bucle sin salida.'],
    javascript: { example: `function siguiente_accion(tiene_respuesta, necesita_tool) {
  if (tiene_respuesta) return 'finalizar';
  return necesita_tool ? 'tool' : 'responder';
}`, starter: `function siguiente_accion(tiene_respuesta, necesita_tool) {
  // finalizar, tool o responder.
}`, solution: `function siguiente_accion(tiene_respuesta, necesita_tool) {
  if (tiene_respuesta) return 'finalizar';
  return necesita_tool ? 'tool' : 'responder';
}`, debugStarter: `function siguiente_accion(tiene_respuesta, necesita_tool) {
  return necesita_tool ? 'tool' : 'tool';
}` },
    python: { example: `def siguiente_accion(tiene_respuesta, necesita_tool):
    if tiene_respuesta:
        return "finalizar"
    return "tool" if necesita_tool else "responder"`, starter: `def siguiente_accion(tiene_respuesta, necesita_tool):
    # finalizar, tool o responder.
    pass`, solution: `def siguiente_accion(tiene_respuesta, necesita_tool):
    if tiene_respuesta:
        return "finalizar"
    return "tool" if necesita_tool else "responder"`, debugStarter: `def siguiente_accion(tiene_respuesta, necesita_tool):
    return "tool"` },
    practice: { title: 'Decide el próximo estado', instructions: 'Implementa siguiente_accion con prioridad para finalizar.', functionName: 'siguiente_accion', cases: [{ args: [true, true], expected: 'finalizar', description: 'No llama tools después de tener respuesta' }, { args: [false, true], expected: 'tool', description: 'Consulta una tool cuando hace falta' }, { args: [false, false], expected: 'responder', description: 'Genera respuesta sin tool innecesaria' }], hints: ['Finalizar se comprueba primero.', 'Tool depende de la segunda señal.', 'Añade un fallback responder.'] },
    reading: { core: 'El bucle recibe estado, construye contexto, pide una decisión y valida la salida. Si propone tool, ejecuta y agrega la observación. Si responde, finaliza.', mechanics: 'El coordinador cuenta pasos, tokens, tiempo y errores. Detecta repeticiones de la misma acción. Cada tool result se registra con id y estado.', decisions: 'Define condiciones de éxito fuera del modelo cuando sea posible. Detén por límite y devuelve un estado comprensible en vez de ocultar un fallo.', errors: 'Un bucle sin máximo puede gastar indefinidamente. Reintentar la misma acción sin cambio no progresa. Confundir una propuesta de respuesta con éxito salta validación.', keyPoints: ['El coordinador controla el bucle.', 'Cada paso tiene presupuesto.', 'Los estados terminales son explícitos.'], question: '¿Quién decide que una tarea terminó?', answer: 'El modelo puede proponerlo, pero el coordinador valida condiciones, formato y límites antes de aceptar.', transfer: 'Escribe estados y transiciones de un agente que consulta un manual una sola vez.', sources: ['anthropic-tool-use', 'owasp-genai-top10'] },
    reasoning: { activity: flowActivity('Conecta un bucle limitado.', [['observar', 'Observar estado', 'start'], ['decidir', 'Modelo propone', 'decision'], ['tool', 'Validar y ejecutar tool', 'process'], ['final', 'Validar respuesta', 'decision'], ['fin', 'Terminar', 'end']], [['observar', 'decidir'], ['decidir', 'tool', 'tool'], ['tool', 'observar'], ['decidir', 'final', 'respuesta'], ['final', 'fin', 'válida']]), explanation: 'La tool vuelve como observación. Una respuesta válida alcanza el estado final.', hints: ['Tool no termina automáticamente.', 'La respuesta se valida.'] },
    debug: { title: 'El agente siempre llama una tool', expected: 'Puede finalizar o responder.', observed: 'Todos los caminos devuelven tool.', hints: ['Prueba true, true.', 'Faltan estados terminales.', 'Evalúa las señales en orden.'] },
  }),
  authoredLesson({
    number: 47, module: 8, title: 'ReAct y trazas de decisión', summary: 'Registra observaciones y acciones sin exponer razonamiento privado ni confundir traza con verdad.',
    concepts: [['ReAct', 'Patrón que alterna razonamiento orientado a tarea y acciones.'], ['Traza', 'Eventos observables del sistema: entrada, decisión, tool y resultado.']], requires: ['implementar-bucle-agente'], skill: 'trazar-agente', mentalModel: 'Registra qué ocurrió y por qué se permitió, no una transcripción privada de pensamiento.',
    script: ['ReAct popularizó alternar pensamiento y acción, pero un producto no necesita mostrar cadenas privadas del modelo.', 'Una traza útil registra decisión estructurada, tool, argumentos redacted, resultado, duración y política aplicada.', 'El ejemplo construye un evento con tipo y detalle recibido.', 'Completa el evento y conserva un timestamp proporcionado para que las pruebas sean deterministas.'],
    javascript: { example: `function evento_traza(tipo, detalle, tiempo) {
  return { tipo, detalle, tiempo };
}`, starter: `function evento_traza(tipo, detalle, tiempo) {
  // Conserva los tres campos.
}`, solution: `function evento_traza(tipo, detalle, tiempo) {
  return { tipo, detalle, tiempo };
}`, debugStarter: `function evento_traza(tipo, detalle, tiempo) {
  return { tipo: 'pensamiento', detalle };
}` },
    python: { example: `def evento_traza(tipo, detalle, tiempo):
    return {"tipo": tipo, "detalle": detalle, "tiempo": tiempo}`, starter: `def evento_traza(tipo, detalle, tiempo):
    # Conserva los tres campos.
    pass`, solution: `def evento_traza(tipo, detalle, tiempo):
    return {"tipo": tipo, "detalle": detalle, "tiempo": tiempo}`, debugStarter: `def evento_traza(tipo, detalle, tiempo):
    return {"tipo": "pensamiento", "detalle": detalle}` },
    practice: { title: 'Construye una traza', instructions: 'Implementa evento_traza(tipo, detalle, tiempo) sin cambiar ni omitir campos.', functionName: 'evento_traza', cases: [{ args: ['tool', 'buscar manual', 12], expected: { tipo: 'tool', detalle: 'buscar manual', tiempo: 12 }, description: 'Registra una acción observable' }, { args: ['resultado', '2 documentos', 18], expected: { tipo: 'resultado', detalle: '2 documentos', tiempo: 18 }, description: 'Registra un resultado distinto' }], hints: ['Devuelve un objeto.', 'No fijes tipo.', 'Incluye tiempo.'] },
    reading: { core: 'ReAct organiza iteraciones de razonamiento y acción. En producción la observabilidad se apoya en eventos estructurados, no en pedir o almacenar cadenas completas de pensamiento.', mechanics: 'Cada span registra solicitud, modelo, tool, duración, estado, uso y error. Los argumentos sensibles se eliminan o resumen. Un trace id conecta eventos.', decisions: 'Conserva información necesaria para depurar y auditar. Aplica retención y acceso. Explica decisiones al usuario con razones verificables, no con pensamiento interno.', errors: 'Registrar prompts completos puede filtrar secretos. Una traza sin ids no conecta pasos. Mostrar razonamiento generado como explicación fiel crea falsa transparencia.', keyPoints: ['Traza eventos, no pensamiento privado.', 'Redacta datos sensibles.', 'Las explicaciones se apoyan en evidencia.'], question: '¿Por qué no guardar toda la cadena de pensamiento?', answer: 'Puede contener datos sensibles, no es una explicación garantizada y aumenta riesgo. Registra decisiones y evidencias estructuradas.', transfer: 'Diseña cinco tipos de evento para un agente con tools.', sources: ['anthropic-tool-use', 'owasp-genai-top10'] },
    reasoning: { activity: decisionActivity('Decide qué registrar.', [['tool', 'Nombre, estado y duración de tool', ['registrar', 'descartar'], 'registrar'], ['clave', 'Clave API completa', ['registrar', 'descartar'], 'descartar'], ['pensamiento', 'Cadena privada completa', ['registrar', 'descartar'], 'descartar']]), explanation: 'La observabilidad minimiza datos y conserva hechos operativos.', hints: ['Un secreto nunca entra al trace.', 'Acciones y estados sí son auditables.'] },
    debug: { title: 'Toda traza se llama pensamiento', expected: 'Tipo, detalle y tiempo se conservan.', observed: 'El tipo está fijo y falta tiempo.', hints: ['Prueba resultado.', 'Usa el parámetro tipo.', 'Añade tiempo.'] },
  }),
  authoredLesson({
    number: 48, module: 8, title: 'Estado, memoria y límites del agente', summary: 'Limita pasos, coste, tiempo y permisos; conserva estado mínimo y recupera memoria por necesidad.',
    concepts: [['Step limit', 'Máximo de iteraciones por ejecución.'], ['Budget', 'Límite conjunto de tokens, coste o tiempo.'], ['Human-in-the-loop', 'Intervención humana en una decisión definida.']], requires: ['trazar-agente'], skill: 'limitar-agente', mentalModel: 'El agente trabaja dentro de una caja con contador, reloj, cartera y puertas de permiso.',
    script: ['La memoria no corrige un agente sin límites. Cada ejecución necesita pasos máximos, deadline, presupuesto y tools permitidas.', 'El estado conserva objetivo, observaciones y resultados. La memoria recuperada entra como dato y puede estar obsoleta.', 'La función permite continuar solo si quedan pasos y presupuesto.', 'Completa ambas condiciones. Una sola no basta.'],
    javascript: { example: `function puede_continuar(pasos, maximo, presupuesto) {
  return pasos < maximo && presupuesto > 0;
}`, starter: `function puede_continuar(pasos, maximo, presupuesto) {
  // Exige pasos disponibles y presupuesto positivo.
}`, solution: `function puede_continuar(pasos, maximo, presupuesto) {
  return pasos < maximo && presupuesto > 0;
}`, debugStarter: `function puede_continuar(pasos, maximo, presupuesto) {
  return pasos < maximo || presupuesto > 0;
}` },
    python: { example: `def puede_continuar(pasos, maximo, presupuesto):
    return pasos < maximo and presupuesto > 0`, starter: `def puede_continuar(pasos, maximo, presupuesto):
    # Exige pasos disponibles y presupuesto positivo.
    pass`, solution: `def puede_continuar(pasos, maximo, presupuesto):
    return pasos < maximo and presupuesto > 0`, debugStarter: `def puede_continuar(pasos, maximo, presupuesto):
    return pasos < maximo or presupuesto > 0` },
    practice: { title: 'Cierra el bucle', instructions: 'Implementa puede_continuar. Ambas condiciones son obligatorias.', functionName: 'puede_continuar', cases: [{ args: [2, 5, 1], expected: true, description: 'Continúa con pasos y presupuesto' }, { args: [5, 5, 10], expected: false, description: 'Detiene al alcanzar el límite' }, { args: [1, 5, 0], expected: false, description: 'Detiene sin presupuesto' }], hints: ['Combina con and.', 'El paso igual al máximo ya no continúa.', 'Presupuesto debe ser mayor que cero.'] },
    reading: { core: 'Un agente necesita límites independientes: pasos, tiempo, tokens, coste, herramientas y alcance de datos. El estado se actualiza por evento; la memoria se recupera con filtros.', mechanics: 'El coordinador verifica límites antes y después de cada llamada. Al detener devuelve éxito, parcial, cancelado o límite alcanzado con traza.', decisions: 'Ajusta límites por tarea y riesgo. Una tool de escritura requiere confirmación y quizá un límite más corto. Permite cancelar desde la interfaz.', errors: 'Un gran contexto no reemplaza estado explícito. Renovar el presupuesto en cada reintento evita el límite. Memoria global mezcla usuarios.', keyPoints: ['Los límites viven fuera del modelo.', 'Estado y memoria tienen alcance.', 'Detener con resultado parcial es válido.'], question: '¿Qué ocurre al alcanzar el límite?', answer: 'El sistema detiene nuevas acciones y devuelve un estado claro con lo logrado y lo pendiente. No continúa en segundo plano sin autorización.', transfer: 'Define límites para un agente de lectura y otro que propone una modificación.', sources: ['owasp-genai-top10', 'mcp-architecture'] },
    reasoning: { activity: sequenceActivity('Ordena una iteración limitada.', [['limites', 'Comprobar límites'], ['contexto', 'Construir contexto'], ['decidir', 'Pedir decisión'], ['autorizar', 'Autorizar acción'], ['actualizar', 'Actualizar estado y contadores']]), explanation: 'Los límites se comprueban antes de gastar y los contadores se actualizan al final.', hints: ['No llames al modelo antes del límite.', 'La autorización precede a tool.'] },
    debug: { title: 'Una condición permite seguir', expected: 'Ambas condiciones son obligatorias.', observed: 'La función usa or.', hints: ['Prueba máximo alcanzado con presupuesto.', 'or deja una puerta abierta.', 'Usa and.'] },
  }),
  authoredLesson({
    number: 49, module: 8, title: 'Sistemas con varios agentes', summary: 'Divide responsabilidades solo cuando mejora aislamiento, especialización o evaluación.',
    concepts: [['Multi-agent', 'Sistema con varios bucles o roles coordinados.'], ['Handoff', 'Transferencia explícita de tarea y contexto.'], ['Supervisor', 'Componente que asigna y valida trabajo.']], requires: ['limitar-agente'], skill: 'disenar-multiagente', mentalModel: 'Cada agente es un servicio con contrato; más agentes significan más fronteras, no inteligencia gratuita.',
    script: ['Un sistema multiagente puede separar investigación, redacción y revisión. También añade latencia, coste y fallos de coordinación.', 'Cada handoff necesita objetivo, entrada mínima, formato de salida y criterio de aceptación.', 'La función asigna una tarea a un rol conocido y usa general para lo demás.', 'Completa el mapa sin decidir por palabras parciales.'],
    javascript: { example: `function asignar_agente(tarea) {
  const roles = { investigar: 'investigador', revisar: 'revisor' };
  return roles[tarea] ?? 'general';
}`, starter: `function asignar_agente(tarea) {
  // investigar, revisar o general.
}`, solution: `function asignar_agente(tarea) {
  return ({ investigar: 'investigador', revisar: 'revisor' })[tarea] ?? 'general';
}`, debugStarter: `function asignar_agente(tarea) {
  return tarea.includes('re') ? 'revisor' : 'investigador';
}` },
    python: { example: `def asignar_agente(tarea):
    return {"investigar": "investigador", "revisar": "revisor"}.get(tarea, "general")`, starter: `def asignar_agente(tarea):
    # investigar, revisar o general.
    pass`, solution: `def asignar_agente(tarea):
    return {"investigar": "investigador", "revisar": "revisor"}.get(tarea, "general")`, debugStarter: `def asignar_agente(tarea):
    return "revisor" if "re" in tarea else "investigador"` },
    practice: { title: 'Asigna por contrato', instructions: 'Implementa asignar_agente con coincidencias exactas y fallback general.', functionName: 'asignar_agente', cases: [{ args: ['investigar'], expected: 'investigador', description: 'Asigna búsqueda de evidencia' }, { args: ['revisar'], expected: 'revisor', description: 'Asigna control independiente' }, { args: ['redactar'], expected: 'general', description: 'Usa fallback para tarea no declarada' }], hints: ['Usa un mapa.', 'No busques subcadenas.', 'Añade general por defecto.'] },
    reading: { core: 'Varios agentes separan contexto, permisos o especialización. La coordinación puede ser supervisor, handoffs directos o pipeline. Cada salida necesita evaluación.', mechanics: 'El handoff incluye task id, objetivo, artefactos, restricciones y resultado esperado. El supervisor registra estado y evita ciclos.', decisions: 'Divide cuando una frontera mejora seguridad o pruebas. Mantén un agente si los roles comparten todo y solo añaden llamadas.', errors: 'Roles con nombres no garantizan independencia. Compartir memoria completa vuelve a mezclar contextos. Los handoffs vagos pierden requisitos.', keyPoints: ['Cada agente tiene contrato y permisos.', 'Los handoffs son datos estructurados.', 'Mide si la división aporta valor.'], question: '¿Más agentes mejoran calidad?', answer: 'No necesariamente. Pueden aportar revisión o especialización, pero también propagan errores. Compara con un workflow simple.', transfer: 'Diseña un handoff de investigador a revisor con cinco campos.', sources: ['mcp-architecture', 'anthropic-tool-use'] },
    reasoning: { activity: decisionActivity('Decide si dividir.', [['permisos', 'Un rol solo lee y otro propone escritura', ['separar', 'mantener uno'], 'separar'], ['mismo', 'Dos roles usan mismo contexto y misma tool', ['separar', 'mantener uno'], 'mantener uno']]), explanation: 'La separación vale cuando crea una frontera verificable.', hints: ['Busca permisos diferentes.', 'Nombres distintos no bastan.'] },
    debug: { title: 'Las subcadenas asignan roles', expected: 'Solo tareas exactas usan roles especiales.', observed: 'Redactar contiene re y se vuelve revisión.', hints: ['Prueba redactar.', 'No uses includes.', 'Usa un mapa con fallback.'] },
  }),
  authoredLesson({
    number: 50, module: 8, title: 'Host, cliente y servidor MCP', summary: 'Ubica responsabilidades y fronteras de confianza en la arquitectura MCP.',
    concepts: [['MCP host', 'Aplicación que coordina experiencia, permisos y clientes.'], ['MCP client', 'Conexión del host con un servidor.'], ['MCP server', 'Programa que expone capacidades y datos mediante MCP.']], requires: ['disenar-multiagente'], skill: 'entender-arquitectura-mcp', mentalModel: 'El host gobierna; cada cliente mantiene una conexión; el servidor publica capacidades.',
    script: ['MCP estandariza cómo una aplicación descubre y usa contexto y herramientas. No convierte servidores en confiables por defecto.', 'El host controla consentimiento y experiencia. Un cliente mantiene la sesión con un servidor. El servidor ofrece recursos, prompts y tools.', 'La función relaciona componente y responsabilidad.', 'Completa los tres roles con nombres exactos.'],
    javascript: { example: `function responsabilidad_mcp(componente) {
  return ({ host: 'coordina', cliente: 'conecta', servidor: 'expone' })[componente] ?? 'desconocida';
}`, starter: `function responsabilidad_mcp(componente) {
  // host coordina, cliente conecta, servidor expone.
}`, solution: `function responsabilidad_mcp(componente) {
  return ({ host: 'coordina', cliente: 'conecta', servidor: 'expone' })[componente] ?? 'desconocida';
}`, debugStarter: `function responsabilidad_mcp(componente) {
  return componente === 'servidor' ? 'coordina' : 'expone';
}` },
    python: { example: `def responsabilidad_mcp(componente):
    return {"host": "coordina", "cliente": "conecta", "servidor": "expone"}.get(componente, "desconocida")`, starter: `def responsabilidad_mcp(componente):
    # host coordina, cliente conecta, servidor expone.
    pass`, solution: `def responsabilidad_mcp(componente):
    return {"host": "coordina", "cliente": "conecta", "servidor": "expone"}.get(componente, "desconocida")`, debugStarter: `def responsabilidad_mcp(componente):
    return "coordina" if componente == "servidor" else "expone"` },
    practice: { title: 'Ubica la responsabilidad', instructions: 'Implementa responsabilidad_mcp con mapa y fallback desconocida.', functionName: 'responsabilidad_mcp', cases: [{ args: ['host'], expected: 'coordina', description: 'El host gobierna conexiones y permisos' }, { args: ['cliente'], expected: 'conecta', description: 'El cliente mantiene una relación con servidor' }, { args: ['servidor'], expected: 'expone', description: 'El servidor publica capacidades' }, { args: ['proxy'], expected: 'desconocida', description: 'No inventa un rol no declarado' }], hints: ['Usa los tres pares exactos.', 'Servidor no coordina la interfaz del usuario.', 'Añade fallback.'] },
    reading: { core: 'MCP usa una arquitectura host-cliente-servidor. El host puede crear varios clientes, cada uno conectado a un servidor. El servidor declara capacidades durante inicialización.', mechanics: 'Las partes negocian versión y capacidades, intercambian mensajes JSON-RPC y gestionan ciclo de vida. El transporte puede ser stdio o HTTP según el entorno.', decisions: 'El host conserva consentimiento, aislamiento y credenciales. Evalúa cada servidor y restringe qué capacidades habilita.', errors: 'Conectar un servidor no significa autorizar todas sus tools. Compartir contexto entre clientes puede romper aislamiento. Ignorar negociación causa incompatibilidad.', keyPoints: ['El host gobierna permisos.', 'Cliente y servidor negocian capacidades.', 'Cada conexión conserva su frontera.'], question: '¿MCP reemplaza la API de mi servicio?', answer: 'No necesariamente. Puede envolver o exponer capacidades de APIs existentes con un contrato pensado para hosts de IA.', transfer: 'Dibuja un host con dos clientes y servidores. Marca qué credenciales y datos ve cada uno.', sources: ['mcp-architecture', 'mcp-specification'] },
    reasoning: { activity: sequenceActivity('Ordena una conexión MCP.', [['crear', 'Host crea cliente'], ['conectar', 'Cliente conecta servidor'], ['inicializar', 'Negociar versión y capacidades'], ['descubrir', 'Descubrir capacidades permitidas'], ['usar', 'Invocar con política del host']]), explanation: 'La negociación precede al uso. El host decide qué exponer al modelo.', hints: ['Conectar no es todavía invocar.', 'Las capacidades se negocian.'] },
    debug: { title: 'Los roles MCP están cruzados', expected: 'Host coordina, cliente conecta, servidor expone.', observed: 'Servidor coordina y los demás exponen.', hints: ['Repasa los tres sustantivos.', 'Usa un mapa.', 'Añade desconocida.'] },
  }),
  authoredLesson({
    number: 51, module: 8, title: 'Recursos, prompts, tools y transportes MCP', summary: 'Distingue datos legibles, plantillas, acciones y canales de comunicación.',
    concepts: [['Resource', 'Dato identificado que una aplicación puede leer.'], ['Prompt', 'Plantilla reutilizable ofrecida por un servidor.'], ['Tool', 'Operación invocable con esquema.'], ['Transport', 'Canal que lleva mensajes MCP.']], requires: ['entender-arquitectura-mcp'], skill: 'usar-capacidades-mcp', mentalModel: 'Resource se lee, prompt se aplica, tool actúa y transport comunica.',
    script: ['MCP separa capacidades para que el host pueda presentarlas y autorizarlas de forma distinta.', 'Los resources representan datos; prompts son plantillas; tools realizan operaciones; el transport mueve mensajes.', 'La función devuelve el verbo principal de cada capacidad.', 'Completa los cuatro tipos y usa desconocido para otro valor.'],
    javascript: { example: `function verbo_mcp(tipo) {
  return ({ resource: 'leer', prompt: 'aplicar', tool: 'invocar', transport: 'comunicar' })[tipo] ?? 'desconocido';
}`, starter: `function verbo_mcp(tipo) {
  // leer, aplicar, invocar, comunicar o desconocido.
}`, solution: `function verbo_mcp(tipo) {
  return ({ resource: 'leer', prompt: 'aplicar', tool: 'invocar', transport: 'comunicar' })[tipo] ?? 'desconocido';
}`, debugStarter: `function verbo_mcp(tipo) {
  return tipo === 'resource' ? 'invocar' : 'leer';
}` },
    python: { example: `def verbo_mcp(tipo):
    return {"resource": "leer", "prompt": "aplicar", "tool": "invocar", "transport": "comunicar"}.get(tipo, "desconocido")`, starter: `def verbo_mcp(tipo):
    # leer, aplicar, invocar, comunicar o desconocido.
    pass`, solution: `def verbo_mcp(tipo):
    return {"resource": "leer", "prompt": "aplicar", "tool": "invocar", "transport": "comunicar"}.get(tipo, "desconocido")`, debugStarter: `def verbo_mcp(tipo):
    return "invocar" if tipo == "resource" else "leer"` },
    practice: { title: 'Distingue capacidades', instructions: 'Implementa verbo_mcp con los cuatro mapas exactos.', functionName: 'verbo_mcp', cases: [{ args: ['resource'], expected: 'leer', description: 'Un recurso aporta datos' }, { args: ['prompt'], expected: 'aplicar', description: 'Un prompt ofrece plantilla' }, { args: ['tool'], expected: 'invocar', description: 'Una tool propone acción' }, { args: ['transport'], expected: 'comunicar', description: 'El transporte lleva mensajes' }, { args: ['archivo'], expected: 'desconocido', description: 'Usa fallback para tipo no MCP' }], hints: ['Un mapa hace visibles las cuatro diferencias.', 'Resource no se invoca como acción.', 'Añade desconocido.'] },
    reading: { core: 'Resources entregan contenido identificado por URI. Prompts ofrecen plantillas. Tools exponen operaciones con esquemas. El transporte define cómo viajan mensajes; no cambia la semántica de esas capacidades.', mechanics: 'El servidor anuncia capacidades, lista elementos y responde solicitudes. El host decide qué mostrar, leer o invocar según consentimiento y política.', decisions: 'Usa resource para datos, tool para efectos o consultas parametrizadas y prompt para flujos iniciados por usuario. Elige transporte por proceso local o servicio remoto.', errors: 'Exponer lectura como tool de escritura amplía permisos. Tratar un resource como instrucción permite inyección. Suponer que HTTP implica confianza confunde canal y autoridad.', keyPoints: ['Cada capacidad tiene intención distinta.', 'El host controla exposición.', 'Transporte y permiso son dimensiones separadas.'], question: '¿Una tool puede devolver un resource?', answer: 'Puede devolver contenido o enlaces, según contrato. Aun así la invocación y la lectura conservan controles distintos.', transfer: 'Modela un servidor de manuales con dos resources, un prompt y una tool de búsqueda de solo lectura.', sources: ['mcp-specification', 'mcp-architecture', 'owasp-prompt-injection'] },
    reasoning: { activity: decisionActivity('Elige la capacidad MCP.', [['manual', 'Leer un manual por URI', ['resource', 'tool'], 'resource'], ['buscar', 'Buscar con parámetros', ['resource', 'tool'], 'tool'], ['plantilla', 'Iniciar revisión guiada', ['prompt', 'transport'], 'prompt']]), explanation: 'La intención del contrato define la capacidad; el transporte solo lleva mensajes.', hints: ['Una URI legible es resource.', 'Una operación parametrizada es tool.'] },
    debug: { title: 'Resource se invoca y todo lo demás se lee', expected: 'Cada tipo tiene un verbo propio.', observed: 'Las capacidades están mezcladas.', hints: ['Prueba los cuatro tipos.', 'Usa un mapa.', 'Añade fallback.'] },
  }),
];
