import { file, workspaceOf } from '../../engine/lessonCompiler';
import type { DebuggingExerciseItem, ReadingItem } from '../../types/curriculum';
import { OPEN_CELLS_DEBUG_06 } from './lesson06';

function numberFromReading(reading: ReadingItem): number {
  const match = reading.id.match(/open-cells-(\d+)-lectura/);
  if (!match) throw new Error(`Lectura Cells sin número estable: ${reading.id}`);
  return Number(match[1]);
}

function generatedDebug(reading: ReadingItem): DebuggingExerciseItem {
  const number = numberFromReading(reading);
  const suffix = String(number).padStart(2, '0');
  const functionName = `resolverContrato${suffix}`;
  return {
    id: `open-cells-${suffix}-depura`,
    relatedLessonId: `open-cells-${suffix}`,
    type: 'debugging',
    title: `Depura: ${reading.title}`,
    description: `Un consumidor intenta elegir el contrato correcto para “${reading.title}”, pero la función ignora la entrada solicitada. Corrige el comportamiento sin copiar código de la clase.`,
    estimatedMinutes: 8,
    executionMode: 'logic',
    templateId: 'js-only',
    initialWorkspace: workspaceOf('app.js', {
      'app.js': file('app.js', `// Modelo pequeño para investigar el contrato de esta lección.
function ${functionName}(nombre, contratos) {
  const primero = Object.values(contratos)[0];
  return primero;
}
`),
    }),
    expectedBehavior: 'Devuelve el valor asociado al nombre solicitado y no confunde contratos distintos.',
    observedBehavior: 'Devuelve siempre la primera entrada disponible, aunque el consumidor solicite otra.',
    hints: [
      { level: 1, text: 'Compara una llamada con “principal” y otra con “alternativo”; solo cambia el nombre solicitado.' },
      { level: 2, text: 'El objeto ya relaciona cada nombre con un valor. El orden de sus propiedades no expresa la intención del consumidor.' },
      { level: 3, text: 'Usa la entrada nombre para consultar la relación; no fijes ninguna de las claves que aparecen en las pruebas.' },
    ],
    tests: [
      { id: `cells${suffix}-debug-principal`, description: 'Resuelve el contrato principal', validatorType: 'function-call', targetFunction: functionName, args: ['principal', { principal: `${reading.title}: principal`, alternativo: `${reading.title}: alternativo` }], expectedReturn: `${reading.title}: principal` },
      { id: `cells${suffix}-debug-alternativo`, description: 'Resuelve una segunda entrada sin fijar la primera', validatorType: 'function-call', targetFunction: functionName, args: ['alternativo', { principal: `${reading.title}: principal`, alternativo: `${reading.title}: alternativo` }], expectedReturn: `${reading.title}: alternativo` },
      { id: `cells${suffix}-debug-ausente`, description: 'Un contrato ausente permanece ausente', validatorType: 'function-call', targetFunction: functionName, args: ['ausente', { principal: `${reading.title}: principal` }], expectedReturn: undefined },
    ],
    troubleshootingTips: [`Relaciona el fallo con el modelo de la lectura: ${reading.summary}`],
  };
}

export function createOpenCellsDebugExercises(readings: ReadingItem[]): Record<string, DebuggingExerciseItem> {
  return Object.fromEntries(readings.map((reading) => {
    const number = numberFromReading(reading);
    const debug = number === 6 ? OPEN_CELLS_DEBUG_06 : generatedDebug(reading);
    return [reading.id, debug];
  }));
}
