import { describe, expect, it } from 'vitest';
import { TypeScriptLanguageService } from './typeScriptLanguageService';

const TEST_LIBS = {
  '/lib.d.ts': [
    'interface String { readonly length: number; toUpperCase(): string; trim(): string; }',
    'interface Array<T> { readonly length: number; push(...items: T[]): number; map<U>(callback: (value: T) => U): U[]; }',
    'interface Console { log(...values: unknown[]): void; }',
    'declare const console: Console;',
  ].join('\n'),
};

function service(files: Record<string, string>) {
  const languageService = new TypeScriptLanguageService(TEST_LIBS);
  languageService.replaceWorkspace(
    Object.entries(files).map(([path, content]) => ({ path, content })),
  );
  return languageService;
}

describe('TypeScriptLanguageService', () => {
  it('completa una función declarada por el estudiante sin imponer paréntesis', () => {
    const code = 'function doble(numero) { return numero * 2; }\ndo';
    const languageService = service({ 'app.js': code });

    const options = languageService.completions('app.js', code.length);
    const identifier = options.find((option) => option.label === 'doble');
    const call = options.find((option) => option.label === 'doble()');

    expect(identifier).toMatchObject({ insertText: 'doble', kind: 'function' });
    expect(call).toMatchObject({ insertText: 'doble()', kind: 'function', cursorOffset: -1 });
  });

  it('encuentra símbolos escritos en otro archivo del mismo ejercicio', () => {
    const app = 'const resultado = su';
    const languageService = service({
      'helpers.js': 'function sumar(a, b) { return a + b; }',
      'app.js': app,
    });

    expect(languageService.completions('app.js', app.length))
      .toEqual(expect.arrayContaining([expect.objectContaining({ label: 'sumar', insertText: 'sumar' })]));
  });

  it('completa variables, parámetros, clases y propiedades según el contexto', () => {
    const languageService = service({ 'app.js': [
      'class Producto {',
      '  constructor() { this.precio = 10; }',
      '}',
      'const subtotal = 20;',
      'function calcular(total, impuesto) {',
      '  return im',
      '}',
      'const pedido = new Producto();',
    ].join('\n') });
    const original = [
      'class Producto {',
      '  constructor() { this.precio = 10; }',
      '}',
      'const subtotal = 20;',
      'function calcular(total, impuesto) {',
      '  return im',
      '}',
      'const pedido = new Producto();',
    ].join('\n');

    expect(languageService.completions('app.js', original.indexOf('return im') + 'return im'.length))
      .toEqual(expect.arrayContaining([expect.objectContaining({ label: 'impuesto' })]));

    const contexts = [
      ['\nsub', 'subtotal'],
      ['\nnew Pro', 'Producto'],
      ['\npedido.pr', 'precio'],
    ] as const;
    for (const [suffix, expected] of contexts) {
      const code = `${original}${suffix}`;
      languageService.updateFile('app.js', code);
      expect(languageService.completions('app.js', code.length))
        .toEqual(expect.arrayContaining([expect.objectContaining({ label: expected })]));
    }
  });

  it('informa en español nombres, propiedades y argumentos incorrectos', () => {
    const code = [
      'function doble(numero) { return numero * 2; }',
      'const texto = "hola";',
      'doble(2, 3);',
      'texto.noExiste();',
      'valorDesconocido;',
    ].join('\n');
    const languageService = service({ 'app.js': code });

    const messages = languageService.diagnostics('app.js').map((diagnostic) => diagnostic.message);

    expect(messages.some((message) => /Se esperaban.+argumentos/i.test(message))).toBe(true);
    expect(messages.some((message) => /propiedad.+noExiste.+no existe/i.test(message))).toBe(true);
    expect(messages.some((message) => /No se encuentra el nombre.+valorDesconocido/i.test(message))).toBe(true);
  });

  it('devuelve información contextual y la firma activa de una función', () => {
    const code = [
      '/** Multiplica un número por dos. */',
      'function doble(numero) { return numero * 2; }',
      'const resultado = doble(',
    ].join('\n');
    const languageService = service({ 'app.js': code });
    const declarationPosition = code.indexOf('doble') + 2;

    const hover = languageService.hover('app.js', declarationPosition);
    const signature = languageService.signatureHelp('app.js', code.length);

    expect(hover?.title).toContain('doble');
    expect(hover?.documentation).toContain('Multiplica un número por dos');
    expect(signature?.label).toContain('doble(numero');
    expect(signature?.activeParameter).toBe(0);
  });
});
