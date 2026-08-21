import { vanillaWorkspace } from './shell';

const NOTE = `// Las líneas que empiezan con // son notas.
// JavaScript no las ejecuta.

`;

export const L03_START = NOTE;
export const L03_VARS = `${NOTE}let edad = 25;
const ciudad = "Lima";

document.getElementById("val-edad").textContent = edad;
document.getElementById("val-ciudad").textContent = ciudad;
`;
export const L03_TYPES = `${NOTE}let edad = 25;
const ciudad = "Lima";

document.getElementById("val-edad").textContent = edad;
document.getElementById("val-ciudad").textContent = ciudad;
document.getElementById("tipos").textContent =
  'typeof "hola" → ' + typeof "hola" +
  " · typeof 25 → " + typeof 25 +
  " · typeof true → " + typeof true;
`;
export const L03_SOLUTION = `${NOTE}const nombre = "Ana";
let edad = 25;
const listo = true;
const ciudad = "Lima";

document.getElementById("val-nombre").textContent = nombre;
document.getElementById("val-edad").textContent = edad;
document.getElementById("val-ciudad").textContent = ciudad;
document.getElementById("val-listo").textContent = String(listo);
document.getElementById("tipos").textContent =
  typeof nombre + " · " + typeof edad + " · " + typeof listo;
`;

export const lesson03Workspace = vanillaWorkspace({
  title: 'Variables y tipos',
  eyebrow: 'Lección 3',

  js: L03_START,
  body: `<p>Una variable es una etiqueta pegada a un valor.</p>
<div class="grid">
  <div class="box"><span>nombre</span><strong id="val-nombre">—</strong></div>
  <div class="box"><span>edad</span><strong id="val-edad">—</strong></div>
  <div class="box"><span>ciudad</span><strong id="val-ciudad">—</strong></div>
  <div class="box"><span>listo</span><strong id="val-listo">—</strong></div>
</div>
<p class="panel" id="tipos">Los tipos aparecen aquí.</p>`,
});

export const L04_START = `${NOTE}const a = 10;
const b = 3;
`;
export const L04_OPS = `${NOTE}const a = 10;
const b = 3;
const lineas = [
  a + " + " + b + " = " + (a + b),
  a + " − " + b + " = " + (a - b),
  a + " × " + b + " = " + (a * b),
  a + " ÷ " + b + " = " + (a / b),
  a + " % " + b + " = " + (a % b) + "  (resto)",
];
document.getElementById("ops").innerHTML = lineas.join("<br>");
`;
export const L04_CMP = `${NOTE}const a = 10;
const b = 3;
const lineas = [
  a + " + " + b + " = " + (a + b),
  a + " % " + b + " = " + (a % b) + "  (resto)",
  "10 === 10 → " + (10 === 10),
  '10 === "10" → ' + (10 === "10") + "  (número vs texto)",
  "true && false → " + (true && false),
  "true || false → " + (true || false),
];
document.getElementById("ops").innerHTML = lineas.join("<br>");
`;
export const L04_SOLUTION = `${NOTE}function esPar(n) {
  return n % 2 === 0;
}

function puedeEntrar(edad, tieneEntrada) {
  return edad >= 18 && tieneEntrada === true;
}

document.getElementById("ops").innerHTML =
  "esPar(10) → " + esPar(10) + "<br>" +
  "esPar(3) → " + esPar(3) + "<br>" +
  "puedeEntrar(20, true) → " + puedeEntrar(20, true) + "<br>" +
  "puedeEntrar(16, true) → " + puedeEntrar(16, true);
`;

export const lesson04Workspace = vanillaWorkspace({
  title: 'Operadores',
  eyebrow: 'Lección 4',

  js: L04_START,
  body: `<p>Diez y tres. Vamos a calcular, comparar y combinar.</p>
<div class="grid">
  <div class="box"><span>a</span><strong>10</strong></div>
  <div class="box"><span>b</span><strong>3</strong></div>
</div>
<p class="panel" id="ops">Las cuentas salen aquí.</p>`,
});

