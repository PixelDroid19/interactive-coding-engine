// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { runChallengeValidation } from '../../engine/testRunner';
import { DEBUG_EXERCISES } from './debugExercises';
import { cloneWorkspace } from '../../engine/eventLog';

describe('laboratorios de depuración', () => {
  it.each(DEBUG_EXERCISES)('$id empieza con todas sus comprobaciones fallando', async (exercise) => {
    const result = await runChallengeValidation(
      {
        id: exercise.id,
        title: exercise.title,
        timestamp: 0,
        instructions: exercise.description || '',
        tests: exercise.tests,
        hints: [],
      },
      exercise.initialWorkspace,
      null,
    );

    expect(result.tests.filter((test) => test.isEvaluationError)).toEqual([]);
    expect(result.passedCount).toBe(0);
    expect(result.allPassed).toBe(false);
  });

  it('la práctica de variables se resuelve sin exigir funciones ni operadores futuros', async () => {
    const exercise = DEBUG_EXERCISES.find((item) => item.id === 'fundamentos-03-debug')!;
    const workspace = cloneWorkspace(exercise.initialWorkspace);
    workspace.files['app.js'].content = [
      'let intentos = 0;',
      'intentos = 1;',
      'console.log(intentos);',
    ].join('\n');

    const result = await runChallengeValidation(
      { id: exercise.id, title: exercise.title, timestamp: 0, instructions: exercise.description || '', tests: exercise.tests, hints: [] },
      workspace,
      null,
    );

    expect(exercise.initialWorkspace.files['app.js'].content).not.toContain('function');
    expect(result.allPassed).toBe(true);
  });

  it('la práctica de variables no revela let o const antes de solicitar una pista', () => {
    const exercise = DEBUG_EXERCISES.find((item) => item.id === 'fundamentos-03-debug')!;
    const initiallyVisibleCopy = [
      exercise.description,
      exercise.expectedBehavior,
      exercise.observedBehavior,
      exercise.initialWorkspace.files['index.html'].content,
      ...exercise.tests.map((test) => test.description),
    ].join('\n');

    expect(initiallyVisibleCopy).not.toMatch(/const.+let|let.+const|declararse\s+con\s+let/i);
  });

  it('la práctica de operadores no exige condicionales todavía', async () => {
    const exercise = DEBUG_EXERCISES.find((item) => item.id === 'fundamentos-04-debug')!;
    const workspace = cloneWorkspace(exercise.initialWorkspace);
    workspace.files['app.js'].content = [
      'const numero = 9;',
      'const divisor = 3;',
      'const esMultiplo = numero % divisor === 0;',
      'console.log(esMultiplo);',
    ].join('\n');

    const result = await runChallengeValidation(
      { id: exercise.id, title: exercise.title, timestamp: 0, instructions: exercise.description || '', tests: exercise.tests, hints: [] },
      workspace,
      null,
    );

    expect(exercise.initialWorkspace.files['app.js'].content).not.toMatch(/function|if\s*\(/);
    expect(result.allPassed).toBe(true);
  });

  it.each([
    ['fundamentos-03-debug', 'let intentos = 1;\nconsole.log(intentos);'],
    ['fundamentos-04-debug', 'const numero = 9;\nconst divisor = 3;\nconst esMultiplo = 0 === numero % divisor;\nconsole.log(esMultiplo);'],
    ['fundamentos-06-debug', 'for (let i = 1; i < 4; i++) { console.log(i); }'],
  ])('%s acepta una solución equivalente y no una única línea memorizada', async (exerciseId, validSource) => {
    const exercise = DEBUG_EXERCISES.find((item) => item.id === exerciseId)!;
    const workspace = cloneWorkspace(exercise.initialWorkspace);
    workspace.files['app.js'].content = validSource;

    const result = await runChallengeValidation(
      { id: exercise.id, title: exercise.title, timestamp: 0, instructions: exercise.description || '', tests: exercise.tests, hints: [] },
      workspace,
      null,
    );

    expect(result.tests.filter((test) => test.isEvaluationError)).toEqual([]);
    expect(result.allPassed).toBe(true);
  });

  it.each([
    ['fundamentos-01-debug', 'console.log("Me llamo Ana");\nconsole.log("Estoy aprendiendo JavaScript");'],
    ['fundamentos-02-debug', 'console.log("Abrir el grifo");\nconsole.log("Usar jabón");\nconsole.log("Secar las manos");'],
    ['fundamentos-03-debug', 'let intentos = 0;\nintentos = 1;\nconsole.log(intentos);'],
    ['fundamentos-04-debug', 'const numero = 9;\nconst divisor = 3;\nconst esMultiplo = numero % divisor === 0;\nconsole.log(esMultiplo);'],
    ['fundamentos-05-debug', 'const nota = 75;\nlet letra = "";\nif (nota >= 90) { letra = "A"; } else if (nota >= 80) { letra = "B"; } else if (nota >= 70) { letra = "C"; } else { letra = "F"; }\nconsole.log(letra);'],
    ['fundamentos-06-debug', 'for (let i = 1; i <= 3; i++) { console.log(i); }'],
    ['fundamentos-07-debug', 'function areaRectangulo(ancho, alto) { return ancho * alto; }'],
    ['fundamentos-08-debug', 'function primero(lista) { return lista[0]; }\nfunction ultimo(lista) { return lista[lista.length - 1]; }'],
    ['fundamentos-09-debug', 'function etiqueta(item) { return item.nombre + " — " + item.precio; }'],
    ['fundamentos-10-debug', 'const titulo = document.getElementById("titulo");\nconst mensaje = document.getElementById("mensaje");\ntitulo.textContent = "Página lista";\nmensaje.textContent = "DOM conectado";'],
    ['fundamentos-11-debug', 'const boton = document.getElementById("accion");\nconst estado = document.getElementById("estado");\nfunction responder() { estado.textContent = "Recibido"; }\nboton.addEventListener("click", responder);'],
    ['fundamentos-12-debug', 'const entrada = document.getElementById("nombre");\nconst boton = document.getElementById("saludar");\nconst salida = document.getElementById("salida");\nfunction mostrarSaludo() { salida.textContent = "Hola, " + entrada.value; }\nboton.addEventListener("click", mostrarSaludo);'],
    ['fundamentos-13-debug', 'const tareas = ["Leer", "Practicar", "Descansar"];\nconst lista = document.getElementById("lista");\nfor (let i = 0; i < tareas.length; i++) { const fila = document.createElement("li"); fila.textContent = tareas[i]; lista.appendChild(fila); }'],
    ['fundamentos-14-debug', 'const tareas = [];\nfunction agregarTarea(texto) {\n  if (texto === "") return tareas.length;\n  tareas.push(texto);\n  return tareas.length;\n}'],
    ['fundamentos-15-debug', 'function aplicarDescuento(precio, tasa) { return precio - precio * tasa; }'],
    ['fundamentos-16-debug', 'function terminaEnJs(nombre) { return nombre.endsWith(".js"); }'],
    ['fundamentos-17-debug', 'function clasificarSaldo(saldo) { if (saldo === 0) return "cero"; if (saldo > 0) return "positivo"; return "negativo"; }'],
    ['fundamentos-18-debug', 'function contarPares(lista) { let cantidad = 0; for (let i = 0; i < lista.length; i++) { if (lista[i] % 2 === 0) cantidad++; } return cantidad; }'],
    ['fundamentos-19-debug', 'function contieneNumero(lista, buscado) { for (let i = 0; i < lista.length; i++) { if (lista[i] === buscado) return true; } return false; }'],
    ['fundamentos-20-debug', 'function enRango(valor, minimo, maximo) { return valor >= minimo && valor <= maximo; }'],
    ['fundamentos-21-debug', 'function transicion(actual, accion) { if (accion === "sumar") return actual + 1; if (accion === "restar") return actual - 1; return actual; }'],
    ['fundamentos-22-debug', 'function subtotal(precio, cantidad) { return precio * cantidad; }'],
    ['fundamentos-23-debug', 'function resumen(pendientes) { return "Pendientes: " + pendientes; }'],
    ['fundamentos-24-debug', 'function prioridadValida(prioridad) { return prioridad >= 1 && prioridad <= 3; }'],
  ])('%s acepta una solución válida sin falsos negativos', async (exerciseId, validSource) => {
    const exercise = DEBUG_EXERCISES.find((item) => item.id === exerciseId)!;
    const workspace = cloneWorkspace(exercise.initialWorkspace);
    workspace.files['app.js'].content = validSource;

    const result = await runChallengeValidation(
      { id: exercise.id, title: exercise.title, timestamp: 0, instructions: exercise.description || '', tests: exercise.tests, hints: [] },
      workspace,
      null,
    );

    expect(result.tests.filter((test) => test.isEvaluationError)).toEqual([]);
    expect(result.allPassed).toBe(true);
  });
});
