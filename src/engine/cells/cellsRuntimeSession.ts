import { parseCellsCommand } from './cellsCommandParser';
import { buildCellsPreviewDocument } from './cellsPreviewCompiler';
import { auditCellsProject } from './cellsProjectAudit';
import { createCellsAppWorkspace } from './cellsAppRecipes';
import { createCellsComponentWorkspace } from './cellsRecipes';
import { createVersionedCellsWorkspace, deleteCellsFile, writeCellsFile, type VersionedCellsWorkspace } from './cellsVirtualFileSystem';
import type { CellsWorkerRequest, CellsWorkerResponse } from './cellsWorkerProtocol';
import { normalizeCellsRuntimeError } from './cellsWorkerProtocol';
import { exportCellsWorkspaceZip } from './cellsZip';

type RequestType = CellsWorkerRequest['type'];

function response<T extends CellsWorkerResponse['type']>(
  request: CellsWorkerRequest,
  type: T,
  payload: Extract<CellsWorkerResponse, { type: T }>['payload'],
  generation = request.generation,
): Extract<CellsWorkerResponse, { type: T }> {
  return {
    type,
    payload,
    requestId: request.requestId,
    sessionId: request.sessionId,
    generation,
  } as Extract<CellsWorkerResponse, { type: T }>;
}

