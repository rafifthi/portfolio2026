# Desktop layout module

`src/lib/desktop-layout.ts` is the **single source of truth for where desktop
icons sit**. It replaced the three places coordinates used to live:

| before | after |
| --- | --- |
| `desktopItems` hardcoded `x`/`y` in `src/lib/data.ts` | curated config in the module |
| `MOBILE_ICON_POSITIONS` + `getMobileIconPosition()` in `HomeClient` | generated grid in the module |
| inline `10 + index * 8` fallback, `isMobile ? … : item.x` in `HomeClient` | `resolveDesktopItemLayout()` |

`x` / `y` are **percentages of the desktop area** (the `inset-0` container in
`HomeClient`), matching `DesktopIcon`'s `left: x%` / `top: y%`. `width`,
`imageHeight` are pixels.

## Breakpoints

Default Tailwind scale (there is no `tailwind.config.*`):

| breakpoint | viewport | notes |
| --- | --- | --- |
| `base` | < 640 | phones — compact icons, `isMobile` |
| `sm` | 640 – 767 | `isTablet` |
| `md` | 768 – 1023 | `isTablet` |
| `lg` | 1024 – 1279 | desktop layout |
| `xl` | ≥ 1280 | desktop layout |

`resolveLayoutBreakpoint(width)` maps a viewport width to a breakpoint;
`layoutBreakpointQueries()` returns the `matchMedia` queries `HomeClient`
subscribes to.

## Resolution precedence (per item, per breakpoint)

1. **CMS "Desktop Layout" module** — the `layout` CMS entry, edited in
   `/admin` → Desktop Layout (`options.overlay`, see below). This is the primary,
   content-editable source.
2. **Curated config** — `DESKTOP_LAYOUT[id][breakpoint]` in this module. `readme`
   and `cv` live only here (they have no CMS entry).
3. **Legacy CMS override** — `desktop.mobile.{x,y}` for `base`, `desktop.{x,y,width}`
   for the desktop breakpoints (`width` scaled by `DESKTOP_WIDTH_SCALE`:
   `sm`/`md` = 0.8, `lg`/`xl` = 1). Legacy CMS placement keeps working; the values
   are clamped into the padding-safe box and de-collided when two land on the same
   spot.
4. **Generated slot** — deterministic grid position for anything left over.
5. The `fallback` passed to `resolveDesktopItemLayout()`.

A position that survives clamping but still collides with an already-placed item is
**not** forced onto the screen: it is demoted to (4) so the generator places it.
Overlap is therefore impossible, whatever the config contains.

## CMS module: "Desktop Layout" (positions editable in `/admin`)

`src/lib/desktop-layout-cms.ts` owns a singleton CMS entry (type `layout`, slug
`desktop-layout`) whose `data.items` is a `DesktopLayoutMap`:

```jsonc
{
  "items": {
    "readme":            { "base": { "x": 8, "y": 11, "width": 76 }, "xl": { "x": 5, "y": 12, "width": 150 } },
    "wife":              { "...": "…" },
    "cv":                { "...": "…" },
    "about":             { "...": "…" },
    "cms-desktop-<id>":  { "base": { "x": 52.31, "y": 7.58, "width": 76 } }
  }
}
```

* `x` / `y` are **percent of the desktop area**; `width` is the icon box width in
  **px** and optional (empty = auto). A `base` row stores only `width` — the
  compact image height is derived (`width × 0.8`).
* Every value is validated by `normalizeLayoutOverlay()`: percentages clamp into
  0–100, widths into `LAYOUT_ROW_WIDTH_MIN`–`LAYOUT_ROW_WIDTH_MAX`, unknown
  breakpoints/rows drop, and a corrupt payload degrades to "no overlay" instead of
  breaking the desktop.
* Admin UI: `/admin` → **Desktop Layout** (`src/app/admin/DesktopLayoutPanel.tsx`).
  One row per desktop item with `x` / `y` / `width` inputs for each of
  `base` / `sm` / `md` / `lg` / `xl`, plus per-row and global **Reset**.
