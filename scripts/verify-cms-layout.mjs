/**
 * Offline verification for the CMS **Desktop Layout** module
 * (`src/lib/desktop-layout-cms.ts`) — the layer the `/admin` editor writes to and
 * the homepage reads from.
 *
 * Run with:  npm run verify:cms-layout
 *       or:  node --experimental-strip-types scripts/verify-cms-layout.mjs
 *
 * There is no database in this environment, so the module runs against the
 * in-memory `cms-db` testdouble wired in by `scripts/lib/verify-loader.mjs`. This
 * verifies the module's own logic (coverage/backfill, auto-populate, pruning,
 * precedence, reset) — not the SQL, which stays in `src/lib/cms-db.ts`.
 *
 * Checks:
 *   1. the first read materialises the singleton `layout` entry with a row for
 *      every item (readme / wife / cv / about + every portfolio entry) at every
 *      breakpoint (base / sm / md / lg / xl)
 *   2. the backfill is faithful: the seeded rows reproduce exactly the positions
 *      the desktop already rendered (legacy CMS x/y/width and generated slots)
 *   3. a second read issues no write (the stored map is a fixed point), so
 *      opening the editor can never move icons
 *   4. a brand-new portfolio entry auto-populates rows at every breakpoint with
 *      no manual step, and moves nothing else
 *   5. a deleted portfolio entry has its rows pruned from the stored payload
 *   6. the editor payload persists and wins over the curated config and the
 *      legacy `desktop.x/y/mobile` fields on the render path
 *   7. reset re-seeds a single row / every row from the generator
 *   8. `about` keeps an editable row even before a desktop image is uploaded
 */
import { register } from "node:module";

register("./lib/verify-loader.mjs", import.meta.url);

const db = await import("./lib/cms-db-testdouble.mjs");
const { LAYOUT_BREAKPOINTS, buildDesktopLayout, ensureLayoutCoverage, normalizeLayoutOverlay } =
  await import("../src/lib/desktop-layout.ts");
const {
  LAYOUT_ENTRY_SLUG,
  LAYOUT_ENTRY_TITLE,
  buildDesktopLayoutState,
  resetDesktopLayoutRows,
  syncDesktopLayoutRows,
  writeLayoutOverlay,
} = await import("../src/lib/desktop-layout-cms.ts");

/* ── assertions ────────────────────────────────────────────────────────────── */

let checks = 0;
const failures = [];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])])
    );
  }
  return value ?? null;
}

const canon = (value) => JSON.stringify(canonical(value));

