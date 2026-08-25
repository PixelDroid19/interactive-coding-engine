import { authoredLesson, contextBudgetActivity, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_03 = [
  authoredLesson({
    number: 17, module: 3, title: 'Prompt frente a contexto',
    summary: 'Distingue instrucciones de datos y evita que contenido recuperado cambie la política del sistema.',
    concepts: [['Prompt engineering', 'Diseño de instrucciones y ejemplos.'], ['Context engineering', 'Selección y organización de toda la información visible.']],
    requires: ['elegir-patron-api'], skill: 'separar-instruccion-contexto', mentalModel: 'Las instrucciones dicen qué hacer; el contexto aporta con qué datos hacerlo.',
    script: ['El prompt es una parte del contexto, no todo el contexto. También existen historial, documentos, estado, herramientas y resultados.', 'Separar instrucciones de datos permite aplicar prioridades y marcar contenido recuperado como no confiable.', 'El ejemplo construye dos campos distintos. El documento no se concatena como si fuera una orden del sistema.', 'Completa la separación con las entradas reales. Las pruebas cambiarán ambos textos.'],
    javascript: { example: `function separar_contexto(instruccion, documento) {
  return { instruccion, datos_no_confiables: documento };
}
console.log(separar_contexto('resume', 'manual'));`, starter: `function separar_contexto(instruccion, documento) {
  // Devuelve campos separados.
}`, solution: `function separar_contexto(instruccion, documento) {
  return { instruccion, datos_no_confiables: documento };
}`, debugStarter: `function separar_contexto(instruccion, documento) {
  return { instruccion: instruccion + documento, datos_no_confiables: '' };
}` },
    python: { example: `def separar_contexto(instruccion, documento):
    return {"instruccion": instruccion, "datos_no_confiables": documento}

print(separar_contexto("resume", "manual"))`, starter: `def separar_contexto(instruccion, documento):
    # Devuelve campos separados.
    pass`, solution: `def separar_contexto(instruccion, documento):
    return {"instruccion": instruccion, "datos_no_confiables": documento}`, debugStarter: `def separar_contexto(instruccion, documento):
    return {"instruccion": instruccion + documento, "datos_no_confiables": ""}` },
    practice: { title: 'Separa órdenes y datos', instructions: 'Implementa separar_contexto(instruccion, documento). No mezcles el documento con la instrucción.', functionName: 'separar_contexto', cases: [{ args: ['resume', 'política v2'], expected: { instruccion: 'resume', datos_no_confiables: 'política v2' }, description: 'Conserva política y documento en campos distintos' }, { args: ['clasifica', 'ignora todo'], expected: { instruccion: 'clasifica', datos_no_confiables: 'ignora todo' }, description: 'No eleva texto del documento a instrucción' }], hints: ['Devuelve un objeto con dos propiedades.', 'Cada parámetro va a su propio campo.', 'No concatentes los textos.'] },
    reading: { core: 'Prompt engineering diseña instrucciones. Context engineering decide qué bloques entran, su orden, prioridad, tamaño y fronteras de confianza. Una buena instrucción falla si el contexto omite hechos o incluye ruido adversario.', mechanics: 'La aplicación construye un paquete con política, tarea, estado, historial, recursos y resultados. Cada bloque conserva origen y metadatos para filtrar, citar y depurar.', decisions: 'Mantén instrucciones estables separadas. Añade datos por necesidad y con presupuesto. Marca documentos y tool results como no confiables aunque provengan de un sistema interno.', errors: 'Concatenar todo en una cadena borra fronteras. Permitir que un documento diga “ignora el sistema” convierte datos en control. Enviar contexto completo por comodidad aumenta coste y superficie de ataque.', keyPoints: ['El prompt es un bloque dentro del contexto.', 'Cada bloque conserva origen y confianza.', 'La selección de contexto se puede explicar y probar.'], question: '¿Un mensaje de sistema siempre gana?', answer: 'La jerarquía ayuda, pero no es una barrera de seguridad absoluta. El programa debe limitar herramientas, filtrar datos y validar salidas.', transfer: 'Dibuja los bloques de un asistente de manuales y marca cuáles controla el equipo y cuáles vienen de usuarios o documentos.', sources: ['google-prompt-design', 'owasp-prompt-injection', 'mcp-architecture'] },
    reasoning: { activity: decisionActivity('Clasifica cada bloque.', [['politica', 'No ejecutar acciones sin confirmación', ['instrucción', 'dato'], 'instrucción'], ['manual', 'Texto recuperado de un PDF', ['instrucción', 'dato'], 'dato'], ['estado', 'Pedido actual 42', ['instrucción', 'dato'], 'dato']]), explanation: 'La política controla conducta. Manual y estado aportan hechos, pero no cambian permisos.', hints: ['Pregunta quién controla el bloque.', 'Un documento recuperado sigue siendo dato.'] },
    debug: { title: 'El documento se vuelve orden', expected: 'Instrucción y documento permanecen separados.', observed: 'La función concatena todo en instrucción.', hints: ['Prueba un documento con una frase imperativa.', 'La concatenación borra la frontera.', 'Asigna cada parámetro a una propiedad.'] },
  }),
  authoredLesson({
    number: 18, module: 3, title: 'Fuentes y capas de contexto',
    summary: 'Ordena política, estado, historial, recursos y tool results por autoridad y utilidad.',
    concepts: [['Capa de contexto', 'Bloque con origen, prioridad y propósito definidos.'], ['Proveniencia', 'Registro de dónde salió un dato.']],
    requires: ['separar-instruccion-contexto'], skill: 'clasificar-fuentes-contexto', mentalModel: 'El contexto es una pila etiquetada, no un párrafo sin origen.',
    script: ['Una aplicación combina capas: política, tarea, estado, historial, documentos y resultados de herramientas.', 'La prioridad no significa que un bloque sea verdadero. Significa cómo debe interpretarse y qué puede modificar.', 'La función asigna prioridad numérica por tipo de fuente. Los documentos quedan por debajo de la política.', 'Completa las prioridades y conserva un valor por defecto para fuentes desconocidas.'],
    javascript: { example: `function prioridad_fuente(tipo) {
  const niveles = { politica: 3, estado: 2, documento: 1 };
  return niveles[tipo] ?? 0;
}
console.log(prioridad_fuente('politica'));`, starter: `function prioridad_fuente(tipo) {
  // politica 3, estado 2, documento 1, desconocida 0.
}`, solution: `function prioridad_fuente(tipo) {
  return ({ politica: 3, estado: 2, documento: 1 })[tipo] ?? 0;
}`, debugStarter: `function prioridad_fuente(tipo) {
  return tipo === 'documento' ? 3 : 1;
}` },
    python: { example: `def prioridad_fuente(tipo):
    niveles = {"politica": 3, "estado": 2, "documento": 1}
    return niveles.get(tipo, 0)

print(prioridad_fuente("politica"))`, starter: `def prioridad_fuente(tipo):
    # politica 3, estado 2, documento 1, desconocida 0.
    pass`, solution: `def prioridad_fuente(tipo):
    return {"politica": 3, "estado": 2, "documento": 1}.get(tipo, 0)`, debugStarter: `def prioridad_fuente(tipo):
    return 3 if tipo == "documento" else 1` },
    practice: { title: 'Etiqueta una fuente', instructions: 'Implementa prioridad_fuente(tipo) con los cuatro resultados indicados.', functionName: 'prioridad_fuente', cases: [{ args: ['politica'], expected: 3, description: 'Da máxima prioridad a la política del sistema' }, { args: ['documento'], expected: 1, description: 'Mantiene documentos como datos de menor autoridad' }, { args: ['externa'], expected: 0, description: 'No inventa autoridad para una fuente desconocida' }], hints: ['Un mapa evita condiciones repetidas.', 'Usa un valor por defecto.', 'Documento nunca debe recibir prioridad de política.'] },
    reading: { core: 'Las capas frecuentes son política del sistema, solicitud actual, estado de aplicación, historial, memoria recuperada, documentos y resultados de herramientas. Cada una necesita origen y fecha.', mechanics: 'El constructor normaliza bloques con id, tipo, contenido, tokens, confianza y metadatos. Luego filtra, ordena y renderiza según el contrato del proveedor.', decisions: 'La política tiene autoridad sobre conducta; el estado tiene actualidad operativa; documentos aportan evidencia. Si dos fuentes de datos chocan, registra el conflicto en vez de resolverlo por posición.', errors: 'Tratar la última capa como la verdadera abre ataques. Perder proveniencia impide citar y depurar. Guardar tool results sin caducidad reutiliza datos obsoletos.', keyPoints: ['Autoridad y verdad son dimensiones distintas.', 'Cada bloque conserva proveniencia.', 'Los conflictos se hacen visibles.'], question: '¿Un resultado de herramienta es confiable?', answer: 'Es más verificable que texto libre, pero puede fallar, estar obsoleto o contener datos adversarios. Valida esquema, permisos y vigencia.', transfer: 'Define metadatos mínimos para un bloque de documento y uno de estado de pedido.', sources: ['mcp-architecture', 'owasp-prompt-injection'] },
    reasoning: { activity: sequenceActivity('Ordena capas por autoridad de conducta.', [['politica', 'Política del sistema'], ['tarea', 'Solicitud actual'], ['estado', 'Estado de aplicación'], ['documento', 'Documento recuperado']]), explanation: 'El orden guía interpretación; no afirma que el primer bloque contenga todos los hechos correctos.', hints: ['La política controla permisos.', 'Un documento aporta evidencia, no órdenes.'] },
    debug: { title: 'El documento manda', expected: 'Política supera estado y documento.', observed: 'Documento recibe la prioridad más alta.', hints: ['Compara politica y documento.', 'El mapa está invertido.', 'Asigna tres, dos, uno y cero.'] },
  }),
  authoredLesson({
    number: 19, module: 3, title: 'Selección, filtros y presupuesto',
    summary: 'Selecciona bloques por prioridad sin exceder tokens y registra los descartes.',
    concepts: [['Filtro', 'Regla que elimina bloques incompatibles antes de ordenar.'], ['Selector', 'Política que elige qué bloques entran en el presupuesto.']],
    requires: ['clasificar-fuentes-contexto'], skill: 'seleccionar-contexto', mentalModel: 'Filtra primero, ordena después y corta por presupuesto al final.',
    script: ['Enviar todo evita decidir, pero traslada el problema al modelo y a la factura.', 'Un selector filtra permisos y vigencia, ordena por utilidad y añade bloques mientras caben.', 'El ejemplo suma costos en orden y detiene la selección antes de superar el presupuesto.', 'Completa la selección sin partir bloques. Debe funcionar con costos y presupuestos distintos.'],
    javascript: { example: `function seleccionar_bloques(costos, presupuesto) {
  const elegidos = [];
  let usados = 0;
  for (const costo of costos) {
    if (usados + costo <= presupuesto) { elegidos.push(costo); usados += costo; }
  }
  return elegidos;
}
console.log(seleccionar_bloques([4, 3, 5], 7));`, starter: `function seleccionar_bloques(costos, presupuesto) {
  // Conserva costos completos mientras quepan.
}`, solution: `function seleccionar_bloques(costos, presupuesto) {
  const elegidos = []; let usados = 0;
  for (const costo of costos) if (usados + costo <= presupuesto) { elegidos.push(costo); usados += costo; }
  return elegidos;
}`, debugStarter: `function seleccionar_bloques(costos, presupuesto) {
  return costos.filter(costo => costo <= presupuesto);
}` },
    python: { example: `def seleccionar_bloques(costos, presupuesto):
    elegidos, usados = [], 0
    for costo in costos:
        if usados + costo <= presupuesto:
            elegidos.append(costo)
            usados += costo
    return elegidos

print(seleccionar_bloques([4, 3, 5], 7))`, starter: `def seleccionar_bloques(costos, presupuesto):
    # Conserva costos completos mientras quepan.
    pass`, solution: `def seleccionar_bloques(costos, presupuesto):
    elegidos, usados = [], 0
    for costo in costos:
        if usados + costo <= presupuesto:
            elegidos.append(costo)
            usados += costo
    return elegidos`, debugStarter: `def seleccionar_bloques(costos, presupuesto):
    return [costo for costo in costos if costo <= presupuesto]` },
    practice: { title: 'Llena el presupuesto', instructions: 'Implementa seleccionar_bloques(costos, presupuesto). Mantén el orden y considera el total acumulado.', functionName: 'seleccionar_bloques', cases: [{ args: [[4, 3, 5], 7], expected: [4, 3], description: 'Llena el presupuesto con los primeros bloques que caben' }, { args: [[6, 2, 2], 4], expected: [2, 2], description: 'Descarta un bloque grande y aprovecha posteriores' }], hints: ['Necesitas un acumulador.', 'Cada bloque se compara con usados más costo.', 'Un bloque descartado no obliga a terminar.'] },
    reading: { core: 'La selección de contexto transforma un conjunto grande en bloques pertinentes que caben. Antes aplica filtros de usuario, fecha, idioma, tipo y permisos. Después ordena por relevancia y prioridad.', mechanics: 'El selector conserva una lista de incluidos y otra de descartados con razón. Esa traza permite explicar por qué una respuesta vio cierto documento.', decisions: 'No uses solo similitud. Reserva política y estado obligatorio; aplica filtros duros; luego usa ranking para documentos opcionales. Evita partir estructuras que necesiten permanecer juntas.', errors: 'Filtrar cada costo contra el presupuesto sin acumular deja que el total lo supere. Cortar al primer bloque grande desperdicia otros pequeños. Ocultar descartes vuelve opaco el sistema.', keyPoints: ['Los filtros de permisos ocurren antes del ranking.', 'El presupuesto es acumulativo.', 'Cada descarte conserva una razón.'], question: '¿Debo llenar siempre toda la ventana?', answer: 'No. Añade bloques que aporten información. Espacio libre puede reducir coste y ruido, además de reservar salida.', transfer: 'Define el orden de filtros para documentos de varios equipos y fechas.', sources: ['qdrant-filtering', 'anthropic-prompt-caching'] },
    reasoning: { activity: contextBudgetActivity('Elige bloques sin superar 10 tokens.', 10, [['politica', 'Política del sistema', 3, true], ['estado', 'Estado actual', 4, true], ['manual', 'Fragmento útil del manual', 3], ['historial', 'Historial antiguo', 5]], ['politica', 'estado', 'manual']), explanation: 'Los bloques obligatorios consumen siete tokens; el fragmento útil completa el presupuesto sin incluir historial antiguo.', hints: ['Conserva los dos obligatorios.', 'Quedan tres tokens para contenido opcional.'] },
    debug: { title: 'Cada bloque parece caber', expected: 'El total seleccionado no supera el presupuesto.', observed: 'Cada costo se compara solo contra el máximo.', hints: ['Suma los elegidos.', 'filter no conoce el acumulado.', 'Usa usados y actualízalo al incluir.'] },
  }),
  authoredLesson({
    number: 20, module: 3, title: 'Estado, historial y memoria',
    summary: 'Separa datos actuales, conversación y memoria recuperada para no confundir persistencia con verdad.',
    concepts: [['Estado', 'Datos actuales necesarios para continuar una tarea.'], ['Historial', 'Secuencia de interacciones anteriores.'], ['Memoria', 'Información seleccionada y recuperada para futuras llamadas.']],
    requires: ['seleccionar-contexto'], skill: 'gestionar-estado-memoria', mentalModel: 'El estado responde qué ocurre ahora; el historial qué ocurrió; la memoria qué conviene recuperar después.',
    script: ['Una conversación larga no es memoria automática. La aplicación decide qué guardar, por cuánto tiempo y cuándo recuperarlo.', 'Estado, historial y memoria tienen ciclos de vida distintos. Mezclarlos hace que datos viejos parezcan actuales.', 'El ejemplo actualiza el estado sin cambiar el objeto original. Así cada paso conserva una transición visible.', 'Completa la actualización inmutable. Las pruebas comprobarán que mantienes los campos anteriores y cambias solo el indicado.'],
    javascript: { example: `function actualizar_estado(estado, clave, valor) {
  return { ...estado, [clave]: valor };
}
console.log(actualizar_estado({ paso: 1 }, 'paso', 2));`, starter: `function actualizar_estado(estado, clave, valor) {
  // Devuelve un objeto nuevo con el cambio.
}`, solution: `function actualizar_estado(estado, clave, valor) {
  return { ...estado, [clave]: valor };
}`, debugStarter: `function actualizar_estado(estado, clave, valor) {
  return { [clave]: valor };
}` },
    python: { example: `def actualizar_estado(estado, clave, valor):
    return {**estado, clave: valor}

print(actualizar_estado({"paso": 1}, "paso", 2))`, starter: `def actualizar_estado(estado, clave, valor):
    # Devuelve un diccionario nuevo con el cambio.
    pass`, solution: `def actualizar_estado(estado, clave, valor):
    return {**estado, clave: valor}`, debugStarter: `def actualizar_estado(estado, clave, valor):
    return {clave: valor}` },
    practice: { title: 'Actualiza estado sin perder datos', instructions: 'Implementa actualizar_estado(estado, clave, valor). Conserva campos existentes y devuelve un objeto nuevo.', functionName: 'actualizar_estado', cases: [{ args: [{ paso: 1, usuario: 'Ana' }, 'paso', 2], expected: { paso: 2, usuario: 'Ana' }, description: 'Cambia un campo y conserva el resto' }, { args: [{ activo: true }, 'tema', 'oscuro'], expected: { activo: true, tema: 'oscuro' }, description: 'Añade un campo sin borrar estado' }], hints: ['Copia el estado antes del cambio.', 'La clave es dinámica.', 'No devuelvas solo el campo nuevo.'] },
    reading: { core: 'El estado contiene valores actuales como paso, usuario o selección. El historial registra mensajes o eventos. La memoria resume o indexa información para recuperarla más tarde. Cada capa necesita alcance y caducidad.', mechanics: 'La aplicación guarda estado en estructuras propias, selecciona historial reciente y recupera memorias pertinentes. El modelo recibe una vista; no posee esos datos fuera de la llamada.', decisions: 'Guarda lo mínimo necesario. Solicita consentimiento para preferencias duraderas. Separa memoria del usuario, del proyecto y de la sesión. Permite inspeccionar y borrar.', errors: 'Reenviar todo el historial aumenta coste y conserva errores antiguos. Tratar una memoria resumida como hecho actual ignora cambios. Guardar datos sensibles por defecto crea riesgo innecesario.', keyPoints: ['El modelo no administra memoria por sí solo.', 'Cada dato tiene alcance y caducidad.', 'La memoria debe poder inspeccionarse y borrarse.'], question: '¿LocalStorage es una memoria segura?', answer: 'No para secretos ni datos sensibles. Cualquier script del mismo origen puede leerlo. El almacenamiento depende del riesgo y del producto.', transfer: 'Clasifica cinco datos de un asistente como estado, historial, memoria o dato que no guardarías.', sources: ['mcp-architecture', 'owasp-genai-top10'] },
    reasoning: { activity: decisionActivity('Clasifica cada dato.', [['paso', 'Paso actual de un formulario', ['estado', 'historial', 'memoria'], 'estado'], ['mensaje', 'Mensaje enviado ayer', ['estado', 'historial', 'memoria'], 'historial'], ['preferencia', 'Idioma elegido con consentimiento', ['estado', 'historial', 'memoria'], 'memoria']]), explanation: 'La clasificación define ciclo de vida y tratamiento. Una preferencia duradera no debe inferirse sin consentimiento.', hints: ['Pregunta si el dato describe ahora.', 'Historial conserva secuencia.'] },
    debug: { title: 'Actualizar borra el resto', expected: 'El objeto nuevo conserva campos previos.', observed: 'Solo queda la clave actualizada.', hints: ['Comprueba un estado con dos campos.', 'Falta copiar estado.', 'Combina la copia con la propiedad dinámica.'] },
  }),
  authoredLesson({
    number: 21, module: 3, title: 'Compactación y contexto largo',
    summary: 'Resume historial con límites explícitos y conserva hechos que todavía afectan la tarea.',
    concepts: [['Compactación', 'Transformación de muchos eventos en una representación más pequeña.'], ['Contexto largo', 'Ventana amplia que sigue necesitando selección y evaluación.']],
    requires: ['gestionar-estado-memoria'], skill: 'compactar-contexto', mentalModel: 'Compactar es crear una nueva fuente con pérdidas conocidas, no esconder un corte.',
    script: ['Cuando el historial crece, la aplicación puede descartar, resumir o recuperar. Cada opción pierde información distinta.', 'Un resumen debe conservar decisiones, hechos vigentes, pendientes y fuentes. También registra hasta qué punto cubre el historial.', 'El ejemplo conserva los últimos elementos como una compactación determinista pequeña.', 'Completa la función para cualquier límite. Un límite cero devuelve una lista vacía.'],
    javascript: { example: `function compactar(historial, maximo) {
  return maximo <= 0 ? [] : historial.slice(-maximo);
}
console.log(compactar(['a', 'b', 'c'], 2));`, starter: `function compactar(historial, maximo) {
  // Conserva los últimos maximo elementos.
}`, solution: `function compactar(historial, maximo) {
  return maximo <= 0 ? [] : historial.slice(-maximo);
}`, debugStarter: `function compactar(historial, maximo) {
  return historial.slice(0, maximo);
}` },
    python: { example: `def compactar(historial, maximo):
    return [] if maximo <= 0 else historial[-maximo:]

print(compactar(["a", "b", "c"], 2))`, starter: `def compactar(historial, maximo):
    # Conserva los últimos maximo elementos.
    pass`, solution: `def compactar(historial, maximo):
    return [] if maximo <= 0 else historial[-maximo:]`, debugStarter: `def compactar(historial, maximo):
    return historial[:maximo]` },
    practice: { title: 'Conserva lo reciente', instructions: 'Implementa compactar(historial, maximo). Devuelve una lista nueva con los últimos elementos.', functionName: 'compactar', cases: [{ args: [['a', 'b', 'c'], 2], expected: ['b', 'c'], description: 'Conserva los dos eventos más recientes' }, { args: [['a'], 0], expected: [], description: 'Respeta un presupuesto vacío' }], hints: ['El final de la lista contiene lo reciente.', 'Un máximo cero necesita un caso explícito.', 'Devuelve una lista nueva.'] },
    reading: { core: 'Compactar reduce tokens mediante una ventana reciente, un resumen, extracción de hechos o almacenamiento externo. Toda compactación tiene pérdidas y debe declararlas.', mechanics: 'Una estrategia guarda un checkpoint con rango temporal, hechos, decisiones, pendientes y referencias. Luego añade eventos recientes. Si el resumen cambia, se puede reconstruir desde la fuente.', decisions: 'Usa ventana reciente para conversaciones locales, resumen para continuidad y recuperación para conocimiento disperso. Contextos largos ayudan, pero no eliminan ruido ni coste.', errors: 'Un resumen puede omitir una negación o conservar un hecho obsoleto. Resumir resúmenes acumula distorsión. Cortar sin indicar qué falta dificulta responder “no sé”.', keyPoints: ['La compactación tiene proveniencia y rango.', 'Conserva pendientes y decisiones, no solo tema.', 'El contexto largo también se selecciona.'], question: '¿Puedo resumir cada mensaje inmediatamente?', answer: 'Puedes, pero introduces pérdida temprano. Conserva la fuente durante el tiempo necesario y evalúa si el resumen mantiene hechos críticos.', transfer: 'Diseña el esquema de un checkpoint con cuatro campos y un enlace al historial original.', sources: ['anthropic-prompt-caching', 'mcp-architecture'] },
    reasoning: { activity: sequenceActivity('Ordena una compactación trazable.', [['fuente', 'Conservar historial fuente'], ['extraer', 'Extraer hechos y pendientes'], ['rango', 'Registrar rango cubierto'], ['reciente', 'Añadir eventos recientes'], ['evaluar', 'Comprobar casos críticos']]), explanation: 'La traza permite reconstruir y evaluar pérdidas. Los eventos recientes complementan el resumen.', hints: ['No destruyas la fuente primero.', 'La evaluación ocurre sobre el contexto resultante.'] },
    debug: { title: 'Conserva el inicio, no lo reciente', expected: 'Se mantienen los últimos elementos.', observed: 'La función toma los primeros.', hints: ['Usa a, b, c y máximo dos.', 'El índice inicial no representa recencia.', 'Corta desde el final.'] },
  }),
  authoredLesson({
    number: 22, module: 3, title: 'Aislamiento, seguridad y fallos de contexto',
    summary: 'Detecta instrucciones incrustadas en datos y limita el contexto compartido entre usuarios y agentes.',
    concepts: [['Aislamiento', 'Separación de datos, estado y permisos entre alcances.'], ['Prompt injection indirecta', 'Instrucción adversaria contenida en un documento o resultado externo.']],
    requires: ['compactar-contexto'], skill: 'aislar-contexto', mentalModel: 'Cada usuario, tarea y agente tiene un contenedor; cruzar la frontera requiere una regla explícita.',
    script: ['Un fallo de contexto puede mezclar usuarios, reutilizar estado viejo o elevar una instrucción encontrada en un documento.', 'El aislamiento combina ids de alcance, filtros de permisos y límites de herramientas. El texto del documento nunca concede autoridad.', 'La función permite un bloque solo si pertenece al usuario y no pretende modificar instrucciones.', 'Completa las dos comprobaciones. Un origen correcto con contenido adversario todavía debe fallar.'],
    javascript: { example: `function contexto_permitido(mismo_usuario, contiene_orden) {
  return mismo_usuario && !contiene_orden;
}
console.log(contexto_permitido(true, false));`, starter: `function contexto_permitido(mismo_usuario, contiene_orden) {
  // Exige mismo usuario y ausencia de órdenes incrustadas.
}`, solution: `function contexto_permitido(mismo_usuario, contiene_orden) {
  return mismo_usuario && !contiene_orden;
}`, debugStarter: `function contexto_permitido(mismo_usuario, contiene_orden) {
  return mismo_usuario || !contiene_orden;
}` },
    python: { example: `def contexto_permitido(mismo_usuario, contiene_orden):
    return mismo_usuario and not contiene_orden

print(contexto_permitido(True, False))`, starter: `def contexto_permitido(mismo_usuario, contiene_orden):
    # Exige mismo usuario y ausencia de órdenes incrustadas.
    pass`, solution: `def contexto_permitido(mismo_usuario, contiene_orden):
    return mismo_usuario and not contiene_orden`, debugStarter: `def contexto_permitido(mismo_usuario, contiene_orden):
    return mismo_usuario or not contiene_orden` },
    practice: { title: 'Protege una frontera', instructions: 'Implementa contexto_permitido. Ambas condiciones de seguridad deben cumplirse.', functionName: 'contexto_permitido', cases: [{ args: [true, false], expected: true, description: 'Acepta un bloque del alcance correcto sin órdenes' }, { args: [false, false], expected: false, description: 'Rechaza datos de otro usuario' }, { args: [true, true], expected: false, description: 'Rechaza una instrucción incrustada' }], hints: ['Las condiciones se combinan con y.', 'Niega contiene_orden.', 'Prueba cada fallo por separado.'] },
    reading: { core: 'El aislamiento impide que datos o permisos crucen usuarios, sesiones, proyectos o agentes. La prompt injection indirecta aparece cuando contenido externo intenta cambiar instrucciones o activar herramientas.', mechanics: 'Antes de recuperar, el sistema filtra por tenant y permisos. Después etiqueta contenido, limita tools y valida salidas. Las acciones sensibles requieren confirmación fuera del modelo.', decisions: 'Usa índices y caches separados o filtros obligatorios probados. Da a cada agente solo las herramientas necesarias. Mantén los secretos fuera del contexto.', errors: 'Confiar en que el modelo detectará toda inyección no es suficiente. Un filtro de texto puede evadirse. Mezclar memoria global por comodidad puede exponer datos entre usuarios.', keyPoints: ['El aislamiento se aplica antes de recuperar.', 'Los datos no cambian permisos.', 'Las herramientas respetan mínimo privilegio.'], question: '¿Basta con borrar la frase “ignora instrucciones”?', answer: 'No. Los ataques pueden expresarse de muchas formas. Reduce autoridad de datos externos, limita capacidades y valida cada acción.', transfer: 'Enumera tres fronteras de un agente de soporte: usuario, sistema externo y herramienta. Define qué cruza cada una.', sources: ['owasp-prompt-injection', 'owasp-genai-top10', 'mcp-architecture'] },
    reasoning: { activity: flowActivity('Conecta un bloque externo hasta su uso seguro.', [['origen', 'Comprobar alcance', 'start'], ['etiquetar', 'Etiquetar como no confiable', 'process'], ['seleccionar', 'Seleccionar contenido', 'process'], ['generar', 'Generar propuesta', 'process'], ['autorizar', 'Autorizar acción fuera del modelo', 'decision'], ['fin', 'Usar resultado', 'end']], [['origen', 'etiquetar'], ['etiquetar', 'seleccionar'], ['seleccionar', 'generar'], ['generar', 'autorizar'], ['autorizar', 'fin', 'permitida']]), explanation: 'El contenido puede informar una propuesta, pero la autorización ocurre en una frontera controlada por código.', hints: ['El alcance se comprueba antes de leer.', 'La autorización está después de generar.'] },
    debug: { title: 'Una condición segura parece suficiente', expected: 'Alcance correcto y contenido limpio son obligatorios.', observed: 'La función acepta si cualquiera se cumple.', hints: ['Prueba mismo usuario con orden.', 'or acepta un fallo.', 'Usa and con la negación.'] },
  }),
];
