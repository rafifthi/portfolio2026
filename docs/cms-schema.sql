-- Baseline schema mirrored by scripts/migrate-cms-schema.mjs.
-- Prefer `npm run db:migrate` so applied versions are recorded.

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
);

CREATE INDEX IF NOT EXISTS cms_entries_type_status_sort_idx
ON cms_entries (type, status, sort_order, updated_at DESC);
