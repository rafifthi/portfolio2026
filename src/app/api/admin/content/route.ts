import { NextRequest, NextResponse } from "next/server";
import { isCmsEntryType, normalizeCmsEntryInput } from "@/lib/cms";
import { createCmsEntry, listCmsEntries } from "@/lib/cms-db";
import { isAdminSession } from "@/lib/admin-auth";
import { invalidatePublishedCmsEntries } from "@/lib/cms-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const entry = await createCmsEntry(input);
    invalidatePublishedCmsEntries();
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create content." },
      { status: 500 }
    );
  }
}
