import { DebuggingExerciseItem } from '../../types/curriculum';
import { ChallengeTest } from '../../types/scrim';
import { file, workspaceOf } from '../../engine/lessonCompiler';

interface Draft {
  number: number;
  title: string;
  expected: string;
  observed: string;
  starter: string;
  tests: ChallengeTest[];
  hints: string[];
}

function debug(draft: Draft): DebuggingExerciseItem {
  const lessonId = `fundamentos-${String(draft.number).padStart(2, '0')}`;
  return {
    id: `${lessonId}-debug`,
    relatedLessonId: lessonId,
    title: draft.title,
    type: 'debugging',
    executionMode: draft.number === 24 ? 'browser' : 'logic',
    estimatedMinutes: 7,
    description: 'Reproduce, predice y corrige la causa sin reescribir el programa completo.',
    templateId: 'vanilla-js',
    expectedBehavior: draft.expected,
    observedBehavior: draft.observed,
    initialWorkspace: workspaceOf('app.js', {
      'index.html': file('index.html', `<!doctype html>
<html lang="es">
  <body style="background: #12151e; color: #fff; font-family: system-ui; padding: 28px;">
    <h1>Laboratorio de depuración</h1>
    <p>Usa la consola y las comprobaciones como evidencia.</p>
    <script src="app.js"></script>
  </body>
</html>`),
      'app.js': file('app.js', draft.starter),
    }),
    tests: draft.tests,
    hints: draft.hints.map((text, index) => ({ level: index + 1, text })),
    troubleshootingTips: ['Escribe la salida esperada antes de editar.', 'Cambia una sola causa y vuelve a ejecutar con otro dato.'],
  };
}