* API: `GET/PUT /api/admin/layout` (`src/app/api/admin/layout/route.ts`).
  `GET` resolves the coverage and persists missing rows; `?reset=all|<itemId>`
  re-seeds rows from the generator; `PUT` merges the editor payload over the
  current coverage (a row the editor did not send keeps its position).
  The singleton is refused by the generic content API
  (`POST/PATCH/DELETE /api/admin/content*`).
* Homepage: `src/app/page.tsx` reads the published `layout` entry and
  `HomeClient` passes it as `overlay` to `buildDesktopLayout`, so a save takes
  effect on the next page load (the client also re-reads
  `/api/content?type=layout` on mount).

### Auto-populate & backfill

* **New portfolio entry** → `POST /api/admin/content` (and the batch create path)
  calls `syncDesktopLayoutRows()`: the new item gets a row for **every**
  breakpoint, with no manual step. A failure there never fails the content write.
* **Existing entries** → the first `GET /api/admin/layout` runs
  `buildDesktopLayoutState()`, which materialises rows for every item and
  persists them. Rows for deleted entries are pruned.
* Rows are **seeded with the currently rendered position**: the pass resolves the
  layout with the existing rows as the overlay, so curated config and legacy
  `desktop.x/y` values become the stored default instead of a fresh generated
  slot. Enabling the module therefore does not move a single icon.
* Coverage is a **fixed point**: `ensureLayoutCoverage(items, { overlay: rows })`
  equals `rows`, which is why writing rows can never shift icons.

### Phones shrink, and rows yield when they cannot fit

* On `base` the whole grid uses one tier size (`cozy` 120 → `dense` 104 →
  `compact` 88 → `mini` 76), chosen from the item set, so an authored row can
  never mix icon sizes. The choice depends only on the item set, which keeps the
  layout identical before and after rows are persisted.
* Rows are seeded at the reference viewport (390×844 for `base`). On a much
  smaller screen they can be impossible to honour without pushing icons below the
  fold; the generator is then the authority for that whole breakpoint
  (`resolveBreakpoint` is re-run without rows). Every icon stays on screen.

## Auto-populate for portfolio entries

`buildDesktopLayout(items, { activeBreakpoint, viewport })` walks the item list
and returns a full map (`itemId → { [breakpoint]: { x, y, width } }`), generating
a non-overlapping slot for every item that has neither curated config nor CMS
coordinates. **A brand-new CMS portfolio entry therefore always has a layout —
no manual step.** The layout key is the rendered item id, `cms-desktop-<entryId>`
(`portfolioItemId(entryId)`).

`ensurePortfolioLayout(ids | { id }[], options)` exposes the same generator for
callers that only have entry ids.

Generation is deterministic for the same `(items, breakpoint, viewport)` and
viewport-aware: on-screen breakpoints are generated against the real viewport,
the others against `LAYOUT_REFERENCE_VIEWPORT` so SSR stays stable
(`HomeClient` renders `xl` on the server and resolves the real breakpoint after
hydration — no hydration mismatch).

## Crowded screens: shrink, never overlap

Every icon is modelled as a box (`estimateIconBox`) and slots are packed into
the usable area (viewport minus `LAYOUT_AREA_PADDING`: mobile `pt-16 pb-28`,
desktop `pt-8 pb-20`, `px-4`).

* **Phones** pick the first tier whose free cells cover the item count —
  `cozy` (120 px) → `dense` (104) → `compact` (88) → `mini` (76). The tier size
  is applied to *every* base icon, including curated/CMS-placed ones, so a
  crowded phone shrinks the whole grid instead of mixing sizes.
* **Desktop** breakpoints scale the icon box (1 → 0.85 → 0.7 → 0.55 → 0.45) the
  same way.
* Image height is bounded: `DesktopIcon` gets `imageHeight` (compact, exact) and
  `imageMaxHeight` (= `width × aspect`) from the module, so a taller-than-assumed
  upload shrinks instead of growing into a neighbour. Aspect comes from CMS media
  metadata (`imageAspect`), falling back to `DESKTOP_DEFAULT_IMAGE_ASPECT`.

