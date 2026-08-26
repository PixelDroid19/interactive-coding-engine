import { authoredLesson, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

// Fase 7: La aplicación completa.
// El TutorLocal muestra su mapa entero, se mide con documentos reales,
// detecta respuestas sin evidencia y cierra una entrega explicable.

export const AI_FASE_07 = [
  authoredLesson({
    number: 36, module: 6, title: 'El mapa completo del chat',
    summary: 'Recorre el recorrido entero de una pregunta y decide la ruta correcta en cada turno.',
    concepts: [
      ['Pipeline', 'Secuencia ordenada de etapas por la que pasa cada pregunta.'],
      ['Enrutador', 'Decisión que elige entre rutas posibles según lo disponible.'],
    ],
    requires: ['ahorrar-cache'],
    skill: 'mapear-arquitectura',
    capacidad: { nombre: 'ruta_de_consulta', descripcion: 'El despachador central decide por cada turno si toca rag, directo o un error explicativo.' },
    integracion: 'Hoy el TutorLocal exhibe su esqueleto completo en el panel Arquitectura. ruta_de_consulta gobierna el reparto: con documentos y motor va por rag, sin documentos va directo y sin motor declara el error educativo.',
    mentalModel: 'Una pregunta entra por la puerta y cruza puestos nombrados hasta salir respondida; el mapa hace visible quién trabaja en cada puesto.',
    script: [
      'Mirar atrás ayuda a mirar adelante. Tu chat ya tiene validación de entrada, historial, instrucción editable, modelo local, embeddings, RAG, citas, memoria y métricas.',
      'El mapa entero cabe en una frase: preparar datos, configurar, ejecutar, inspeccionar, evaluar y mejorar. Cada fase del curso construyó un puesto.',
      'El ejemplo implementa el enrutador con prioridades claras: sin motor listo todo es error; con motor y documentos, rag; solo con motor, directo.',
      'Completa ruta_de_consulta respetando ese orden de prioridad. Las pruebas combinan las dos señales de todas las maneras.',
    ],
    javascript: {
      example: `function ruta_de_consulta(hayDocumentos, motorListo) {
  if (!motorListo) return 'error';
  return hayDocumentos ? 'rag' : 'directo';
}

console.log(ruta_de_consulta(true, true));`,
      starter: `function ruta_de_consulta(hayDocumentos, motorListo) {
  // Sin motor devuelve 'error'.
  // Con motor: 'rag' si hay documentos, 'directo' si no.
}`,
      solution: `function ruta_de_consulta(hayDocumentos, motorListo) {
  if (!motorListo) return 'error';
  return hayDocumentos ? 'rag' : 'directo';
}`,
      debugStarter: `function ruta_de_consulta(hayDocumentos, motorListo) {
  return hayDocumentos ? 'rag' : 'directo';
}`,
    },
    python: {
      example: `def ruta_de_consulta(hay_documentos, motor_listo):
    if not motor_listo:
        return "error"
    return "rag" if hay_documentos else "directo"

print(ruta_de_consulta(True, True))`,
      starter: `def ruta_de_consulta(hay_documentos, motor_listo):
    # Sin motor devuelve 'error'.
    # Con motor: 'rag' si hay documentos, 'directo' si no.
    pass`,
      solution: `def ruta_de_consulta(hay_documentos, motor_listo):
    if not motor_listo:
        return "error"
    return "rag" if hay_documentos else "directo"`,
      debugStarter: `def ruta_de_consulta(hay_documentos, motor_listo):
    return "rag" if hay_documentos else "directo"`,
    },
    practice: {
      title: 'Dirige el tráfico',
      instructions: "Implementa ruta_de_consulta(hayDocumentos, motorListo). Sin motor listo devuelve 'error'. Con motor, 'rag' cuando haya documentos y 'directo' en caso contrario.",
      functionName: 'ruta_de_consulta',
      cases: [
        { args: [true, true], expected: 'rag', description: 'Motor y documentos activan la ruta aumentada' },
        { args: [false, true], expected: 'directo', description: 'Sin evidencia la conversación sigue directa' },
        { args: [true, false], expected: 'error', description: 'Sin motor ni rag ni directo: error explicado' },
        { args: [false, false], expected: 'error', description: 'La falta de motor domina sobre todo lo demás' },
      ],
      hints: [
        'Comprueba primero la condición que bloquea todo el sistema.',
        'Con motor disponible, la presencia de documentos elige entre dos rutas.',
        'Devuelve exactamente una de las tres cadenas.',
      ],
    },
    reading: {
      core: 'La arquitectura final del chat cabe en seis zonas: preparar datos, configurar, ejecutar, inspeccionar, evaluar y mejorar. Ninguna zona es magia: todas son funciones que construiste clase a clase y hoy se ven juntas por primera vez.',
      mechanics: 'El turno entra validado y se arma el paquete con ficha e historial. El enrutador elige rag o directo según la evidencia disponible y el estado del motor. La generación fluye en streaming por el Worker y la salida pasa los filtros de restricciones y citas antes de pintarse. Todo deja evento en el diagnóstico.',
      decisions: 'Mantén el mapa visible para ti mismo: cuando algo falle, pregúntate en qué zona se rompió antes de tocar código. Las mejoras futuras, como formatos nuevos o herramientas extra, entran por su zona sin reescribir las demás. Esa modularidad es el verdadero premio del curso.',
      errors: 'Rutas paralelas improvisadas fuera del enrutador crean chats gemelos con conductas distintas. Saltarse zonas, como validar tras generar, desordena los errores. Y creer que alguna pieza es opcional para siempre deja agujeros que aparecen justo en la demostración final.',
      keyPoints: [
        'Seis zonas ordenadas cuentan toda la arquitectura.',
        'El enrutador concentra las decisiones de ruta con prioridades claras.',
        'Las piezas nuevas entran por su zona sin romper las vecinas.',
      ],
      question: '¿Por qué insistir tanto en un único punto de entrada?',
      answer: 'Porque un solo camino se puede medir, depurar y explicar. Cada ruta alternativa duplica estados, pruebas y formas de fallar. La simplicidad estructural es una característica de producto.',
      transfer: 'Dibuja tu propio mapa del chat en papel con las seis zonas y coloca cada función del curso en su sitio.',
      sources: ['roadmap-ai-engineer', 'rag-paper'],
    },
    reasoning: {
      activity: flowActivity('Ordena las zonas por donde cruza una pregunta.', [
        ['datos', 'Preparar datos y validar entrada', 'start'],
        ['configurar', 'Configurar ficha y parámetros', 'process'],
        ['ejecutar', 'Enrutar y generar', 'process'],
        ['inspeccionar', 'Inspeccionar contexto y citas', 'process'],
        ['evaluar', 'Evaluar calidad', 'process'],
        ['mejorar', 'Ajustar y repetir', 'end'],
      ], [
        ['datos', 'configurar'],
        ['configurar', 'ejecutar'],
        ['ejecutar', 'inspeccionar'],
        ['inspeccionar', 'evaluar'],
        ['evaluar', 'mejorar'],
      ]),
      explanation: 'El ciclo completo termina donde empezó: mejorar alimenta los datos y la configuración del siguiente turno.',
      hints: ['Nada se configura antes de tener datos sanos.', 'Evaluar necesita haber inspeccionado qué ocurrió.'],
    },
    debug: {
      title: 'El error desaparece del mapa',
      expected: 'Sin motor listo la respuesta es error explicado.',
      observed: 'El enrutador ofrece rag o directo incluso sin motor.',
      hints: ['Prueba con motor apagado.', 'Falta la comprobación bloqueante al inicio.', 'Devuelve la cadena de error antes de mirar documentos.'],
    },
  }),
  authoredLesson({
    number: 37, module: 6, title: 'Medir calidad con documentos propios',
    summary: 'Convierte tus pruebas manuales en una tasa de éxito comparable entre versiones del chat.',
    concepts: [
      ['Conjunto de prueba', 'Lista fija de preguntas con resultado esperado.'],
      ['Tasa de éxito', 'Proporción de casos que se comportaron como se esperaba.'],
    ],
    requires: ['mapear-arquitectura'],
    skill: 'medir-exito',
    capacidad: { nombre: 'tasa_exito', descripcion: 'El panel Calidad resume tus sesiones de prueba en una cifra comparable día a día.' },
    integracion: 'Al terminar cada sesión de pruebas con tus documentos, el TutorLocal llama a tasa_exito con los resultados marcados a mano. La cifra queda guardada con fecha y versión de configuración.',
    mentalModel: 'Probar a mano está bien una vez; anotarlo convierte la intuición en una línea temporal de mejora.',
    script: [
      'Ya sabes usar el chat con tus documentos. Hoy convertimos esas pruebas sueltas en una tasa comparable.',
      'Un conjunto mínimo tiene preguntas fijas y su resultado esperado: responde bien, cita correctamente o debe abstenerse.',
      'El ejemplo cuenta cuántos resultados marcaste como correctos y divide entre el total probado, cuidando el caso vacío.',
      'Completa tasa_exito con la proporción real. Las pruebas traen mezclas distintas de aciertos.',
    ],
    javascript: {
      example: `function tasa_exito(resultados) {
  if (resultados.length === 0) return 0;
  const aciertos = resultados.filter(Boolean).length;
  return aciertos / resultados.length;
}

console.log(tasa_exito([true, true, false, true]));`,
      starter: `function tasa_exito(resultados) {
  // Proporción de valores verdaderos sobre el total probado.
  // Lista vacía devuelve cero.
}`,
      solution: `function tasa_exito(resultados) {
  if (resultados.length === 0) return 0;
  const aciertos = resultados.filter(Boolean).length;
  return aciertos / resultados.length;
}`,
      debugStarter: `function tasa_exito(resultados) {
  return 1;
}`,
    },
    python: {
      example: `def tasa_exito(resultados):
    if len(resultados) == 0:
        return 0
    aciertos = sum(1 for r in resultados if r)
    return aciertos / len(resultados)

print(tasa_exito([True, True, False, True]))`,
      starter: `def tasa_exito(resultados):
    # Proporción de valores verdaderos sobre el total probado.
    # Lista vacía devuelve cero.
    pass`,
      solution: `def tasa_exito(resultados):
    if len(resultados) == 0:
        return 0
    aciertos = sum(1 for r in resultados if r)
    return aciertos / len(resultados)`,
      debugStarter: `def tasa_exito(resultados):
    return 1`,
    },
    practice: {
      title: 'Anota la sesión',
      instructions: 'Implementa tasa_exito(resultados). Recibe valores booleanos marcando aciertos y devuelve la proporción sobre el total probado, con cero para listas vacías.',
      functionName: 'tasa_exito',
      cases: [
        { args: [[true, true, false, true]], expected: 0.75, description: 'Tres aciertos de cuatro casos probados' },
        { args: [[], ], expected: 0, description: 'No probar nada no equivale a perfección' },
        { args: [[false, false]], expected: 0, description: 'Todos los fallos también se miden con honradez' },
      ],
      hints: [
        'Cuenta primero los valores verdaderos.',
        'El denominador es la longitud de la lista recibida.',
        'La lista vacía necesita su propia rama antes de dividir.',
      ],
    },
    reading: {
      core: 'Medir con tus propios documentos cambia tu relación con el chat: deja de ser una demo y pasa a ser un sistema bajo observación. Una tasa modesta pero honesta vale más que cualquier impresión general después de tres preguntas cómodas.',
      mechanics: 'Elige entre cinco y diez preguntas representativas, incluyendo una imposible para probar la abstención. Ejecuta cada versión de configuración sobre el mismo conjunto y registra aciertos. La comparación solo vale si nada más cambia entre mediciones.',
      decisions: 'Incluye deliberadamente casos difíciles: paráfrasis lejanas, preguntas con negaciones y la imposible. Documenta junto a cada medición qué configuración usó: chunking, umbral, k y ficha de sistema. Sin ese registro, las cifras no se pueden reproducir.',
      errors: 'Cambiar preguntas y configuración a la vez vuelve inútil la comparación. Medir solo lo fácil infla la tasa y esconde regresiones reales. Olvidar registrar la configuración convierte cada mejora anecdótica en irrepetible.',
      keyPoints: [
        'Conjunto fijo de preguntas, incluida una imposible.',
        'Mis preguntas, una variable cambiante por medición.',
        'Configuración registrada junto a cada cifra o nada significa.',
      ],
      question: '¿Cuántos casos hacen falta?',
      answer: 'Los suficientes para cubrir tipos distintos de pregunta, típicamente cinco o diez para empezar. Diez casos honestos enseñan más que cien variantes de la misma pregunta fácil.',
      transfer: 'Escribe tus cinco preguntas de evaluación para tu documento, marca cuáles debería fallar hoy y mide.',
      sources: ['deepeval-evaluation', 'ragas-metrics'],
    },
    reasoning: {
      activity: decisionActivity('Interpreta cada sesión de medidas.', [
        ['subida', 'La misma batería pasó de cuatro a siete aciertos tras ajustar el chunking', ['mejora plausible', 'milagro'], 'mejora plausible'],
        ['perfecta', 'Diez de diez incluyendo la pregunta imposible', ['mejora plausible', 'revisar el conjunto'], 'revisar el conjunto'],
        ['vaga', 'Mejoró, pero cambiaste también las preguntas', ['concluyente', 'inconcluso'], 'inconcluso'],
      ]),
      explanation: 'Las comparaciones exigen constancia del conjunto. Resultados demasiado perfectos suelen revelar preguntas débiles, no genios.',
      hints: ['Pregunta qué cambió entre mediciones.', 'La pregunta imposible existe para caer.'],
    },
    debug: {
      title: 'Todo parece un éxito',
      expected: 'La tasa refleja los fallos marcados.',
      observed: 'La función devuelve el máximo siempre.',
      hints: ['Prueba con una lista que contenga fallos.', 'La constante ignora los argumentos.', 'Cuenta verdaderos y divide por el total.'],
    },
  }),
  authoredLesson({
    number: 38, module: 6, title: 'Respuestas sin evidencia',
    summary: 'Marca para revisión toda respuesta que afirma sin citar o que trata temas delicados.',
    concepts: [
      ['Respuesta sin evidencia', 'Afirmación publicada sin ninguna cita que la respalde.'],
      ['Revisión', 'Estado intermedio que invita a comprobar antes de fiarse.'],
    ],
    requires: ['medir-exito'],
    skill: 'exigir-evidencia',
    capacidad: { nombre: 'necesita_revision', descripcion: 'El chat señala sus propias zonas grises: sin citas o sobre temas delicados, la respuesta llega acompañada, nunca sola.' },
    integracion: 'Antes de publicar cualquier respuesta del modo directo, necesita_revision decide si viaja sola o acompañada de la franja Revisa esto. En modo rag, las citas del chat ya cumplen ese papel.',
    mentalModel: 'Una afirmación sin evidencia es un rumor con buena tipografía; la revisión es el contrapeso honesto.',
    script: [
      'En modo directo el modelo no consulta tus documentos. Sus afirmaciones pueden ser buenas, pero nadie las respalda.',
      'La política combina dos señales con un o lógico: ausencia de citas o tema de riesgo alto. Cualquiera de las dos pide revisión visible.',
      'El ejemplo devuelve true cuando falta evidencia aunque el tema sea tranquilo, y también para temas delicados bien citados.',
      'Completa necesita_revision con ambas condiciones. Las pruebas cubren las cuatro combinaciones.',
    ],
    javascript: {
      example: `function necesita_revision(tieneCitas, riesgo) {
  return !tieneCitas || riesgo === 'alto';
}

console.log(necesita_revision(false, 'bajo'));`,
      starter: `function necesita_revision(tieneCitas, riesgo) {
  // true si faltan citas O si el tema es de riesgo alto.
}`,
      solution: `function necesita_revision(tieneCitas, riesgo) {
  return !tieneCitas || riesgo === 'alto';
}`,
      debugStarter: `function necesita_revision(tieneCitas, riesgo) {
  return !tieneCitas && riesgo === 'alto';
}`,
    },
    python: {
      example: `def necesita_revision(tiene_citas, riesgo):
    return not tiene_citas or riesgo == "alto"

print(necesita_revision(False, "bajo"))`,
      starter: `def necesita_revision(tiene_citas, riesgo):
    # True si faltan citas O si el tema es de riesgo alto.
    pass`,
      solution: `def necesita_revision(tiene_citas, riesgo):
    return not tiene_citas or riesgo == "alto"`,
      debugStarter: `def necesita_revision(tiene_citas, riesgo):
    return not tiene_citas and riesgo == "alto"`,
    },
    practice: {
      title: 'Señala lo gris',
      instructions: "Implementa necesita_revision(tieneCitas, riesgo). Devuelve true cuando la respuesta no tenga citas o cuando el riesgo del tema sea alto.",
      functionName: 'necesita_revision',
      cases: [
        { args: [false, 'bajo'], expected: true, description: 'Afirma sin evidencia: viaja acompañada' },
        { args: [true, 'alto'], expected: true, description: 'Temas delicados piden revisión aunque estén citados' },
        { args: [true, 'bajo'], expected: false, description: 'Citada y tranquila se publica sin fricción' },
        { args: [false, 'alto'], expected: true, description: 'La peor combinación activa ambos motivos' },
      ],
      hints: [
        'La ausencia de citas es una señal por sí misma; busca cómo negarla.',
        'El riesgo alto es la segunda vía hacia la revisión.',
        'Une ambas condiciones con el conector lógico adecuado.',
      ],
    },
    reading: {
      core: 'Distinguir lo fundamentado de lo plausibly dicho es la competencia central que este curso quiere dejarte. La franja de revisión materializa esa distinción en la interfaz: el chat confiesa qué sabe con fuentes y qué dice desde la memoria general.',
      mechanics: 'Tras la generación, el sistema examina las citas supervivientes y la categoría del tema. Sin evidencia o ante riesgo alto, la respuesta se publica con la franja visible y queda registrada como revisada-pendiente en las métricas. Nada se censura: se acompaña.',
      decisions: 'Define tus categorías de riesgo según tu público: salud, dinero y derecho suelen merecerlas. Decide si la franja acompaña siempre o solo la primera vez por tema. Mide cuántas respuestas caen en revisión: un porcentaje enorme indica prompts débiles, no usuarios pesimistas.',
      errors: 'Esconder la franja para que la interfaz luzca limpia destruye la confianza construida. Exigir citas en modo directo, donde no existen, marca todo constantemente. Y tratar la revisión como error ensucia las métricas con señales que eran diseño funcionando.',
      keyPoints: [
        'Sin citas o con riesgo alto, la respuesta viaja acompañada.',
        'La franja educa; no castiga ni censura.',
        'Contar revisiones es medir la honestidad estructural del chat.',
      ],
      question: '¿No basta con pedirle al modelo que cite?',
      answer: 'Pedir ayuda; comprobar obliga. En modo directo no hay fragmentos que citar, así que la política de revisión es la única señal honesta disponible para quien lee.',
      transfer: 'Define tres categorías de riesgo para tu chat y redacta el texto de la franja que las acompañaría.',
      sources: ['owasp-genai-top10', 'deepeval-evaluation'],
    },
    reasoning: {
      activity: decisionActivity('Decide si cada respuesta necesita revisión.', [
        ['horario', 'Modo rag, dos citas válidas, tema tranquilo', ['revisar', 'publicar'], 'publicar'],
        ['opinion', 'Modo directo, sin citas, consejo de estudio', ['revisar', 'publicar'], 'revisar'],
        ['salud', 'Modo directo, sin citas, síntoma médico', ['revisar', 'publicar'], 'revisar'],
      ]),
      explanation: 'Las citas del modo rag hablan por sí mismas. En modo directo, la ausencia de evidencia o el tema delicado activan la compañía.',
      hints: ['Pregunta qué respalda la afirmación.', 'El tema pesa tanto como la evidencia.'],
    },
    debug: {
      title: 'Solo revisa el doble problema',
      expected: 'Cada motivo por separado activa la revisión.',
      observed: 'La función exige falta de citas y riesgo alto a la vez.',
      hints: ['Prueba sin citas con tema tranquilo.', 'El conector lógico exige demasiado.', 'Niega las citas y une con o contra el riesgo alto.'],
    },
  }),
  authoredLesson({
    number: 39, module: 6, title: 'La entrega del TutorLocal',
    summary: 'Cierra el curso verificando las cuatro evidencias que hacen presentable tu aplicación.',
    concepts: [
      ['Entrega reproducible', 'Otra persona puede ejecutar y entender lo que construiste.'],
      ['Model card del sistema', 'Resumen de alcance, límites y medición de tu aplicación.'],
    ],
    requires: ['exigir-evidencia'],
    skill: 'cerrar-entrega',
    capacidad: { nombre: 'checklist_entrega', descripcion: 'El botón Finalizar del chat comprueba las cuatro evidencias antes de felicitarte.' },
    integracion: 'El TutorLocal estrena su pantalla final: checklist_entrega recorre funciona, resiste, mide y explica. Las cuatro casillas en verde desbloquean la tarjeta de logro del curso.',
    mentalModel: 'Terminar no es dejar de escribir código: es poder contar cuatro historias coherentes sobre lo que construiste.',
    script: [
      'Llegaste al final del mapa. Antes de celebrar, la entrega pide cuatro evidencias concretas, no impresiones.',
      'Funciona: el flujo completo corre con un documento tuyo. Resiste: probaste inyecciones y abstenciones. Mide: tienes cifras de tus sesiones. Explica: puedes dibujar y narrar la arquitectura.',
      'El ejemplo exige las cuatro condiciones juntas con un encadenamiento de conjunciones. Cualquier casilla roja pospone el logro.',
      'Completa checklist_entrega con las cuatro verificaciones. Las pruebas apagarán evidencias distintas.',
    ],
    javascript: {
      example: `function checklist_entrega(funciona, resiste, mide, explica) {
  return funciona && resiste && mide && explica;
}

console.log(checklist_entrega(true, true, true, true));`,
      starter: `function checklist_entrega(funciona, resiste, mide, explica) {
  // true solo con las cuatro evidencias confirmadas.
}`,
      solution: `function checklist_entrega(funciona, resiste, mide, explica) {
  return funciona && resiste && mide && explica;
}`,
      debugStarter: `function checklist_entrega(funciona, resiste, mide, explica) {
  return funciona && explica;
}`,
    },
    python: {
      example: `def checklist_entrega(funciona, resiste, mide, explica):
    return funciona and resiste and mide and explica

print(checklist_entrega(True, True, True, True))`,
      starter: `def checklist_entrega(funciona, resiste, mide, explica):
    # True solo con las cuatro evidencias confirmadas.
    pass`,
      solution: `def checklist_entrega(funciona, resiste, mide, explica):
    return funciona and resiste and mide and explica`,
      debugStarter: `def checklist_entrega(funciona, resiste, mide, explica):
    return funciona and explica`,
    },
    practice: {
      title: 'Firma la entrega',
      instructions: 'Implementa checklist_entrega(funciona, resiste, mide, explica). Devuelve true únicamente cuando las cuatro evidencias sean verdaderas.',
      functionName: 'checklist_entrega',
      cases: [
        { args: [true, true, true, true], expected: true, description: 'Las cuatro historias cierran la entrega' },
        { args: [true, true, false, true], expected: false, description: 'Sin cifras no hay entrega, solo anécdota' },
        { args: [true, false, true, true], expected: false, description: 'Lo no atacado se desconoce frágil' },
        { args: [false, true, true, true], expected: false, description: 'Explicar lo que no funciona no lo funciona' },
      ],
      hints: [
        'Las cuatro condiciones participan; ninguna es decorativa.',
        'Encadena las conjunciones de forma legible.',
        'Una sola casilla apagada basta para el false.',
      ],
    },
    reading: {
      core: 'Tu aplicación final es un chat educativo local: lee tus documentos, genera en tu GPU, cita sus fuentes, admite que no sabe y te enseña sus números. Ese conjunto, explicado con sus límites, vale más que muchas demos conectadas a nubes ajenas.',
      mechanics: 'La entrega consta de cuatro bloques: demostración guiada con tu documento, registro de ataques y abstenciones probados, panel de métricas exportado y un texto breve que dibuje las seis zonas y sus funciones. Cada bloque responde una pregunta distinta de quien evalúe tu trabajo.',
      decisions: 'Publica o comparte tu trabajo sin secretos y sin datos ajenos: el curso no usó claves precisamente para que esta parte sea trivial. Conserva tu conjunto de evaluación versionado junto al código. Anota los tres fallos conocidos más molestos; documentarlos es madurez, no debilidad.',
      errors: 'Presentar la demo feliz sin ataques ni métricas invita a descubrirlos en el peor momento. Ocultar los límites conocidos los convierte en sorpresas ajenas. Y olvidar reproducibilidad, como versiones y datos de prueba, deja una obra que ni tú podrás repetir mañana.',
      keyPoints: [
        'Cuatro evidencias: funciona, resiste, mide y explica.',
        'Los límites conocidos forman parte de la entrega.',
        'Reproducible significa que otra persona lo repite mañana.',
      ],
      question: '¿Qué puedo construir después con esto?',
      answer: 'El mismo esqueleto escala: cambia el extractor de documentos, añade herramientas nuevas detrás de la lista cerrada o migra el generador a un backend seguro manteniendo adaptadores. Los patrones del curso sobreviven a cualquier proveedor.',
      transfer: 'Redacta la mini model card de tu TutorLocal: propósito, alcance, límites conocidos y cómo se mide.',
      sources: ['roadmap-ai-engineer', 'deepeval-evaluation'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el cierre responsable de tu proyecto.', [
        ['demostrar', 'Demostrar el flujo completo'],
        ['atacar', 'Registrar ataques y abstenciones'],
        ['medir', 'Exportar métricas versionadas'],
        ['explicar', 'Narrar arquitectura y límites'],
        ['compartir', 'Compartir sin secretos ni datos ajenos'],
      ]),
      explanation: 'Primero demuestras, luego demuestras que aguanta, después enseñas números, explicas límites y solo entonces compartes.',
      hints: ['Compartir llega al final de la lista, no al principio.', 'Los números preceden a la narrativa.'],
    },
    debug: {
      title: 'Dos evidencias sustituyen a cuatro',
      expected: 'Las cuatro casillas participan en la decisión.',
      observed: 'Solo se comprueban funciona y explica.',
      hints: ['Apaga mide y observa el resultado.', 'Faltan condiciones en la cadena.', 'Une las cuatro señales con conjunciones.'],
    },
  }),
];
