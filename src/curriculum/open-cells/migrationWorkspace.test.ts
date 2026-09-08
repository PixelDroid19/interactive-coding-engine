import { describe, expect, it } from 'vitest';
import { createOpenCellsLessonWorkspace } from './lessonWorkspaces';

async function adapter() {
  const files = createOpenCellsLessonWorkspace(84).snapshot.files;
  expect(files['app/migrations/adapt-catalog.js']).toBeDefined();
  const dependency = `data:text/javascript;base64,${Buffer.from(files['app/migrations/catalog-contract.js'].content).toString('base64')}`;
  const source = files['app/migrations/adapt-catalog.js'].content.replace('./catalog-contract.js', dependency);
  return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).adaptCatalog;
}

describe('catalog compatibility retirement', () => {
  it('measures legacy use while normalizing both consumer contracts', async () => {
    const adapt = await adapter();
    const result = adapt([{ id: 'first', name: 'Museo' }, { id: 'second', title: 'Clima' }]);
    expect(result.items).toEqual([{ id: 'first', name: 'Museo' }, { id: 'second', name: 'Clima' }]);
    expect(result.legacyCount).toBe(1);
    expect(result.rejectedCount).toBe(0);
    expect(result.warnings).toHaveLength(1);
  });

  it('rejects legacy records after retirement without breaking current consumers', async () => {
    const adapt = await adapter();
    const result = adapt([{ id: 'first', name: 'Museo' }, { id: 'second', title: 'Clima' }], { allowLegacy: false });
    expect(result.items).toEqual([{ id: 'second', name: 'Clima' }]);
    expect(result.legacyCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  it('counts invalid records as rejections, not successful migrations', async () => {
    const adapt = await adapter();
    expect(adapt([null, { id: 'first', title: {} }])).toEqual({ items: [], legacyCount: 0, rejectedCount: 2, warnings: [] });
    expect(() => adapt(null)).toThrow(TypeError);
  });
});
