export type CellsBrowserCommandName =
  | 'component:create'
  | 'component:test'
  | 'component:locales'
  | 'component:documentation'
  | 'component:build:demo'
  | 'component:dev'
  | 'app:create'
  | 'app:test'
  | 'app:locales'
  | 'app:build'
  | 'app:dev';

export type CellsRuntimeAction =
  | 'create-component'
  | 'create-application'
  | 'test-component'
  | 'test-application'
  | 'generate-locales'
  | 'generate-app-locales'
  | 'generate-documentation'
  | 'build-preview';

export interface CellsBrowserCommandDefinition {
  runtimeAction: CellsRuntimeAction;
  config?: 'dev.js' | 'prod.js' | 'optional';
}

export const CELLS_BROWSER_COMMANDS = Object.freeze({
  'component:create': { runtimeAction: 'create-component' },
  'component:test': { runtimeAction: 'test-component' },
  'component:locales': { runtimeAction: 'generate-locales' },
  'component:documentation': { runtimeAction: 'generate-documentation' },
  'component:build:demo': { runtimeAction: 'build-preview' },
  'component:dev': { runtimeAction: 'build-preview' },
  'app:create': { runtimeAction: 'create-application' },
  'app:test': { runtimeAction: 'test-application', config: 'optional' },
  'app:locales': { runtimeAction: 'generate-app-locales', config: 'dev.js' },
  'app:build': { runtimeAction: 'build-preview', config: 'prod.js' },
  'app:dev': { runtimeAction: 'build-preview', config: 'dev.js' },
} as const satisfies Record<CellsBrowserCommandName, CellsBrowserCommandDefinition>);
