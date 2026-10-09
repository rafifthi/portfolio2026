import type { AboutData, CmsEntry, PortfolioEntryData, WifeData } from "./cms";
import { createCmsEntry, listCmsEntries, updateCmsEntry } from "./cms-db";
import {
  ensureLayoutCoverage,
  layoutEntryData,
  layoutSignature,
  normalizeLayoutOverlay,
  portfolioItemId,
  type DesktopLayoutMap,
  type LayoutItemInput,
} from "./desktop-layout";
import {
  aboutDesktopItem,
  layoutInput,
  portfolioDesktopItem,
  staticDesktopItems,
  STATIC_DESKTOP_ITEM_IDS,
  type DesktopLayoutItemDescriptor,
  wifeDesktopItem,
} from "./desktop-items";
import { fallbackAboutData, fallbackWifeData } from "./profile-content";

/**
 * CMS **Desktop Layout** module — the persisted, content-editable source of
 * desktop icon positions.
 *
 * The module is a singleton `layout` CMS entry whose `data.items` is a
 * `DesktopLayoutMap` (`itemId → breakpoint → { x, y, width }`), validated by
 * `normalizeLayoutOverlay`. This file owns it:
 *
 * - `buildDesktopLayoutState()` — reads every desktop item, resolves the full
 *   coverage (rows for **every** item × every breakpoint) and persists it when
 *   it changed. This is the backfill: opening the editor materialises a row for
 *   every portfolio entry that existed before the module, seeded with the
 *   position that was already being rendered, so nothing moves.
 * - `syncDesktopLayoutRows()` — the auto-populate hook called when a portfolio
 *   entry is created, so a new entry gets its rows with no manual step.
 * - `persistLayoutOverlay()` — writes the editor's payload back.
 *
 * Precedence on the render path: these rows → curated `DESKTOP_LAYOUT` →
 * legacy CMS `desktop.x/y/mobile` → generated slot.
 */

export const LAYOUT_ENTRY_SLUG = "desktop-layout";
export const LAYOUT_ENTRY_TITLE = "Desktop Layout";

export interface DesktopLayoutState {
  items: DesktopLayoutItemDescriptor[];
  /** Exactly the `LayoutItemInput` list the homepage builds its layout from —
   *  the same values, in the same order. */
  inputs: LayoutItemInput[];
  /** Full coverage, every item × every breakpoint. */
  layout: DesktopLayoutMap;
  entryId: string | null;
  entryUpdatedAt: string | null;
  /** True when this call created the `layout` entry. */
  created: boolean;
  /** True when this call wrote rows (new entry, new item, or pruned rows). */
  changed: boolean;
}

function mergeAbout(entry: CmsEntry<AboutData> | undefined): AboutData {
  const data = entry?.data;
  return {
    ...fallbackAboutData,
    ...data,
    desktop: { ...fallbackAboutData.desktop, ...data?.desktop },
  };
}

function mergeWife(entry: CmsEntry<WifeData> | undefined): WifeData {
  const data = entry?.data;
  return {
    ...fallbackWifeData,
    ...data,
    desktop: { ...fallbackWifeData.desktop, ...data?.desktop },
  };
}

async function persistLayoutOverlay(entryId: string | null, overlay: DesktopLayoutMap): Promise<CmsEntry> {
  const input = {
    type: "layout" as const,
    slug: LAYOUT_ENTRY_SLUG,
    title: LAYOUT_ENTRY_TITLE,
    // The public desktop reads the published layout; the module never drafts.
    status: "published" as const,
    sortOrder: 0,
    data: layoutEntryData(overlay),
  };

  if (entryId) {
    const updated = await updateCmsEntry(entryId, input);
    if (updated) return updated;
  }
  return createCmsEntry(input);
}

/** Upserts the singleton `layout` entry from a caller-supplied map (the editor's
 *  PUT payload). Values are canonicalised by `layoutEntryData`. */
export async function writeLayoutOverlay(
  overlay: DesktopLayoutMap
): Promise<{ entryId: string; updatedAt: string; itemCount: number }> {
  const entry = (await listCmsEntries("layout", true))[0] ?? null;
  const saved = await persistLayoutOverlay(entry?.id ?? null, overlay);
  const data = layoutEntryData(normalizeLayoutOverlay(saved.data));
  return {
    entryId: saved.id,
    updatedAt: new Date(saved.updatedAt).toISOString(),
    itemCount: Object.keys(data.items).length,
  };
}

/**
 * Reads the whole module: item list + resolved coverage, persisting rows that
 * were missing (backfill) or orphaned (pruned).
 */
