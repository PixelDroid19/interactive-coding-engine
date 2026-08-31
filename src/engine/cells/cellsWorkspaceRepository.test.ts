import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { writeCellsFile } from './cellsVirtualFileSystem';
import { CellsWorkspaceRepository, type CellsLabSession } from './cellsWorkspaceRepository';

describe('CellsWorkspaceRepository', () => {
  it('guarda y recupera el snapshot con su generación', async () => {
    const repository = new CellsWorkspaceRepository(new IDBFactory());
    const changed = writeCellsFile(createCellsComponentWorkspace({ name: 'academy-learning-card' }), 'README.md', '# Mi proyecto');
    await repository.save('component:first', changed);
    const restored = await repository.load('component:first');
    expect(restored).toMatchObject({
      status: 'loaded',
      workspace: {
        generation: 1,
        snapshot: { files: { 'README.md': { content: '# Mi proyecto' } } },
      },
    });
    await repository.close();
  });

  it('elimina un borrador sin afectar otras claves', async () => {
    const repository = new CellsWorkspaceRepository(new IDBFactory());
    const workspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    await repository.save('one', workspace);
    await repository.save('two', workspace);
    await repository.remove('one');
    expect(await repository.load('one')).toEqual({ status: 'missing' });
    expect(await repository.load('two')).toMatchObject({ status: 'loaded' });
  });

  it('cuarentena datos corruptos en vez de confundirlos con un proyecto ausente', async () => {
    const factory = new IDBFactory();
    const repository = new CellsWorkspaceRepository(factory);
    await repository.save('valid', createCellsComponentWorkspace({ name: 'academy-learning-card' }));
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('aula_open_cells', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve) => {
      const request = database.transaction('workspaces', 'readwrite').objectStore('workspaces').put({ generation: -1 }, 'broken');
      request.onsuccess = () => resolve();
    });
    const result = await repository.load('broken');
    expect(result).toMatchObject({
      status: 'corrupt',
      recovery: {
        sourceKey: 'broken',
        recoveryKey: expect.stringContaining('workspace:broken'),
        preserved: true,
      },
    });
    if (result.status !== 'corrupt') throw new Error('Se esperaba un resultado de recuperación.');

    const [original, quarantined] = await Promise.all([
      new Promise<unknown>((resolve, reject) => {
        const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get('broken');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise<unknown>((resolve, reject) => {
        const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get(result.recovery.recoveryKey);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
    ]);
    expect(original).toEqual({ generation: -1 });
    expect(quarantined).toMatchObject({
      sourceKey: 'broken',
      value: { generation: -1 },
    });
    database.close();
    await repository.close();
  });

  it('restaura panel, comando, idioma y resultados sin mezclarlos con el workspace', async () => {
    const repository = new CellsWorkspaceRepository(new IDBFactory());
    const session: CellsLabSession = {
      version: 1,
      activePanel: 'tests',
      expandedFolders: ['src', 'demo'],
      command: 'cells component:test --coverage',
      previewLocale: 'en',
      tests: [{ id: 'render', title: 'Render', passed: true, message: 'ok' }],
      coverage: null,
      terminalOutput: '1 de 1 contratos superados.',
      savedAt: Date.now(),
    };

    await repository.saveSession('component:first', session);
    expect(await repository.loadSession('component:first')).toEqual(session);
    await repository.removeSession('component:first');
    expect(await repository.loadSession('component:first')).toBeNull();
  });

  it('rechaza una sesión con rutas de carpetas corruptas', async () => {
    const repository = new CellsWorkspaceRepository(new IDBFactory());
    await expect(repository.saveSession('component:broken', {
      version: 1,
      activePanel: 'preview',
      expandedFolders: [''],
      command: 'cells component:preview',
      previewLocale: 'es',
      tests: [],
      coverage: null,
      terminalOutput: '',
      savedAt: Date.now(),
    })).rejects.toThrow('no son válidas');
  });
});
