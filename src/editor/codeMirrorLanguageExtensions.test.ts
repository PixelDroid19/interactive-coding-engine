// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { CompletionContext } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  completionToCodeMirror,
  collectCodeMirrorSyntaxDiagnostics,
  createSignatureHelpExtension,
  createSemanticCompletionSource,
  languageDiagnosticsToCodeMirror,
  type SemanticLanguageClient,
} from './codeMirrorLanguageExtensions';

const client: SemanticLanguageClient = {
  completions: async () => [
    { label: 'doble', insertText: 'doble', kind: 'function', detail: 'function doble(numero: any): number' },
    { label: 'doble()', insertText: 'doble()', kind: 'function', cursorOffset: -1, detail: 'Llamar función' },
    { label: 'DedicatedWorkerGlobalScope', insertText: 'DedicatedWorkerGlobalScope', kind: 'class' },
  ],
  diagnostics: async () => [],
  hover: async () => null,
  signatureHelp: async () => null,
};

describe('adaptador semántico de CodeMirror', () => {
  it('mantiene separadas la sugerencia del identificador y la llamada', async () => {
    const code = 'function doble(numero) { return numero * 2; }\ndo';
    const state = EditorState.create({ doc: code, extensions: [javascript()] });
    const result = await createSemanticCompletionSource(client, () => 'app.js')(
      new CompletionContext(state, code.length, false),
    );

    expect(result?.from).toBe(code.length - 2);
    expect(result?.options.map((option) => option.label)).toEqual(['doble', 'doble()']);
    expect(result?.options[0]?.apply).toBe('doble');
    expect(result?.options[1]?.apply).toBeTypeOf('function');
  });

  it('coloca el cursor dentro de los paréntesis al elegir llamar función', () => {
    const parent = document.createElement('div');
    const view = new EditorView({
      state: EditorState.create({ doc: 'do', selection: { anchor: 2 } }),
      parent,
    });
    const option = completionToCodeMirror({
      label: 'doble()',
      insertText: 'doble()',
      kind: 'function',
      cursorOffset: -1,
    });

    expect(option.apply).toBeTypeOf('function');
    if (typeof option.apply === 'function') option.apply(view, option, 0, 2);

    expect(view.state.doc.toString()).toBe('doble()');
    expect(view.state.selection.main.head).toBe(6);
    view.destroy();
  });

  it('convierte diagnósticos semánticos sin perder severidad, código ni origen', () => {
    const diagnostics = languageDiagnosticsToCodeMirror([{
      from: 4,
      to: 14,
      severity: 'error',
      message: "No se encuentra el nombre 'resultado'.",
      source: 'TypeScript',
      code: 2304,
    }], 8);

    expect(diagnostics).toEqual([expect.objectContaining({
      from: 4,
      to: 8,
      severity: 'error',
      source: 'TypeScript · TS2304',
    })]);
  });

  it('no cuenta varias veces el mismo cierre de sintaxis ausente', () => {
    const state = EditorState.create({
      doc: 'function doble(numero) {\n  return numero * 2;\n',
      extensions: [javascript()],
    });

    const diagnostics = collectCodeMirrorSyntaxDiagnostics(state);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('llave');
  });

  it('cierra la ayuda de firma cuando el editor pierde el foco', async () => {
    const parent = document.createElement('div');
    document.body.append(parent);
    const signatureClient: SemanticLanguageClient = {
      ...client,
      signatureHelp: async () => ({
        from: 0,
        label: 'addEventListener(type, listener)',
        documentation: 'Registra una función para responder a un evento.',
        activeParameter: 0,
        parameters: [{ label: 'type', documentation: 'Nombre del evento.' }],
      }),
    };
    const view = new EditorView({
      state: EditorState.create({
        doc: "button.addEventListener('",
        selection: { anchor: 25 },
        extensions: [createSignatureHelpExtension(signatureClient, () => 'app.js')],
      }),
      parent,
    });
    view.focus();

    await new Promise((resolve) => setTimeout(resolve, 190));
    expect(parent.querySelector('.cm-signature-help')).not.toBeNull();

    view.contentDOM.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    expect(parent.querySelector('.cm-signature-help')).toBeNull();
    view.destroy();
    parent.remove();
  });
});
