"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { DesktopLayoutItemDescriptor } from "@/lib/desktop-items";
import {
  LAYOUT_BREAKPOINTS,
  LAYOUT_BREAKPOINT_DEFS,
  LAYOUT_ROW_WIDTH_MAX,
  LAYOUT_ROW_WIDTH_MIN,
  layoutSignature,
  normalizeLayoutOverlay,
  type DesktopItemLayout,
  type DesktopLayoutMap,
  type LayoutBreakpoint,
} from "@/lib/desktop-layout";

/**
 * CMS **Desktop Layout** editor (`/admin` → Desktop Layout).
 *
 * One row per desktop item (`readme`, `wife`, `cv`, `about` + every portfolio
 * entry), each with `x` / `y` (percent of the desktop area) and an optional
 * `width` (px) *per breakpoint*. Saving PUTs the whole map to
 * `/api/admin/layout`, which persists it in the singleton `layout` CMS entry —
 * the primary source `HomeClient` reads, so a save changes the homepage.
 *
 * Rows for items that currently render nothing (`about` before a desktop image
 * is uploaded, a draft entry) are still editable and saved.
 */

interface LayoutResponse {
  items: DesktopLayoutItemDescriptor[];
  layout: DesktopLayoutMap;
  entryId: string | null;
  entryUpdatedAt: string | null;
  created?: boolean;
  changed?: boolean;
  error?: string;
}

