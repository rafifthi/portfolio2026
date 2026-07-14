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

export async function listCmsEntries(type?: CmsEntryType, includeDrafts = false) {
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

export async function getCmsEntry(id: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM cms_entries
    WHERE id = ${id}
    LIMIT 1
  ` as CmsRow[];

  return rows[0] ? toEntry(rows[0]) : null;
}

export async function createCmsEntry(input: CmsEntryInput) {
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

export async function createCmsEntries(inputs: CmsEntryInput[]) {
  if (!inputs.length) return [];
  const sql = getSql();
  const payload = inputs.map((input) => ({
    id: randomUUID(),
    type: input.type,
    slug: input.slug,
    title: input.title,
    status: input.status,
    sort_order: input.sortOrder,
    data: input.data,
  }));
  const rows = await sql`
    INSERT INTO cms_entries (id, type, slug, title, status, sort_order, data)
    SELECT id, type, slug, title, status, sort_order, data
    FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS item(
      id text,
      type text,
      slug text,
      title text,
      status text,
      sort_order integer,
      data jsonb
    )
    RETURNING *
  ` as CmsRow[];

  return rows.map(toEntry);
}

export async function updateCmsEntry(id: string, input: CmsEntryInput) {
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

export async function updateCmsEntries(
  updates: { id: string; input: CmsEntryInput }[]
) {
  if (!updates.length) return [];
  const sql = getSql();
  const payload = updates.map(({ id, input }) => ({
    id,
    type: input.type,
    slug: input.slug,
    title: input.title,
    status: input.status,
    sort_order: input.sortOrder,
    data: input.data,
  }));
  const rows = await sql`
    WITH input AS (
      SELECT *
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS item(
        id text,
        type text,
        slug text,
        title text,
        status text,
        sort_order integer,
        data jsonb
      )
    ), valid AS (
      SELECT count(*) = ${updates.length} AS ok
      FROM cms_entries
      INNER JOIN input USING (id)
    )
    UPDATE cms_entries
    SET
      type = input.type,
      slug = input.slug,
      title = input.title,
      status = input.status,
      sort_order = input.sort_order,
      data = input.data,
      updated_at = now()
    FROM input, valid
    WHERE valid.ok AND cms_entries.id = input.id
    RETURNING cms_entries.*
  ` as CmsRow[];

  return rows.map(toEntry);
}

export async function deleteCmsEntry(id: string) {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM cms_entries
    WHERE id = ${id}
    RETURNING type
  ` as { type: CmsEntryType }[];
  return rows[0]?.type ?? null;
}

export async function deleteCmsEntries(ids: string[]) {
  if (!ids.length) return [];
  const sql = getSql();
  const payload = ids.map((id) => ({ id }));
  const rows = await sql`
    WITH input AS (
      SELECT id
      FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS item(id text)
    ), valid AS (
      SELECT count(*) = ${ids.length} AS ok
      FROM cms_entries
      INNER JOIN input USING (id)
    )
    DELETE FROM cms_entries
    WHERE (SELECT ok FROM valid) AND id IN (SELECT id FROM input)
    RETURNING id, type
  ` as { id: string; type: CmsEntryType }[];

  return rows;
}
