import { DebuggingExerciseItem } from '../../types/curriculum';
import { ChallengeTest } from '../../types/scrim';
import { file, workspaceOf } from '../../engine/lessonCompiler';

const SHELL_CSS = `* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #171717; }
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
  color: #737373;
}
h1 {
  margin: 0 0 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e5e5;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.hint { margin: 0 0 16px; color: #404040; font-size: 15px; line-height: 1.45; }
#salida, .salida {
  min-height: 1.5em;
  margin: 0 0 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px;
  font-weight: 600;
  white-space: pre-wrap;
}
button {
  padding: 8px 14px;
  border: 1px solid #171717;
  background: #fff;
  color: #171717;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
button:hover { background: #f5f5f5; }
label { display: block; margin: 0 0 6px; font-size: 13px; color: #525252; }
input {
  margin: 0 0 12px;
  padding: 6px 8px;
  border: 1px solid #171717;
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
  troubleshootingTips: string[],
  reading?: DebuggingExerciseItem['reading']
): DebuggingExerciseItem {
  return {
    id: `${relatedLessonId}-debug`,
    relatedLessonId,
    title,
    type: 'debugging',
    estimatedMinutes: 6,
    description,
    templateId: 'vanilla-js',
    initialWorkspace: workspace(title, inner, js),
    expectedBehavior,
    observedBehavior,
    tests,
    hints,
    troubleshootingTips,
    reading,
  };
}

export const DEBUG_EXERCISES: DebuggingExerciseItem[] = [
  exercise(
    'fundamentos-01',
    'Dos recuadros, un solo texto',
    'El programa debería llenar los dos recuadros de la página, pero uno queda vacío.',
    '#linea1 debe mostrar “Me llamo Ana” y #linea2 debe mostrar “Y me gusta el helado”. Cada recuadro con su propio texto.',
    'Solo se ve “Y me gusta el helado” en el primer recuadro. El segundo quedó vacío y el nombre desapareció.',
    `<p class="hint">Revisa app.js. La página tiene dos recuadros: #linea1 y #linea2.</p>
    <p id="linea1" class="salida"></p>
    <p id="linea2" class="salida"></p>`,
    `document.getElementById("linea1").textContent = "Me llamo Ana";
