import { NextRequest, NextResponse } from "next/server";
import { CmsEntryInput, isCmsEntryType, slugify } from "@/lib/cms";
import { createCmsEntry, listCmsEntries } from "@/lib/cms-db";
import { isAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeInput(body: Partial<CmsEntryInput>): CmsEntryInput | null {
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

export async function GET(request: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const normalizedType = isCmsEntryType(type) ? type : undefined;

  try {
    const entries = await listCmsEntries(normalizedType, true);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load content." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const input = normalizeInput((await request.json().catch(() => null)) ?? {});
  if (!input) {
    return NextResponse.json({ error: "Invalid content payload." }, { status: 400 });
  }

  try {
    const entry = await createCmsEntry(input);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content." },
      { status: 500 }
    );
  }
}
