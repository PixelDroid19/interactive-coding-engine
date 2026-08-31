import type { WorkspaceFile } from '../types/scrim';
import type { LanguageServiceFile } from './typeScriptLanguageService';
import { buildWorkspaceDomDeclarations, WORKSPACE_DOM_TYPES_PATH } from './workspaceTypeDeclarations';

export const WORKSPACE_CELLS_TYPES_PATH = '/__aula_cells__.d.ts';

interface CellsTypeReference {
  modulePath: string;
  exportName: string;
}

function isJavaScriptLike(file: Pick<WorkspaceFile, 'path' | 'language'>): boolean {
  return file.language === 'javascript'
    || file.language === 'typescript'
    || /\.(?:js|jsx|ts|tsx)$/i.test(file.path);
}

function isJsonFile(file: Pick<WorkspaceFile, 'path' | 'language'>): boolean {
  return file.language === 'json' || /\.json$/i.test(file.path);
}

function normalizeWorkspacePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join('/');
}

function resolveLocalModulePath(sourcePath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const directory = normalizeWorkspacePath(sourcePath).split('/').slice(0, -1).join('/');
  return normalizeWorkspacePath(`${directory}/${specifier}`);
}

function moduleSpecifierFromRoot(path: string): string {
  return `./${normalizeWorkspacePath(path)}`;
}

