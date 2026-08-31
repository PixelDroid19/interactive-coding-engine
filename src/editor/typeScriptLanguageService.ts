import ts from 'typescript';
import spanishDiagnosticMessages from 'typescript/lib/es/diagnosticMessages.generated.json';

export interface LanguageServiceFile {
  path: string;
  content: string;
}

export interface LanguageDiagnostic {
  from: number;
  to: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: 'TypeScript';
  code: number;
}

export interface LanguageCompletion {
  label: string;
  insertText: string;
  kind: 'function' | 'method' | 'class' | 'variable' | 'property' | 'keyword' | 'text';
  detail?: string;
  documentation?: string;
  cursorOffset?: number;
  from?: number;
  to?: number;
  boost?: number;
}

export interface LanguageHover {
  from: number;
  to: number;
  title: string;
  documentation: string;
}

export interface LanguageSignatureHelp {
  from: number;
  label: string;
  documentation: string;
  activeParameter: number;
  parameters: Array<{ label: string; documentation: string }>;
}

interface VersionedFile {
  content: string;
  version: number;
}

type LocalizableTypeScript = typeof ts & {
  setLocalizedDiagnosticMessages?: (messages: Record<string, string>) => void;
};

(ts as LocalizableTypeScript).setLocalizedDiagnosticMessages?.(
  spanishDiagnosticMessages as Record<string, string>,
);

