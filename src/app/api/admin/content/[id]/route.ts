import { NextResponse } from "next/server";
import { CmsEntryType, normalizeCmsEntryInput } from "@/lib/cms";
import { deleteCmsEntry, getCmsEntry, listCmsEntries, updateCmsEntry } from "@/lib/cms-db";
import { isAdminSession } from "@/lib/admin-auth";
import { invalidatePublishedCmsEntries } from "@/lib/cms-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSingletonType(type: CmsEntryType) {
  return type === "about" || type === "wife";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const entry = await getCmsEntry(id);
    if (!entry) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load content." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const input = normalizeCmsEntryInput((await request.json().catch(() => null)) ?? {});
  if (!input) {
    return NextResponse.json({ error: "Invalid content payload." }, { status: 400 });
  }

  try {
    if (isSingletonType(input.type)) {
      const existingEntries = await listCmsEntries(input.type, true);
      if (existingEntries.some((entry) => entry.id !== id)) {
        return NextResponse.json(
          { error: `${input.type === "about" ? "About Rafif" : "Wife"} can only have one entry.` },
          { status: 409 }
        );
      }
    }

    const entry = await updateCmsEntry(id, input);
    if (!entry) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }
    invalidatePublishedCmsEntries();
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
    const deletedType = await deleteCmsEntry(id);
    if (!deletedType) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }
    invalidatePublishedCmsEntries();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete content." },
      { status: 500 }
    );
  }
}
