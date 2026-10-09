/**
 * In-memory testdouble for `src/lib/cms-db.ts`, used by the offline harnesses
 * (`scripts/verify-cms-layout.mjs`) on machines without a database.
 *
 * It mirrors the real module's exported signatures and the semantics the CMS
 * Desktop Layout module depends on:
 *   - ids are UUIDs, `created_at` / `updated_at` come from the "database"
 *   - rows are stored cloned, the way `jsonb` round-trips them
 *   - `listCmsEntries` orders by `sort_order ASC, updated_at DESC` and filters
 *     drafts unless asked
 *   - every write bumps `updated_at`, so a harness can prove a no-op read really
 *     issued no write
 *
 * `__…` helpers are test-only and do not exist in the real module.
 */
import { randomUUID } from "node:crypto";

const EPOCH = Date.UTC(2026, 0, 1);
const state = { rows: new Map(), clock: 0 };

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function tick() {
  state.clock += 1;
  return new Date(EPOCH + state.clock * 1000).toISOString();
}

function toEntry(row) {
  return clone(row);
}

function toRow(id, input) {
  return {
    id,
    type: input.type,
    slug: input.slug,
    title: input.title,
    status: input.status,
    sortOrder: input.sortOrder,
    data: clone(input.data),
    createdAt: tick(),
    updatedAt: new Date(EPOCH + state.clock * 1000).toISOString(),
  };
}

function sortRows(rows) {
  return [...rows].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      String(b.updatedAt).localeCompare(String(a.updatedAt)) ||
      String(a.id).localeCompare(String(b.id))
  );
}

export async function listCmsEntries(type, includeDrafts = false) {
  let rows = [...state.rows.values()];
  if (type) rows = rows.filter((row) => row.type === type);
  if (!includeDrafts) rows = rows.filter((row) => row.status === "published");
  return sortRows(rows).map(toEntry);
}

export async function getCmsEntry(id) {
  const row = state.rows.get(id);
  return row ? toEntry(row) : null;
}

export async function createCmsEntry(input) {
  const row = toRow(randomUUID(), input);
  state.rows.set(row.id, row);
  return toEntry(row);
}

export async function createCmsEntries(inputs) {
  return Promise.all(inputs.map((input) => createCmsEntry(input)));
}

export async function updateCmsEntry(id, input) {
  if (!state.rows.has(id)) return null;
  const row = { ...toRow(id, input), createdAt: state.rows.get(id).createdAt };
  state.rows.set(id, row);
  return toEntry(row);
}

export async function updateCmsEntries(updates) {
  const entries = [];
  for (const { id, input } of updates) {
    const entry = await updateCmsEntry(id, input);
    if (entry) entries.push(entry);
  }
  return entries;
}

export async function deleteCmsEntry(id) {
  const row = state.rows.get(id);
  if (!row) return null;
  state.rows.delete(id);
  return row.type;
}

export async function deleteCmsEntries(ids) {
  const entries = [];
  for (const id of ids) {
    const row = state.rows.get(id);
    if (!row) continue;
    state.rows.delete(id);
    entries.push(toEntry(row));
  }
  return entries;
}

/* ── test-only helpers ─────────────────────────────────────────────────────── */

/** Clears the "database" and seeds it with `entries` (already `CmsEntry`-shaped
 *  rows: `{ id, type, slug, title, status, sortOrder, data }`). */
export function __reset(entries = []) {
  state.rows.clear();
  state.clock = 0;
  for (const entry of entries) {
    state.rows.set(entry.id, {
      ...entry,
      data: clone(entry.data),
      createdAt: tick(),
      updatedAt: new Date(EPOCH + state.clock * 1000).toISOString(),
    });
  }
}

/** Inserts a raw row, bypassing `createCmsEntry` (simulates a row written by a
 *  different code path, e.g. the content API). Returns the stored entry. */
export function __insert(entry) {
  const row = {
    id: entry.id ?? randomUUID(),
    type: entry.type,
    slug: entry.slug,
    title: entry.title,
    status: entry.status ?? "published",
    sortOrder: entry.sortOrder ?? 0,
    data: clone(entry.data),
    createdAt: tick(),
    updatedAt: new Date(EPOCH + state.clock * 1000).toISOString(),
  };
  state.rows.set(row.id, row);
  return toEntry(row);
}

export function __delete(id) {
  return state.rows.delete(id);
}

/** Serialised contents of the whole "table" — used to prove an unchanged read
 *  issued no write (any write would bump `updated_at`). */
export function __snapshot() {
  return JSON.stringify(sortRows([...state.rows.values()]));
}

export function __count(type) {
  return [...state.rows.values()].filter((row) => row.type === type).length;
}
