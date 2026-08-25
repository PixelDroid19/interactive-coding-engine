import type {
  Completion,
  CompletionContext,
  CompletionResult,
  CompletionSource,
} from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { type Diagnostic, lintGutter, linter } from '@codemirror/lint';
import { EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import {
  EditorView,
  hoverTooltip,
  showTooltip,
  type Tooltip,
  ViewPlugin,
} from '@codemirror/view';
import { getSpanishDocByLabel } from './spanishLsp';
import type {
  LanguageCompletion,
  LanguageDiagnostic,
  LanguageHover,
  LanguageSignatureHelp,
} from './typeScriptLanguageService';

export interface SemanticLanguageClient {
  completions(path: string, position: number): Promise<LanguageCompletion[]>;
  diagnostics(path: string): Promise<LanguageDiagnostic[]>;
  hover(path: string, position: number): Promise<LanguageHover | null>;
  signatureHelp(path: string, position: number): Promise<LanguageSignatureHelp | null>;
}

export interface EditorDiagnosticStatus {
  errors: number;
  warnings: number;
  state: 'ready' | 'error';
}

const IDENTIFIER_BEFORE_CURSOR = /[A-Za-z_$][\w$]*$/;

function completionType(kind: LanguageCompletion['kind']): string {
  if (kind === 'class') return 'class';
  if (kind === 'method') return 'method';
  if (kind === 'function') return 'function';
  if (kind === 'property') return 'property';
  if (kind === 'keyword') return 'keyword';
  if (kind === 'variable') return 'variable';
  return 'text';
}

export function completionToCodeMirror(
  completion: LanguageCompletion,
  lessonId?: string,
): Completion {
  const spanishDoc = getSpanishDocByLabel(completion.label, lessonId);
  const apply = completion.cursorOffset == null
    ? completion.insertText
    : (view: EditorView, _item: Completion, from: number, to: number) => {
        const cursor = from + completion.insertText.length + completion.cursorOffset!;
        view.dispatch({
          changes: { from, to, insert: completion.insertText },
          selection: { anchor: cursor },
          scrollIntoView: true,
        });
      };

  return {
    label: completion.label,
    type: completionType(completion.kind),
    detail: spanishDoc?.detail || completion.detail,
    info: spanishDoc?.info || completion.documentation || 'Símbolo reconocido en tu código.',
    apply,
    boost: completion.boost,
  };
}

export function createSemanticCompletionSource(
  client: SemanticLanguageClient,
  getFilePath: () => string | null,
  lessonId?: string,
): CompletionSource {
  return async (context: CompletionContext): Promise<CompletionResult | null> => {
    const path = getFilePath();
    if (!path) return null;
    const word = context.matchBefore(IDENTIFIER_BEFORE_CURSOR);
    if (!word && !context.explicit) return null;
    if (word?.from === word?.to && !context.explicit) return null;

    const prefix = word?.text.toLowerCase() ?? '';
    const semanticOptions = (await client.completions(path, context.pos))
      .filter((option) => !prefix || option.label.replace(/\(\)$/, '').toLowerCase().startsWith(prefix));
    if (semanticOptions.length === 0) return null;
    const defaultFrom = word?.from ?? context.pos;
    const options = semanticOptions.map((option) => completionToCodeMirror(option, lessonId));
    const serviceFrom = semanticOptions.find((option) => option.from != null)?.from;
    return {
      from: serviceFrom ?? defaultFrom,
      options,
      validFor: /^[A-Za-z_$][\w$]*$/,
      filter: true,
    };
  };
}

export function languageDiagnosticsToCodeMirror(
  diagnostics: LanguageDiagnostic[],
  documentLength: number,
): Diagnostic[] {
  return diagnostics.map((diagnostic) => {
    const from = Math.max(0, Math.min(diagnostic.from, documentLength));
    const to = Math.max(from, Math.min(diagnostic.to, documentLength));
    return {
      from,
      to: to === from && documentLength > from ? from + 1 : to,
      severity: diagnostic.severity,
      message: diagnostic.message,
      source: `${diagnostic.source} · TS${diagnostic.code}`,
    };
  });
}

function syntaxMessage(state: EditorState, from: number): string {
  const before = state.doc.sliceString(Math.max(0, from - 160), from);
  const lastLine = before.slice(before.lastIndexOf('\n') + 1);
  if ((before.match(/"/g)?.length ?? 0) % 2 === 1 || (before.match(/'/g)?.length ?? 0) % 2 === 1) {
    return 'Falta cerrar las comillas del texto.';
  }
  if (/\([^)]*$/.test(before)) return 'Falta cerrar el paréntesis ")".';
  if (/\[[^\]]*$/.test(before)) return 'Falta cerrar el corchete "]".';
  if (/\{[^}]*$/.test(before)) return 'Falta cerrar la llave "}".';
  if (/[+\-*/%=<>!&|]\s*$/.test(lastLine)) return 'Falta un valor después del operador.';
  return 'La estructura del código está incompleta en este punto.';
}

export function collectCodeMirrorSyntaxDiagnostics(state: EditorState): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(state).iterate({
    enter(node) {
      if (!node.type.isError) return;
      const from = Math.max(0, Math.min(node.from, state.doc.length));
      const to = node.to > from ? node.to : Math.min(state.doc.length, from + 1);
      diagnostics.push({
        from,
        to,
        severity: 'error',
        message: syntaxMessage(state, from),
        source: 'CodeMirror',
      });
    },
  });
  return diagnostics;
}

function mergeDiagnostics(syntax: Diagnostic[], semantic: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  return [...syntax, ...semantic].filter((diagnostic) => {
    const key = `${diagnostic.from}:${diagnostic.to}:${diagnostic.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createSemanticLintExtensions(
  client: SemanticLanguageClient,
  getFilePath: () => string | null,
  onStatus: (status: EditorDiagnosticStatus) => void,
): Extension[] {
  return [
    lintGutter(),
    linter(async (view) => {
      const syntax = collectCodeMirrorSyntaxDiagnostics(view.state);
      const path = getFilePath();
      if (!path || !/\.(?:js|jsx|ts|tsx)$/i.test(path)) {
        onStatus({
          errors: syntax.filter((diagnostic) => diagnostic.severity === 'error').length,
          warnings: syntax.filter((diagnostic) => diagnostic.severity === 'warning').length,
          state: 'ready',
        });
        return syntax;
      }

      try {
        const semantic = languageDiagnosticsToCodeMirror(
          await client.diagnostics(path),
          view.state.doc.length,
        );
        const merged = mergeDiagnostics(syntax, semantic);
        onStatus({
          errors: merged.filter((diagnostic) => diagnostic.severity === 'error').length,
          warnings: merged.filter((diagnostic) => diagnostic.severity === 'warning').length,
          state: 'ready',
        });
        return merged;
      } catch {
        onStatus({
          errors: syntax.filter((diagnostic) => diagnostic.severity === 'error').length,
          warnings: syntax.filter((diagnostic) => diagnostic.severity === 'warning').length,
          state: 'error',
        });
        return syntax;
      }
    }, { delay: 400 }),
  ];
}

function appendTooltipText(dom: HTMLElement, title: string, documentation: string): void {
  const heading = document.createElement('strong');
  heading.textContent = title;
  dom.append(heading);
  if (documentation) {
    const body = document.createElement('p');
    body.textContent = documentation;
    dom.append(body);
  }
}

export function createSemanticHover(
  client: SemanticLanguageClient,
  getFilePath: () => string | null,
  lessonId?: string,
): Extension {
  return hoverTooltip(async (view, position) => {
    const path = getFilePath();
    if (!path) return null;
    const hover = await client.hover(path, position);
    if (!hover) return null;
    const plainLabel = view.state.sliceDoc(hover.from, hover.to);
    const spanishDoc = getSpanishDocByLabel(plainLabel, lessonId);
    return {
      pos: hover.from,
      end: hover.to,
      above: true,
      create() {
        const dom = document.createElement('div');
        dom.className = 'cm-semantic-doc';
        appendTooltipText(dom, hover.title, spanishDoc?.info || hover.documentation || 'Información inferida por TypeScript.');
        return { dom };
      },
    };
  });
}

const setSignatureHelp = StateEffect.define<LanguageSignatureHelp | null>();

function signatureTooltip(help: LanguageSignatureHelp): Tooltip {
  return {
    pos: help.from,
    above: true,
    strictSide: false,
    create() {
      const dom = document.createElement('div');
      dom.className = 'cm-signature-help';
      const signature = document.createElement('div');
      signature.className = 'cm-signature-label';
      signature.textContent = help.label;
      dom.append(signature);
      const parameter = help.parameters[help.activeParameter];
      if (parameter) {
        const active = document.createElement('div');
        active.className = 'cm-signature-parameter';
        active.textContent = `Parámetro ${help.activeParameter + 1}: ${parameter.label}${parameter.documentation ? ` — ${parameter.documentation}` : ''}`;
        dom.append(active);
      }
      if (help.documentation) {
        const documentation = document.createElement('div');
        documentation.className = 'cm-signature-documentation';
        documentation.textContent = help.documentation;
        dom.append(documentation);
      }
      return { dom };
    },
  };
}

const signatureHelpField = StateField.define<LanguageSignatureHelp | null>({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setSignatureHelp)) return effect.value;
    }
    return value;
  },
  provide: (field) => showTooltip.from(field, (help) => help ? signatureTooltip(help) : null),
});

export function createSignatureHelpExtension(
  client: SemanticLanguageClient,
  getFilePath: () => string | null,
): Extension {
  const plugin = ViewPlugin.fromClass(class {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private requestVersion = 0;

    constructor(private readonly view: EditorView) {
      this.schedule();
    }

    update(update: { docChanged: boolean; selectionSet: boolean }): void {
      if (update.docChanged || update.selectionSet) this.schedule();
    }

    private schedule(): void {
      if (this.timer) clearTimeout(this.timer);
      const requestVersion = ++this.requestVersion;
      this.timer = setTimeout(async () => {
        const path = getFilePath();
        const position = this.view.state.selection.main.head;
        const help = path ? await client.signatureHelp(path, position).catch(() => null) : null;
        if (requestVersion !== this.requestVersion) return;
        this.view.dispatch({ effects: setSignatureHelp.of(help) });
      }, 160);
    }

    destroy(): void {
      this.requestVersion += 1;
      if (this.timer) clearTimeout(this.timer);
    }
  });

  return [signatureHelpField, plugin];
}
