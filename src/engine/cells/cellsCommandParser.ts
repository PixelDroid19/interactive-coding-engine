import {
  CELLS_BROWSER_COMMANDS,
  type CellsBrowserCommandName,
  type CellsBrowserCommandDefinition,
  type CellsRuntimeAction,
} from './cellsCliContract';

export type { CellsRuntimeAction } from './cellsCliContract';

export interface ParsedCellsCommand {
  command: CellsBrowserCommandName;
  runtimeAction: CellsRuntimeAction;
  options: Record<string, unknown>;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quote) {
      if (character === quote) {
        quote = null;
      } else if (character === '\\' && input[index + 1] === quote) {
        current += quote;
        index += 1;
      } else {
        current += character;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += character;
    }
  }
  if (quote) throw new Error('El comando contiene una comilla sin cerrar.');
  if (current) tokens.push(current);
  return tokens;
}

function validateScaffold(value: unknown): { name: string; namespace?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('El scaffold debe ser un objeto JSON.');
  }
  const source = value as Record<string, unknown>;
  if (typeof source.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(source.name)) {
    throw new Error('El nombre del componente debe usar palabras minúsculas separadas por guiones.');
  }
  if (!/^(?:academy|open-cells)-/.test(source.name)) {
    throw new Error('El nombre debe usar una identidad neutral academy-* u open-cells-*.');
  }
  if (source.namespace !== undefined && source.namespace !== '@open-cells-learning') {
    throw new Error('El namespace debe ser neutral: @open-cells-learning.');
  }
  return {
    name: source.name,
    ...(source.namespace ? { namespace: source.namespace as string } : {}),
  };
}

export function parseCellsCommand(input: string): ParsedCellsCommand {
  const tokens = tokenize(input.trim());
  if (tokens[0] !== 'cells') throw new Error('Solo se aceptan comandos cells dentro de este runtime.');
  const command = tokens[1] as CellsBrowserCommandName;
  if (!Object.hasOwn(CELLS_BROWSER_COMMANDS, command)) throw new Error(`El comando ${tokens[1] ?? '(vacío)'} no está disponible en el navegador.`);
  const definition: CellsBrowserCommandDefinition = CELLS_BROWSER_COMMANDS[command];
  const args = tokens.slice(2);

  if (command === 'component:create' || command === 'app:create') {
    if (args.length !== 2 || !['-s', '--scaffold'].includes(args[0])) {
      throw new Error(`${command} requiere --scaffold con JSON inline y no instala dependencias.`);
    }
    if (!args[1].trimStart().startsWith('{')) throw new Error('El scaffold del navegador debe ser JSON inline; no puede ser una ruta local.');
    let parsed: unknown;
    try {
      parsed = JSON.parse(args[1]);
    } catch {
      throw new Error('El valor de --scaffold debe ser JSON válido.');
    }
    return { command, runtimeAction: definition.runtimeAction, options: { scaffold: validateScaffold(parsed) } };
  }

  if (command === 'component:test') {
    if (args.length === 0) return { command, runtimeAction: definition.runtimeAction, options: {} };
    if (args.length === 1 && args[0] === '--coverage') {
      return { command, runtimeAction: definition.runtimeAction, options: { coverage: true } };
    }
    throw new Error('En navegador component:test solo acepta --coverage.');
  }

  if (command === 'app:test') {
    const options: Record<string, unknown> = {};
    for (let index = 0; index < args.length; index += 1) {
      const argument = args[index];
      if (argument === '--coverage' && options.coverage === undefined) {
        options.coverage = true;
        continue;
      }
      if ((argument === '-c' || argument === '--config') && options.config === undefined) {
        const config = args[index + 1];
        if (!config) throw new Error('app:test requiere un valor después de la opción de configuración.');
        if (config !== 'dev.js' && config !== 'prod.js') throw new Error('app:test solo acepta dev.js o prod.js como configuración browser-safe.');
        options.config = config;
        index += 1;
        continue;
      }
      throw new Error('En navegador app:test solo acepta --coverage y -c/--config con dev.js o prod.js.');
    }
    return { command, runtimeAction: definition.runtimeAction, options };
  }

  if (definition.config && definition.config !== 'optional') {
    if (args.some((argument) => ['--port', '-p', '--host', '--open', '-o', '--watch', '-w'].includes(argument))) {
      throw new Error(`${command} no acepta opciones de servidor, puertos o procesos en el navegador.`);
    }
    if (args.length !== 2 || !['-c', '--config'].includes(args[0])) {
      throw new Error(`${command} requiere la opción de configuración -c ${definition.config}.`);
    }
    if (args[1] !== definition.config) {
      throw new Error(`${command} solo acepta ${definition.config} como configuración browser-safe.`);
    }
    return { command, runtimeAction: definition.runtimeAction, options: { config: args[1] } };
  }

  if (args.length > 0) {
    throw new Error(`${command} no acepta opciones de servidor, puertos o procesos en el navegador.`);
  }
  return { command, runtimeAction: definition.runtimeAction, options: {} };
}