function parseNamedLocalImports(source: string, sourcePath: string, knownPaths: Set<string>): Map<string, CellsTypeReference> {
  const imports = new Map<string, CellsTypeReference>();
  const pattern = /import\s*\{([^}]+)\}\s*from\s*(['"])([^'"]+)\2/g;

  for (const match of source.matchAll(pattern)) {
    const targetPath = resolveLocalModulePath(sourcePath, match[3]);
    if (!targetPath || !knownPaths.has(targetPath)) continue;
    for (const importedName of match[1].split(',')) {
      const namedImport = importedName.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (!namedImport) continue;
      imports.set(namedImport[2] ?? namedImport[1], {
        modulePath: targetPath,
        exportName: namedImport[1],
      });
    }
  }

  return imports;
}

function exportedClassReferences(source: string, sourcePath: string): Map<string, CellsTypeReference> {
  const classes = new Map<string, CellsTypeReference>();
  for (const match of source.matchAll(/\bexport\s+class\s+([A-Za-z_$][\w$]*)/g)) {
    classes.set(match[1], { modulePath: normalizeWorkspacePath(sourcePath), exportName: match[1] });
  }
  return classes;
}

function exportedClassBefore(source: string, position: number): string | null {
  let result: string | null = null;
  for (const match of source.slice(0, position).matchAll(/\bexport\s+class\s+([A-Za-z_$][\w$]*)/g)) {
    result = match[1];
  }
  return result;
}

function addTagReference(
  tags: Map<string, CellsTypeReference | null>,
  tagName: string,
  reference: CellsTypeReference | undefined,
): void {
  if (!reference || tags.has(tagName) && tags.get(tagName) === null) return;
  const current = tags.get(tagName);
  if (!current) {
    tags.set(tagName, reference);
    return;
  }
  if (current.modulePath !== reference.modulePath || current.exportName !== reference.exportName) {
    tags.set(tagName, null);
  }
}

function collectCustomElementTags(files: Array<Pick<WorkspaceFile, 'path' | 'content' | 'language'>>): Map<string, CellsTypeReference> {
  const knownPaths = new Set(files.map((file) => normalizeWorkspacePath(file.path)));
  const tags = new Map<string, CellsTypeReference | null>();

  for (const file of files) {
    if (!isJavaScriptLike(file)) continue;
    const sourcePath = normalizeWorkspacePath(file.path);
    const classes = exportedClassReferences(file.content, sourcePath);
    const imports = parseNamedLocalImports(file.content, sourcePath, knownPaths);
    const referenceFor = (name: string) => classes.get(name) ?? imports.get(name);

    for (const match of file.content.matchAll(/customElements\.define\s*\(\s*(['"])([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\1\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
      addTagReference(tags, match[2], referenceFor(match[3]));
    }

    for (const match of file.content.matchAll(/static\s+get\s+is\s*\(\)\s*\{\s*return\s*(['"])([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\1\s*;?\s*\}/g)) {
      const className = exportedClassBefore(file.content, match.index ?? 0);
      if (className) addTagReference(tags, match[2], referenceFor(className));
    }

    for (const match of file.content.matchAll(/(['"])([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\1\s*:\s*([A-Za-z_$][\w$]*)/g)) {
      addTagReference(tags, match[2], referenceFor(match[3]));
    }
  }

  return new Map([...tags].filter((entry): entry is [string, CellsTypeReference] => entry[1] !== null));
}

function hasAmbientModule(files: Array<Pick<WorkspaceFile, 'content'>>, moduleName: string): boolean {
  const escaped = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return files.some((file) => new RegExp(`declare\\s+module\\s+['"]${escaped}['"]`).test(file.content));
}

function buildWidgetMixinDeclaration(): string {
  return [
    'export interface CellsWidgetApi {',
    '  /** Traduce una clave usando el catálogo activo. */',
    '  t(key: string, values?: Record<string, unknown>): string;',
    '  /** Emite un evento público del componente con detalle y opciones DOM. */',
    '  emitEvent(type: string, detail?: unknown, options?: CustomEventInit): boolean;',
    '}',
    '',
    'export function WidgetMixin<TBase extends abstract new (...args: any[]) => HTMLElement>(',
    '  base: TBase,',
    '): TBase & (abstract new (...args: any[]) => InstanceType<TBase> & CellsWidgetApi);',
  ].join('\n');
}

function buildCellsDeclarations(files: Array<Pick<WorkspaceFile, 'path' | 'content' | 'language'>>): string | null {
  const tags = collectCustomElementTags(files);
  const hasLitDeclarations = hasAmbientModule(files, 'lit');
  const hasScopedElementsDeclarations = hasAmbientModule(files, '@open-wc/scoped-elements/lit-element.js');
  if (!hasLitDeclarations && !hasScopedElementsDeclarations && tags.size === 0) return null;

  const declarations = ['export {};'];
  if (hasLitDeclarations) {
    declarations.push(
      '',
      "declare module 'lit' {",
      '  export interface LitElement {',
      '    readonly updateComplete: Promise<boolean>;',
      '    requestUpdate(name?: PropertyKey, oldValue?: unknown): void;',
      '  }',
      '  export namespace LitElement {',
      '    const properties: Record<string, unknown>;',
      '  }',
      '}',
    );
  }
  if (hasScopedElementsDeclarations) {
    declarations.push(
      '',
      "declare module '@open-wc/scoped-elements/lit-element.js' {",
      '  type CellsEditorConstructor<T = object> = abstract new (...args: any[]) => T;',
      '  export function ScopedElementsMixin<T extends CellsEditorConstructor>(',
      '    base: T,',
      '  ): T & { readonly scopedElements: Record<string, CustomElementConstructor>; };',
      '}',
    );
  }
  if (tags.size > 0) {
    declarations.push('', 'declare global {', '  interface HTMLElementTagNameMap {');
    for (const [tagName, reference] of tags) {
      declarations.push(`    ${JSON.stringify(tagName)}: import(${JSON.stringify(moduleSpecifierFromRoot(reference.modulePath))}).${reference.exportName};`);
    }
    declarations.push('  }', '}');
  }

  return declarations.join('\n');
}

export function buildWorkspaceSemanticFiles(
  files: Array<Pick<WorkspaceFile, 'path' | 'content' | 'language'>>,
): LanguageServiceFile[] {
  const semanticFiles = files
    .filter((file) => isJavaScriptLike(file) || isJsonFile(file))
    .map(({ path, content }) => ({ path, content }));
  const workspacePaths = new Set(files.map((file) => normalizeWorkspacePath(file.path)));

  for (const file of files) {
    if (!isJavaScriptLike(file) || !/\bexport\s+(?:const|function)\s+WidgetMixin\b/.test(file.content)) continue;
    const declarationPath = normalizeWorkspacePath(file.path).replace(/\.(?:js|jsx|ts|tsx)$/i, '.d.ts');
    if (!workspacePaths.has(declarationPath)) {
      semanticFiles.push({ path: declarationPath, content: buildWidgetMixinDeclaration() });
    }
  }

  const domDeclarations = buildWorkspaceDomDeclarations(files);
  if (domDeclarations) semanticFiles.push({ path: WORKSPACE_DOM_TYPES_PATH, content: domDeclarations });

  const cellsDeclarations = buildCellsDeclarations(files);
  if (cellsDeclarations) semanticFiles.push({ path: WORKSPACE_CELLS_TYPES_PATH, content: cellsDeclarations });

  return semanticFiles;
}
