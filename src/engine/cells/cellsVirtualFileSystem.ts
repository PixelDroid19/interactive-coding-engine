import type { WorkspaceSnapshot } from '../../types/scrim';
import type { WorkspaceFile } from '../../types/scrim';

export interface CellsWorkspaceLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxWorkspaceBytes: number;
}

export interface VersionedCellsWorkspace {
  snapshot: WorkspaceSnapshot;
  generation: number;
  limits: CellsWorkspaceLimits;
}

const DEFAULT_LIMITS: CellsWorkspaceLimits = {
  maxFiles: 120,
  maxFileBytes: 512 * 1024,
  maxWorkspaceBytes: 8 * 1024 * 1024,
};

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function fail(message: string): never {
  throw new Error(message);
}

export function normalizeCellsPath(path: string): string {
  if (typeof path !== 'string' || path.length === 0) fail('La ruta virtual no puede estar vacía.');
  const posix = path.replaceAll('\\', '/');
  if (posix.startsWith('/') || /^[a-zA-Z]:\//.test(posix)) fail('Las rutas absolutas no están permitidas.');
  if (posix.endsWith('/')) fail('La ruta debe identificar un archivo, no un directorio vacío.');

  const segments: string[] = [];
  for (const segment of posix.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) fail('La ruta intenta salir de la raíz virtual.');
      segments.pop();
      continue;
    }
    if (segment.includes('\0')) fail('La ruta contiene un carácter no permitido.');
    segments.push(segment);
  }
  if (segments.length === 0) fail('La ruta virtual no puede estar vacía.');
  return segments.join('/');
}

function languageFor(path: string): WorkspaceFile['language'] {
  const extension = path.split('.').pop()?.toLowerCase();
  if (extension === 'html') return 'html';
  if (extension === 'css' || extension === 'scss') return 'css';
  if (extension === 'ts' || extension === 'tsx') return 'typescript';
  if (extension === 'json') return 'json';
  if (extension === 'py') return 'python';
  if (extension === 'md' || extension === 'mdx') return 'markdown';
  return 'javascript';
}

function hasPathCollision(paths: string[], candidate: string): boolean {
  return paths.some((path) => path !== candidate && (
    path.startsWith(`${candidate}/`) || candidate.startsWith(`${path}/`)
  ));
}

function validateSnapshot(snapshot: WorkspaceSnapshot, limits: CellsWorkspaceLimits): void {
  const entries = Object.entries(snapshot.files);
  if (entries.length > limits.maxFiles) fail(`El workspace supera la cantidad máxima de ${limits.maxFiles} archivos.`);
  const normalizedPaths: string[] = [];
  let workspaceBytes = 0;
  for (const [key, file] of entries) {
    const normalized = normalizeCellsPath(key);
    if (normalized !== key || file.path !== key) fail(`La ruta ${key} no está normalizada.`);
    if (file.name !== key.split('/').at(-1)) fail(`El nombre de ${key} no coincide con su ruta.`);
    const size = byteLength(file.content);
    if (size > limits.maxFileBytes) fail(`El archivo ${key} supera el tamaño máximo de ${limits.maxFileBytes} bytes.`);
    workspaceBytes += size;
    normalizedPaths.push(normalized);
  }
  if (workspaceBytes > limits.maxWorkspaceBytes) fail(`El workspace supera el tamaño máximo de ${limits.maxWorkspaceBytes} bytes.`);
  for (const path of normalizedPaths) {
    if (hasPathCollision(normalizedPaths, path)) fail(`Existe una colisión entre archivo y directorio en ${path}.`);
  }
  if (entries.length > 0 && !snapshot.files[snapshot.activeFilePath]) {
    fail('El archivo activo no existe en el workspace.');
  }
}

export function createVersionedCellsWorkspace(
  snapshot: WorkspaceSnapshot,
  generation = 0,
  limits?: Partial<CellsWorkspaceLimits>,
): VersionedCellsWorkspace {
  if (!Number.isSafeInteger(generation) || generation < 0) fail('La generación del workspace no es válida.');
  const resolvedLimits = { ...DEFAULT_LIMITS, ...limits };
  if (Object.values(resolvedLimits).some((value) => !Number.isSafeInteger(value) || value < 1)) {
    fail('Los límites del workspace no son válidos.');
  }
  validateSnapshot(snapshot, resolvedLimits);
  return { snapshot, generation, limits: resolvedLimits };
}

export function writeCellsFile(
  current: VersionedCellsWorkspace,
  path: string,
  content: string,
): VersionedCellsWorkspace {
  const normalized = normalizeCellsPath(path);
  const existingPaths = Object.keys(current.snapshot.files);
  const isNew = current.snapshot.files[normalized] === undefined;
  if (isNew && existingPaths.length >= current.limits.maxFiles) {
    fail(`El workspace alcanzó la cantidad máxima de ${current.limits.maxFiles} archivos.`);
  }
  if (hasPathCollision(existingPaths, normalized)) {
    fail(`Existe una colisión entre archivo y directorio en ${normalized}.`);
  }
  const size = byteLength(content);
  if (size > current.limits.maxFileBytes) {
    fail(`El archivo ${normalized} supera el tamaño máximo de ${current.limits.maxFileBytes} bytes.`);
  }
  const currentBytes = existingPaths.reduce((total, filePath) => total + byteLength(current.snapshot.files[filePath].content), 0);
  const previousBytes = isNew ? 0 : byteLength(current.snapshot.files[normalized].content);
  if (currentBytes - previousBytes + size > current.limits.maxWorkspaceBytes) {
    fail(`El workspace supera el tamaño máximo de ${current.limits.maxWorkspaceBytes} bytes.`);
  }

  const file: WorkspaceFile = {
    name: normalized.split('/').at(-1)!,
    path: normalized,
    language: languageFor(normalized),
    content,
  };
  return {
    ...current,
    generation: current.generation + 1,
    snapshot: {
      ...current.snapshot,
      files: { ...current.snapshot.files, [normalized]: file },
      activeFilePath: current.snapshot.activeFilePath || normalized,
    },
  };
}

export function deleteCellsFile(current: VersionedCellsWorkspace, path: string): VersionedCellsWorkspace {
  const normalized = normalizeCellsPath(path);
  if (!current.snapshot.files[normalized]) fail(`El archivo ${normalized} no existe.`);
  const files = { ...current.snapshot.files };
  delete files[normalized];
  const remaining = Object.keys(files);
  return {
    ...current,
    generation: current.generation + 1,
    snapshot: {
      ...current.snapshot,
      files,
      activeFilePath: current.snapshot.activeFilePath === normalized
        ? remaining[0] ?? ''
        : current.snapshot.activeFilePath,
    },
  };
}
