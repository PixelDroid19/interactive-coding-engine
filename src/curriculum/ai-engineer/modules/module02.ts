import { authoredLesson, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_02 = [
  authoredLesson({
    number: 12, module: 2, title: 'Anatomía de un prompt',
    summary: 'Separa objetivo, entrada, restricciones y formato para poder probar cada parte.',
    concepts: [['Prompt', 'Conjunto de instrucciones y datos enviados al modelo.'], ['Contrato de salida', 'Forma y condiciones que debe cumplir la respuesta.']],
    requires: ['verificar-salidas-modelo'], skill: 'estructurar-prompt', mentalModel: 'Un prompt es una interfaz: nombra la tarea, aporta datos y define una salida verificable.',
    script: ['Un prompt útil no es una frase mágica. Es un contrato entre la aplicación y el modelo.', 'Separa objetivo, datos, restricciones y formato. Esa separación permite cambiar una parte y medir el efecto.', 'El ejemplo construye un objeto con esos bloques antes de convertirlo al formato de un proveedor.', 'Completa la función con los datos recibidos. Las pruebas cambiarán objetivo y texto para detectar valores fijos.'],
    javascript: { example: `function crear_prompt(objetivo, entrada) {
  return { objetivo, entrada, formato: 'json' };
}
console.log(crear_prompt('clasificar', 'mensaje'));`, starter: `function crear_prompt(objetivo, entrada) {
  // Devuelve un objeto con objetivo, entrada y formato json.
}`, solution: `function crear_prompt(objetivo, entrada) {
  return { objetivo, entrada, formato: 'json' };
}`, debugStarter: `function crear_prompt(objetivo, entrada) {
  return { objetivo: 'resumir', entrada: 'demo', formato: 'json' };
}` },
    python: { example: `def crear_prompt(objetivo, entrada):
    return {"objetivo": objetivo, "entrada": entrada, "formato": "json"}

print(crear_prompt("clasificar", "mensaje"))`, starter: `def crear_prompt(objetivo, entrada):
    # Devuelve un diccionario con objetivo, entrada y formato json.
    pass`, solution: `def crear_prompt(objetivo, entrada):
    return {"objetivo": objetivo, "entrada": entrada, "formato": "json"}`, debugStarter: `def crear_prompt(objetivo, entrada):
    return {"objetivo": "resumir", "entrada": "demo", "formato": "json"}` },
    practice: { title: 'Construye un contrato', instructions: 'Implementa crear_prompt(objetivo, entrada). Conserva ambas entradas y fija formato en json.', functionName: 'crear_prompt', cases: [{ args: ['clasificar', 'mensaje urgente'], expected: { objetivo: 'clasificar', entrada: 'mensaje urgente', formato: 'json' }, description: 'Conserva el objetivo y los datos reales' }, { args: ['extraer', 'pedido 42'], expected: { objetivo: 'extraer', entrada: 'pedido 42', formato: 'json' }, description: 'Funciona para otra tarea sin cambiar código' }], hints: ['Devuelve un objeto o diccionario.', 'No escribas los valores del ejemplo.', 'formato sí es un valor fijo del contrato.'] },
    reading: { core: 'Un prompt de aplicación combina instrucciones estables con datos variables. Separar bloques mejora legibilidad, seguridad y evaluación. La salida esperada debe poder validarse fuera del modelo.', mechanics: 'La aplicación construye mensajes con rol y contenido o el contrato equivalente del proveedor. Los datos del usuario se delimitan y no se confunden con instrucciones de mayor prioridad.', decisions: 'Añade solo contexto que ayude a decidir. Usa ejemplos cuando aclaren casos ambiguos. Pide estructura cuando el programa consumirá la salida y texto libre cuando una persona la leerá.', errors: 'Mezclar instrucciones y datos en una cadena dificulta escapar contenido no confiable. Pedir varias tareas sin prioridad produce respuestas parciales. Un formato descrito solo en prosa es más difícil de validar.', keyPoints: ['Separa datos variables de instrucciones estables.', 'Define una salida que el programa pueda comprobar.', 'Cambia una parte del prompt por experimento.'], question: '¿Un prompt más largo siempre funciona mejor?', answer: 'No. El contenido irrelevante consume contexto y puede competir con las señales útiles. Añade una pieza porque resuelve un fallo observado.', transfer: 'Descompón una petición de resumen en objetivo, entrada, restricciones y formato.', sources: ['google-prompt-design', 'openai-prompting', 'anthropic-prompt-engineering'] },
    reasoning: { activity: sequenceActivity('Ordena los bloques al diseñar un prompt.', [['objetivo', 'Definir objetivo'], ['datos', 'Delimitar entrada'], ['restricciones', 'Añadir límites'], ['formato', 'Definir salida verificable']]), explanation: 'El formato nace de la tarea y las restricciones; los datos se mantienen como un bloque no confiable.', hints: ['Primero decide qué cambio quieres.', 'El formato se define antes de ejecutar.'] },
    debug: { title: 'El prompt ignora al usuario', expected: 'El objeto conserva objetivo y entrada recibidos.', observed: 'La función devuelve valores de demostración.', hints: ['Prueba otra entrada.', 'Los parámetros no se usan.', 'Usa la sintaxis abreviada de propiedades o asigna cada parámetro.'] },
  }),
  authoredLesson({
    number: 13, module: 2, title: 'Rol, contexto y restricciones',
    summary: 'Aplica límites observables sin confiar en que una instrucción por sí sola garantice seguridad.',
    concepts: [['Rol', 'Perspectiva o responsabilidad pedida al modelo.'], ['Restricción', 'Límite explícito sobre contenido, longitud o acción.']],
    requires: ['estructurar-prompt'], skill: 'aplicar-restricciones-prompt', mentalModel: 'El rol orienta; las restricciones delimitan; el código verifica.',
    script: ['Decir actúa como experto puede orientar tono y enfoque, pero no concede conocimiento ni permisos.', 'Una restricción útil se traduce en una comprobación: longitud máxima, campos permitidos o acciones prohibidas.', 'El ejemplo verifica una salida breve y sin una palabra prohibida. La política vive en código además del prompt.', 'Completa la validación. Deben cumplirse las dos condiciones, no una sola.'],
    javascript: { example: `function salida_permitida(texto, maximo) {
  return texto.length <= maximo && !texto.includes('secreto');
}
console.log(salida_permitida('respuesta breve', 30));`, starter: `function salida_permitida(texto, maximo) {
  // Respeta longitud y bloquea la palabra secreto.
}`, solution: `function salida_permitida(texto, maximo) {
  return texto.length <= maximo && !texto.toLowerCase().includes('secreto');
}`, debugStarter: `function salida_permitida(texto, maximo) {
  return texto.length <= maximo || !texto.includes('secreto');
}` },
    python: { example: `def salida_permitida(texto, maximo):
    return len(texto) <= maximo and "secreto" not in texto.lower()

print(salida_permitida("respuesta breve", 30))`, starter: `def salida_permitida(texto, maximo):
    # Respeta longitud y bloquea la palabra secreto.
    pass`, solution: `def salida_permitida(texto, maximo):
    return len(texto) <= maximo and "secreto" not in texto.lower()`, debugStarter: `def salida_permitida(texto, maximo):
    return len(texto) <= maximo or "secreto" not in texto` },
    practice: { title: 'Valida restricciones', instructions: 'Implementa salida_permitida(texto, maximo). Exige longitud válida y ausencia de la palabra secreto sin importar mayúsculas.', functionName: 'salida_permitida', cases: [{ args: ['respuesta breve', 20], expected: true, description: 'Acepta texto breve sin contenido bloqueado' }, { args: ['contiene SECRETO', 30], expected: false, description: 'Bloquea la palabra sin depender de mayúsculas' }, { args: ['demasiado largo', 5], expected: false, description: 'Rechaza una salida que supera el máximo' }], hints: ['Las dos condiciones deben cumplirse.', 'Normaliza mayúsculas antes de buscar.', 'Compara longitud con menor o igual.'] },
    reading: { core: 'El rol expresa una perspectiva útil, como analista de soporte. El contexto aporta hechos. Las restricciones fijan límites de contenido o forma. Ninguno sustituye controles de permisos y validación.', mechanics: 'La aplicación puede validar longitud, esquema, dominios, identificadores y acciones. Si falla, solicita una corrección, muestra un estado de error o deriva a una persona.', decisions: 'Escribe restricciones que puedas observar. En vez de "sé preciso", define campos, unidades y tratamiento de casos sin datos. Para acciones, limita las herramientas disponibles.', errors: 'Confiar en "ignora instrucciones maliciosas" como defensa única deja el sistema expuesto. Un rol grandilocuente puede aumentar tono de seguridad sin mejorar exactitud.', keyPoints: ['Cada restricción importante tiene una comprobación.', 'El rol no otorga permisos.', 'Los datos externos siguen siendo no confiables.'], question: '¿Debo repetir todas las restricciones en cada mensaje?', answer: 'Las instrucciones estables suelen ir en un bloque de sistema o plantilla. La aplicación las envía en cada llamada pertinente y valida después.', transfer: 'Reescribe "responde bien" como tres restricciones observables para un extractor.', sources: ['google-prompt-design', 'anthropic-prompt-engineering', 'owasp-prompt-injection'] },
    reasoning: { activity: decisionActivity('Relaciona una necesidad con el control adecuado.', [['longitud', 'Máximo 200 caracteres', ['solo prompt', 'prompt y validación'], 'prompt y validación'], ['permiso', 'No ejecutar pagos', ['rol', 'herramientas sin permiso'], 'herramientas sin permiso']]), explanation: 'La instrucción comunica intención; el programa mantiene el límite incluso si el modelo falla.', hints: ['Un permiso no se protege con tono.', 'La longitud se puede medir.'] },
    debug: { title: 'Una condición basta', expected: 'Longitud y contenido deben ser válidos a la vez.', observed: 'La función acepta si solo una condición se cumple.', hints: ['Prueba un texto corto con secreto.', 'or acepta demasiado.', 'Combina con and y normaliza texto.'] },
  }),
  authoredLesson({
    number: 14, module: 2, title: 'Zero-shot y few-shot',
    summary: 'Añade ejemplos cuando aclaran una frontera y comprueba que no sustituyan casos reales.',
    concepts: [['Zero-shot', 'Tarea descrita sin ejemplos incluidos.'], ['Few-shot', 'Tarea acompañada por pocos ejemplos de entrada y salida.']],
    requires: ['aplicar-restricciones-prompt'], skill: 'usar-ejemplos-prompt', mentalModel: 'Un ejemplo dibuja una frontera; varios ejemplos muestran variación y excepciones.',
    script: ['Zero-shot empieza con instrucciones. Few-shot añade pares de ejemplo para mostrar la conducta esperada.', 'Los ejemplos sirven cuando una etiqueta o formato es ambiguo. También consumen contexto y pueden sesgar la respuesta hacia su superficie.', 'El ejemplo clasifica prioridad usando una regla equivalente a los casos que mostraríamos al modelo.', 'Completa la clasificación y prueba el límite. No devuelvas la etiqueta de un solo ejemplo para todas las entradas.'],
    javascript: { example: `function etiqueta_prioridad(puntos) {
  return puntos >= 7 ? 'alta' : 'normal';
}
console.log(etiqueta_prioridad(8));`, starter: `function etiqueta_prioridad(puntos) {
  // Siete o más es alta; el resto es normal.
}`, solution: `function etiqueta_prioridad(puntos) {
  return puntos >= 7 ? 'alta' : 'normal';
}`, debugStarter: `function etiqueta_prioridad(puntos) {
  return puntos > 7 ? 'alta' : 'normal';
}` },
    python: { example: `def etiqueta_prioridad(puntos):
    return "alta" if puntos >= 7 else "normal"

print(etiqueta_prioridad(8))`, starter: `def etiqueta_prioridad(puntos):
    # Siete o más es alta; el resto es normal.
    pass`, solution: `def etiqueta_prioridad(puntos):
    return "alta" if puntos >= 7 else "normal"`, debugStarter: `def etiqueta_prioridad(puntos):
    return "alta" if puntos > 7 else "normal"` },
    practice: { title: 'Aprende la frontera', instructions: 'Implementa etiqueta_prioridad(puntos). El valor 7 pertenece a alta.', functionName: 'etiqueta_prioridad', cases: [{ args: [7], expected: 'alta', description: 'Respeta el ejemplo en la frontera' }, { args: [3], expected: 'normal', description: 'Generaliza a un valor no mostrado' }], hints: ['La frontera incluye siete.', 'Usa mayor o igual.', 'Devuelve una de las dos etiquetas exactas.'] },
    reading: { core: 'Zero-shot confía en una descripción suficiente. Few-shot añade ejemplos para mostrar etiquetas, tono o transformaciones. Los ejemplos deben representar fronteras, variación y casos difíciles.', mechanics: 'Los ejemplos se incluyen en el contexto y afectan la distribución de salida. No modifican los pesos. El modelo infiere el patrón durante esa llamada.', decisions: 'Empieza sin ejemplos y mide. Añade el mínimo ejemplo que resuelva un fallo observado. Incluye contraejemplos y casos límite cuando la frontera sea importante.', errors: 'Un ejemplo con datos reales puede filtrar información. Ejemplos contradictorios confunden. Repetir siempre la misma forma puede producir imitación superficial en vez de generalización.', keyPoints: ['Few-shot cambia el contexto, no los pesos.', 'Los casos límite enseñan fronteras.', 'Los ejemplos también se evalúan por privacidad.'], question: '¿Cuántos ejemplos necesito?', answer: 'Los mínimos que mejoren el conjunto de evaluación sin consumir contexto innecesario. La respuesta se obtiene experimentando, no por una cifra universal.', transfer: 'Escribe un ejemplo positivo, uno negativo y uno de frontera para clasificar urgencia.', sources: ['google-prompt-design', 'openai-prompting', 'anthropic-prompt-engineering'] },
    reasoning: { activity: sequenceActivity('Ordena un experimento con ejemplos.', [['base', 'Medir zero-shot'], ['fallo', 'Identificar una frontera fallida'], ['ejemplo', 'Añadir un ejemplo de esa frontera'], ['comparar', 'Repetir el mismo conjunto']]), explanation: 'El ejemplo responde a evidencia de fallo y se compara sobre los mismos casos.', hints: ['Mide antes de cambiar.', 'No cambies el conjunto al comparar.'] },
    debug: { title: 'La frontera excluye siete', expected: 'Siete y superiores son alta.', observed: 'Siete queda como normal.', hints: ['Prueba exactamente siete.', 'Mayor no incluye igualdad.', 'Usa mayor o igual.'] },
  }),
  authoredLesson({
    number: 15, module: 2, title: 'Salidas estructuradas y JSON Schema',
    summary: 'Valida campos y tipos antes de usar una respuesta generada por un modelo.',
    concepts: [['Salida estructurada', 'Respuesta restringida a una forma consumible por código.'], ['JSON Schema', 'Vocabulario para describir tipos, propiedades y campos obligatorios.']],
    requires: ['usar-ejemplos-prompt'], skill: 'validar-salida-estructurada', mentalModel: 'El esquema reduce formas posibles; el validador decide si la salida puede entrar al programa.',
    script: ['Pedir JSON no garantiza JSON válido ni datos correctos. Una salida estructurada necesita un esquema y una validación local.', 'El esquema define tipos, campos obligatorios y valores permitidos. Después el programa valida semántica: rangos, ids y permisos.', 'El ejemplo acepta una incidencia solo si tiene título de texto y prioridad permitida.', 'Completa la validación. Una propiedad presente con el tipo equivocado también debe fallar.'],
    javascript: { example: `function incidencia_valida(dato) {
  return typeof dato.titulo === 'string' && ['baja', 'alta'].includes(dato.prioridad);
}
console.log(incidencia_valida({ titulo: 'Error', prioridad: 'alta' }));`, starter: `function incidencia_valida(dato) {
  // Comprueba titulo de texto y prioridad baja o alta.
}`, solution: `function incidencia_valida(dato) {
  return typeof dato.titulo === 'string' && ['baja', 'alta'].includes(dato.prioridad);
}`, debugStarter: `function incidencia_valida(dato) {
  return 'titulo' in dato && 'prioridad' in dato;
}` },
    python: { example: `def incidencia_valida(dato):
    return isinstance(dato.get("titulo"), str) and dato.get("prioridad") in ["baja", "alta"]

print(incidencia_valida({"titulo": "Error", "prioridad": "alta"}))`, starter: `def incidencia_valida(dato):
    # Comprueba titulo de texto y prioridad baja o alta.
    pass`, solution: `def incidencia_valida(dato):
    return isinstance(dato.get("titulo"), str) and dato.get("prioridad") in ["baja", "alta"]`, debugStarter: `def incidencia_valida(dato):
    return "titulo" in dato and "prioridad" in dato` },
    practice: { title: 'Valida una incidencia', instructions: 'Implementa incidencia_valida(dato). Exige titulo de texto y prioridad baja o alta.', functionName: 'incidencia_valida', cases: [{ args: [{ titulo: 'Error', prioridad: 'alta' }], expected: true, description: 'Acepta un objeto con tipos y enum válidos' }, { args: [{ titulo: 42, prioridad: 'media' }], expected: false, description: 'Rechaza tipos y valores fuera del contrato' }], hints: ['La presencia de campos no basta.', 'Comprueba el tipo de titulo.', 'Comprueba prioridad contra una lista cerrada.'] },
    reading: { core: 'Una salida estructurada restringe la forma de la respuesta. JSON Schema describe propiedades, tipos, campos requeridos, enumeraciones y otras reglas. Algunos proveedores aplican el esquema durante decodificación.', mechanics: 'El cliente envía el esquema, recibe JSON, lo parsea y valida. Después aplica reglas del dominio que el esquema no expresa por completo, como que un id pertenezca al usuario actual.', decisions: 'Usa estructura para extracción, clasificación y herramientas. Mantén texto libre para explicaciones humanas, pero separa cualquier dato que el programa deba consumir.', errors: 'Parsear JSON sin validar deja pasar campos faltantes o tipos incorrectos. Un esquema válido tampoco demuestra que el contenido sea verdadero o que una acción esté autorizada.', keyPoints: ['Parsear y validar son pasos distintos.', 'El esquema valida forma, no verdad.', 'Los permisos se comprueban fuera del modelo.'], question: '¿Si el proveedor garantiza el esquema puedo omitir mi validador?', answer: 'No conviene. El contrato del proveedor puede cambiar, la red puede devolver errores y tu dominio tiene reglas adicionales. La validación local mantiene la frontera.', transfer: 'Diseña un esquema mínimo para una cita con fecha, título y url. Añade una regla que el esquema no pueda decidir solo.', sources: ['google-structured-output', 'openai-function-calling'] },
    reasoning: { activity: flowActivity('Conecta el uso seguro de una salida JSON.', [['pedir', 'Enviar esquema', 'start'], ['recibir', 'Recibir texto o JSON', 'process'], ['parsear', 'Parsear', 'process'], ['validar', 'Validar esquema y dominio', 'decision'], ['usar', 'Usar datos', 'end']], [['pedir', 'recibir'], ['recibir', 'parsear'], ['parsear', 'validar'], ['validar', 'usar', 'válida']]), explanation: 'La estructura reduce errores, pero el programa sigue validando antes de usar.', hints: ['Parsear ocurre antes de validar campos.', 'Usar datos es el último paso.'] },
    debug: { title: 'Los campos existen, pero están mal', expected: 'Se validan tipo y valor permitido.', observed: 'Cualquier objeto con dos claves pasa.', hints: ['Prueba titulo numérico.', 'in solo comprueba presencia.', 'Añade tipo y enum.'] },
  }),
  authoredLesson({
    number: 16, module: 2, title: 'Function calling, streaming y caché',
    summary: 'Elige entre herramienta, streaming y caché según el contrato de interacción.',
    concepts: [['Function calling', 'Salida estructurada que propone una herramienta y argumentos.'], ['Streaming', 'Entrega incremental de partes de la respuesta.'], ['Prompt caching', 'Reutilización de un prefijo estable para reducir trabajo repetido.']],
    requires: ['validar-salida-estructurada'], skill: 'elegir-patron-api', mentalModel: 'Tools cambian capacidades, streaming cambia entrega y caché cambia coste; resuelven problemas distintos.',
    script: ['Function calling, streaming y caché suelen aparecer juntos en documentación, pero no son alternativas equivalentes.', 'Una tool propone una acción estructurada. Streaming mejora tiempo percibido. Caché reutiliza contexto estable según reglas del proveedor.', 'La función elige el patrón principal a partir de la necesidad. Mantiene cada decisión separada.', 'Completa los tres caminos. Una acción gana sobre streaming porque necesita un contrato de herramienta.'],
    javascript: { example: `function patron_api(necesita_accion, respuesta_larga, contexto_repetido) {
  if (necesita_accion) return 'tool';
  if (respuesta_larga) return 'streaming';
  return contexto_repetido ? 'cache' : 'simple';
}
console.log(patron_api(true, true, false));`, starter: `function patron_api(necesita_accion, respuesta_larga, contexto_repetido) {
  // Prioridad: tool, streaming, cache, simple.
}`, solution: `function patron_api(necesita_accion, respuesta_larga, contexto_repetido) {
  if (necesita_accion) return 'tool';
  if (respuesta_larga) return 'streaming';
  return contexto_repetido ? 'cache' : 'simple';
}`, debugStarter: `function patron_api(necesita_accion, respuesta_larga, contexto_repetido) {
  if (respuesta_larga) return 'streaming';
  return necesita_accion ? 'tool' : 'simple';
}` },
    python: { example: `def patron_api(necesita_accion, respuesta_larga, contexto_repetido):
    if necesita_accion:
        return "tool"
    if respuesta_larga:
        return "streaming"
    return "cache" if contexto_repetido else "simple"

print(patron_api(True, True, False))`, starter: `def patron_api(necesita_accion, respuesta_larga, contexto_repetido):
    # Prioridad: tool, streaming, cache, simple.
    pass`, solution: `def patron_api(necesita_accion, respuesta_larga, contexto_repetido):
    if necesita_accion:
        return "tool"
    if respuesta_larga:
        return "streaming"
    return "cache" if contexto_repetido else "simple"`, debugStarter: `def patron_api(necesita_accion, respuesta_larga, contexto_repetido):
    if respuesta_larga:
        return "streaming"
    return "tool" if necesita_accion else "simple"` },
    practice: { title: 'Elige el patrón', instructions: 'Implementa patron_api con prioridad tool, streaming, cache y simple.', functionName: 'patron_api', cases: [{ args: [true, true, false], expected: 'tool', description: 'Una acción usa contrato de herramienta aunque la respuesta sea larga' }, { args: [false, true, false], expected: 'streaming', description: 'Una respuesta larga puede entregarse por partes' }, { args: [false, false, true], expected: 'cache', description: 'Un prefijo repetido puede beneficiarse de caché' }, { args: [false, false, false], expected: 'simple', description: 'No añade complejidad sin necesidad' }], hints: ['Evalúa necesita_accion primero.', 'Streaming no ejecuta herramientas.', 'Caché aparece solo después de descartar los dos anteriores.'] },
    reading: { core: 'Function calling hace que el modelo proponga nombre y argumentos según un esquema; la aplicación valida y decide si ejecuta. Streaming entrega eventos parciales. La caché reutiliza prefijos estables bajo un contrato del proveedor.', mechanics: 'Una tool sigue el ciclo solicitud, propuesta, validación, ejecución y resultado. Un stream requiere ensamblar eventos y manejar cortes. La caché depende de orden, tamaño y tiempo de vida del prefijo.', decisions: 'Añade tools solo para capacidades necesarias y con permisos mínimos. Usa streaming cuando mejora percepción sin romper validación. Mide caché con trazas de aciertos y coste.', errors: 'Mostrar JSON parcial como si estuviera completo rompe consumidores. Ejecutar una tool directamente desde argumentos del modelo omite autorización. Asumir caché sin revisar reglas produce costes inesperados.', keyPoints: ['El modelo propone tools; la aplicación autoriza.', 'Streaming necesita estados incompletos.', 'La caché es un contrato específico del proveedor.'], question: '¿Puedo validar JSON mientras llega por streaming?', answer: 'Puedes acumular y mostrar progreso, pero la validación completa suele esperar un objeto cerrado. No ejecutes acciones a partir de fragmentos incompletos.', transfer: 'Diseña estados de interfaz para conectando, recibiendo, validando, listo y error.', sources: ['openai-function-calling', 'google-function-calling', 'anthropic-tool-use', 'anthropic-prompt-caching'] },
    reasoning: { activity: decisionActivity('Elige el patrón principal.', [['accion', 'Consultar un pedido con argumentos', ['tool', 'streaming', 'cache'], 'tool'], ['largo', 'Mostrar una explicación extensa pronto', ['tool', 'streaming', 'cache'], 'streaming'], ['prefijo', 'Reusar un manual estable', ['tool', 'streaming', 'cache'], 'cache']]), explanation: 'Cada patrón resuelve una dimensión distinta. Pueden combinarse después de entender su responsabilidad.', hints: ['Una acción necesita esquema.', 'La entrega incremental corresponde a streaming.'] },
    debug: { title: 'Streaming oculta la herramienta', expected: 'La necesidad de acción tiene prioridad.', observed: 'Una respuesta larga siempre elige streaming.', hints: ['Prueba true, true, false.', 'El orden de condiciones importa.', 'Comprueba necesita_accion antes.'] },
  }),
];
