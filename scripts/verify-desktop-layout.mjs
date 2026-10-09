/**
 * Verification for `src/lib/desktop-layout.ts`.
 *
 * Run with:  npm run verify:layout
 * (`node --experimental-strip-types scripts/verify-desktop-layout.mjs`)
 *
 * Checks, across a matrix of viewports × item counts × breakpoints:
 *   1. every item resolves to a layout at every breakpoint
 *   2. no icon leaves the padding-safe desktop area (up to the layout capacity)
 *   3. no two icons ever overlap
 *   4. a brand-new portfolio entry (no CMS coordinates) gets a generated row
 *   5. CMS x/y are honoured, and clamped into the viewport when out of range
 *   6. generation is deterministic, and differs between breakpoints
 */
import {
  buildDesktopLayout,
  DESKTOP_LAYOUT,
  desktopLayoutCapacity,
  estimateIconBox,
  ensurePortfolioLayout,
  LAYOUT_AREA_PADDING,
  LAYOUT_BREAKPOINTS,
  planDesktopGrid,
  portfolioItemId,
  resolveDesktopItemLayout,
} from "../src/lib/desktop-layout.ts";

const README = { id: "readme" };
const CV = { id: "cv" };
const WIFE = { id: "wife", x: 28, y: 8, width: 140, imageAspect: 4 / 3 };
const ABOUT = { id: "about", x: 44, y: 8, width: 150 };

/** CMS-placed entries: one has a mobile override, the rest never got one.
 *  Aspects mirror the real CMS media metadata (landscape thumbs + a portrait). */
const CMS_PORTFOLIO = [
  { id: "cms-desktop-lumona", x: 12, y: 34, width: 170, mobileX: 9, mobileY: 40, imageAspect: 240 / 320 },
  { id: "cms-desktop-siti", x: 30, y: 52, width: 170, imageAspect: 340 / 260 },
  { id: "cms-desktop-invitation", x: 78, y: 70, width: 170, imageAspect: 260 / 300 },
];

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/** Items whose position is curated or CMS-authored (not generated). */
function isFixed(item, breakpoint) {
  if (DESKTOP_LAYOUT[item.id]?.[breakpoint]) return true;
  if (breakpoint === "base") return isFiniteNumber(item.mobileX) && isFiniteNumber(item.mobileY);
  return isFiniteNumber(item.x) && isFiniteNumber(item.y);
}

/** Realistic item list: N portfolio entries, some CMS-placed, some brand new. */
function buildItems(portfolioCount) {
  const placed = CMS_PORTFOLIO.slice(0, Math.max(0, portfolioCount - 3));
  const fresh = [];
  for (let i = 0; i < Math.min(3, portfolioCount); i += 1) {
    fresh.push({ id: portfolioItemId(`auto-${i}`) });
  }
  return [README, CV, WIFE, ABOUT, ...placed, ...fresh].slice(0, 4 + portfolioCount);
}

const VIEWPORTS = {
  base: [
    { width: 320, height: 568, label: "iPhone SE 1st gen" },
    { width: 360, height: 640, label: "small Android" },
    { width: 390, height: 844, label: "iPhone 14" },
    { width: 430, height: 932, label: "iPhone 15 Pro Max" },
    { width: 600, height: 900, label: "foldable outer" },
  ],
  sm: [
    { width: 640, height: 800, label: "phone landscape / small tablet" },
    { width: 700, height: 900, label: "small tablet" },
  ],
  md: [
    { width: 768, height: 700, label: "tablet portrait" },
    { width: 1023, height: 768, label: "tablet landscape" },
  ],
  lg: [
    { width: 1024, height: 768, label: "laptop 1024" },
    { width: 1279, height: 900, label: "laptop 1279" },
  ],
  xl: [
    { width: 1280, height: 800, label: "desktop 1280" },
    { width: 1920, height: 1080, label: "desktop 1920" },
  ],
};

const failures = [];
let checks = 0;
let overflowCases = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function rectFor(point, breakpoint, viewport) {
  const box = estimateIconBox(point, breakpoint);
  return {
    x: (point.x / 100) * viewport.width,
    y: (point.y / 100) * viewport.height,
    width: box.width,
    height: box.height,
  };
}

