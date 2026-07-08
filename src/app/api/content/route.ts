import { NextRequest, NextResponse } from "next/server";
import { isCmsEntryType } from "@/lib/cms";
import { listCmsEntries } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  if (!isCmsEntryType(type)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const entries = await listCmsEntries(type, false);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load content.", entries: [] },
      { status: 500 }
    );
  }
}