interface DesktopLayoutPanelProps {
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

type Field = "x" | "y" | "width";

function formatBreakpointRange(breakpoint: LayoutBreakpoint) {
  const def = LAYOUT_BREAKPOINT_DEFS[breakpoint];
  if (def.maxWidth === null) return `≥ ${def.minWidth}px`;
  if (def.minWidth === 0) return `< ${def.maxWidth + 1}px`;
  return `${def.minWidth}–${def.maxWidth}px`;
}

/** `x`/`y` are percentages; `width` is an optional px box size. */
function fieldBounds(field: Field) {
  return field === "width"
    ? { min: LAYOUT_ROW_WIDTH_MIN, max: LAYOUT_ROW_WIDTH_MAX, step: 1 }
    : { min: 0, max: 100, step: 0.5 };
}

export default function DesktopLayoutPanel({ onSaved, onError }: DesktopLayoutPanelProps) {
  const [items, setItems] = useState<DesktopLayoutItemDescriptor[]>([]);
  const [draft, setDraft] = useState<DesktopLayoutMap>({});
  const [saved, setSaved] = useState<DesktopLayoutMap>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const dirty = useMemo(() => layoutSignature(draft) !== layoutSignature(saved), [draft, saved]);

  const apply = useCallback((payload: LayoutResponse) => {
    const layout = normalizeLayoutOverlay(payload.layout);
    setItems(payload.items ?? []);
    setDraft(layout);
    setSaved(layout);
    setUpdatedAt(payload.entryUpdatedAt ?? null);
  }, []);

  const load = useCallback(
    async (query = "") => {
      setBusy(true);
      try {
        const response = await fetch(`/api/admin/layout${query}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as LayoutResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load the desktop layout.");
        }
        apply(payload);
        return payload;
      } finally {
        setBusy(false);
      }
    },
    [apply]
  );

  useEffect(() => {
    // Initial load, and the coverage/backfill pass the API performs on GET.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
      .catch((error) => onError(error instanceof Error ? error.message : "Failed to load the desktop layout."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function editField(itemId: string, breakpoint: LayoutBreakpoint, field: Field, value: number | undefined) {
    setDraft((current) => {
      const config = { ...(current[itemId] ?? {}) };
      const row: DesktopItemLayout = { ...(config[breakpoint] ?? { x: 0, y: 0 }) };
      if (value === undefined) {
        delete row[field];
      } else {
        row[field] = value;
      }
      config[breakpoint] = row;
      return { ...current, [itemId]: config };
    });
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: draft }),
      });
      const payload = (await response.json().catch(() => ({}))) as LayoutResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save the desktop layout.");
      }
      apply(payload);
      onSaved(`Desktop layout saved — ${(payload.items ?? items).length} item rows.`);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save the desktop layout.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(id: string | "all") {
    setBusy(true);
    try {
      const payload = await load(`?reset=${encodeURIComponent(id)}`);
      onSaved(id === "all" ? "Desktop layout reset to the generated defaults." : `Row “${id}” reset to its generated default.`);
      return payload;
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to reset the desktop layout.");
    } finally {
      setBusy(false);
    }
  }

  const visibleItems = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle)
    );
  }, [filter, items]);

  const portfolioCount = items.filter((item) => item.kind === "portfolio").length;
  const unrenderedCount = items.filter((item) => !item.rendered).length;

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-white/60">
        <Icon name="Loader" size={16} className="animate-spin" />
        Loading desktop layout…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start gap-4 border-b border-white/10 pb-4">
        <div className="min-w-[16rem] flex-1">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Icon name="LayoutGrid" size={18} /> Desktop Layout
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/55">
            Posisi ikon desktop per breakpoint, tersimpan di CMS (<code>cms_entries</code> type{" "}
            <code>layout</code>). <strong>x/y</strong> = persen dari area desktop,{" "}
            <strong>width</strong> = lebar ikon dalam px (kosongkan untuk auto). Baris kosong berarti
            posisi itu jatuh ke default (config kurasi lalu grid otomatis). Perubahan langsung dipakai
            homepage setelah disimpan.
          </p>
          <p className="mt-1 text-xs text-white/40">
            {items.length} item ({portfolioCount} portfolio{unrenderedCount > 0 ? `, ${unrenderedCount} belum dirender` : ""})
            {updatedAt ? ` · terakhir disimpan ${new Date(updatedAt).toLocaleString()}` : " · belum pernah disimpan"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void reset("all")}
            className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40"
          >
            Reset all
          </button>
          <button
            type="button"
            disabled={busy || !dirty}
            onClick={() => void save()}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Working…" : dirty ? "Save layout" : "Saved"}
          </button>
        </div>
      </header>

      <div className="flex items-center gap-3">
        <label className="relative flex-1 max-w-sm">
          <span className="sr-only">Filter items</span>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by name or id…"
            className="w-full rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          />
        </label>
        {filter && (
          <span className="text-xs text-white/45">
            {visibleItems.length} / {items.length} rows
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visibleItems.map((item) => (
          <section
            key={item.id}
            aria-label={`Position of ${item.label}`}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{item.label}</span>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/60">{item.id}</code>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-white/45">{item.kind}</span>
              {!item.rendered && (
                <span className="rounded bg-amber-300/10 px-1.5 py-0.5 text-[11px] text-amber-200/80">
                  belum dirender
                </span>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void reset(item.id)}
                className="ml-auto rounded-md border border-white/10 px-2 py-1 text-xs text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Reset row
              </button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {LAYOUT_BREAKPOINTS.map((breakpoint) => {
                const row = draft[item.id]?.[breakpoint];
                return (
                  <fieldset key={breakpoint} className="rounded-lg border border-white/10 p-2">
                    <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200/80">
                      {breakpoint}
                      <span className="ml-1 font-normal normal-case tracking-normal text-white/35">
                        {formatBreakpointRange(breakpoint)}
                      </span>
                    </legend>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["x", "y", "width"] as Field[]).map((field) => (
                        <label key={field} className="block">
                          <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-white/40">
                            {field === "width" ? "w" : field}
                          </span>
                          <NumberCell
                            value={row?.[field]}
                            bounds={fieldBounds(field)}
                            title={`${item.label} · ${breakpoint} · ${field}`}
                            onCommit={(value) => editField(item.id, breakpoint, field, value)}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </section>
        ))}

        {visibleItems.length === 0 && (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-white/55">
            Tidak ada item yang cocok dengan filter.
          </p>
        )}
      </div>
    </div>
  );
}

function NumberCell({
  value,
  bounds,
  title,
  onCommit,
}: {
  value: number | undefined;
  bounds: { min: number; max: number; step: number };
  title: string;
  onCommit: (value: number | undefined) => void;
}) {
  // Kept as text while editing so intermediate states ("1.", "0.") survive; the
  // numeric draft only receives values that are already valid.
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(value === undefined ? "" : String(value));
  }, [focused, value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={bounds.min}
      max={bounds.max}
      step={bounds.step}
      value={text}
      title={title}
      aria-label={title}
      placeholder="auto"
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setText(value === undefined ? "" : String(value));
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        if (raw.trim() === "") {
          onCommit(undefined);
          return;
        }
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
      className="w-full rounded border border-white/10 bg-white/[0.06] px-1.5 py-1 text-xs text-white outline-none focus:border-sky-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}