export const L05_START = `${NOTE}const edad = 20;
`;
export const L05_IF = `${NOTE}const edad = 20;
const mensaje = document.getElementById("mensaje");

if (edad >= 18) {
  mensaje.textContent = "Puedes votar";
} else {
  mensaje.textContent = "Todavía no";
}
`;
export const L05_ELSEIF = `${NOTE}const edad = 20;
const nota = 85;
const mensaje = document.getElementById("mensaje");
const extra = document.getElementById("extra");

if (edad >= 18) {
  mensaje.textContent = "Puedes votar";
} else {
  mensaje.textContent = "Todavía no";
}

if (nota >= 90) {
  extra.textContent = "Nota " + nota + " → A";
} else if (nota >= 80) {
  extra.textContent = "Nota " + nota + " → B";
} else {
  extra.textContent = "Nota " + nota + " → C";
}
`;
export const L05_SOLUTION = `${NOTE}function letra(nota) {
  if (nota >= 90) return "A";
  if (nota >= 80) return "B";
  if (nota >= 70) return "C";
  return "F";
}

document.getElementById("mensaje").textContent = "90 → " + letra(90);
document.getElementById("extra").textContent =
  "80 → " + letra(80) + " · 70 → " + letra(70) + " · 40 → " + letra(40);
`;

export const lesson05Workspace = vanillaWorkspace({
  title: 'Condicionales',
  eyebrow: 'Lección 5',

  js: L05_START,
  body: `<p>Si la condición es verdad, un camino. Si no, el otro.</p>
<div class="box"><span>edad</span><strong id="edad">20</strong></div>
<p class="panel" id="mensaje">Aún no hemos preguntado.</p>
<p class="panel" id="extra">Más caminos aparecen aquí.</p>`,
});

export const L06_START = NOTE;
export const L06_FOR = `${NOTE}const caja = document.getElementById("estrellas");
caja.innerHTML = "";
for (let i = 0; i < 5; i++) {
  const s = document.createElement("div");
  s.className = "chip on";
  s.textContent = "★ " + i;
  caja.appendChild(s);
}
document.getElementById("salida").textContent = "Cinco vueltas. i valió 0, 1, 2, 3 y 4.";
`;
export const L06_SOLUTION = `${NOTE}function etiqueta(n) {
  if (n % 3 === 0 && n % 5 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}

const caja = document.getElementById("estrellas");
const salida = document.getElementById("salida");
caja.innerHTML = "";
let texto = "";
for (let i = 1; i <= 20; i++) {
  const pieza = etiqueta(i);
  const chip = document.createElement("div");
  chip.className = pieza === String(i) ? "chip" : "chip on";
  chip.textContent = pieza;
  caja.appendChild(chip);
  texto += pieza + " ";
}
salida.textContent = texto.trim();
`;

export const lesson06Workspace = vanillaWorkspace({
  title: 'Bucles',
  eyebrow: 'Lección 6',

  width: '460px',
  js: L06_START,
  body: `<p>Un bucle repite un bloque mientras la condición sea verdad.</p>
<div class="row" id="estrellas"></div>
<p class="panel" id="salida">Aquí se pintan las vueltas.</p>`,
});

export const L07_START = NOTE;
export const L07_FN = `${NOTE}function saludar(nombre) {
  return "Hola, " + nombre;
}

document.getElementById("saludos").textContent =
  saludar("Ana") + "  ·  " + saludar("Luis");
`;
export const L07_ARROW = `${NOTE}function saludar(nombre) {
  return "Hola, " + nombre;
}

const doble = (n) => n * 2;

document.getElementById("saludos").textContent =
  saludar("Ana") + "  ·  " + saludar("Luis");
document.getElementById("extra").textContent =
  "doble(4) → " + doble(4);
`;
export const L07_SOLUTION = `${NOTE}function areaRectangulo(ancho, alto) {
  return ancho * alto;
}

document.getElementById("saludos").textContent =
  "4 × 3 → " + areaRectangulo(4, 3);
document.getElementById("extra").textContent =
  "10 × 2 → " + areaRectangulo(10, 2);
`;

export const lesson07Workspace = vanillaWorkspace({
  title: 'Funciones',
  eyebrow: 'Lección 7',

  js: L07_START,
  body: `<p>Escribes la tarea una vez. La usas muchas.</p>
<p class="panel" id="saludos">Los saludos salen aquí.</p>
<p class="panel" id="extra">Y el resultado de la función corta.</p>`,
});