document.getElementById("linea1").textContent = "Y me gusta el helado";
`,
    [
      {
        id: 'linea1-con-nombre',
        description: '#linea1 muestra el nombre',
        validatorType: 'dom-check',
        domSelector: '#linea1',
        domProperty: 'innerText',
        expectedContains: ['Ana'],
        matcher: 'contains-all',
        caseInsensitive: true,
        normalizeSpaces: true,
        ignorePunctuation: true,
        errorMessage: '#linea1 ya no muestra “Me llamo Ana”. Revisa qué instrucción escribe ahí.',
        hintTip: 'Cada recuadro necesita su propia instrucción.',
      },
      {
        id: 'linea2-con-helado',
        description: '#linea2 muestra la comida favorita',
        validatorType: 'dom-check',
        domSelector: '#linea2',
        domProperty: 'innerText',
        expectedContains: ['helado'],
        matcher: 'contains-all',
        caseInsensitive: true,
        normalizeSpaces: true,
        ignorePunctuation: true,
        errorMessage: '#linea2 sigue vacío. La segunda instrucción está escribiendo en otro recuadro.',
        hintTip: 'Mira el id que aparece entre comillas en cada línea.',
      },
      {
        id: 'usa-ambos-recuadros',
        description: 'El código busca los recuadros linea1 y linea2',
        validatorType: 'source-regex',
        // Acepta ambos órdenes: el requisito es apuntar a los dos recuadros,
        // no el orden en que están escritas las instrucciones.
        regexPattern: 'getElementById\\(\\s*["\']linea1["\']\\s*\\)[\\s\\S]*getElementById\\(\\s*["\']linea2["\']\\s*\\)|getElementById\\(\\s*["\']linea2["\']\\s*\\)[\\s\\S]*getElementById\\(\\s*["\']linea1["\']\\s*\\)',
        errorMessage: 'Necesitamos una instrucción para linea1 y otra para linea2.',
        hintTip: 'El segundo recuadro se llama linea2.',
      },
    ],
    [
      { level: 1, text: 'Ejecuta y mira la página: hay dos recuadros, ¿cuántos tienen texto? ¿Cuál falta?' },
      { level: 2, text: 'Las dos instrucciones del programa apuntan al mismo recuadro. Recuerda: cada id identifica un recuadro distinto.' },
      { level: 3, text: 'Próximo paso: la segunda instrucción debería escribir en el otro recuadro. Cambia el id entre comillas, no el texto.' },
    ],
    [
      'Compara los ids de la página (linea1, linea2) con los ids que aparecen en app.js.',
      'No cambies los textos: solo hay que apuntar cada instrucción a su recuadro.',
    ],
    {
      title: 'Antes de depurar: repaso de tu primer programa',
      summary: 'Repaso rápido de la clase para que arregles el programa sin adivinar.',
      sections: [
        {
          title: 'Qué es un programa',
          content: 'Un programa es una lista de instrucciones que la computadora ejecuta de arriba abajo, una tras otra, como una receta. Cada línea es una instrucción. Si cambias el orden, cambia el resultado.',
          example: 'document.getElementById("linea1").textContent = "Hola";\ndocument.getElementById("linea2").textContent = "Adiós";',
          exampleCaption: 'Una instrucción por línea. Se ejecutan en orden.',
        },
        {
          title: 'El patrón busca-y-escribe',
          content: 'Cada instrucción tiene dos partes: document.getElementById("...") busca el recuadro cuyo id coincida, y .textContent = "..." escribe texto dentro. El id va entre comillas y debe ser exactamente igual al de la página.',
          example: 'document.getElementById("linea2").textContent = "Escrito con JavaScript";',
          exampleCaption: 'Busca el recuadro por su id, luego escribe.',
        },
        {
          title: 'Un recuadro, una instrucción',
          content: 'Si dos instrucciones escriben en el mismo recuadro, la última pisa a la primera y el otro recuadro queda vacío. Para llenar dos recuadros necesitas dos instrucciones, cada una con su id.',
          example: 'Antes: dos líneas con "linea1"\nDespués: una para "linea1" y otra para "linea2"',
          exampleCaption: 'El id entre comillas decide a qué recuadro escribe cada línea.',
        },
        {
          title: 'Qué vas a arreglar',
          content: 'En app.js las dos instrucciones escriben en linea1. Por eso el nombre desaparece y linea2 queda vacío. No cambies los textos: cambia el id de la segunda instrucción para que apunte al otro recuadro.',
          example: 'Antes: getElementById("linea1") ... dos veces\nDespués: getElementById("linea1") y getElementById("linea2")',
          exampleCaption: 'Un cambio pequeño: el id correcto en cada línea.',
        },
      ],
      keyPoints: [
        'JavaScript ejecuta las líneas de arriba abajo',
        'getElementById("id") busca el recuadro con ese id',
        'textContent = "texto" escribe dentro del recuadro',
        'El id entre comillas debe coincidir exactamente con el de la página',
        'La última instrucción sobre un mismo recuadro gana',
      ],
    }
  ),

  exercise(
    'fundamentos-02',
    'La cuenta sale mal',
    'El conversor corre, pero 20 °C no da 68 °F.',
    'aFahrenheit(0) es 32, aFahrenheit(20) es 68, aFahrenheit(100) es 212.',
    'Con 20 °C la página muestra un número enorme. La fórmula no respeta el orden de las operaciones.',
    `<p class="hint">Parte el problema: leer el número, hacer la cuenta, mostrar. La cuenta es la que falla.</p>
    <p id="salida" class="salida"></p>`,
    `function aFahrenheit(celsius) {
  return celsius * 9 + 5 / 32;
}

