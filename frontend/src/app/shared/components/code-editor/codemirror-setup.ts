import { indentWithTab } from '@codemirror/commands';
import { java } from '@codemirror/lang-java';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { Diagnostic, lintGutter, setDiagnostics } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';

export interface EditorCallbacks {
  onChange(value: string): void;
  onRun(): void;
}

/** Colours come from the design tokens, so the editor matches the rest of the app. */
const theme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: 'var(--color-code-bg)',
      color: 'var(--syntax-plain)',
      fontSize: 'var(--editor-font-size, var(--text-sm))',
    },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.65' },
    '.cm-content': { caretColor: 'var(--color-accent)', padding: 'var(--space-3) 0' },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--color-accent)',
      borderLeftWidth: '2px',
    },
    '&.cm-focused': { outline: 'none' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'color-mix(in srgb, var(--color-accent) 28%, transparent) !important',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-code-bg)',
      color: 'var(--color-text-subtle)',
      border: 'none',
    },
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
    },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-text-muted)' },
    '.cm-matchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid var(--color-border-strong)',
    },
    '.cm-tooltip': {
      backgroundColor: 'var(--color-surface-raised)',
      border: '1px solid var(--color-border-strong)',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--color-accent-soft)',
      color: 'var(--color-text)',
    },
    '.cm-panels': { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy var(--color-danger)',
      textUnderlineOffset: '3px',
    },
    '.cm-diagnostic-error': { borderLeftColor: 'var(--color-danger)' },
    '.cm-tooltip-lint': { maxWidth: '28rem', fontFamily: 'var(--font-sans)' },
  },
  { dark: true },
);

const highlighting = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.controlKeyword, tags.bool, tags.null],
    color: 'var(--syntax-keyword)',
  },
  { tag: [tags.typeName, tags.className, tags.namespace], color: 'var(--syntax-type)' },
  { tag: [tags.string, tags.character], color: 'var(--syntax-string)' },
  { tag: tags.number, color: 'var(--syntax-number)' },
  {
    tag: [tags.lineComment, tags.blockComment],
    color: 'var(--syntax-comment)',
    fontStyle: 'italic',
  },
  { tag: tags.function(tags.variableName), color: 'var(--syntax-function)' },
]);

export function createEditor(
  parent: HTMLElement,
  doc: string,
  label: string,
  callbacks: EditorCallbacks,
): EditorView {
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        basicSetup,
        java(),
        lintGutter(),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              callbacks.onRun();
              return true;
            },
          },
          indentWithTab,
        ]),
        theme,
        syntaxHighlighting(highlighting),
        EditorView.contentAttributes.of({ 'aria-label': label }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            callbacks.onChange(update.state.doc.toString());
          }
        }),
      ],
    }),
  });
}

/** Replaces the whole document, e.g. when the parent resets the code. */
export function replaceDocument(view: EditorView, value: string): void {
  if (view.state.doc.toString() !== value) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }
}

/** A problem to mark on one line of the code, e.g. a compiler error. */
export interface LineMark {
  line: number;
  message: string;
}

/** Underlines the marked lines and shows the message on hover; an empty list clears them. */
export function markLines(view: EditorView, marks: readonly LineMark[]): void {
  const doc = view.state.doc;
  const diagnostics: Diagnostic[] = marks
    .filter((mark) => mark.line >= 1 && mark.line <= doc.lines)
    .map((mark) => {
      const line = doc.line(mark.line);
      const start = line.from + (line.text.length - line.text.trimStart().length);
      return {
        from: Math.min(start, line.to),
        to: line.to,
        severity: 'error',
        message: mark.message,
      };
    });
  view.dispatch(setDiagnostics(view.state, diagnostics));
}
