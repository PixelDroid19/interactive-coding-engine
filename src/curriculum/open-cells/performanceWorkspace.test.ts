import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';

async function evaluator() {
  const file = createOpenCellsLessonWorkspace(82).snapshot.files['app/performance/evaluate-budget.js'];
  expect(file).toBeDefined();
  return (await import(`data:text/javascript;base64,${Buffer.from(file.content).toString('base64')}`)).evaluateBudget;
}

describe('performance budget evaluation', () => {
  it('keeps the first resource baseline separate from later navigations', async () => {
    const files = createOpenCellsLessonWorkspace(82).snapshot.files;
    const file = files['app/performance/session.js'];
    expect(file).toBeDefined();
    const dependency = `data:text/javascript;base64,${Buffer.from(files['app/performance/measure-resources.js'].content).toString('base64')}`;
    const source = file.content.replace('./measure-resources.js', dependency);
    const { captureInitialResources } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const baseline = captureInitialResources([{ name: 'https://example.test/app.js', decodedBodySize: 2048 }]);
    expect(captureInitialResources([{ name: 'https://example.test/detail.js', decodedBodySize: 8192 }])).toEqual(baseline);
    expect(Object.isFrozen(baseline)).toBe(true);
    const home = files['app/pages/academy-home-page/academy-home-page.js'].content;
    const detail = files['app/pages/academy-product-detail-page/academy-product-detail-page.js'].content;
    expect(home).toContain('startNavigation()');
    expect(detail).toContain('finishNavigation(measurementId)');
  });

  it('records each navigation against its own starting clock', async () => {
    const file = createOpenCellsLessonWorkspace(82).snapshot.files['app/performance/navigation.js'];
    expect(file).toBeDefined();
    const { startNavigation, finishNavigation, getNavigationMeasurement } = await import(`data:text/javascript;base64,${Buffer.from(file.content).toString('base64')}`);
    expect(getNavigationMeasurement()).toBeUndefined();
    const first = startNavigation(10);
    const second = startNavigation(15);
    expect(finishNavigation(first, 90)).toBe(false);
    expect(finishNavigation(second, 40)).toBe(true);
    expect(getNavigationMeasurement()).toBe(25);
    expect(finishNavigation(second, 100)).toBe(false);
    expect(getNavigationMeasurement()).toBe(25);
  });

  it('measures initial resources without treating opaque responses as zero', async () => {
    const file = createOpenCellsLessonWorkspace(82).snapshot.files['app/performance/measure-resources.js'];
    expect(file).toBeDefined();
    const { measureInitialResources } = await import(`data:text/javascript;base64,${Buffer.from(file.content).toString('base64')}`);
    expect(measureInitialResources([
      { name: 'https://example.test/assets/app.js', decodedBodySize: 2048 },
      { name: 'https://example.test/assets/app.css', decodedBodySize: 1024 }
    ])).toEqual({ initialJavaScriptKb: 2, initialCssKb: 1 });
    expect(measureInitialResources([{ name: 'https://example.test/app.js', decodedBodySize: 0 }])).toEqual({});
    expect(measureInitialResources([{ name: 'blob:opaque', decodedBodySize: 200 }])).toEqual({});
  });

  it('reports exact excess and treats a boundary measurement as passing', async () => {
    const evaluate = await evaluator();
    expect(evaluate({ initialJavaScriptKb: 180, routeTransitionMs: 250 }, { initialJavaScriptKb: 190, routeTransitionMs: 250 })).toEqual([
      { metric: 'initialJavaScriptKb', limit: 180, measured: 190, excess: 10, status: 'exceeded' },
      { metric: 'routeTransitionMs', limit: 250, measured: 250, excess: 0, status: 'passed' }
    ]);
  });

  it('does not turn absent or invalid measurements into passing results', async () => {
    const evaluate = await evaluator();
    for (const measured of [undefined, null, NaN, Infinity, -1, '0']) {
      expect(evaluate({ routeTransitionMs: 250 }, { routeTransitionMs: measured })[0]).toEqual({ metric: 'routeTransitionMs', limit: 250, measured: null, excess: null, status: 'unmeasured' });
    }
  });

  it('rejects invalid limits rather than silently certifying them', async () => {
    const evaluate = await evaluator();
    for (const limit of [null, NaN, Infinity, -1, '250']) {
      expect(() => evaluate({ routeTransitionMs: limit }, {})).toThrow(RangeError);
    }
  });
});