for (const breakpoint of LAYOUT_BREAKPOINTS) {
  for (const viewport of VIEWPORTS[breakpoint]) {
    for (let portfolioCount = 0; portfolioCount <= 16; portfolioCount += 1) {
      const items = buildItems(portfolioCount);
      const layout = buildDesktopLayout(items, { activeBreakpoint: breakpoint, viewport });
      const padding = LAYOUT_AREA_PADDING[breakpoint];
      const label = `${breakpoint} ${viewport.width}x${viewport.height} portfolio=${portfolioCount}`;

      const entries = [];
      for (const item of items) {
        const point = resolveDesktopItemLayout(layout, item.id, breakpoint);
        check(Boolean(point), `${label}: no layout for ${item.id}`);
        if (!point) continue;
        entries.push({ id: item.id, point, rect: rectFor(point, breakpoint, viewport), fixed: isFixed(item, breakpoint) });
      }

      const fixedRect = entries.filter((entry) => entry.fixed).map((entry) => entry.rect);
      const generated = entries.filter((entry) => !entry.fixed);

      // 2. in-bounds — guaranteed while the generated count fits the capacity.
      // Past that the area is physically full: icons keep their spacing and run
      // past the fold (still never overlapping); report those as info.
      const capacity = desktopLayoutCapacity(breakpoint, viewport, fixedRect);
      const withinCapacity = generated.length <= capacity;
      const bounded = withinCapacity ? entries : entries.filter((entry) => entry.fixed || generated.indexOf(entry) < capacity);
      if (!withinCapacity) overflowCases += 1;

      for (const { id, point, rect } of bounded) {
        check(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100, `${label}: ${id} percent out of range`);
        check(rect.x >= padding.side - 1, `${label}: ${id} left edge ${rect.x.toFixed(1)} < ${padding.side}`);
        check(
          rect.x + rect.width <= viewport.width - padding.side + 1,
          `${label}: ${id} right edge ${(rect.x + rect.width).toFixed(1)} > ${viewport.width - padding.side}`
        );
        check(rect.y >= padding.top - 1, `${label}: ${id} top edge ${rect.y.toFixed(1)} < ${padding.top}`);
        check(
          rect.y + rect.height <= viewport.height - padding.bottom + 1,
          `${label}: ${id} bottom edge ${(rect.y + rect.height).toFixed(1)} > ${viewport.height - padding.bottom}`
        );
      }

      // 3. never overlap, at any count
      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const a = entries[i].rect;
          const b = entries[j].rect;
          const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
          check(!overlaps, `${label}: ${entries[i].id} overlaps ${entries[j].id}`);
        }
      }

      // 6. determinism
      const again = buildDesktopLayout(items, { activeBreakpoint: breakpoint, viewport });
      check(JSON.stringify(again) === JSON.stringify(layout), `${label}: generation is not deterministic`);
    }
  }
}

// 4. new portfolio entry → generated row at every breakpoint, no manual config
const freshLayout = ensurePortfolioLayout(["brand-new-entry"], { viewport: { width: 390, height: 844 } });
for (const breakpoint of LAYOUT_BREAKPOINTS) {
  const point = freshLayout[portfolioItemId("brand-new-entry")]?.[breakpoint];
  check(Boolean(point), `ensurePortfolioLayout: missing ${breakpoint} row for a new entry`);
  check(point?.width > 0, `ensurePortfolioLayout: ${breakpoint} row has no width`);
}

// 5. curated + CMS precedence
const precedenceLayout = buildDesktopLayout(
  [{ id: "readme" }, { id: "wife", x: 90, y: 92, width: 170 }, { id: "cms-desktop-x", x: 96, y: 95, width: 170 }],
  { activeBreakpoint: "sm", viewport: { width: 640, height: 800 } }
);
check(precedenceLayout.readme.sm?.x === DESKTOP_LAYOUT.readme.sm.x, "curated readme position was not applied");
check(
  precedenceLayout.wife?.sm?.x !== 90 || precedenceLayout.wife?.sm?.y !== 92,
  "an off-screen CMS position must be clamped"
);
const clamped = precedenceLayout["cms-desktop-x"].sm;
const clampedRect = rectFor(clamped, "sm", { width: 640, height: 800 });
check(clampedRect.x + clampedRect.width <= 640 - LAYOUT_AREA_PADDING.sm.side + 1, "off-screen CMS x was not clamped");
check(clampedRect.y + clampedRect.height <= 800 - LAYOUT_AREA_PADDING.sm.bottom + 1, "off-screen CMS y was not clamped");
check(precedenceLayout["cms-desktop-x"].base?.x !== undefined, "unplaced CMS item should also get a generated mobile row");

// 6b. generated layout differs per breakpoint
const multi = buildDesktopLayout([{ id: "cms-desktop-z" }]);
const perBreakpoint = LAYOUT_BREAKPOINTS.map((breakpoint) => JSON.stringify(multi["cms-desktop-z"][breakpoint]));
check(new Set(perBreakpoint).size > 1, "generated layout is identical across all breakpoints");

console.log(`checks run: ${checks}`);
if (overflowCases > 0) {
  console.log(`note: ${overflowCases} viewport/count combinations exceed the desktop-area capacity`);
  console.log("      (icons keep spacing and run past the fold there; never overlapping)");
}
console.log("\ncapacity (generated icons that fit, no occupied items):");
for (const breakpoint of LAYOUT_BREAKPOINTS) {
  for (const viewport of VIEWPORTS[breakpoint]) {
    const plan = planDesktopGrid(breakpoint, viewport, 1, []);
    console.log(
      `  ${breakpoint.padEnd(4)} ${String(viewport.width).padStart(4)}x${String(viewport.height).padEnd(4)} tier=${plan.tier.padEnd(
        8
      )} ${plan.columns}x${plan.rows} cells, icon ${plan.iconWidth}px`
    );
  }
}

if (failures.length > 0) {
  console.error(`\nFAILED (${failures.length}):`);
  for (const failure of failures.slice(0, 40)) console.error(` - ${failure}`);
  if (failures.length > 40) console.error(` ...and ${failures.length - 40} more`);
  process.exit(1);
}
console.log("\ndesktop-layout: all checks passed");
