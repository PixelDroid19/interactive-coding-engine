import { describe, expect, it } from 'vitest';
import { parseTutorHint } from './tutorHint';

describe('contrato de las pistas', () => {
  it.each([
    '¿Qué debería observar primero para encontrar la causa?',
    '¿QUE DEBERIA OBSERVAR PRIMERO PARA ENCONTRAR LA CAUSA?',
  ])('no acepta copiar la pregunta del alumno: %s', question => {
    expect(() => parseTutorHint(JSON.stringify({ question }), new Set(),
      'Veo varios cambios. ¿Qué debería observar primero para encontrar la causa? No escribas la solución.')).toThrow(/repitas/);
  });

  it('permite una pregunta nueva que reutiliza los nombres de las variables del alumno', () => {
    const question = '¿Qué propiedad cambia dentro de updated y qué provoca ese cambio en el siguiente ciclo?';
    expect(parseTutorHint(JSON.stringify({ question }), new Set(), '¿Por qué cambia total aunque no cambio subtotal?'))
      .toBe(question);
  });

  it('permite mencionar una etiqueta ya presente sin convertirla en una instrucción o bloque HTML', () => {
    const question = '¿Quién registra la etiqueta <alerta-app> y qué salida debe haber para confirmar que se registró?';
    expect(parseTutorHint(JSON.stringify({ question }), new Set(['<alerta-app>']))).toBe(question);
    expect(() => parseTutorHint(JSON.stringify({ question }))).toThrow();
    for (const proposed of [
      '¿Ya añadiste <nueva-alerta> al documento?',
      '¿Puedes insertar <alerta-app>Listo</alerta-app>?',
      '¿Ya pusiste <alerta-app estado="listo">?',
    ]) expect(() => parseTutorHint(JSON.stringify({ question: proposed }), new Set(['<alerta-app>']))).toThrow();
  });

  it('conserva la pregunta generada sin sustituirla por una respuesta prefabricada', () => {
    expect(parseTutorHint(JSON.stringify({ question: '¿Qué diferencia ves en la estructura de las dos llamadas al final de cada línea?' })))
      .toBe('¿Qué diferencia ves en la estructura de las dos llamadas al final de cada línea?');
  });

  it.each([
    'Reescribe el archivo con console.log("Listo").',
    'Usa `return valor * 2` para calcular el resultado.',
    'Agrega const total = 10 al principio.',
    'Añade <button>Guardar</button> en la página.',
    'Llama a read_diagnostics para ver la salida.',
  ])('rechaza una propuesta de código o herramienta: %s', code => {
    expect(() => parseTutorHint(JSON.stringify({ question: `¿Has hecho esto: ${code}?` }))).toThrow();
  });

  it.each([
    'No es JSON',
    '[]',
    JSON.stringify({ question: 'Falta una pregunta.' }),
    JSON.stringify({ question: 1 }),
    JSON.stringify({ question: '¿Qué cambia aquí?', solution: 'return 4' }),
    JSON.stringify({ question: `¿${'a'.repeat(241)}?` }),
    JSON.stringify({ question: '¿Qué cambia aquí? ¿Por qué?' }),
  ])('rechaza una pista incompleta o fuera del contrato', text => {
    expect(() => parseTutorHint(text)).toThrow();
  });
});
