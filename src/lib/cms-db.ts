import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { CmsEntry, CmsEntryInput, CmsEntryType } from "./cms";

type CmsRow = {
  id: string;
  type: CmsEntryType;
  slug: string;
  title: string;
  status: "draft" | "published";
  sort_order: number;
  data: unknown;
  created_at: string | Date;
  updated_at: string | Date;
};

let schemaReady = false;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return neon(url);
}

function toEntry(row: CmsRow): CmsEntry {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    status: row.status,
    sortOrder: row.sort_order,
    data: row.data,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function ensureCmsSchema() {
  if (schemaReady) return;
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS cms_entries (
      id text PRIMARY KEY,
      type text NOT NULL CHECK (type IN ('gallery', 'notes', 'portfolio')),
      slug text NOT NULL,
      title text NOT NULL,
      status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      sort_order integer NOT NULL DEFAULT 0,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (type, slug)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS cms_entries_type_status_sort_idx
    ON cms_entries (type, status, sort_order, updated_at DESC)
  `;

  schemaReady = true;
}

export async function listCmsEntries(type?: CmsEntryType, includeDrafts = false) {
  await ensureCmsSchema();
  const sql = getSql();

  const rows = type
    ? includeDrafts
      ? await sql`
          SELECT * FROM cms_entries
          WHERE type = ${type}
          ORDER BY sort_order ASC, updated_at DESC
        ` as CmsRow[]
      : await sql`
          SELECT * FROM cms_entries
          WHERE type = ${type} AND status = 'published'
          ORDER BY sort_order ASC, updated_at DESC
        ` as CmsRow[]
    : includeDrafts
      ? await sql`
          SELECT * FROM cms_entries
          ORDER BY type ASC, sort_order ASC, updated_at DESC
        ` as CmsRow[]
      : await sql`
          SELECT * FROM cms_entries
          WHERE status = 'published'
          ORDER BY type ASC, sort_order ASC, updated_at DESC
        ` as CmsRow[];

  return rows.map(toEntry);
}

export async function createCmsEntry(input: CmsEntryInput) {
  await ensureCmsSchema();
  const sql = getSql();
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO cms_entries (id, type, slug, title, status, sort_order, data)
    VALUES (
      ${id},
      ${input.type},
      ${input.slug},
      ${input.title},
      ${input.status},
      ${input.sortOrder},
      ${JSON.stringify(input.data)}::jsonb
    )
    RETURNING *
  ` as CmsRow[];

  return toEntry(rows[0]);
}

export async function updateCmsEntry(id: string, input: CmsEntryInput) {
  await ensureCmsSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE cms_entries
    SET
      type = ${input.type},
      slug = ${input.slug},
      title = ${input.title},
      status = ${input.status},
      sort_order = ${input.sortOrder},
      data = ${JSON.stringify(input.data)}::jsonb,
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  ` as CmsRow[];

  return rows[0] ? toEntry(rows[0]) : null;
}

export async function deleteCmsEntry(id: string) {
  await ensureCmsSchema();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM cms_entries
    WHERE id = ${id}
    RETURNING id
  ` as { id: string }[];
  return rows.length > 0;
}