const salida = document.getElementById("salida");
salida.textContent = "20 °C = " + aFahrenheit(20) + " °F";
`,
    [
      fn('cero', '0 °C son 32 °F', 'aFahrenheit', [0], 32, 'El 32 se suma al final, no se divide.'),
      fn('veinte', '20 °C son 68 °F', 'aFahrenheit', [20], 68, 'Multiplica, divide, y al final suma.'),
      fn('cien', '100 °C son 212 °F', 'aFahrenheit', [100], 212, 'Prueba con un número redondo para ver si la cuenta escala.'),
    ],
    [
      { level: 1, text: 'En JavaScript, * y / van antes que +. No es lo mismo a * b + c / d que (a * b / c) + d.' },
      { level: 2, text: 'La clase usaba tres operaciones en un orden concreto: multiplicar, dividir, sumar.' },
      { level: 3, text: 'Comprueba aFahrenheit(0). Si no da 32, el 32 no está donde debería.' },
    ],
    [
      'No reescribas todo. Encuentra la línea de la cuenta y mírala con un ejemplo: 20.',
      'Puedes probar aFahrenheit con 0, 20 y 100 en la consola después de pulsar Ejecutar.',
    ]
  ),

  exercise(
    'fundamentos-03',
    'La edad se pega como texto',
    'La ficha mezcla tipos y el año que viene sale mal.',
    'ficha("Ana", 25) dice que tendrá 26 años. Si la edad llega como texto "25", también debe sumar 1, no pegar un 1.',
    'Sale "Ana el año que viene tendrá 251 años". El 1 se pega al 25.',
    `<p class="hint">El + hace dos trabajos: suma números y pega textos. El tipo del dato decide.</p>
    <p id="salida" class="salida"></p>`,
    `function ficha(nombre, edad) {
  return nombre + " el año que viene tendrá " + (edad + 1) + " años";
}

const nombre = "Ana";
let edad = "25";
document.getElementById("salida").textContent = ficha(nombre, edad);
`,
    [
      fn('texto', 'Si la edad llega como texto, suma un año', 'ficha', ['Ana', '25'], 'Ana el año que viene tendrá 26 años', 'Number(...) convierte texto a número antes de sumar.'),
      fn('otro', 'Sirve con otra persona', 'ficha', ['Luis', '40'], 'Luis el año que viene tendrá 41 años', 'El tipo importa más que el nombre de la variable.'),
    ],
    [
      { level: 1, text: 'Mira cómo está escrita la edad en app.js. ¿Lleva comillas?' },
      { level: 2, text: '"25" + 1 no es 26. Es texto pegado a un 1.' },
      { level: 3, text: 'Antes de sumar, la edad tiene que ser un número de verdad, no un texto que se parece a un número.' },
    ],
    [
      'Pregúntate: ¿edad es número o texto? Las comillas lo deciden.',
      'let y const no arreglan el tipo. El valor que guardas sí.',
    ]
  ),

  exercise(
    'fundamentos-04',
    'Entra quien no debería',
    'El descuento y el múltiplo usan mal los operadores que viste.',
    'Descuento solo si el precio es mayor que 50 y además es socio. esMultiplo usa el resto, no la división.',
    'Un precio de 80 sin ser socio se rebaja y el porcentaje tampoco coincide. esMultiplo(9, 3) da false.',
    `<p class="hint">=== compara. % es el resto. && pide las dos condiciones.</p>
    <p id="salida" class="salida"></p>`,
    `function aplicaDescuento(precio, esSocio) {
  if (precio > 50 || esSocio) {
    return precio * 0.8;
  }
  return precio;
}

function esMultiplo(n, de) {
  return n / de === 0;
}

const salida = document.getElementById("salida");
salida.textContent =
  "80 sin socio → " + aplicaDescuento(80, false) +
  "\\n9 múltiplo de 3 → " + esMultiplo(9, 3);
