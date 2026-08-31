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

  it('exporta una copia serializable de la cuarentena sin tocar el registro corrupto', async () => {
    const factory = new IDBFactory();
    const repository = new CellsWorkspaceRepository(factory);
    await repository.save('seed-export', createCellsComponentWorkspace({ name: 'academy-learning-card' }));
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('aula_open_cells', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('workspaces', 'readwrite');
      const request = transaction.objectStore('workspaces').put({ generation: -1 }, 'broken-export');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const result = await repository.load('broken-export');
    if (result.status !== 'corrupt') throw new Error('Se esperaba un resultado de recuperación.');

    await expect(repository.inspectRecovery(result.recovery)).resolves.toEqual({ exportable: true, restorable: false });

    const exported = await repository.exportRecovery(result.recovery);

    expect(exported.fileName).toContain('broken-export');
    expect(JSON.parse(exported.content)).toMatchObject({
      sourceKey: 'broken-export',
      workspace: { generation: -1 },
    });
    const original = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get('broken-export');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(original).toEqual({ generation: -1 });
    database.close();
    await repository.close();
  });

  it('restaura solo una copia de recuperación que supera la validación del workspace', async () => {
    const factory = new IDBFactory();
    const repository = new CellsWorkspaceRepository(factory);
    const validWorkspace = createCellsComponentWorkspace({ name: 'academy-learning-card' });
    await repository.save('seed-restore', validWorkspace);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('aula_open_cells', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const recovery = {
      sourceKey: 'recoverable',
      recoveryKey: 'recovery:workspace:recoverable:1',
      preserved: true,
      message: 'Copia válida.',
    };
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('workspaces', 'readwrite');
      const request = transaction.objectStore('workspaces').put({
        version: 1,
        sourceKey: recovery.sourceKey,
        capturedAt: Date.now(),
        message: recovery.message,
        value: validWorkspace,
      }, recovery.recoveryKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await expect(repository.inspectRecovery(recovery)).resolves.toEqual({ exportable: true, restorable: true });

    await expect(repository.restoreRecovery(recovery)).resolves.toMatchObject({
      generation: validWorkspace.generation,
      snapshot: { activeFilePath: validWorkspace.snapshot.activeFilePath },
    });
    expect(await repository.load(recovery.sourceKey)).toMatchObject({
      status: 'loaded',
      workspace: { generation: validWorkspace.generation },
    });
    const preservedCopy = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get(recovery.recoveryKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(preservedCopy).toMatchObject({ sourceKey: recovery.sourceKey, value: validWorkspace });
    database.close();
    await repository.close();
  });

  it('rechaza restaurar una copia inválida sin modificar ni el original ni la cuarentena', async () => {
    const factory = new IDBFactory();
    const repository = new CellsWorkspaceRepository(factory);
    await repository.save('seed-invalid-restore', createCellsComponentWorkspace({ name: 'academy-learning-card' }));
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('aula_open_cells', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('workspaces', 'readwrite');
      const request = transaction.objectStore('workspaces').put({ generation: -1 }, 'broken-restore');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const result = await repository.load('broken-restore');
    if (result.status !== 'corrupt') throw new Error('Se esperaba un resultado de recuperación.');

    await expect(repository.restoreRecovery(result.recovery)).rejects.toThrow('sigue siendo inválida');
    const [original, preservedCopy] = await Promise.all([
      new Promise<unknown>((resolve, reject) => {
        const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get('broken-restore');
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
    expect(preservedCopy).toMatchObject({ value: { generation: -1 } });
    database.close();
    await repository.close();
  });

  it('descarta el borrador, la cuarentena y la sesión juntos solo mediante la operación explícita', async () => {
    const factory = new IDBFactory();
    const repository = new CellsWorkspaceRepository(factory);
    await repository.save('seed-discard', createCellsComponentWorkspace({ name: 'academy-learning-card' }));
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('aula_open_cells', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('workspaces', 'readwrite');
      const request = transaction.objectStore('workspaces').put({ generation: -1 }, 'broken-discard');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    await repository.saveSession('broken-discard', {
      version: 1,
      activePanel: 'preview',
      expandedFolders: [],
      command: 'cells component:test --coverage',
      previewLocale: 'es',
      tests: [],
      coverage: null,
      terminalOutput: 'Sesión guardada.',
      savedAt: Date.now(),
    });
    const result = await repository.load('broken-discard');
    if (result.status !== 'corrupt') throw new Error('Se esperaba un resultado de recuperación.');

    await repository.discardRecovery(result.recovery);

    expect(await repository.load('broken-discard')).toEqual({ status: 'missing' });
    expect(await repository.loadSession('broken-discard')).toBeNull();
    const preservedCopy = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction('workspaces', 'readonly').objectStore('workspaces').get(result.recovery.recoveryKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(preservedCopy).toBeUndefined();
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