function translationKeys(workspace: VersionedCellsWorkspace): string[] {
  const keys = Object.values(workspace.snapshot.files).flatMap((file) => (
    /^(?:javascript|typescript)$/.test(file.language)
      ? Array.from(file.content.matchAll(/\b(?:this|intlMsg|appIntlMsg)\.t\(\s*['"]([^'"]+)['"]/g), (match) => match[1])
      : []
  ));
  return [...new Set(keys)].sort();
}

function generateLocaleCatalogs(workspace: VersionedCellsWorkspace, application: boolean): VersionedCellsWorkspace {
  const keys = translationKeys(workspace);
  const targetPaths = application
    ? ['app/locales-app/locales.json']
    : ['locales/locales.json', 'demo/locales/locales.json', 'test/unit/locales/locales.json'];
  const files = { ...workspace.snapshot.files };

  for (const path of targetPaths) {
    const current = files[path];
    if (!current) throw { code: 'COMMAND_FAILED', message: `No existe el catálogo ${path}.` };
    let catalog: Record<string, Record<string, string>>;
    try {
      catalog = JSON.parse(current.content) as Record<string, Record<string, string>>;
    } catch {
      throw { code: 'COMMAND_FAILED', message: `El catálogo ${path} no contiene JSON válido.`, filePath: path };
    }
    const languages = Object.keys(catalog);
    if (languages.length === 0 || languages.some((language) => !catalog[language] || typeof catalog[language] !== 'object')) {
      throw { code: 'COMMAND_FAILED', message: `El catálogo ${path} no contiene idiomas válidos.`, filePath: path };
    }
    for (const language of languages) {
      for (const key of keys) {
        if (typeof catalog[language][key] !== 'string') catalog[language][key] = key;
      }
    }
    files[path] = { ...current, content: `${JSON.stringify(catalog, null, 2)}\n` };
  }

  return createVersionedCellsWorkspace({ ...workspace.snapshot, files }, workspace.generation + 1, workspace.limits);
}

function generateComponentDocumentation(workspace: VersionedCellsWorkspace): VersionedCellsWorkspace {
  const definition = Object.entries(workspace.snapshot.files)
    .filter(([path, file]) => !path.includes('/') && file.language === 'javascript')
    .map(([path, file]) => ({
      path,
      match: file.content.match(/customElements\.define\(\s*['"]([^'"]+)['"]\s*,\s*([A-Za-z_$][\w$]*)\s*\)/),
    }))
    .find(({ match }) => Boolean(match));
  if (!definition?.match) {
    throw { code: 'COMMAND_FAILED', message: 'No se encontró una definición pública con customElements.define().' };
  }
  const [, tagName, className] = definition.match;
  const sourcePath = `src/${tagName}.js`;
  if (!workspace.snapshot.files[sourcePath]) {
    throw { code: 'COMMAND_FAILED', message: `No existe la implementación pública ${sourcePath}.`, filePath: sourcePath };
  }
  const metadataFile = workspace.snapshot.files['custom-elements.json'];
  if (!metadataFile) throw { code: 'COMMAND_FAILED', message: 'No existe custom-elements.json.' };

  let metadata: any;
  try {
    metadata = JSON.parse(metadataFile.content);
  } catch {
    throw { code: 'COMMAND_FAILED', message: 'custom-elements.json no contiene JSON válido.', filePath: 'custom-elements.json' };
  }
  const module = metadata?.modules?.[0];
  const declaration = module?.declarations?.[0];
  if (!module || !declaration || !Array.isArray(module.exports)) {
    throw { code: 'COMMAND_FAILED', message: 'custom-elements.json no contiene una declaración pública regenerable.', filePath: 'custom-elements.json' };
  }
  module.path = sourcePath;
  declaration.name = className;
  declaration.tagName = tagName;
  module.exports = [{
    kind: 'custom-element-definition',
    name: tagName,
    declaration: { name: className, module: sourcePath },
  }];
  const files = {
    ...workspace.snapshot.files,
    'custom-elements.json': { ...metadataFile, content: `${JSON.stringify(metadata, null, 2)}\n` },
  };
  return createVersionedCellsWorkspace({ ...workspace.snapshot, files }, workspace.generation + 1, workspace.limits);
}

function packageName(workspace: VersionedCellsWorkspace): string {
  try {
    const manifest = JSON.parse(workspace.snapshot.files['package.json']?.content ?? '{}');
    return String(manifest.name ?? 'open-cells-project').split('/').at(-1) || 'open-cells-project';
  } catch {
    return 'open-cells-project';
  }
}

export class CellsRuntimeSession {
  private workspace?: VersionedCellsWorkspace;
  private readonly cancelled = new Set<string>();

  constructor(private readonly sessionId: string) {}

  private requireWorkspace(request: CellsWorkerRequest): VersionedCellsWorkspace {
    if (!this.workspace) throw { code: 'INVALID_WORKSPACE', message: 'Primero crea o abre un proyecto Cells.' };
    if (request.generation !== this.workspace.generation) {
      throw {
        code: 'INVALID_WORKSPACE',
        message: `La operación pertenece a la generación ${request.generation}, pero el proyecto está en la ${this.workspace.generation}.`,
        hint: 'Actualiza el proyecto antes de volver a ejecutar la operación.',
      };
    }
    return this.workspace;
  }

  private runParsedCommand(request: CellsWorkerRequest, commandText: string): CellsWorkerResponse {
    const parsed = parseCellsCommand(commandText);
    if (parsed.runtimeAction === 'create-component' || parsed.runtimeAction === 'create-application') {
      const scaffold = parsed.options.scaffold as { name: string; namespace?: '@open-cells-learning' };
      this.workspace = parsed.runtimeAction === 'create-application'
        ? createCellsAppWorkspace(scaffold)
        : createCellsComponentWorkspace(scaffold);
      return response(request, 'command:completed', {
        command: commandText,
        output: `Proyecto ${scaffold.name} creado dentro del navegador.`,
        workspace: this.workspace.snapshot,
      });
    }
    const workspace = this.requireWorkspace(request);
    if (parsed.runtimeAction === 'build-preview') {
      const built = buildCellsPreviewDocument(workspace.snapshot);
      return response(request, 'preview:built', built);
    }
    if (parsed.runtimeAction === 'test-component' || parsed.runtimeAction === 'test-application') {
      const audited = auditCellsProject(workspace.snapshot);
      return response(request, 'tests:completed', {
        results: audited.results,
        ...(parsed.options.coverage ? { coverage: audited.coverage } : {}),
      });
    }
    if (parsed.runtimeAction === 'generate-locales') {
      const keys = translationKeys(workspace);
      this.workspace = generateLocaleCatalogs(workspace, false);
      return response(request, 'locales:generated', { workspace: this.workspace.snapshot, keys }, this.workspace.generation);
    }
    if (parsed.runtimeAction === 'generate-app-locales') {
      const keys = translationKeys(workspace);
      this.workspace = generateLocaleCatalogs(workspace, true);
      return response(request, 'locales:generated', { workspace: this.workspace.snapshot, keys }, this.workspace.generation);
    }
    if (parsed.runtimeAction === 'generate-documentation') {
      this.workspace = generateComponentDocumentation(workspace);
      return response(request, 'documentation:generated', { workspace: this.workspace.snapshot }, this.workspace.generation);
    }
    throw { code: 'COMMAND_FAILED', message: `La acción ${parsed.runtimeAction} no está implementada.` };
  }

  async handle(request: CellsWorkerRequest): Promise<CellsWorkerResponse> {
    try {
      if (request.sessionId !== this.sessionId) {
        throw { code: 'INVALID_REQUEST', message: 'La petición pertenece a otra sesión.' };
      }
      if (request.type === 'request:cancel') {
        this.cancelled.add(request.payload.targetRequestId);
        return response(request, 'request:cancelled', { targetRequestId: request.payload.targetRequestId });
      }
      if (request.type === 'runtime:dispose') {
        this.workspace = undefined;
        return response(request, 'request:cancelled', { targetRequestId: request.requestId });
      }
      if (this.cancelled.has(request.requestId)) {
        throw { code: 'CANCELLED', message: 'La operación fue cancelada.' };
      }
      if (request.type === 'project:create') {
        this.workspace = createCellsComponentWorkspace(request.payload.scaffold);
        if (request.generation !== this.workspace.generation) {
          throw { code: 'INVALID_WORKSPACE', message: 'Un proyecto nuevo debe comenzar en la generación 0.' };
        }
        return response(request, 'workspace:updated', { workspace: this.workspace.snapshot });
      }
      if (request.type === 'project:load') {
        this.workspace = createVersionedCellsWorkspace(request.payload.workspace, request.generation);
        return response(request, 'workspace:updated', { workspace: this.workspace.snapshot });
      }
      if (request.type === 'file:write') {
        const workspace = this.workspace;
        if (!workspace || request.generation !== workspace.generation + 1) {
          throw { code: 'INVALID_WORKSPACE', message: 'La escritura no parte de la siguiente generación del proyecto.' };
        }
        this.workspace = writeCellsFile(workspace, request.payload.path, request.payload.content);
        return response(request, 'workspace:updated', { workspace: this.workspace.snapshot });
      }
      if (request.type === 'file:delete') {
        const workspace = this.workspace;
        if (!workspace || request.generation !== workspace.generation + 1) {
          throw { code: 'INVALID_WORKSPACE', message: 'La eliminación no parte de la siguiente generación del proyecto.' };
        }
        this.workspace = deleteCellsFile(workspace, request.payload.path);
        return response(request, 'workspace:updated', { workspace: this.workspace.snapshot });
      }
      if (request.type === 'command:run') return this.runParsedCommand(request, request.payload.command);
      const workspace = this.requireWorkspace(request);
      if (request.type === 'preview:build') {
        const instrumentSource = request.payload.runContractTests
          ? (await import('./cellsPreviewInstrumentation')).instrumentCellsSource
          : undefined;
        return response(request, 'preview:built', buildCellsPreviewDocument(workspace.snapshot, {
          ...request.payload,
          instrumentSource,
        }));
      }
      if (request.type === 'tests:run') {
        const audited = auditCellsProject(workspace.snapshot);
        return response(request, 'tests:completed', {
          results: audited.results,
          ...(request.payload.coverage ? { coverage: audited.coverage } : {}),
        });
      }
      if (request.type === 'locales:generate') {
        return this.runParsedCommand(request, 'cells component:locales');
      }
      if (request.type === 'documentation:generate') {
        return this.runParsedCommand(request, 'cells component:documentation');
      }
      if (request.type === 'project:export') {
        return response(request, 'project:exported', {
          bytes: exportCellsWorkspaceZip(workspace.snapshot),
          fileName: `${packageName(workspace)}.zip`,
        });
      }
      throw { code: 'INVALID_REQUEST', message: `La operación ${(request as { type: RequestType }).type} no está disponible.` };
    } catch (error) {
      return response(request, 'runtime:error', { error: normalizeCellsRuntimeError(error) });
    }
  }
}