function ok(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function eq(actual, expected, message) {
  checks += 1;
  if (canon(actual) !== canon(expected)) {
    failures.push(`${message} — got ${canon(actual)}, want ${canon(expected)}`);
  }
}

/** The persisted shape of a row: `{ x, y }` plus `width` when the resolver
 *  produced one. A *resolved* layout also carries derived fields (`aspect`,
 *  `imageHeight`) that are recomputed on every build and never stored, so
 *  comparisons go through this projection. */
function point(row) {
  if (!row) return null;
  return row.width === undefined ? { x: row.x, y: row.y } : { x: row.x, y: row.y, width: row.width };
}

/* ── fixtures ──────────────────────────────────────────────────────────────── */

function entry(id, type, slug, title, data, sortOrder = 0) {
  return { id, type, slug, title, status: "published", sortOrder, data };
}

/** Portfolio entry with legacy CMS coordinates (placed) + a mobile override. */
const LUMONA = entry(
  "p-lumona",
  "portfolio",
  "lumona",
  "Lumona",
  {
    title: "Lumona",
    banner: "/images/lumona.jpg",
    desktop: {
      label: "Lumona",
      image: "/images/lumona.jpg",
      x: 12,
      y: 34,
      width: 170,
      mobile: { x: 9, y: 40 },
      media: { width: 240, height: 320 },
    },
  },
  0
);

/** Portfolio entry that never got coordinates — must fall through to a slot. */
const SITI = entry(
  "p-siti",
  "portfolio",
  "siti",
  "Siti",
  {
    title: "Siti",
    banner: "/images/siti.jpg",
    desktop: { media: { width: 340, height: 260 } },
  },
  1
);

const ABOUT = entry(
  "e-about",
  "about",
  "about-rafif",
  "About Rafif",
  {
    title: "About Rafif",
    photo: "/images/rafif.jpg",
    desktop: { label: "About Rafif", image: "/images/rafif.jpg", x: 44, y: 8, width: 150 },
  },
  0
);

const WIFE = entry(
  "e-wife",
  "wife",
  "wife",
  "Kanza",
  {
    name: "Kanza",
    photo: "/images/kanza.JPG",
    desktop: { label: "wife", image: "/images/kanza.JPG", x: 28, y: 8, width: 140 },
  },
  0
);

/** Render order `HomeClient` uses: static items, about, wife, portfolio entries. */
const ITEM_ORDER = ["readme", "wife", "cv", "about", "cms-desktop-p-lumona", "cms-desktop-p-siti"];
const PORTFOLIO_ITEM = (id) => `cms-desktop-${id}`;

const allBreakpointsFilled = (row) =>
  LAYOUT_BREAKPOINTS.every(
    (breakpoint) =>
      row?.[breakpoint] &&
      Number.isFinite(row[breakpoint].x) &&
      Number.isFinite(row[breakpoint].y)
  );

/* ── 1. first read: singleton entry + full coverage ───────────────────────── */

db.__reset([LUMONA, SITI, ABOUT, WIFE]);

const first = await buildDesktopLayoutState();

eq(
  first.items.map((item) => item.id),
  ITEM_ORDER,
  "rows cover readme, wife, cv, about and every portfolio entry, in render order"
);
ok(first.created, "the first read creates the `layout` entry");
ok(first.changed, "the first read persists the rows");

const storedRows = await db.listCmsEntries("layout", true);
eq(storedRows.length, 1, "the module keeps exactly one singleton `layout` entry");
eq(storedRows[0].type, "layout", "the singleton entry has CMS type `layout`");
eq(storedRows[0].slug, LAYOUT_ENTRY_SLUG, "the singleton entry uses the module slug");
eq(storedRows[0].title, LAYOUT_ENTRY_TITLE, "the singleton entry uses the module title");
eq(storedRows[0].status, "published", "the singleton entry is published (the public desktop reads published rows)");

for (const id of ITEM_ORDER) {
  ok(allBreakpointsFilled(first.layout[id]), `row ${id} has x/y at all five breakpoints`);
  eq(
    Object.keys(first.layout[id]).sort(),
    [...LAYOUT_BREAKPOINTS].sort(),
    `row ${id} covers exactly base/sm/md/lg/xl`
  );
}

eq(
  first.items.filter((item) => item.kind === "static").map((item) => item.id),
  ["readme", "wife", "cv", "about"],
  "readme / wife / cv / about are static rows"
);
eq(
  first.items.filter((item) => item.kind === "portfolio").map((item) => item.entryId),
  ["p-lumona", "p-siti"],
  "portfolio rows point back at their CMS entry"
);
eq(
  first.items.filter((item) => item.rendered).length,
  ITEM_ORDER.length,
  "every item with media is marked as rendered"
);

/* ── 2. backfill fidelity: seeding cannot move an icon ────────────────────── */

const renderedWithoutOverlay = buildDesktopLayout(first.inputs, {});
for (const breakpoint of LAYOUT_BREAKPOINTS) {
  for (const id of ITEM_ORDER) {
    eq(
      point(first.layout[id][breakpoint]),
      point(renderedWithoutOverlay[id][breakpoint]),
      `backfill seeded ${id}/${breakpoint} with the position that was already rendered`
    );
  }
}

eq(
  Object.keys(first.layout.readme.lg).sort(),
  ["width", "x", "y"],
  "a stored row carries only x/y/width — derived values are recomputed on every build"
);
eq(
  first.layout[PORTFOLIO_ITEM("p-lumona")].base,
  { x: 9, y: 40, width: 120 },
  "the legacy CMS mobile override is carried into the base row (width follows the mobile tier)"
);
ok(
  first.layout[PORTFOLIO_ITEM("p-lumona")].lg.x === 12 &&
    first.layout[PORTFOLIO_ITEM("p-lumona")].lg.width === 170,
  "the legacy CMS desktop x/width are carried into the desktop rows"
);

/* ── 3. second read is a no-op write ──────────────────────────────────────── */

const snapshotBefore = db.__snapshot();
const second = await buildDesktopLayoutState();

eq(second.changed, false, "an unchanged read writes nothing");
eq(second.created, false, "the second read finds the existing entry");
eq(second.layout, first.layout, "the persisted coverage is a fixed point");
eq(db.__snapshot(), snapshotBefore, "no UPDATE was issued (updated_at unchanged)");
eq(db.__count("layout"), 1, "still exactly one `layout` entry");

/* ── 4. a new portfolio entry auto-populates rows ─────────────────────────── */

const invitation = db.__insert(
  entry(
    "p-invitation",
    "portfolio",
    "invitation",
    "Invitation",
    {
      title: "Invitation",
      banner: "/images/invitation.jpg",
      desktop: { media: { width: 260, height: 300 } },
    },
    2
  )
);

const persistedBeforeAdd = (await db.listCmsEntries("layout", true))[0].data.items;
const sync = await syncDesktopLayoutRows();
eq(
  sync.addedIds,
  [PORTFOLIO_ITEM("p-invitation")],
  "a new portfolio entry gets its row with no manual step"
);

const afterAdd = await buildDesktopLayoutState();
ok(
  allBreakpointsFilled(afterAdd.layout[PORTFOLIO_ITEM("p-invitation")]),
  "the new row is filled at every breakpoint"
);
const persistedAfterAdd = (await db.listCmsEntries("layout", true))[0].data.items;
// The only value the pass may touch is the phone (`base`) `width`: crowding the
// grid drops every icon to one uniform tier size (`buildDesktopLayout` phase 2),
// and the stored rows converge on what is actually rendered. Positions never move.
for (const id of ITEM_ORDER) {
  for (const breakpoint of LAYOUT_BREAKPOINTS) {
    ok(
      persistedAfterAdd[id][breakpoint].x === persistedBeforeAdd[id][breakpoint].x &&
        persistedAfterAdd[id][breakpoint].y === persistedBeforeAdd[id][breakpoint].y,
      `stored position ${id}/${breakpoint} is untouched by the auto-populate pass`
    );
  }
  for (const breakpoint of ["sm", "md", "lg", "xl"]) {
    eq(
      persistedAfterAdd[id][breakpoint],
      persistedBeforeAdd[id][breakpoint],
      `desktop row ${id}/${breakpoint} is unchanged by the auto-populate pass`
    );
  }
}
eq(
  Object.keys(persistedAfterAdd).length,
  ITEM_ORDER.length + 1,
  "the payload gained exactly one row"
);
eq(
  afterAdd.items.map((item) => item.id),
  [...ITEM_ORDER, PORTFOLIO_ITEM("p-invitation")],
  "the new entry appears as the last row"
);

/* ── 5. deleting a portfolio entry prunes its rows ────────────────────────── */

db.__delete("p-siti");
const afterDelete = await buildDesktopLayoutState();

ok(afterDelete.changed, "deleting a portfolio entry rewrites the stored rows");
ok(!afterDelete.layout[PORTFOLIO_ITEM("p-siti")], "the deleted entry is gone from the coverage");
eq(
  (await db.listCmsEntries("layout", true))[0].data.items[PORTFOLIO_ITEM("p-siti")],
  undefined,
  "the deleted entry's rows are pruned from the persisted payload"
);
ok(
  allBreakpointsFilled(afterDelete.layout[PORTFOLIO_ITEM("p-invitation")]),
  "the surviving entries keep their rows"
);

/* ── 6. the edited row persists and wins on the render path ───────────────── */

const current = await buildDesktopLayoutState();
const editedOverlay = {
  ...current.layout,
  readme: { ...current.layout.readme, base: { x: 5, y: 55, width: 90 } },
};

const saved = await writeLayoutOverlay(editedOverlay);
eq(saved.itemCount, Object.keys(editedOverlay).length, "the save reports the row count it stored");

const reloaded = await buildDesktopLayoutState();
eq(
  reloaded.layout.readme.base,
  { x: 5, y: 55, width: 90 },
  "the edited row round-trips through the CMS entry"
);

const publishedEntry = (await db.listCmsEntries("layout"))[0];
const renderedWithCms = buildDesktopLayout(reloaded.inputs, {
  overlay: normalizeLayoutOverlay(publishedEntry.data),
});
eq(
  point(renderedWithCms.readme.base),
  { x: 5, y: 55, width: 90 },
  "the homepage render path reads the CMS row"
);
ok(
  renderedWithCms[PORTFOLIO_ITEM("p-lumona")].lg.x === 12 &&
    renderedWithCms[PORTFOLIO_ITEM("p-lumona")].lg.width === 170,
  "untouched rows still resolve from their stored value"
);

eq(
  normalizeLayoutOverlay({ items: { readme: { base: { x: 900, y: -40, width: 9999 } } } }),
  { readme: { base: { x: 100, y: 0, width: 400 } } },
  "an out-of-range stored row is clamped, so a saved row can never be off-screen"
);

/* ── 7. reset re-seeds from the generator ─────────────────────────────────── */

const beforeRowReset = await buildDesktopLayoutState();
const untouchedBefore = Object.fromEntries(
  Object.entries(beforeRowReset.layout).filter(([id]) => id !== "readme")
);

await resetDesktopLayoutRows(["readme"]);
const afterRowReset = await buildDesktopLayoutState();
ok(
  canon(afterRowReset.layout.readme) !== canon(beforeRowReset.layout.readme),
  "reset <id> drops the hand-edited row and re-seeds it from the generator"
);
eq(
  Object.fromEntries(Object.entries(afterRowReset.layout).filter(([id]) => id !== "readme")),
  untouchedBefore,
  "reset <id> leaves every other row alone"
);

await resetDesktopLayoutRows("all");
const afterAllReset = await buildDesktopLayoutState();
eq(
  afterAllReset.layout,
  ensureLayoutCoverage(afterAllReset.inputs, {}),
  "reset all reproduces the generated defaults exactly"
);
eq(
  normalizeLayoutOverlay((await db.listCmsEntries("layout", true))[0].data),
  afterAllReset.layout,
  "the persisted payload matches the resolved coverage"
);

/* ── 8. `about` keeps a row before its image exists ───────────────────────── */

const aboutWithoutImage = { ...ABOUT, data: { ...ABOUT.data, desktop: { ...ABOUT.data.desktop, image: "" } } };
db.__reset([aboutWithoutImage, WIFE]);
const beforeImage = await buildDesktopLayoutState();
const aboutRow = beforeImage.items.find((item) => item.id === "about");

ok(aboutRow, "`about` has a row even when nothing renders yet");
eq(aboutRow.rendered, false, "the row is flagged as not rendered");
ok(allBreakpointsFilled(beforeImage.layout.about), "the not-yet-rendered row is still filled");

/* ── report ────────────────────────────────────────────────────────────────── */

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} of ${checks} checks failed:\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`cms-desktop-layout: all checks passed (${checks} checks)`);