export const ADVANCED_DEBUG_EXERCISES: DebuggingExerciseItem[] = [
  debug({ number: 15, title: 'El descuento resta la cantidad equivocada', expected: '100 con veinte por ciento devuelve 80.', observed: 'Devuelve 99.8 porque resta la tasa en vez del descuento calculado.', starter: 'function aplicarDescuento(precio, tasa) {\n  return precio - tasa;\n}\nconsole.log(aplicarDescuento(100, 0.2));', tests: [
    { id: 'descuento-20', description: 'Calcula veinte por ciento sobre 100', validatorType: 'function-call', targetFunction: 'aplicarDescuento', args: [100, 0.2], expectedReturn: 80 },
    { id: 'descuento-10', description: 'Generaliza a otro precio y tasa', validatorType: 'function-call', targetFunction: 'aplicarDescuento', args: [50, 0.1], expectedReturn: 45 },
  ], hints: ['Compara unidades: precio está en dinero y tasa es una proporción.', 'Primero calcula cuánto dinero representa la tasa.', 'Resta precio por tasa al precio original.'] }),
  debug({ number: 16, title: 'El archivo JavaScript nunca coincide', expected: 'curso.js y app.js devuelven true.', observed: 'La función siempre devuelve false y no consulta el contrato del string.', starter: 'function terminaEnJs(nombre) {\n  return false;\n}\nconsole.log(terminaEnJs("curso.js"));', tests: [
    { id: 'termina-curso-js', description: 'Reconoce curso.js', validatorType: 'function-call', targetFunction: 'terminaEnJs', args: ['curso.js'], expectedReturn: true },
    { id: 'termina-app-js', description: 'Usa el argumento con otro archivo', validatorType: 'function-call', targetFunction: 'terminaEnJs', args: ['app.js'], expectedReturn: true },
    { id: 'rechaza-otra-extension', description: 'Rechaza un archivo con otra extensión', validatorType: 'function-call', targetFunction: 'terminaEnJs', args: ['foto.png'], expectedReturn: false },
    { id: 'consulta-extension', description: 'Consulta la terminación del texto recibido', validatorType: 'source-regex', regexPattern: 'nombre\\s*\\.\\s*endsWith\\s*\\(' },
  ], hints: ['Busca un método de string que responda si termina con un fragmento.', 'El receptor es nombre y el argumento es “.js”.', 'endsWith devuelve un booleano y no modifica el texto.'] }),
  debug({ number: 17, title: 'El diagrama perdió dos caminos', expected: 'Positivos, cero y negativos conservan resultados distintos.', observed: 'Los valores no negativos se agrupan en una etiqueta imprecisa y los negativos caen en “cero”.', starter: 'function clasificarSaldo(saldo) {\n  if (saldo >= 0) return "no negativo";\n  return "cero";\n}\nconsole.log(clasificarSaldo(0));', tests: [
    { id: 'saldo-cero', description: 'Conserva un camino exclusivo para cero', validatorType: 'function-call', targetFunction: 'clasificarSaldo', args: [0], expectedReturn: 'cero' },
    { id: 'saldo-negativo', description: 'Conserva el camino negativo', validatorType: 'function-call', targetFunction: 'clasificarSaldo', args: [-2], expectedReturn: 'negativo' },
    { id: 'saldo-positivo', description: 'Conserva el camino positivo', validatorType: 'function-call', targetFunction: 'clasificarSaldo', args: [3], expectedReturn: 'positivo' },
  ], hints: ['Dibuja tres salidas: negativo, cero y positivo.', 'Pregunta por el caso exacto antes del camino general.', 'Agrega una decisión exclusiva para saldo igual a cero.'] }),
  debug({ number: 18, title: 'El contador de pares empieza fuera de la tabla', expected: '[2, 4, 7, 8] contiene tres pares y una lista vacía contiene cero.', observed: 'Devuelve menos uno incluso antes de recorrer.', starter: 'function contarPares(lista) {\n  let cantidad = -1;\n  for (let i = 0; i < lista.length; i++) {\n    if (lista[i] % 2 === 0) cantidad++;\n  }\n  return cantidad;\n}', tests: [
    { id: 'cuenta-pares', description: 'Cuenta cada par una vez', validatorType: 'function-call', targetFunction: 'contarPares', args: [[2, 4, 7, 8]], expectedReturn: 3 },
    { id: 'cuenta-vacia', description: 'La lista vacía parte de cero', validatorType: 'function-call', targetFunction: 'contarPares', args: [[]], expectedReturn: 0 },
  ], hints: ['¿Qué cantidad representa no haber revisado elementos?', 'Traza la lista vacía antes del primer elemento.', 'El contador debe comenzar en cero.'] }),
  debug({ number: 19, title: 'La búsqueda abandona demasiado pronto', expected: 'Encuentra valores aunque no estén en la primera posición.', observed: 'Devuelve false después de mirar solamente el primer elemento.', starter: 'function contieneNumero(lista, buscado) {\n  for (let i = 0; i < lista.length; i++) {\n    if (lista[i] === buscado) return true;\n    return false;\n  }\n}\n', tests: [
    { id: 'busqueda-tercero', description: 'Busca hasta la tercera posición', validatorType: 'function-call', targetFunction: 'contieneNumero', args: [[2, 5, 8], 8], expectedReturn: true },
    { id: 'busqueda-segundo', description: 'Busca hasta la segunda posición', validatorType: 'function-call', targetFunction: 'contieneNumero', args: [[2, 5], 5], expectedReturn: true },
    { id: 'busqueda-ausente', description: 'Responde false si el valor no aparece', validatorType: 'function-call', targetFunction: 'contieneNumero', args: [[2, 5, 8], 7], expectedReturn: false },
    { id: 'busqueda-completa', description: 'Responde false después de terminar el recorrido', validatorType: 'source-regex', regexPattern: '}\\s*return\\s+false' },
  ], hints: ['Sigue la ejecución cuando el primer elemento no coincide.', 'Todavía quedan elementos: no puedes responder false dentro de esa vuelta.', 'El false pertenece después del bucle.'] }),
  debug({ number: 20, title: 'Los límites quedan afuera', expected: 'Diez y veinte pertenecen al rango inclusivo.', observed: 'Las comparaciones estrictas rechazan ambos límites.', starter: 'function enRango(valor, minimo, maximo) {\n  return valor > minimo && valor < maximo;\n}\n', tests: [
    { id: 'incluye-minimo', description: 'Incluye el límite inferior', validatorType: 'function-call', targetFunction: 'enRango', args: [10, 10, 20], expectedReturn: true },
    { id: 'incluye-maximo', description: 'Incluye el límite superior', validatorType: 'function-call', targetFunction: 'enRango', args: [20, 10, 20], expectedReturn: true },
    { id: 'rechaza-fuera', description: 'Rechaza un valor fuera del intervalo', validatorType: 'function-call', targetFunction: 'enRango', args: [21, 10, 20], expectedReturn: false },
    { id: 'limites-inclusivos', description: 'Usa ambos límites inclusivos', validatorType: 'source-regex', regexPattern: 'valor\\s*>=\\s*minimo[\\s\\S]*valor\\s*<=\\s*maximo' },
  ], hints: ['Escribe si el contrato dice incluido o excluido.', 'Prueba exactamente mínimo y exactamente máximo.', 'Las comparaciones necesitan permitir igualdad.'] }),
  debug({ number: 21, title: 'Las acciones no producen el estado correcto', expected: 'Restar desde tres produce dos y sumar produce cuatro.', observed: 'Restar aumenta y sumar no cambia el estado.', starter: 'function transicion(actual, accion) {\n  if (accion === "restar") return actual + 1;\n  return actual;\n}\n', tests: [
    { id: 'transicion-resta', description: 'Restar disminuye el estado', validatorType: 'function-call', targetFunction: 'transicion', args: [3, 'restar'], expectedReturn: 2 },
    { id: 'transicion-suma', description: 'Sumar aumenta el estado', validatorType: 'function-call', targetFunction: 'transicion', args: [3, 'sumar'], expectedReturn: 4 },
  ], hints: ['Escribe una tabla con estado anterior, acción y estado siguiente.', 'La vista no participa en esta regla.', 'Asocia cada acción con una única transición.'] }),
  debug({ number: 22, title: 'La regla ignora la cantidad', expected: 'El subtotal funciona con precios y cantidades diferentes.', observed: 'La función devuelve solamente el precio y no utiliza todo su contrato.', starter: 'function subtotal(precio, cantidad) {\n  return precio;\n}\n', tests: [
    { id: 'subtotal-5x3', description: 'Multiplica cinco por tres', validatorType: 'function-call', targetFunction: 'subtotal', args: [5, 3], expectedReturn: 15 },
    { id: 'subtotal-8x2', description: 'Generaliza a ocho por dos', validatorType: 'function-call', targetFunction: 'subtotal', args: [8, 2], expectedReturn: 16 },
  ], hints: ['Lee la firma como contrato.', 'Los dos parámetros deben participar en la regla.', 'La multiplicación debe usar cantidad.'] }),
  debug({ number: 23, title: 'La regla de resumen conoce la pantalla', expected: 'La regla devuelve un resumen para cualquier cantidad.', observed: 'Intenta escribir en un elemento y no devuelve el dato que la capa de interfaz necesita.', starter: 'function resumen(pendientes) {\n  document.getElementById("salida").textContent = pendientes;\n}\n', tests: [
    { id: 'regla-dos', description: 'Devuelve el resumen para dos', validatorType: 'function-call', targetFunction: 'resumen', args: [2], expectedReturn: 'Pendientes: 2' },
    { id: 'regla-cinco', description: 'Usa el parámetro con otra cantidad', validatorType: 'function-call', targetFunction: 'resumen', args: [5], expectedReturn: 'Pendientes: 5' },
  ], hints: ['Una regla pura debe poder ejecutarse sin HTML.', 'Devuelve el texto; otra parte podrá mostrarlo.', 'Forma el resultado con el parámetro pendientes.'] }),
  debug({ number: 24, title: 'El planificador acepta prioridades imposibles', expected: 'Prioridades cero y cuatro se rechazan.', observed: 'La validación devuelve true para cualquier número.', starter: 'function prioridadValida(prioridad) {\n  return true;\n}\n', tests: [
    { id: 'prioridad-alta', description: 'Rechaza prioridad cuatro', validatorType: 'function-call', targetFunction: 'prioridadValida', args: [4], expectedReturn: false },
    { id: 'prioridad-baja', description: 'Rechaza prioridad cero', validatorType: 'function-call', targetFunction: 'prioridadValida', args: [0], expectedReturn: false },
    { id: 'prioridad-valida', description: 'Acepta una prioridad dentro del intervalo', validatorType: 'function-call', targetFunction: 'prioridadValida', args: [2], expectedReturn: true },
    { id: 'prioridad-intervalo', description: 'Define los dos límites del intervalo válido', validatorType: 'source-regex', regexPattern: 'prioridad\\s*>=\\s*1[\\s\\S]*prioridad\\s*<=\\s*3' },
  ], hints: ['Relee el requisito antes de tocar la interfaz.', 'La prioridad mínima es uno y la máxima es tres.', 'Combina dos comparaciones para formar el intervalo.'] }),
];
