import { NextRequest, NextResponse } from "next/server";
import { CmsEntryType, isCmsEntryType, normalizeCmsEntryInput } from "@/lib/cms";
import { createCmsEntry, listCmsEntries } from "@/lib/cms-db";
import { isAdminSession } from "@/lib/admin-auth";
import { invalidatePublishedCmsEntries } from "@/lib/cms-cache";
import { syncDesktopLayoutRows } from "@/lib/desktop-layout-cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSingletonType(type: CmsEntryType) {
  return type === "about" || type === "wife";
}

export async function GET(request: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");
  if (type !== null && !isCmsEntryType(type)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }
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

  const input = normalizeCmsEntryInput((await request.json().catch(() => null)) ?? {});
  if (!input) {
    return NextResponse.json({ error: "Invalid content payload." }, { status: 400 });
  }

  if (input.type === "layout") {
    return NextResponse.json(
      {
        error:
          "Desktop Layout is a singleton managed by its own module — use /admin → Desktop Layout (PUT /api/admin/layout).",
      },
      { status: 400 }
    );
  }

  try {
    if (isSingletonType(input.type)) {
      const existingEntries = await listCmsEntries(input.type, true);
      if (existingEntries.length) {
        return NextResponse.json(
          { error: `${input.type === "about" ? "About Rafif" : "Wife"} can only have one entry.` },
          { status: 409 }
        );
      }
    }

    const entry = await createCmsEntry(input);

    // Auto-populate: a new portfolio entry gets a Desktop Layout row at every
    // breakpoint, with no manual step. A failure here must not fail the content
    // write — the rows are generated again next time the editor opens.
    if (input.type === "portfolio") {
      try {
        await syncDesktopLayoutRows();
      } catch (error) {
        console.warn(
          "[desktop-layout] auto-populate failed:",
          error instanceof Error ? error.message : error
        );
      }
    }

    invalidatePublishedCmsEntries();
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content." },
      { status: 500 }
    );
  }
}