`,
    [
      fn('sin-socio', '80 sin socio no tiene descuento', 'aplicaDescuento', [80, false], 80, '|| se conforma con una de las dos. && pide las dos.'),
      fn('con-socio', '80 con socio sí rebaja', 'aplicaDescuento', [80, true], 72, 'Revisa tanto las dos condiciones como el porcentaje aplicado.'),
      fn('barato-socio', '30 aunque sea socio no rebaja', 'aplicaDescuento', [30, true], 30, 'El precio también tiene que pasar el corte.'),
      fn('multiplo', '9 es múltiplo de 3', 'esMultiplo', [9, 3], true, '% da el resto. Si el resto es 0, cabe exacto.'),
    ],
    [
      { level: 1, text: 'Hay dos funciones. En el descuento revisa por separado la condición y la cuenta; después prueba esMultiplo.' },
      { level: 2, text: '|| y && no son lo mismo. Una se conforma con un sí. La otra exige los dos.' },
      { level: 3, text: 'n / 3 === 0 casi nunca es cierto (9 / 3 es 3). El resto de una división es otro operador.' },
    ],
    [
      'No copies el reto de la clase. Mira qué pregunta hace cada if.',
      'Para esMultiplo, piensa: ¿qué queda después de repartir n en grupos de tamaño de?',
    ]
  ),

  exercise(
    'fundamentos-05',
    'Las letras se cruzan',
    'La letra de la nota elige mal el camino y devuelve categorías equivocadas.',
    'letra(95) es A, letra(80) es B, letra(70) es C, letra(50) es F.',
    'Las cuatro notas de ejemplo reciben una letra incorrecta. Las preguntas y sus resultados no están alineados.',
    `<p class="hint">if elige un camino. El primero que se cumple gana y el resto no se mira.</p>
    <p id="salida" class="salida"></p>`,
    `function letra(nota) {
  if (nota >= 70) return "D";
  if (nota >= 80) return "A";
  if (nota >= 90) return "F";
  return "C";
}

document.getElementById("salida").textContent =
  "95 → " + letra(95) + " · 80 → " + letra(80) + " · 50 → " + letra(50);
`,
    [
      fn('a', '95 es A', 'letra', [95], 'A', '95 también es >= 70. Si preguntas eso primero, nunca llegas a A.'),
      fn('b', '80 es B', 'letra', [80], 'B', 'El orden de las preguntas cambia el resultado.'),
      fn('c', '70 es C', 'letra', [70], 'C', 'El corte de C va después de los más altos.'),
      fn('f', '50 es F', 'letra', [50], 'F', 'Si no entra en A, B ni C, queda el último camino.'),
    ],
    [
      { level: 1, text: 'Un 95 cumple más de una condición. Sigue el recorrido y anota qué letra recibe cada nota de ejemplo.' },
      { level: 2, text: 'Si preguntas lo más fácil de cumplir al principio, los otros if nunca corren. Comprueba también qué categoría devuelve cada camino.' },
      { level: 3, text: 'Ordena los cortes desde el más exigente y verifica la letra asociada a cada rango.' },
    ],
    [
      'Prueba mentalmente 95, 80, 70 y 50 en el orden actual de los if.',
      'No hace falta reescribir la idea: hace falta que la primera pregunta que gana sea la correcta.',
    ]
  ),

  exercise(
    'fundamentos-06',
    'El 15 no dice FizzBuzz',
    'La etiqueta del número 15 se queda a medias.',
    'etiqueta(3) es Fizz, etiqueta(5) es Buzz, etiqueta(15) es FizzBuzz, etiqueta(1) es "1".',
    'El 3 y el 5 reciben la palabra contraria, el 15 se queda en una sola y el caso normal devuelve un número.',
    `<p class="hint">El orden de las preguntas importa tanto como las preguntas.</p>
    <p id="salida" class="salida"></p>`,
    `function etiqueta(n) {
  if (n % 3 === 0) return "Buzz";
  if (n % 5 === 0) return "Fizz";
  if (n % 3 === 0 && n % 5 === 0) return "FizzBuzz";
  return n;
}

