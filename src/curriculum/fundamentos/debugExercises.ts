import { DebuggingExerciseItem } from '../../types/curriculum';
import { ChallengeTest } from '../../types/scrim';
import { file, workspaceOf } from '../../engine/lessonCompiler';
import { ADVANCED_DEBUG_EXERCISES } from './debugExercisesAdvanced';

const SHELL_CSS = `* { box-sizing: border-box; }
html, body { margin: 0; background: #12151e; color: #f8fafc; }
body {
  min-height: 100vh;
  padding: 28px 24px 40px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
main { width: min(440px, 100%); }
.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #aab3c4;
}
h1 {
  margin: 0 0 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #343a49;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.hint { margin: 0 0 16px; color: #cbd5e1; font-size: 15px; line-height: 1.45; }
#salida, .salida {
  min-height: 1.5em;
  margin: 0 0 16px;
  padding-top: 12px;
  border-top: 1px solid #343a49;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  font-weight: 600;
  white-space: pre-wrap;
}
button {
  padding: 8px 14px;
  border: 1px solid #ffe600;
  background: #ffe600;
  color: #12151e;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
button:hover { background: #fff04d; }
label { display: block; margin: 0 0 6px; font-size: 13px; color: #cbd5e1; }
input {
  margin: 0 0 12px;
  padding: 6px 8px;
  border: 1px solid #596174;
  background: #1b1f2a;
  color: #f8fafc;
  font: inherit;
  width: 120px;
}
`;

