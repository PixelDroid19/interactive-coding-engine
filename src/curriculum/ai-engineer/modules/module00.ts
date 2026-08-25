import { authoredLesson, decisionActivity, flowActivity, sequenceActivity } from '../authoring';

export const AI_MODULE_00 = [
  authoredLesson({
    number: 1, module: 0, title: 'Qué hace un AI Engineer',
    summary: 'Distingue el trabajo de producto, la capacidad del modelo y el código que conecta ambos.',
    concepts: [['AI Engineer', 'Construye funciones de producto que usan modelos, datos y controles.'], ['Regla determinista', 'Produce la misma salida para la misma entrada siguiendo condiciones explícitas.']],
    skill: 'distinguir-regla-modelo',
    mentalModel: 'El modelo es una pieza incierta dentro de un sistema que sí debe tener contratos claros.',
    script: [
      'Un AI Engineer no empieza buscando el modelo más grande. Empieza con una persona, una tarea y un resultado que pueda observar.',
      'Si las reglas son claras y estables, una condición suele ser mejor. El modelo aporta valor cuando hay lenguaje, imágenes o variación difícil de enumerar.',
      'El ejemplo decide entre una regla y un modelo a partir de dos señales del problema. La decisión queda visible y se puede probar.',
      'Completa la función sin responder siempre lo mismo. Las pruebas cambiarán las señales para comprobar tu criterio.',
    ],
    javascript: {
      example: `function elegir_enfoque(reglas_claras, casos_variables) {
  if (reglas_claras && !casos_variables) return 'regla';
  return 'modelo';
}

console.log(elegir_enfoque(true, false));`,
      starter: `function elegir_enfoque(reglas_claras, casos_variables) {
  // Devuelve 'regla' o 'modelo' según las señales.
}`,
      solution: `function elegir_enfoque(reglas_claras, casos_variables) {
  return reglas_claras && !casos_variables ? 'regla' : 'modelo';
}`,
      debugStarter: `function elegir_enfoque(reglas_claras, casos_variables) {
  return 'modelo';
}`,
    },
    python: {
      example: `def elegir_enfoque(reglas_claras, casos_variables):
    if reglas_claras and not casos_variables:
        return "regla"
    return "modelo"

print(elegir_enfoque(True, False))`,
      starter: `def elegir_enfoque(reglas_claras, casos_variables):
    # Devuelve "regla" o "modelo" según las señales.
    pass`,
      solution: `def elegir_enfoque(reglas_claras, casos_variables):
    return "regla" if reglas_claras and not casos_variables else "modelo"`,
      debugStarter: `def elegir_enfoque(reglas_claras, casos_variables):
    return "modelo"`,
    },
    practice: {
      title: 'Elige el enfoque', instructions: 'Implementa elegir_enfoque(reglas_claras, casos_variables). Usa las dos entradas y devuelve regla o modelo.', functionName: 'elegir_enfoque',
      cases: [
        { args: [true, false], expected: 'regla', description: 'Usa una regla cuando el contrato es explícito y estable' },
        { args: [false, true], expected: 'modelo', description: 'Usa un modelo cuando los casos varían y no caben en reglas simples' },
      ],
      hints: ['Pregunta si puedes enumerar las condiciones.', 'Traza primero true, false y luego false, true.', 'Devuelve texto; console.log es opcional.'],
    },
    reading: {
      core: 'El rol convierte una necesidad de producto en un sistema que puede medirse. Incluye preparación de datos, llamadas a modelos, validación, experiencia de usuario, coste, seguridad y evaluación. Entrenar un modelo desde cero no es el punto de partida habitual.',
      mechanics: 'Una función de IA recibe una entrada, construye una solicitud, obtiene una salida probabilística y la somete a reglas del programa. El modelo propone; el sistema decide qué aceptar, mostrar o ejecutar.',
      decisions: 'Elige una regla cuando las condiciones son conocidas, explicables y cambian poco. Considera un modelo cuando necesitas interpretar lenguaje, reconocer patrones o manejar variantes que sería costoso enumerar. Compara ambas opciones con casos reales.',
      errors: 'Llamar IA a cualquier automatización confunde el diseño. El error contrario es usar un modelo donde una condición sería más barata, rápida y verificable. En ambos casos se pierde claridad sobre el fallo.',
      keyPoints: ['Empieza por el resultado observable de una persona.', 'Mantén la salida del modelo detrás de validaciones y permisos.', 'Compara siempre con una solución determinista sencilla.'],
      question: '¿Necesito saber entrenar redes neuronales para empezar?', answer: 'No. Primero aprende a integrar y evaluar modelos existentes. El entrenamiento profundo se vuelve relevante cuando los datos, el coste y el problema justifican ese control.',
      transfer: 'Elige una tarea de tu trabajo y escribe dos soluciones: una regla explícita y una función asistida por un modelo.',
      sources: ['roadmap-ai-engineer', 'hf-llm-course'],
    },
    reasoning: {
      activity: decisionActivity('Decide el enfoque inicial para cada problema.', [
        ['impuesto', 'Calcular un impuesto con una tabla legal', ['regla', 'modelo'], 'regla'],
        ['resumen', 'Resumir mensajes redactados de muchas formas', ['regla', 'modelo'], 'modelo'],
        ['estado', 'Mostrar activo cuando un campo vale true', ['regla', 'modelo'], 'regla'],
      ]),
      explanation: 'Las reglas dominan cuando el contrato es explícito. Los modelos ayudan con variación semántica, pero añaden incertidumbre y coste.',
      hints: ['Busca primero condiciones que puedas escribir sin ejemplos.', 'No elijas un modelo solo porque la tarea contiene texto.'],
    },
    debug: { title: 'Todo termina en el modelo', expected: 'Los casos estables usan una regla y los variables usan un modelo.', observed: 'La función devuelve modelo para cualquier entrada.', hints: ['Ejecuta el caso true, false.', 'La respuesta fija ignora las señales.', 'Combina reglas_claras con la negación de casos_variables.'] },
  }),
  authoredLesson({
    number: 2, module: 0, title: 'Del problema de producto a una función de IA',
    summary: 'Convierte una idea vaga en una métrica y un contrato que se puedan comprobar.',
    concepts: [['Resultado observable', 'Cambio que una persona puede notar o medir.'], ['Tasa de acierto', 'Proporción de casos que cumplen el resultado esperado.']],
    requires: ['distinguir-regla-modelo'], skill: 'definir-criterio-exito',
    mentalModel: 'Una función útil tiene entrada, salida, usuario y criterio de éxito antes de tener proveedor.',
    script: [
      'Mejorar soporte con IA no es todavía un requisito. Falta decir qué decisión cambia y cómo sabremos si mejoró.',
      'Un criterio útil conecta casos correctos con el total revisado. No demuestra toda la calidad, pero permite comparar versiones.',
      'La función calcula una tasa sin conocer nombres, marcas ni modelos. Ese contrato puede sobrevivir aunque cambie el proveedor.',
      'Completa el cálculo y protege el caso sin evaluaciones. Una división por cero no debe convertirse en una métrica engañosa.',
    ],
    javascript: {
      example: `function tasa_acierto(correctos, total) {
  if (total === 0) return 0;
  return correctos / total;
}

console.log(tasa_acierto(8, 10));`,
      starter: `function tasa_acierto(correctos, total) {
  // Devuelve un número entre 0 y 1.
}`,
      solution: `function tasa_acierto(correctos, total) {
  return total === 0 ? 0 : correctos / total;
}`,
      debugStarter: `function tasa_acierto(correctos, total) {
  return correctos / 100;
}`,
    },
    python: {
      example: `def tasa_acierto(correctos, total):
    if total == 0:
        return 0
    return correctos / total

print(tasa_acierto(8, 10))`,
      starter: `def tasa_acierto(correctos, total):
    # Devuelve un número entre 0 y 1.
    pass`,
      solution: `def tasa_acierto(correctos, total):
    return 0 if total == 0 else correctos / total`,
      debugStarter: `def tasa_acierto(correctos, total):
    return correctos / 100`,
    },
    practice: {
      title: 'Mide una versión', instructions: 'Implementa tasa_acierto(correctos, total). Usa el total real y devuelve 0 si todavía no hay casos.', functionName: 'tasa_acierto',
      cases: [
        { args: [8, 10], expected: 0.8, description: 'Calcula la proporción sobre el total observado' },
        { args: [0, 0], expected: 0, description: 'No inventa calidad cuando no hay evaluaciones' },
      ],
      hints: ['El denominador es total, no cien.', 'Resuelve primero qué debe ocurrir con total igual a cero.', 'Devuelve el cociente; no lo conviertas en texto.'],
    },
    reading: {
      core: 'Una idea de producto se vuelve implementable cuando define quién usa la función, qué entrada entrega, qué salida recibe y qué cambio se considera bueno. La métrica no reemplaza el juicio; hace visible una parte del contrato.',
      mechanics: 'Un conjunto de casos contiene entradas y resultados esperados. Ejecutas una versión, cuentas aciertos y revisas también los errores. La tasa resume el resultado, mientras los casos explican dónde falla.',
      decisions: 'Combina una métrica de calidad con límites de latencia, coste y seguridad. Una versión con más aciertos puede ser peor si tarda demasiado, filtra datos o falla en casos críticos.',
      errors: 'Medir solo ejemplos fáciles produce una cifra optimista. Cambiar los casos entre versiones impide comparar. Usar un porcentaje fijo en el código entrega una respuesta sin medir el total real.',
      keyPoints: ['Escribe el criterio de éxito antes de elegir el modelo.', 'Conserva el mismo conjunto de referencia al comparar versiones.', 'Separa métricas agregadas de fallos críticos.'],
      question: '¿Una tasa alta significa que el producto está listo?', answer: 'No. Revisa representatividad, casos críticos, experiencia de usuario, coste, latencia y seguridad. La tasa solo resume los casos que decidiste medir.',
      transfer: 'Redacta un criterio de éxito y un caso de fallo grave para la tarea que elegiste en la clase anterior.',
      sources: ['roadmap-ai-engineer', 'deepeval-evaluation'],
    },
    reasoning: {
      activity: sequenceActivity('Ordena el paso de una idea a una comparación útil.', [['usuario', 'Definir usuario y tarea'], ['casos', 'Escribir casos de referencia'], ['medir', 'Ejecutar y medir'], ['revisar', 'Revisar fallos críticos']]),
      explanation: 'Los casos nacen del problema del usuario. La cifra llega después y siempre se interpreta junto con los fallos.',
      hints: ['No puedes escribir buenos casos sin saber quién usa la función.', 'La revisión de fallos ocurre después de ejecutar.'],
    },
    debug: { title: 'El denominador está fijo', expected: 'La tasa usa el total recibido y maneja total cero.', observed: 'La función divide siempre entre cien.', hints: ['Prueba 8 de 10.', 'El parámetro total existe por una razón.', 'Protege total cero antes de dividir.'] },
  }),
  authoredLesson({
    number: 3, module: 0, title: 'Entorno JavaScript y Python',
    summary: 'Elige un runtime por las necesidades de la tarea y entiende qué puede hacer dentro del navegador.',
    concepts: [['Runtime', 'Entorno que interpreta y ejecuta un programa.'], ['WebAssembly', 'Formato que permite ejecutar código compilado dentro del navegador.'], ['Web Worker', 'Hilo aislado que evita bloquear la interfaz.']],
    requires: ['definir-criterio-exito'], skill: 'elegir-runtime',
    mentalModel: 'JavaScript vive de forma nativa en el navegador; Pyodide lleva Python a un Worker mediante WebAssembly.',
    script: [
      'Este curso ofrece JavaScript y Python, pero no convierte un lenguaje en el otro. Cada versión conserva su propio archivo y su propio borrador.',
      'JavaScript encaja de forma natural con la interfaz. Python aporta un ecosistema familiar para datos y experimentos. En el navegador, Pyodide lo ejecuta dentro de WebAssembly.',
      'La función usa el tipo de tarea para proponer un runtime. Es una decisión de ingeniería, no una competencia entre lenguajes.',
      'Completa la decisión con las tareas interfaz y datos. Después cambia de lenguaje y comprueba que el contrato sigue siendo el mismo.',
    ],
    javascript: {
      example: `function elegir_runtime(tarea) {
  if (tarea === 'interfaz') return 'javascript';
  return 'python';
}

console.log(elegir_runtime('interfaz'));`,
      starter: `function elegir_runtime(tarea) {
  // 'interfaz' usa JavaScript; 'datos' usa Python.
}`,
      solution: `function elegir_runtime(tarea) {
  return tarea === 'interfaz' ? 'javascript' : 'python';
}`,
      debugStarter: `function elegir_runtime(tarea) {
  return 'javascript';
}`,
    },
    python: {
      example: `def elegir_runtime(tarea):
    if tarea == "interfaz":
        return "javascript"
    return "python"

print(elegir_runtime("interfaz"))`,
      starter: `def elegir_runtime(tarea):
    # "interfaz" usa JavaScript; "datos" usa Python.
    pass`,
      solution: `def elegir_runtime(tarea):
    return "javascript" if tarea == "interfaz" else "python"`,
      debugStarter: `def elegir_runtime(tarea):
    return "javascript"`,
    },
    practice: {
      title: 'Elige el runtime', instructions: 'Implementa elegir_runtime(tarea). Devuelve javascript para interfaz y python para datos.', functionName: 'elegir_runtime',
      cases: [
        { args: ['interfaz'], expected: 'javascript', description: 'Reconoce una tarea ligada al navegador' },
        { args: ['datos'], expected: 'python', description: 'Reconoce una tarea de exploración de datos' },
      ],
      hints: ['La entrada describe la tarea, no el lenguaje actual.', 'Traza interfaz y datos por separado.', 'Devuelve el nombre en minúsculas.'],
    },
    reading: {
      core: 'Un runtime aporta sintaxis, memoria, módulos y APIs disponibles durante la ejecución. JavaScript es nativo del navegador. Pyodide compila CPython y parte de su ecosistema a WebAssembly para ejecutarlo sin instalar Python en el equipo.',
      mechanics: 'El editor envía Python a un Web Worker. El Worker carga Pyodide bajo demanda, captura print y devuelve errores con ubicación. Si un programa no termina, la aplicación elimina ese Worker y crea otro para la siguiente ejecución.',
      decisions: 'Elige por bibliotecas, despliegue, equipo y cercanía al producto. Para una interfaz web, JavaScript reduce fronteras. Para análisis y notebooks, Python suele tener herramientas más directas. Un contrato común permite cambiar sin mezclar código.',
      errors: 'Pyodide no convierte el navegador en un servidor Python. No ofrece sockets arbitrarios ni acceso al sistema de archivos del equipo. Las peticiones de red siguen las reglas de CORS del navegador.',
      keyPoints: ['Cada lenguaje conserva su propio código.', 'Python corre en un Worker para proteger la interfaz.', 'El navegador limita red y archivos aunque el lenguaje sea Python.'],
      question: '¿El Python del navegador es idéntico al de mi servidor?', answer: 'Comparte gran parte del lenguaje, pero el entorno cambia. Paquetes con binarios no compilados para Pyodide, procesos, sockets y acceso al equipo pueden no estar disponibles.',
      transfer: 'Elige un lenguaje para una interfaz de chat y otro para un análisis de documentos. Justifica cada decisión con una restricción concreta.',
      sources: ['pyodide-usage', 'pyodide-worker', 'transformers-js'],
    },
    reasoning: {
      activity: decisionActivity('Relaciona tarea y entorno inicial.', [
        ['ui', 'Actualizar una interfaz al pulsar un botón', ['javascript', 'python'], 'javascript'],
        ['tabla', 'Explorar una tabla con bibliotecas científicas', ['javascript', 'python'], 'python'],
        ['api', 'Llamar una API desde el navegador', ['ambos', 'ninguno'], 'ambos'],
      ]),
      explanation: 'Los dos lenguajes pueden llamar APIs. La decisión se apoya en el entorno y las bibliotecas, no en una prohibición artificial.',
      hints: ['Piensa dónde vive la interfaz.', 'Pyodide sigue dentro del navegador.'],
    },
    debug: { title: 'Todas las tareas usan JavaScript', expected: 'La función distingue interfaz y datos.', observed: 'Siempre devuelve JavaScript.', hints: ['Prueba la entrada datos.', 'La respuesta fija ignora tarea.', 'Añade una decisión antes de devolver.'] },
  }),
  authoredLesson({
    number: 4, module: 0, title: 'HTTP, JSON, variables de entorno y claves',
    summary: 'Construye una solicitud sin filtrar secretos y distingue configuración pública de credenciales.',
    concepts: [['HTTP', 'Protocolo de solicitud y respuesta usado por APIs web.'], ['JSON', 'Formato de datos con objetos, listas y valores simples.'], ['Secreto', 'Credencial que otorga acceso y no debe formar parte del código cliente publicado.']],
    requires: ['elegir-runtime'], skill: 'proteger-claves-api',
    mentalModel: 'La URL identifica el recurso; los encabezados transportan autorización; el cuerpo contiene datos de la tarea.',
    script: [
      'Una llamada a un modelo sigue siendo una solicitud HTTP. Tiene URL, método, encabezados, cuerpo y una respuesta que puede fallar.',
      'JSON transporta datos, no confianza. Debes validar su forma. Una clave en la URL, el código o el almacenamiento del navegador puede quedar expuesta.',
      'El ejemplo revisa una configuración de aprendizaje. Solo permite HTTPS remoto y rechaza una clave colocada en la URL.',
      'Completa la comprobación. Localhost puede usar HTTP durante desarrollo, pero una dirección remota necesita HTTPS y la clave nunca va en la URL.',
    ],
    javascript: {
      example: `function configuracion_segura(url, clave_en_url) {
  const es_local = url.startsWith('http://localhost');
  const usa_https = url.startsWith('https://');
  return (es_local || usa_https) && !clave_en_url;
}

console.log(configuracion_segura('https://api.example.com', false));`,
      starter: `function configuracion_segura(url, clave_en_url) {
  // Acepta HTTPS o localhost y rechaza claves en la URL.
}`,
      solution: `function configuracion_segura(url, clave_en_url) {
  const transporte_valido = url.startsWith('https://') || url.startsWith('http://localhost');
  return transporte_valido && !clave_en_url;
}`,
      debugStarter: `function configuracion_segura(url, clave_en_url) {
  return url.includes('http');
}`,
    },
    python: {
      example: `def configuracion_segura(url, clave_en_url):
    es_local = url.startswith("http://localhost")
    usa_https = url.startswith("https://")
    return (es_local or usa_https) and not clave_en_url

print(configuracion_segura("https://api.example.com", False))`,
      starter: `def configuracion_segura(url, clave_en_url):
    # Acepta HTTPS o localhost y rechaza claves en la URL.
    pass`,
      solution: `def configuracion_segura(url, clave_en_url):
    transporte_valido = url.startswith("https://") or url.startswith("http://localhost")
    return transporte_valido and not clave_en_url`,
      debugStarter: `def configuracion_segura(url, clave_en_url):
    return "http" in url`,
    },
    practice: {
      title: 'Revisa una configuración', instructions: 'Implementa configuracion_segura(url, clave_en_url). Acepta HTTPS remoto o localhost y nunca una clave en la URL.', functionName: 'configuracion_segura',
      cases: [
        { args: ['https://api.example.com/v1', false], expected: true, description: 'Acepta transporte cifrado sin credencial en la URL' },
        { args: ['http://api.example.com/v1?key=abc', true], expected: false, description: 'Rechaza HTTP remoto y una clave visible' },
        { args: ['http://localhost:11434/v1', false], expected: true, description: 'Permite localhost durante desarrollo' },
      ],
      hints: ['Comprueba el inicio de la URL, no una coincidencia en cualquier lugar.', 'Separa transporte_valido de clave_en_url.', 'El resultado final combina ambas condiciones con y.'],
    },
    reading: {
      core: 'HTTP organiza una conversación: el cliente envía método, URL, encabezados y cuerpo; el servidor responde con estado, encabezados y cuerpo. Un estado 200 no garantiza que el JSON tenga la forma que tu programa necesita.',
      mechanics: 'Las APIs suelen recibir JSON con modelo, mensajes y parámetros. La autenticación viaja en un encabezado. En este curso una clave opcional se mantiene solo en memoria y se borra al recargar. Aun así puede verse con herramientas de desarrollo.',
      decisions: 'Usa claves de aprendizaje con permisos y saldo limitados. Para publicar, mueve la llamada a un backend que conserve el secreto, autentique al usuario, aplique cuotas y valide cada salida antes de devolverla.',
      errors: 'Una variable de entorno incluida por una herramienta de build en el código del navegador deja de ser secreta. Guardar la clave en localStorage facilita que cualquier script con acceso al origen la lea. Añadirla a la URL la expone en historial y registros.',
      keyPoints: ['El JSON recibido siempre se valida.', 'Una clave de navegador es visible y solo sirve para aprendizaje controlado.', 'La versión publicada debe usar un backend seguro.'],
      question: '¿Poner la clave en una variable de entorno de Vite la oculta?', answer: 'No si esa variable se incorpora al bundle del navegador. El usuario puede inspeccionar el código y las solicitudes. Los secretos reales permanecen en el servidor.',
      transfer: 'Dibuja una solicitud y marca qué dato pertenece a URL, encabezados y cuerpo. Señala también dónde validarías la respuesta.',
      sources: ['google-structured-output', 'openai-function-calling', 'owasp-genai-top10'],
    },
    reasoning: {
      activity: flowActivity('Conecta una llamada de API segura para aprendizaje.', [
        ['inicio', 'Preparar solicitud', 'start'], ['validar', 'Validar URL y configuración', 'decision'], ['enviar', 'Enviar JSON con clave en encabezado', 'process'], ['respuesta', 'Validar estado y cuerpo', 'process'], ['usar', 'Usar datos aprobados', 'end'],
      ], [['inicio', 'validar'], ['validar', 'enviar', 'válida'], ['enviar', 'respuesta'], ['respuesta', 'usar', 'válida']]),
      explanation: 'La validación ocurre antes y después de la red. La clave autoriza la petición, pero no convierte la respuesta en confiable.',
      hints: ['La URL se comprueba antes de enviar.', 'El cuerpo se valida antes de usar sus campos.'],
    },
    debug: { title: 'Cualquier texto con http parece seguro', expected: 'Solo HTTPS remoto o localhost sin clave en URL se aceptan.', observed: 'La función acepta cadenas que contienen http en cualquier posición.', hints: ['Prueba http remoto.', 'includes no comprueba el protocolo al inicio.', 'Combina startsWith con la negación de clave_en_url.'] },
  }),
];
