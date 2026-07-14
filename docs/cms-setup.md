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
CLOUDINARY_PORTFOLIO_FINDER_ICON_FOLDER="portfolio-cms/portfolio-finder-icons"
CLOUDINARY_ABOUT_FOLDER="portfolio-cms/about"
CLOUDINARY_WIFE_FOLDER="portfolio-cms/wife"
```

`ADMIN_SESSION_SECRET` can be omitted locally, but production should set it to a
different long random value from `ADMIN_PASSWORD`.

Apply the versioned schema migration before starting or deploying the app:

```bash
npm run db:migrate
```

Public and admin requests never run schema DDL. For a manual Neon setup, run
`docs/cms-schema.sql` instead.

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
- `portfolio-finder-icon` -> `CLOUDINARY_PORTFOLIO_FINDER_ICON_FOLDER`
- About assets -> `CLOUDINARY_ABOUT_FOLDER`
- Wife assets -> `CLOUDINARY_WIFE_FOLDER`

Uploads accept image files up to 20 MB. New gallery, banner, and portfolio icon
uploads retain Cloudinary metadata in the entry JSON alongside the display URL:
`publicId`, original URL, version, dimensions, format, byte size, resource type,
original filename, and crop coordinates when applicable. Existing entries with
URL-only image data remain compatible.

Gallery bulk upload runs at most three Cloudinary uploads concurrently, then
creates successful CMS entries in one database transaction. Reordering and
label-wide updates also use one batch transaction instead of one request per
photo.
