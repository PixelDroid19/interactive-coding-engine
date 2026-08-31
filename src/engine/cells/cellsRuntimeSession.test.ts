import { describe, expect, it } from 'vitest';
import { CellsRuntimeSession } from './cellsRuntimeSession';
import type { CellsWorkerRequest } from './cellsWorkerProtocol';

function request<T extends CellsWorkerRequest['type']>(
  type: T,
  payload: Extract<CellsWorkerRequest, { type: T }>['payload'],
  generation: number,
): Extract<CellsWorkerRequest, { type: T }> {
  return { type, payload, generation, requestId: `req-${type}-${generation}`, sessionId: 'session-1' } as Extract<CellsWorkerRequest, { type: T }>;
}

describe('CellsRuntimeSession', () => {
  it('recorre crear, previsualizar, probar y exportar sin procesos falsos', async () => {
    const session = new CellsRuntimeSession('session-1');
    const created = await session.handle(request('project:create', { scaffold: { name: 'academy-learning-card' } }, 0));
    expect(created.type).toBe('workspace:updated');

    const preview = await session.handle(request('preview:build', {}, 0));
    expect(preview).toMatchObject({ type: 'preview:built', payload: { warnings: [] } });
    if (preview.type === 'preview:built') expect(preview.payload.html).toContain('<academy-learning-card');

    const testPreview = await session.handle(request('preview:build', { runContractTests: true, testRunId: 'run-1' }, 0));
    expect(testPreview.type).toBe('preview:built');
    if (testPreview.type === 'preview:built') expect(testPreview.payload.html).toContain("source: 'open-cells-tests'");

    const tested = await session.handle(request('tests:run', { coverage: true }, 0));
    expect(tested.type).toBe('tests:completed');
    if (tested.type === 'tests:completed') {
      expect(tested.payload.results.every((result) => result.passed)).toBe(true);
      expect(tested.payload.coverage?.behaviors.percentage).toBe(100);
    }

    const exported = await session.handle(request('project:export', {}, 0));
    expect(exported.type).toBe('project:exported');
    if (exported.type === 'project:exported') {
      expect(Array.from(exported.payload.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
      expect(exported.payload.fileName).toBe('academy-learning-card.zip');
    }
  });

  it('rechaza una operación sobre una generación vieja', async () => {
    const session = new CellsRuntimeSession('session-1');
    await session.handle(request('project:create', { scaffold: { name: 'academy-learning-card' } }, 0));
    const result = await session.handle(request('file:write', { path: 'README.md', content: '# Cambio' }, 0));
    expect(result).toMatchObject({ type: 'runtime:error', payload: { error: { code: 'INVALID_WORKSPACE' } } });
  });

  it('genera los catálogos del componente y continúa desde la nueva generación', async () => {
    const session = new CellsRuntimeSession('session-1');
    const created = await session.handle(request('project:create', { scaffold: { name: 'academy-learning-card' } }, 0));
    if (created.type !== 'workspace:updated') throw new Error('No se creó el proyecto de prueba.');
    const sourcePath = Object.keys(created.payload.workspace.files).find((path) => /^src\/academy-learning-card\.js$/.test(path));
    if (!sourcePath) throw new Error('No se encontró el componente de prueba.');

    const edited = await session.handle(request('file:write', {
      path: sourcePath,
      content: `${created.payload.workspace.files[sourcePath].content}\nthis.t('learningCard.extra');\n`,
    }, 1));
    expect(edited.type).toBe('workspace:updated');

    const generated = await session.handle(request('command:run', { command: 'cells component:locales' }, 1));
    expect(generated.type).toBe('locales:generated');
    expect(generated.generation).toBe(2);
    if (generated.type !== 'locales:generated') return;
    expect(generated.payload.keys).toContain('learningCard.extra');
    for (const path of ['locales/locales.json', 'demo/locales/locales.json', 'test/unit/locales/locales.json']) {
      const catalog = JSON.parse(generated.payload.workspace.files[path].content);
      expect(catalog.es['learningCard.extra']).toBe('learningCard.extra');
      expect(catalog.en['learningCard.extra']).toBe('learningCard.extra');
    }

    const preview = await session.handle(request('preview:build', {}, 2));
    expect(preview.type).toBe('preview:built');
  });

  it('genera el catálogo consolidado de una aplicación', async () => {
    const session = new CellsRuntimeSession('session-1');
    const created = await session.handle(request('command:run', {
      command: `cells app:create --scaffold '{"name":"academy-store-app"}'`,
    }, 0));
    if (created.type !== 'command:completed' || !created.payload.workspace) throw new Error('No se creó la aplicación de prueba.');
    const sourcePath = 'app/pages/academy-home-page/academy-home-page.js';

    await session.handle(request('file:write', {
      path: sourcePath,
      content: `${created.payload.workspace.files[sourcePath].content}\nthis.t('home.extra');\n`,
    }, 1));
    const generated = await session.handle(request('command:run', { command: 'cells app:locales -c dev.js' }, 1));

    expect(generated.type).toBe('locales:generated');
    expect(generated.generation).toBe(2);
    if (generated.type !== 'locales:generated') return;
    const catalog = JSON.parse(generated.payload.workspace.files['app/locales-app/locales.json'].content);
    expect(catalog.es['home.extra']).toBe('home.extra');
    expect(catalog.en['home.extra']).toBe('home.extra');
  });

  it('regenera la metadata pública desde la entrada real del componente', async () => {
    const session = new CellsRuntimeSession('session-1');
    const created = await session.handle(request('project:create', { scaffold: { name: 'academy-learning-card' } }, 0));
    if (created.type !== 'workspace:updated') throw new Error('No se creó el proyecto de prueba.');
    const metadata = JSON.parse(created.payload.workspace.files['custom-elements.json'].content);
    metadata.modules[0].path = 'src/archivo-inexistente.js';
    metadata.modules[0].declarations[0].name = 'ClaseInexistente';
    metadata.modules[0].declarations[0].tagName = 'academy-tag-inexistente';
    metadata.modules[0].exports[0].name = 'academy-tag-inexistente';

    await session.handle(request('file:write', {
      path: 'custom-elements.json',
      content: `${JSON.stringify(metadata, null, 2)}\n`,
    }, 1));
    const generated = await session.handle(request('command:run', { command: 'cells component:documentation' }, 1));

    expect(generated.type).toBe('documentation:generated');
    expect(generated.generation).toBe(2);
    if (generated.type !== 'documentation:generated') return;
    const repaired = JSON.parse(generated.payload.workspace.files['custom-elements.json'].content);
    expect(repaired.modules[0].path).toBe('src/academy-learning-card.js');
    expect(repaired.modules[0].declarations[0]).toMatchObject({
      name: 'AcademyLearningCard',
      tagName: 'academy-learning-card',
    });
    expect(repaired.modules[0].exports[0]).toMatchObject({
      name: 'academy-learning-card',
      declaration: { name: 'AcademyLearningCard', module: 'src/academy-learning-card.js' },
    });
  });
});
