import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Other people's carets and selections, drawn as ProseMirror decorations (nothing is written into the
// document). Positions arrive over Supabase Realtime and are mapped through local edits until the next update.

export type RemoteCursor = { id: string; name: string; color: string; from: number; to: number };
export const remoteCursorsKey = new PluginKey<DecorationSet>("remoteCursors");

function build(state: EditorState, cursors: RemoteCursor[]): DecorationSet {
  const max = state.doc.content.size;
  const clamp = (n: number) => Math.max(0, Math.min(max, n));
  const decos: Decoration[] = [];
  for (const c of cursors) {
    const from = clamp(Math.min(c.from, c.to));
    const to = clamp(Math.max(c.from, c.to));
    const head = clamp(c.to);
    if (to > from) {
      decos.push(Decoration.inline(from, to, { class: "rc-sel", style: `background-color:${c.color}33` }, { id: c.id }));
    }
    decos.push(
      Decoration.widget(head, () => {
        const caret = document.createElement("span");
        caret.className = "rc-caret";
        caret.style.borderColor = c.color;
        caret.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "rc-label";
        label.style.backgroundColor = c.color;
        label.textContent = c.name;
        caret.appendChild(label);
        return caret;
      }, { key: `${c.id}:${head}:${c.name}`, side: 1, ignoreSelection: true }),
    );
  }
  return DecorationSet.create(state.doc, decos);
}

export const RemoteCursors = Extension.create({
  name: "remoteCursors",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: remoteCursorsKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set, _old, state) {
            const next = tr.getMeta(remoteCursorsKey) as RemoteCursor[] | undefined;
            return next ? build(state, next) : set.map(tr.mapping, tr.doc);
          },
        },
        props: { decorations: (state) => remoteCursorsKey.getState(state) },
      }),
    ];
  },
});
