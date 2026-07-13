#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const migrations = [
  {
    version: 1,
    name: "create-cms-entries",
    statements: [
      `CREATE TABLE IF NOT EXISTS cms_entries (
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
      )`,
      `CREATE INDEX IF NOT EXISTS cms_entries_type_status_sort_idx
       ON cms_entries (type, status, sort_order, updated_at DESC)`,
    ],
  },
];

function loadEnvFile(name) {
  try {
    const text = readFileSync(resolve(process.cwd(), name), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = raw.replace(/^["']|["']$/g, "");
    }
  } catch {
    // Missing local env files are fine when DATABASE_URL is exported by the host.
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (checked env, .env.local, and .env).");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS cms_schema_migrations (
    version integer PRIMARY KEY,
    name text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

const appliedRows = await sql`SELECT version FROM cms_schema_migrations`;
const applied = new Set(appliedRows.map((row) => Number(row.version)));

for (const migration of migrations) {
  if (applied.has(migration.version)) {
    console.log(`already applied ${migration.version}: ${migration.name}`);
    continue;
  }

  await sql.transaction((transaction) => [
    ...migration.statements.map((statement) => transaction.query(statement)),
    transaction.query(
      "INSERT INTO cms_schema_migrations (version, name) VALUES ($1, $2)",
      [migration.version, migration.name]
    ),
  ]);
  console.log(`applied ${migration.version}: ${migration.name}`);
}

console.log("CMS schema is up to date.");
