import { createVersionedCellsWorkspace, type VersionedCellsWorkspace } from './cellsVirtualFileSystem';
import type { CellsCoverageResult, CellsTestResult } from './cellsWorkerProtocol';

const DATABASE_NAME = 'aula_open_cells';
const WORKSPACE_STORE = 'workspaces';
const SESSION_STORE = 'sessions';
const DATABASE_VERSION = 2;

export interface CellsWorkspaceRecovery {
  sourceKey: string;
  recoveryKey: string;
  preserved: boolean;
  message: string;
}

export type CellsWorkspaceLoadResult =
  | Readonly<{ status: 'missing' }>
  | Readonly<{ status: 'loaded'; workspace: VersionedCellsWorkspace }>
  | Readonly<{ status: 'corrupt'; recovery: CellsWorkspaceRecovery }>;

export interface CellsLabSession {
  version: 1;
  activePanel: 'code' | 'preview' | 'tests' | 'terminal';
  expandedFolders: string[];
  command: string;
  previewLocale: 'es' | 'en';
  tests: CellsTestResult[];
  coverage: CellsCoverageResult | null;
  terminalOutput: string;
  savedAt: number;
}

function isCellsLabSession(value: unknown): value is CellsLabSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<CellsLabSession>;
  return session.version === 1
    && ['code', 'preview', 'tests', 'terminal'].includes(session.activePanel ?? '')
    && Array.isArray(session.expandedFolders)
    && session.expandedFolders.length <= 256
    && session.expandedFolders.every((path) => typeof path === 'string' && path.length > 0 && path.length <= 512)
    && typeof session.command === 'string'
    && session.command.length <= 512
    && ['es', 'en'].includes(session.previewLocale ?? '')
    && Array.isArray(session.tests)
    && (session.coverage === null || typeof session.coverage === 'object')
    && typeof session.terminalOutput === 'string'
    && session.terminalOutput.length <= 4_000
    && typeof session.savedAt === 'number';
}

export class CellsWorkspaceRepository {
  private database?: Promise<IDBDatabase>;
  private recoverySequence = 0;

  constructor(private readonly factory: IDBFactory = indexedDB) {}

  private open(): Promise<IDBDatabase> {
    if (!this.database) {
      this.database = new Promise((resolve, reject) => {
        const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(WORKSPACE_STORE)) request.result.createObjectStore(WORKSPACE_STORE);
          if (!request.result.objectStoreNames.contains(SESSION_STORE)) request.result.createObjectStore(SESSION_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento local de Open Cells.'));
      });
    }
    return this.database;
  }

  private recoveryKeyFor(key: string): string {
    this.recoverySequence += 1;
    return `recovery:workspace:${key}:${Date.now()}:${this.recoverySequence}`;
  }

  private async quarantineWorkspace(
    database: IDBDatabase,
    sourceKey: string,
    value: unknown,
    error: unknown,
  ): Promise<CellsWorkspaceRecovery> {
    const recoveryKey = this.recoveryKeyFor(sourceKey);
    const message = error instanceof Error ? error.message : 'El proyecto guardado no tiene una estructura válida.';
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(WORKSPACE_STORE, 'readwrite');
        const request = transaction.objectStore(WORKSPACE_STORE).put({
          version: 1,
          sourceKey,
          capturedAt: Date.now(),
          message,
          value,
        }, recoveryKey);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
      });
      return { sourceKey, recoveryKey, preserved: true, message };
    } catch {
      // The original record is deliberately left untouched, so a recovery attempt remains possible.
      return {
        sourceKey,
        recoveryKey,
        preserved: true,
        message: `${message} No se pudo crear una copia de cuarentena, pero el registro original no se modificó.`,
      };
    }
  }

  async load(key: string): Promise<CellsWorkspaceLoadResult> {
    const database = await this.open();
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction(WORKSPACE_STORE, 'readonly').objectStore(WORKSPACE_STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('No se pudo recuperar el proyecto Cells guardado.'));
    });
    if (value === undefined) return { status: 'missing' };
    try {
      const stored = value as VersionedCellsWorkspace;
      return { status: 'loaded', workspace: createVersionedCellsWorkspace(stored.snapshot, stored.generation, stored.limits) };
    } catch (error) {
      return { status: 'corrupt', recovery: await this.quarantineWorkspace(database, key, value, error) };
    }
  }

  async save(key: string, workspace: VersionedCellsWorkspace): Promise<void> {
    const database = await this.open();
    const validated = createVersionedCellsWorkspace(workspace.snapshot, workspace.generation, workspace.limits);
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readwrite');
      const request = transaction.objectStore(WORKSPACE_STORE).put(validated, key);
      request.onerror = () => reject(new Error('No se pudo guardar el proyecto Cells en este navegador.'));
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado del proyecto Cells.'));
    });
  }

  async remove(key: string): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(WORKSPACE_STORE, 'readwrite');
      const request = transaction.objectStore(WORKSPACE_STORE).delete(key);
      request.onerror = () => reject(new Error('No se pudo reiniciar el proyecto Cells guardado.'));
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el reinicio del proyecto Cells.'));
    });
  }

  async loadSession(key: string): Promise<CellsLabSession | null> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const request = database.transaction(SESSION_STORE, 'readonly').objectStore(SESSION_STORE).get(key);
      request.onsuccess = () => resolve(isCellsLabSession(request.result) ? request.result : null);
      request.onerror = () => reject(new Error('No se pudieron recuperar las preferencias del laboratorio Cells.'));
    });
  }

  async saveSession(key: string, session: CellsLabSession): Promise<void> {
    if (!isCellsLabSession(session)) throw new Error('Las preferencias del laboratorio Cells no son válidas.');
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SESSION_STORE, 'readwrite');
      const request = transaction.objectStore(SESSION_STORE).put(session, key);
      request.onerror = () => reject(new Error('No se pudieron guardar las preferencias del laboratorio Cells.'));
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el guardado de las preferencias del laboratorio Cells.'));
    });
  }

  async removeSession(key: string): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(SESSION_STORE, 'readwrite');
      const request = transaction.objectStore(SESSION_STORE).delete(key);
      request.onerror = () => reject(new Error('No se pudieron reiniciar las preferencias del laboratorio Cells.'));
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error('Se canceló el reinicio de las preferencias del laboratorio Cells.'));
    });
  }

  async close(): Promise<void> {
    if (!this.database) return;
    (await this.database).close();
    this.database = undefined;
  }
}
