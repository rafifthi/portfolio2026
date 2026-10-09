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

1. **Curated config** — `DESKTOP_LAYOUT[id][breakpoint]`. This is where you
   hand-tune a position. `readme` and `cv` live only here (they have no CMS
   entry).
2. **CMS override** — `desktop.mobile.{x,y}` for `base`, `desktop.{x,y,width}`
   for the desktop breakpoints (`width` scaled by `DESKTOP_WIDTH_SCALE`:
   `sm`/`md` = 0.8, `lg`/`xl` = 1). Legacy CMS placement keeps working; the
   values are clamped into the padding-safe box and de-collided if two of them
   land on the same spot (see below).
3. **Generated slot** — deterministic grid position for anything left over.
4. The `fallback` passed to `resolveDesktopItemLayout()`.

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
  // any id also works for CMS items, and wins over their CMS coordinates:
  "cms-desktop-lumona": { xl: { x: 72, y: 20, width: 170 } },
};
```

Omitted breakpoints fall back to the nearest configured one (smaller first, then
larger). Positions are always clamped inside the padding-safe box.

## Verifying

```bash
npm run verify:layout   # node --experimental-strip-types scripts/verify-desktop-layout.mjs
```

It checks, across viewports × item counts × breakpoints (≈19k assertions):
every item resolves at every breakpoint, nothing leaves viewport bounds (up to
the layout capacity), nothing overlaps at any count, a new entry gets a generated
row at every breakpoint, CMS values are honoured-but-clamped, and generation is
deterministic and differs per breakpoint.
