import { describe, expect, it } from 'vitest';
import { parseCellsCommand } from './cellsCommandParser';

describe('parser de comandos Cells para navegador', () => {
  it('conserva el contrato component:create con scaffold JSON citado', () => {
    expect(parseCellsCommand(
      `cells component:create --scaffold '{"name":"academy-learning-card","namespace":"@open-cells-learning"}'`,
    )).toEqual({
      command: 'component:create',
      runtimeAction: 'create-component',
      options: {
        scaffold: { name: 'academy-learning-card', namespace: '@open-cells-learning' },
      },
    });
  });

  it('reconoce pruebas con coverage real como una opción del mismo comando', () => {
    expect(parseCellsCommand('cells component:test --coverage')).toEqual({
      command: 'component:test',
      runtimeAction: 'test-component',
      options: { coverage: true },
    });
  });

  it.each([
    ['cells component:locales', 'generate-locales'],
    ['cells component:documentation', 'generate-documentation'],
    ['cells component:build:demo', 'build-preview'],
    ['cells component:dev', 'build-preview'],
  ] as const)('traduce %s a una acción honesta del runtime', (input, action) => {
    expect(parseCellsCommand(input)).toMatchObject({ runtimeAction: action });
  });

  it.each([
    'npm install lit',
    'cells component:create --install-deps',
    'cells component:test --watch',
    'cells component:dev --port 8001',
    'cells desconocido',
  ])('rechaza comandos o estados que el navegador no puede ejecutar: %s', (input) => {
    expect(() => parseCellsCommand(input)).toThrow();
  });

  it('rechaza nombres no neutrales o sin guion en el scaffold', () => {
    expect(() => parseCellsCommand(`cells component:create --scaffold '{"name":"card"}'`)).toThrow(/nombre/i);
    expect(() => parseCellsCommand(`cells component:create --scaffold '{"name":"private-product-card"}'`)).toThrow(/neutral/i);
  });

  it('acepta crear, probar y construir una aplicación sin servidor falso', () => {
    expect(parseCellsCommand(`cells app:create --scaffold '{"name":"academy-store-app"}'`)).toMatchObject({
      command: 'app:create', runtimeAction: 'create-application',
    });
    expect(parseCellsCommand('cells app:test --coverage')).toEqual({
      command: 'app:test', runtimeAction: 'test-application', options: { coverage: true },
    });
    expect(parseCellsCommand('cells app:dev -c dev.js')).toEqual({
      command: 'app:dev', runtimeAction: 'build-preview', options: { config: 'dev.js' },
    });
  });

  it.each([
    ['cells app:dev -c dev.js', 'app:dev', 'build-preview', 'dev.js'],
    ['cells app:build --config prod.js', 'app:build', 'build-preview', 'prod.js'],
    ['cells app:locales -c dev.js', 'app:locales', 'generate-app-locales', 'dev.js'],
  ] as const)('normaliza la configuración real de %s', (input, command, runtimeAction, config) => {
    expect(parseCellsCommand(input)).toEqual({ command, runtimeAction, options: { config } });
  });

  it('permite que app:test seleccione configuración y coverage sin depender del orden', () => {
    expect(parseCellsCommand('cells app:test --coverage -c dev.js')).toEqual({
      command: 'app:test',
      runtimeAction: 'test-application',
      options: { coverage: true, config: 'dev.js' },
    });
    expect(parseCellsCommand('cells app:test --config prod.js')).toEqual({
      command: 'app:test',
      runtimeAction: 'test-application',
      options: { config: 'prod.js' },
    });
  });

  it('acepta el alias -s de la CLI solo cuando contiene JSON inline', () => {
    expect(parseCellsCommand(`cells component:create -s '{"name":"academy-learning-card"}'`)).toMatchObject({
      command: 'component:create',
      options: { scaffold: { name: 'academy-learning-card' } },
    });
    expect(() => parseCellsCommand('cells component:create -s ./scaffold.json')).toThrow(/JSON inline/i);
  });

  it.each([
    'cells app:dev',
    'cells app:build',
    'cells app:locales',
    'cells app:dev -c staging.js',
    'cells app:build -c ../prod.js',
  ])('rechaza configuración ausente o fuera del contrato browser-safe: %s', (input) => {
    expect(() => parseCellsCommand(input)).toThrow(/configuración|dev\.js|prod\.js/i);
  });

  it('rechaza puertos, watch e instalación de dependencias en apps', () => {
    expect(() => parseCellsCommand('cells app:dev --port 4000')).toThrow(/no acepta opciones/);
    expect(() => parseCellsCommand('cells app:test --watch')).toThrow(/coverage|config/i);
    expect(() => parseCellsCommand('cells app:install-deps')).toThrow(/no está disponible/);
  });
});
