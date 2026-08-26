import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { createCellsComponentWorkspace } from './cellsRecipes';

const CLI_ROOT = process.env.CELLS_CLI_ROOT
  ?? '/run/media/monasterios/Kioxia 256GB/cells/cells-academy/cli';

interface CliPlan {
  files: ReadonlyArray<{ path: string; content: string | Uint8Array }>;
}

async function cliRecipe(
  profile: 'component' | 'academy-app',
  options: Record<string, unknown>,
): Promise<Map<string, string>> {
  const modulePath = path.join(CLI_ROOT, 'src/recipes/compose-recipe.js');
  if (!existsSync(modulePath)) throw new Error(`No se encontró la CLI Cells en ${CLI_ROOT}.`);
  const cli = await import(/* @vite-ignore */ pathToFileURL(modulePath).href) as {
    composeRecipe(profileName: string, recipeOptions: Record<string, unknown>): CliPlan;
  };
  return new Map(
    cli.composeRecipe(profile, options).files
      .filter((entry): entry is { path: string; content: string } => typeof entry.content === 'string')
      .map((entry) => [entry.path, entry.content]),
  );
}

function browserFiles(workspace: ReturnType<typeof createCellsComponentWorkspace>): Map<string, string> {
  return new Map(Object.values(workspace.snapshot.files).map((entry) => [entry.path, entry.content]));
}

describe('paridad estructural con Cells Academy CLI', () => {
  it('usa el árbol y las versiones públicas del componente CLI vigente', async () => {
    const cli = await cliRecipe('component', {
      kind: 'component',
      name: 'academy-learning-card',
      namespace: '@open-cells-learning',
      cellsVersion: '5',
    });
    const browser = browserFiles(createCellsComponentWorkspace({ name: 'academy-learning-card' }));
    const sharedPaths = [
      'index.js',
      'academy-learning-card.js',
      'src/AcademyLearningCard.js',
      'src/academy-learning-card.scss',
      'src/academy-learning-card.css.js',
      'locales/locales.json',
      'demo/locales/locales.json',
      'test/unit/locales/locales.json',
      'vite.config.js',
    ];

    for (const requiredPath of sharedPaths) {
      expect(cli.has(requiredPath), `La CLI debe definir ${requiredPath}`).toBe(true);
      expect(browser.has(requiredPath), `El runtime browser debe definir ${requiredPath}`).toBe(true);
    }
    expect(cli.has('src/mixins/WidgetMixin.js')).toBe(true);
    expect(cli.has('src/components/AcademyTypeText.js')).toBe(true);
    expect(cli.has('src/components/AcademyButtonDefault.js')).toBe(true);
    expect(browser.has('src/mixins/WidgetMixin.js')).toBe(true);
    expect(browser.has('src/components/OpenCellsTypeText.js')).toBe(true);
    expect(browser.has('src/components/OpenCellsButtonDefault.js')).toBe(true);
    const cliManifest = JSON.parse(cli.get('package.json')!);
    const browserManifest = JSON.parse(browser.get('package.json')!);
    expect(browserManifest.dependencies.lit).toBe(cliManifest.dependencies.lit);
    expect(browserManifest.dependencies['@open-wc/scoped-elements']).toBe(cliManifest.dependencies['@open-wc/scoped-elements']);
    expect(browserManifest.dependencies['@open-cells-learning/public-components']).toBeUndefined();
    expect(browser.get('src/academy-learning-card.js')).toContain("from './mixins/WidgetMixin.js'");
    expect(browserManifest.scripts).toMatchObject({
      build: 'cells component:build:demo',
      dev: 'cells component:dev',
      documentation: 'cells component:documentation',
      locales: 'cells component:locales',
      test: 'cells component:test',
      'test:coverage': 'cells component:test --coverage',
    });
  });

  it('usa Core, Page Mixin y la estructura de aplicación de la CLI vigente', async () => {
    const cli = await cliRecipe('academy-app', {
      kind: 'app',
      name: 'academy-store-app',
      cellsVersion: '5',
    });
    const browser = browserFiles(createCellsAppWorkspace({ name: 'academy-store-app' }));
    const requiredPaths = [
      'app/scripts/app.js',
      'app/scripts/app-routes.js',
      'app/scripts/channels.js',
      'app/config/dev.js',
      'app/config/prod.js',
      'app/data-managers/lesson-data-manager.js',
      'app/locales-app/locales.json',
      'vite.config.js',
    ];

    for (const requiredPath of requiredPaths) {
      expect(cli.has(requiredPath), `La CLI debe definir ${requiredPath}`).toBe(true);
      expect(browser.has(requiredPath), `El runtime browser debe definir ${requiredPath}`).toBe(true);
    }
    const cliManifest = JSON.parse(cli.get('package.json')!);
    const browserManifest = JSON.parse(browser.get('package.json')!);
    expect(browserManifest.dependencies['@open-cells/core']).toBe(cliManifest.dependencies['@open-cells/core']);
    expect(browserManifest.dependencies['@open-cells/page-mixin']).toBe(cliManifest.dependencies['@open-cells/page-mixin']);
    expect(browserManifest.dependencies['@open-cells-learning/app-runtime']).toBeUndefined();
    expect(browser.get('app/scripts/app.js')).toContain("from '@open-cells/core'");
    expect(browserManifest.scripts).toMatchObject({
      dev: 'cells app:dev -c dev.js',
      build: 'cells app:build -c prod.js',
      locales: 'cells app:locales -c dev.js',
      test: 'cells app:test',
    });
  });
});
