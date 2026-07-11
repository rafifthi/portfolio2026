"use client";

import { ClipboardEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { NotionBlock } from "@/lib/types";
import { Icon } from "@/components/Icon";

/* ----------------------------------------------------------------------------
 * Editor state: NotionBlock has no id, so the editor wraps each block with a
 * stable local id used for React keys and focus targeting. Ids are stripped
 * on save via fromEditorBlocks.
 * ------------------------------------------------------------------------- */

export type EditorBlock = { id: string; block: NotionBlock };

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `blk-${Math.random().toString(36).slice(2)}`;
}

export function toEditorBlocks(blocks: NotionBlock[]): EditorBlock[] {
  const list = (blocks || []).map((block) => ({ id: newId(), block }));
  return list.length ? list : [{ id: newId(), block: { type: "paragraph", text: "" } }];
}

export function fromEditorBlocks(blocks: EditorBlock[]): NotionBlock[] {
  return blocks.map((entry) => entry.block);
}

/* ----------------------------------------------------------------------------
 * Slash menu / block type catalog
 * ------------------------------------------------------------------------- */

type BlockKind =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulleted_list"
  | "numbered_list"
  | "todo_list"
  | "blockquote"
  | "code"
  | "callout"
  | "divider"
  | "table"
  | "image";

const MENU_ITEMS: { kind: BlockKind; label: string; icon: string; keywords: string }[] = [
  { kind: "paragraph", label: "Text", icon: "Type", keywords: "text paragraph plain" },
  { kind: "heading1", label: "Heading 1", icon: "Heading1", keywords: "h1 title heading" },
  { kind: "heading2", label: "Heading 2", icon: "Heading2", keywords: "h2 subtitle heading" },
  { kind: "heading3", label: "Heading 3", icon: "Heading3", keywords: "h3 heading" },
  { kind: "bulleted_list", label: "Bulleted list", icon: "List", keywords: "bullet ul unordered list" },
  { kind: "numbered_list", label: "Numbered list", icon: "ListOrdered", keywords: "ol ordered number list" },
  { kind: "todo_list", label: "Todo list", icon: "ListChecks", keywords: "todo task checkbox check list" },
  { kind: "blockquote", label: "Quote", icon: "Quote", keywords: "quote blockquote citation" },
  { kind: "code", label: "Code", icon: "Code", keywords: "code snippet pre monospace" },
  { kind: "callout", label: "Callout", icon: "Megaphone", keywords: "callout info note highlight" },
  { kind: "divider", label: "Divider", icon: "Minus", keywords: "divider separator hr line" },
  { kind: "table", label: "Table", icon: "Table", keywords: "table grid rows columns" },
  { kind: "image", label: "Image", icon: "Image", keywords: "image picture photo media" },
];

function blockKind(block: NotionBlock): BlockKind {
  if (block.type === "heading") return `heading${block.level}` as BlockKind;
  return block.type as BlockKind;
}

function kindIcon(kind: BlockKind) {
  return MENU_ITEMS.find((item) => item.kind === kind)?.icon || "Type";
}

/** Plain text carried across block-type conversions. */
function blockText(block: NotionBlock): string {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "blockquote":
    case "callout":
      return block.text;
    case "bulleted_list":
    case "numbered_list":
      return block.items.join("\n");
    case "todo_list":
      return block.items.map((item) => item.text).join("\n");
    case "code":
      return block.code;
    default:
      return "";
  }
}

function makeBlock(kind: BlockKind, text: string): NotionBlock {
  const lines = text ? text.split("\n") : [];
  switch (kind) {
    case "heading1":
      return { type: "heading", level: 1, text };
    case "heading2":
      return { type: "heading", level: 2, text };
    case "heading3":
      return { type: "heading", level: 3, text };
    case "blockquote":
      return { type: "blockquote", text };
    case "callout":
      return { type: "callout", icon: "Lightbulb", text };
    case "bulleted_list":
      return { type: "bulleted_list", items: lines.length ? lines : [""] };
    case "numbered_list":
      return { type: "numbered_list", items: lines.length ? lines : [""] };
    case "todo_list":
      return { type: "todo_list", items: (lines.length ? lines : [""]).map((line) => ({ text: line, checked: false })) };
    case "code":
      return { type: "code", language: "typescript", code: text };
    case "divider":
      return { type: "divider" };
    case "table":
      return { type: "table", header: ["Column 1", "Column 2"], rows: [["", ""], ["", ""]] };
    case "image":
      return { type: "image", src: "", caption: "" };
    default:
      return { type: "paragraph", text };
  }
}

