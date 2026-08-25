import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { EditorView, hoverTooltip } from '@codemirror/view';

export type SpanishLspLevel =
  | 'program-basics'
  | 'variables'
  | 'conversions'
  | 'operators'
  | 'functions'
  | 'conditionals'
  | 'loops'
  | 'arrays'
  | 'objects'
  | 'array-transformations'
  | 'string-methods'
  | 'modules'
  | 'dom'
  | 'events'
  | 'dom-input'
  | 'json-storage'
  | 'async'
  | 'network'
  | 'classes'
  | 'web-components'
  | 'wc-inheritance'
  | 'wc-lifecycle'
  | 'wc-api'
  | 'wc-composition'
  | 'lit-core'
  | 'lit-reactivity'
  | 'lit-lifecycle'
  | 'lit-directives'
  | 'lit-async'
  | 'lit-architecture'
  | 'lit-custom-directives'
  | 'lit-ssr'
  | 'testing';

export interface DocEntry {
  label: string;
  type: 'keyword' | 'variable' | 'function' | 'property';
  level: SpanishLspLevel;
  detail: string;
  info: string;
  apply?: string;
}

const SPANISH_DOCS: DocEntry[] = [
  {
    label: 'console',
    type: 'variable',
    level: 'program-basics',
    detail: 'herramienta para observar mensajes del programa',
    info: 'Receptor: la consola del navegador.\n\nUso habitual:\nconsole.log("mensaje")\n\nError común:\nEscribir console.log sin paréntesis solo nombra la función; no la ejecuta.',
  },
  {
    label: 'log',
    type: 'function',
    level: 'program-basics',
    detail: 'muestra uno o varios valores en la consola',
    info: 'Receptor: console\nParámetros: valores que quieres observar\nRetorno: undefined\nMutación: no cambia los valores\n\nEjemplo:\nconsole.log("Hola")',
  },
  {
    label: 'document',
    type: 'variable',
    level: 'dom',
    detail: 'representa la página HTML',
    info: 'Es la página que ves. Con él puedes buscar recuadros por su id.\n\nEjemplo:\ndocument.getElementById("saludo")',
  },
  {
    label: 'getElementById',
    type: 'function',
    level: 'dom',
    detail: 'busca un recuadro por su id',
    info: 'Busca en la página el elemento que tiene id="...".\n\nParámetro:\n  id: texto entre comillas, sin #\n\nDevuelve:\n  el recuadro o null si no existe\n\nEjemplo:\ndocument.getElementById("linea1")',
    apply: 'getElementById',
  },
  {
    label: 'textContent',
    type: 'property',
    level: 'dom',
    detail: 'texto dentro del recuadro',
    info: 'Es lo que se lee dentro del recuadro. Puedes leerlo o cambiarlo.\n\nEscribir:\ncaja.textContent = "Hola";\n\nLeer:\nlet texto = caja.textContent;',
  },
  {
    label: 'const',
    type: 'keyword',
    level: 'variables',
    detail: 'crea un nombre que no se reasigna',
    info: 'Guarda un valor con nombre. Usa const cuando no vas a reemplazar ese valor después.\n\nEjemplo:\nconst nombre = "Ana";',
  },
  {
    label: 'let',
    type: 'keyword',
    level: 'variables',
    detail: 'crea un nombre cuyo valor puede cambiar',
    info: 'Usa let cuando el programa necesita reasignar el valor.\n\nEjemplo:\nlet intentos = 0;\nintentos = 1;',
  },
  {
    label: 'Number',
    type: 'function',
    level: 'conversions',
    detail: 'convierte texto a número',
    info: 'Convierte un texto que parece número en un número de verdad.\n\nEjemplo:\nNumber("25") → 25\nNumber("hola") → NaN',
  },
  {
    label: 'String',
    type: 'function',
    level: 'conversions',
    detail: 'convierte un dato a texto',
    info: 'Convierte cualquier dato a texto.\n\nEjemplo:\nString(25) → "25"',
  },
  {
    label: 'function',
    type: 'keyword',
    level: 'functions',
    detail: 'define una tarea reutilizable',
    info: 'Define una función con nombre y parámetros. Definirla no la ejecuta.\n\nEjemplo:\nfunction doble(numero) {\n  return numero * 2;\n}',
  },
  {
    label: 'return',
    type: 'keyword',
    level: 'functions',
    detail: 'entrega el resultado de una función',
    info: 'Termina la llamada actual y devuelve un valor a quien llamó la función.\n\nEjemplo:\nreturn ancho * alto;',
  },
  {
    label: 'if',
    type: 'keyword',
    level: 'conditionals',
    detail: 'ejecuta un camino cuando la condición es verdadera',
    info: 'La condición va entre paréntesis y produce true o false.\n\nEjemplo:\nif (edad >= 18) {\n  return "Puede entrar";\n}',
  },
  {
    label: 'else',
    type: 'keyword',
    level: 'conditionals',
    detail: 'cubre el caso contrario',
    info: 'Se ejecuta cuando la condición del if anterior fue false. Úsalo cuando los caminos son excluyentes.',
  },
  {
    label: 'for',
    type: 'keyword',
    level: 'loops',
    detail: 'repite un bloque con inicio, condición y paso',
    info: 'Úsalo para recorrer una cantidad conocida de posiciones.\n\nEjemplo:\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
  },
  {
    label: 'while',
    type: 'keyword',
    level: 'loops',
    detail: 'repite mientras una condición sea verdadera',
    info: 'La condición debe poder llegar a false. Si nunca cambia, el bucle no termina.',
  },
  {
    label: 'length',
    type: 'property',
    level: 'arrays',
    detail: 'cantidad de elementos de una lista',
    info: 'length cuenta elementos. Como los índices empiezan en 0, el último índice es length - 1.\n\nEjemplo:\nfrutas.length',
  },
  {
    label: 'push',
    type: 'function',
    level: 'arrays',
    detail: 'agrega un elemento al final del array',
    info: 'Modifica el array y devuelve su nueva longitud.\n\nEjemplo:\nfrutas.push("uva");',
  },
  {
    label: 'pop',
    type: 'function',
    level: 'arrays',
    detail: 'quita y devuelve el último elemento',
    info: 'Modifica el array retirando lo último. Es la operación de salida típica de una pila.',
  },
  {
    label: 'trim',
    type: 'function',
    level: 'string-methods',
    detail: 'quita espacios de los extremos de un string',
    info: 'Receptor: string\nParámetros: ninguno\nRetorno: un string nuevo\nMutación: no cambia el original\n\nEjemplo:\n"  Ana ".trim() → "Ana"\n\nError común:\nOlvidar guardar o devolver el resultado.',
  },
  {
    label: 'toUpperCase',
    type: 'function',
    level: 'string-methods',
    detail: 'devuelve el texto en mayúsculas',
    info: 'Receptor: string\nParámetros: ninguno\nRetorno: un string nuevo\nMutación: no cambia el original\n\nEjemplo:\n"Ana".toUpperCase() → "ANA"',
  },
  {
    label: 'includes',
    type: 'function',
    level: 'string-methods',
    detail: 'comprueba si un string o array contiene un valor',
    info: 'Receptor: string o array\nParámetro: valor buscado\nRetorno: true o false\nMutación: no modifica el receptor\n\nEjemplo:\n["Ana", "Luis"].includes("Luis") → true',
  },
  {
    label: 'endsWith',
    type: 'function',
    level: 'string-methods',
    detail: 'comprueba cómo termina un string',
    info: 'Receptor: string\nParámetro: terminación buscada\nRetorno: booleano\nMutación: no cambia el texto\n\nEjemplo:\n"app.js".endsWith(".js") → true',
  },
  {
    label: 'map',
    type: 'function',
    level: 'array-transformations',
    detail: 'crea un array nuevo transformando cada elemento',
    info: 'La función recibe un elemento y debe devolver su versión transformada. El array original no se modifica.\n\nEjemplo:\nfunction duplicar(n) { return n * 2; }\nnumeros.map(duplicar)',
  },
  {
    label: 'filter',
    type: 'function',
    level: 'array-transformations',
    detail: 'crea un array nuevo conservando algunos elementos',
    info: 'Conserva los elementos para los que la función devuelve true.\n\nEjemplo:\nfunction esPar(n) { return n % 2 === 0; }\nnumeros.filter(esPar)',
  },
  {
    label: 'find',
    type: 'function',
    level: 'array-transformations',
    detail: 'devuelve el primer elemento que cumple una condición',
    info: 'Receptor: array\nParámetro: función de prueba\nRetorno: el primer elemento o undefined\nMutación: no cambia el array\n\nError común:\nEsperar una lista; find devuelve un elemento.',
  },
  {
    label: 'export',
    type: 'keyword',
    level: 'modules',
    detail: 'expone una capacidad de un módulo',
    info: 'Permite que otro archivo importe una función o dato. Exporta solo la interfaz pública necesaria.\n\nEjemplo:\nexport function total(a, b) { return a + b; }',
  },
  {
    label: 'import',
    type: 'keyword',
    level: 'modules',
    detail: 'declara una dependencia con otro módulo',
    info: 'Trae una capacidad exportada por otro archivo. La ruta relativa suele empezar con ./\n\nEjemplo:\nimport { total } from "./reglas.js";\n\nError común:\nCrear importaciones circulares.',
  },
  {
    label: 'addEventListener',
    type: 'function',
    level: 'events',
    detail: 'escucha un evento, como click',
    info: 'Dice: “cuando pase esto, corre estas líneas”.\n\nParámetros:\n  evento: "click", entre comillas\n  función: lo que debe correr después\n\nEjemplo:\nfunction responderAlClick() {\n  caja.textContent = "Hola";\n}\nboton.addEventListener("click", responderAlClick);',
    apply: 'addEventListener',
  },
  {
    label: 'querySelector',
    type: 'function',
    level: 'events',
    detail: 'busca el primer elemento que coincide',
    info: 'Busca con un selector CSS. Para un id usa "#saludo".\n\nEjemplo:\ndocument.querySelector("#saludo")',
  },
  {
    label: 'click',
    type: 'property',
    level: 'events',
    detail: 'evento de clic',
    info: 'Se dispara cuando el usuario pulsa el elemento.',
  },
  {
    label: 'value',
    type: 'property',
    level: 'dom-input',
    detail: 'valor de un input',
    info: 'Es lo que el usuario escribió en un input.\n\nEjemplo:\nlet nombre = input.value;',
  },
  {
    label: 'JSON', type: 'variable', level: 'json-storage', detail: 'convierte entre datos compatibles y texto JSON',
    info: 'Métodos principales:\nJSON.stringify(dato) produce texto.\nJSON.parse(texto) reconstruye datos.\n\nError común:\nparse lanza un error si el texto no es JSON válido.',
  },
  {
    label: 'localStorage', type: 'variable', level: 'json-storage', detail: 'almacena pares clave-texto en el navegador',
    info: 'Receptor: almacenamiento del origen.\nMétodos: setItem, getItem, removeItem.\nRetorno de getItem: string o null.\n\nNo guardes contraseñas ni secretos.',
  },
  {
    label: 'async', type: 'keyword', level: 'async', detail: 'declara una función que devuelve una Promise',
    info: 'Una función async siempre devuelve una Promise. Dentro puedes usar await.\n\nEjemplo:\nasync function cargar() { return 3; }',
  },
  {
    label: 'await', type: 'keyword', level: 'async', detail: 'espera el resultado de una Promise dentro de async',
    info: 'Recibe: un valor o Promise.\nResultado: el valor cumplido.\nSi se rechaza, lanza el motivo del rechazo.\n\nError común: olvidar await y tratar la Promise como si fueran los datos.',
  },
  {
    label: 'fetch', type: 'function', level: 'network', detail: 'inicia una petición y devuelve Promise<Response>',
    info: 'Parámetros: URL y opciones opcionales.\nRetorno: Promise<Response>.\n\nImportante: comprueba response.ok antes de leer el cuerpo.',
  },
  {
    label: 'class', type: 'keyword', level: 'classes', detail: 'define cómo crear objetos que comparten métodos',
    info: 'Usa constructor para el estado inicial y métodos para comportamiento compartido.\n\nEjemplo:\nclass Tarea { constructor(texto) { this.texto = texto; } }',
  },
  {
    label: 'constructor', type: 'function', level: 'classes', detail: 'inicializa una instancia creada con new',
    info: 'Recibe los argumentos entregados a new. Usa this para guardar propiedades en esa instancia.',
  },
  {
    label: 'customElements', type: 'variable', level: 'web-components', detail: 'registro de elementos personalizados',
    info: 'Método principal: define(nombre, clase).\nEl nombre debe contener un guion.\n\nEjemplo:\ncustomElements.define("aviso-simple", AvisoSimple);',
  },
  {
    label: 'attachShadow', type: 'function', level: 'web-components', detail: 'crea un árbol Shadow DOM en el elemento',
    info: 'Receptor: un elemento.\nParámetro habitual: { mode: "open" }.\nRetorno: ShadowRoot.\n\nEs encapsulación, no seguridad.',
  },
  {
    label: 'HTMLElement', type: 'variable', level: 'wc-inheritance', detail: 'clase base de los elementos HTML',
    info: 'Un componente nativo hereda capacidades reales del navegador desde HTMLElement.\n\nEjemplo:\nclass StatusBadge extends HTMLElement { ... }',
  },
  {
    label: 'extends', type: 'keyword', level: 'wc-inheritance', detail: 'declara que una clase hereda de otra',
    info: 'Conecta la clase nueva con una clase base. La instancia conserva los métodos y reglas de esa base.\n\nEjemplo:\nclass StatusBadge extends HTMLElement { ... }',
  },
  {
    label: 'super', type: 'function', level: 'wc-inheritance', detail: 'inicializa o continúa el comportamiento de la clase base',
    info: 'En un constructor derivado, super() inicializa la parte heredada y debe ejecutarse antes de usar this. En callbacks sobrescritos, super.metodo() conserva el contrato de la clase base.\n\nNo es una formalidad: sin él la instancia heredada queda incompleta o Lit pierde parte de su ciclo.',
  },
  {
    label: 'connectedCallback', type: 'function', level: 'wc-lifecycle', detail: 'se ejecuta cuando el elemento entra en un documento',
    info: 'Úsalo para iniciar trabajo que depende de estar conectado: listeners externos, timers u observadores. Puede ejecutarse más de una vez, así que debe tolerar reconexiones.',
  },
  {
    label: 'disconnectedCallback', type: 'function', level: 'wc-lifecycle', detail: 'se ejecuta cuando el elemento sale del documento',
    info: 'Libera timers, listeners, observadores y suscripciones que el componente inició al conectarse. La limpieza debe usar las mismas referencias creadas antes.',
  },
  {
    label: 'observedAttributes', type: 'property', level: 'wc-api', detail: 'lista los atributos que activan observación',
    info: 'Devuelve los nombres que interesan al componente. Solo esos cambios llaman attributeChangedCallback.\n\nEjemplo:\nstatic get observedAttributes() { return ["value"]; }',
  },
  {
    label: 'attributeChangedCallback', type: 'function', level: 'wc-api', detail: 'reacciona a un atributo observado',
    info: 'Parámetros: nombre, valor anterior y valor nuevo. Convierte el texto del atributo al tipo interno antes de usarlo y evita ciclos al reflejar.',
  },
  {
    label: 'CustomEvent', type: 'function', level: 'wc-api', detail: 'crea un evento con datos de dominio',
    info: 'Usa detail para el dato público y composed/bubbles cuando el evento debe atravesar composición o Shadow DOM.\n\nEjemplo:\nnew CustomEvent("quantity-change", { detail: { value }, bubbles: true, composed: true })',
  },
  {
    label: 'slot', type: 'property', level: 'wc-composition', detail: 'punto donde el consumidor compone contenido',
    info: 'Un slot conserva la propiedad del contenido en el consumidor. Usa nombres cuando existen regiones distintas y ofrece fallback cuando la región puede quedar vacía.',
  },
  {
    label: 'LitElement', type: 'variable', level: 'lit-core', detail: 'clase base reactiva de Lit sobre HTMLElement',
    info: 'LitElement sigue siendo un HTMLElement. Lit programa actualizaciones, renderiza templates y administra estilos; registro, eventos, Shadow DOM y ciclo siguen siendo APIs web.',
  },
  {
    label: 'html', type: 'function', level: 'lit-core', detail: 'crea un template seguro a partir de strings estáticos y valores',
    info: 'Se usa como etiqueta de template literal. Las expresiones se enlazan como texto, propiedad, atributo o evento según su prefijo. No construyas el template concatenando HTML remoto.',
  },
  {
    label: 'render', type: 'function', level: 'lit-core', detail: 'describe la interfaz a partir del estado vigente',
    info: 'En LitElement, render() devuelve un template y debe evitar efectos secundarios. Puede ejecutarse muchas veces: no crees listeners externos, tareas o timers aquí.',
  },
  {
    label: 'properties', type: 'property', level: 'lit-reactivity', detail: 'declara propiedades reactivas y su conversión',
    info: 'static properties define tipo, atributo, reflexión o estado interno. Cambiar una propiedad reactiva programa una actualización; los objetos mutados sin nueva referencia pueden no hacerlo.',
  },
  {
    label: 'updateComplete', type: 'property', level: 'lit-lifecycle', detail: 'Promise que termina al completar la actualización pendiente',
    info: 'Usa await this.updateComplete cuando necesitas consultar el DOM que acaba de producir Lit. No reemplaza el estado ni debe usarse como temporizador general.',
  },
  {
    label: 'repeat', type: 'function', level: 'lit-directives', detail: 'renderiza listas conservando identidad por clave',
    info: 'Parámetros: colección, función de clave y template de fila. La clave debe ser única y estable; evita el índice cuando los elementos pueden moverse o eliminarse.',
  },
  {
    label: 'Task', type: 'variable', level: 'lit-async', detail: 'controlador de trabajo asíncrono ligado a argumentos',
    info: 'Se crea una vez en la instancia. args decide cuándo reiniciar y render permite representar pending, complete y error. Pasa signal a APIs cancelables y contempla también el estado vacío.',
  },
  {
    label: 'addController', type: 'function', level: 'lit-architecture', detail: 'registra un Reactive Controller en el host',
    info: 'El controlador participa en conexión, desconexión y actualización del host. Úsalo para lógica reutilizable con ciclo propio, no para esconder cualquier función.',
  },
  {
    label: 'Directive', type: 'variable', level: 'lit-custom-directives', detail: 'clase base para una directiva personalizada',
    info: 'Una directiva actúa sobre una parte específica del template. Valida el tipo de Part, mantiene una responsabilidad estrecha y no almacena reglas de negocio del componente.',
  },
  {
    label: 'hydrate', type: 'function', level: 'lit-ssr', detail: 'conecta comportamiento cliente con HTML renderizado en servidor',
    info: 'La hidratación conserva contenido significativo y añade interacción. El render debe ser estable entre servidor y cliente; protege window, document y otras APIs exclusivas del navegador.',
  },
  {
    label: 'describe', type: 'function', level: 'testing', detail: 'agrupa casos de prueba relacionados',
    info: 'Úsalo para nombrar una capacidad observable. Las pruebas deben comprobar resultados, fronteras e inválidos.',
  },
];

