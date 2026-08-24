import { file, workspaceOf } from '../../engine/lessonCompiler';
import { WorkspaceFile } from '../../types/scrim';

export const LESSON1_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Tu primer programa</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p class="eyebrow">Lección 1</p>
    <h1>Tu primer programa</h1>
    <p class="linea">Tu código escribirá en la consola.</p>
    <p class="linea">Ábrela en la parte inferior de la vista previa.</p>
  </main>
  <script src="app.js"></script>
</body>
</html>
`;

export const LESSON1_CSS = `* { box-sizing: border-box; }
html, body { margin: 0; background: #12151e; color: #f8fafc; }
body {
  min-height: 100vh;
  padding: 28px 24px 40px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
main { width: min(420px, 100%); }
.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #aab3c4;
}
h1 {
  margin: 0 0 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #343a49;
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.linea {
  min-height: 1.5em;
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
}
`;

// El primer programa del alumno usa una sola instrucción conocida.
// Sin DOM, variables, funciones propias ni eventos: eso llega después.
export const LESSON1_JS_START = `// Las líneas que empiezan con // son notas para ti.
// JavaScript no las ejecuta. Escribe tus instrucciones debajo.

`;

export const LESSON1_JS_UNA_LINEA = `// Las líneas que empiezan con // son notas para ti.
// JavaScript no las ejecuta. Escribe tus instrucciones debajo.

console.log("Hola, este es mi primer programa");
`;

export const LESSON1_JS_DOS_LINEAS = `// Las líneas que empiezan con // son notas para ti.
// JavaScript no las ejecuta. Escribe tus instrucciones debajo.

console.log("Me llamo Alex");
console.log("Estoy aprendiendo JavaScript");
`;

// Demostración de que la salida conserva el orden del archivo.
export const LESSON1_JS_ORDEN = `// Dos instrucciones. Cambia el orden y cambia la salida.

console.log("Primero");
console.log("Después");
`;

export const lesson1Workspace = workspaceOf('app.js', {
  'index.html': file('index.html', LESSON1_HTML),
  'style.css': file('style.css', LESSON1_CSS),
  'app.js': file('app.js', LESSON1_JS_START),
});

export const ROBOT_FILES: Record<string, WorkspaceFile> = {
  'index.html': file(
    'index.html',
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Instrucciones precisas</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="wrap">
    <h1>Lleva a [R] hasta [M]</h1>
    <p>Cada botón es una sola instrucción. El orden importa.</p>
    <div class="grid" id="grid"></div>
    <div class="controles">
      <button type="button" onclick="mover('arriba')">Arriba</button>
      <button type="button" onclick="mover('abajo')">Abajo</button>
      <button type="button" onclick="mover('izquierda')">Izquierda</button>
      <button type="button" onclick="mover('derecha')">Derecha</button>
      <button type="button" class="ghost" onclick="reiniciar()">Reiniciar</button>
    </div>
    <p id="mensaje">Muévelo hasta la meta.</p>
    <p id="pasos">Pasos: 0</p>
  </main>
  <script src="app.js"></script>
</body>
</html>
`
  ),
  'style.css': file(
    'style.css',
    `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #111827;
  color: #e5e7eb;
}
.wrap { width: min(420px, 92vw); }
h1 { font-size: 22px; margin: 0 0 8px; }
p { margin: 0 0 12px; color: #9ca3af; font-size: 14px; }
.grid {
  display: grid;
  grid-template-columns: repeat(5, 44px);
  gap: 4px;
  margin: 16px 0;
}
.celda {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid #374151;
  background: #1f2937;
  font-size: 12px;
  font-weight: 700;
}
.objetivo { background: #14532d; color: #bbf7d0; border-color: #22c55e; }
.robot { background: #1e3a8a; color: #bfdbfe; border-color: #60a5fa; }
.controles { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #4b5563;
  background: #e5e7eb;
  color: #111827;
  cursor: pointer;
  font-weight: 600;
}
button.ghost { background: transparent; color: #d1d5db; }
#mensaje { font-weight: 700; color: #fde68a; }
#pasos { font-size: 12px; }
`
  ),
  'app.js': file(
    'app.js',
    `let robotX = 0, robotY = 0;
const metaX = 4, metaY = 4;
let pasos = 0;
let ganaste = false;

function dibujar() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const celda = document.createElement("div");
      celda.className = "celda";
      if (x === robotX && y === robotY) {
        celda.textContent = "[R]";
        celda.classList.add("robot");
      } else if (x === metaX && y === metaY) {
        celda.textContent = "[M]";
        celda.classList.add("objetivo");
      }
      grid.appendChild(celda);
    }
  }
}

function mover(direccion) {
  if (ganaste) return;
  let nuevoX = robotX, nuevoY = robotY;
  if (direccion === "arriba") nuevoY--;
  if (direccion === "abajo") nuevoY++;
  if (direccion === "izquierda") nuevoX--;
  if (direccion === "derecha") nuevoX++;

  if (nuevoX < 0 || nuevoX > 4 || nuevoY < 0 || nuevoY > 4) {
    document.getElementById("mensaje").textContent = "No puedes salir del tablero.";
    return;
  }

  robotX = nuevoX;
  robotY = nuevoY;
  pasos++;
  document.getElementById("pasos").textContent = "Pasos: " + pasos;
  dibujar();

  if (robotX === metaX && robotY === metaY) {
    ganaste = true;
    document.getElementById("mensaje").textContent = "Llegaste en " + pasos + " pasos.";
  }
}

function reiniciar() {
  robotX = 0;
  robotY = 0;
  pasos = 0;
  ganaste = false;
  document.getElementById("pasos").textContent = "Pasos: 0";
  document.getElementById("mensaje").textContent = "Muévelo hasta la meta.";
  dibujar();
}

dibujar();
`
  ),
};

