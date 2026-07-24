"use client";

import { DragEvent, FormEvent, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  AboutData,
  CmsEntry,
  CmsEntryInput,
  CmsEntryType,
  CmsImageMetadata,
  GalleryImageData,
  NetflixTitleData,
  NoteData,
  PortfolioEntryData,
  WifeData,
  browserImageUrl,
  croppedCloudinaryUrl,
  slugify,
  uncroppedCloudinaryUrl,
} from "@/lib/cms";
import { NotionBlock } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { BlockEditor, EditorBlock, fromEditorBlocks, toEditorBlocks } from "./BlockEditor";

type FormData = GalleryImageData | NoteData | PortfolioEntryData | AboutData | WifeData | NetflixTitleData;
type FormState = CmsEntryInput<FormData>;
type UploadTarget =
  | "gallery"
  | "portfolio-banner"
  | "portfolio-icon"
  | "portfolio-finder-icon"
  | "about-photo"
  | "about-finder-icon"
  | "about-desktop-icon"
  | "wife-photo"
  | "wife-finder-icon"
  | "wife-desktop-icon";
type UploadedImage = { url: string; media: CmsImageMetadata };
type SuccessToast = { id: number; message: string };

const tabs: { type: CmsEntryType; label: string; icon: string }[] = [
  { type: "gallery", label: "Gallery", icon: "Image" },
  { type: "notes", label: "Notes", icon: "StickyNote" },
  { type: "portfolio", label: "Portfolio", icon: "BriefcaseBusiness" },
  { type: "about", label: "About Rafif", icon: "UserRound" },
  { type: "wife", label: "Wife", icon: "Heart" },
  { type: "netflix", label: "Netflix", icon: "Play" },
];

const singletonTypes = new Set<CmsEntryType>(["about", "wife"]);

