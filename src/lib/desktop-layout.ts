import type { DesktopItem } from "./types";

/**
 * Desktop icon layout module — the single source of truth for where desktop
 * icons sit.
 *
 * Everything that used to scatter coordinates across the codebase (the
 * hardcoded `MOBILE_ICON_POSITIONS` scatter, the inline `10 + index * 8`
 * fallback in `HomeClient`, the ad-hoc 2-mode viewport check) now resolves
 * through here.
 *
 * ## Units
 * `x` / `y` are **percentages of the desktop area** (the `inset-0` container in
 * `HomeClient`), matching `DesktopIcon`'s `left: x%` / `top: y%`. `width` and
 * `imageHeight` are pixels.
 *
 * ## Breakpoints
 * `base` (<640, phones) plus the default Tailwind scale `sm` 640 / `md` 768 /
 * `lg` 1024 / `xl` 1280.
 *
 * ## Resolution precedence (per item, per breakpoint)
 * 1. **CMS "Desktop Layout" module** — `options.overlay[itemId][breakpoint]`,
 *    persisted in the `layout` CMS entry and edited in `/admin`. This is the
 *    primary, content-editable source (`desktop-layout-cms.ts` owns the entry,
 *    `normalizeLayoutOverlay` owns its validation).
 * 2. `DESKTOP_LAYOUT[id][breakpoint]` — curated config in this module.
 * 3. Legacy CMS `desktop.mobile.{x,y}` for `base`, `desktop.{x,y,width}` for the
 *    desktop breakpoints (`width` scaled by `DESKTOP_WIDTH_SCALE`). This is the
 *    backward-compat channel, so existing CMS placement keeps working without
 *    touching the module or the layout entry.
 * 4. Auto-generated slot from `buildDesktopLayout` — deterministic, packed into
 *    a grid that avoids (1)–(3) and never leaves the viewport.
 * 5. The caller-supplied `fallback` passed to `resolveDesktopItemLayout`.
 *
 * A position that survives clamping but still collides with an already-placed
 * item is *not* forced onto the screen: it is demoted to (4) so the generator
 * places it. Overlap is therefore impossible, whatever the overlay contains.
 *
 * Portfolio entries therefore always have a row: `buildDesktopLayout` walks the
 * entry list and generates a non-overlapping default slot for any id that has
 * neither a layout row, a curated config, nor CMS coordinates — a new CMS entry
 * needs zero manual layout work. `ensureLayoutCoverage` exposes the same
 * generator, materialised as storable `{ x, y, width }` rows for every item and
 * every breakpoint.
 *
 * ## Backward compatibility
 * Existing CMS `desktop.x/y/mobile` values are honoured (precedence 3) but
 * clamped into the padding-safe box, so a legacy entry sitting at `x: 95` on a
 * narrow `sm` viewport is pulled back on screen instead of clipping.
 */

export type LayoutBreakpoint = "base" | "sm" | "md" | "lg" | "xl";

export const LAYOUT_BREAKPOINTS: LayoutBreakpoint[] = ["base", "sm", "md", "lg", "xl"];

export interface LayoutBreakpointDef {
  /** Inclusive lower bound of the viewport width in px. */
  minWidth: number;
  /** Inclusive upper bound, `null` for the open-ended top breakpoint. */
  maxWidth: number | null;
  /** `matchMedia` query that matches exactly while this breakpoint is active. */
  mediaQuery: string;
}

/** Mirrors the default Tailwind breakpoints — there is no `tailwind.config.*`. */
export const LAYOUT_BREAKPOINT_DEFS: Record<LayoutBreakpoint, LayoutBreakpointDef> = {
  base: { minWidth: 0, maxWidth: 639, mediaQuery: "(max-width: 639px)" },
  sm: { minWidth: 640, maxWidth: 767, mediaQuery: "(min-width: 640px) and (max-width: 767px)" },
  md: { minWidth: 768, maxWidth: 1023, mediaQuery: "(min-width: 768px) and (max-width: 1023px)" },
  lg: { minWidth: 1024, maxWidth: 1279, mediaQuery: "(min-width: 1024px) and (max-width: 1279px)" },
  xl: { minWidth: 1280, maxWidth: null, mediaQuery: "(min-width: 1280px)" },
};

/** `matchMedia` queries for the active-breakpoint listener in `HomeClient`. */
export function layoutBreakpointQueries() {
  return LAYOUT_BREAKPOINTS.map((breakpoint) => ({
    breakpoint,
    query: LAYOUT_BREAKPOINT_DEFS[breakpoint].mediaQuery,
  }));
}

/** Widest matching breakpoint wins, so 1440 → `xl`, 700 → `sm`. */
export function resolveLayoutBreakpoint(width: number): LayoutBreakpoint {
  for (let i = LAYOUT_BREAKPOINTS.length - 1; i >= 0; i -= 1) {
    const breakpoint = LAYOUT_BREAKPOINTS[i];
    if (width >= LAYOUT_BREAKPOINT_DEFS[breakpoint].minWidth) return breakpoint;
  }
  return "base";
}

