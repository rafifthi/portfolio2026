import { NextResponse } from "next/server";
import { CmsEntryInput, isCmsEntryType, slugify } from "@/lib/cms";
import { deleteCmsEntry, updateCmsEntry } from "@/lib/cms-db";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const input = normalizeInput((await request.json().catch(() => null)) ?? {});
  if (!input) {
    return NextResponse.json({ error: "Invalid content payload." }, { status: 400 });
  }

  try {
    const entry = await updateCmsEntry(id, input);
    if (!entry) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update content." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await deleteCmsEntry(id);
    if (!deleted) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content." },
      { status: 500 }
    );
  }
}
