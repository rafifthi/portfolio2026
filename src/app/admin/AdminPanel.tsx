"use client";

import { DragEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  CmsEntry,
  CmsEntryInput,
  CmsEntryType,
  GalleryImageData,
  NoteData,
  PortfolioEntryData,
  browserImageUrl,
  croppedCloudinaryUrl,
  slugify,
} from "@/lib/cms";
import { NotionBlock } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { BlockEditor, EditorBlock, fromEditorBlocks, toEditorBlocks } from "./BlockEditor";

type FormState = CmsEntryInput<GalleryImageData | NoteData | PortfolioEntryData>;

const tabs: { type: CmsEntryType; label: string; icon: string }[] = [
  { type: "gallery", label: "Gallery", icon: "Image" },
  { type: "notes", label: "Notes", icon: "StickyNote" },
  { type: "portfolio", label: "Portfolio", icon: "BriefcaseBusiness" },
];

function emptyData(type: CmsEntryType): FormState {
  if (type === "notes") {
    return {
      type,
      title: "",
      slug: "",
      status: "draft",
      sortOrder: 0,
      data: {
        folder: "Career",
        title: "",
        content: "",
        date: new Date().toISOString().slice(0, 10),
      },
    };
  }

  if (type === "portfolio") {
    return {
      type,
      title: "",
      slug: "",
      status: "draft",
      sortOrder: 0,
      data: {
        title: "",
        banner: "",
        meta: [
          { label: "Role", value: "" },
          { label: "Status", value: "" },
        ],
        blocks: [{ type: "paragraph", text: "" }],
        desktop: {
          label: "",
          image: "",
          x: 12,
          y: 18,
          width: 170,
          icon: "BriefcaseBusiness",
          color: "#3b82f6",
        },
      },
    };
  }

  return {
    type,
    title: "",
    slug: "",
    status: "draft",
    sortOrder: 0,
    data: {
      src: "",
    },
  };
}

function inputClass(extra = "") {
  return `w-full rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 ${extra}`;
}

function metaToText(meta: PortfolioEntryData["meta"]) {
  return meta.map((item) => `${item.label}: ${item.value}`).join("\n");
}

function textToMeta(value: string) {
  return value
    .split("\n")
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), value: rest.join(":").trim() };
    })
    .filter((item) => item.label);
}

