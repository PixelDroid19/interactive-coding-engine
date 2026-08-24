import { describe, expect, it } from 'vitest';
import { CompletionContext } from '@codemirror/autocomplete';
import {
  createSpanishCompletionSource,
  findSpanishWordAt,
  getSpanishDocsForLesson,
} from './spanishLsp';

const CODE = 'document.getElementById("linea1").textContent = "Hola";';

function createContext(text: string) {
  return {
    explicit: false,
    matchBefore: () => ({ from: 0, to: text.length, text }),
  } as unknown as CompletionContext;
}

describe('Spanish LSP', () => {
  it('reconoce identificadores compuestos como una sola palabra', () => {
    const word = findSpanishWordAt(CODE, 15);

    expect(word?.text).toBe('getElementById');
    expect(word?.from).toBe(9);
    expect(word?.to).toBe(23);
  });

  it('no inventa un término cuando el cursor está fuera del identificador', () => {
    expect(findSpanishWordAt(CODE, 8)).toBeNull();
    expect(findSpanishWordAt(CODE, 24)).toBeNull();
  });

  it('limita la lección 1 a los conceptos ya enseñados', () => {
    const labels = getSpanishDocsForLesson('fundamentos-01').map((entry) => entry.label);

    expect(labels).toEqual(['console', 'log']);
  });

  it('sugiere documentación en español según la lección', () => {
    const result = createSpanishCompletionSource('fundamentos-01')(createContext('c'));

    expect(result?.options).toHaveLength(1);
    expect(result?.options[0]?.label).toBe('console');
    expect(result?.options[0]?.info).toContain('consola');
  });

  it('desbloquea la ayuda siguiendo el nuevo orden pedagógico', () => {
    const variables = getSpanishDocsForLesson('fundamentos-03').map((entry) => entry.label);
    const funciones = getSpanishDocsForLesson('fundamentos-07').map((entry) => entry.label);
    const arrays = getSpanishDocsForLesson('fundamentos-08').map((entry) => entry.label);
    const cierre = getSpanishDocsForLesson('fundamentos-14').map((entry) => entry.label);

    expect(variables).toEqual(expect.arrayContaining(['const', 'let']));
    expect(variables).not.toEqual(expect.arrayContaining(['Number', 'String']));
    expect(variables).not.toEqual(expect.arrayContaining(['if', 'map']));
    expect(funciones).toEqual(expect.arrayContaining(['function', 'return']));
    expect(funciones).not.toEqual(expect.arrayContaining(['if', 'map']));
    expect(arrays).toEqual(expect.arrayContaining(['length', 'push']));
    expect(cierre).toEqual(expect.arrayContaining(['document', 'addEventListener']));
    expect(cierre).not.toEqual(expect.arrayContaining(['Number', 'String']));
    expect(cierre).not.toEqual(expect.arrayContaining(['map', 'filter', 'trim', 'export']));
  });

  it('explica métodos y módulos en español solo después de enseñarlos', () => {
    const metodos = getSpanishDocsForLesson('fundamentos-16');
    const colecciones = getSpanishDocsForLesson('fundamentos-19');
    const modulos = getSpanishDocsForLesson('fundamentos-22');

    expect(metodos.map((entry) => entry.label)).toEqual(expect.arrayContaining(['trim', 'toUpperCase', 'includes', 'endsWith']));
    expect(metodos.find((entry) => entry.label === 'trim')?.info).toContain('Mutación');
    expect(colecciones.map((entry) => entry.label)).toEqual(expect.arrayContaining(['map', 'filter', 'find']));
    expect(modulos.map((entry) => entry.label)).toEqual(expect.arrayContaining(['export', 'import']));
  });

  it('documenta eventos con la misma función con nombre enseñada en clase', () => {
    const eventDoc = getSpanishDocsForLesson('fundamentos-11').find((entry) => entry.label === 'addEventListener');

    expect(eventDoc?.info).toContain('function responderAlClick()');
    expect(eventDoc?.info).toContain('addEventListener("click", responderAlClick)');
    expect(eventDoc?.info).not.toContain('addEventListener("click", function()');
  });
});