function normalizePath(path: string): string {
  const clean = path.replace(/\\/g, '/').replace(/^\.\//, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function text(parts: ts.SymbolDisplayPart[] | undefined): string {
  return ts.displayPartsToString(parts);
}

function completionKind(kind: ts.ScriptElementKind): LanguageCompletion['kind'] {
  switch (kind) {
    case ts.ScriptElementKind.functionElement:
      return 'function';
    case ts.ScriptElementKind.memberFunctionElement:
      return 'method';
    case ts.ScriptElementKind.classElement:
    case ts.ScriptElementKind.localClassElement:
      return 'class';
    case ts.ScriptElementKind.memberVariableElement:
      return 'property';
    case ts.ScriptElementKind.keyword:
      return 'keyword';
    case ts.ScriptElementKind.variableElement:
    case ts.ScriptElementKind.localVariableElement:
    case ts.ScriptElementKind.constElement:
    case ts.ScriptElementKind.letElement:
      return 'variable';
    default:
      return 'text';
  }
}

function severity(category: ts.DiagnosticCategory): LanguageDiagnostic['severity'] {
  if (category === ts.DiagnosticCategory.Error) return 'error';
  if (category === ts.DiagnosticCategory.Warning) return 'warning';
  return 'info';
}

function isCallable(kind: LanguageCompletion['kind']): boolean {
  return kind === 'function' || kind === 'method' || kind === 'class';
}

export class TypeScriptLanguageService {
  private readonly files = new Map<string, VersionedFile>();
  private readonly libraryPaths = new Set<string>();
  private projectVersion = 0;
  private readonly service: ts.LanguageService;

  constructor(libraries: Record<string, string>) {
    for (const [path, content] of Object.entries(libraries)) {
      const normalized = normalizePath(path);
      this.files.set(normalized, { content, version: 1 });
      this.libraryPaths.add(normalized);
    }

    const compilerOptions: ts.CompilerOptions = {
      allowJs: true,
      checkJs: true,
      noEmit: true,
      noLib: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      resolveJsonModule: true,
      jsx: ts.JsxEmit.ReactJSX,
      allowNonTsExtensions: true,
      strict: false,
      skipLibCheck: true,
    };

    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => compilerOptions,
      getScriptFileNames: () => [...this.files.keys()],
      getScriptVersion: (fileName) => String(this.files.get(normalizePath(fileName))?.version ?? 0),
      getScriptSnapshot: (fileName) => {
        const file = this.files.get(normalizePath(fileName));
        return file ? ts.ScriptSnapshot.fromString(file.content) : undefined;
      },
      getCurrentDirectory: () => '/',
      getDefaultLibFileName: () => '/lib.d.ts',
      fileExists: (fileName) => this.files.has(normalizePath(fileName)),
      readFile: (fileName) => this.files.get(normalizePath(fileName))?.content,
      readDirectory: () => [],
      directoryExists: () => true,
      getDirectories: () => [],
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getProjectVersion: () => String(this.projectVersion),
    };

    this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
  }

  replaceWorkspace(files: LanguageServiceFile[]): void {
    const nextPaths = new Set(files.map((file) => normalizePath(file.path)));

    for (const path of [...this.files.keys()]) {
      if (this.libraryPaths.has(path)) continue;
      if (!nextPaths.has(path)) this.files.delete(path);
    }

    for (const file of files) this.updateFile(file.path, file.content, false);
    this.projectVersion += 1;
  }

  updateFile(path: string, content: string, bumpProject = true): void {
    const normalized = normalizePath(path);
    const current = this.files.get(normalized);
    if (current?.content === content) return;
    this.files.set(normalized, { content, version: (current?.version ?? 0) + 1 });
    if (bumpProject) this.projectVersion += 1;
  }

  diagnostics(path: string): LanguageDiagnostic[] {
    const fileName = normalizePath(path);
    if (!this.files.has(fileName)) return [];

    const diagnostics = [
      ...this.service.getSyntacticDiagnostics(fileName),
      ...this.service.getSemanticDiagnostics(fileName),
    ];

    const seen = new Set<string>();
    return diagnostics.flatMap((diagnostic) => {
      const from = diagnostic.start ?? 0;
      const length = Math.max(1, diagnostic.length ?? 1);
      const key = `${diagnostic.code}:${from}:${length}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{
        from,
        to: from + length,
        severity: severity(diagnostic.category),
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        source: 'TypeScript' as const,
        code: diagnostic.code,
      }];
    });
  }

  completions(path: string, position: number): LanguageCompletion[] {
    const fileName = normalizePath(path);
    const result = this.service.getCompletionsAtPosition(fileName, position, {
      includeCompletionsForImportStatements: true,
      includeCompletionsWithInsertText: true,
      includeCompletionsWithSnippetText: false,
    });
    if (!result) return [];

    const completions: LanguageCompletion[] = [];
    const seen = new Set<string>();

    for (const entry of result.entries) {
      if (entry.name.startsWith('__')) continue;
      const details = this.service.getCompletionEntryDetails(
        fileName,
        position,
        entry.name,
        undefined,
        entry.source,
        undefined,
        entry.data,
      );
      const kind = completionKind(entry.kind);
      const replacement = entry.replacementSpan ?? result.optionalReplacementSpan;
      const insertText = entry.insertText || entry.name;
      const documentation = [text(details?.documentation), ...(details?.tags ?? []).map((tag) => text(tag.text))]
        .filter(Boolean)
        .join('\n\n');
      const base: LanguageCompletion = {
        label: entry.name,
        insertText,
        kind,
        detail: text(details?.displayParts) || entry.kindModifiers,
        documentation,
        from: replacement?.start,
        to: replacement ? replacement.start + replacement.length : undefined,
        boost: isCallable(kind) ? 60 : 30,
      };
      const baseKey = `${base.label}:${base.insertText}`;
      if (!seen.has(baseKey)) {
        seen.add(baseKey);
        completions.push(base);
      }

      if (isCallable(kind) && !insertText.includes('(')) {
        const call: LanguageCompletion = {
          ...base,
          label: `${entry.name}()`,
          insertText: `${entry.name}()`,
          cursorOffset: -1,
          detail: `Llamar ${kind === 'class' ? 'constructor' : kind === 'method' ? 'método' : 'función'} · ${base.detail || ''}`.trim(),
          boost: 45,
        };
        completions.push(call);
      }
    }

    return completions;
  }

  hover(path: string, position: number): LanguageHover | null {
    const fileName = normalizePath(path);
    const info = this.service.getQuickInfoAtPosition(fileName, position);
    if (!info) return null;
    return {
      from: info.textSpan.start,
      to: info.textSpan.start + info.textSpan.length,
      title: text(info.displayParts),
      documentation: [text(info.documentation), ...(info.tags ?? []).map((tag) => text(tag.text))]
        .filter(Boolean)
        .join('\n\n'),
    };
  }

  signatureHelp(path: string, position: number): LanguageSignatureHelp | null {
    const fileName = normalizePath(path);
    const help = this.service.getSignatureHelpItems(fileName, position, {
      triggerReason: { kind: 'invoked' },
    });
    if (!help || help.items.length === 0) return null;
    const item = help.items[help.selectedItemIndex] ?? help.items[0];
    const parameters = item.parameters.map((parameter) => ({
      label: text(parameter.displayParts),
      documentation: text(parameter.documentation),
    }));
    const separator = text(item.separatorDisplayParts);
    return {
      from: help.applicableSpan.start,
      label: `${text(item.prefixDisplayParts)}${parameters.map((parameter) => parameter.label).join(separator)}${text(item.suffixDisplayParts)}`,
      documentation: text(item.documentation),
      activeParameter: Math.min(help.argumentIndex, Math.max(0, parameters.length - 1)),
      parameters,
    };
  }

  dispose(): void {
    this.service.dispose();
  }
}
