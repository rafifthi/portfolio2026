import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { isAdminSession } from "@/lib/admin-auth";
import { browserImageUrl, CmsImageMetadata } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const UPLOAD_TARGETS = [
  "gallery",
  "portfolio-banner",
  "portfolio-icon",
  "portfolio-finder-icon",
  "about-photo",
  "about-finder-icon",
  "about-desktop-icon",
  "wife-photo",
  "wife-finder-icon",
  "wife-desktop-icon",
] as const;
type UploadTarget = (typeof UPLOAD_TARGETS)[number];

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are not configured.");
  }

  return { cloudName, apiKey, apiSecret };
}

function signUpload(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

function normalizeUploadTarget(value: FormDataEntryValue | null): UploadTarget | null {
  if (value === null || value === "gallery") return "gallery";
  if (typeof value === "string" && UPLOAD_TARGETS.includes(value as UploadTarget)) return value as UploadTarget;
  return null;
}

function fixedUploadFolder(target: UploadTarget) {
  if (target === "portfolio-banner") {
    return process.env.CLOUDINARY_PORTFOLIO_BANNER_FOLDER || "portfolio-cms/portfolio-banners";
  }

  if (target === "portfolio-icon") {
    return process.env.CLOUDINARY_PORTFOLIO_ICON_FOLDER || "portfolio-cms/portfolio-icons";
  }

  if (target === "portfolio-finder-icon") {
    return process.env.CLOUDINARY_PORTFOLIO_FINDER_ICON_FOLDER || "portfolio-cms/portfolio-finder-icons";
  }

  if (target.startsWith("about-")) {
    return process.env.CLOUDINARY_ABOUT_FOLDER || "portfolio-cms/about";
  }

  if (target.startsWith("wife-")) {
    return process.env.CLOUDINARY_WIFE_FOLDER || "portfolio-cms/wife";
  }

  return process.env.CLOUDINARY_GALLERY_FOLDER || "portfolio-cms/gallery";
}

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    const incoming = await request.formData();
    const file = incoming.get("file");
    const target = normalizeUploadTarget(incoming.get("target"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file." }, { status: 400 });
    }
    if (!target) {
      return NextResponse.json({ error: "Invalid upload target." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files can be uploaded." }, { status: 415 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image is larger than the 20 MB upload limit." },
        { status: 413 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = fixedUploadFolder(target);
    const signature = signUpload({ folder, timestamp }, apiSecret);
    const form = new FormData();
    form.set("file", file);
    form.set("api_key", apiKey);
    form.set("timestamp", String(timestamp));
    form.set("folder", folder);
    form.set("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });

    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: result?.error?.message || "Cloudinary upload failed." },
        { status: response.status }
      );
    }

    const media: CmsImageMetadata = {
      publicId: String(result.public_id),
      originalUrl: String(result.secure_url),
      version: Number.isFinite(Number(result.version)) ? Number(result.version) : undefined,
      width: Number(result.width),
      height: Number(result.height),
      format: result.format ? String(result.format) : undefined,
      bytes: Number.isFinite(Number(result.bytes)) ? Number(result.bytes) : undefined,
      resourceType: result.resource_type ? String(result.resource_type) : undefined,
      originalFilename: result.original_filename ? String(result.original_filename) : undefined,
    };

    return NextResponse.json({
      url: browserImageUrl(result.secure_url),
      media,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