export const L08_START = NOTE;
export const L08_ARR = `${NOTE}const frutas = ["manzana", "pera", "uva"];
const caja = document.getElementById("frutas");
caja.innerHTML = "";
for (let i = 0; i < frutas.length; i++) {
  const chip = document.createElement("div");
  chip.className = "chip on";
  chip.textContent = i + ": " + frutas[i];
  caja.appendChild(chip);
}
document.getElementById("info").textContent =
  "frutas[0] → " + frutas[0] + " · length → " + frutas.length;
`;
export const L08_PUSH = `${NOTE}const frutas = ["manzana", "pera", "uva"];
frutas.push("kiwi");
const caja = document.getElementById("frutas");
caja.innerHTML = "";
for (const fruta of frutas) {
  const chip = document.createElement("div");
  chip.className = "chip on";
  chip.textContent = fruta;
  caja.appendChild(chip);
}
document.getElementById("info").textContent =
  "push agregó kiwi. Ahora length es " + frutas.length + ".";
`;
export const L08_SOLUTION = `${NOTE}function suma(numeros) {
  let total = 0;
  for (let i = 0; i < numeros.length; i++) {
    total = total + numeros[i];
  }
  return total;
}

const datos = [2, 5, 3, 10];
document.getElementById("info").textContent =
  "[2, 5, 3, 10] suma " + suma(datos);
`;

export const lesson08Workspace = vanillaWorkspace({
  title: 'Arrays',
  eyebrow: 'Lección 8',

  js: L08_START,
  body: `<p>Una lista ordenada. El primero está en el cero.</p>
<div class="row" id="frutas"></div>
<p class="panel" id="info">Índice, length, push.</p>`,
});

export const L09_START = NOTE;
export const L09_OBJ = `${NOTE}const persona = {
  nombre: "Ana",
  edad: 25,
  activo: true,
};

document.getElementById("val-nombre").textContent = persona.nombre;
document.getElementById("val-edad").textContent = String(persona.edad);
document.getElementById("val-activo").textContent = String(persona.activo);
document.getElementById("ficha").textContent =
  persona.nombre + " · " + persona.edad + " · " + persona.activo;
`;
export const L09_SOLUTION = `${NOTE}const producto = {
  nombre: "Café",
  precio: 12,
};

function etiqueta(item) {
  return item.nombre + " — " + item.precio;
}

document.getElementById("ficha").textContent = etiqueta(producto);
`;

export const lesson09Workspace = vanillaWorkspace({
  title: 'Objetos',
  eyebrow: 'Lección 9',

  js: L09_START,
  body: `<p>Una ficha. Cada dato tiene nombre, no número.</p>
<div class="grid">
  <div class="box"><span>nombre</span><strong id="val-nombre">—</strong></div>
  <div class="box"><span>edad</span><strong id="val-edad">—</strong></div>
  <div class="box"><span>activo</span><strong id="val-activo">—</strong></div>
</div>
<p class="panel" id="ficha">El objeto se lee aquí.</p>`,
});

export const L10_START = `${NOTE}const global = "visible en todos lados";
`;
export const L10_COUNTER = `${NOTE}function crearContador() {
  let n = 0;
  return function () {
    n = n + 1;
    return n;
  };
}

const a = crearContador();
const b = crearContador();

document.getElementById("btn-a").onclick = function () {
  document.getElementById("out-a").textContent = "A → " + a();
};
document.getElementById("btn-b").onclick = function () {
  document.getElementById("out-b").textContent = "B → " + b();
};
`;

export const lesson10Workspace = vanillaWorkspace({
  title: 'Scope y closures',
  eyebrow: 'Lección 10',

  js: L10_START,
  body: `<p>Una variable vive en un sitio. Un closure recuerda el suyo.</p>
<div class="row">
  <button type="button" id="btn-a">Contador A</button>
  <button type="button" class="ghost" id="btn-b">Contador B</button>
</div>
<div class="grid">
  <p class="panel" id="out-a">A → 0</p>
  <p class="panel" id="out-b">B → 0</p>
</div>`,
});

