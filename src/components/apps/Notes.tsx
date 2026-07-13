"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { notes } from "@/lib/data";
import { MobileStack, MobileBackHeader } from "@/components/mobile/MobileStack";
import { CmsEntry, NoteData } from "@/lib/cms";
import { Note } from "@/lib/types";

export default function Notes({ isMobile = false }: { isMobile?: boolean }) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cmsNotes, setCmsNotes] = useState<Note[]>([]);
  // Mobile-only navigation: whether the notes list of a folder is open
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false);
  const allNotes = useMemo<Note[]>(() => {
    // Merge static + CMS notes. A CMS note overrides a static note by the
    // composite key `folder + ">" + title`, so a single CMS entry can never
    // wipe out all static notes (the previous all-or-nothing footgun).
    const map = new Map<string, Note>();
    for (const n of notes) map.set(`${n.folder}>${n.title}`, n);
    for (const n of cmsNotes) map.set(`${n.folder}>${n.title}`, n);
    // Preserve static order, then append any CMS-only notes.
    const seen = new Set<string>();
    const merged: Note[] = [];
    for (const n of notes) {
      const key = `${n.folder}>${n.title}`;
      seen.add(key);
      const override = map.get(key);
      merged.push(override || n);
    }
    for (const n of cmsNotes) {
      const key = `${n.folder}>${n.title}`;
      if (!seen.has(key)) merged.push(n);
    }
    return merged;
  }, [cmsNotes]);
  const folders = useMemo(() => Array.from(new Set(allNotes.map((note) => note.folder))), [allNotes]);
  const activeFolder = selectedFolder && folders.includes(selectedFolder) ? selectedFolder : folders[0] || "";

  const folderNotes = useMemo(
    () => allNotes.filter((n) => n.folder === activeFolder),
    [activeFolder, allNotes]
  );

  const selectedNote = allNotes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content?type=notes")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { entries?: CmsEntry<NoteData>[] } | null) => {
        if (cancelled || !payload?.entries?.length) return;
        setCmsNotes(
          payload.entries.map((entry) => ({
            id: entry.id,
            folder: entry.data.folder,
            title: entry.data.title || entry.title,
            content: entry.data.content,
            date: entry.data.date,
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── iOS drill-down (mobile): Folders → Notes list → Note ──
  if (isMobile) {
    const q = search.trim().toLowerCase();
    const visibleNotes = q
      ? folderNotes.filter((n) => (n.title + " " + n.content).toLowerCase().includes(q))
      : folderNotes;
    const page = selectedNote
      ? { key: `note-${selectedNote.id}`, depth: 2 }
      : mobileFolderOpen
      ? { key: `list-${activeFolder}`, depth: 1 }
      : { key: "folders", depth: 0 };

    return (
      <div className="h-full flex flex-col min-h-0 transition-colors duration-300" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
        <MobileStack pageKey={page.key} depth={page.depth}>
          {selectedNote ? (
            <>
              <MobileBackHeader label="Notes" onBack={() => setSelectedNoteId(null)} />
              <div className="flex-1 overflow-auto overscroll-contain">
                <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{selectedNote.title}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{selectedNote.date}</div>
                </div>
                <div className="px-5 py-4 text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                  {selectedNote.content}
                </div>
              </div>
            </>
          ) : mobileFolderOpen ? (
            <>
              <MobileBackHeader label="Folders" onBack={() => { setMobileFolderOpen(false); setSearch(""); }} />
              <div className="px-4 pt-3 pb-1">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{activeFolder}</h2>
              </div>
              <div className="px-4 py-2">
                <div className="flex items-center rounded-lg px-3 py-2 gap-2 transition-colors duration-300" style={{ background: "var(--bg-input)" }}>
                  <Icon name="Search" size={15} style={{ color: "var(--text-tertiary)" }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="bg-transparent outline-none text-[15px] w-full placeholder:text-[var(--text-tertiary)]"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto overscroll-contain">
                {visibleNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className="w-full text-left px-5 py-3.5 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="text-[15px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{note.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{note.date}</div>
                    <div className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>{note.content.slice(0, 60)}...</div>
                  </button>
                ))}
                {visibleNotes.length === 0 && (
                  <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No notes found
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto overscroll-contain">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Folders</h2>
              </div>
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => { setSelectedFolder(folder); setSelectedNoteId(null); setMobileFolderOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <Icon name="Folder" size={22} style={{ color: "rgba(245,158,11,0.95)" }} />
                  <span className="flex-1 text-[16px]" style={{ color: "var(--text-primary)" }}>{folder}</span>
                  <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {allNotes.filter((n) => n.folder === folder).length}
                  </span>
                  <Icon name="ChevronRight" size={18} style={{ color: "var(--text-tertiary)" }} />
                </button>
              ))}
            </div>
          )}
        </MobileStack>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const visibleNotes = q
    ? folderNotes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(q))
    : folderNotes;

  if (!selectedFolder) {
    return (
      <div className="h-full overflow-auto p-5" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
        <h2 className="text-xl font-semibold">My notes</h2>
        <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{folders.length} folders</div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {folders.map((folder) => {
            const count = allNotes.filter((note) => note.folder === folder).length;
            return (
              <button key={folder} onClick={() => { setSelectedFolder(folder); setSelectedNoteId(null); }} className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-sidebar)" }}>
                <Icon name="Folder" size={25} style={{ color: "rgba(245,158,11,0.95)" }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{folder}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: "var(--text-tertiary)" }}>{count} {count === 1 ? "file" : "files"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex h-12 items-center gap-1 border-b px-3" style={{ borderColor: "var(--border-subtle)" }}>
        <button onClick={() => { setSelectedFolder(null); setSelectedNoteId(null); setSearch(""); }} className="rounded-md px-2 py-1 text-sm hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-secondary)" }}>My notes</button>
        <Icon name="ChevronRight" size={15} style={{ color: "var(--text-tertiary)" }} />
        <span className="text-sm font-medium">{selectedFolder}</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col border-r" style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
          <div className="p-2">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "var(--bg-input)" }}>
              <Icon name="Search" size={14} style={{ color: "var(--text-tertiary)" }} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {visibleNotes.map((note) => (
              <button key={note.id} onClick={() => setSelectedNoteId(note.id)} className="flex w-full items-center gap-2 border-b px-3 py-3 text-left" style={{ borderColor: "var(--border-subtle)", background: selectedNoteId === note.id ? "var(--bg-hover)" : "transparent" }}>
                <Icon name="FileText" size={16} style={{ color: "var(--text-tertiary)" }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{note.title}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: "var(--text-tertiary)" }}>{note.date}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 overflow-auto">
          {selectedNote ? (
            <article className="mx-auto max-w-3xl px-7 py-6">
              <h1 className="text-xl font-semibold">{selectedNote.title}</h1>
              <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{selectedNote.date}</div>
              <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selectedNote.content}</div>
            </article>
          ) : (
            <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>Select a file to open</div>
          )}
        </div>
      </div>
    </div>
  );
}