export async function buildDesktopLayoutState(): Promise<DesktopLayoutState> {
  const [portfolioEntries, aboutEntries, wifeEntries, layoutEntries] = await Promise.all([
    listCmsEntries("portfolio", true),
    listCmsEntries("about", true),
    listCmsEntries("wife", true),
    listCmsEntries("layout", true),
  ]);

  const aboutItem = aboutDesktopItem(mergeAbout(aboutEntries[0] as CmsEntry<AboutData> | undefined));
  const wifeItem = wifeDesktopItem(mergeWife(wifeEntries[0] as CmsEntry<WifeData> | undefined));
  const staticItems = staticDesktopItems();
  const portfolioEntriesTyped = portfolioEntries as CmsEntry<PortfolioEntryData>[];
  const portfolioItems = portfolioEntriesTyped.map(portfolioDesktopItem);

  // Render order — matches `HomeClient` (`staticItems`, `about`, `wife`,
  // portfolio items), filtered to what actually renders. Keeping this list (and
  // its order) identical is what guarantees the seeded rows reproduce the
  // currently rendered positions exactly.
  const rendered = [...staticItems, aboutItem, wifeItem, ...portfolioItems].filter((item) => Boolean(item.image));
  const renderedIds = new Set(rendered.map((item) => item.id));
  const renderedInputs = rendered.map(layoutInput);

  const stored = normalizeLayoutOverlay(layoutEntries[0]?.data);
  const layout = ensureLayoutCoverage(renderedInputs, { overlay: stored });

  // Items the homepage cannot render yet (e.g. `about` before a desktop image is
  // uploaded) still get an editable row. Derived from the item alone, so they can
  // never consume a generated slot and shift a rendered icon.
  const known = new Map(
    [...staticItems, aboutItem, wifeItem, ...portfolioItems].map((item) => [item.id, item] as const)
  );
  for (const id of STATIC_DESKTOP_ITEM_IDS) {
    if (layout[id]) continue;
    const item = known.get(id);
    if (!item) continue;
    const own = ensureLayoutCoverage([layoutInput(item)], { overlay: stored });
    if (own[id]) layout[id] = own[id];
  }

  const items: DesktopLayoutItemDescriptor[] = [
    ...STATIC_DESKTOP_ITEM_IDS.map((id) => ({
      id,
      kind: "static" as const,
      label: known.get(id)?.label ?? id,
      entryId: null,
      rendered: renderedIds.has(id),
    })),
    ...portfolioEntriesTyped.map((entry) => {
      const id = portfolioItemId(entry.id);
      return {
        id,
        kind: "portfolio" as const,
        label: known.get(id)?.label ?? entry.data?.title ?? entry.title,
        entryId: entry.id,
        rendered: renderedIds.has(id),
      };
    }),
  ];

  const existing = layoutEntries[0] ?? null;
  // Compared against the *whole* stored map, not just the ids the coverage still
  // knows: a portfolio entry deleted in the CMS leaves an orphan row behind, and
  // the only way that row ever gets pruned is by noticing `stored ≠ layout`.
  const changed = layoutSignature(stored) !== layoutSignature(layout);
  const saved = !existing || changed ? await persistLayoutOverlay(existing?.id ?? null, layout) : existing;

  return {
    items,
    inputs: renderedInputs,
    layout,
    entryId: saved?.id ?? null,
    entryUpdatedAt: saved ? new Date(saved.updatedAt).toISOString() : null,
    created: !existing,
    changed: !existing || changed,
  };
}

/**
 * Auto-populate hook: called right after a portal/portfolio entry is created so
 * the new item has a row at every breakpoint without any manual step.
 * Returns the ids that were added (empty when nothing changed).
 */
export async function syncDesktopLayoutRows(): Promise<{
  entryId: string | null;
  created: boolean;
  changed: boolean;
  addedIds: string[];
}> {
  const before = normalizeLayoutOverlay((await listCmsEntries("layout", true))[0]?.data);
  const state = await buildDesktopLayoutState();
  const addedIds = Object.keys(state.layout).filter((id) => !before[id]);
  return { entryId: state.entryId, created: state.created, changed: state.changed, addedIds };
}

/** Drops the rows of `ids` (or everything) and re-seeds them from the resolved
 *  layout — `reset = "all"` or a single item id. Returns the new state. */
export async function resetDesktopLayoutRows(ids: string[] | "all"): Promise<DesktopLayoutState> {
  const entry = (await listCmsEntries("layout", true))[0] ?? null;
  const stored = normalizeLayoutOverlay(entry?.data);
  const next: DesktopLayoutMap = {};

  for (const [id, config] of Object.entries(stored)) {
    if (ids === "all" || ids.includes(id)) continue;
    next[id] = config;
  }

  if (entry) {
    // Persist the pruned map first, then let the coverage pass re-seed the rows
    // from the generator (buildDesktopLayoutState compares against the DB).
    await persistLayoutOverlay(entry.id, next);
  }

  return buildDesktopLayoutState();
}