const LESSON_LEVELS: Record<string, SpanishLspLevel[]> = {
  'fundamentos-01': ['program-basics'],
  'fundamentos-02': ['program-basics'],
  'fundamentos-03': ['program-basics', 'variables'],
  'fundamentos-04': ['program-basics', 'variables', 'operators'],
  'fundamentos-07': ['program-basics', 'variables', 'operators', 'functions'],
  'fundamentos-05': ['program-basics', 'variables', 'operators', 'functions', 'conditionals'],
  'fundamentos-06': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops'],
  'fundamentos-08': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays'],
  'fundamentos-09': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects'],
  'fundamentos-10': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom'],
  'fundamentos-11': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events'],
  'fundamentos-12': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-13': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-14': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-15': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input'],
  'fundamentos-16': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods'],
  'fundamentos-17': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods'],
  'fundamentos-18': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods'],
  'fundamentos-19': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations'],
  'fundamentos-20': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations'],
  'fundamentos-21': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations'],
  'fundamentos-22': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations', 'modules'],
  'fundamentos-23': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations', 'modules'],
  'fundamentos-24': ['program-basics', 'variables', 'operators', 'functions', 'conditionals', 'loops', 'arrays', 'objects', 'dom', 'events', 'dom-input', 'string-methods', 'array-transformations', 'modules'],
};

