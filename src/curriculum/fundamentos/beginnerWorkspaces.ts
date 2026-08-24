import { vanillaWorkspace } from './shell';

const NOTE = `// Las líneas que empiezan con // son notas.
// JavaScript no las ejecuta.

`;

export const L10_START = `${NOTE}// Primero busca un elemento por su id.
const mensaje = document.getElementById("mensaje");
`;

export const L10_COUNTER = `${NOTE}const titulo = document.getElementById("titulo");
const mensaje = document.getElementById("mensaje");

titulo.textContent = "Mi página responde";
mensaje.textContent = "JavaScript encontró dos elementos y cambió su texto.";
`;

export const L10_CHALLENGE = `${NOTE}const titulo = document.getElementById("titulo");
const mensaje = document.getElementById("mensaje");

// Cambia los dos textos originales.
titulo.textContent = "Título original";
mensaje.textContent = "Este texto todavía no ha cambiado.";
`;

export const lesson10BeginnerWorkspace = vanillaWorkspace({
  title: 'La página y el DOM',
  eyebrow: 'Lección 10',
  js: L10_START,
  body: `<p>El DOM representa los elementos de esta página.</p>
<h2 id="titulo">Título original</h2>
<p class="panel" id="mensaje">Este texto todavía no ha cambiado.</p>`,
});

export const L11_START = `${NOTE}// Primero guardamos los elementos que vamos a usar.
const boton = document.getElementById("accion");
const estado = document.getElementById("estado");
`;

export const L11_EVENTS = `${NOTE}const boton = document.getElementById("accion");
const estado = document.getElementById("estado");

function responderAlClick() {
  estado.textContent = "El botón recibió un clic.";
}

boton.addEventListener("click", responderAlClick);
`;

export const L11_CHALLENGE = `${NOTE}const boton = document.getElementById("accion");
const estado = document.getElementById("estado");

function responderAlClick() {
  // Cambia este texto por una respuesta tuya.
  estado.textContent = "PENDIENTE";
}

boton.addEventListener("click", responderAlClick);
`;

export const lesson11BeginnerWorkspace = vanillaWorkspace({
  title: 'Eventos y botones',
  eyebrow: 'Lección 11',
  js: L11_START,
  body: `<p>Un evento avisa que ocurrió algo.</p>
<button type="button" id="accion">Púlsame</button>
<p class="panel" id="estado">Todavía no hay ningún clic.</p>`,
});

export const L12_START = `${NOTE}const entrada = document.getElementById("nombre");
const boton = document.getElementById("saludar");
const salida = document.getElementById("salida");
`;

export const L12_FORM = `${NOTE}const entrada = document.getElementById("nombre");
const boton = document.getElementById("saludar");
const salida = document.getElementById("salida");

function crearSaludo(nombre) {
  return "Hola, " + nombre;
}

function mostrarSaludo() {
  const nombreEscrito = entrada.value;
  salida.textContent = crearSaludo(nombreEscrito);
}

boton.addEventListener("click", mostrarSaludo);
`;

export const L12_CHALLENGE = `${NOTE}const entrada = document.getElementById("nombre");
const boton = document.getElementById("saludar");
const salida = document.getElementById("salida");

function crearSaludo(nombre) {
  // Devuelve un saludo que incluya el nombre recibido.
  return "";
}

function mostrarSaludo() {
  salida.textContent = crearSaludo(entrada.value);
}

boton.addEventListener("click", mostrarSaludo);
`;

export const lesson12BeginnerWorkspace = vanillaWorkspace({
  title: 'Inputs y formularios',
  eyebrow: 'Lección 12',
  js: L12_START,
  body: `<p>La persona escribe un dato y el programa responde.</p>
<label class="label" for="nombre">Tu nombre</label>
<input id="nombre" type="text" placeholder="Escribe aquí">
<button type="button" id="saludar">Saludar</button>
<p class="panel" id="salida">El saludo aparecerá aquí.</p>`,
});

export const L13_START = `${NOTE}const tareas = ["Leer", "Practicar", "Descansar"];
const lista = document.getElementById("lista");
const total = document.getElementById("total");
`;

export const L13_LIST = `${NOTE}const tareas = ["Leer", "Practicar", "Descansar"];
const lista = document.getElementById("lista");
const total = document.getElementById("total");

function mostrarTareas(items) {
  lista.innerHTML = "";
  for (let i = 0; i < items.length; i++) {
    const fila = document.createElement("li");
    fila.textContent = items[i];
    lista.appendChild(fila);
  }
  total.textContent = "Total: " + items.length;
}

mostrarTareas(tareas);
`;

export const L13_CHALLENGE = `${NOTE}function resumenLista(items) {
  // Devuelve un texto que incluya la cantidad y el primer elemento.
  return "";
}

document.getElementById("total").textContent =
  resumenLista(["Leer", "Practicar", "Descansar"]);
`;

export const L13_SOLUTION = `${NOTE}function resumenLista(items) {
  return items.length + " tareas · Primera: " + items[0];
}

document.getElementById("total").textContent =
  resumenLista(["Leer", "Practicar", "Descansar"]);
`;

export const lesson13BeginnerWorkspace = vanillaWorkspace({
  title: 'Listas en la página',
  eyebrow: 'Lección 13',
  js: L13_START,
  body: `<p>Un array puede convertirse en elementos visibles.</p>
<ul id="lista"></ul>
<p class="panel" id="total">Total: 0</p>`,
});

export const L14_START = `${NOTE}const tareas = [];
const entrada = document.getElementById("tarea");
const boton = document.getElementById("agregar");
const lista = document.getElementById("lista");
const total = document.getElementById("total");
`;

export const L14_PROJECT = `${NOTE}const tareas = [];
const entrada = document.getElementById("tarea");
const boton = document.getElementById("agregar");
const lista = document.getElementById("lista");
const total = document.getElementById("total");

function agregarTarea(texto) {
  if (texto === "") return tareas.length;
  tareas.push(texto);
  return tareas.length;
}

function dibujarTareas() {
  lista.innerHTML = "";
  for (let i = 0; i < tareas.length; i++) {
    const fila = document.createElement("li");
    fila.textContent = tareas[i];
    lista.appendChild(fila);
  }
  total.textContent = "Tareas: " + tareas.length;
}

function manejarClick() {
  agregarTarea(entrada.value);
  entrada.value = "";
  dibujarTareas();
}

boton.addEventListener("click", manejarClick);
`;

export const L14_CHALLENGE = `${NOTE}const tareas = [];

function agregarTarea(texto) {
  // Un texto vacío no se agrega.
  // Un texto válido se guarda y devuelve la cantidad actual.
  tareas.push(texto);
  return tareas.length;
}
`;

export const lesson14BeginnerWorkspace = vanillaWorkspace({
  title: 'Proyecto guiado: lista de tareas',
  eyebrow: 'Lección 14',
  js: L14_START,
  body: `<p>Combina datos, funciones, decisiones, arrays, DOM y eventos.</p>
<label class="label" for="tarea">Nueva tarea</label>
<input id="tarea" type="text" placeholder="Ejemplo: practicar JavaScript">
<button type="button" id="agregar">Agregar</button>
<ul id="lista"></ul>
<p class="panel" id="total">Tareas: 0</p>`,
});
