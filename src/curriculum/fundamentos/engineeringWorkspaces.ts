import { file, workspaceOf } from '../../engine/lessonCompiler';

const CAPSTONE_HTML = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Planificador personal</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <main>
      <p class="eyebrow">Proyecto final</p>
      <h1>Mi plan</h1>
      <label>Tarea <input id="texto" placeholder="Ej. Estudiar 20 minutos"></label>
      <label>
        Prioridad
        <select id="prioridad">
          <option value="1">1 · Alta</option>
          <option value="2">2 · Media</option>
          <option value="3">3 · Baja</option>
        </select>
      </label>
      <button id="agregar">Agregar</button>
      <p id="error" role="status"></p>
      <ul id="lista"></ul>
    </main>
    <script src="state.js"></script>
    <script src="rules.js"></script>
    <script src="render.js"></script>
    <script src="app.js"></script>
  </body>
</html>`;

const CAPSTONE_CSS = `html,
body {
  min-height: 100%;
  margin: 0;
  background: #12151e;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}

body { padding: 28px; }
main { max-width: 520px; }

h1 {
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.eyebrow {
  color: #7dd3fc;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

label {
  display: grid;
  gap: 5px;
  margin: 12px 0;
  color: #cbd5e1;
}

input,
select,
button {
  padding: 10px;
  border: 1px solid #64748b;
  background: #0f172a;
  color: #fff;
}

button {
  background: #ffe600;
  color: #111;
  font-weight: 800;
  cursor: pointer;
}

li {
  margin: 8px 0;
  padding: 10px;
  border-left: 4px solid #38bdf8;
  background: #1e293b;
}

#error { color: #fda4af; }`;

const STATE = `// Responsabilidad: conservar la fuente de verdad.
const planes = [];
`;

const RENDER = `// Responsabilidad: representar datos; no decide si un plan es válido.
function renderPlanes(lista) {
  const contenedor = document.getElementById("lista");
  contenedor.innerHTML = "";
  for (let i = 0; i < lista.length; i++) {
    const fila = document.createElement("li");
    fila.textContent = lista[i].texto + " · Prioridad " + lista[i].prioridad;
    contenedor.appendChild(fila);
  }
}
`;

const APP = `// Responsabilidad: coordinar el evento y el flujo completo.
function manejarAgregar() {
  const texto = document.getElementById("texto").value;
  const prioridad = document.getElementById("prioridad").value;
  const error = document.getElementById("error");
  if (esPlanValido(texto, prioridad) === false) {
    error.textContent = "Escribe una tarea y elige una prioridad válida.";
    return;
  }
  error.textContent = "";
  planes.push({ texto: texto.trim(), prioridad });
  renderPlanes(planes);
}

document.getElementById("agregar").addEventListener("click", manejarAgregar);
`;

export function capstoneWorkspace(rulesSource: string) {
  return workspaceOf('rules.js', {
    'index.html': file('index.html', CAPSTONE_HTML),
    'style.css': file('style.css', CAPSTONE_CSS),
    'state.js': file('state.js', STATE),
    'rules.js': file('rules.js', rulesSource),
    'render.js': file('render.js', RENDER),
    'app.js': file('app.js', APP),
  });
}
