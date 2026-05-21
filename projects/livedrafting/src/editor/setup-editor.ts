import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { keymap, EditorView } from "@codemirror/view";

export type EditorRunHandler = () => void | Promise<void>;

const run_keymap = [
  {
    key: "Ctrl-Shift-Enter",
    mac: "Cmd-Shift-Enter",
    run: (view: EditorView) => {
      const on_run = (view as EditorView & { livedrafting_on_run?: EditorRunHandler })
        .livedrafting_on_run;
      if (on_run) {
        void on_run();
      }
      return true;
    },
  },
];

export function createEditor(
  parent: HTMLElement,
  initial_doc: string,
  on_change: (doc: string) => void,
  on_run: EditorRunHandler
): EditorView {
  const state = EditorState.create({
    doc: initial_doc,
    extensions: [
      history(),
      javascript({ typescript: true }),
      keymap.of([...run_keymap, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          on_change(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        "&": {
          backgroundColor: "transparent",
          color: "#e8e8e8",
        },
        ".cm-content": {
          padding: "12px 8px",
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "#fff",
        },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
          backgroundColor: "rgba(100, 140, 255, 0.35) !important",
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        },
      }),
    ],
  });

  const view = new EditorView({
    state,
    parent,
  });

  (view as EditorView & { livedrafting_on_run?: EditorRunHandler }).livedrafting_on_run =
    on_run;

  return view;
}

/** Replace the entire editor document (e.g. when loading an example sketch). */
export function setEditorDocument(view: EditorView, doc: string): void {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: doc },
  });
}