function htmlPage(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p class="eyebrow">Encuentra el error</p>
    <h1>${title}</h1>
    ${inner}
  </main>
  <script src="app.js"></script>
</body>
</html>`;
}

function workspace(title: string, inner: string, js: string) {
  return workspaceOf('app.js', {
    'index.html': file('index.html', htmlPage(title, inner)),
    'style.css': file('style.css', SHELL_CSS),
    'app.js': file('app.js', js),
  });
}

function fn(
  id: string,
  description: string,
  targetFunction: string,
  args: unknown[],
  expectedReturn: unknown,
  hintTip: string
): ChallengeTest {
  return {
    id,
    description,
    validatorType: 'function-call',
    targetFunction,
    args,
    expectedReturn,
    hintTip,
    errorMessage: 'Todavía no hace lo que debería. Relee la clase y prueba otra vez.',
  };
}

function exercise(
  relatedLessonId: string,
  title: string,
  description: string,
  expectedBehavior: string,
  observedBehavior: string,
  inner: string,
  js: string,
  tests: ChallengeTest[],
  hints: { level: number; text: string }[],
  troubleshootingTips: string[]
): DebuggingExerciseItem {
  const lessonNumber = Number(relatedLessonId.slice(-2));
  return {
    id: `${relatedLessonId}-debug`,
    relatedLessonId,
    title,
    type: 'debugging',
    executionMode: lessonNumber >= 10 && lessonNumber <= 14 ? 'browser' : 'logic',
    estimatedMinutes: 6,
    description,
    templateId: 'vanilla-js',
    initialWorkspace: workspace(title, inner, js),
    expectedBehavior,
    observedBehavior,
    tests,
    hints,
    troubleshootingTips,
  };
}

const BEGINNER_DEBUG_EXERCISES: DebuggingExerciseItem[] = [
  exercise(
    'fundamentos-01',
    'Las instrucciones no se ejecutan',
    'El programa debería mostrar dos mensajes, pero las líneas solo nombran la herramienta.',
    'La consola muestra “Me llamo Ana” y después “Estoy aprendiendo JavaScript”.',
    'No aparece ninguna salida porque faltan las llamadas con paréntesis y texto.',
    `<p class="hint">Abre la consola después de ejecutar. No hay error, pero tampoco mensajes.</p>
    <p class="salida">Revisa app.js una línea a la vez.</p>`,
    `console.log;
console.log;
`,
    [
      { id: 'primera-cerrada', description: 'La primera instrucción cierra texto y paréntesis', validatorType: 'source-regex', regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Me llamo Ana["\\\']\\s*\\)\\s*;?', errorMessage: 'La primera llamada todavía no cierra correctamente.', hintTip: 'Después de la segunda comilla debe cerrarse el paréntesis.' },
      { id: 'segunda-completa', description: 'La segunda línea también llama a console.log con su texto', validatorType: 'source-regex', regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Estoy aprendiendo JavaScript["\\\']\\s*\\)\\s*;?', errorMessage: 'La segunda línea todavía nombra log sin entregarle el mensaje.', hintTip: 'Aplica a la segunda línea la misma lista de cierre: llamada, texto y paréntesis.' },
    ],
    [
      { level: 1, text: 'Nombrar log no es lo mismo que llamarlo. ¿Dónde van los datos que quieres mostrar?' },
      { level: 2, text: 'Una llamada usa paréntesis después de log.' },
      { level: 3, text: 'Vuelve al ejemplo de console.log de la lectura y usa su lista de signos para revisar cada línea, sin copiar el programa completo.' },
    ],
    ['No necesitas DOM, variables ni funciones propias.', 'Corrige una sola pieza y vuelve a ejecutar.']
  ),

  exercise(
    'fundamentos-02',
    'Los pasos están desordenados',
    'El programa describe cómo lavarse las manos, pero empieza por secarlas y una acción quedó convertida en comentario.',
    'La consola debe mostrar abrir el grifo, usar jabón y secar las manos, en ese orden.',
    'Las líneas usan una sintaxis válida, pero la secuencia no representa la tarea correctamente.',
    `<p class="hint">Lee app.js de arriba abajo y compara cada salida con el orden real de la tarea.</p>
    <p class="salida">La consola permite comprobar la secuencia.</p>`,
    `console.log("Secar las manos");
// console.log("Usar jabón");
console.log("Abrir el grifo");
`,
    [
      {
        id: 'secuencia-lavado',
        description: 'Las tres instrucciones ejecutables están en el orden correcto',
        validatorType: 'source-regex',
        regexPattern: 'console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Abrir el grifo["\\\']\\s*\\)\\s*;?[\\s\\S]*console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Usar jabón["\\\']\\s*\\)\\s*;?[\\s\\S]*console\\s*\\.\\s*log\\s*\\(\\s*["\\\']Secar las manos["\\\']\\s*\\)\\s*;?',
        errorMessage: 'La secuencia todavía está incompleta o desordenada.',
        hintTip: 'Las líneas se ejecutan de arriba abajo y una línea que empieza con // no se ejecuta.',
      },
    ],
    [
      { level: 1, text: 'Imagina la tarea sin mirar el código y di los tres pasos en voz alta.' },
      { level: 2, text: 'Mueve las instrucciones hasta que la primera acción quede arriba y la última abajo.' },
      { level: 3, text: 'La acción del centro debe ser una instrucción ejecutable, no una línea que empieza con dos barras.' },
    ],
    [
      'No necesitas variables, funciones ni operadores.',
      'Ejecuta y compara la salida de la consola con el orden de la tarea.',
    ]
  ),

  exercise(
    'fundamentos-03',
    'El contador no cambia',
    'El programa intenta actualizar un dato, pero eligió una declaración que no permite reasignarlo.',
    'La consola debe mostrar 1 después de actualizar intentos.',
    'El programa se detiene al intentar cambiar intentos y la salida queda vacía.',
    `<p class="hint">Sigue intentos línea por línea: el programa falla antes de mostrar el segundo valor.</p>
    <p id="salida" class="salida"></p>`,
    `const intentos = 0;
intentos = 1;
console.log(intentos);
`,
    [
      {
        id: 'contador-actualizado',
        description: 'intentos termina en uno después de recibir dos valores',
        validatorType: 'source-regex',
        regexPattern: 'let\\s+intentos\\s*=\\s*(?:1|0\\s*;?[\\s\\S]*intentos\\s*=\\s*1)',
        errorMessage: 'intentos sigue declarado de una forma que no permite reasignarlo.',
        hintTip: 'Sigue el valor línea por línea y decide si ese nombre necesita recibir un segundo valor.',
      },
    ],
    [
      { level: 1, text: 'Sigue las líneas en orden. El error ocurre cuando intentos recibe su segundo valor.' },
      { level: 2, text: 'const se usa cuando no vas a reasignar la variable. Aquí intentos sí cambia.' },
      { level: 3, text: 'Cambia únicamente la declaración que impide que intentos reciba un segundo valor.' },
    ],
    [
      'No necesitas funciones ni operadores para resolverlo.',
      'Comprueba que la salida muestre 1 después de ejecutar.',
    ]
  ),

  exercise(
    'fundamentos-04',
    'La división responde la pregunta equivocada',
    'El programa debe indicar si 9 es múltiplo de 3, pero usa el operador equivocado.',
    'La consola debe mostrar true porque 9 se divide exactamente entre 3.',
    'La consola muestra false aunque la división no deja resto.',
    `<p class="hint">Para saber si cabe exacto necesitas comprobar el resto de la división.</p>
    <p id="salida" class="salida"></p>`,
    `const numero = 9;
const divisor = 3;
const esMultiplo = numero / divisor === 0;
console.log(esMultiplo);
`,
    [
      {
        id: 'multiplo-visible',
        description: 'La expresión comprueba que el resto es cero',
        validatorType: 'source-regex',
        regexPattern: 'const\\s+esMultiplo\\s*=\\s*(?:numero\\s*%\\s*divisor\\s*===\\s*0|0\\s*===\\s*numero\\s*%\\s*divisor)',
        errorMessage: 'La expresión todavía produce false. Necesitas comparar el resto con cero.',
        hintTip: 'Usa numero % divisor === 0.',
      },
    ],
    [
      { level: 1, text: 'Calcula 9 / 3. El resultado es 3, así que compararlo con 0 no responde si sobra algo.' },
      { level: 2, text: 'El operador % devuelve el resto de la división.' },
      { level: 3, text: 'Cambia la división por numero % divisor y conserva la comparación con cero.' },
    ],
    [
      'No necesitas if ni funciones para resolver este ejercicio.',
      'Predice el valor de cada parte antes de ejecutar.',
    ]
  ),

  exercise(
    'fundamentos-05',
    'Las letras se cruzan',
    'La nota vale 75, pero el programa muestra A porque pregunta primero por el caso más amplio.',
    'La consola debe mostrar C: 75 no llega a 90 ni a 80, pero sí llega a 70.',
    'La primera condición verdadera gana antes de que JavaScript pueda revisar los cortes correctos.',
    `<p class="hint">if elige un camino. El primero que se cumple gana y el resto no se mira.</p>
    <p class="salida">Comprueba la letra en la consola.</p>`,
    `const nota = 75;
let letra = "";

if (nota >= 70) {
  letra = "A";
} else if (nota >= 80) {
  letra = "B";
} else if (nota >= 90) {
  letra = "C";
} else {
  letra = "F";
}

console.log(letra);
`,
    [
      { id: 'cortes-ordenados', description: 'Los cortes aparecen como 90, 80 y 70', validatorType: 'source-regex', regexPattern: 'nota\\s*>=\\s*90[\\s\\S]*nota\\s*>=\\s*80[\\s\\S]*nota\\s*>=\\s*70', errorMessage: 'Los cortes todavía no van de mayor a menor.', hintTip: 'Empieza por el caso más difícil de cumplir.' },
      { id: 'resultado-c', description: 'La salida real para 75 es C', validatorType: 'console-check', expectedValue: ['C'], errorMessage: 'La consola todavía no muestra C.', hintTip: 'Con 75 deben fallar 90 y 80 antes de entrar en 70.' },
    ],
    [
      { level: 1, text: 'Un 75 cumple la condición de 70. Si esa pregunta está arriba, el resto nunca se revisa.' },
      { level: 2, text: 'Ordena los cortes de mayor a menor y conserva cada letra con su rango.' },
      { level: 3, text: 'Sigue el camino con 75: no entra en 90, no entra en 80 y sí entra en 70.' },
    ],
    [
      'No necesitas crear una función.',
      'Ejecuta y comprueba una única letra en la consola.',
    ]
  ),

  exercise(
    'fundamentos-06',
    'La tercera vuelta no ocurre',
    'El bucle debería mostrar 1, 2 y 3, pero se detiene antes del último número.',
    'La consola debe mostrar exactamente 1, 2 y 3 en ese orden.',
    'La condición usa menor que 3, así que la vuelta con i igual a 3 queda fuera.',
    `<p class="hint">Compara el límite con la última salida que necesitas incluir.</p>
    <p class="salida">La consola revela cuántas vueltas ocurrieron.</p>`,
    `for (let i = 1; i < 3; i++) {
  console.log(i);
}
`,
    [
      { id: 'tres-vueltas', description: 'La consola muestra las tres vueltas', validatorType: 'console-check', expectedValue: ['1', '2', '3'], errorMessage: 'La salida no contiene exactamente 1, 2 y 3.', hintTip: 'No dupliques console.log; corrige el control del for.' },
    ],
    [
      { level: 1, text: 'Con menor que 3, la condición deja de cumplirse cuando i llega a 3.' },
      { level: 2, text: 'Necesitas un comparador que también acepte el propio límite.' },
      { level: 3, text: 'Conserva el inicio, el incremento y el cuerpo. Ajusta solo la condición central.' },
    ],
    [
      'No necesitas funciones ni arrays.',
      'El ejercicio comprueba la salida real, no una línea exacta copiada.',
    ]
  ),

  exercise(
    'fundamentos-07',
    'El área siempre es 12',
    'La función ignora los números que le pasas.',
    'areaRectangulo(3, 4) es 12. areaRectangulo(10, 2) es 20. Los parámetros tienen que usarse.',
    'Da 12 para cualquier medida. Parece que calcula, pero no usa ancho ni alto.',
    `<p class="hint">Definir la función no la corre. Los parámetros son los datos de esa llamada.</p>
    <p id="salida" class="salida"></p>`,
    `function areaRectangulo(ancho, alto) {
  return 3 * 4;
}

console.log(areaRectangulo(3, 4));
console.log(areaRectangulo(10, 2));
`,
    [
      fn('otra', '10 por 2 da 20', 'areaRectangulo', [10, 2], 20, 'Si siempre sale 12, la función no está usando lo que le pasas.'),
      fn('cero', '0 por 5 da 0', 'areaRectangulo', [0, 5], 0, 'Un parámetro en 0 es un buen detector.'),
      fn('invertido', '5 por 3 da 15', 'areaRectangulo', [5, 3], 15, 'Cambia los dos números. El resultado tiene que cambiar con ellos.'),
    ],
    [
      { level: 1, text: 'La función tiene parámetros. ¿Aparecen a la derecha de return?' },
      { level: 2, text: '3 * 4 es un ejemplo de la clase, no la fórmula general.' },
      { level: 3, text: 'return tiene que combinar ancho y alto. Cada llamada trae sus propios números.' },
    ],
    [
      'Llama la función con dos pares distintos. Si el resultado no cambia, no está leyendo los parámetros.',
      'No hace falta tocar el HTML.',
    ]
  ),

  exercise(
    'fundamentos-08',
    'Se salta el primero',
    'La lista se lee por el índice equivocado.',
    'primero([4, 8, 15]) es 4. ultimo([4, 8, 15]) es 15.',
    'Devuelve 8 como primero y undefined como último.',
    `<p class="hint">El primer hueco es [0], no [1]. El último no es length: length es cuántos hay.</p>
    <p id="salida" class="salida"></p>`,
    `function primero(lista) {
  return lista[1];
}

function ultimo(lista) {
  return lista[lista.length];
}

const numeros = [4, 8, 15];
console.log(primero(numeros));
console.log(ultimo(numeros));
`,
    [
      fn('pri', 'El primero es la posición 0', 'primero', [[4, 8, 15]], 4, 'lista[1] es el segundo.'),
      fn('pri-otro', 'El primer valor cambia con otra lista', 'primero', [['sol', 'luna']], 'sol', 'La función debe leer la posición cero de la lista recibida.'),
      fn('ult', 'El último está en length - 1', 'ultimo', [[4, 8, 15]], 15, 'lista[lista.length] se sale: no hay nada ahí.'),
      fn('un-solo', 'Con un solo elemento, primero y último coinciden', 'ultimo', [[9]], 9, 'length es 1, el único índice válido es 0.'),
    ],
    [
      { level: 1, text: 'Cuenta en voz alta: 4 está en qué posición si empiezas en cero.' },
      { level: 2, text: 'length es 3. Los índices válidos son 0, 1 y 2. El 3 no existe.' },
      { level: 3, text: 'El último índice se calcula a partir de cuántos hay, no es el propio length.' },
    ],
    [
      'Dibuja la lista con cajitas 0, 1, 2. ¿En cuál está el primero? ¿En cuál el último?',
      'undefined en pantalla suele ser “me salí del array”.',
    ]
  ),

  exercise(
    'fundamentos-09',
    'Lee mal el producto',
    'La etiqueta no entra por el nombre del campo.',
    'etiqueta({ nombre: "Té", precio: 4 }) es "Té — 4". Se entra con el punto, no con [0].',
    'Sale undefined — undefined. Está tratando el objeto como si fuera una lista.',
    `<p class="hint">Un objeto no tiene primer hueco. Tiene claves: nombre, precio.</p>
    <p id="salida" class="salida"></p>`,
    `function etiqueta(item) {
  return item[0] + " — " + item[1];
}

const producto = { nombre: "Té", precio: 4 };
console.log(etiqueta(producto));
`,
    [
      fn('te', 'Usa nombre y precio del objeto', 'etiqueta', [{ nombre: 'Té', precio: 4 }], 'Té — 4', 'item.nombre no es item[0].'),
      fn('cafe', 'Sirve con otro producto', 'etiqueta', [{ nombre: 'Café', precio: 12 }], 'Café — 12', 'La función lee campos, no posiciones.'),
    ],
    [
      { level: 1, text: 'producto no es un array. No hay producto[0].' },
      { level: 2, text: 'En la clase entrabas con el punto y el nombre del campo.' },
      { level: 3, text: 'item.nombre y item.precio. El orden en el objeto no cuenta; el nombre del campo sí.' },
    ],
    [
      'Abre el objeto con las llaves y lee las claves. Esas son las puertas, no 0 y 1.',
      'Si ves undefined, pediste una clave o un índice que no existe.',
    ]
  ),

  exercise(
    'fundamentos-10',
    'JavaScript busca el id equivocado',
    'El programa debería cambiar el título y el mensaje, pero solo uno responde.',
    '#titulo y #mensaje deben mostrar sus textos nuevos.',
    'La segunda búsqueda repite titulo, así que mensaje conserva el texto original.',
    `<h2 id="titulo">Título original</h2>
    <p id="mensaje" class="salida">Mensaje original</p>`,
    `const titulo = document.getElementById("titulo");
const mensaje = document.getElementById("titulo");

titulo.textContent = "Página lista";
mensaje.textContent = "DOM conectado";
`,
    [
      { id: 'titulo-dom', description: 'El título cambia', validatorType: 'dom-check', domSelector: '#titulo', domProperty: 'innerText', expectedValue: 'Página lista', errorMessage: 'El título no muestra el texto esperado.', hintTip: 'La primera búsqueda ya apunta al id correcto.' },
      { id: 'mensaje-dom', description: 'El mensaje cambia', validatorType: 'dom-check', domSelector: '#mensaje', domProperty: 'innerText', expectedValue: 'DOM conectado', errorMessage: 'El mensaje sigue sin cambiar porque la variable mensaje apunta a otro elemento.', hintTip: 'Compara el nombre de la variable con el id buscado.' },
    ],
    [
      { level: 1, text: 'Hay dos variables, pero ambas búsquedas usan el mismo id.' },
      { level: 2, text: 'Cada elemento del HTML tiene un id distinto: titulo y mensaje.' },
      { level: 3, text: 'Corrige únicamente el texto entre comillas de la segunda búsqueda.' },
    ],
    ['No cambies el HTML.', 'Ejecuta y comprueba cada elemento por separado.']
  ),

  exercise(
    'fundamentos-11',
    'El botón espera dos clics',
    'La respuesta debería aparecer con un clic normal.',
    'Un solo clic en #accion cambia #estado.',
    'El programa escucha dblclick, así que un clic normal no hace nada.',
    `<button type="button" id="accion">Púlsame</button>
    <p id="estado" class="salida">Esperando</p>`,
    `const boton = document.getElementById("accion");
const estado = document.getElementById("estado");

function responder() {
  estado.textContent = "Recibido";
}

boton.addEventListener("dblclick", responder);
`,
    [
      { id: 'click-simple', description: 'Un clic cambia el mensaje', validatorType: 'dom-check', domSelector: '#estado', domProperty: 'innerText', triggerClick: '#accion', expectedValue: 'Recibido', errorMessage: 'Un clic todavía no ejecuta responder.', hintTip: 'Revisa el nombre del evento entre comillas.' },
    ],
    [
      { level: 1, text: 'La función responder sí cambia el texto. El problema está en cuándo se llama.' },
      { level: 2, text: 'dblclick significa doble clic.' },
      { level: 3, text: 'La lección conectaba el evento click.' },
    ],
    ['Conserva responder sin paréntesis dentro de addEventListener.', 'No hace falta cambiar la función.']
  ),

  exercise(
    'fundamentos-12',
    'El saludo ignora lo escrito',
    'El input contiene Ana, pero el saludo no incluye el nombre.',
    'Al pulsar Saludar, #salida debe mostrar “Hola, Ana”.',
    'El código lee textContent del input en lugar de su valor.',
    `<input id="nombre" value="Ana">
    <button type="button" id="saludar">Saludar</button>
    <p id="salida" class="salida">Sin saludo</p>`,
    `const entrada = document.getElementById("nombre");
const boton = document.getElementById("saludar");
const salida = document.getElementById("salida");

function mostrarSaludo() {
  salida.textContent = "Hola, " + entrada.textContent;
}

boton.addEventListener("click", mostrarSaludo);
`,
    [
      { id: 'valor-input', description: 'El saludo usa el valor del input', validatorType: 'dom-check', domSelector: '#salida', domProperty: 'innerText', triggerClick: '#saludar', expectedValue: 'Hola, Ana', errorMessage: 'El saludo no está leyendo el texto escrito en el input.', hintTip: 'Los inputs guardan su texto en value.' },
    ],
    [
      { level: 1, text: 'entrada es un input, no un párrafo.' },
      { level: 2, text: 'textContent sirve para texto entre etiquetas; el input tiene otra propiedad.' },
      { level: 3, text: 'Lee entrada.value dentro de mostrarSaludo.' },
    ],
    ['No cambies el value del HTML.', 'El evento ya está conectado correctamente.']
  ),

  exercise(
    'fundamentos-13',
    'La primera tarea desaparece',
    'La página debería mostrar las tres tareas del array.',
    'La lista contiene Leer, Practicar y Descansar.',
    'El bucle comienza en 1 y se salta la posición 0.',
    `<ul id="lista"></ul>
    <p id="total" class="salida">Total: 0</p>`,
    `const tareas = ["Leer", "Practicar", "Descansar"];
const lista = document.getElementById("lista");

for (let i = 1; i < tareas.length; i++) {
  const fila = document.createElement("li");
  fila.textContent = tareas[i];
  lista.appendChild(fila);
}

document.getElementById("total").textContent =
  "Total: " + lista.children.length;
`,
    [
      { id: 'tres-filas', description: 'La lista tiene tres filas', validatorType: 'dom-check', domSelector: '#lista li', domProperty: 'count', expectedValue: 3, errorMessage: 'La lista todavía tiene menos de tres filas.', hintTip: 'El primer índice de un array es 0.' },
      { id: 'incluye-leer', description: 'La primera tarea también aparece', validatorType: 'dom-check', domSelector: '#lista', domProperty: 'innerText', matcher: 'contains', expectedValue: 'Leer', errorMessage: 'Leer sigue ausente de la lista.', hintTip: 'Revisa el valor inicial de i.' },
    ],
    [
      { level: 1, text: 'Escribe los índices sobre las tareas: 0, 1 y 2.' },
      { level: 2, text: 'El for actual empieza en la segunda posición.' },
      { level: 3, text: 'Cambia solamente el valor inicial de i.' },
    ],
    ['No necesitas cambiar createElement ni appendChild.', 'Comprueba la cantidad y el primer texto.']
  ),

  exercise(
    'fundamentos-14',
    'Guarda una tarea inventada',
    'agregarTarea debe usar el texto recibido e ignorar el vacío.',
    'El vacío devuelve 0. “Leer” se guarda y devuelve 1.',
    'La función siempre agrega “Ejemplo” y devuelve -1.',
    `<p class="hint">La fuente de verdad es el array tareas.</p>
    <p id="salida" class="salida"></p>`,
    `const tareas = [];

function agregarTarea(texto) {
  tareas.push("Ejemplo");
  return -1;
}

document.getElementById("salida").textContent =
  "Cantidad: " + agregarTarea("Leer");
`,
    [
      fn('vacio-proyecto', 'Ignora el texto vacío', 'agregarTarea', [''], 0, 'La condición debe ocurrir antes de guardar.'),
      fn('valida-proyecto', 'Guarda una tarea válida', 'agregarTarea', ['Leer'], 1, 'Usa el parámetro texto y devuelve tareas.length.'),
    ],
    [
      { level: 1, text: 'La función ignora su parámetro y además devuelve un número fijo incorrecto.' },
      { level: 2, text: 'Si texto es vacío, devuelve la cantidad sin hacer push.' },
      { level: 3, text: 'Si es válido, tareas.push(texto) y después return tareas.length.' },
    ],
    ['No cambies el array global.', 'Prueba primero el vacío y luego una tarea válida.']
  ),
];

export const DEBUG_EXERCISES: DebuggingExerciseItem[] = [
  ...BEGINNER_DEBUG_EXERCISES,
  ...ADVANCED_DEBUG_EXERCISES,
];

export const DEBUG_BY_LESSON: Record<string, DebuggingExerciseItem> = Object.fromEntries(
  DEBUG_EXERCISES.map((item) => [item.relatedLessonId as string, item])
);
