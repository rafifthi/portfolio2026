import type { AboutData, CmsEntry, CmsImageMetadata, PortfolioEntryData, WifeData } from "./cms";
import { browserImageUrl } from "./cms";
import { desktopItems } from "./data";
import { portfolioItemId, type LayoutItemInput } from "./desktop-layout";
import type { DesktopItem } from "./types";

/**
 * Shared mapping from CMS content → the desktop item `HomeClient` renders and
 * the coordinate inputs `desktop-layout.ts` resolves.
 *
 * Both the render path (`HomeClient`) and the CMS **Desktop Layout** module
 * (admin editor + coverage/backfill, `desktop-layout-cms.ts`) go through these
 * helpers, so a seeded default row and the icon that actually renders always
 * agree on the same item id and the same legacy overrides.
 */

/** Image aspect (height ÷ width) from CMS media metadata, when available. */
export function mediaAspect(media?: CmsImageMetadata): number | undefined {
  if (!media || !media.width || !media.height) return undefined;
  return media.height / media.width;
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** `readme` + `cv` — no CMS entry, curated in `desktop-layout.ts`. */
export function staticDesktopItems(): DesktopItem[] {
  return desktopItems.map((item) => ({ ...item }));
}

/** Static desktop items that must always have a Desktop Layout row. */
export const STATIC_DESKTOP_ITEM_IDS = ["readme", "wife", "cv", "about"] as const;

/** One row of the CMS Desktop Layout editor. */
export interface DesktopLayoutItemDescriptor {
  /** Rendered desktop item id (`cms-desktop-<entryId>` for portfolio entries). */
  id: string;
  kind: "static" | "portfolio";
  /** Row label in the editor. */
  label: string;
  /** CMS entry behind the row — `null` for `readme` / `cv` / `wife` / `about`. */
  entryId: string | null;
  /** False when the homepage currently has nothing to render for this id. The
   *  row is still editable and saved. */
  rendered: boolean;
}

export function portfolioDesktopItem(entry: CmsEntry<PortfolioEntryData>): DesktopItem {
  const desktop = entry.data.desktop;
  return {
    id: portfolioItemId(entry.id),
    label: desktop?.label || entry.title,
    finderLabel: entry.data.title || entry.title,
    finderIcon: entry.data.finderIcon ? browserImageUrl(entry.data.finderIcon) : undefined,
    image: browserImageUrl(desktop?.image || entry.data.banner || "/placeholders/portfolio-thumb.svg"),
    // CMS placement is an *override* for desktop-layout.ts; a new entry without
    // coordinates falls through to the module's generated slot.
    x: finite(desktop?.x),
    y: finite(desktop?.y),
    width: finite(desktop?.width),
    mobileX: finite(desktop?.mobile?.x),
    mobileY: finite(desktop?.mobile?.y),
    imageAspect: mediaAspect(desktop?.media) ?? mediaAspect(entry.data.bannerMedia),
    appId: `cms-portfolio:${entry.id}`,
  };
}

export function aboutDesktopItem(data: AboutData): DesktopItem {
  return {
    id: "about",
    label: data.desktop.label || data.title,
    finderLabel: data.title,
    finderIcon: data.finderIcon ? browserImageUrl(data.finderIcon) : undefined,
    image: browserImageUrl(data.desktop.image),
    x: finite(data.desktop.x),
    y: finite(data.desktop.y),
    width: finite(data.desktop.width),
    mobileX: finite(data.desktop.mobile?.x),
    mobileY: finite(data.desktop.mobile?.y),
    imageAspect: mediaAspect(data.desktop.media) ?? mediaAspect(data.photoMedia),
    appId: "about",
  };
}

export function wifeDesktopItem(data: WifeData): DesktopItem {
  return {
    id: "wife",
    label: data.desktop.label || data.name,
    finderLabel: data.name,
    finderIcon: data.finderIcon ? browserImageUrl(data.finderIcon) : undefined,
    image: browserImageUrl(data.desktop.image || data.photo),
    x: finite(data.desktop.x),
    y: finite(data.desktop.y),
    width: finite(data.desktop.width),
    mobileX: finite(data.desktop.mobile?.x),
    mobileY: finite(data.desktop.mobile?.y),
    // The static fallback photo is 3:4; CMS uploads carry their own size.
    imageAspect: mediaAspect(data.desktop.media) ?? mediaAspect(data.photoMedia) ?? 4 / 3,
    appId: "wife",
  };
}

/** The coordinate inputs of a desktop item, for `buildDesktopLayout`. */
export function layoutInput(item: DesktopItem & Partial<LayoutItemInput>): LayoutItemInput {
  return {
    id: item.id,
    x: item.x,
    y: item.y,
    width: item.width,
    mobileX: item.mobileX,
    mobileY: item.mobileY,
    imageAspect: item.imageAspect,
  };
}