Past the capacity of the largest tier the area is physically full: icons keep
their spacing and run past the fold (a dev-only `console.warn` fires). They never
overlap. `desktopLayoutCapacity()` / `planDesktopGrid()` report the numbers.

## Customising a position

**Normal path — the CMS editor:** `/admin` → **Desktop Layout**, pick the item and
breakpoint, type `x` / `y` / `width`, **Save layout**. No deploy, no code change.

**Developer path — curated defaults in code** (these seed the module and cover
`readme` / `cv`, which have no CMS entry):

```ts
// src/lib/desktop-layout.ts
export const DESKTOP_LAYOUT: DesktopLayoutMap = {
  readme: {
    base: { x: 8, y: 11, width: 120, imageHeight: 96 },
    sm: { x: 6, y: 14, width: 120, aspect: 4 / 3 },
    md: { x: 5, y: 14, width: 130, aspect: 4 / 3 },
    lg: { x: 5, y: 12, width: 150, aspect: 4 / 3 },
    xl: { x: 5, y: 12, width: 150, aspect: 4 / 3 },
  },
  // any id also works for CMS items, but a *stored row* wins over it:
  "cms-desktop-lumona": { xl: { x: 72, y: 20, width: 170 } },
};
```

Omitted breakpoints fall back to the nearest configured one (smaller first, then
larger). Positions are always clamped inside the padding-safe box.

## Schema

The `layout` entry type needs schema migration **5** (`npm run db:migrate`):

```bash
npm run db:migrate   # adds 'layout' to the cms_entries type constraint
```

Read paths are safe before the migration (a missing entry means "no overlay"), but
the editor returns a 503 with that instruction until it runs.

## Verifying

```bash
npm run verify:layout   # node --experimental-strip-types scripts/verify-desktop-layout.mjs
npm run verify:cms-layout
```

`verify:layout` checks, across viewports × item counts × breakpoints (≈39k
assertions) and
**twice** — once with generated positions and once with every position frozen into
stored CMS rows:

* every item resolves at every breakpoint, nothing leaves viewport bounds (up to
  the layout capacity), nothing overlaps at any count;
* a new entry gets a generated row at every breakpoint; coverage is a fixed point
  (`ensureLayoutCoverage(items, { overlay: rows })` === `rows`) and seeds the
  rendered position rather than a fresh slot;
* stored rows beat the curated config and the legacy `desktop.x/y` (`base` rows
  derive their compact image height from `width`);
* the persisted payload is validated: percentages/widths clamp, invalid and
  unknown rows drop, corrupt payloads degrade to "no overlay";
* generation is deterministic and differs per breakpoint.

`verify:cms-layout` (135 assertions, no database needed) covers the CMS module
itself — `src/lib/desktop-layout-cms.ts`, the layer the editor writes to and the
homepage reads from. It runs the real module against an in-memory `cms-db`
testdouble (`scripts/lib/cms-db-testdouble.mjs`, wired in by
`scripts/lib/verify-loader.mjs`) and asserts:

* the first read materialises the singleton `layout` entry with a row for
  `readme` / `wife` / `cv` / `about` + every portfolio entry, at all five
  breakpoints, seeded with the position that was already rendered;
* a second read issues **no write** (any write would bump `updated_at`), so
  opening the editor cannot move an icon;
* a new portfolio entry auto-populates its row (and only its row) while every
  stored position stays put;
* deleting a portfolio entry prunes its rows from the stored payload;
* a hand-edited row round-trips through the CMS entry and is what the render path
  resolves, and out-of-range stored rows clamp instead of landing off-screen;
* `reset <id>` / `reset all` re-seed from the generator;
* `about` keeps an editable row even before a desktop image exists.

The real DB round-trip (SQL, migration 5, the singleton constraint) is not covered
here — run `npm run db:migrate` and exercise `/admin` → Desktop Layout against a
database for that.