function isSingletonType(type: CmsEntryType) {
  return singletonTypes.has(type);
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
        projectUrl: "",
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

  if (type === "about") {
    return {
      type,
      title: "",
      slug: "about-rafif",
      status: "draft",
      sortOrder: 0,
      data: {
        title: "",
        subtitle: "",
        body: "",
        tags: [],
        photo: "",
        finderIcon: "",
        desktop: {
          label: "About Rafif",
          image: "",
          x: 44,
          y: 8,
          width: 150,
          icon: "UserRound",
          color: "#3b82f6",
        },
      },
    };
  }

  if (type === "wife") {
    return {
      type,
      title: "",
      slug: "wife",
      status: "draft",
      sortOrder: 0,
      data: {
        name: "",
        description: "",
        photo: "",
        finderIcon: "",
        desktop: {
          label: "wife",
          image: "",
          x: 28,
          y: 8,
          width: 140,
          icon: "Heart",
          color: "#ec4899",
        },
      },
    };
  }

  if (type === "netflix") {
    return {
      type,
      title: "",
      slug: "",
      status: "draft",
      sortOrder: 0,
      data: {
        kind: "movie",
        myList: false,
        year: new Date().getFullYear(),
        maturity: "PG-13",
        duration: "",
        match: 95,
        genres: [],
        cast: [],
        description: "",
        poster: "",
        backdrop: "",
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

function cmsInputFromEntry(
  entry: CmsEntry,
  overrides: Partial<CmsEntryInput> = {}
): CmsEntryInput {
  return {
    type: entry.type,
    slug: entry.slug,
    title: entry.title,
    status: entry.status,
    sortOrder: entry.sortOrder,
    data: entry.data,
    ...overrides,
  };
}

async function uploadImageFile(file: File, target: UploadTarget): Promise<UploadedImage> {
  const body = new FormData();
  body.set("file", file);
  body.set("target", target);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as Partial<UploadedImage> & {
    error?: string;
  };
  if (!response.ok || !data.url || !data.media) {
    throw new Error(data.error || `Failed to upload ${file.name}.`);
  }
  return data as UploadedImage;
}

async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  limit: number,
  mapper: (item: TItem, index: number) => Promise<TResult>
) {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyData("gallery"));
  const [message, setMessage] = useState("");
  const [successToast, setSuccessToast] = useState<SuccessToast | null>(null);
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

  function showSuccessToast(message: string) {
    setSuccessToast({ id: Date.now(), message });
  }

  useEffect(() => {
    if (!successToast) return;
    const timeout = window.setTimeout(() => setSuccessToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [successToast]);

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
    return data.entries;
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
    setEditorOpen(true);
    if (type === "portfolio") {
      setBlocks(toEditorBlocks((next.data as PortfolioEntryData).blocks));
      setJsonMode(false);
      setJsonError("");
      setMetaText(metaToText((next.data as PortfolioEntryData).meta));
    }
  }

  function startNewNetflix(kind: NetflixTitleData["kind"]) {
    const next = emptyData("netflix");
    setSelectedId(null);
    setForm({
      ...next,
      data: { ...(next.data as NetflixTitleData), kind },
    });
    setEditorOpen(true);
  }

  function startNewNote(folder: string) {
    const next = emptyData("notes");
    setSelectedId(null);
    setForm({
      ...next,
      data: { ...(next.data as NoteData), folder },
    });
    setEditorOpen(true);
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
    setEditorOpen(true);
    if (entry.type === "portfolio") {
      const data = entry.data as PortfolioEntryData;
      setBlocks(toEditorBlocks(data.blocks || []));
      setJsonMode(false);
      setJsonError("");
      setMetaText(metaToText(data.meta || []));
    }
  }

  async function showModule(type: CmsEntryType) {
    setActiveType(type);
    setSelectedId(null);
    setForm(emptyData(type));
    setEditorOpen(isSingletonType(type));
    if (type === "notes") setNotesFolder(null);

    if (!isSingletonType(type)) return;

    try {
      const moduleEntries = await loadEntries(type);
      const existingEntry = moduleEntries[0];
      if (existingEntry) {
        selectEntry(existingEntry);
      } else {
        startNew(type);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load content.");
    }
  }

  function closeEditor() {
    setSelectedId(null);
    setForm(emptyData(activeType));
    setEditorOpen(false);
  }

  function setCommon<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setData<TData extends FormData>(
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
    setSelectedId(null);
    setEditorOpen(false);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const isNewEntry = !selectedId;
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
      } else if (form.type === "about") {
        payload = {
          ...form,
          data: { ...(form.data as AboutData), title: form.title },
        };
      } else if (form.type === "wife") {
        payload = {
          ...form,
          data: { ...(form.data as WifeData), name: form.title },
        };
      } else if (form.type === "netflix") {
        const netflixData = form.data as NetflixTitleData;
        const currentEntry = selectedId
          ? entries.find((entry) => entry.id === selectedId)
          : undefined;
        const currentKind = currentEntry
          ? (currentEntry.data as NetflixTitleData).kind
          : undefined;
        const movedToAnotherList = currentKind && currentKind !== netflixData.kind;

        if (!selectedId || movedToAnotherList) {
          const lastOrder = entries
            .filter(
              (entry) =>
                entry.type === "netflix" &&
                entry.id !== selectedId &&
                (entry.data as NetflixTitleData).kind === netflixData.kind
            )
            .reduce((highest, entry) => Math.max(highest, entry.sortOrder), -1);
          payload = { ...form, sortOrder: lastOrder + 1 };
        }
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

      selectEntry(data.entry);
      if (data.entry.type === "notes") {
        setNotesFolder((data.entry.data as NoteData).folder);
      }
      await loadEntries(payload.type);
      showSuccessToast(isNewEntry ? "Created successfully." : "Saved successfully.");
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
      closeEditor();
      showSuccessToast("Deleted successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeNotesFolder(folder: string) {
    const folderEntries = entries.filter(
      (entry) => entry.type === "notes" && (entry.data as NoteData).folder === folder
    );
    if (!folderEntries.length) return;

    setBusy(true);
    setMessage("");
    try {
      await jsonFetch("/api/admin/content/batch", {
        method: "POST",
        body: JSON.stringify({
          operation: "delete",
          entries: folderEntries.map((entry) => ({ id: entry.id })),
        }),
      });
      await loadEntries("notes");
      setNotesFolder(null);
      setSelectedId(null);
      setEditorOpen(false);
      showSuccessToast(
        `Folder deleted, ${folderEntries.length} ${folderEntries.length === 1 ? "note" : "notes"} removed.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete folder.");
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
      const data = await uploadImageFile(file, "portfolio-banner");
      setMessage("Image uploaded.");
      return data.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      return "";
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File, target: UploadTarget) {
    setBusy(true);
    setMessage("");

    try {
      const data = await uploadImageFile(file, target);

      if (target === "gallery") {
        setData<GalleryImageData>((current) => ({
          ...current,
          src: data.url,
          media: data.media,
        }));
      } else if (target === "portfolio-banner") {
        setData<PortfolioEntryData>((current) => ({
          ...current,
          banner: data.url,
          bannerMedia: data.media,
        }));
      } else if (target === "portfolio-icon") {
        setData<PortfolioEntryData>((current) => ({
          ...current,
          desktop: { ...current.desktop, media: data.media },
        }));
      } else if (target === "portfolio-finder-icon") {
        setData<PortfolioEntryData>((current) => ({
          ...current,
          finderIcon: data.url,
          finderIconMedia: data.media,
        }));
      } else if (target.startsWith("about-")) {
        const field = target === "about-photo" ? "photo" : target === "about-finder-icon" ? "finderIcon" : "desktop";
        setData<AboutData>((current) => field === "desktop"
          ? { ...current, desktop: { ...current.desktop, image: data.url, media: data.media } }
          : { ...current, [field]: data.url, [`${field}Media`]: data.media });
      } else if (target.startsWith("wife-")) {
        const field = target === "wife-photo" ? "photo" : target === "wife-finder-icon" ? "finderIcon" : "desktop";
        setData<WifeData>((current) => field === "desktop"
          ? { ...current, desktop: { ...current.desktop, image: data.url, media: data.media } }
          : { ...current, [field]: data.url, [`${field}Media`]: data.media });
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
      const uploadStartedAt = Date.now();
      let completed = 0;
      const results = await mapWithConcurrency(files, 3, async (file, index) => {
        try {
          const uploaded = await uploadImageFile(file, "gallery");
          return { ok: true as const, file, index, uploaded };
        } catch (error) {
          return {
            ok: false as const,
            file,
            index,
            error: error instanceof Error ? error.message : "Upload failed.",
          };
        } finally {
          completed += 1;
          setMessage(`Uploading ${completed}/${files.length} photos...`);
        }
      });
      const successful = results.filter((result) => result.ok);
      const failed = results.filter((result) => !result.ok);

      if (successful.length) {
        await jsonFetch("/api/admin/content/batch", {
          method: "POST",
          body: JSON.stringify({
            operation: "create",
            entries: successful.map(({ file, index, uploaded }) => {
              const internalName = `${uploadStartedAt}-${index}-${file.name.replace(/\.[^.]+$/, "") || "photo"}`;
              return {
                type: "gallery",
                title: internalName,
                slug: slugify(internalName),
                status: "published",
                sortOrder: startOrder + index,
                data: { src: uploaded.url, media: uploaded.media },
              };
            }),
          }),
        });
      }
      await loadEntries("gallery");
      if (failed.length) {
        setMessage(
          `${successful.length} added, ${failed.length} failed: ${failed.map(({ file }) => file.name).join(", ")}`
        );
      } else {
        setMessage("");
        showSuccessToast(`${successful.length} photo${successful.length === 1 ? "" : "s"} created successfully.`);
      }
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
      showSuccessToast("Deleted successfully.");
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
      await jsonFetch("/api/admin/content/batch", {
        method: "POST",
        body: JSON.stringify({
          operation: "update",
          entries: reordered.map((entry, index) => ({
            id: entry.id,
            input: cmsInputFromEntry(entry, { sortOrder: index }),
          })),
        }),
      });
      await loadEntries("gallery");
      setMessage("");
      showSuccessToast("Saved successfully.");
    } catch (error) {
      await loadEntries("gallery");
      setMessage(error instanceof Error ? error.message : "Failed to save order.");
    } finally {
      setBusy(false);
    }
  }

  async function reorderNetflix(
    kind: NetflixTitleData["kind"],
    orderedIds: string[]
  ) {
    const kindEntries = filteredEntries.filter(
      (entry) => (entry.data as NetflixTitleData).kind === kind
    );
    if (
      orderedIds.length !== kindEntries.length ||
      new Set(orderedIds).size !== orderedIds.length
    ) {
      return;
    }

    const byId = new Map(kindEntries.map((entry) => [entry.id, entry]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((entry): entry is CmsEntry => Boolean(entry))
      .map((entry, index) => ({ ...entry, sortOrder: index }));
    if (reordered.length !== kindEntries.length) return;

    const optimistic = new Map(reordered.map((entry) => [entry.id, entry]));
    setEntries((current) =>
      current.map((entry) => optimistic.get(entry.id) ?? entry)
    );
    setBusy(true);
    setMessage("Saving Netflix order...");
    try {
      await jsonFetch("/api/admin/content/batch", {
        method: "POST",
        body: JSON.stringify({
          operation: "update",
          entries: reordered.map((entry) => ({
            id: entry.id,
            input: cmsInputFromEntry(entry),
          })),
        }),
      });
      await loadEntries("netflix");
      setMessage("");
      showSuccessToast(`${kind === "movie" ? "Movie" : "TV series"} order saved.`);
    } catch (error) {
      await loadEntries("netflix");
      setMessage(error instanceof Error ? error.message : "Failed to save Netflix order.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleNetflixMyList(entry: CmsEntry) {
    const data = entry.data as NetflixTitleData;
    const nextData = { ...data, myList: !data.myList };
    setEntries((current) =>
      current.map((item) =>
        item.id === entry.id ? { ...item, data: nextData } : item
      )
    );
    setBusy(true);
    setMessage("");
    try {
      await jsonFetch(`/api/admin/content/${entry.id}`, {
        method: "PATCH",
        body: JSON.stringify(cmsInputFromEntry(entry, { data: nextData })),
      });
      await loadEntries("netflix");
      showSuccessToast(nextData.myList ? "Added to My List." : "Removed from My List.");
    } catch (error) {
      await loadEntries("netflix");
      setMessage(error instanceof Error ? error.message : "Failed to update My List.");
    } finally {
      setBusy(false);
    }
  }

  async function updateGalleryEntry(
    entry: CmsEntry,
    data: GalleryImageData,
    status: "draft" | "published" = entry.status
  ) {
    setBusy(true);
    setMessage("");
    setEntries((current) =>
      current.map((item) =>
        item.id === entry.id ? { ...item, data, status } : item
      )
    );
    try {
      await jsonFetch(`/api/admin/content/${entry.id}`, {
        method: "PATCH",
        body: JSON.stringify(cmsInputFromEntry(entry, { data, status })),
      });
      await loadEntries("gallery");
      showSuccessToast("Saved successfully.");
    } catch (error) {
      await loadEntries("gallery");
      setMessage(error instanceof Error ? error.message : "Failed to update photo.");
    } finally {
      setBusy(false);
    }
  }

  async function replaceGalleryLabel(label: string, replacement?: string) {
    const normalizedReplacement = replacement?.trim();
    const affected = filteredEntries.filter((entry) =>
      ((entry.data as GalleryImageData).labels || []).includes(label)
    );
    if (!affected.length) return;

    setBusy(true);
    setMessage(normalizedReplacement ? "Renaming album..." : "Removing album...");
    try {
      await jsonFetch("/api/admin/content/batch", {
        method: "POST",
        body: JSON.stringify({
          operation: "update",
          entries: affected.map((entry) => {
            const data = entry.data as GalleryImageData;
            const labels = Array.from(
              new Set(
                (data.labels || [])
                  .map((item) => (item === label ? normalizedReplacement : item))
                  .filter((item): item is string => Boolean(item))
              )
            );
            return {
              id: entry.id,
              input: cmsInputFromEntry(entry, { data: { ...data, labels } }),
            };
          }),
        }),
      });
      await loadEntries("gallery");
      setMessage("");
      showSuccessToast(normalizedReplacement ? "Saved successfully." : "Deleted successfully.");
    } catch (error) {
      await loadEntries("gallery");
      setMessage(error instanceof Error ? error.message : "Failed to update album.");
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
        {successToast && (
          <div
            key={successToast.id}
            role="status"
            aria-live="polite"
            className="fixed right-5 top-5 z-[110] flex max-w-sm items-center gap-3 rounded-lg border border-emerald-300/25 bg-[#10261f] px-4 py-3 text-sm font-medium text-emerald-50 shadow-2xl"
          >
            <Icon name="CircleCheck" size={18} className="shrink-0 text-emerald-300" />
            <span className="flex-1">{successToast.message}</span>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="rounded p-1 text-emerald-100/60 hover:bg-emerald-100/10 hover:text-emerald-50"
              aria-label="Dismiss notification"
            >
              <Icon name="X" size={15} />
            </button>
          </div>
        )}
        <header className="flex h-14 items-center border-b border-white/10 px-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-300">Portfolio CMS</div>
            <div className="text-lg font-semibold text-white">DeimOS</div>
          </div>
          {message && <span role="status" aria-live="polite" className="ml-auto text-sm text-white/60">{message}</span>}
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-r border-white/10 bg-black/20 p-3">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => showModule(tab.type)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-sky-400"
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
            <div className="min-h-6 flex-1" />
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <Icon name="LogOut" size={16} />
              Logout
            </button>
          </aside>

          <main className="min-h-0 overflow-auto p-5">
            {activeType === "gallery" ? (
              <GalleryManager
                entries={filteredEntries}
                busy={busy}
                upload={uploadGalleryFiles}
                remove={removeGalleryEntry}
                reorder={reorderGallery}
                update={updateGalleryEntry}
                replaceLabel={replaceGalleryLabel}
              />
            ) : activeType === "notes" ? (
              <NotesManager
                entries={filteredEntries}
                folder={notesFolder}
                setFolder={setNotesFolder}
                form={form}
                selectedId={selectedId}
                editorOpen={editorOpen}
                busy={busy}
                selectEntry={selectEntry}
                startNewNote={startNewNote}
                closeEditor={closeEditor}
                save={save}
                deleteFolder={removeNotesFolder}
                remove={() => void removeSelected()}
                setTitle={(title) => {
                  setCommon("title", title);
                  if (!selectedId) setCommon("slug", slugify(title));
                }}
                setStatus={(status) => setCommon("status", status)}
                setData={(updater) => setData<NoteData>(updater)}
              />
            ) : activeType === "netflix" && !editorOpen ? (
              <NetflixManager
                entries={filteredEntries}
                busy={busy}
                onCreate={startNewNetflix}
                onSelect={selectEntry}
                onReorder={reorderNetflix}
                onToggleMyList={toggleNetflixMyList}
              />
            ) : editorOpen ? (
            <form onSubmit={save} className="mx-auto max-w-5xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                {!isSingletonType(activeType) && (
                  <>
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/55 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
                    >
                      <Icon name="ArrowLeft" size={16} />
                      Back to {tabs.find((tab) => tab.type === activeType)?.label}
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                  </>
                )}
                <h1 className="text-lg font-semibold text-white">
                  {isSingletonType(activeType)
                    ? tabs.find((tab) => tab.type === activeType)?.label
                    : selectedId
                      ? form.title || "Untitled entry"
                      : `New ${tabs.find((tab) => tab.type === activeType)?.label ?? "entry"} entry`}
                </h1>
              </div>
              <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-white/50">{form.type === "wife" ? "Name" : "Title"}</span>
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
                {form.type !== "netflix" && (
                  <label>
                    <span className="mb-1 block text-xs font-medium text-white/50">Sort</span>
                    <input type="number" value={form.sortOrder} onChange={(event) => setCommon("sortOrder", Number(event.target.value))} className={inputClass()} />
                  </label>
                )}
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
                  uploadFinderIcon={(file) => uploadImage(file, "portfolio-finder-icon")}
                  uploadInline={uploadInlineImage}
                />
              )}

              {form.type === "about" && (
                <AboutForm
                  data={form.data as AboutData}
                  setData={(updater) => setData<AboutData>(updater)}
                  upload={(file, target) => uploadImage(file, target)}
                />
              )}

              {form.type === "wife" && (
                <WifeForm
                  data={form.data as WifeData}
                  setData={(updater) => setData<WifeData>(updater)}
                  upload={(file, target) => uploadImage(file, target)}
                />
              )}

              {form.type === "netflix" && (
                <NetflixForm
                  data={form.data as NetflixTitleData}
                  setData={(updater) => setData<NetflixTitleData>(updater)}
                  setTitle={(title) => {
                    setCommon("title", title);
                    if (!selectedId) setCommon("slug", slugify(title));
                  }}
                />
              )}

              <div className="sticky bottom-0 flex items-center gap-3 border-t border-white/10 bg-[#090d16]/95 py-4">
                <button disabled={busy} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60">
                  {busy ? "Saving..." : isSingletonType(activeType) ? "Save changes" : "Save Entry"}
                </button>
                {selectedId && !isSingletonType(activeType) && (
                  <button type="button" disabled={busy} onClick={removeSelected} className="rounded-md border border-rose-300/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">
                    Delete
                  </button>
                )}
              </div>
            </form>
            ) : isSingletonType(activeType) ? null : (
              <EntryTable
                type={activeType}
                entries={filteredEntries}
                onCreate={() => startNew(activeType)}
                onSelect={selectEntry}
              />
            )}
          </main>
        </div>
      </div>
    </Shell>
  );
}

function NetflixManager({
  entries,
  busy,
  onCreate,
  onSelect,
  onReorder,
  onToggleMyList,
}: {
  entries: CmsEntry[];
  busy: boolean;
  onCreate: (kind: NetflixTitleData["kind"]) => void;
  onSelect: (entry: CmsEntry) => void;
  onReorder: (kind: NetflixTitleData["kind"], orderedIds: string[]) => Promise<void>;
  onToggleMyList: (entry: CmsEntry) => Promise<void>;
}) {
  const movieEntries = entries.filter(
    (entry) => (entry.data as NetflixTitleData).kind === "movie"
  );
  const seriesEntries = entries.filter(
    (entry) => (entry.data as NetflixTitleData).kind === "series"
  );
  const myListCount = entries.filter(
    (entry) => Boolean((entry.data as NetflixTitleData).myList)
  ).length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Netflix lineup</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/45">
            Drag published titles to choose each Top 10. Everything below the cutoff stays saved as a substitute.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-white/45">
          <span>{movieEntries.length} movies</span>
          <span aria-hidden className="text-white/20">•</span>
          <span>{seriesEntries.length} TV series</span>
          <span aria-hidden className="text-white/20">•</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-300/10 px-2.5 py-1 text-sky-200">
            <Icon name="Bookmark" size={12} />
            {myListCount} in My List
          </span>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <NetflixRankingBoard
          kind="movie"
          entries={movieEntries}
          busy={busy}
          onCreate={onCreate}
          onSelect={onSelect}
          onReorder={onReorder}
          onToggleMyList={onToggleMyList}
        />
        <NetflixRankingBoard
          kind="series"
          entries={seriesEntries}
          busy={busy}
          onCreate={onCreate}
          onSelect={onSelect}
          onReorder={onReorder}
          onToggleMyList={onToggleMyList}
        />
      </div>
    </div>
  );
}

function NetflixRankingBoard({
  kind,
  entries,
  busy,
  onCreate,
  onSelect,
  onReorder,
  onToggleMyList,
}: {
  kind: NetflixTitleData["kind"];
  entries: CmsEntry[];
  busy: boolean;
  onCreate: (kind: NetflixTitleData["kind"]) => void;
  onSelect: (entry: CmsEntry) => void;
  onReorder: (kind: NetflixTitleData["kind"], orderedIds: string[]) => Promise<void>;
  onToggleMyList: (entry: CmsEntry) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const ordered = [...entries].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.updatedAt.localeCompare(right.updatedAt)
  );
  const published = ordered.filter((entry) => entry.status === "published");
  const lineup = published.slice(0, 10);
  const substitutes = published.slice(10);
  const drafts = ordered.filter((entry) => entry.status === "draft");
  const label = kind === "movie" ? "Movies" : "TV Series";
  const singularLabel = kind === "movie" ? "movie" : "TV series";

  function persistGroups(nextPublished: CmsEntry[], nextDrafts = drafts) {
    void onReorder(kind, [...nextPublished, ...nextDrafts].map((entry) => entry.id));
  }

  function moveEntry(entry: CmsEntry, direction: -1 | 1) {
    const group = entry.status === "published" ? published : drafts;
    const index = group.findIndex((item) => item.id === entry.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= group.length) return;
    const reordered = [...group];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    if (entry.status === "published") {
      persistGroups(reordered);
    } else {
      persistGroups(published, reordered);
    }
  }

  function dropEntry(target: CmsEntry) {
    if (!draggingId || draggingId === target.id) return;
    const source = ordered.find((entry) => entry.id === draggingId);
    if (!source || source.status !== target.status) return;
    const group = source.status === "published" ? published : drafts;
    const fromIndex = group.findIndex((entry) => entry.id === source.id);
    const toIndex = group.findIndex((entry) => entry.id === target.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const reordered = [...group];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    if (source.status === "published") {
      persistGroups(reordered);
    } else {
      persistGroups(published, reordered);
    }
  }

  function renderRows(
    groupEntries: CmsEntry[],
    zone: "lineup" | "substitute" | "draft",
    positionOffset = 0
  ) {
    const movementGroup = zone === "draft" ? drafts : published;
    return groupEntries.map((entry, index) => {
      const data = entry.data as NetflixTitleData;
      const movementIndex = movementGroup.findIndex((item) => item.id === entry.id);
      const position = zone === "draft" ? null : positionOffset + index + 1;
      return (
        <tr
          key={entry.id}
          onDragOver={(event) => {
            if (!draggingId) return;
            event.preventDefault();
            setDropTargetId(entry.id);
          }}
          onDrop={(event) => {
            event.preventDefault();
            dropEntry(entry);
            setDraggingId(null);
            setDropTargetId(null);
          }}
          onClick={() => onSelect(entry)}
          className={`group cursor-pointer border-t border-white/[0.07] transition-colors ${
            draggingId === entry.id
              ? "opacity-40"
              : dropTargetId === entry.id
                ? "bg-sky-400/10"
                : "hover:bg-white/[0.045]"
          }`}
        >
          <td className="w-12 px-3 py-2.5 align-middle">
            <div className="flex items-center gap-2">
              <button
                type="button"
                draggable={!busy}
                disabled={busy}
                aria-label={`Drag ${entry.title} to change its position`}
                onClick={(event) => event.stopPropagation()}
                onDragStart={(event) => {
                  setDraggingId(entry.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", entry.id);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropTargetId(null);
                }}
                className="cursor-grab rounded p-1 text-white/30 hover:bg-white/10 hover:text-white/70 active:cursor-grabbing disabled:cursor-default disabled:opacity-30"
              >
                <Icon name="GripVertical" size={15} />
              </button>
              <span className={`w-7 text-right font-mono text-xs font-semibold ${
                zone === "lineup"
                  ? "text-emerald-200"
                  : zone === "substitute"
                    ? "text-amber-200"
                    : "text-white/30"
              }`}>
                {position ? `#${position}` : "D"}
              </span>
            </div>
          </td>
          <td className="min-w-0 px-2 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              {data.poster?.startsWith("/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://image.tmdb.org/t/p/w92${data.poster}`}
                  alt=""
                  draggable={false}
                  className="h-11 w-8 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded bg-white/[0.06] text-white/20">
                  <Icon name="ImageOff" size={13} />
                </div>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">
                  {entry.title || "Untitled"}
                </span>
                <span className="mt-0.5 block text-xs text-white/35">
                  {data.year || "Year unset"} · {data.duration || "Duration unset"}
                </span>
              </span>
            </div>
          </td>
          <td className="whitespace-nowrap px-2 py-2.5">
            <button
              type="button"
              disabled={busy}
              aria-pressed={Boolean(data.myList)}
              onClick={(event) => {
                event.stopPropagation();
                void onToggleMyList(entry);
              }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition ${
                data.myList
                  ? "bg-sky-300/12 text-sky-200 hover:bg-sky-300/20"
                  : "bg-white/[0.06] text-white/35 hover:bg-white/10 hover:text-white/60"
              } disabled:opacity-40`}
            >
              <Icon name={data.myList ? "BookmarkCheck" : "BookmarkPlus"} size={12} />
              My List
            </button>
          </td>
          <td className="w-28 px-3 py-2.5">
            <div className="flex justify-end gap-0.5">
              <button
                type="button"
                disabled={busy || movementIndex === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  moveEntry(entry, -1);
                }}
                aria-label={`Move ${entry.title} up`}
                className="rounded p-1.5 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-20"
              >
                <Icon name="ArrowUp" size={14} />
              </button>
              <button
                type="button"
                disabled={busy || movementIndex === movementGroup.length - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  moveEntry(entry, 1);
                }}
                aria-label={`Move ${entry.title} down`}
                className="rounded p-1.5 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-20"
              >
                <Icon name="ArrowDown" size={14} />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(entry);
                }}
                aria-label={`Edit ${entry.title}`}
                className="rounded p-1.5 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-20"
              >
                <Icon name="Pencil" size={14} />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
          kind === "movie" ? "bg-rose-300/10 text-rose-200" : "bg-violet-300/10 text-violet-200"
        }`}>
          <Icon name={kind === "movie" ? "Clapperboard" : "Tv"} size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{label}</h2>
          <p className="text-xs text-white/35">
            {published.length} published, {drafts.length} draft{drafts.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCreate(kind)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <Icon name="Plus" size={14} />
          Add {singularLabel}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead className="bg-white/[0.025] text-[10px] font-semibold uppercase tracking-wider text-white/30">
            <tr>
              <th className="px-3 py-2.5">Rank</th>
              <th className="px-2 py-2.5">Title</th>
              <th className="px-2 py-2.5">Tag</th>
              <th className="px-3 py-2.5 text-right">Order</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-emerald-300/15 bg-emerald-300/[0.045]">
              <th colSpan={4} className="px-3 py-2 text-left">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-100">
                  <Icon name="MonitorPlay" size={13} />
                  Starting 10
                  <span className="font-normal text-emerald-100/50">
                    {lineup.length}/10 shown
                  </span>
                </span>
              </th>
            </tr>
            {renderRows(lineup, "lineup")}
            {lineup.length < 10 && (
              <tr className="border-t border-dashed border-white/10">
                <td colSpan={4} className="px-4 py-3 text-center text-xs text-white/30">
                  {10 - lineup.length} open slot{10 - lineup.length === 1 ? "" : "s"} in the public Top 10
                </td>
              </tr>
            )}
            <tr className="border-t border-amber-300/15 bg-amber-300/[0.035]">
              <th colSpan={4} className="px-3 py-2 text-left">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-100">
                  <Icon name="UsersRound" size={13} />
                  Substitutes
                  <span className="font-normal text-amber-100/50">
                    {substitutes.length} saved, not shown in Top 10
                  </span>
                </span>
              </th>
            </tr>
            {substitutes.length ? (
              renderRows(substitutes, "substitute", 10)
            ) : (
              <tr className="border-t border-white/[0.07]">
                <td colSpan={4} className="px-4 py-3 text-center text-xs text-white/25">
                  No substitutes yet
                </td>
              </tr>
            )}
            {drafts.length > 0 && (
              <>
                <tr className="border-t border-white/10 bg-white/[0.025]">
                  <th colSpan={4} className="px-3 py-2 text-left">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/55">
                      <Icon name="FilePenLine" size={13} />
                      Drafts
                      <span className="font-normal text-white/30">never shown publicly</span>
                    </span>
                  </th>
                </tr>
                {renderRows(drafts, "draft")}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EntryTable({
  type,
  entries,
  onCreate,
  onSelect,
}: {
  type: Exclude<CmsEntryType, "gallery" | "notes">;
  entries: CmsEntry[];
  onCreate: () => void;
  onSelect: (entry: CmsEntry) => void;
}) {
  const moduleName = tabs.find((tab) => tab.type === type)?.label || "Entries";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{moduleName}</h1>
          <p className="mt-1 text-sm text-white/45">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="ml-auto flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <Icon name="Plus" size={16} />
          New entry
        </button>
      </div>

      {entries.length ? (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.035] text-xs font-medium uppercase tracking-wider text-white/35">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="w-12 px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => onSelect(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(entry);
                      }
                    }}
                    tabIndex={0}
                    className="cursor-pointer bg-white/[0.015] text-white/65 transition hover:bg-white/[0.055] focus-visible:bg-sky-500/10 focus-visible:outline-none"
                  >
                    <td className="max-w-md px-4 py-3.5 font-medium text-white">{entry.title || "Untitled"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${entry.status === "published" ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.07] text-white/50"}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3.5 font-mono text-xs text-white/40">{entry.slug}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-white/40">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(entry.updatedAt))}
                    </td>
                    <td className="px-4 py-3.5 text-white/35"><Icon name="ChevronRight" size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 py-16 text-center">
          <Icon name="FilePlus2" size={24} className="mx-auto text-white/25" />
          <p className="mt-3 text-sm font-medium text-white/65">No {moduleName.toLowerCase()} entries yet</p>
          <p className="mt-1 text-sm text-white/35">Create the first entry to start managing this module.</p>
        </div>
      )}
    </div>
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

function AssetPreview({ src, alt, square = false }: { src: string; alt: string; square?: boolean }) {
  return (
    <div className={`${square ? "h-16 w-16" : "h-24 w-32"} shrink-0 overflow-hidden rounded-lg bg-white/[0.06]`}>
      {src ? <img src={browserImageUrl(src)} alt={alt} className="h-full w-full object-cover" /> : null}
    </div>
  );
}

function AssetField({ label, value, onChange, onFile, square = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFile: (file: File) => void;
  square?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label>
        <span className="mb-1 block text-xs font-medium text-white/50">{label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()} />
      </label>
      <div className="flex items-center gap-3">
        <AssetPreview src={value} alt={`${label} preview`} square={square} />
        <FileInput label={`Upload ${label.toLowerCase()}`} onFile={onFile} />
      </div>
    </div>
  );
}

function DesktopAssetFields<TData extends { desktop: PortfolioEntryData["desktop"] }>({ data, setData, upload }: {
  data: TData;
  setData: (updater: (data: TData) => TData) => void;
  upload: (file: File) => void;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Desktop icon</h2>
        <p className="mt-1 text-xs text-white/40">Separate artwork and placement for the desktop surface.</p>
      </div>
      <AssetField label="Desktop Icon" value={data.desktop.image} onChange={(image) => setData((current) => ({ ...current, desktop: { ...current.desktop, image } }))} onFile={upload} />
      <div className="grid gap-3 md:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Desktop Label</span>
          <input value={data.desktop.label} onChange={(event) => setData((current) => ({ ...current, desktop: { ...current.desktop, label: event.target.value } }))} className={inputClass()} />
        </label>
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
    </section>
  );
}

function AboutForm({ data, setData, upload }: {
  data: AboutData;
  setData: (updater: (data: AboutData) => AboutData) => void;
  upload: (file: File, target: UploadTarget) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">About content</h2>
          <p className="mt-1 text-xs text-white/40">The entry title above is also used as the About title and Finder label.</p>
        </div>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Subtitle</span>
          <input value={data.subtitle} onChange={(event) => setData((current) => ({ ...current, subtitle: event.target.value }))} className={inputClass()} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Body</span>
          <textarea value={data.body} onChange={(event) => setData((current) => ({ ...current, body: event.target.value }))} className={inputClass("min-h-56 leading-relaxed")} />
          <span className="mt-1 block text-xs text-white/35">Separate paragraphs with a blank line.</span>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Tags</span>
          <input value={data.tags.join(", ")} onChange={(event) => setData((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} className={inputClass()} />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <AssetField label="Photo" value={data.photo} onChange={(photo) => setData((current) => ({ ...current, photo }))} onFile={(file) => upload(file, "about-photo")} />
          <AssetField label="Finder Icon (Square)" value={data.finderIcon} onChange={(finderIcon) => setData((current) => ({ ...current, finderIcon }))} onFile={(file) => upload(file, "about-finder-icon")} square />
        </div>
      </section>
      <DesktopAssetFields data={data} setData={setData} upload={(file) => upload(file, "about-desktop-icon")} />
    </div>
  );
}

function WifeForm({ data, setData, upload }: {
  data: WifeData;
  setData: (updater: (data: WifeData) => WifeData) => void;
  upload: (file: File, target: UploadTarget) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Wife content</h2>
          <p className="mt-1 text-xs text-white/40">The entry title above is also used as the name and Finder label.</p>
        </div>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Description</span>
          <textarea value={data.description} onChange={(event) => setData((current) => ({ ...current, description: event.target.value }))} className={inputClass("min-h-40 leading-relaxed")} />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <AssetField label="Photo" value={data.photo} onChange={(photo) => setData((current) => ({ ...current, photo }))} onFile={(file) => upload(file, "wife-photo")} />
          <AssetField label="Finder Icon (Square)" value={data.finderIcon} onChange={(finderIcon) => setData((current) => ({ ...current, finderIcon }))} onFile={(file) => upload(file, "wife-finder-icon")} square />
        </div>
      </section>
      <DesktopAssetFields data={data} setData={setData} upload={(file) => upload(file, "wife-desktop-icon")} />
    </div>
  );
}

interface TmdbSearchResult {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  posterPath: string | null;
}

interface TmdbPrefill {
  kind: "movie" | "series";
  title: string;
  year: number;
  description: string;
  poster: string;
  backdrop: string;
  genres: string[];
  cast: string[];
  duration: string;
}

function TmdbSearchField({ onPick }: { onPick: (prefill: TmdbPrefill) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  const shortQuery = query.trim().length < 2;

  useEffect(() => {
    const q = query.trim();
    if (disabled || q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await jsonFetch<{ results: TmdbSearchResult[] }>(
          `/api/tmdb?action=search&query=${encodeURIComponent(q)}`
        );
        if (cancelled) return;
        setResults(data.results ?? []);
        setError(null);
        setOpen(true);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Search failed.";
        if (message.toLowerCase().includes("not configured")) {
          setDisabled(true);
        } else {
          setError(message);
          setOpen(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, disabled]);

  async function pick(result: TmdbSearchResult) {
    try {
      const data = await jsonFetch<{ prefill: TmdbPrefill }>(
        `/api/tmdb?action=details&mediaType=${result.mediaType}&id=${result.tmdbId}`
      );
      onPick(data.prefill);
      setQuery("");
      setResults([]);
      setOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details.");
      setOpen(true);
    }
  }

  if (disabled) {
    return (
      <label>
        <span className="mb-1 block text-xs font-medium text-white/50">Search TMDB</span>
        <input disabled placeholder="Suggestions disabled" className={inputClass("opacity-60")} />
        <span className="mt-1 block text-xs text-amber-300/80">
          Set TMDB_API_KEY in your environment to enable suggestions — manual entry still works.
        </span>
      </label>
    );
  }

  return (
    <label className="relative block">
      <span className="mb-1 block text-xs font-medium text-white/50">Search TMDB</span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Type a movie or series title…"
        className={inputClass()}
      />
      {loading && !shortQuery && <span className="mt-1 block text-xs text-white/35">Searching…</span>}
      {open && !shortQuery && (results.length > 0 || error) && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-white/10 bg-[#0d1220] shadow-xl">
          {error ? (
            <p className="px-3 py-2 text-xs text-rose-300">{error}</p>
          ) : (
            results.map((result) => (
              <button
                key={`${result.mediaType}-${result.tmdbId}`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  void pick(result);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/10"
              >
                {result.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                    alt=""
                    className="h-14 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] text-white/40">
                    N/A
                  </div>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">{result.title}</span>
                  <span className="text-xs text-white/40">{result.year ?? "—"}</span>
                </span>
                <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
                  {result.mediaType === "tv" ? "Series" : "Movie"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </label>
  );
}

function TmdbPathField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-white/50">{label}</span>
      <div className="flex items-center gap-3">
        {value.startsWith("/") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://image.tmdb.org/t/p/w92${value}`}
            alt=""
            className="h-14 w-10 shrink-0 rounded object-cover"
          />
        )}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/abc123.jpg"
          className={inputClass()}
        />
      </div>
    </label>
  );
}

function NetflixForm({ data, setData, setTitle }: {
  data: NetflixTitleData;
  setData: (updater: (data: NetflixTitleData) => NetflixTitleData) => void;
  setTitle: (title: string) => void;
}) {
  function handlePick(prefill: TmdbPrefill) {
    setTitle(prefill.title);
    setData((current) => {
      const untouchedMaturity =
        current.maturity === "" || current.maturity === "PG-13" || current.maturity === "TV-MA";
      const maturity = untouchedMaturity
        ? prefill.kind === "series"
          ? "TV-MA"
          : "PG-13"
        : current.maturity;
      return {
        ...current,
        kind: prefill.kind,
        year: prefill.year,
        description: prefill.description,
        poster: prefill.poster,
        backdrop: prefill.backdrop,
        genres: prefill.genres,
        cast: prefill.cast,
        duration: prefill.duration,
        maturity,
      };
    });
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Title details</h2>
          <p className="mt-1 text-xs text-white/40">
            Search TMDB to auto-fill, or edit any field manually. Use the Netflix lineup to set the public order.
          </p>
        </div>
        <TmdbSearchField onPick={handlePick} />
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Kind</span>
            <select
              value={data.kind}
              onChange={(event) =>
                setData((current) => ({ ...current, kind: event.target.value === "series" ? "series" : "movie" }))
              }
              className={inputClass()}
            >
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Year</span>
            <input
              type="number"
              value={data.year}
              onChange={(event) => setData((current) => ({ ...current, year: Number(event.target.value) }))}
              className={inputClass()}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Maturity</span>
            <input
              value={data.maturity}
              onChange={(event) => setData((current) => ({ ...current, maturity: event.target.value }))}
              placeholder="PG-13 / TV-MA"
              className={inputClass()}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Duration</span>
            <input
              value={data.duration}
              onChange={(event) => setData((current) => ({ ...current, duration: event.target.value }))}
              placeholder="2h 28m / 5 Seasons"
              className={inputClass()}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-white/50">Match %</span>
            <input
              type="number"
              min={0}
              max={100}
              value={data.match}
              onChange={(event) => setData((current) => ({ ...current, match: Number(event.target.value) }))}
              className={inputClass()}
            />
          </label>
          <label className="flex min-h-[62px] cursor-pointer items-center gap-3 self-end rounded-md border border-white/10 bg-white/[0.035] px-3 py-2.5 transition hover:bg-white/[0.055]">
            <input
              type="checkbox"
              checked={Boolean(data.myList)}
              onChange={(event) =>
                setData((current) => ({ ...current, myList: event.target.checked }))
              }
              className="h-4 w-4 shrink-0 accent-sky-500"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Icon name="Bookmark" size={14} className="text-sky-300" />
                My List
              </span>
              <span className="mt-0.5 block text-xs text-white/40">
                Show this title in the My List row.
              </span>
            </span>
          </label>
        </div>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Genres</span>
          <input
            value={data.genres.join(", ")}
            onChange={(event) =>
              setData((current) => ({
                ...current,
                genres: event.target.value.split(",").map((genre) => genre.trim()).filter(Boolean),
              }))
            }
            placeholder="Sci-Fi, Action, Thriller"
            className={inputClass()}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Cast</span>
          <input
            value={data.cast.join(", ")}
            onChange={(event) =>
              setData((current) => ({
                ...current,
                cast: event.target.value.split(",").map((name) => name.trim()).filter(Boolean),
              }))
            }
            placeholder="Actor One, Actor Two, Actor Three"
            className={inputClass()}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-white/50">Description</span>
          <textarea
            value={data.description}
            onChange={(event) => setData((current) => ({ ...current, description: event.target.value }))}
            className={inputClass("min-h-32 leading-relaxed")}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <TmdbPathField
            label="Poster path"
            value={data.poster}
            onChange={(poster) => setData((current) => ({ ...current, poster }))}
          />
          <TmdbPathField
            label="Backdrop path"
            value={data.backdrop}
            onChange={(backdrop) => setData((current) => ({ ...current, backdrop }))}
          />
        </div>
      </section>
    </div>
  );
}

function CropModal({
  source,
  crop,
  setCrop,
  setCroppedArea,
  imageRef,
  canApply,
  onApply,
  onClose,
}: {
  source: string;
  crop: Crop;
  setCrop: (crop: Crop) => void;
  setCroppedArea: (crop: PixelCrop) => void;
  imageRef: RefObject<HTMLImageElement | null>;
  canApply: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#111722] shadow-2xl">
        <div className="flex items-start gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="crop-dialog-title" className="text-base font-semibold text-white">Adjust portfolio crop</h2>
            <p className="mt-1 text-xs text-white/45">Move and resize the selection. The saved crop is used by the portfolio thumbnail.</p>
          </div>
          <button type="button" autoFocus onClick={onClose} aria-label="Close crop dialog" className="ml-auto rounded-md p-2 text-white/55 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400">
            <Icon name="X" size={17} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/25 p-5">
          <ReactCrop
            crop={crop}
            onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCroppedArea(pixelCrop)}
            minWidth={24}
            minHeight={24}
            ruleOfThirds
          >
            <img
              ref={imageRef}
              src={browserImageUrl(source)}
              alt="Crop portfolio thumbnail"
              className="max-h-[calc(100vh-13rem)] max-w-full object-contain"
              onLoad={(event) => {
                const image = event.currentTarget;
                setCroppedArea({
                  unit: "px",
                  x: image.width * 0.1,
                  y: image.height * 0.1,
                  width: image.width * 0.8,
                  height: image.height * 0.8,
                });
              }}
            />
          </ReactCrop>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-white/65 hover:bg-white/10">Cancel</button>
          <button type="button" disabled={!canApply} onClick={onApply} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40">Apply crop</button>
        </div>
      </div>
    </div>
  );
}

function GalleryManager({
  entries,
  busy,
  upload,
  remove,
  reorder,
  update,
  replaceLabel,
}: {
  entries: CmsEntry[];
  busy: boolean;
  upload: (files: File[]) => void;
  remove: (entry: CmsEntry) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  update: (
    entry: CmsEntry,
    data: GalleryImageData,
    status?: "draft" | "published"
  ) => Promise<void>;
  replaceLabel: (label: string, replacement?: string) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const labels = Array.from(
    new Set(
      entries.flatMap((entry) => (entry.data as GalleryImageData).labels || [])
    )
  ).sort((a, b) => a.localeCompare(b));

  function acceptFiles(files: FileList | null) {
    const images = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (images.length) upload(images);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDropActive(false);
    if (event.dataTransfer.files.length) acceptFiles(event.dataTransfer.files);
  }

  function addLabel(entry: CmsEntry, rawLabel: string) {
    const label = rawLabel.trim();
    if (!label) return;
    const data = entry.data as GalleryImageData;
    const nextLabels = Array.from(new Set([...(data.labels || []), label]));
    update(entry, { ...data, labels: nextLabels });
  }

  function toggleLabel(entry: CmsEntry, label: string) {
    const data = entry.data as GalleryImageData;
    const current = data.labels || [];
    const nextLabels = current.includes(label)
      ? current.filter((item) => item !== label)
      : [...current, label];
    update(entry, { ...data, labels: nextLabels });
  }

  function renameLabel(label: string) {
    const replacement = window.prompt("Rename album", label)?.trim();
    if (!replacement || replacement === label) return;
    replaceLabel(label, replacement);
  }

  function deleteLabel(label: string) {
    if (!window.confirm(`Delete the “${label}” album? Photos will stay in the gallery.`)) return;
    replaceLabel(label);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Gallery photos</h1>
        <p className="mt-1 text-sm text-white/50">Upload, arrange, favorite, and group photos into label-based albums.</p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4" aria-labelledby="albums-heading">
        <div className="flex items-center gap-2">
          <Icon name="Tags" size={17} className="text-white/55" />
          <h2 id="albums-heading" className="text-sm font-medium text-white">Albums</h2>
          <span className="text-xs text-white/35">Labels become albums on the portfolio.</span>
        </div>
        {labels.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {labels.map((label) => {
              const count = entries.filter((entry) =>
                ((entry.data as GalleryImageData).labels || []).includes(label)
              ).length;
              return (
                <div key={label} className="inline-flex items-center overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
                  <span className="px-2.5 py-1.5 text-xs text-white/75">{label} <span className="text-white/35">{count}</span></span>
                  <button type="button" disabled={busy} onClick={() => renameLabel(label)} aria-label={`Rename ${label} album`} className="border-l border-white/10 p-1.5 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-40">
                    <Icon name="Pencil" size={13} />
                  </button>
                  <button type="button" disabled={busy} onClick={() => deleteLabel(label)} aria-label={`Delete ${label} album`} className="border-l border-white/10 p-1.5 text-white/45 hover:bg-rose-400/15 hover:text-rose-200 disabled:opacity-40">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs text-white/35">No albums yet. Open Labels on a photo to create the first one.</p>
        )}
      </section>

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
            const data = entry.data as GalleryImageData;
            const src = data.src;
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
                className={`group relative flex min-h-56 flex-col overflow-visible rounded-lg border bg-white/[0.035] transition ${
                  draggingIndex === index ? "border-sky-400 opacity-40" : "border-white/10"
                }`}
              >
                <div className="relative aspect-square overflow-hidden rounded-t-lg bg-[#171b22]">
                  {src ? (
                    <img src={browserImageUrl(src)} alt={data.title || "Gallery photo"} className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-white/25">
                      <Icon name="ImageOff" size={24} />
                      <span className="text-xs">Image unavailable</span>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => update(entry, { ...data, favorite: !data.favorite })}
                    aria-label={data.favorite ? `Remove photo ${index + 1} from favorites` : `Add photo ${index + 1} to favorites`}
                    aria-pressed={Boolean(data.favorite)}
                    className={`absolute right-2 top-2 rounded-full p-2 shadow-lg transition ${data.favorite ? "bg-white text-rose-500" : "bg-black/55 text-white/80 hover:bg-black/75"}`}
                  >
                    <Icon name="Heart" size={15} className={data.favorite ? "fill-current" : ""} />
                  </button>
                </div>
                <div className="flex min-h-24 flex-1 flex-col gap-2 p-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(data.labels || []).map((label) => (
                      <span key={label} className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] text-white/65">{label}</span>
                    ))}
                    {!data.labels?.length && <span className="text-[10px] text-white/30">No album</span>}
                  </div>
                  <div className="mt-auto flex items-center gap-1">
                    <span className="mr-auto flex items-center gap-1 text-xs text-white/45">
                      <Icon name="Grip" size={13} /> {index + 1}
                    </span>
                    <details className="group/labels relative">
                      <summary className="flex cursor-pointer list-none items-center gap-1 rounded px-2 py-1.5 text-xs text-white/60 hover:bg-white/10">
                        <Icon name="Tags" size={13} /> Labels
                      </summary>
                      <div className="absolute bottom-9 right-0 z-20 w-52 rounded-lg border border-white/15 bg-[#151a23] p-2 shadow-2xl">
                        {labels.length > 0 && (
                          <div className="mb-2 max-h-36 space-y-0.5 overflow-auto">
                            {labels.map((label) => {
                              const checked = (data.labels || []).includes(label);
                              return (
                                <button key={label} type="button" disabled={busy} onClick={() => toggleLabel(entry, label)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 disabled:opacity-40">
                                  <Icon name={checked ? "SquareCheck" : "Square"} size={14} className={checked ? "text-sky-300" : "text-white/30"} />
                                  <span className="truncate">{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <form onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          addLabel(entry, String(formData.get("label") || ""));
                          event.currentTarget.reset();
                        }} className="flex gap-1 border-t border-white/10 pt-2">
                          <input name="label" aria-label="New album label" placeholder="New label" className="min-w-0 flex-1 rounded border border-white/10 bg-white/[0.05] px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-sky-400" />
                          <button disabled={busy} aria-label="Create and assign label" className="rounded bg-sky-500 px-2 text-white hover:bg-sky-400 disabled:opacity-40">
                            <Icon name="Plus" size={13} />
                          </button>
                        </form>
                      </div>
                    </details>
                    <details className="group/details relative">
                      <summary className="flex cursor-pointer list-none items-center gap-1 rounded px-2 py-1.5 text-xs text-white/60 hover:bg-white/10">
                        <Icon name="Pencil" size={13} /> Details
                      </summary>
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          const status = formData.get("status") === "draft" ? "draft" : "published";
                          void update(
                            entry,
                            {
                              ...data,
                              title: String(formData.get("title") || "").trim(),
                              date: String(formData.get("date") || ""),
                            },
                            status
                          );
                          event.currentTarget.closest("details")?.removeAttribute("open");
                        }}
                        className="absolute bottom-9 right-0 z-20 w-64 space-y-2 rounded-lg border border-white/15 bg-[#151a23] p-3 text-left shadow-2xl"
                      >
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">Caption</span>
                          <input name="title" defaultValue={data.title || ""} className={inputClass("text-xs")} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">Date</span>
                          <input name="date" type="date" defaultValue={data.date || ""} className={inputClass("text-xs")} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">Status</span>
                          <select name="status" defaultValue={entry.status} className={inputClass("text-xs")}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </label>
                        <button disabled={busy} className="w-full rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-400 disabled:opacity-40">
                          Save details
                        </button>
                      </form>
                    </details>
                    <button type="button" disabled={busy || index === 0} onClick={() => reorder(index, index - 1)} aria-label={`Move photo ${index + 1} earlier`} className="rounded p-1.5 text-white/55 hover:bg-white/10 disabled:opacity-25">
                      <Icon name="ArrowLeft" size={14} />
                    </button>
                    <button type="button" disabled={busy || index === entries.length - 1} onClick={() => reorder(index, index + 1)} aria-label={`Move photo ${index + 1} later`} className="rounded p-1.5 text-white/55 hover:bg-white/10 disabled:opacity-25">
                      <Icon name="ArrowRight" size={14} />
                    </button>
                    <button type="button" disabled={busy} onClick={() => remove(entry)} aria-label={`Delete photo ${index + 1}`} className="rounded p-1.5 text-white/45 hover:bg-rose-400/15 hover:text-rose-200 disabled:opacity-30">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
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
  editorOpen,
  busy,
  selectEntry,
  startNewNote,
  closeEditor,
  save,
  deleteFolder,
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
  editorOpen: boolean;
  busy: boolean;
  selectEntry: (entry: CmsEntry) => void;
  startNewNote: (folder: string) => void;
  closeEditor: () => void;
  save: (event: FormEvent) => void;
  deleteFolder: (folder: string) => Promise<void>;
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

  function removeFolder() {
    if (!folder) return;
    const count = folderEntries.length;
    const confirmed = window.confirm(
      `Delete “${folder}” and its ${count} ${count === 1 ? "note" : "notes"}? This cannot be undone.`
    );
    if (confirmed) void deleteFolder(folder);
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
                <button key={name} type="button" onClick={() => setFolder(name)} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left hover:border-sky-400/40 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-sky-400">
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

  if (!editorOpen) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <button type="button" onClick={() => setFolder(null)} className="rounded px-2 py-1 text-white/55 hover:bg-white/10 hover:text-white">Notes</button>
          <Icon name="ChevronRight" size={14} className="text-white/30" />
          <span className="font-medium text-white">{folder}</span>
          <button type="button" onClick={() => startNewNote(folder)} className="ml-auto flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            <Icon name="FilePlus2" size={15} /> New note
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={removeFolder}
            className="flex items-center gap-2 rounded-md border border-rose-300/20 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-400/10 disabled:opacity-40"
          >
            <Icon name="Trash2" size={15} /> Delete folder
          </button>
        </div>

        {folderEntries.length ? (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-white/[0.035] text-xs font-medium uppercase tracking-wider text-white/35">
                  <tr>
                    <th className="px-4 py-3">File name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="w-12 px-4 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {folderEntries.map((entry) => {
                    const data = entry.data as NoteData;
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => selectEntry(entry)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectEntry(entry);
                          }
                        }}
                        tabIndex={0}
                        className="cursor-pointer bg-white/[0.015] text-white/60 transition hover:bg-white/[0.055] focus-visible:bg-sky-500/10 focus-visible:outline-none"
                      >
                        <td className="px-4 py-3.5 font-medium text-white">{entry.title || "Untitled"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${entry.status === "published" ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.07] text-white/50"}`}>{entry.status}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-white/45">{data.date}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-white/40">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(entry.updatedAt))}</td>
                        <td className="px-4 py-3.5 text-white/35"><Icon name="ChevronRight" size={16} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 py-16 text-center text-sm text-white/40">This folder is empty. Create the first note.</div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button type="button" onClick={closeEditor} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/55 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400">
          <Icon name="ArrowLeft" size={16} /> Back to {folder}
        </button>
        <div className="h-4 w-px bg-white/10" />
        <h1 className="text-lg font-semibold text-white">{selectedId ? form.title || "Untitled note" : "New note"}</h1>
      </div>

      <div className="min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
        <form onSubmit={save} className="flex min-w-0 flex-col">
          <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,220px)_160px_150px]">
            <label>
              <span className="mb-1 block text-xs font-medium text-white/45">File name</span>
              <input value={form.type === "notes" ? form.title : ""} onChange={(event) => setTitle(event.target.value)} className={inputClass()} required />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-white/45">Folder</span>
              <input
                value={noteData.folder}
                onChange={(event) =>
                  setData((current) => ({ ...current, folder: event.target.value }))
                }
                className={inputClass()}
                required
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-white/45">Date</span>
              <input
                type="date"
                value={noteData.date}
                onChange={(event) =>
                  setData((current) => ({ ...current, date: event.target.value }))
                }
                className={inputClass()}
                required
              />
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
            <textarea value={noteData.content} onChange={(event) => setData((current) => ({ ...current, title: form.title, content: event.target.value }))} placeholder="Write your note..." className={inputClass("h-full min-h-96 resize-none font-mono leading-relaxed")} />
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
  uploadFinderIcon,
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
  uploadFinderIcon: (file: File) => Promise<string>;
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
    const cropMetadata = {
      x: croppedArea.x * scaleX,
      y: croppedArea.y * scaleY,
      width: croppedArea.width * scaleX,
      height: croppedArea.height * scaleY,
    };
    const url = croppedCloudinaryUrl(cropSource, cropMetadata);
    setData((current) => ({
      ...current,
      desktop: {
        ...current.desktop,
        image: url,
        media: current.desktop.media
          ? { ...current.desktop.media, crop: cropMetadata }
          : undefined,
      },
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
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-white/50">Meta, one per line: Label: Value</span>
            <textarea value={metaText} onChange={(event) => setMetaText(event.target.value)} className={inputClass("min-h-32 font-mono")} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-white/50">Project URL</span>
            <input
              type="url"
              value={data.projectUrl || ""}
              onChange={(event) =>
                setData((current) => ({ ...current, projectUrl: event.target.value }))
              }
              placeholder="https://live-app.example or https://figma.com/design/..."
              className={inputClass()}
            />
            <span className="mt-1 block text-xs text-white/35">
              Optional. Paste the live app or Figma prototype URL, including https://.
            </span>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label>
              <span className="mb-1 block text-xs font-medium text-white/50">Finder App Icon (Square)</span>
              <input value={data.finderIcon || ""} onChange={(event) => setData((current) => ({ ...current, finderIcon: event.target.value }))} className={inputClass()} />
            </label>
            <div className="flex items-center gap-3">
              <AssetPreview src={data.finderIcon || ""} alt="Portfolio Finder icon preview" square />
              <FileInput label="Upload square icon" onFile={uploadFinderIcon} />
            </div>
            <p className="text-xs text-white/35">Used only in Finder. The desktop artwork below remains separate.</p>
          </div>
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
              <button type="button" onClick={() => { setCropSource(uncroppedCloudinaryUrl(data.desktop.image)); setCrop({ unit: "%", x: 10, y: 10, width: 80, height: 80 }); setCroppedArea(null); }} className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/65 hover:bg-white/10">
                Adjust crop
              </button>
            )}
          </div>

          {cropSource && (
            <CropModal
              source={cropSource}
              crop={crop}
              setCrop={setCrop}
              setCroppedArea={setCroppedArea}
              imageRef={cropImageRef}
              canApply={Boolean(croppedArea)}
              onApply={applyIconCrop}
              onClose={() => setCropSource("")}
            />
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
