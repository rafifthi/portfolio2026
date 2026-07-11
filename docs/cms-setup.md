# Portfolio CMS Setup

Required environment variables:

```txt
DATABASE_URL="postgresql://..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this"
ADMIN_SESSION_SECRET="use-a-long-random-string"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_GALLERY_FOLDER="portfolio-cms/gallery"
CLOUDINARY_PORTFOLIO_BANNER_FOLDER="portfolio-cms/portfolio-banners"
CLOUDINARY_PORTFOLIO_ICON_FOLDER="portfolio-cms/portfolio-icons"
```

`ADMIN_SESSION_SECRET` can be omitted locally, but production should set it to a
different long random value from `ADMIN_PASSWORD`.

The app creates the `cms_entries` table automatically on first CMS request. If
you prefer to create it manually in Neon, run `docs/cms-schema.sql`.

## Seeding the CMS with the current site content

The static content (notes and photos from `src/lib/data.ts`, the four case
studies from `content/cases/*.mdx`) can be migrated into the CMS:

```bash
npm run migrate:cms                # upsert into DATABASE_URL (env, .env.local, or .env)
npm run migrate:cms -- --dry-run   # list what would be written
npm run migrate:cms -- --sql       # print seed SQL instead of writing to the DB
```

No database at hand? Paste `docs/cms-seed.sql` into the Neon SQL editor — it is
the same seed, pre-generated and idempotent (upsert on `type + slug`).

Notes and gallery entries are seeded as `published`: the Notes and Photos apps
prefer CMS content when at least one published entry exists, and the seeded
content is identical to the static fallback, so nothing changes visually.

Portfolio entries are seeded as `draft` on purpose. `src/app/page.tsx` renders
published CMS portfolio entries as *additional* desktop icons alongside the
hardcoded MDX cases, so publishing the seeds now would duplicate the icons.
Publish them (in `/admin` or with `--publish-portfolio`) only after removing
the static case wiring from `page.tsx`. Re-running the migration overwrites
seeded entries with the static content, including any edits made in `/admin`.

Cloudinary uploads use fixed folders by upload target:

- `gallery` -> `CLOUDINARY_GALLERY_FOLDER`
- `portfolio-banner` -> `CLOUDINARY_PORTFOLIO_BANNER_FOLDER`
- `portfolio-icon` -> `CLOUDINARY_PORTFOLIO_ICON_FOLDER`
