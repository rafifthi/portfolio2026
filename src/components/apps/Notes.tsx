"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/Icon";
import { notes } from "@/lib/data";

const folders = ["Career", "Education", "Goals", "Quotes", "Random"];

export default function Notes() {
  const [selectedFolder, setSelectedFolder] = useState("Career");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const folderNotes = useMemo(
    () => notes.filter((n) => n.folder === selectedFolder),
    [selectedFolder]
  );

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div
      className="h-full flex transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Folders Sidebar */}
      <div
        className="w-44 flex flex-col py-3 px-2 gap-0.5 border-r transition-colors duration-300"
        style={{ background: "rgba(245,200,100,0.12)", borderColor: "var(--border-subtle)" }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider px-2 mb-2" style={{ color: "var(--text-tertiary)" }}>Folders</div>
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => {
              setSelectedFolder(folder);
              setSelectedNoteId(null);
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left"
            style={{
              background: selectedFolder === folder ? "rgba(245,158,11,0.85)" : "transparent",
              color: selectedFolder === folder ? "#fff" : "var(--text-secondary)",
            }}
          >
            <Icon name="Folder" size={16} />
            <span>{folder}</span>
            <span className="ml-auto text-xs" style={{ color: selectedFolder === folder ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>
              {notes.filter((n) => n.folder === folder).length}
            </span>
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div
        className="w-56 flex flex-col border-r transition-colors duration-300"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}
      >
        <div className="p-2">
          <div className="flex items-center rounded-md px-2 py-1.5 gap-2 transition-colors duration-300" style={{ background: "var(--bg-input)" }}>
            <Icon name="Search" size={14} style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-tertiary)]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {folderNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className="w-full text-left px-4 py-3 border-b transition-colors"
              style={{
                background: selectedNoteId === note.id ? "var(--bg-hover)" : "transparent",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{note.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{note.date}</div>
              <div className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>{note.content.slice(0, 60)}...</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg-app)" }}>
        {selectedNote ? (
          <>
            <div className="px-6 py-4 border-b transition-colors duration-300" style={{ borderColor: "var(--border-subtle)" }}>
              <input
                type="text"
                value={selectedNote.title}
                readOnly
                className="bg-transparent outline-none text-lg font-semibold w-full"
                style={{ color: "var(--text-primary)" }}
              />
              <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{selectedNote.date}</div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              <textarea
                value={selectedNote.content}
                readOnly
                className="w-full h-full bg-transparent outline-none text-sm leading-relaxed resize-none"
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Select a note to view
          </div>
        )}
      </div>
    </div>
  );
}