const JS_STAGE_LEVELS: Array<[number, SpanishLspLevel[]]> = [
  [1, ['program-basics']],
  [2, ['variables']],
  [3, ['conversions', 'operators']],
  [4, ['conditionals']],
  [5, ['functions']],
  [6, ['loops']],
  [8, ['string-methods']],
  [9, ['arrays']],
  [10, ['array-transformations']],
  [11, ['objects']],
  [13, ['dom']],
  [14, ['events', 'dom-input']],
  [17, ['json-storage']],
  [18, ['async']],
  [20, ['network']],
  [21, ['modules']],
  [22, ['classes']],
  [23, ['web-components']],
  [24, ['testing']],
];

for (let lesson = 1; lesson <= 24; lesson += 1) {
  const levels = JS_STAGE_LEVELS
    .filter(([startsAt]) => startsAt <= lesson)
    .flatMap(([, stageLevels]) => stageLevels);
  LESSON_LEVELS[`javascript-${String(lesson).padStart(2, '0')}`] = [...new Set(levels)];
}

const COMPONENT_STAGE_LEVELS: Array<[number, SpanishLspLevel[]]> = [
  [1, ['web-components']],
  [2, ['wc-inheritance']],
  [3, ['wc-lifecycle']],
  [5, ['wc-api']],
  [8, ['wc-composition']],
  [15, ['lit-core']],
  [18, ['lit-reactivity']],
  [22, ['lit-lifecycle']],
  [27, ['lit-directives']],
  [29, ['lit-async']],
  [30, ['lit-architecture']],
  [33, ['lit-custom-directives']],
  [39, ['lit-ssr']],
];