async function jsonFetch<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export default function AdminPanel() {
  const [booting, setBooting] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [usernameRequired, setUsernameRequired] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeType, setActiveType] = useState<CmsEntryType>("gallery");
  const [notesFolder, setNotesFolder] = useState<string | null>(null);
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyData("gallery"));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditorBlocks((emptyData("portfolio").data as PortfolioEntryData).blocks));
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [metaText, setMetaText] = useState(metaToText((emptyData("portfolio").data as PortfolioEntryData).meta));

  const filteredEntries = useMemo(
    () => entries.filter((entry) => entry.type === activeType),
    [activeType, entries]
  );

  async function checkAuth() {
    const data = await jsonFetch<{ authenticated: boolean; configured: boolean; usernameRequired: boolean }>("/api/admin/auth");
    setAuthenticated(data.authenticated);
    setConfigured(data.configured);
    setUsernameRequired(data.usernameRequired);
  }

  async function loadEntries(type = activeType) {
    const data = await jsonFetch<{ entries: CmsEntry[] }>(`/api/admin/content?type=${type}`);
    setEntries((current) => {
      const others = current.filter((entry) => entry.type !== type);
      return [...others, ...data.entries];
    });
  }

  useEffect(() => {
    // Auth state is owned by the server cookie; this effect syncs it on first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth()
      .catch((error) => setMessage(error instanceof Error ? error.message : "Failed to check auth."))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries(activeType).catch((error) =>
      setMessage(error instanceof Error ? error.message : "Failed to load content.")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, authenticated]);

  function startNew(type = activeType) {
    const next = emptyData(type);
    setSelectedId(null);
    setForm(next);
    if (type === "portfolio") {
      setBlocks(toEditorBlocks((next.data as PortfolioEntryData).blocks));
      setJsonMode(false);
      setJsonError("");
      setMetaText(metaToText((next.data as PortfolioEntryData).meta));
    }
  }

  function startNewNote(folder: string) {
    const next = emptyData("notes");
    setSelectedId(null);
    setForm({
      ...next,
      data: { ...(next.data as NoteData), folder },
    });
  }

  function selectEntry(entry: CmsEntry) {
    const next: FormState = {
      type: entry.type,
      title: entry.title,
      slug: entry.slug,
      status: entry.status,
      sortOrder: entry.sortOrder,
      data: entry.data as FormState["data"],
    };
    setSelectedId(entry.id);
    setActiveType(entry.type);
    setForm(next);
    if (entry.type === "portfolio") {
      const data = entry.data as PortfolioEntryData;
      setBlocks(toEditorBlocks(data.blocks || []));
      setJsonMode(false);
      setJsonError("");
      setMetaText(metaToText(data.meta || []));
    }
  }

  function setCommon<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setData<TData extends GalleryImageData | NoteData | PortfolioEntryData>(
    updater: (data: TData) => TData
  ) {
    setForm((current) => ({ ...current, data: updater(current.data as TData) }));
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      await jsonFetch("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUsername("");
      setPassword("");
      setAuthenticated(true);
      await loadEntries(activeType);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setEntries([]);
    startNew(activeType);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      let payload = form;
      if (form.type === "portfolio") {
        let payloadBlocks: NotionBlock[];
        if (jsonMode) {
          try {
            payloadBlocks = JSON.parse(jsonDraft) as NotionBlock[];
          } catch {
            throw new Error("Portfolio blocks must be valid JSON.");
          }
          if (!Array.isArray(payloadBlocks)) {
            throw new Error("Portfolio blocks JSON must be an array.");
          }
        } else {
          payloadBlocks = fromEditorBlocks(blocks);
        }

        payload = {
          ...form,
          data: {
            ...(form.data as PortfolioEntryData),
            title: form.title,
            meta: textToMeta(metaText),
            blocks: payloadBlocks,
          },
        };
      } else if (form.type === "notes") {
        payload = {
          ...form,
          data: {
            ...(form.data as NoteData),
            title: form.title,
          },
        };
      }

      if (!payload.slug.trim()) {
        payload = { ...payload, slug: slugify(payload.title) };
      }

      const url = selectedId ? `/api/admin/content/${selectedId}` : "/api/admin/content";
      const method = selectedId ? "PATCH" : "POST";
      const data = await jsonFetch<{ entry: CmsEntry }>(url, {
        method,
        body: JSON.stringify(payload),
      });

      setSelectedId(data.entry.id);
      await loadEntries(payload.type);
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSelected() {
    if (!selectedId) return;
    const ok = window.confirm("Delete this entry?");
    if (!ok) return;

    setBusy(true);
    setMessage("");
    try {
      await jsonFetch(`/api/admin/content/${selectedId}`, { method: "DELETE" });
      await loadEntries(activeType);
      startNew(activeType);
      setMessage("Deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  function switchBlocksMode(toJson: boolean) {
    if (toJson) {
      setJsonDraft(JSON.stringify(fromEditorBlocks(blocks), null, 2));
      setJsonError("");
      setJsonMode(true);
      return;
    }
    try {
      const parsed = JSON.parse(jsonDraft) as NotionBlock[];
      if (!Array.isArray(parsed)) throw new Error("not an array");
      setBlocks(toEditorBlocks(parsed));
      setJsonError("");
      setJsonMode(false);
    } catch {
      setJsonError("Invalid JSON — fix it (must be an array of blocks) before switching back.");
    }
  }

  async function uploadInlineImage(file: File): Promise<string> {
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("target", "portfolio-banner");
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upload failed.");
      }
      setMessage("Image uploaded.");
      return data.url || "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      return "";
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File, target: "gallery" | "portfolio-banner" | "portfolio-icon") {
    setBusy(true);
    setMessage("");

    try {
      const body = new FormData();
      body.set("file", file);
      body.set("target", target);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upload failed.");
      }

      if (target === "gallery") {
        setData<GalleryImageData>((current) => ({ ...current, src: data.url || "" }));
      } else if (target === "portfolio-banner") {
        setData<PortfolioEntryData>((current) => ({
          ...current,
          banner: data.url || "",
        }));
      }
      setMessage(target === "portfolio-icon" ? "Icon uploaded. Adjust the crop, then apply it." : "Image uploaded.");
      return data.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      return "";
    } finally {
      setBusy(false);
    }
  }

  async function uploadGalleryFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setMessage(`Uploading ${files.length} photo${files.length === 1 ? "" : "s"}...`);

    try {
      const startOrder = filteredEntries.length;
      for (const [index, file] of files.entries()) {
        const body = new FormData();
        body.set("file", file);
        body.set("target", "gallery");
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const uploaded = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !uploaded.url) throw new Error(uploaded.error || `Failed to upload ${file.name}.`);

        const internalName = `${Date.now()}-${index}-${file.name.replace(/\.[^.]+$/, "") || "photo"}`;
        await jsonFetch("/api/admin/content", {
          method: "POST",
          body: JSON.stringify({
            type: "gallery",
            title: internalName,
            slug: slugify(internalName),
            status: "published",
            sortOrder: startOrder + index,
            data: { src: uploaded.url },
          }),
        });
      }
      await loadEntries("gallery");
      setMessage(`${files.length} photo${files.length === 1 ? "" : "s"} added.`);
    } catch (error) {
      await loadEntries("gallery");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeGalleryEntry(entry: CmsEntry) {
    if (!window.confirm("Delete this photo?")) return;
    setBusy(true);
    setMessage("");
    try {
      await jsonFetch(`/api/admin/content/${entry.id}`, { method: "DELETE" });
      await loadEntries("gallery");
      setMessage("Photo deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function reorderGallery(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= filteredEntries.length) return;
    const reordered = [...filteredEntries];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setEntries((current) => [
      ...current.filter((entry) => entry.type !== "gallery"),
      ...reordered.map((entry, index) => ({ ...entry, sortOrder: index })),
    ]);
    setBusy(true);
    setMessage("Saving order...");
    try {
      await Promise.all(
        reordered.map((entry, index) =>
          jsonFetch(`/api/admin/content/${entry.id}`, {
            method: "PATCH",
            body: JSON.stringify({ ...entry, sortOrder: index }),
          })
        )
      );
      await loadEntries("gallery");
      setMessage("Order saved.");
    } catch (error) {
      await loadEntries("gallery");
      setMessage(error instanceof Error ? error.message : "Failed to save order.");
    } finally {
      setBusy(false);
    }
  }

  if (booting) {
    return <Shell><div className="text-sm text-white/60">Loading admin...</div></Shell>;
  }

  if (!configured) {
    return (
      <Shell>
        <div className="max-w-md rounded-lg border border-amber-300/25 bg-amber-300/10 p-5 text-sm text-amber-100">
          Set <code className="rounded bg-black/30 px-1">ADMIN_PASSWORD</code> in your env vars before using the admin panel.
        </div>
      </Shell>
    );
  }

  if (!authenticated) {
    return (
      <Shell>
        <form onSubmit={login} className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">Portfolio CMS</div>
            <h1 className="mt-1 text-2xl font-semibold text-white">Admin Login</h1>
          </div>
          {usernameRequired && (
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ADMIN_USERNAME"
              className={inputClass("mb-3")}
              autoFocus
            />
          )}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ADMIN_PASSWORD"
            className={inputClass()}
            autoFocus={!usernameRequired}
          />
          {message && <div className="mt-3 text-sm text-rose-300">{message}</div>}
          <button
            disabled={busy}
            className="mt-4 w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
          >
            {busy ? "Checking..." : "Enter Admin"}
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex h-full w-full flex-col">
        <header className="flex h-14 items-center border-b border-white/10 px-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">Portfolio CMS</div>
            <div className="text-lg font-semibold text-white">Neon + Cloudinary Admin</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {message && <span className="text-sm text-white/60">{message}</span>}
            <button onClick={logout} className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10">
              Logout
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-r border-white/10 bg-black/20 p-3">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => {
                    setActiveType(tab.type);
                    if (tab.type === "notes") setNotesFolder(null);
                    startNew(tab.type);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition"
                  style={{
                    background: activeType === tab.type ? "rgba(14,165,233,0.22)" : "transparent",
                    color: activeType === tab.type ? "#e0f2fe" : "rgba(255,255,255,0.65)",
                  }}
                >
                  <Icon name={tab.icon} size={16} />
                  {tab.label}
                  <span className="ml-auto text-xs text-white/35">
                    {entries.filter((entry) => entry.type === tab.type).length}
                  </span>
                </button>
              ))}
            </div>

            {activeType === "portfolio" && (
              <button
                onClick={() => startNew(activeType)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                <Icon name="Plus" size={16} />
                New Entry
              </button>
            )}

            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto">
              {activeType === "portfolio" && filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => selectEntry(entry)}
                  className="w-full rounded-md border border-white/10 p-3 text-left transition hover:bg-white/[0.06]"
                  style={{ background: selectedId === entry.id ? "rgba(255,255,255,0.08)" : "transparent" }}
                >
                  <div className="truncate text-sm font-medium text-white">{entry.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/45">
                    <span>{entry.status}</span>
                    <span>{entry.slug}</span>
                  </div>
                </button>
              ))}
              {activeType === "portfolio" && filteredEntries.length === 0 && (
                <div className="rounded-md border border-dashed border-white/10 p-4 text-center text-sm text-white/35">
                  No entries yet.
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-auto p-5">
            {activeType === "gallery" ? (
              <GalleryManager
                entries={filteredEntries}
                busy={busy}
                upload={uploadGalleryFiles}
                remove={removeGalleryEntry}
                reorder={reorderGallery}
              />
            ) : activeType === "notes" ? (
              <NotesManager
                entries={filteredEntries}
                folder={notesFolder}
                setFolder={setNotesFolder}
                form={form}
                selectedId={selectedId}
                busy={busy}
                selectEntry={selectEntry}
                startNewNote={startNewNote}
                save={save}
                remove={() => {
                  void removeSelected().then(() => startNewNote(notesFolder || ""));
                }}
                setTitle={(title) => {
                  setCommon("title", title);
                  if (!selectedId) setCommon("slug", slugify(title));
                }}
                setStatus={(status) => setCommon("status", status)}
                setData={(updater) => setData<NoteData>(updater)}
              />
            ) : (
            <form onSubmit={save} className="mx-auto max-w-5xl space-y-5">
              <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-white/50">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setCommon("title", title);
                      if (!selectedId) setCommon("slug", slugify(title));
                    }}
                    className={inputClass()}
                    required
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-white/50">Slug</span>
                  <input value={form.slug} onChange={(event) => setCommon("slug", slugify(event.target.value))} className={inputClass()} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-white/50">Sort</span>
                  <input type="number" value={form.sortOrder} onChange={(event) => setCommon("sortOrder", Number(event.target.value))} className={inputClass()} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-white/50">Status</span>
                  <select value={form.status} onChange={(event) => setCommon("status", event.target.value === "published" ? "published" : "draft")} className={inputClass()}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </section>

              {form.type === "portfolio" && (
                <PortfolioForm
                  data={form.data as PortfolioEntryData}
                  setData={(updater) => setData<PortfolioEntryData>(updater)}
                  blocks={blocks}
                  setBlocks={setBlocks}
                  jsonMode={jsonMode}
                  jsonDraft={jsonDraft}
                  setJsonDraft={setJsonDraft}
                  jsonError={jsonError}
                  switchBlocksMode={switchBlocksMode}
                  metaText={metaText}
                  setMetaText={setMetaText}
                  uploadBanner={(file) => uploadImage(file, "portfolio-banner")}
                  uploadIcon={(file) => uploadImage(file, "portfolio-icon")}
                  uploadInline={uploadInlineImage}
                />
              )}

              <div className="sticky bottom-0 flex items-center gap-3 border-t border-white/10 bg-[#090d16]/95 py-4">
                <button disabled={busy} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60">
                  {busy ? "Saving..." : "Save Entry"}
                </button>
                {selectedId && (
                  <button type="button" disabled={busy} onClick={removeSelected} className="rounded-md border border-rose-300/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">
                    Delete
                  </button>
                )}
              </div>
            </form>
            )}
          </main>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-[#090d16] text-white">
      <div className="flex h-full items-center justify-center">{children}</div>
    </div>
  );
}

function FileInput({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
      <Icon name="Upload" size={15} />
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function GalleryManager({
  entries,
  busy,
  upload,
  remove,
  reorder,
}: {
  entries: CmsEntry[];
  busy: boolean;
  upload: (files: File[]) => void;
  remove: (entry: CmsEntry) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);

  function acceptFiles(files: FileList | null) {
    const images = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (images.length) upload(images);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDropActive(false);
    if (event.dataTransfer.files.length) acceptFiles(event.dataTransfer.files);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Gallery photos</h1>
        <p className="mt-1 text-sm text-white/50">Drop photos to upload. Drag thumbnails to arrange their order.</p>
      </div>

      <section
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes("Files")) setDropActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDropActive(false);
        }}
        onDrop={handleDrop}
        className={`relative rounded-xl border border-dashed p-6 text-center transition-colors ${
          dropActive ? "border-sky-400 bg-sky-400/10" : "border-white/15 bg-white/[0.025]"
        }`}
      >
        <Icon name="Images" size={28} className="mx-auto text-sky-300" />
        <div className="mt-3 text-sm font-medium text-white">Drag and drop photos here</div>
        <div className="mt-1 text-xs text-white/40">You can upload multiple images at once</div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 focus-within:ring-2 focus-within:ring-sky-300">
          <Icon name="Upload" size={15} />
          {busy ? "Working..." : "Choose photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              acceptFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </section>

      {entries.length ? (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Gallery photo order">
          {entries.map((entry, index) => {
            const src = (entry.data as GalleryImageData).src;
            return (
              <article
                key={entry.id}
                draggable={!busy}
                onDragStart={(event) => {
                  setDraggingIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", entry.id);
                }}
                onDragEnd={() => setDraggingIndex(null)}
                onDragOver={(event) => {
                  if (draggingIndex !== null) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!event.dataTransfer.files.length && draggingIndex !== null) {
                    event.preventDefault();
                    reorder(draggingIndex, index);
                    setDraggingIndex(null);
                  }
                }}
                className={`group relative aspect-square overflow-hidden rounded-lg border bg-white/[0.04] transition ${
                  draggingIndex === index ? "border-sky-400 opacity-40" : "border-white/10"
                }`}
              >
                {src && <img src={browserImageUrl(src)} alt="" className="h-full w-full object-cover" draggable={false} />}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/65 p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <span className="mr-auto flex items-center gap-1 text-xs text-white/80">
                    <Icon name="Grip" size={14} /> {index + 1}
                  </span>
                  <button type="button" disabled={busy || index === 0} onClick={() => reorder(index, index - 1)} aria-label={`Move photo ${index + 1} earlier`} className="rounded p-1.5 text-white/80 hover:bg-white/15 disabled:opacity-30">
                    <Icon name="ArrowLeft" size={14} />
                  </button>
                  <button type="button" disabled={busy || index === entries.length - 1} onClick={() => reorder(index, index + 1)} aria-label={`Move photo ${index + 1} later`} className="rounded p-1.5 text-white/80 hover:bg-white/15 disabled:opacity-30">
                    <Icon name="ArrowRight" size={14} />
                  </button>
                  <button type="button" disabled={busy} onClick={() => remove(entry)} aria-label={`Delete photo ${index + 1}`} className="rounded p-1.5 text-rose-200 hover:bg-rose-400/20 disabled:opacity-30">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="py-10 text-center text-sm text-white/40">No photos yet. Drop your first images above.</div>
      )}
    </div>
  );
}

function NotesManager({
  entries,
  folder,
  setFolder,
  form,
  selectedId,
  busy,
  selectEntry,
  startNewNote,
  save,
  remove,
  setTitle,
  setStatus,
  setData,
}: {
  entries: CmsEntry[];
  folder: string | null;
  setFolder: (folder: string | null) => void;
  form: FormState;
  selectedId: string | null;
  busy: boolean;
  selectEntry: (entry: CmsEntry) => void;
  startNewNote: (folder: string) => void;
  save: (event: FormEvent) => void;
  remove: () => void;
  setTitle: (title: string) => void;
  setStatus: (status: "draft" | "published") => void;
  setData: (updater: (data: NoteData) => NoteData) => void;
}) {
  const folders = Array.from(
    new Set(entries.map((entry) => (entry.data as NoteData).folder).filter(Boolean))
  );
  const folderEntries = folder
    ? entries.filter((entry) => (entry.data as NoteData).folder === folder)
    : [];
  const noteData = form.data as NoteData;

  function createFolder() {
    const value = window.prompt("Folder name")?.trim();
    if (!value) return;
    if (value.includes("/") || value.includes("\\")) {
      window.alert("Folder names cannot contain slashes. Nested folders are not supported yet.");
      return;
    }
    setFolder(value);
    startNewNote(value);
  }

  if (!folder) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Notes</h1>
            <p className="mt-1 text-sm text-white/50">Choose a folder before opening or creating a note.</p>
          </div>
          <button type="button" onClick={createFolder} className="ml-auto flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400">
            <Icon name="FolderPlus" size={16} /> New folder
          </button>
        </div>
        {folders.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map((name) => {
              const count = entries.filter((entry) => (entry.data as NoteData).folder === name).length;
              return (
                <button key={name} type="button" onClick={() => { setFolder(name); startNewNote(name); }} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left hover:border-sky-400/40 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-sky-400">
                  <Icon name="Folder" size={24} className="text-amber-300" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{name}</span>
                    <span className="mt-0.5 block text-xs text-white/40">{count} {count === 1 ? "note" : "notes"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 py-14 text-center text-sm text-white/40">No folders yet.</div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button type="button" onClick={() => setFolder(null)} className="rounded px-2 py-1 text-white/55 hover:bg-white/10 hover:text-white">Notes</button>
        <Icon name="ChevronRight" size={14} className="text-white/30" />
        <span className="font-medium text-white">{folder}</span>
        <button type="button" onClick={() => startNewNote(folder)} className="ml-auto flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
          <Icon name="FilePlus2" size={15} /> New note
        </button>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-b border-white/10 p-3 md:border-b-0 md:border-r">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/35">Files</div>
          <div className="space-y-1">
            {folderEntries.map((entry) => (
              <button key={entry.id} type="button" onClick={() => selectEntry(entry)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm ${selectedId === entry.id ? "bg-sky-500/20 text-sky-100" : "text-white/65 hover:bg-white/[0.06]"}`}>
                <Icon name="FileText" size={16} />
                <span className="truncate">{entry.title}</span>
              </button>
            ))}
            {!folderEntries.length && <div className="px-2 py-6 text-center text-xs text-white/35">This folder is empty.</div>}
          </div>
        </div>

        <form onSubmit={save} className="flex min-w-0 flex-col">
          <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_150px]">
            <label>
              <span className="mb-1 block text-xs font-medium text-white/45">File name</span>
              <input value={form.type === "notes" ? form.title : ""} onChange={(event) => setTitle(event.target.value)} className={inputClass()} required />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-white/45">Status</span>
              <select value={form.status} onChange={(event) => setStatus(event.target.value === "published" ? "published" : "draft")} className={inputClass()}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <div className="flex-1 p-4">
            <textarea value={noteData.content} onChange={(event) => setData((current) => ({ ...current, folder, title: form.title, content: event.target.value }))} placeholder="Write your note..." className={inputClass("h-full min-h-96 resize-none font-mono leading-relaxed")} />
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 p-4">
            <button disabled={busy} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60">{busy ? "Saving..." : "Save note"}</button>
            {selectedId && <button type="button" disabled={busy} onClick={remove} className="rounded-md border border-rose-300/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">Delete</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

function PortfolioForm({
  data,
  setData,
  blocks,
  setBlocks,
  jsonMode,
  jsonDraft,
  setJsonDraft,
  jsonError,
  switchBlocksMode,
  metaText,
  setMetaText,
  uploadBanner,
  uploadIcon,
  uploadInline,
}: {
  data: PortfolioEntryData;
  setData: (updater: (data: PortfolioEntryData) => PortfolioEntryData) => void;
  blocks: EditorBlock[];
  setBlocks: (blocks: EditorBlock[]) => void;
  jsonMode: boolean;
  jsonDraft: string;
  setJsonDraft: (value: string) => void;
  jsonError: string;
  switchBlocksMode: (toJson: boolean) => void;
  metaText: string;
  setMetaText: (value: string) => void;
  uploadBanner: (file: File) => void;
  uploadIcon: (file: File) => Promise<string>;
  uploadInline: (file: File) => Promise<string>;
}) {
  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 10, y: 10, width: 80, height: 80 });
  const [croppedArea, setCroppedArea] = useState<PixelCrop | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  async function beginIconCrop(file: File) {
    const url = await uploadIcon(file);
    if (!url) return;
    setCropSource(url);
    setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 80 });
    setCroppedArea(null);
  }

  function applyIconCrop() {
    const image = cropImageRef.current;
    if (!cropSource || !croppedArea || !image) return;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const url = croppedCloudinaryUrl(cropSource, {
      x: croppedArea.x * scaleX,
      y: croppedArea.y * scaleY,
      width: croppedArea.width * scaleX,
      height: croppedArea.height * scaleY,
    });
    setData((current) => ({
      ...current,
      desktop: { ...current.desktop, image: url },
    }));
    setCropSource("");
  }

  return (
    <section className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Banner URL</span>
            <input value={data.banner} onChange={(event) => setData((current) => ({ ...current, banner: event.target.value }))} className={inputClass()} />
          </label>
          <FileInput label="Upload Banner" onFile={uploadBanner} />
        </div>
        <div className="h-32 overflow-hidden rounded-lg bg-white/[0.06]">
          {data.banner ? <img src={data.banner} alt={data.title} className="h-full w-full object-cover" /> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Meta, one per line: Label: Value</span>
          <textarea value={metaText} onChange={(event) => setMetaText(event.target.value)} className={inputClass("min-h-32 font-mono")} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-white/50">Desktop Label</span>
            <input value={data.desktop.label} onChange={(event) => setData((current) => ({ ...current, desktop: { ...current.desktop, label: event.target.value } }))} className={inputClass()} />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-white/50">Desktop Image</span>
            <input value={data.desktop.image} onChange={(event) => setData((current) => ({ ...current, desktop: { ...current.desktop, image: event.target.value } }))} className={inputClass()} />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
              {data.desktop.image && <img src={browserImageUrl(data.desktop.image)} alt="Portfolio desktop icon preview" className="h-full w-full object-cover" />}
            </div>
            <FileInput label="Upload icon image" onFile={beginIconCrop} />
            {data.desktop.image && (
              <button type="button" onClick={() => { setCropSource(data.desktop.image); setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 80 }); setCroppedArea(null); }} className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/65 hover:bg-white/10">
                Adjust crop
              </button>
            )}
          </div>

          {cropSource && (
            <div className="md:col-span-2 space-y-4 border-t border-white/10 pt-4">
              <div>
                <div className="text-sm font-medium text-white">Crop icon</div>
                <div className="mt-1 text-xs text-white/45">Drag inside the selection to move it. Drag any corner or edge to resize freely.</div>
              </div>
              <div className="flex min-h-80 items-center justify-center overflow-auto rounded-lg bg-black/30 p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCroppedArea(pixelCrop)}
                  minWidth={24}
                  minHeight={24}
                  ruleOfThirds
                >
                  <img ref={cropImageRef} src={cropSource} alt="Crop portfolio icon" className="max-h-[520px] max-w-full object-contain" />
                </ReactCrop>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={!croppedArea} onClick={applyIconCrop} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50">Apply crop</button>
                <button type="button" onClick={() => setCropSource("")} className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/65 hover:bg-white/10">Cancel</button>
              </div>
            </div>
          )}
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Width</span>
            <input type="number" value={data.desktop.width} onChange={(event) => setData((current) => ({ ...current, desktop: { ...current.desktop, width: Number(event.target.value) } }))} className={inputClass()} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">X %</span>
            <input type="number" value={data.desktop.x} onChange={(event) => setData((current) => ({ ...current, desktop: { ...current.desktop, x: Number(event.target.value) } }))} className={inputClass()} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Y %</span>
            <input type="number" value={data.desktop.y} onChange={(event) => setData((current) => ({ ...current, desktop: { ...current.desktop, y: Number(event.target.value) } }))} className={inputClass()} />
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-white/50">Content</span>
          <button
            type="button"
            onClick={() => switchBlocksMode(!jsonMode)}
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/10"
          >
            <Icon name={jsonMode ? "LayoutList" : "Braces"} size={12} />
            {jsonMode ? "Rich editor" : "Edit as JSON"}
          </button>
        </div>
        {jsonMode ? (
          <>
            <textarea value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} className={inputClass("min-h-96 font-mono text-xs leading-relaxed")} spellCheck={false} />
            {jsonError && <div className="mt-2 text-xs text-rose-300">{jsonError}</div>}
          </>
        ) : (
          <BlockEditor value={blocks} onChange={setBlocks} uploadImage={uploadInline} />
        )}
      </div>
    </section>
  );
}
