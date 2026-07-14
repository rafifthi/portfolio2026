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
  {
    version: 2,
    name: "add-profile-entry-types",
    statements: [
      `ALTER TABLE cms_entries DROP CONSTRAINT IF EXISTS cms_entries_type_check`,
      `ALTER TABLE cms_entries ADD CONSTRAINT cms_entries_type_check
       CHECK (type IN ('gallery', 'notes', 'portfolio', 'about', 'wife'))`,
    ],
  },
  {
    version: 3,
    name: "seed-profile-entries",
    statements: [
      `INSERT INTO cms_entries (id, type, slug, title, status, sort_order, data)
       VALUES (
         'seed-about-about-rafif', 'about', 'about-rafif', 'Rafif Fathi Misbah', 'published', 0,
         $json$${JSON.stringify({
           title: "Rafif Fathi Misbah",
           subtitle: "Product Manager · Business Analyst",
           body: [
             "I'm a product manager who likes the messy middle — the gap between a fuzzy business problem and something a real person can click. I sit across product, business analysis, and product design, mostly in SME and retail.",
             "Day to day that means discovery, requirements, and the unglamorous backbone of shipping: backlogs, sprint planning, ticketing, QA. I map how a business actually works, then translate that into specs engineering can build without a séance.",
             "I'm also an early adopter of agentic AI for the product pipeline — Hermes Agent, Claude Code, and Codex are part of how I move fast now, not a gimmick for a slide. If there's a way to compress idea-to-MVP, I'm trying it.",
           ].join("\n\n"),
           tags: ["Product Discovery", "Business Analysis", "Product Design", "Agentic AI", "MVP"],
           photo: "",
           finderIcon: "",
           desktop: { label: "About Rafif", image: "", x: 18, y: 8, width: 150, icon: "UserRound", color: "#3b82f6" },
         })}$json$::jsonb
       ) ON CONFLICT (type, slug) DO NOTHING`,
      `INSERT INTO cms_entries (id, type, slug, title, status, sort_order, data)
       VALUES (
         'seed-wife-wife', 'wife', 'wife', 'Kanza', 'published', 0,
         $json$${JSON.stringify({
           name: "Kanza",
           description: "Someone I call it home. She is bright as the sun even on a Monday. I married her on 19 July 2025, which is still the best idea I've ever had — and I have a lot of ideas.",
           photo: "/images/kanza.JPG",
           finderIcon: "/images/kanza.JPG",
           desktop: { label: "wife", image: "/images/kanza.JPG", x: 57, y: 59, width: 140, icon: "Heart", color: "#ec4899" },
         })}$json$::jsonb
       ) ON CONFLICT (type, slug) DO NOTHING`,
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