function convertBlock(block: NotionBlock, kind: BlockKind): NotionBlock {
  return makeBlock(kind, blockText(block));
}

/* ----------------------------------------------------------------------------
 * Autoformat: markdown prefixes typed at the start of a text block
 * ------------------------------------------------------------------------- */

const AUTOFORMAT: { pattern: RegExp; kind: BlockKind }[] = [
  { pattern: /^###\s$/, kind: "heading3" },
  { pattern: /^##\s$/, kind: "heading2" },
  { pattern: /^#\s$/, kind: "heading1" },
  { pattern: /^[-*]\s$/, kind: "bulleted_list" },
  { pattern: /^1[.)]\s$/, kind: "numbered_list" },
  { pattern: /^>\s$/, kind: "blockquote" },
  { pattern: /^\[\s?\]\s$/, kind: "todo_list" },
  { pattern: /^```$/, kind: "code" },
];

/* ----------------------------------------------------------------------------
 * Inline formatting: wrap/unwrap the selection with a markdown marker
 * ------------------------------------------------------------------------- */

function toggleWrap(value: string, start: number, end: number, marker: string) {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);
  const m = marker.length;

  if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= m * 2) {
    const inner = selected.slice(m, -m);
    return { value: before + inner + after, start, end: start + inner.length };
  }
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return { value: before.slice(0, -m) + selected + after.slice(m), start: start - m, end: end - m };
  }
  return { value: before + marker + selected + marker + after, start: start + m, end: end + m };
}

/* ----------------------------------------------------------------------------
 * Auto-growing textarea (field-sizing with a scrollHeight fallback)
 * ------------------------------------------------------------------------- */

const supportsFieldSizing =
  typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content");

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el || supportsFieldSizing) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

const textareaBase =
  "w-full resize-none border-none bg-transparent p-0 text-white outline-none placeholder:text-white/25";
const textareaStyle = { fieldSizing: "content" } as React.CSSProperties;

/* ----------------------------------------------------------------------------
 * BlockEditor
 * ------------------------------------------------------------------------- */

type FocusRequest = { key: string; caret: "start" | "end" | number } | null;

/** First/last focusable registry key inside a block, for edge navigation. */
function edgeKeyFor(entry: EditorBlock, edge: "start" | "end"): string {
  const { id, block } = entry;
  switch (block.type) {
    case "bulleted_list":
    case "numbered_list":
    case "todo_list":
      return `${id}:${edge === "start" ? 0 : block.items.length - 1}`;
    case "table":
      return edge === "start" || block.rows.length === 0
        ? `${id}:h:0`
        : `${id}:${block.rows.length - 1}:0`;
    case "image":
      return `${id}:src`;
    default:
      return id;
  }
}

type MenuState = { blockId: string; query: string; active: number; fromSlash: boolean } | null;

export function BlockEditor({
  value,
  onChange,
  uploadImage,
}: {
  value: EditorBlock[];
  onChange: (next: EditorBlock[]) => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const refs = useRef(new Map<string, HTMLTextAreaElement | HTMLInputElement>());
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const [menu, setMenu] = useState<MenuState>(null);

  const register = useCallback((key: string) => {
    return (el: HTMLTextAreaElement | HTMLInputElement | null) => {
      if (el) {
        refs.current.set(key, el);
        if (el instanceof HTMLTextAreaElement) autoGrow(el);
      } else {
        refs.current.delete(key);
      }
    };
  }, []);

  useEffect(() => {
    if (!focusRequest) return;

    // Resolve boundary-navigation pseudo keys to the neighbor block's edge field.
    let key = focusRequest.key;
    const prev = key.match(/^__prev__:(\d+)$/);
    const next = key.match(/^__next__:(\d+)$/);
    if (prev || next) {
      const neighbor = prev ? value[Number(prev[1]) - 1] : value[Number(next![1]) + 1];
      if (!neighbor) {
        // Focus requests are one-shot commands consumed by this effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFocusRequest(null);
        return;
      }
      key = edgeKeyFor(neighbor, prev ? "end" : "start");
    }

    const el = refs.current.get(key);
    if (el) {
      el.focus();
      const length = typeof el.value === "string" ? el.value.length : 0;
      const caret = focusRequest.caret === "start" ? 0 : focusRequest.caret === "end" ? length : focusRequest.caret;
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        // divs / unsupported inputs don't take selection — fine
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusRequest(null);
  }, [focusRequest, value]);

  const menuItems = menu
    ? MENU_ITEMS.filter((item) =>
        `${item.label} ${item.keywords}`.toLowerCase().includes(menu.query.toLowerCase())
      )
    : [];

  function update(id: string, block: NotionBlock) {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, block } : entry)));
  }

  function insertAfter(index: number, block: NotionBlock, focusKey?: string, caret: "start" | "end" | number = "start") {
    const entry = { id: newId(), block };
    const next = [...value.slice(0, index + 1), entry, ...value.slice(index + 1)];
    onChange(next);
    setFocusRequest({ key: focusKey ? `${entry.id}${focusKey}` : entry.id, caret });
    return entry;
  }

  function remove(index: number) {
    const target = value[index];
    if (value.length === 1) {
      const entry = { id: newId(), block: { type: "paragraph", text: "" } as NotionBlock };
      onChange([entry]);
      setFocusRequest({ key: entry.id, caret: "start" });
      return;
    }
    onChange(value.filter((entry) => entry.id !== target.id));
    const neighbor = value[index - 1] || value[index + 1];
    if (neighbor) {
      setFocusRequest({ key: edgeKeyFor(neighbor, "end"), caret: "end" });
    }
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }


  function applyMenuSelection(kind: BlockKind) {
    if (!menu) return;
    const index = value.findIndex((entry) => entry.id === menu.blockId);
    if (index === -1) return setMenu(null);
    const current = value[index].block;
    // Strip the "/query" the user typed before converting.
    const stripped =
      menu.fromSlash && (current.type === "paragraph" || current.type === "heading" || current.type === "blockquote")
        ? { ...current, text: current.text.replace(/^\/.*$/, "") }
        : current;
    const converted = convertBlock(stripped, kind);
    const next = value.map((entry, i) => (i === index ? { ...entry, block: converted } : entry));
    onChange(next);
    setMenu(null);
    setFocusRequest({ key: edgeKeyFor({ id: menu.blockId, block: converted }, "end"), caret: "end" });
  }

  function handleMenuKeys(event: KeyboardEvent): boolean {
    if (!menu) return false;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMenu({ ...menu, active: (menu.active + 1) % Math.max(menuItems.length, 1) });
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMenu({ ...menu, active: (menu.active - 1 + Math.max(menuItems.length, 1)) % Math.max(menuItems.length, 1) });
      return true;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const item = menuItems[menu.active] || menuItems[0];
      if (item) applyMenuSelection(item.kind);
      else setMenu(null);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(null);
      return true;
    }
    return false;
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-3">
      {value.map((entry, index) => (
        <BlockRow
          key={entry.id}
          entry={entry}
          index={index}
          total={value.length}
          menu={menu?.blockId === entry.id ? { items: menuItems, active: menu.active } : null}
          register={register}
          update={(block) => update(entry.id, block)}
          insertAfter={insertAfter}
          remove={remove}
          move={move}
          setFocusRequest={setFocusRequest}
          openMenu={(fromSlash, query) => setMenu({ blockId: entry.id, query, active: 0, fromSlash })}
          updateMenuQuery={(query) => menu && setMenu({ ...menu, query, active: 0 })}
          closeMenu={() => setMenu(null)}
          menuOpen={menu?.blockId === entry.id}
          handleMenuKeys={handleMenuKeys}
          applyMenuSelection={applyMenuSelection}
          uploadImage={uploadImage}
        />
      ))}
      <div
        className="h-8 cursor-text"
        onMouseDown={(event) => {
          event.preventDefault();
          const last = value[value.length - 1];
          if (last.block.type === "paragraph" && last.block.text === "") {
            setFocusRequest({ key: last.id, caret: "end" });
            return;
          }
          insertAfter(value.length - 1, { type: "paragraph", text: "" });
        }}
        title="Click to add a block"
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * BlockRow: gutter + per-type editor + slash menu
 * ------------------------------------------------------------------------- */

function BlockRow({
  entry,
  index,
  total,
  menu,
  register,
  update,
  insertAfter,
  remove,
  move,
  setFocusRequest,
  openMenu,
  updateMenuQuery,
  closeMenu,
  menuOpen,
  handleMenuKeys,
  applyMenuSelection,
  uploadImage,
}: {
  entry: EditorBlock;
  index: number;
  total: number;
  menu: { items: typeof MENU_ITEMS; active: number } | null;
  register: (key: string) => (el: HTMLTextAreaElement | HTMLInputElement | null) => void;
  update: (block: NotionBlock) => void;
  insertAfter: (index: number, block: NotionBlock, focusKey?: string, caret?: "start" | "end" | number) => EditorBlock;
  remove: (index: number) => void;
  move: (index: number, delta: -1 | 1) => void;
  setFocusRequest: (request: FocusRequest) => void;
  openMenu: (fromSlash: boolean, query: string) => void;
  updateMenuQuery: (query: string) => void;
  closeMenu: () => void;
  menuOpen: boolean;
  handleMenuKeys: (event: KeyboardEvent) => boolean;
  applyMenuSelection: (kind: BlockKind) => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const { block } = entry;
  const kind = blockKind(block);

  const gutter = (
    <div className="absolute -left-1 top-1 flex -translate-x-full items-center gap-0.5 opacity-0 transition group-hover/row:opacity-100">
      <button
        type="button"
        title="Change block type"
        onMouseDown={(event) => {
          event.preventDefault();
          if (menuOpen) closeMenu();
          else openMenu(false, "");
        }}
        className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
      >
        <Icon name={kindIcon(kind)} size={14} />
      </button>
      <div className="flex flex-col">
        <button type="button" title="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20">
          <Icon name="ChevronUp" size={12} />
        </button>
        <button type="button" title="Move down" disabled={index === total - 1} onClick={() => move(index, 1)} className="rounded p-0.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20">
          <Icon name="ChevronDown" size={12} />
        </button>
      </div>
      <button type="button" title="Delete block" onClick={() => remove(index)} className="rounded p-1 text-white/40 hover:bg-rose-400/15 hover:text-rose-300">
        <Icon name="Trash2" size={13} />
      </button>
    </div>
  );

  const slashMenu = menu && (
    <div className="absolute left-8 top-full z-50 mt-1 max-h-72 w-64 overflow-auto rounded-lg border border-white/10 bg-[#0d1420] py-1 shadow-2xl">
      {menu.items.length === 0 && <div className="px-3 py-2 text-xs text-white/40">No matching block</div>}
      {menu.items.map((item, itemIndex) => (
        <button
          key={item.kind}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            applyMenuSelection(item.kind);
          }}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm"
          style={{
            background: itemIndex === menu.active ? "rgba(14,165,233,0.22)" : "transparent",
            color: itemIndex === menu.active ? "#e0f2fe" : "rgba(255,255,255,0.75)",
          }}
        >
          <Icon name={item.icon} size={15} />
          {item.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="group/row relative rounded px-2 py-1 pl-3 hover:bg-white/[0.03]">
      {gutter}
      <BlockBody
        entry={entry}
        index={index}
        register={register}
        update={update}
        insertAfter={insertAfter}
        remove={remove}
        setFocusRequest={setFocusRequest}
        openMenu={openMenu}
        updateMenuQuery={updateMenuQuery}
        closeMenu={closeMenu}
        menuOpen={menuOpen}
        handleMenuKeys={handleMenuKeys}
        uploadImage={uploadImage}
      />
      {slashMenu}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Per-type editors
 * ------------------------------------------------------------------------- */

function BlockBody({
  entry,
  index,
  register,
  update,
  insertAfter,
  remove,
  setFocusRequest,
  openMenu,
  updateMenuQuery,
  closeMenu,
  menuOpen,
  handleMenuKeys,
  uploadImage,
}: {
  entry: EditorBlock;
  index: number;
  register: (key: string) => (el: HTMLTextAreaElement | HTMLInputElement | null) => void;
  update: (block: NotionBlock) => void;
  insertAfter: (index: number, block: NotionBlock, focusKey?: string, caret?: "start" | "end" | number) => EditorBlock;
  remove: (index: number) => void;
  setFocusRequest: (request: FocusRequest) => void;
  openMenu: (fromSlash: boolean, query: string) => void;
  updateMenuQuery: (query: string) => void;
  closeMenu: () => void;
  menuOpen: boolean;
  handleMenuKeys: (event: KeyboardEvent) => boolean;
  uploadImage: (file: File) => Promise<string>;
}) {
  const { id, block } = entry;

  /** Shared boundary navigation for single-textarea blocks. */
  function boundaryNav(event: KeyboardEvent<HTMLTextAreaElement>, text: string) {
    const el = event.currentTarget;
    if (event.key === "ArrowUp" && el.selectionStart === 0 && el.selectionEnd === 0) {
      event.preventDefault();
      setFocusRequest({ key: `__prev__:${index}`, caret: "end" });
      return true;
    }
    if (event.key === "ArrowDown" && el.selectionStart === text.length && el.selectionEnd === text.length) {
      event.preventDefault();
      setFocusRequest({ key: `__next__:${index}`, caret: "start" });
      return true;
    }
    return false;
  }

  function formatKeys(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, text: string, apply: (next: string) => void) {
    if (!(event.metaKey || event.ctrlKey)) return false;
    const marker = event.key === "b" ? "**" : event.key === "i" ? "*" : null;
    if (!marker) return false;
    event.preventDefault();
    const el = event.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const result = toggleWrap(text, start, end, marker);
    apply(result.value);
    requestAnimationFrame(() => {
      el.setSelectionRange(result.start, result.end);
    });
    return true;
  }

  // ---- text-bearing single-field blocks: paragraph / heading / quote / callout ----
  if (block.type === "paragraph" || block.type === "heading" || block.type === "blockquote" || block.type === "callout") {
    const textBlock = block;
    const text = textBlock.text;
    const setText = (nextText: string) => update({ ...textBlock, text: nextText });

    const sizeClass =
      block.type === "heading"
        ? block.level === 1
          ? "text-2xl font-bold"
          : block.level === 2
            ? "text-xl font-bold"
            : "text-lg font-semibold"
        : "text-sm leading-6";

    const placeholder =
      block.type === "paragraph"
        ? "Type '/' for commands…"
        : block.type === "heading"
          ? `Heading ${block.level}`
          : block.type === "blockquote"
            ? "Quote"
            : "Callout text";

    function onChangeText(nextText: string) {
      // Slash menu: track "/query" typed at the start of the block.
      if (textBlock.type === "paragraph" && /^\//.test(nextText) && !nextText.includes("\n")) {
        if (menuOpen) updateMenuQuery(nextText.slice(1));
        else openMenu(true, nextText.slice(1));
      } else if (menuOpen) {
        closeMenu();
      }

      // Autoformat markdown prefixes (paragraph only).
      if (textBlock.type === "paragraph") {
        for (const rule of AUTOFORMAT) {
          if (rule.pattern.test(nextText)) {
            const converted = makeBlock(rule.kind, "");
            update(converted);
            setFocusRequest({
              key:
                rule.kind === "bulleted_list" || rule.kind === "numbered_list" || rule.kind === "todo_list"
                  ? `${id}:0`
                  : id,
              caret: "start",
            });
            return;
          }
        }
      }

      setText(nextText);
    }

    function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
      if (handleMenuKeys(event)) return;
      if (formatKeys(event, text, setText)) return;

      const el = event.currentTarget;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const caret = el.selectionStart;
        const before = text.slice(0, caret);
        const after = text.slice(caret);
        update({ ...textBlock, text: before });
        insertAfter(index, { type: "paragraph", text: after }, undefined, "start");
        return;
      }
      if (event.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
        if (text === "") {
          event.preventDefault();
          remove(index);
          return;
        }
        if (textBlock.type !== "paragraph") {
          // Linear-like: backspace at start of a styled block downgrades to text.
          event.preventDefault();
          update({ type: "paragraph", text });
          setFocusRequest({ key: id, caret: "start" });
          return;
        }
      }
      boundaryNav(event, text);
    }

    const body = (
      <textarea
        ref={register(id) as (el: HTMLTextAreaElement | null) => void}
        rows={1}
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          onChangeText(event.target.value);
          autoGrow(event.target);
        }}
        onKeyDown={onKeyDown}
        onPaste={
          block.type === "paragraph"
            ? (event: ClipboardEvent<HTMLTextAreaElement>) => {
                const pasted = event.clipboardData.getData("text/plain");
                if (!/\n{2,}/.test(pasted)) return;
                event.preventDefault();
                const el = event.currentTarget;
                const merged = text.slice(0, el.selectionStart) + pasted + text.slice(el.selectionEnd);
                const parts = merged.split(/\n{2,}/);
                update({ ...textBlock, text: parts[0] });
                let at = index;
                for (const part of parts.slice(1)) {
                  insertAfter(at, { type: "paragraph", text: part }, undefined, "end");
                  at += 1;
                }
              }
            : undefined
        }
        className={`${textareaBase} ${sizeClass}`}
        style={textareaStyle}
      />
    );

    if (block.type === "blockquote") {
      return <div className="border-l-2 border-sky-400 pl-3">{body}</div>;
    }
    if (block.type === "callout") {
      return (
        <div className="flex gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <div className="flex flex-col items-center gap-1">
            <Icon name={block.icon} size={16} className="text-sky-300" />
            <input
              value={block.icon}
              onChange={(event) => update({ ...block, icon: event.target.value })}
              className="w-20 rounded border border-white/10 bg-white/[0.06] px-1 py-0.5 text-center text-[10px] text-white/60 outline-none focus:border-sky-400"
              title="Lucide icon name"
            />
          </div>
          <div className="flex-1">{body}</div>
        </div>
      );
    }
    return body;
  }

  // ---- lists: bulleted / numbered / todo ----
  if (block.type === "bulleted_list" || block.type === "numbered_list" || block.type === "todo_list") {
    const isTodo = block.type === "todo_list";
    const items = isTodo ? block.items.map((item) => item.text) : block.items;

    function setItems(nextItems: string[]) {
      if (block.type === "todo_list") {
        update({
          ...block,
          items: nextItems.map((text, i) => ({ text, checked: block.items[i]?.checked || false })),
        });
      } else if (block.type === "bulleted_list" || block.type === "numbered_list") {
        update({ ...block, items: nextItems });
      }
    }

    function itemKeyDown(event: KeyboardEvent<HTMLInputElement>, itemIndex: number) {
      if (formatKeys(event, items[itemIndex], (next) => setItems(items.map((item, i) => (i === itemIndex ? next : item))))) return;
      const el = event.currentTarget;

      if (event.key === "Enter") {
        event.preventDefault();
        // Enter on an empty last item exits the list into a paragraph below.
        if (items[itemIndex] === "" && itemIndex === items.length - 1 && items.length > 1) {
          if (block.type === "todo_list") {
            update({ ...block, items: block.items.slice(0, -1) });
          } else {
            setItems(items.slice(0, -1));
          }
          insertAfter(index, { type: "paragraph", text: "" });
          return;
        }
        const caret = el.selectionStart ?? 0;
        const before = items[itemIndex].slice(0, caret);
        const after = items[itemIndex].slice(caret);
        if (block.type === "todo_list") {
          update({
            ...block,
            items: [
              ...block.items.slice(0, itemIndex),
              { text: before, checked: block.items[itemIndex].checked },
              { text: after, checked: false },
              ...block.items.slice(itemIndex + 1),
            ],
          });
        } else {
          setItems([...items.slice(0, itemIndex), before, after, ...items.slice(itemIndex + 1)]);
        }
        setFocusRequest({ key: `${id}:${itemIndex + 1}`, caret: "start" });
        return;
      }

      if (event.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
        if (items[itemIndex] === "") {
          event.preventDefault();
          if (items.length === 1) {
            update({ type: "paragraph", text: "" });
            setFocusRequest({ key: id, caret: "start" });
          } else {
            const nextItems = items.filter((_, i) => i !== itemIndex);
            if (isTodo) {
              update({ ...block, items: block.items.filter((_, i) => i !== itemIndex) });
            } else {
              setItems(nextItems);
            }
            setFocusRequest({ key: `${id}:${Math.max(itemIndex - 1, 0)}`, caret: "end" });
          }
          return;
        }
      }

      if (event.key === "ArrowUp" && el.selectionStart === 0) {
        event.preventDefault();
        if (itemIndex > 0) setFocusRequest({ key: `${id}:${itemIndex - 1}`, caret: "end" });
        else setFocusRequest({ key: `__prev__:${index}`, caret: "end" });
        return;
      }
      if (event.key === "ArrowDown" && el.selectionStart === items[itemIndex].length) {
        event.preventDefault();
        if (itemIndex < items.length - 1) setFocusRequest({ key: `${id}:${itemIndex + 1}`, caret: "start" });
        else setFocusRequest({ key: `__next__:${index}`, caret: "start" });
        return;
      }
    }

    return (
      <div className="space-y-1">
        {items.map((item, itemIndex) => (
          <div key={itemIndex} className="flex items-center gap-2">
            {isTodo ? (
              <button
                type="button"
                onClick={() => {
                  if (block.type !== "todo_list") return;
                  update({
                    ...block,
                    items: block.items.map((todoItem, i) => (i === itemIndex ? { ...todoItem, checked: !todoItem.checked } : todoItem)),
                  });
                }}
                className="flex-shrink-0"
              >
                <Icon
                  name={block.type === "todo_list" && block.items[itemIndex]?.checked ? "SquareCheck" : "Square"}
                  size={15}
                  className={block.type === "todo_list" && block.items[itemIndex]?.checked ? "text-sky-400" : "text-white/40"}
                />
              </button>
            ) : (
              <span className="w-4 flex-shrink-0 text-right text-sm text-white/40">
                {block.type === "numbered_list" ? `${itemIndex + 1}.` : "•"}
              </span>
            )}
            <input
              ref={register(`${id}:${itemIndex}`) as (el: HTMLInputElement | null) => void}
              value={item}
              placeholder="List item"
              onChange={(event) => setItems(items.map((existing, i) => (i === itemIndex ? event.target.value : existing)))}
              onKeyDown={(event) => itemKeyDown(event, itemIndex)}
              className={`flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-white/25 ${
                block.type === "todo_list" && block.items[itemIndex]?.checked ? "text-white/40 line-through" : ""
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  // ---- code ----
  if (block.type === "code") {
    return (
      <div className="rounded-lg border border-white/10 bg-black/40">
        <div className="flex items-center border-b border-white/10 px-3 py-1">
          <input
            value={block.language}
            onChange={(event) => update({ ...block, language: event.target.value })}
            placeholder="language"
            className="w-32 border-none bg-transparent text-xs text-white/50 outline-none"
          />
        </div>
        <textarea
          ref={register(id) as (el: HTMLTextAreaElement | null) => void}
          rows={1}
          value={block.code}
          placeholder="Code…"
          onChange={(event) => {
            update({ ...block, code: event.target.value });
            autoGrow(event.target);
          }}
          onKeyDown={(event) => {
            const el = event.currentTarget;
            if (event.key === "Backspace" && block.code === "" && el.selectionStart === 0) {
              event.preventDefault();
              remove(index);
              return;
            }
            boundaryNav(event, block.code);
          }}
          className={`${textareaBase} px-3 py-2 font-mono text-xs leading-relaxed`}
          style={textareaStyle}
          spellCheck={false}
        />
      </div>
    );
  }

  // ---- divider ----
  if (block.type === "divider") {
    return (
      <div
        tabIndex={0}
        ref={register(id) as unknown as (el: HTMLInputElement | null) => void}
        onKeyDown={(event) => {
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            remove(index);
          }
          if (event.key === "Enter") {
            event.preventDefault();
            insertAfter(index, { type: "paragraph", text: "" });
          }
        }}
        className="cursor-pointer rounded py-2 outline-none focus:bg-white/[0.06]"
        title="Divider — Backspace to delete"
      >
        <div className="h-px bg-white/15" />
      </div>
    );
  }

  // ---- image ----
  if (block.type === "image") {
    return (
      <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
        {block.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.src} alt={block.caption || ""} className="max-h-48 rounded-md object-cover" />
        ) : (
          <div className="flex h-20 items-center justify-center rounded-md bg-white/[0.05] text-xs text-white/35">
            No image yet
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={register(`${id}:src`) as (el: HTMLInputElement | null) => void}
            value={block.src}
            placeholder="Image URL"
            onChange={(event) => update({ ...block, src: event.target.value })}
            className="flex-1 rounded border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400"
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-white/10 px-2 py-1.5 text-xs text-white/70 hover:bg-white/10">
            <Icon name="Upload" size={13} />
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                const url = await uploadImage(file);
                if (url) update({ ...block, src: url });
              }}
            />
          </label>
        </div>
        <input
          value={block.caption || ""}
          placeholder="Caption (optional)"
          onChange={(event) => update({ ...block, caption: event.target.value })}
          className="w-full rounded border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400"
        />
      </div>
    );
  }

  // ---- table ----
  if (block.type === "table") {
    function setHeader(cellIndex: number, cell: string) {
      if (block.type !== "table") return;
      update({ ...block, header: block.header.map((existing, i) => (i === cellIndex ? cell : existing)) });
    }
    function setCell(rowIndex: number, cellIndex: number, cell: string) {
      if (block.type !== "table") return;
      update({
        ...block,
        rows: block.rows.map((row, r) => (r === rowIndex ? row.map((existing, c) => (c === cellIndex ? cell : existing)) : row)),
      });
    }
    function addRow() {
      if (block.type !== "table") return;
      update({ ...block, rows: [...block.rows, block.header.map(() => "")] });
    }
    function addColumn() {
      if (block.type !== "table") return;
      update({ ...block, header: [...block.header, `Column ${block.header.length + 1}`], rows: block.rows.map((row) => [...row, ""]) });
    }
    function removeRow(rowIndex: number) {
      if (block.type !== "table") return;
      update({ ...block, rows: block.rows.filter((_, r) => r !== rowIndex) });
    }
    function removeColumn(cellIndex: number) {
      if (block.type !== "table" || block.header.length <= 1) return;
      update({
        ...block,
        header: block.header.filter((_, c) => c !== cellIndex),
        rows: block.rows.map((row) => row.filter((_, c) => c !== cellIndex)),
      });
    }

    const cellClass =
      "w-full min-w-28 border-none bg-transparent px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/25";

    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.06]">
                {block.header.map((cell, cellIndex) => (
                  <th key={cellIndex} className="group/col relative border-b border-r border-white/10 p-0 last:border-r-0">
                    <input
                      ref={register(`${id}:h:${cellIndex}`) as (el: HTMLInputElement | null) => void}
                      value={cell}
                      placeholder="Header"
                      onChange={(event) => setHeader(cellIndex, event.target.value)}
                      className={`${cellClass} font-semibold`}
                    />
                    {block.header.length > 1 && (
                      <button
                        type="button"
                        title="Delete column"
                        onClick={() => removeColumn(cellIndex)}
                        className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/30 opacity-0 hover:bg-rose-400/15 hover:text-rose-300 group-hover/col:opacity-100"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group/tr">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="relative border-b border-r border-white/10 p-0 last:border-r-0 [tr:last-child_&]:border-b-0">
                      <input
                        ref={register(`${id}:${rowIndex}:${cellIndex}`) as (el: HTMLInputElement | null) => void}
                        value={cell}
                        onChange={(event) => setCell(rowIndex, cellIndex, event.target.value)}
                        className={cellClass}
                      />
                      {cellIndex === row.length - 1 && (
                        <button
                          type="button"
                          title="Delete row"
                          onClick={() => removeRow(rowIndex)}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/30 opacity-0 hover:bg-rose-400/15 hover:text-rose-300 group-hover/tr:opacity-100"
                        >
                          <Icon name="X" size={11} />
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addRow} className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/10">
            + Row
          </button>
          <button type="button" onClick={addColumn} className="rounded border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/10">
            + Column
          </button>
        </div>
      </div>
    );
  }

  // ---- unknown block type (e.g. hand-written JSON) — never silently dropped ----
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3">
      <pre className="flex-1 overflow-x-auto text-[10px] leading-relaxed text-amber-100/80">
        {JSON.stringify(block, null, 2)}
      </pre>
      <button type="button" title="Delete block" onClick={() => remove(index)} className="rounded p-1 text-amber-200/60 hover:bg-rose-400/15 hover:text-rose-300">
        <Icon name="Trash2" size={13} />
      </button>
    </div>
  );
}
