import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { isAdminSession } from "@/lib/admin-auth";
import { browserImageUrl } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function fixedUploadFolder(target: FormDataEntryValue | null) {
  if (target === "portfolio-banner") {
    return process.env.CLOUDINARY_PORTFOLIO_BANNER_FOLDER || "portfolio-cms/portfolio-banners";
  }

  if (target === "portfolio-icon") {
    return process.env.CLOUDINARY_PORTFOLIO_ICON_FOLDER || "portfolio-cms/portfolio-icons";
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
    const target = incoming.get("target");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file." }, { status: 400 });
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

    return NextResponse.json({
      url: browserImageUrl(result.secure_url),
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 }
    );
  }
}
