import { vanillaWorkspace } from './shell';

const NOTE = `// Las líneas que empiezan con // son notas.
// JavaScript no las ejecuta.

`;

function consoleWorkspace(title: string, eyebrow: string, js: string) {
  return vanillaWorkspace({
    title,
    eyebrow,
    js,
    body: `<p>En esta etapa la salida aparece en la consola.</p>
<p class="panel">Ejecuta el programa y abre Consola en la parte inferior.</p>`,
  });
}

export const L03_START = NOTE;
export const L03_VARS = `${NOTE}let edad = 25;
const ciudad = "Lima";

console.log(edad);
console.log(ciudad);

edad = 26;
console.log(edad);
`;
export const L03_TYPES = `${NOTE}let edad = 25;
const ciudad = "Lima";
const cursoListo = true;

console.log(typeof ciudad);
console.log(typeof edad);
console.log(typeof cursoListo);
`;
export const L03_SOLUTION = `${NOTE}const nombre = "Ana";
let edad = 25;
const listo = true;

console.log(nombre);
console.log(edad);
console.log(listo);
`;
export const lesson03Workspace = consoleWorkspace('Variables y tipos', 'Lección 3', L03_START);

export const L04_START = `${NOTE}const a = 10;
const b = 3;
`;
export const L04_OPS = `${NOTE}const a = 10;
const b = 3;

console.log(a + b);
console.log(a - b);
console.log(a * b);
console.log(a / b);
console.log(a % b);
`;
export const L04_CMP = `${NOTE}const a = 10;
const b = 3;

console.log(a === b);
console.log(a > b);
console.log(a === 10 && b === 3);
`;
export const L04_CHALLENGE_START = `${NOTE}const numero = 8;
const edad = 20;
const tieneEntrada = true;

const esPar = false;
const puedeEntrar = false;

console.log(esPar);
console.log(puedeEntrar);
`;
export const L04_SOLUTION = `${NOTE}const numero = 8;
const edad = 20;
const tieneEntrada = true;

const esPar = numero % 2 === 0;
const puedeEntrar = edad >= 18 && tieneEntrada;

console.log(esPar);
console.log(puedeEntrar);
`;
export const lesson04Workspace = consoleWorkspace('Operadores', 'Lección 4', L04_START);

export const L05_START = `${NOTE}const edad = 20;
`;
export const L05_IF = `${NOTE}const edad = 20;

if (edad >= 18) {
  console.log("Puedes votar");
} else {
  console.log("Todavía no");
}
`;
export const L05_ELSEIF = `${NOTE}const nota = 85;

if (nota >= 90) {
  console.log("A");
} else if (nota >= 80) {
  console.log("B");
} else {
  console.log("C");
}
`;
export const L05_CHALLENGE = `${NOTE}const nota = 85;
let letra = "";

if (nota >= 70) {
  letra = "C";
} else if (nota >= 80) {
  letra = "B";
} else if (nota >= 90) {
  letra = "A";
} else {
  letra = "F";
}

console.log(letra);
`;
export const L05_SOLUTION = `${NOTE}const nota = 85;
let letra = "";

if (nota >= 90) {
  letra = "A";
} else if (nota >= 80) {
  letra = "B";
} else if (nota >= 70) {
  letra = "C";
} else {
  letra = "F";
}

console.log(letra);
`;
export const lesson05Workspace = consoleWorkspace('Condicionales', 'Lección 5', L05_START);

export const L06_START = NOTE;
export const L06_FOR = `${NOTE}for (let i = 0; i < 5; i++) {
  console.log(i);
}
`;
export const L06_CHALLENGE = `${NOTE}for (let i = 1; i < 5; i++) {
  console.log(i);
}
`;
export const L06_SOLUTION = `${NOTE}for (let i = 1; i <= 5; i++) {
  console.log(i);
}
`;
export const lesson06Workspace = consoleWorkspace('Bucles', 'Lección 6', L06_START);

export const L07_START = NOTE;
export const L07_FN = `${NOTE}function saludar(nombre) {
  return "Hola, " + nombre;
}

console.log(saludar("Ana"));
console.log(saludar("Luis"));
`;
export const L07_SOLUTION = `${NOTE}function areaRectangulo(ancho, alto) {
  return ancho * alto;
}

console.log(areaRectangulo(4, 3));
console.log(areaRectangulo(10, 2));
`;
export const lesson07Workspace = consoleWorkspace('Funciones', 'Lección 7', L07_START);

export const L08_START = NOTE;
export const L08_ARR = `${NOTE}const frutas = ["manzana", "pera", "uva"];

console.log(frutas[0]);
console.log(frutas.length);
for (let i = 0; i < frutas.length; i++) {
  console.log(frutas[i]);
}
`;
export const L08_PUSH = `${NOTE}const frutas = ["manzana", "pera", "uva"];
frutas.push("kiwi");

console.log(frutas);
console.log(frutas.length);
`;
export const L08_SOLUTION = `${NOTE}function suma(numeros) {
  let total = 0;
  for (let i = 0; i < numeros.length; i++) {
    total = total + numeros[i];
  }
  return total;
}

console.log(suma([2, 5, 3, 10]));
`;
export const lesson08Workspace = consoleWorkspace('Arrays', 'Lección 8', L08_START);

export const L09_START = NOTE;
export const L09_OBJ = `${NOTE}const persona = {
  nombre: "Ana",
  edad: 25,
  activo: true,
};

console.log(persona.nombre);
console.log(persona.edad);
console.log(persona.activo);
`;
export const L09_SOLUTION = `${NOTE}const producto = {
  nombre: "Café",
  precio: 12,
};

function etiqueta(item) {
  return item.nombre + " — " + item.precio;
}

console.log(etiqueta(producto));
`;
export const lesson09Workspace = consoleWorkspace('Objetos', 'Lección 9', L09_START);