export interface DesktopItemLayout {
  /** Left offset, percent of the desktop area width. */
  x: number;
  /** Top offset, percent of the desktop area height. */
  y: number;
  /** Icon box width in px. */
  width?: number;
  /** Exact image height in px for the compact (mobile) icon rendering. */
  imageHeight?: number;
  /** Icon image aspect ratio (height ÷ width) when known, from CMS media
   *  metadata. Used to size the reserved box so tall images can't collide. */
  aspect?: number;
}

/** One item's position for each breakpoint it is explicitly configured for. */
export type DesktopLayoutConfig = Partial<Record<LayoutBreakpoint, DesktopItemLayout>>;
export type DesktopLayoutMap = Record<string, DesktopLayoutConfig>;

/** Structurally satisfied by `DesktopItem`; CMS values act as overrides. */
export interface LayoutItemInput {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  mobileX?: number;
  mobileY?: number;
  /** Icon image aspect ratio (height ÷ width) from CMS media metadata. */
  imageAspect?: number;
}

export interface LayoutViewport {
  width: number;
  height: number;
}

export interface BuildLayoutOptions {
  /** Breakpoint rendered right now — it uses the live `viewport`. */
  activeBreakpoint?: LayoutBreakpoint | null;
  /** Live viewport in px. Ignored (reference sizes used) when zero/absent. */
  viewport?: LayoutViewport | null;
  /**
   * Per-item, per-breakpoint rows authored in the CMS **Desktop Layout**
   * module (the `layout` entry) — the primary source, precedence 1.
   * `normalizeLayoutOverlay(entry.data)` produces this shape.
   */
  overlay?: DesktopLayoutMap | null;
}

export const MOBILE_ICON_WIDTH = 120;
export const MOBILE_ICON_IMAGE_HEIGHT = 96;
export const DESKTOP_DEFAULT_ICON_WIDTH = 170;
/**
 * Assumed image aspect (height ÷ width) for desktop icons when the CMS has no
 * Measured against the real icons: the document SVGs and the
 * profile photos are 3:4 (1.33), portfolio thumbs are 4:3 (0.75). CMS media
 * metadata overrides this per item; for anything without metadata `DesktopIcon`
 * caps the rendered image height with it, so a portrait upload keeps its
 * reserved box and a taller one shrinks instead of overlapping.
 */
export const DESKTOP_DEFAULT_IMAGE_ASPECT = 4 / 3;
/** Image + label/padding box heights, measured from the rendered icons. */
export const MOBILE_LABEL_HEIGHT = 38;
export const DESKTOP_LABEL_HEIGHT = 34;

/** Tablet-ish breakpoints keep the icon slightly smaller, as before. */
export const DESKTOP_WIDTH_SCALE: Record<LayoutBreakpoint, number> = {
  base: 1,
  sm: 0.8,
  md: 0.8,
  lg: 1,
  xl: 1,
};

/**
 * Compact (phone) icon image height ÷ width — the `cozy` tier ratio (96/120).
 * A CMS-authored `base` row only stores `width`, so the height is derived with
 * this ratio, keeping small phones proportional when a crowded tier shrinks.
 */
export const MOBILE_ICON_IMAGE_RATIO = MOBILE_ICON_IMAGE_HEIGHT / MOBILE_ICON_WIDTH;

/** Bounds for a CMS-authored icon box width, in px. */
export const LAYOUT_ROW_WIDTH_MIN = 60;
export const LAYOUT_ROW_WIDTH_MAX = 400;

/** Padding of `#tour-desktop-area` (`pt-16 pb-28 px-4` vs `pt-8 pb-20 px-4`). */
export const LAYOUT_AREA_PADDING: Record<LayoutBreakpoint, { top: number; bottom: number; side: number }> = {
  base: { top: 64, bottom: 112, side: 16 },
  sm: { top: 32, bottom: 80, side: 16 },
  md: { top: 32, bottom: 80, side: 16 },
  lg: { top: 32, bottom: 80, side: 16 },
  xl: { top: 32, bottom: 80, side: 16 },
};

/**
 * Viewport used to generate slots for breakpoints that are not on screen (and
 * during SSR, where there is no viewport yet) — keeps the generated layout
 * deterministic and hydration-safe.
 */
export const LAYOUT_REFERENCE_VIEWPORT: Record<LayoutBreakpoint, LayoutViewport> = {
  base: { width: 390, height: 844 },
  sm: { width: 700, height: 900 },
  md: { width: 900, height: 800 },
  lg: { width: 1152, height: 800 },
  xl: { width: 1440, height: 900 },
};

/**
 * Curated, hand-tuned positions — the editing surface for per-breakpoint
 * placement. Items that are not listed here resolve from CMS values and then
 * from the generated grid.
 *
 * `readme` and `cv` live only here: they have no CMS entry, so this map is
 * their single source of truth.
 */