export const L11_START = `${NOTE}const fila = [4, 2, 7, 1, 9, 3];

function pintar(marca, clase) {
  const caja = document.getElementById("fila");
  caja.innerHTML = "";
  fila.forEach((n, i) => {
    const d = document.createElement("div");
    d.className = "cell" + (i === marca ? " mark" : "");
    d.textContent = n;
    caja.appendChild(d);
  });
}

pintar(-1);
document.getElementById("log").textContent = "Fila desordenada. Buscamos el 7.";
`;
export const L11_LINEAR = `${NOTE}const fila = [4, 2, 7, 1, 9, 3];

function pintar(marca) {
  const caja = document.getElementById("fila");
  caja.innerHTML = "";
  fila.forEach((n, i) => {
    const d = document.createElement("div");
    d.className = "cell" + (i === marca ? " mark" : "") + (i < marca ? " gone" : "");
    d.textContent = n;
    caja.appendChild(d);
  });
}

function lineal(objetivo) {
  for (let i = 0; i < fila.length; i++) {
    if (fila[i] === objetivo) return i;
  }
  return -1;
}

const pos = lineal(7);
pintar(pos);
document.getElementById("log").textContent =
  "Búsqueda lineal: miró 4, 2, 7. Encontró el 7 en " + (pos + 1) + " pasos.";
`;
export const L11_BINARY = `${NOTE}const ordenada = [1, 2, 4, 7, 9, 11];

function pintar(marca, goneLeft, goneRight) {
  const caja = document.getElementById("fila");
  caja.innerHTML = "";
  ordenada.forEach((n, i) => {
    const d = document.createElement("div");
    d.className = "cell";
    if (i === marca) d.className += " mark";
    if (i < goneLeft || i > goneRight) d.className += " gone";
    d.textContent = n;
    caja.appendChild(d);
  });
}

function binaria(objetivo) {
  let inicio = 0;
  let fin = ordenada.length - 1;
  let pasos = 0;
  while (inicio <= fin) {
    const medio = Math.floor((inicio + fin) / 2);
    pasos++;
    if (ordenada[medio] === objetivo) {
      pintar(medio, inicio, fin);
      return { medio, pasos };
    }
    if (ordenada[medio] < objetivo) inicio = medio + 1;
    else fin = medio - 1;
  }
  return { medio: -1, pasos };
}

const r = binaria(7);
document.getElementById("log").textContent =
  "Ordenada. Búsqueda binaria encontró el 7 en " + r.pasos + " preguntas.";
`;
export const L11_RECURSION = `${NOTE}function bajar(piso) {
  if (piso === 1) return "ya estás en el 1";
  return "piso " + piso + " → " + bajar(piso - 1);
}

document.getElementById("log").textContent = bajar(4);
`;

export const lesson11Workspace = vanillaWorkspace({
  title: 'Algoritmos básicos',
  eyebrow: 'Lección 11',

  width: '460px',
  js: L11_START,
  body: `<p>Pasos en orden. Buscar uno a uno, partir a la mitad, o llamarte a ti mismo.</p>
<div class="cells" id="fila"></div>
<p class="panel" id="log">La fila espera.</p>`,
});

export const L12_START = `${NOTE}const pila = [];
const cola = [];
`;
export const L12_STACK = `${NOTE}const pila = ["abrir", "escribir", "borrar"];
const cola = ["Ana", "Luis", "Mia"];

function pintar() {
  document.getElementById("pila").innerHTML = pila
    .slice()
    .reverse()
    .map((x) => '<div class="plate">' + x + "</div>")
    .join("");
  document.getElementById("cola").innerHTML = cola
    .map((x) => '<div class="chip on">' + x + "</div>")
    .join("");
}

pintar();
document.getElementById("log").textContent =
  "Pila: el último es borrar. Control Z saca borrar primero.";
`;
export const L12_QUEUE = `${NOTE}const pila = ["abrir", "escribir"];
const cola = ["Luis", "Mia"];

document.getElementById("pila").innerHTML = pila
  .slice().reverse()
  .map((x) => '<div class="plate">' + x + "</div>")
  .join("");
document.getElementById("cola").innerHTML = cola
  .map((x) => '<div class="chip on">' + x + "</div>")
  .join("");
document.getElementById("log").textContent =
  "Cola: Ana ya salió. El primero que llega es el primero que atiende.";
`;
export const L12_MAP = `${NOTE}const edades = { Ana: 25, Luis: 31, Mia: 19 };
document.getElementById("log").textContent =
  "Mapa: edades.Ana → " + edades.Ana + ". No recorres la lista. Vas al nombre.";
`;

