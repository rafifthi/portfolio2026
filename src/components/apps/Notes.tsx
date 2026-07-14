"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { notes } from "@/lib/data";
import { MobileStack, MobileBackHeader } from "@/components/mobile/MobileStack";
import { CmsEntry, NoteData } from "@/lib/cms";
import { Note } from "@/lib/types";

function entriesToNotes(entries: CmsEntry<NoteData>[]): Note[] {
  return entries.map((entry) => ({
    id: entry.id,
    folder: entry.data.folder,
    title: entry.data.title || entry.title,
    content: entry.data.content,
    date: entry.data.date,
  }));
}

export default function Notes({
  isMobile = false,
  initialNoteEntries = [],
}: {
  isMobile?: boolean;
  initialNoteEntries?: CmsEntry<NoteData>[];
}) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cmsNotes, setCmsNotes] = useState<Note[]>(() => entriesToNotes(initialNoteEntries));
  const [folderSidebarOpen, setFolderSidebarOpen] = useState(true);
  // Mobile-only navigation: whether the notes list of a folder is open
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false);
  const allNotes = useMemo<Note[]>(() => {
    // Published CMS entries are authoritative when available. This prevents
    // draft or deleted notes from being reintroduced by the static fallback.
    return cmsNotes.length > 0 ? cmsNotes : notes;
  }, [cmsNotes]);
  const folders = useMemo(() => Array.from(new Set(allNotes.map((note) => note.folder))), [allNotes]);
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of allNotes) counts.set(note.folder, (counts.get(note.folder) || 0) + 1);
    return counts;
  }, [allNotes]);
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
        setCmsNotes(entriesToNotes(payload.entries));
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

  const scopeNotes = selectedFolder
    ? allNotes.filter((note) => note.folder === selectedFolder)
    : allNotes;
  const q = search.trim().toLowerCase();
  const visibleNotes = q
    ? scopeNotes.filter((note) => `${note.title} ${note.content} ${note.folder}`.toLowerCase().includes(q))
    : scopeNotes;
  const desktopNote = visibleNotes.find((note) => note.id === selectedNoteId) || visibleNotes[0];
  const scopeLabel = selectedFolder || "All Notes";

  const selectScope = (folder: string | null) => {
    setSelectedFolder(folder);
    setSelectedNoteId(null);
    setSearch("");
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      {folderSidebarOpen && (
        <aside
          className="flex w-[210px] shrink-0 flex-col border-r"
          style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}
          aria-label="Note folders"
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b px-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex min-w-0 items-center gap-2">
              <Icon name="StickyNote" size={16} style={{ color: "rgba(245,158,11,0.95)" }} />
              <span className="truncate text-sm font-semibold">Notes</span>
            </div>
            <button
              type="button"
              onClick={() => setFolderSidebarOpen(false)}
              className="flex size-8 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Collapse folder sidebar"
              title="Hide folders"
            >
              <Icon name="PanelLeftClose" size={16} />
            </button>
          </div>

          <nav className="flex-1 overflow-auto p-2">
            <button
              type="button"
              onClick={() => selectScope(null)}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
              style={{
                background: selectedFolder === null ? "var(--accent)" : "transparent",
                color: selectedFolder === null ? "white" : "var(--text-primary)",
              }}
              aria-current={selectedFolder === null ? "page" : undefined}
            >
              <Icon name="Files" size={17} />
              <span className="min-w-0 flex-1 truncate font-medium">All Notes</span>
              <span className="text-xs opacity-75">{allNotes.length}</span>
            </button>

            <div className="mb-1 mt-5 px-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
              Folders
            </div>
            <div className="space-y-0.5">
              {folders.map((folder) => {
                const isActive = selectedFolder === folder;
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => selectScope(folder)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
                    style={{
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "white" : "var(--text-primary)",
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon name="Folder" size={17} style={{ color: isActive ? "white" : "rgba(245,158,11,0.95)" }} />
                    <span className="min-w-0 flex-1 truncate">{folder}</span>
                    <span className="text-xs opacity-75">{folderCounts.get(folder) || 0}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>
      )}

      <section
        className="flex w-[280px] shrink-0 flex-col border-r"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}
        aria-label={`${scopeLabel} list`}
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3" style={{ borderColor: "var(--border-subtle)" }}>
          {!folderSidebarOpen && (
            <button
              type="button"
              onClick={() => setFolderSidebarOpen(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Expand folder sidebar"
              title="Show folders"
            >
              <Icon name="PanelLeftOpen" size={16} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{scopeLabel}</div>
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {scopeNotes.length} {scopeNotes.length === 1 ? "note" : "notes"}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-2.5">
          <label className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: "var(--bg-input)" }}>
            <Icon name="Search" size={14} style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
              style={{ color: "var(--text-primary)" }}
            />
          </label>
        </div>

        <div className="flex-1 overflow-auto px-2 pb-2">
          <div className="space-y-1">
            {visibleNotes.map((note) => {
              const isActive = desktopNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                  style={{ background: isActive ? "var(--bg-hover)" : "transparent" }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="block truncate text-sm font-semibold">{note.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <span className="shrink-0">{note.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{note.content.replace(/\s+/g, " ").slice(0, 54) || "Empty note"}</span>
                  </span>
                  {!selectedFolder && (
                    <span className="mt-1.5 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      <Icon name="Folder" size={11} />
                      <span className="truncate">{note.folder}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {visibleNotes.length === 0 && (
            <div className="px-3 py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              No notes found
            </div>
          )}
        </div>
      </section>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{desktopNote?.title || "Note"}</div>
          </div>
          {desktopNote && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="Folder" size={13} />
              <span className="max-w-32 truncate">{desktopNote.folder}</span>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {desktopNote ? (
            <article className="mx-auto max-w-3xl px-8 py-7">
              <h1 className="text-2xl font-semibold tracking-tight">{desktopNote.title}</h1>
              <div className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{desktopNote.date}</div>
              <div className="mt-7 whitespace-pre-wrap text-[15px] leading-7" style={{ color: "var(--text-secondary)" }}>{desktopNote.content}</div>
            </article>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="StickyNote" size={28} />
              <span>No note to display</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