const lineas = [];
for (let i = 1; i <= 15; i++) {
  lineas.push(i + ": " + etiqueta(i));
}
document.getElementById("salida").textContent = lineas.join("\\n");
`,
    [
      fn('fizz', '3 es Fizz', 'etiqueta', [3], 'Fizz', 'Múltiplo solo de 3.'),
      fn('buzz', '5 es Buzz', 'etiqueta', [5], 'Buzz', 'Múltiplo solo de 5.'),
      fn('ambos', '15 es FizzBuzz', 'etiqueta', [15], 'FizzBuzz', '15 cumple las dos. Si preguntas una sola primero, esa gana.'),
      fn('numero', '1 se queda en número', 'etiqueta', [1], '1', 'Si no es múltiplo, devuelve el número como texto.'),
    ],
    [
      { level: 1, text: 'Prueba 3, 5, 15 y 1 por separado. Compara el valor y también su tipo con lo que pide el enunciado.' },
      { level: 2, text: 'Un return corta la función. Además, cada múltiplo debe conservar su etiqueta correcta.' },
      { level: 3, text: 'El caso que cumple las dos condiciones necesita prioridad; el caso normal debe tener el mismo tipo que el resultado esperado.' },
    ],
    [
      'No borres el bucle. El fallo está en etiqueta(), no en el for.',
      'Di en voz alta qué pregunta harías primero si quieres que FizzBuzz tenga oportunidad.',
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

document.getElementById("salida").textContent =
  "3×4 → " + areaRectangulo(3, 4) + " · 10×2 → " + areaRectangulo(10, 2);
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
document.getElementById("salida").textContent =
  "primero → " + primero(numeros) + " · ultimo → " + ultimo(numeros);
`,
    [
      fn('pri', 'El primero es la posición 0', 'primero', [[4, 8, 15]], 4, 'lista[1] es el segundo.'),
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
document.getElementById("salida").textContent = etiqueta(producto);
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
    'Los dos contadores se pisan',
    'Dos contadores deberían vivir aparte. Ahora comparten el número.',
    'Cada crearContador() tiene su propio n. El segundo no sigue la cuenta del primero.',
    'Si llamas al primero dos veces y al segundo una, el segundo no empieza en 1: sigue la cuenta del otro.',
    `<p class="hint">Sin let, n no nace dentro de la función: se comparte.</p>
    <p id="salida" class="salida"></p>`,
    `function crearContador() {
  n = 0;
  return function () {
    n = n + 1;
    return n;
  };
}

function pruebaDosContadores() {
  const a = crearContador();
  const b = crearContador();
  a();
  a();
  return [a(), b()];
}

const salida = document.getElementById("salida");
salida.textContent = "a, a, a y un b → " + pruebaDosContadores().join(", ");
`,
    [
      fn(
        'independientes',
        'El segundo contador empieza en 1 aunque el primero ya haya contado',
        'pruebaDosContadores',
        [],
        [3, 1],
        'a() tres veces da 3. b() una vez debería dar 1, no 4.'
      ),
    ],
    [
      { level: 1, text: 'pruebaDosContadores crea a y b. Si se pisan, n no es de cada uno.' },
      { level: 2, text: 'n = 0 sin let (ni const) no queda encerrado en crearContador.' },
      { level: 3, text: 'La función de adentro “recuerda” las variables que nacieron adentro, no las de fuera.' },
    ],
    [
      'No borres pruebaDosContadores: es la comprobación. Arregla crearContador.',
      'Dos llamadas a crearContador() tienen que nacer dos n distintos.',
    ]
  ),

  exercise(
    'fundamentos-11',
    'Los índices quedan corridos',
    'La búsqueda lineal se salta un hueco y devuelve posiciones desplazadas.',
    'buscar([7, 3, 9], 7) es 0. buscar([7, 3, 9], 9) es 2. Si no está, -1.',
    'El 7 devuelve una posición que no corresponde, el 9 queda desplazado y un ausente tampoco devuelve -1.',
    `<p class="hint">Lineal mira uno por uno. Si empiezas en el segundo, el primero no existe para el programa.</p>
    <p id="salida" class="salida"></p>`,
    `function buscar(lista, objetivo) {
  for (let i = 1; i < lista.length; i++) {
    if (lista[i] === objetivo) return i - 1;
  }
  return lista.length;
}

document.getElementById("salida").textContent =
  "buscar 7 → " + buscar([7, 3, 9], 7) + " · buscar 4 → " + buscar([7, 3, 9], 4);
`,
    [
      fn('cabeza', 'Encuentra el que está al principio', 'buscar', [[7, 3, 9], 7], 0, 'El for no puede empezar en 1 si el 0 también cuenta.'),
      fn('cola', 'Encuentra el del final', 'buscar', [[7, 3, 9], 9], 2, 'El último índice es length - 1, y el for ya llega ahí.'),
      fn('no-esta', 'Si no está, -1', 'buscar', [[7, 3, 9], 4], -1, 'Al terminar el recorrido sin coincidencias debe devolver el valor que representa “no encontrado”.'),
    ],
    [
      { level: 1, text: 'El 7 está en la posición 0. Sigue el for y anota qué devuelve cuando encuentra algo y cuando no lo encuentra.' },
      { level: 2, text: 'El recorrido se salta el índice 0 y la posición devuelta tampoco coincide con la visitada.' },
      { level: 3, text: 'Una búsqueda lineal recorre desde el primer índice y usa un valor especial fuera del bucle cuando no encuentra nada.' },
    ],
    [
      'Escribe los índices 0, 1, 2 al lado de 7, 3, 9. Marca cuáles visita el for ahora.',
      'No hace falta binaria aquí. El fallo es el punto de partida.',
    ]
  ),

  exercise(
    'fundamentos-12',
    'Atiende al último de la fila',
    'Una cola atiende a quien llegó primero. Esta atiende al último.',
    'atender(["Ana", "Ben", "Cris"]) devuelve "Ana". El primero en entrar es el primero en salir.',
    'Devuelve "Cris". Está trabajando como pila.',
    `<p class="hint">Pila: pop saca de atrás. Cola: se saca de adelante, como una fila del súper.</p>
    <p id="salida" class="salida"></p>`,
    `function atender(fila) {
  return fila.pop();
}

const cola = ["Ana", "Ben", "Cris"];
document.getElementById("salida").textContent = "Atiende → " + atender(cola);
`,
    [
      fn('fifo', 'Sale quien llegó primero', 'atender', [['Ana', 'Ben', 'Cris']], 'Ana', 'pop saca el último. En una cola el último debería esperar.'),
      fn('segunda', 'Después de Ana tocaría Ben', 'atender', [['Ben', 'Cris']], 'Ben', 'Sigue saliendo por el frente, no por atrás.'),
    ],
    [
      { level: 1, text: 'Ana llegó primero. ¿pop saca a Ana o a Cris?' },
      { level: 2, text: 'En la clase, la cola sacaba por el frente. Hay un método que quita el índice 0.' },
      { level: 3, text: 'push mete al final. Para atender, tienes que sacar del principio, no del final.' },
    ],
    [
      'Dibuja la fila: Ana, Ben, Cris. ¿Quién debería salir si es una cola? ¿Y si es una pila?',
      'El array se puede tocar por los dos extremos. Elige el extremo que corresponde a “fila”.',
    ]
  ),

  exercise(
    'fundamentos-13',
    'Solo detecta vecinos',
    'La función dice que no hay duplicados si no están juntos.',
    'tieneDuplicados([1, 2, 1]) es true. tieneDuplicados([1, 1, 2]) es true. tieneDuplicados([1, 2, 3]) es false.',
    'Solo mira al de al lado; los duplicados vecinos dan false y los demás casos terminan sin un booleano útil.',
    `<p class="hint">Si duplicas los datos, un algoritmo que solo mira vecinos se queda corto. Eso también es complejidad: hace de menos.</p>
    <p id="salida" class="salida"></p>`,
    `function tieneDuplicados(lista) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i] === lista[i + 1]) return false;
  }
  return null;
}

document.getElementById("salida").textContent =
  "[1, 2, 1] → " + tieneDuplicados([1, 2, 1]) +
  " · [1, 1, 2] → " + tieneDuplicados([1, 1, 2]);
`,
    [
      fn('lejos', 'Duplicado no vecino', 'tieneDuplicados', [[1, 2, 1]], true, '1 aparece dos veces aunque no estén juntos.'),
      fn('juntos', 'Duplicado vecino', 'tieneDuplicados', [[1, 1, 2]], true, 'Cuando encuentra dos valores repetidos debe comunicar que sí hay duplicado.'),
      fn('unicos', 'Sin duplicados es false', 'tieneDuplicados', [[1, 2, 3]], false, 'Si todo es distinto, no hay duplicado.'),
    ],
    [
      { level: 1, text: 'Sigue los dos caminos de retorno con una lista repetida y otra única. ¿El booleano describe lo que ocurrió?' },
      { level: 2, text: 'Aunque corrijas los booleanos, comparar solo con i + 1 sigue sin ver duplicados separados.' },
      { level: 3, text: 'Compara cada valor con los demás o recuerda cuáles ya viste; devuelve el resultado que corresponda a encontrar una repetición.' },
    ],
    [
      'El fallo no es de sintaxis: el programa hace menos trabajo del que el problema pide.',
      'Piensa un caso que el código actual acierta y uno que falla. Arregla el que falla sin romper el otro.',
    ]
  ),

  exercise(
    'fundamentos-14',
    'Cambia la lista original',
    'conIva debería devolver números nuevos sin tocar la lista de entrada.',
    'conIva([100, 200]) devuelve [121, 242] y la lista original sigue siendo [100, 200].',
    'La lista de entrada termina modificada y el porcentaje aplicado tampoco llega al 21 %. En el estilo de map, entra una lista y sale otra.',
    `<p class="hint">map arma una lista nueva. Si escribes sobre precios[i], mutas la original.</p>
    <p id="salida" class="salida"></p>`,
    `function conIva(precios) {
  for (let i = 0; i < precios.length; i++) {
    precios[i] = precios[i] * 1.2;
  }
  return precios;
}

function originalIntacto() {
  const datos = [100, 200];
  const resultado = conIva(datos);
  return datos[0] === 100 && resultado[0] === 121;
}

document.getElementById("salida").textContent =
  "resultado → " + conIva([100, 200]).join(", ");
`,
    [
      fn('valores', 'Aplica el 21 % y devuelve números nuevos', 'conIva', [[100, 200]], [121, 242], 'El enunciado pide añadir 21 %, no 20 %.'),
      fn('no-muta', 'La lista de entrada no se reescribe', 'originalIntacto', [], true, 'Si conIva escribe en precios[i], datos[0] deja de ser 100.'),
    ],
    [
      { level: 1, text: 'Comprueba por separado el porcentaje calculado y si datos conserva sus valores después de llamar conIva.' },
      { level: 2, text: 'precios[i] = ... cambia el array que te pasaron. En la clase, map no hacía eso.' },
      { level: 3, text: 'Arma otra lista (map, o un array nuevo que vas llenando) y deja la original en paz.' },
    ],
    [
      'No borres originalIntacto: comprueba que la entrada no se reescribe.',
      'Puedes resolverlo con map o con un for que empuja a un array nuevo. Lo que no vale es pisar precios[i].',
    ]
  ),
];

export const DEBUG_BY_LESSON: Record<string, DebuggingExerciseItem> = Object.fromEntries(
  DEBUG_EXERCISES.map((item) => [item.relatedLessonId as string, item])
);