export const lesson12Workspace = vanillaWorkspace({
  title: 'Estructuras de datos',
  eyebrow: 'Lección 12',

  js: L12_START,
  extraCss: `.cols { display:grid; grid-template-columns:1fr 1fr; gap:12px; }`,
  body: `<p>Pila, cola y mapa. El orden o el nombre.</p>
<div class="cols">
  <div>
    <p class="label">Pila</p>
    <div class="stack" id="pila"></div>
  </div>
  <div>
    <p class="label">Cola</p>
    <div class="row" id="cola"></div>
  </div>
</div>
<p class="panel" id="log">Tres formas de guardar.</p>`,
});

export const L13_START = `${NOTE}function marcar(id) {
  document.querySelectorAll("tr").forEach((tr) => tr.classList.remove("hot"));
  const row = document.getElementById(id);
  if (row) row.classList.add("hot");
}
`;
export const L13_O1 = `${NOTE}function marcar(id) {
  document.querySelectorAll("tr").forEach((tr) => tr.classList.remove("hot"));
  const row = document.getElementById(id);
  if (row) row.classList.add("hot");
}
marcar("o1");
document.getElementById("log").textContent = "arr[0] da igual 10 o diez millones.";
`;
export const L13_OLOG = `${NOTE}function marcar(id) {
  document.querySelectorAll("tr").forEach((tr) => tr.classList.remove("hot"));
  const row = document.getElementById(id);
  if (row) row.classList.add("hot");
}
marcar("olog");
document.getElementById("log").textContent = "Cada pregunta tira la mitad. Crece muy despacio.";
`;
export const L13_ON = `${NOTE}function marcar(id) {
  document.querySelectorAll("tr").forEach((tr) => tr.classList.remove("hot"));
  const row = document.getElementById(id);
  if (row) row.classList.add("hot");
}
marcar("on");
document.getElementById("log").textContent = "Si hay el doble de datos, tarda el doble.";
`;
export const L13_ON2 = `${NOTE}function marcar(id) {
  document.querySelectorAll("tr").forEach((tr) => tr.classList.remove("hot"));
  const row = document.getElementById(id);
  if (row) row.classList.add("hot");
}
marcar("on2");
document.getElementById("log").textContent = "Un for dentro de otro for. Con mil datos, un millón de comparaciones.";
`;

export const lesson13Workspace = vanillaWorkspace({
  title: 'Complejidad Big O',
  eyebrow: 'Lección 13',

  width: '460px',
  js: L13_START,
  body: `<p>Cómo crece el tiempo cuando crecen los datos.</p>
<table>
  <thead><tr><th>Big O</th><th>Idea</th><th>1 millón</th></tr></thead>
  <tbody>
    <tr id="o1"><td>O(1)</td><td>Fijo</td><td>1</td></tr>
    <tr id="olog"><td>O(log n)</td><td>Mitades</td><td>~20</td></tr>
    <tr id="on"><td>O(n)</td><td>Uno por uno</td><td>1.000.000</td></tr>
    <tr id="on2"><td>O(n²)</td><td>Todos contra todos</td><td>billones</td></tr>
  </tbody>
</table>
<p class="panel" id="log">Mira cómo salta la fila.</p>`,
});

export const L14_START = NOTE;
export const L14_OOP = `${NOTE}const cuenta = {
  saldo: 1000,
  depositar(monto) {
    this.saldo = this.saldo + monto;
  },
  retirar(monto) {
    this.saldo = this.saldo - monto;
  },
};

cuenta.depositar(500);
cuenta.retirar(200);
document.getElementById("oop").textContent = "Saldo: " + cuenta.saldo;
`;
export const L14_FP = `${NOTE}const cuenta = {
  saldo: 1300,
};
document.getElementById("oop").textContent = "Saldo: " + cuenta.saldo;

const precios = [40, 120, 80, 200, 15];
const caros = precios.filter((p) => p > 100);
document.getElementById("fp").textContent =
  "Precios > 100 → " + caros.join(", ");
`;

export const lesson14Workspace = vanillaWorkspace({
  title: 'Paradigmas',
  eyebrow: 'Lección 14',

  js: L14_START,
  extraCss: `.cols { display:grid; grid-template-columns:1fr 1fr; gap:12px; }`,
  body: `<p>Objetos que duran. Funciones que transforman.</p>
<div class="cols">
  <div>
    <p class="label">Orientada a objetos</p>
    <p class="panel" id="oop">Una cuenta, con saldo.</p>
  </div>
  <div>
    <p class="label">Funcional</p>
    <p class="panel" id="fp">Entra lista, sale lista.</p>
  </div>
</div>`,
});
