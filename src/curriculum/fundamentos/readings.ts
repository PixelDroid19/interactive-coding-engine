import { ReadingItem, ReadingSection } from '../../types/curriculum';
import { READING_01 } from './reading01';
import { ADVANCED_READINGS } from './readingsAdvanced';
import { PEDAGOGICAL_PROFILE_BY_LESSON } from './pedagogicalProfiles';

interface ReadingDraft {
  lessonId: string;
  title: string;
  summary: string;
  sections: ReadingSection[];
  keyPoints: string[];
}

function readingOf(draft: ReadingDraft): ReadingItem {
  return {
    id: `${draft.lessonId}-lectura`,
    relatedLessonId: draft.lessonId,
    practiceItemId: `${draft.lessonId}-debug`,
    title: `Lectura: ${draft.title}`,
    type: 'reading',
    estimatedMinutes: 5,
    description: 'Repaso, ejemplos y errores comunes antes de practicar.',
    summary: draft.summary,
    sections: draft.sections,
    keyPoints: draft.keyPoints,
  };
}

const READINGS: ReadingItem[] = [
  READING_01,
  readingOf({
    lessonId: 'fundamentos-02',
    title: 'pensar en pasos',
    summary: 'Antes de escribir más sintaxis, aprende a convertir una meta grande en instrucciones pequeñas, precisas y ordenadas.',
    sections: [
      {
        title: 'Una meta no es una instrucción',
        content: '“Preparar el desayuno” dice qué quieres conseguir, pero no explica cómo. Un programa necesita acciones concretas que puedas ordenar y comprobar una por una.',
        example: 'console.log("Sacar una taza");\nconsole.log("Servir la bebida");',
        exampleCaption: 'Cada línea representa una acción observable.',
      },
      {
        title: 'Los comentarios son notas',
        content: 'Dos barras al inicio convierten la línea en un comentario. Sirve para explicar el plan a una persona, pero JavaScript no lo ejecuta ni lo muestra en la consola.',
        example: '// Plan: preparar una bebida\nconsole.log("Sacar una taza");',
        exampleCaption: 'Solo la segunda línea produce una salida.',
      },
      {
        title: 'Error común: pasos correctos en mal orden',
        content: 'Un programa puede tener sintaxis válida y aun así hacer lo equivocado. Lee las instrucciones de arriba abajo y pregunta si cada acción puede ocurrir en ese momento.',
      },
    ],
    keyPoints: ['Divide una meta grande', 'Escribe una acción por instrucción', 'JavaScript ejecuta de arriba abajo', 'Los comentarios no se ejecutan'],
  }),
  readingOf({
    lessonId: 'fundamentos-03',
    title: 'variables y tipos',
    summary: 'Una variable es un nombre que permite guardar y volver a usar un valor sin repetirlo por todo el programa.',
    sections: [
      {
        title: 'Nombres para los datos',
        content: 'Una variable asocia un nombre con un valor para poder volver a usarlo. Usa nombres que describan el dato. const es la opción habitual cuando no reasignas el valor; let se reserva para aquello que sí cambia durante el programa.',
        example: 'const nombre = "Ana";\nlet intentos = 0;\nintentos = 1;',
        exampleCaption: 'nombre conserva su valor; intentos se reasigna y pasa de cero a uno.',
      },
      {
        title: 'Texto, números y booleanos',
        content: 'Las comillas crean texto. Un número no lleva comillas. true y false representan dos estados posibles y tampoco llevan comillas.',
        example: 'const ciudad = "Lima";\nconst edad = 25;\nconst activo = true;',
      },
      {
        title: 'Error común: un número disfrazado de texto',
        content: '"25" y 25 no son lo mismo. El primero es texto; el segundo permite hacer cuentas. Si un dato viene de un formulario, recuerda que puede necesitar conversión.',
      },
      {
        title: 'Para curiosos: ¿dónde vive el dato?',
        content: 'El motor de JavaScript reserva y administra memoria para los valores mientras el programa funciona. La variable es el nombre que usamos para acceder a un valor; no es una caja física ni una dirección que podamos inspeccionar. JavaScript oculta las direcciones de memoria: normalmente trabajas con nombres y valores, no con números de dirección.',
        example: 'let edad = 25;\nedad = 26;',
        exampleCaption: 'Al reasignar, el nombre edad queda asociado con el nuevo valor. El motor se ocupa de la memoria interna.',
        kind: 'curiosity',
      },
    ],
    keyPoints: ['Una variable une un nombre y un valor', 'const para lo que no se reasigna', 'let para lo que cambia', 'Las comillas cambian el tipo del dato'],
  }),
  readingOf({
    lessonId: 'fundamentos-04',
    title: 'operadores y expresiones',
    summary: 'Una expresión combina valores y operadores para producir un resultado nuevo.',
    sections: [
      {
        title: 'Calcular y comparar',
        content: 'Los operadores aritméticos producen números. Los comparadores producen true o false. Puedes guardar cualquiera de esos resultados en una variable.',
        example: 'const total = precio * cantidad;\nconst esMayor = edad >= 18;',
      },
      {
        title: 'El resto de una división',
        content: 'El operador % devuelve lo que sobra. Un número es par cuando al dividirlo entre 2 el resto es cero.',
        example: 'const esPar = numero % 2 === 0;',
      },
      {
        title: 'Error común: asignar cuando querías comparar',
        content: 'Un solo igual guarda un valor. Tres iguales preguntan si dos valores y sus tipos coinciden. && exige que ambas condiciones sean verdaderas; || acepta cualquiera de ellas.',
      },
    ],
    keyPoints: ['Una expresión produce un valor', '% devuelve el resto', '=== compara', '&& exige dos condiciones verdaderas'],
  }),
  readingOf({
    lessonId: 'fundamentos-05',
    title: 'decisiones con if',
    summary: 'Una condición permite que el programa elija un camino según los datos actuales.',
    sections: [
      {
        title: 'Una pregunta, dos caminos',
        content: 'if ejecuta su bloque cuando la condición es true. else cubre el caso contrario. Cada camino debe representar una respuesta completa.',
        example: 'if (edad >= 18) {\n  mensaje = "Puede entrar";\n} else {\n  mensaje = "Todavía no";\n}',
      },
      {
        title: 'De lo específico a lo general',
        content: 'En una cadena de else if gana la primera condición verdadera. Pregunta primero por el caso más exigente para no bloquear los siguientes.',
        example: 'if (nota >= 90) {\n  letra = "A";\n} else if (nota >= 80) {\n  letra = "B";\n} else {\n  letra = "C";\n}',
      },
      {
        title: 'Error común: varias respuestas a la vez',
        content: 'Varios if separados pueden ejecutar varios bloques. Usa else if cuando solo debe elegirse una categoría y prueba también los valores que están justo en el límite.',
      },
    ],
    keyPoints: ['if pregunta', 'else cubre el caso contrario', 'La primera condición verdadera gana', 'Prueba los límites'],
  }),
  readingOf({
    lessonId: 'fundamentos-06',
    title: 'repetir con bucles',
    summary: 'Un bucle expresa una repetición con un inicio, una condición para continuar y un cambio por vuelta.',
    sections: [
      {
        title: 'Las tres partes del for',
        content: 'La variable de control empieza en un valor, se comprueba antes de cada vuelta y cambia al terminarla.',
        example: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}',
      },
      {
        title: 'Cuándo usar while',
        content: 'while resulta útil cuando no sabes cuántas vueltas habrá. La condición debe poder cambiar desde dentro del bucle.',
        example: 'while (energia > 0) {\n  energia = energia - 1;\n}',
      },
      {
        title: 'Cuidado: límites y bucles infinitos',
        content: 'Si la condición nunca llega a false, el programa no termina. Si empiezas en 1 cuando necesitabas 0, o usas <= en vez de <, puedes ejecutar una vuelta de más.',
      },
    ],
    keyPoints: ['for sirve para repeticiones contables', 'while depende de una condición', 'La variable de control debe cambiar', 'Revisa inicio y límite'],
  }),
  readingOf({
    lessonId: 'fundamentos-07',
    title: 'funciones reutilizables',
    summary: 'Una función guarda una tarea con nombre para poder ejecutarla con datos distintos.',
    sections: [
      {
        title: 'Definir no es llamar',
        content: 'La definición explica qué hará la función. La llamada es el momento en que el trabajo ocurre.',
        example: 'function doble(numero) {\n  return numero * 2;\n}\n\ndoble(4);',
      },
      {
        title: 'Parámetros y resultado',
        content: 'Los parámetros reciben los datos de cada llamada. return entrega el resultado al lugar donde la función fue llamada.',
        example: 'const resultado = doble(7); // 14',
      },
      {
        title: 'Error común: fijar el ejemplo',
        content: 'Una función general debe usar sus parámetros. Si devuelve siempre 3 * 4, ignora los datos de otras llamadas. También recuerda que sin return el resultado será undefined.',
      },
    ],
    keyPoints: ['Definir y llamar son acciones distintas', 'Los parámetros cambian por llamada', 'return entrega el resultado', 'La fórmula debe usar los parámetros'],
  }),
  readingOf({
    lessonId: 'fundamentos-08',
    title: 'arrays',
    summary: 'Un array guarda varios valores en una lista ordenada y permite trabajarlos como un conjunto.',
    sections: [
      {
        title: 'Crear, leer y modificar',
        content: 'Los arrays se escriben entre corchetes. Cada valor ocupa una posición numérica. push agrega al final y pop quita el último.',
        example: 'const frutas = ["manzana", "pera"];\nfrutas.push("uva");\nconst primera = frutas[0];',
      },
      {
        title: 'Recorrer toda la lista',
        content: 'Un for puede visitar cada índice desde cero hasta antes de length. Dentro de la vuelta, lista[i] representa el elemento actual.',
        example: 'for (let i = 0; i < frutas.length; i++) {\n  console.log(frutas[i]);\n}',
      },
      {
        title: 'Error común: confundir cantidad y último índice',
        content: 'length indica cuántos elementos hay. Como el primer índice es 0, el último índice es length - 1. lista[length] queda fuera de la lista.',
      },
    ],
    keyPoints: ['Un array es una lista ordenada', 'El primer índice es 0', 'length cuenta elementos', 'push agrega al final'],
  }),
  readingOf({
    lessonId: 'fundamentos-09',
    title: 'objetos',
    summary: 'Un objeto agrupa datos relacionados bajo nombres en lugar de posiciones.',
    sections: [
      {
        title: 'Una ficha con campos',
        content: 'Cada propiedad tiene una clave y un valor. El orden no define el significado: lo define el nombre de la clave.',
        example: 'const producto = {\n  nombre: "Té",\n  precio: 4\n};',
      },
      {
        title: 'Leer una propiedad',
        content: 'La notación de punto entra por el nombre del campo. Puedes pasar el objeto completo a una función y leer allí lo necesario.',
        example: 'producto.nombre\nproducto.precio',
      },
      {
        title: 'Error común: tratar un objeto como array',
        content: 'producto[0] no significa “nombre”. Un objeto se consulta por clave. Usa un array cuando importa el orden y un objeto cuando importan los nombres.',
      },
      {
        title: 'Para curiosos: dos variables pueden compartir un objeto',
        content: 'Los arrays y los objetos son datos compuestos. Al asignar un objeto existente a otra variable, JavaScript copia una referencia al mismo objeto; no crea automáticamente una copia independiente. Por eso un cambio realizado con cualquiera de los dos nombres se observa desde el otro.',
        example: 'const producto = { nombre: "Té" };\nconst seleccionado = producto;\nseleccionado.nombre = "Café";\n\nconsole.log(producto.nombre); // Café',
        exampleCaption: 'producto y seleccionado permiten llegar al mismo objeto. La referencia no es una dirección de memoria visible.',
        kind: 'curiosity',
      },
    ],
    keyPoints: ['Un objeto agrupa datos relacionados', 'Las claves dan significado', 'El punto lee una propiedad', 'Un objeto no se recorre por posición como un array'],
  }),
  readingOf({
    lessonId: 'fundamentos-10',
    title: 'la página y el DOM',
    summary: 'El DOM representa los elementos del HTML para que JavaScript pueda encontrarlos y cambiar propiedades concretas.',
    sections: [
      {
        title: 'El HTML se convierte en elementos',
        content: 'El navegador representa cada etiqueta como un objeto del DOM. Un id funciona como nombre único y permite localizar un elemento específico.',
        example: '<h2 id="titulo">Título original</h2>\n<p id="mensaje">Texto original</p>',
      },
      {
        title: 'Buscar y guardar',
        content: 'getElementById recibe el id entre comillas y devuelve el elemento. Guardarlo en una variable evita repetir la búsqueda y hace visible qué elemento usamos.',
        example: 'const mensaje = document.getElementById("mensaje");',
      },
      {
        title: 'Error común: buscar un id que no existe',
        content: 'textContent contiene el texto visible. Asignar un valor nuevo cambia únicamente esa propiedad. Si el id no coincide, no hay elemento que modificar.',
        example: 'mensaje.textContent = "Texto nuevo";',
      },
    ],
    keyPoints: ['El DOM representa la página', 'Un id identifica un elemento', 'getElementById busca', 'textContent cambia el texto'],
  }),
  readingOf({
    lessonId: 'fundamentos-11',
    title: 'eventos y botones',
    summary: 'Un evento permite que el programa espere una acción y ejecute una función cuando esa acción ocurre.',
    sections: [
      {
        title: 'Registrar una respuesta',
        content: 'addEventListener conecta un elemento, el nombre de un evento y una función. El programa queda esperando hasta que el navegador detecta esa acción.',
        example: 'boton.addEventListener("click", responderAlClick);',
      },
      {
        title: 'Entregar no es llamar',
        content: 'El nombre responderAlClick entrega la función para después. responderAlClick() la ejecutaría ahora. Los paréntesis cambian el momento de ejecución.',
      },
      {
        title: 'Error común: conectar el elemento equivocado',
        content: 'El clic debe escucharse en el botón. Si el id apunta a otro elemento o no existe, la respuesta nunca quedará conectada donde esperabas.',
      },
    ],
    keyPoints: ['Un evento avisa una acción', 'click va entre comillas', 'La función se entrega sin paréntesis', 'El navegador llama la función después'],
  }),
  readingOf({
    lessonId: 'fundamentos-12',
    title: 'inputs y formularios',
    summary: 'Un formulario sencillo lee una entrada, transforma el dato y muestra una salida.',
    sections: [
      {
        title: 'Leer el valor actual',
        content: 'El input es un elemento. Su propiedad value contiene lo que la persona escribió. Conviene leerla dentro del evento para obtener el dato actual.',
        example: 'const nombreEscrito = entrada.value;',
      },
      {
        title: 'Transformar por separado',
        content: 'Una función que recibe texto y devuelve texto se puede probar sin pulsar botones. El evento coordina la entrada y la salida, pero la transformación sigue siendo sencilla.',
        example: 'function crearSaludo(nombre) {\n  return "Hola, " + nombre;\n}',
      },
      {
        title: 'Error común: guardar un valor viejo',
        content: 'Si lees value al iniciar la página, quizá guardes una cadena vacía. Léelo cuando ocurra el clic para trabajar con lo que la persona acaba de escribir.',
      },
    ],
    keyPoints: ['value contiene la entrada', 'El evento lee el dato actual', 'Una función transforma', 'textContent muestra la salida'],
  }),
  readingOf({
    lessonId: 'fundamentos-13',
    title: 'listas en la página',
    summary: 'Un bucle puede convertir cada dato de un array en un elemento visible del DOM.',
    sections: [
      {
        title: 'Una vuelta, una fila',
        content: 'El for con índice que ya conoces recorre el array. items[i] obtiene el dato actual; createElement crea una fila, textContent coloca el dato y appendChild la agrega a la lista.',
        example: 'const fila = document.createElement("li");\nfila.textContent = items[i];\nlista.appendChild(fila);',
      },
      {
        title: 'Limpiar antes de dibujar',
        content: 'Si una función dibuja toda la lista, debe retirar las filas anteriores antes del bucle. Así la pantalla representa una sola vez el estado actual del array.',
        example: 'lista.innerHTML = "";',
      },
      {
        title: 'Error común: ignorar el elemento actual',
        content: 'Si cada li recibe el mismo texto fijo, todas las filas serán iguales. Usa la variable del bucle para representar el dato de esa vuelta.',
      },
    ],
    keyPoints: ['Un array guarda los datos', 'Un bucle recorre', 'createElement crea', 'appendChild agrega al DOM'],
  }),
  readingOf({
    lessonId: 'fundamentos-14',
    title: 'proyecto guiado: lista de tareas',
    summary: 'Una aplicación pequeña coordina estado, validación, renderizado y eventos con funciones separadas.',
    sections: [
      {
        title: 'El array es el dato principal',
        content: 'La lista visible puede borrarse y dibujarse de nuevo. Las tareas reales viven en el array. Primero cambia el dato y después actualiza la pantalla.',
        example: 'const tareas = [];\ntareas.push("Leer");',
      },
      {
        title: 'Una responsabilidad por función',
        content: 'agregarTarea valida y guarda. dibujarTareas representa el array. manejarClick coordina la entrada y las dos operaciones. Separar permite revisar cada paso.',
      },
      {
        title: 'Error común: aceptar datos vacíos',
        content: 'La condición debe ejecutarse antes de push. Si el texto está vacío, la función sale sin cambiar tareas. El orden protege el estado del programa.',
      },
    ],
    keyPoints: ['El array conserva las tareas', 'La condición valida', 'push guarda', 'El render refleja el estado actual'],
  }),
  ...ADVANCED_READINGS,
];

export const READING_BY_LESSON: Record<string, ReadingItem> = Object.fromEntries(
  READINGS.map((reading) => {
    const profile = PEDAGOGICAL_PROFILE_BY_LESSON[reading.relatedLessonId!];
    return [reading.relatedLessonId!, {
      ...reading,
      frequentQuestions: reading.frequentQuestions ?? profile?.frequentQuestions,
      transferPrompt: reading.transferPrompt ?? profile?.transferPrompt,
    }];
  }),
);
