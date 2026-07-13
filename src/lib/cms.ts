import { NotionBlock } from "./types";

export type CmsEntryType = "gallery" | "notes" | "portfolio";
export type CmsStatus = "draft" | "published";

export interface CmsEntry<TData = unknown> {
  id: string;
  type: CmsEntryType;
  slug: string;
  title: string;
  status: CmsStatus;
  sortOrder: number;
  data: TData;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImageData {
  src: string;
}

export interface NoteData {
  folder: string;
  title: string;
  content: string;
  date: string;
}

export interface PortfolioMetaItem {
  label: string;
  value: string;
}

export interface PortfolioDesktopData {
  label: string;
  image: string;
  x: number;
  y: number;
  width: number;
  icon?: string;
  color?: string;
}

export interface PortfolioEntryData {
  title: string;
  banner: string;
  meta: PortfolioMetaItem[];
  blocks: NotionBlock[];
  desktop: PortfolioDesktopData;
}

export interface CmsEntryInput<TData = unknown> {
  type: CmsEntryType;
  slug: string;
  title: string;
  status: CmsStatus;
  sortOrder: number;
  data: TData;
}

export const CMS_TYPES: CmsEntryType[] = ["gallery", "notes", "portfolio"];

export function isCmsEntryType(value: string | null): value is CmsEntryType {
  return CMS_TYPES.includes(value as CmsEntryType);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function browserImageUrl(value: string) {
  if (!value.includes("/image/upload/") || value.includes("/image/upload/f_auto,q_auto/")) {
    return value;
  }

  return value.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}
