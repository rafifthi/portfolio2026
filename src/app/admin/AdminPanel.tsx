"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  CmsEntry,
  CmsEntryInput,
  CmsEntryType,
  GalleryImageData,
  NoteData,
  PortfolioEntryData,
  slugify,
} from "@/lib/cms";
import { NotionBlock } from "@/lib/types";
import { Icon } from "@/components/Icon";

type FormState = CmsEntryInput<GalleryImageData | NoteData | PortfolioEntryData>;

const tabs: { type: CmsEntryType; label: string; icon: string }[] = [
  { type: "gallery", label: "Gallery", icon: "Image" },
  { type: "notes", label: "Notes", icon: "StickyNote" },
  { type: "portfolio", label: "Portfolio", icon: "BriefcaseBusiness" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

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
        date: today(),
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
      title: "",
      src: "",
      date: today(),
      alt: "",
      caption: "",
      tags: [],
      featured: false,
    },
  };
}

function inputClass(extra = "") {
  return `w-full rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400 ${extra}`;
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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
  const [entries, setEntries] = useState<CmsEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyData("gallery"));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocksText, setBlocksText] = useState(JSON.stringify((emptyData("portfolio").data as PortfolioEntryData).blocks, null, 2));
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
      setBlocksText(JSON.stringify((next.data as PortfolioEntryData).blocks, null, 2));
      setMetaText(metaToText((next.data as PortfolioEntryData).meta));
    }
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
      setBlocksText(JSON.stringify(data.blocks || [], null, 2));
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
        let blocks: NotionBlock[];
        try {
          blocks = JSON.parse(blocksText) as NotionBlock[];
        } catch {
          throw new Error("Portfolio blocks must be valid JSON.");
        }

        payload = {
          ...form,
          data: {
            ...(form.data as PortfolioEntryData),
            title: form.title,
            meta: textToMeta(metaText),
            blocks,
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
      } else {
        setData<PortfolioEntryData>((current) => ({
          ...current,
          banner: target === "portfolio-banner" ? data.url || "" : current.banner,
          desktop: {
            ...current.desktop,
            image: target === "portfolio-icon" ? data.url || "" : current.desktop.image || data.url || "",
          },
        }));
      }
      setMessage("Image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
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

            <button
              onClick={() => startNew(activeType)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <Icon name="Plus" size={16} />
              New Entry
            </button>

            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto">
              {filteredEntries.map((entry) => (
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
              {filteredEntries.length === 0 && (
                <div className="rounded-md border border-dashed border-white/10 p-4 text-center text-sm text-white/35">
                  No entries yet.
                </div>
              )}
            </div>
          </aside>

          <main className="min-h-0 overflow-auto p-5">
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

              {form.type === "gallery" && (
                <GalleryForm
                  data={form.data as GalleryImageData}
                  setData={(updater) => setData<GalleryImageData>(updater)}
                  upload={(file) => uploadImage(file, "gallery")}
                />
              )}

              {form.type === "notes" && (
                <NotesForm
                  data={form.data as NoteData}
                  setData={(updater) => setData<NoteData>(updater)}
                />
              )}

              {form.type === "portfolio" && (
                <PortfolioForm
                  data={form.data as PortfolioEntryData}
                  setData={(updater) => setData<PortfolioEntryData>(updater)}
                  blocksText={blocksText}
                  setBlocksText={setBlocksText}
                  metaText={metaText}
                  setMetaText={setMetaText}
                  uploadBanner={(file) => uploadImage(file, "portfolio-banner")}
                  uploadIcon={(file) => uploadImage(file, "portfolio-icon")}
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

function GalleryForm({
  data,
  setData,
  upload,
}: {
  data: GalleryImageData;
  setData: (updater: (data: GalleryImageData) => GalleryImageData) => void;
  upload: (file: File) => void;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <div className="aspect-square overflow-hidden rounded-lg bg-white/[0.06]">
          {data.src ? <img src={data.src} alt={data.alt || data.title} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="mt-3">
          <FileInput label="Upload Image" onFile={upload} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-white/50">Image URL</span>
          <input value={data.src} onChange={(event) => setData((current) => ({ ...current, src: event.target.value }))} className={inputClass()} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Date</span>
          <input type="date" value={data.date} onChange={(event) => setData((current) => ({ ...current, date: event.target.value }))} className={inputClass()} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Tags</span>
          <input value={(data.tags || []).join(", ")} onChange={(event) => setData((current) => ({ ...current, tags: parseTags(event.target.value) }))} className={inputClass()} />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-white/50">Alt Text</span>
          <input value={data.alt || ""} onChange={(event) => setData((current) => ({ ...current, alt: event.target.value }))} className={inputClass()} />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-white/50">Caption</span>
          <textarea value={data.caption || ""} onChange={(event) => setData((current) => ({ ...current, caption: event.target.value }))} className={inputClass("min-h-24")} />
        </label>
      </div>
    </section>
  );
}

function NotesForm({
  data,
  setData,
}: {
  data: NoteData;
  setData: (updater: (data: NoteData) => NoteData) => void;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-3">
      <label>
        <span className="mb-1 block text-xs font-medium text-white/50">Folder</span>
        <input value={data.folder} onChange={(event) => setData((current) => ({ ...current, folder: event.target.value }))} className={inputClass()} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-medium text-white/50">Date</span>
        <input value={data.date} onChange={(event) => setData((current) => ({ ...current, date: event.target.value }))} className={inputClass()} />
      </label>
      <label className="md:col-span-3">
        <span className="mb-1 block text-xs font-medium text-white/50">Content</span>
        <textarea value={data.content} onChange={(event) => setData((current) => ({ ...current, content: event.target.value }))} className={inputClass("min-h-96 font-mono leading-relaxed")} />
      </label>
    </section>
  );
}

function PortfolioForm({
  data,
  setData,
  blocksText,
  setBlocksText,
  metaText,
  setMetaText,
  uploadBanner,
  uploadIcon,
}: {
  data: PortfolioEntryData;
  setData: (updater: (data: PortfolioEntryData) => PortfolioEntryData) => void;
  blocksText: string;
  setBlocksText: (value: string) => void;
  metaText: string;
  setMetaText: (value: string) => void;
  uploadBanner: (file: File) => void;
  uploadIcon: (file: File) => void;
}) {
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
          <FileInput label="Upload Icon" onFile={uploadIcon} />
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

      <label>
        <span className="mb-1 block text-xs font-medium text-white/50">Content Blocks JSON</span>
        <textarea value={blocksText} onChange={(event) => setBlocksText(event.target.value)} className={inputClass("min-h-96 font-mono text-xs leading-relaxed")} />
      </label>
    </section>
  );
}
