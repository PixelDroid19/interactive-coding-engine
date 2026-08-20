import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { WorkspaceFile } from '../../types/scrim';
import { InstructorCursor } from '../player/InstructorCursor';

interface CodeEditorProps {
  file: WorkspaceFile | null;
  readOnly?: boolean;
  onCodeChange?: (newContent: string, changes: { from: number; to: number; text: string }[]) => void;
  onCursorMove?: (position: { line: number; ch: number }) => void;
  onSelectionChange?: (from: number, to: number) => void;
  instructorPointer?: { x: number; y: number; clicked?: boolean; targetArea: 'editor' | 'preview' | 'files' | 'global' };
  instructorCursor?: { line: number; ch: number };
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  readOnly = false,
  onCodeChange,
  onCursorMove,
  onSelectionChange,
  instructorPointer,
  instructorCursor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalChangeRef = useRef(false);

  const getLanguageExtension = (filename: string) => {
    if (filename.endsWith('.html')) return html();
    if (filename.endsWith('.css')) return css();
    if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) return javascript({ jsx: true, typescript: true });
    return javascript();
  };

  useEffect(() => {
    if (!containerRef.current || !file) return;

    // Clean up previous view
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const startState = EditorState.create({
      doc: file.content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        getLanguageExtension(file.name),
        oneDark,
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isInternalChangeRef.current) {
            const newDoc = update.state.doc.toString();
            const changes: { from: number; to: number; text: string }[] = [];
            update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
              changes.push({
                from: fromA,
                to: toA,
                text: inserted.toString(),
              });
            });
            onCodeChange?.(newDoc, changes);
          }

          if (update.selectionSet) {
            const mainSel = update.state.selection.main;
            const line = update.state.doc.lineAt(mainSel.head);
            onCursorMove?.({
              line: line.number,
              ch: mainSel.head - line.from,
            });
            if (mainSel.from !== mainSel.to) {
              onSelectionChange?.(mainSel.from, mainSel.to);
            }
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13.5px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            backgroundColor: '#1e1e1e',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'inherit',
          },
          '.cm-gutters': {
            backgroundColor: '#151515',
            color: '#64748b',
            borderRight: '1px solid #27272a',
          },
          '.cm-activeLine': {
            backgroundColor: '#26262655',
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#262626',
            color: '#cbd5e1',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [file?.path, readOnly]);

  // Sync incoming content changes during playback replay
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !file) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== file.content) {
      isInternalChangeRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: file.content,
        },
      });
      isInternalChangeRef.current = false;
    }
  }, [file?.content]);

  // Sync instructor cursor position visually if provided
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !instructorCursor) return;

    try {
      const lineNum = Math.min(instructorCursor.line, view.state.doc.lines);
      const line = view.state.doc.line(lineNum);
      const pos = Math.min(line.from + instructorCursor.ch, line.to);
      view.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true,
      });
    } catch (e) {}
  }, [instructorCursor]);

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-slate-500 font-mono text-sm">
        No file selected
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e1e1e]">
      <div ref={containerRef} className="h-full w-full" />

      {/* Instructor Pointer Indicator during playback */}
      {instructorPointer && (
        <InstructorCursor pointer={instructorPointer} containerType="editor" />
      )}
    </div>
  );
};