const COMPONENT_BASE_LEVELS = LESSON_LEVELS['javascript-24'] || [];
for (let lesson = 1; lesson <= 45; lesson += 1) {
  const levels = COMPONENT_STAGE_LEVELS
    .filter(([startsAt]) => startsAt <= lesson)
    .flatMap(([, stageLevels]) => stageLevels);
  LESSON_LEVELS[`componentes-lit-${String(lesson).padStart(2, '0')}`] = [...new Set([...COMPONENT_BASE_LEVELS, ...levels])];
}

export function getSpanishDocsForLesson(lessonId?: string): DocEntry[] {
  const levels = (lessonId && LESSON_LEVELS[lessonId]) || LESSON_LEVELS['fundamentos-01'];
  return SPANISH_DOCS.filter((entry) => levels.includes(entry.level));
}

export function getSpanishDocByLabel(label: string, lessonId?: string): DocEntry | undefined {
  const normalized = label.replace(/\(\)$/, '').toLowerCase();
  return getSpanishDocsForLesson(lessonId)
    .find((entry) => entry.label.toLowerCase() === normalized);
}

const SPANISH_WORD_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*/g;

export interface SpanishWordMatch {
  text: string;
  from: number;
  to: number;
}

/**
 * Finds a complete JavaScript-like identifier at the given character position.
 * CodeMirror's `wordAt` depends on editor language, while our docs are keyed by
 * identifiers such as `getElementById`.
 */