export const DESKTOP_LAYOUT: DesktopLayoutMap = {
  readme: {
    base: { x: 8, y: 11, width: MOBILE_ICON_WIDTH, imageHeight: MOBILE_ICON_IMAGE_HEIGHT },
    sm: { x: 6, y: 14, width: 120, aspect: 4 / 3 },
    md: { x: 5, y: 14, width: 130, aspect: 4 / 3 },
    lg: { x: 5, y: 12, width: 150, aspect: 4 / 3 },
    xl: { x: 5, y: 12, width: 150, aspect: 4 / 3 },
  },
  cv: {
    base: { x: 50, y: 62, width: MOBILE_ICON_WIDTH, imageHeight: MOBILE_ICON_IMAGE_HEIGHT },
    sm: { x: 68, y: 66, width: 120, aspect: 4 / 3 },
    md: { x: 64, y: 64, width: 130, aspect: 4 / 3 },
    lg: { x: 62, y: 58, width: 160, aspect: 4 / 3 },
    xl: { x: 62, y: 58, width: 160, aspect: 4 / 3 },
  },
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridTier {
  id: string;
  iconWidth: number;
  /** Compact image height; only meaningful for `base`. */
  imageHeight?: number;
  gapX: number;
  gapY: number;
}

/**
 * Mobile tiers, largest first. `buildDesktopLayout` picks the first tier that
 * fits the item count on the current viewport, so a phone with four icons keeps
 * the roomy look while a busy desktop area shrinks instead of overlapping.
 */
const MOBILE_GRID_TIERS: GridTier[] = [
  { id: "cozy", iconWidth: 120, imageHeight: 96, gapX: 18, gapY: 16 },
  { id: "dense", iconWidth: 104, imageHeight: 83, gapX: 16, gapY: 12 },
  { id: "compact", iconWidth: 88, imageHeight: 70, gapX: 14, gapY: 10 },
  { id: "mini", iconWidth: 76, imageHeight: 61, gapX: 12, gapY: 8 },
];

/** Desktop tiers, scaling the icon box down when the viewport is crowded. */
const DESKTOP_GRID_SCALES = [1, 0.85, 0.7, 0.55, 0.45];

interface GridPlan {
  tier: string;
  columns: number;
  rows: number;
  iconWidth: number;
  imageHeight?: number;
  boxWidth: number;
  boxHeight: number;
  stepX: number;
  stepY: number;
  originX: number;
  originY: number;
  capacity: number;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Item ids are dynamic keys, so the mapped type needs a widening cast. */
function setItemPoint(config: DesktopLayoutConfig, itemId: string, point: DesktopItemLayout) {
  (config as Record<string, DesktopItemLayout>)[itemId] = point;
}

/**
 * Image height the icon will be allowed to occupy, in px: exact for compact
 * (mobile) rendering, `aspect × width` for desktop. `HomeClient` forwards this
 * to `DesktopIcon` as a hard max-height, so a taller-than-assumed image is
 * scaled down instead of colliding with its neighbours.
 */
export function estimateImageHeight(point: DesktopItemLayout, breakpoint: LayoutBreakpoint): number {
  if (breakpoint === "base") return point.imageHeight ?? MOBILE_ICON_IMAGE_HEIGHT;
  const width = point.width ?? DESKTOP_DEFAULT_ICON_WIDTH;
  return Math.round(width * (point.aspect ?? DESKTOP_DEFAULT_IMAGE_ASPECT));
}

/** Icon box (image + label) in px, used for bounds and overlap checks. */
export function estimateIconBox(point: DesktopItemLayout, breakpoint: LayoutBreakpoint): { width: number; height: number } {
  const width = point.width ?? (breakpoint === "base" ? MOBILE_ICON_WIDTH : DESKTOP_DEFAULT_ICON_WIDTH);
  const label = breakpoint === "base" ? MOBILE_LABEL_HEIGHT : DESKTOP_LABEL_HEIGHT;
  return { width, height: estimateImageHeight(point, breakpoint) + label };
}

function pointToRect(point: DesktopItemLayout, breakpoint: LayoutBreakpoint, viewport: LayoutViewport): Rect {
  const box = estimateIconBox(point, breakpoint);
  return {
    x: (point.x / 100) * viewport.width,
    y: (point.y / 100) * viewport.height,
    width: box.width,
    height: box.height,
  };
}

/** Pulls a position back inside the padding-safe box. */
function clampPoint(point: DesktopItemLayout, breakpoint: LayoutBreakpoint, viewport: LayoutViewport): DesktopItemLayout {
  const box = estimateIconBox(point, breakpoint);
  const padding = LAYOUT_AREA_PADDING[breakpoint];
  const maxX = Math.max(padding.side, viewport.width - box.width - padding.side);
  const maxY = Math.max(padding.top, viewport.height - box.height - padding.bottom);
  const xPx = clamp((point.x / 100) * viewport.width, padding.side, maxX);
  const yPx = clamp((point.y / 100) * viewport.height, padding.top, maxY);
  return {
    ...point,
    x: round2((xPx / viewport.width) * 100),
    y: round2((yPx / viewport.height) * 100),
  };
}

function rectsOverlap(a: Rect, b: Rect, margin: number) {
  return a.x < b.x + b.width + margin && a.x + a.width + margin > b.x && a.y < b.y + b.height + margin && a.y + a.height + margin > b.y;
}

function planTier(tier: GridTier, breakpoint: LayoutBreakpoint, viewport: LayoutViewport): GridPlan {
  const padding = LAYOUT_AREA_PADDING[breakpoint];
  const usableWidth = Math.max(viewport.width - padding.side * 2, 1);
  const usableHeight = Math.max(viewport.height - padding.top - padding.bottom, 1);

  const boxWidth = Math.max(1, Math.round(tier.iconWidth));
  const boxHeight =
    breakpoint === "base"
      ? (tier.imageHeight ?? MOBILE_ICON_IMAGE_HEIGHT) + MOBILE_LABEL_HEIGHT
      : Math.round(boxWidth * DESKTOP_DEFAULT_IMAGE_ASPECT) + DESKTOP_LABEL_HEIGHT;

  const columns = Math.max(1, Math.floor((usableWidth + tier.gapX) / (boxWidth + tier.gapX)));
  const rows = Math.max(1, Math.floor((usableHeight + tier.gapY) / (boxHeight + tier.gapY)));

  // Spread cells across the usable box so the layout uses the whole screen
  // (never tighter than the tier's minimum gap, by construction of `columns`).
  const stepX = columns > 1 ? (usableWidth - boxWidth) / (columns - 1) : 0;
  const stepY = rows > 1 ? (usableHeight - boxHeight) / (rows - 1) : 0;

  return {
    tier: tier.id,
    columns,
    rows,
    iconWidth: boxWidth,
    imageHeight: breakpoint === "base" ? tier.imageHeight ?? MOBILE_ICON_IMAGE_HEIGHT : undefined,
    boxWidth,
    boxHeight,
    stepX,
    stepY,
    originX: padding.side,
    originY: padding.top,
    capacity: columns * rows,
  };
}

/** Counts grid cells that are still free once curated/CMS items are placed. */
function countFreeCells(plan: GridPlan, occupied: Rect[]): number {
  let free = 0;
  for (let row = 0; row < plan.rows; row += 1) {
    for (let column = 0; column < plan.columns; column += 1) {
      const cell: Rect = {
        x: plan.originX + column * plan.stepX,
        y: plan.originY + row * plan.stepY,
        width: plan.boxWidth,
        height: plan.boxHeight,
      };
      if (!occupied.some((rect) => rectsOverlap(cell, rect, 8))) free += 1;
    }
  }
  return free;
}

function gridTiers(breakpoint: LayoutBreakpoint): GridTier[] {
  if (breakpoint === "base") return MOBILE_GRID_TIERS;
  return DESKTOP_GRID_SCALES.map((scale) => ({
    id: `scale-${scale}`,
    iconWidth: Math.round(DESKTOP_DEFAULT_ICON_WIDTH * scale),
    gapX: 20,
    gapY: 18,
  }));
}

/**
 * Largest tier that still has `needed` free cells next to the curated/CMS
 * items; falls back to whichever tier leaves the most room.
 */
function planGrid(breakpoint: LayoutBreakpoint, viewport: LayoutViewport, needed: number, occupied: Rect[]): GridPlan {
  const plans = gridTiers(breakpoint).map((tier) => planTier(tier, breakpoint, viewport));

  let best = plans[plans.length - 1];
  let bestFree = countFreeCells(best, occupied);

  for (const plan of plans) {
    const free = countFreeCells(plan, occupied);
    if (free >= needed) return plan;
    if (free > bestFree) {
      best = plan;
      bestFree = free;
    }
  }

  return best;
}

export interface DesktopGridPlan {
  tier: string;
  columns: number;
  rows: number;
  /** Free cells once `occupied` (curated/CMS) items are accounted for. */
  capacity: number;
  iconWidth: number;
  boxHeight: number;
}

/**
 * How many *generated* icons fit on a breakpoint/viewport next to the given
 * occupied boxes. Exposed for diagnostics and for the verification script —
 * beyond this the desktop area is physically full and icons run past the fold
 * (never overlapping).
 */
export function planDesktopGrid(
  breakpoint: LayoutBreakpoint,
  viewport: LayoutViewport,
  needed = 0,
  occupied: Rect[] = []
): DesktopGridPlan {
  const plan = planGrid(breakpoint, viewport, needed, occupied);
  return {
    tier: plan.tier,
    columns: plan.columns,
    rows: plan.rows,
    capacity: countFreeCells(plan, occupied),
    iconWidth: plan.iconWidth,
    boxHeight: plan.boxHeight,
  };
}

/** Maximum number of generated icons for a breakpoint/viewport. */
export function desktopLayoutCapacity(breakpoint: LayoutBreakpoint, viewport: LayoutViewport, occupied: Rect[] = []): number {
  return Math.max(...gridTiers(breakpoint).map((tier) => countFreeCells(planTier(tier, breakpoint, viewport), occupied)), 0);
}


function placeItems(
  items: LayoutItemInput[],
  plan: GridPlan,
  viewport: LayoutViewport,
  occupied: Rect[]
): Record<string, DesktopItemLayout> {
  const result: Record<string, DesktopItemLayout> = {};
  const margin = 8;
  let rows = plan.rows;
  let stepY = plan.stepY;
  let cell = 0;

  for (const item of items) {
    let placed = false;
    let guard = 0;

    while (!placed && guard < 5000) {
      guard += 1;
      const row = Math.floor(cell / plan.columns);
      const column = cell % plan.columns;
      cell += 1;

      if (row >= rows) {
        // Every planned cell was taken by a curated/CMS item: keep the same
        // vertical rhythm below the grid instead of stacking icons on top of
        // each other. Only reachable when capacity < item count.
        rows = row + 1;
        stepY = plan.boxHeight + 16;
      }

      const xPx = plan.originX + column * plan.stepX;
      const yPx = plan.originY + row * stepY;
      const candidate: Rect = { x: xPx, y: yPx, width: plan.boxWidth, height: plan.boxHeight };
      if (occupied.some((rect) => rectsOverlap(candidate, rect, margin))) continue;

      occupied.push(candidate);
      result[item.id] = {
        x: round2((xPx / viewport.width) * 100),
        y: round2((yPx / viewport.height) * 100),
        width: plan.iconWidth,
        ...(plan.imageHeight ? { imageHeight: plan.imageHeight } : {}),
      };
      placed = true;
    }

    if (!placed) {
      // Documented last resort: the desktop area is full for this breakpoint.
      // Never overlaps — it just runs past the fold.
      const row = rows;
      const xPx = plan.originX;
      const yPx = plan.originY + row * (plan.boxHeight + 16);
      rows += 1;
      occupied.push({ x: xPx, y: yPx, width: plan.boxWidth, height: plan.boxHeight });
      result[item.id] = {
        x: round2((xPx / viewport.width) * 100),
        y: round2((yPx / viewport.height) * 100),
        width: plan.iconWidth,
        ...(plan.imageHeight ? { imageHeight: plan.imageHeight } : {}),
      };
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[desktop-layout] No free slot left for "${item.id}" — the desktop area is full at this breakpoint.`);
      }
    }
  }

  return result;
}

/** CMS-authored placement for one breakpoint, clamped, or `null` when unset. */
function cmsPoint(item: LayoutItemInput, breakpoint: LayoutBreakpoint, viewport: LayoutViewport): DesktopItemLayout | null {
  const aspect = isFiniteNumber(item.imageAspect) && item.imageAspect > 0 ? item.imageAspect : undefined;

  if (breakpoint === "base") {
    if (!isFiniteNumber(item.mobileX) || !isFiniteNumber(item.mobileY)) return null;
    return clampPoint(
      { x: item.mobileX, y: item.mobileY, width: MOBILE_ICON_WIDTH, imageHeight: MOBILE_ICON_IMAGE_HEIGHT },
      breakpoint,
      viewport
    );
  }

  if (!isFiniteNumber(item.x) || !isFiniteNumber(item.y)) return null;
  const baseWidth = isFiniteNumber(item.width) ? item.width : DESKTOP_DEFAULT_ICON_WIDTH;
  return clampPoint(
    {
      x: item.x,
      y: item.y,
      width: Math.round(baseWidth * DESKTOP_WIDTH_SCALE[breakpoint]),
      ...(aspect ? { aspect } : {}),
    },
    breakpoint,
    viewport
  );
}

function cloverlaps(point: DesktopItemLayout, breakpoint: LayoutBreakpoint, viewport: LayoutViewport, placed: Rect[], margin: number) {
  const rect = pointToRect(point, breakpoint, viewport);
  return placed.some((other) => rectsOverlap(rect, other, margin));
}

/**
 * Curated/CMS positions are honoured when they fit. When two of them collide —
 * e.g. two desktop percentages landing on the same spot on a narrow `sm`
 * viewport — the later item is nudged to the nearest free offset (right, down,
 * left, up, then diagonals) instead of stacking. Returns `null` when no offset
 * works, so the caller can hand the item to the generator rather than render an
 * overlap.
 */
function declutterFixedPoint(
  point: DesktopItemLayout,
  breakpoint: LayoutBreakpoint,
  viewport: LayoutViewport,
  placed: Rect[]
): DesktopItemLayout | null {
  const base = clampPoint(point, breakpoint, viewport);
  if (!cloverlaps(base, breakpoint, viewport, placed, 0)) return base;

  const box = estimateIconBox(base, breakpoint);
  const polar = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  const baseRect = pointToRect(base, breakpoint, viewport);

  for (let step = 1; step <= 16; step += 1) {
    for (const [dx, dy] of polar) {
      const candidate = clampPoint(
        {
          ...base,
          x: base.x + ((dx * step * (box.width + 16)) / viewport.width) * 100,
          y: base.y + ((dy * step * (box.height + 16)) / viewport.height) * 100,
        },
        breakpoint,
        viewport
      );
      const rect = pointToRect(candidate, breakpoint, viewport);
      const moved = Math.abs(rect.x - baseRect.x) > 0.5 || Math.abs(rect.y - baseRect.y) > 0.5;
      if (!moved) continue;
      if (!placed.some((other) => rectsOverlap(rect, other, 0))) return candidate;
    }
  }

  // Every offset is taken: report failure so the caller exposes the item to the
  // generator (deterministic slot, in bounds, no overlap) instead of stacking.
  return null;
}

/**
 * Builds the full layout map: CMS Desktop Layout rows, curated config, legacy CMS
 * overrides, and a generated slot for every remaining item — for every breakpoint.
 *
 * Pass `activeBreakpoint` + the live `viewport` and the on-screen breakpoint is
 * generated against the real viewport; the others use their reference viewport
 * so the result stays deterministic (SSR-safe).
 */
export function buildDesktopLayout(items: LayoutItemInput[], options: BuildLayoutOptions = {}): DesktopLayoutMap {
  const activeBreakpoint = options.activeBreakpoint ?? null;
  const liveViewport =
    options.viewport && options.viewport.width > 0 && options.viewport.height > 0 ? options.viewport : null;
  // CMS Desktop Layout rows — precedence 1 for every item they cover.
  const overlay = options.overlay ?? null;

  const layout: DesktopLayoutMap = {};

  /** Resolves every item for one breakpoint. `rows` may be disabled to measure
   *  what the module manages on its own. */
  const resolveBreakpoint = (
    breakpoint: LayoutBreakpoint,
    viewport: LayoutViewport,
    rows: DesktopLayoutMap | null
  ) => {
    const occupied: Rect[] = [];
    const fixed: Array<{ item: LayoutItemInput; point: DesktopItemLayout }> = [];
    const pending: LayoutItemInput[] = [];
    const config: DesktopLayoutConfig = {};

    // Phase 1 — resolve every authored point (CMS row → curated → legacy CMS) at
    // its own size and de-collide it against the ones already placed.
    for (const item of items) {
      const candidate =
        overlayPoint(item, rows?.[item.id]?.[breakpoint], breakpoint, viewport) ??
        DESKTOP_LAYOUT[item.id]?.[breakpoint] ??
        cmsPoint(item, breakpoint, viewport);

      const placed = candidate ? declutterFixedPoint(candidate, breakpoint, viewport, occupied) : null;
      if (!placed) {
        // Nothing authored for this breakpoint, or the authored position cannot
        // be placed without colliding: let the generator give it a slot instead
        // of stacking icons on top of each other.
        pending.push(item);
        continue;
      }

      fixed.push({ item, point: placed });
      setItemPoint(config, item.id, placed);
      occupied.push(pointToRect(placed, breakpoint, viewport));
    }

    // Phase 2 — phones: one tier size for the whole grid. The tier is chosen
    // while the authored boxes still reserve their original space, so a crowded
    // phone shrinks uniformly instead of running past the fold — and the choice
    // depends only on the item set, so persisting rows can never move icons.
    const baseSize = (() => {
      if (breakpoint !== "base" || items.length === 0) return null;
      const plan = planGrid(breakpoint, viewport, pending.length, occupied);
      if (plan.iconWidth >= MOBILE_ICON_WIDTH) return null;
      return {
        plan,
        width: plan.iconWidth,
        // Derived from the width so a stored row (which keeps only `x`, `y`,
        // `width`) reproduces the exact same box when it is read back.
        imageHeight: Math.round(plan.iconWidth * MOBILE_ICON_IMAGE_RATIO),
      };
    })();

    if (baseSize) {
      // Replacing a box with a smaller one cannot invalidate a position, so the
      // de-collided `x`/`y` are kept as they are.
      for (const { item, point } of fixed) {
        setItemPoint(config, item.id, {
          ...point,
          width: baseSize.width,
          imageHeight: baseSize.imageHeight,
        });
      }
    }

    if (pending.length > 0) {
      if (baseSize) {
        occupied.length = 0;
        for (const { point } of fixed) {
          occupied.push(
            pointToRect(
              { ...point, width: baseSize.width, imageHeight: baseSize.imageHeight },
              breakpoint,
              viewport
            )
          );
        }
      }

      const plan = baseSize?.plan ?? planGrid(breakpoint, viewport, pending.length, occupied);
      const generated = placeItems(pending, plan, viewport, occupied);
      for (const [id, point] of Object.entries(generated)) {
        setItemPoint(config, id, point);
      }
    }

    // Did every icon land inside the padding-safe box? When the area is genuinely
    // full the generator keeps its spacing and runs past the fold (documented);
    // that counts as "does not fit".
    const padding = LAYOUT_AREA_PADDING[breakpoint];
    const fits = Object.values(config).every((point) => {
      const rect = pointToRect(point, breakpoint, viewport);
      return (
        rect.x >= padding.side - 0.5 &&
        rect.x + rect.width <= viewport.width - padding.side + 0.5 &&
        rect.y >= padding.top - 0.5 &&
        rect.y + rect.height <= viewport.height - padding.bottom + 0.5
      );
    });

    return { config, fits };
  };

  for (const breakpoint of LAYOUT_BREAKPOINTS) {
    const viewport = breakpoint === activeBreakpoint && liveViewport ? liveViewport : LAYOUT_REFERENCE_VIEWPORT[breakpoint];
    const withRows = resolveBreakpoint(breakpoint, viewport, overlay);
    let config = withRows.config;

    // Rows are seeded at the reference viewport, so on a much smaller screen they
    // can be impossible to honour (the icons would land below the fold). The
    // module's own generator is then the better authority for that whole
    // breakpoint: every icon stays on screen instead of scrolling out of view.
    if (overlay && !withRows.fits && Object.keys(config).length > 0) {
      config = resolveBreakpoint(breakpoint, viewport, null).config;
    }

    for (const [id, point] of Object.entries(config)) {
      const entry: DesktopLayoutConfig = layout[id] ?? {};
      entry[breakpoint] = point;
      layout[id] = entry;
    }
  }

  return layout;
}

/** Nearest-breakpoint lookup order: exact → smaller → larger. */
function breakpointChain(breakpoint: LayoutBreakpoint): LayoutBreakpoint[] {
  const index = LAYOUT_BREAKPOINTS.indexOf(breakpoint);
  const smaller = LAYOUT_BREAKPOINTS.slice(0, index).reverse();
  const larger = LAYOUT_BREAKPOINTS.slice(index + 1);
  return [breakpoint, ...smaller, ...larger];
}

/**
 * Resolves one item's layout, walking to the nearest configured breakpoint and
 * finally falling back to the caller value (e.g. the item's own legacy x/y).
 */
export function resolveDesktopItemLayout(
  layout: DesktopLayoutMap,
  itemId: string,
  breakpoint: LayoutBreakpoint,
  fallback?: DesktopItemLayout
): DesktopItemLayout {
  const config = layout[itemId];
  if (config) {
    for (const candidate of breakpointChain(breakpoint)) {
      const point = config[candidate];
      if (point) return point;
    }
  }
  if (fallback) return fallback;
  return {
    x: 6,
    y: 12,
    width: breakpoint === "base" ? MOBILE_ICON_WIDTH : DESKTOP_DEFAULT_ICON_WIDTH,
    ...(breakpoint === "base" ? { imageHeight: MOBILE_ICON_IMAGE_HEIGHT } : {}),
  };
}

/** Stable layout key for a portfolio entry (`cms-desktop-<entryId>`). */
export function portfolioItemId(entryId: string) {
  return `cms-desktop-${entryId}`;
}

export function isPortfolioItemId(itemId: string) {
  return itemId.startsWith("cms-desktop-");
}

/**
 * Auto-populate helper: guarantees a layout row for the given portfolio entries
 * even when nothing is curated for them. Accepts raw entry ids, `{ id }`
 * objects, or desktop items — raw entry ids are keyed through
 * `portfolioItemId` so they line up with the rendered item ids.
 */
export function ensurePortfolioLayout(
  entries: Array<string | { id: string } | DesktopItem>,
  options: BuildLayoutOptions = {}
): DesktopLayoutMap {
  const items: LayoutItemInput[] = entries.map((entry) => {
    const id = typeof entry === "string" ? entry : entry.id;
    return { id: isPortfolioItemId(id) ? id : portfolioItemId(id) };
  });
  if (items.length === 0) return {};
  return buildDesktopLayout(items, options);
}

/* -------------------------------------------------------------------------- */
/*                    CMS "Desktop Layout" module rows                        */
/* -------------------------------------------------------------------------- */

/**
 * Persisted payload of the `layout` CMS entry: one row per desktop item, each
 * with `{ x, y, width }` per breakpoint. Owned by `desktop-layout-cms.ts`; all
 * validation happens in `normalizeLayoutOverlay` below.
 */
export interface DesktopLayoutData {
  items: DesktopLayoutMap;
}

/** Accepts numbers and numeric strings; `null` / `""` / `NaN` are rejected
 *  rather than silently coerced to `0`. */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * One persisted row: `x`/`y` are percentages of the desktop area, `width` is the
 * icon box width in px. Out-of-range values are clamped (percent into 0–100,
 * width into `LAYOUT_ROW_WIDTH_MIN`–`LAYOUT_ROW_WIDTH_MAX`), so a stored row can
 * never ask for an off-screen or zero-size icon.
 */
function sanitizeLayoutRow(raw: unknown): DesktopItemLayout | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const x = toFiniteNumber(source.x);
  const y = toFiniteNumber(source.y);
  if (x === null || y === null) return null;

  const row: DesktopItemLayout = { x: round2(clamp(x, 0, 100)), y: round2(clamp(y, 0, 100)) };
  const width = toFiniteNumber(source.width);
  if (width !== null && width > 0) {
    row.width = Math.round(clamp(width, LAYOUT_ROW_WIDTH_MIN, LAYOUT_ROW_WIDTH_MAX));
  }
  return row;
}

/**
 * Validates the persisted `layout` entry payload into a `DesktopLayoutMap`.
 * Accepts either `{ items: { … } }` (the stored shape from `layoutEntryData`)
 * or a bare map, drops unknown breakpoints and invalid rows, and keeps only
 * `{ x, y, width }` — derived values (`aspect`, `imageHeight`) are recomputed on
 * every build. Never throws: a corrupt entry degrades to "no overlay" instead of
 * taking the desktop down.
 */
export function normalizeLayoutOverlay(raw: unknown): DesktopLayoutMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const container = (() => {
    const candidate = (raw as Record<string, unknown>).items;
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
    return raw as Record<string, unknown>;
  })();

  const overlay: DesktopLayoutMap = {};
  for (const [itemId, value] of Object.entries(container)) {
    if (!itemId || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const source = value as Record<string, unknown>;
    const config: DesktopLayoutConfig = {};
    for (const breakpoint of LAYOUT_BREAKPOINTS) {
      const row = sanitizeLayoutRow(source[breakpoint]);
      if (row) config[breakpoint] = row;
    }
    if (Object.keys(config).length > 0) overlay[itemId] = config;
  }
  return overlay;
}

/** Wraps a map into the `layout` entry payload, canonicalising every row. */
export function layoutEntryData(overlay: DesktopLayoutMap): DesktopLayoutData {
  return { items: normalizeLayoutOverlay(overlay) };
}

/** Canonical, comparison-stable serialisation — used to skip no-op writes. */
export function layoutSignature(overlay: DesktopLayoutMap | null | undefined): string {
  const map = overlay ?? {};
  return JSON.stringify(
    Object.keys(map)
      .sort()
      .map((itemId) => {
        const config = map[itemId] ?? {};
        return [
          itemId,
          LAYOUT_BREAKPOINTS.map((breakpoint) => {
            const row = config[breakpoint];
            return row ? [row.x, row.y, row.width ?? null] : null;
          }),
        ];
      })
  );
}

/**
 * A CMS layout row → a concrete point for one breakpoint, or `null` when the row
 * is absent/invalid — the caller then falls through to the next precedence step.
 * The item's own media aspect and the breakpoint's default icon width are filled
 * in, and the result is clamped into the padding-safe box.
 */
function overlayPoint(
  item: LayoutItemInput,
  row: DesktopItemLayout | undefined,
  breakpoint: LayoutBreakpoint,
  viewport: LayoutViewport
): DesktopItemLayout | null {
  if (!row || !isFiniteNumber(row.x) || !isFiniteNumber(row.y)) return null;

  const point: DesktopItemLayout = { ...row };
  const aspect = isFiniteNumber(item.imageAspect) && item.imageAspect > 0 ? item.imageAspect : undefined;
  if (aspect && !isFiniteNumber(point.aspect)) point.aspect = aspect;

  if (breakpoint === "base") {
    const width = isFiniteNumber(point.width) ? point.width : MOBILE_ICON_WIDTH;
    point.width = width;
    if (!isFiniteNumber(point.imageHeight)) point.imageHeight = Math.round(width * MOBILE_ICON_IMAGE_RATIO);
  } else if (!isFiniteNumber(point.width)) {
    point.width = Math.round(DESKTOP_DEFAULT_ICON_WIDTH * DESKTOP_WIDTH_SCALE[breakpoint]);
  }

  return clampPoint(point, breakpoint, viewport);
}

/**
 * Materialises the resolved layout of `items` as storable rows — every item,
 * every breakpoint, only `{ x, y, width }`.
 *
 * This is what the CMS **Desktop Layout** module persists. A brand-new portfolio
 * entry therefore gets a complete row set (deterministic generated defaults) with
 * no manual step, and the currently rendered position is what gets seeded: an
 * entry placed through the legacy `desktop.x/y` field keeps exactly that position
 * (precedence 3 feeds the generated default), so nothing moves on rollout.
 *
 * Pass the existing rows as `options.overlay` to keep authored values and only
 * fill in what is missing. Ids not present in `items` are dropped, so rows for
 * deleted entries do not accumulate.
 */
export function ensureLayoutCoverage(items: LayoutItemInput[], options: BuildLayoutOptions = {}): DesktopLayoutMap {
  const resolved = buildDesktopLayout(items, options);
  const coverage: DesktopLayoutMap = {};

  for (const item of items) {
    const config = resolved[item.id];
    if (!config) continue;
    const row: DesktopLayoutConfig = {};
    for (const breakpoint of LAYOUT_BREAKPOINTS) {
      const point = config[breakpoint];
      if (!point) continue;
      row[breakpoint] = {
        x: point.x,
        y: point.y,
        ...(isFiniteNumber(point.width) ? { width: point.width } : {}),
      };
    }
    if (Object.keys(row).length > 0) coverage[item.id] = row;
  }

  return coverage;
}
