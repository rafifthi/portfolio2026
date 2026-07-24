import { NotionBlock } from "./types";

export type CmsEntryType = "gallery" | "notes" | "portfolio" | "about" | "wife" | "netflix";
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

export interface CmsImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CmsImageMetadata {
  publicId: string;
  originalUrl: string;
  version?: number;
  width: number;
  height: number;
  format?: string;
  bytes?: number;
  resourceType?: string;
  originalFilename?: string;
  crop?: CmsImageCrop;
}

export interface GalleryImageData {
  src: string;
  title?: string;
  date?: string;
  favorite?: boolean;
  labels?: string[];
  media?: CmsImageMetadata;
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
  media?: CmsImageMetadata;
}

export interface PortfolioEntryData {
  title: string;
  banner: string;
  projectUrl?: string;
  bannerMedia?: CmsImageMetadata;
  finderIcon?: string;
  finderIconMedia?: CmsImageMetadata;
  meta: PortfolioMetaItem[];
  blocks: NotionBlock[];
  desktop: PortfolioDesktopData;
}

export interface AboutData {
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  photo: string;
  photoMedia?: CmsImageMetadata;
  finderIcon: string;
  finderIconMedia?: CmsImageMetadata;
  desktop: PortfolioDesktopData;
}

export interface WifeData {
  name: string;
  description: string;
  photo: string;
  photoMedia?: CmsImageMetadata;
  finderIcon: string;
  finderIconMedia?: CmsImageMetadata;
  desktop: PortfolioDesktopData;
}

export interface NetflixTitleData {
  kind: "movie" | "series";
  myList: boolean;
  year: number;
  maturity: string;
  duration: string;
  match: number;
  genres: string[];
  cast: string[];
  creators?: string[];
  description: string;
  poster: string;
  backdrop: string;
}

export interface CmsEntryInput<TData = unknown> {
  type: CmsEntryType;
  slug: string;
  title: string;
  status: CmsStatus;
  sortOrder: number;
  data: TData;
}

export const CMS_TYPES: CmsEntryType[] = ["gallery", "notes", "portfolio", "about", "wife", "netflix"];

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

export function normalizeCmsEntryInput(
  body: Partial<CmsEntryInput>
): CmsEntryInput | null {
  const type = body.type;
  if (!type || !isCmsEntryType(type)) return null;
  const title = String(body.title ?? "").trim();
  if (!title) return null;

  return {
    type,
    title,
    slug: String(body.slug || slugify(title)).trim(),
    status: body.status === "published" ? "published" : "draft",
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    data: body.data ?? {},
  };
}

export function browserImageUrl(value: string) {
  if (!value.includes("/image/upload/") || value.includes("/f_auto,q_auto/")) {
    return value;
  }

  return value.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

export function uncroppedCloudinaryUrl(value: string) {
  return value.replace(
    /\/c_crop,x_-?\d+,y_-?\d+,w_\d+,h_\d+(?=\/)/g,
    ""
  );
}

export function croppedCloudinaryUrl(
  value: string,
  crop: { x: number; y: number; width: number; height: number }
) {
  if (!value.includes("/image/upload/")) return value;
  const source = uncroppedCloudinaryUrl(value);
  const transformation = `c_crop,x_${Math.round(crop.x)},y_${Math.round(crop.y)},w_${Math.round(crop.width)},h_${Math.round(crop.height)}`;

  if (source.includes("/f_auto,q_auto/")) {
    return source.replace("/f_auto,q_auto/", `/${transformation}/f_auto,q_auto/`);
  }

  return source.replace("/image/upload/", `/image/upload/${transformation}/f_auto,q_auto/`);
}