export function findSpanishWordAt(code: string, position: number): SpanishWordMatch | null {
  if (!code) return null;
  const boundedPosition = Math.max(0, Math.min(position, code.length));
  SPANISH_WORD_PATTERN.lastIndex = 0;

  for (const match of code.matchAll(SPANISH_WORD_PATTERN)) {
    const from = match.index ?? 0;
    const to = from + match[0].length;
    if (boundedPosition >= from && boundedPosition < to) {
      return { text: match[0], from, to };
    }
  }

  return null;
}

function createCompletionSource(lessonId?: string) {
  const availableDocs = getSpanishDocsForLesson(lessonId);

  return function lessonSpanishCompletionSource(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const prefix = word.text.toLowerCase();
    const options = availableDocs
      .filter((entry) => entry.label.toLowerCase().startsWith(prefix))
      .map((entry) => ({
        label: entry.label,
        type: entry.type,
        detail: entry.detail,
        info: entry.info,
        apply: entry.apply || entry.label,
        boost: 90,
      }));

    if (options.length === 0) return null;
    return { from: word.from, options };
  };
}

function tooltipHtml(entry: DocEntry): string {
  const escapedInfo = entry.info
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<strong style="color:#f8fafc">${entry.label}</strong> <em style="color:#94a3b8">${entry.detail}</em><br><span style="color:#cbd5e1">${escapedInfo.replace(/\n/g, '<br>')}</span>`;
}

function createHoverTooltip(lessonId?: string) {
  const docMapByLowerLabel = new Map(
    getSpanishDocsForLesson(lessonId).map((entry) => [entry.label.toLowerCase(), entry])
  );

  return hoverTooltip((view: EditorView, pos: number, side: -1 | 1) => {
    const code = view.state.sliceDoc(0, view.state.doc.length);
    // When the pointer is immediately after an identifier, inspect its last
    // character instead of the operator or whitespace that follows it.
    const lookupPosition = Math.max(0, Math.min(side < 0 ? pos - 1 : pos, code.length));
    const word = findSpanishWordAt(code, lookupPosition);
    if (!word) return null;

    const entry = docMapByLowerLabel.get(word.text.toLowerCase());
    if (!entry) return null;

    return {
      pos: word.from,
      end: word.to,
      above: true,
      create() {
        const dom = document.createElement('div');
        dom.className = 'cm-tooltip-doc';
        dom.style.maxWidth = '320px';
        dom.style.padding = '8px 10px';
        dom.style.fontSize = '12px';
        dom.style.lineHeight = '1.4';
        dom.style.whiteSpace = 'pre-wrap';
        dom.innerHTML = tooltipHtml(entry);
        return { dom };
      },
    };
  });
}

export const spanishCompletionSource = createCompletionSource();
export const spanishHoverTooltip = createHoverTooltip();

export function createSpanishCompletionSource(lessonId?: string) {
  return createCompletionSource(lessonId);
}

export function createSpanishHoverTooltip(lessonId?: string) {
  return createHoverTooltip(lessonId);
}
