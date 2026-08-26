import { createVersionedCellsWorkspace, type VersionedCellsWorkspace } from './cellsVirtualFileSystem';
import type { CellsCoverageResult, CellsTestResult } from './cellsWorkerProtocol';

const DATABASE_NAME = 'aula_open_cells';
const WORKSPACE_STORE = 'workspaces';
const SESSION_STORE = 'sessions';
const DATABASE_VERSION = 2;

export interface CellsLabSession {
  version: 1;
  activePanel: 'code' | 'preview' | 'tests';
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
    && ['code', 'preview', 'tests'].includes(session.activePanel ?? '')
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

  async load(key: string): Promise<VersionedCellsWorkspace | null> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const request = database.transaction(WORKSPACE_STORE, 'readonly').objectStore(WORKSPACE_STORE).get(key);
      request.onsuccess = () => {
        if (!request.result) { resolve(null); return; }
        try {
          const stored = request.result as VersionedCellsWorkspace;
          resolve(createVersionedCellsWorkspace(stored.snapshot, stored.generation, stored.limits));
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('No se pudo recuperar el proyecto Cells guardado.'));
    });
  }

  async save(key: string, workspace: VersionedCellsWorkspace): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(WORKSPACE_STORE, 'readwrite').objectStore(WORKSPACE_STORE).put(workspace, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('No se pudo guardar el proyecto Cells en este navegador.'));
    });
  }

  async remove(key: string): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(WORKSPACE_STORE, 'readwrite').objectStore(WORKSPACE_STORE).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('No se pudo reiniciar el proyecto Cells guardado.'));
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
      const request = database.transaction(SESSION_STORE, 'readwrite').objectStore(SESSION_STORE).put(session, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('No se pudieron guardar las preferencias del laboratorio Cells.'));
    });
  }

  async removeSession(key: string): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(SESSION_STORE, 'readwrite').objectStore(SESSION_STORE).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('No se pudieron reiniciar las preferencias del laboratorio Cells.'));
    });
  }

  async close(): Promise<void> {
    if (!this.database) return;
    (await this.database).close();
    this.database = undefined;
  }
}
