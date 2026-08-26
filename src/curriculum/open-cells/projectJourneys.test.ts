import { describe, expect, it } from 'vitest';
import { createCellsAppWorkspace } from '../../engine/cells/cellsAppRecipes';
import { createCellsComponentWorkspace } from '../../engine/cells/cellsRecipes';
import { createOpenCellsProjectJourney } from './projectJourneys';

describe('trayectorias de proyecto Open Cells', () => {
  const component = createCellsComponentWorkspace({ name: 'academy-learning-card' }).snapshot;
  const app = createCellsAppWorkspace({ name: 'academy-store-app' }).snapshot;

  it.each([
    [3, 'src/academy-learning-card.js', component, ['package.json', 'index.js', 'academy-learning-card.js', 'src/academy-learning-card.js']],
    [31, 'demo/demo.js', component, ['demo/index.html', 'demo/demo.js', 'demo/demo-build.js']],
    [39, 'app/scripts/app.js', app, ['index.html', 'app/scripts/app.js', 'app/scripts/app-routes.js', 'app/pages/academy-home-page/academy-home-page.js']],
    [43, 'app/pages/academy-home-page/academy-home-page.js', app, ['app/scripts/app-routes.js', 'app/pages/academy-home-page/academy-home-page.js']],
    [58, 'app/data/academy-product-data-manager.js', app, ['app/data/academy-product-data-manager.js', 'app/pages/academy-home-page/academy-home-page.js']],
    [63, 'test/unit/app.test.js', app, ['test/unit/app.test.js', 'app/scripts/app-routes.js']],
  ] as const)('la lección %s recorre y escribe archivos responsables', (number, focus, workspace, required) => {
    const journey = createOpenCellsProjectJourney(number, focus, workspace);
    const paths = journey.stops.map((stop) => stop.path);
    expect(paths.length).toBeGreaterThanOrEqual(3);
    expect(paths).toEqual(expect.arrayContaining([...required]));
    expect(journey.stops.some((stop) => stop.write)).toBe(true);
    expect(paths.some((path) => path.includes('/checkpoints/'))).toBe(false);
  });
});