export const LESSON2_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Pensar en pasos</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p class="eyebrow">Lección 2</p>
    <h1>Pensar en pasos</h1>
    <p>El código se ejecuta de arriba abajo.</p>
    <p class="panel">Ejecuta el programa y abre la consola para seguir el orden.</p>
  </main>
  <script src="app.js"></script>
</body>
</html>
`;

export const LESSON2_CSS = `* { box-sizing: border-box; }
html, body { margin: 0; background: #12151e; color: #f8fafc; }
body {
  min-height: 100vh;
  padding: 28px 24px 40px;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
main { width: min(380px, 100%); }
.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #aab3c4;
}
h1 {
  margin: 0 0 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #343a49;
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.panel {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #596174;
  color: #cbd5e1;
  font-size: 14px;
}
`;

export const LESSON2_JS_START = `// Plan: preparar una taza de té.
// Falta convertir el plan en instrucciones y respetar el orden.

`;

export const LESSON2_JS_SOLUTION = `// Plan: preparar una taza de té.

console.log("Calentar el agua");
console.log("Poner el té en la taza");
console.log("Servir el agua");
`;

export const lesson2Workspace = workspaceOf('app.js', {
  'index.html': file('index.html', LESSON2_HTML),
  'style.css': file('style.css', LESSON2_CSS),
  'app.js': file('app.js', LESSON2_JS_START),
});

export const PATTERN_FILES: Record<string, WorkspaceFile> = {
  'index.html': file(
    'index.html',
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Encuentra el patrón</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="wrap">
    <h1>Encuentra el patrón</h1>
    <p>¿Qué número sigue? Identifica la regla.</p>
    <div id="ronda" class="meta"></div>
    <div id="secuencia" class="secuencia"></div>
    <div id="opciones" class="opciones"></div>
    <div id="feedback"></div>
    <div id="score" class="meta"></div>
  </main>
  <script src="app.js"></script>
</body>
</html>
`
  ),
  'style.css': file(
    'style.css',
    `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}
.wrap { width: min(440px, 92vw); }
h1 { margin: 0 0 6px; font-size: 22px; }
p { margin: 0 0 14px; color: #94a3b8; }
.meta { font-size: 12px; color: #64748b; margin-bottom: 10px; }
.secuencia, .opciones { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.num, .opcion {
  min-width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #1e293b;
  font-weight: 700;
}
.incognita { background: #3b0764; border-color: #c084fc; color: #e9d5ff; }
.opcion { cursor: pointer; padding: 0 14px; }
.opcion:hover { border-color: #38bdf8; }
.correcto { background: #14532d; border-color: #22c55e; color: #bbf7d0; }
.incorrecto { background: #7f1d1d; border-color: #f87171; color: #fecaca; }
#feedback { min-height: 48px; font-size: 13px; }
button.siguiente {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #38bdf8;
  background: transparent;
  color: #7dd3fc;
  cursor: pointer;
}
`
  ),
  'app.js': file(
    'app.js',
    `const rondas = [
  { seq: [2, 4, 6, 8], resp: 10, opts: [9, 10, 11, 12], exp: "Patrón: sumar 2 cada vez." },
  { seq: [1, 3, 9, 27], resp: 81, opts: [54, 81, 36, 72], exp: "Patrón: multiplicar por 3." },
  { seq: [1, 1, 2, 3, 5], resp: 8, opts: [6, 7, 8, 10], exp: "Patrón: cada número suma los dos anteriores." },
  { seq: [100, 90, 80, 70], resp: 60, opts: [50, 55, 60, 65], exp: "Patrón: restar 10 cada vez." },
  { seq: [1, 4, 9, 16, 25], resp: 36, opts: [30, 36, 42, 49], exp: "Patrón: cuadrados 1, 4, 9, 16, 25, 36." },
];

let rondaActual = 0;
let aciertos = 0;
let respondido = false;

function mostrarRonda() {
  respondido = false;
  const r = rondas[rondaActual];
  document.getElementById("ronda").textContent = "Ronda " + (rondaActual + 1) + " de " + rondas.length;

  const secDiv = document.getElementById("secuencia");
  secDiv.innerHTML = "";
  r.seq.forEach((n) => {
    const d = document.createElement("div");
    d.className = "num";
    d.textContent = n;
    secDiv.appendChild(d);
  });
  const incog = document.createElement("div");
  incog.className = "num incognita";
  incog.textContent = "?";
  secDiv.appendChild(incog);

  const optsDiv = document.getElementById("opciones");
  optsDiv.innerHTML = "";
  r.opts.forEach((opt) => {
    const btn = document.createElement("div");
    btn.className = "opcion";
    btn.textContent = opt;
    btn.onclick = () => verificar(opt, btn);
    optsDiv.appendChild(btn);
  });

  document.getElementById("feedback").textContent = "";
}

function verificar(valor, btn) {
  if (respondido) return;
  respondido = true;
  const r = rondas[rondaActual];
  const feedback = document.getElementById("feedback");

  if (valor === r.resp) {
    btn.classList.add("correcto");
    aciertos++;
    feedback.textContent = "Correcto. " + r.exp;
  } else {
    btn.classList.add("incorrecto");
    document.querySelectorAll(".opcion").forEach((el) => {
      if (parseInt(el.textContent, 10) === r.resp) el.classList.add("correcto");
    });
    feedback.textContent = "Era " + r.resp + ". " + r.exp;
  }

  document.getElementById("score").textContent = "Aciertos: " + aciertos + "/" + (rondaActual + 1);

  if (rondaActual < rondas.length - 1) {
    const sigBtn = document.createElement("button");
    sigBtn.className = "siguiente";
    sigBtn.textContent = "Siguiente";
    sigBtn.onclick = () => { rondaActual++; mostrarRonda(); };
    feedback.appendChild(document.createElement("br"));
    feedback.appendChild(sigBtn);
  } else {
    document.getElementById("score").textContent =
      aciertos === rondas.length
        ? "Perfecto. Ya ves patrones."
        : "Completado: " + aciertos + "/" + rondas.length + ".";
  }
}

mostrarRonda();
`
  ),
};
