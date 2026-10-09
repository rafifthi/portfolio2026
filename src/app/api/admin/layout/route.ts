import { NextRequest, NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { invalidatePublishedCmsEntries } from "@/lib/cms-cache";
import { normalizeLayoutOverlay, type DesktopLayoutMap } from "@/lib/desktop-layout";
import { buildDesktopLayoutState, resetDesktopLayoutRows, writeLayoutOverlay } from "@/lib/desktop-layout-cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CMS **Desktop Layout** module endpoints (singleton `layout` entry).
 *
 * GET  /api/admin/layout             → item list + full coverage (backfills +
 *                                      prunes rows, then persists)
 * GET  /api/admin/layout?reset=all   → drop every row and re-seed from the
 *      /api/admin/layout?reset=<id>    generator (`<id>` = one item id)
 * PUT  /api/admin/layout             → persist `{ layout: { [itemId]: { [bp]: {x,y,width} } } }`
 */

function layoutError(error: unknown) {
  const message = error instanceof Error ? error.message : "Desktop layout request failed.";
  if (/cms_entries_type_check|check constraint/i.test(message)) {
    return NextResponse.json(
      {
        error:
          "The database does not accept the `layout` content type yet — run `npm run db:migrate` (schema migration 5), then try again.",
        detail: message,
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const reset = request.nextUrl.searchParams.get("reset");

  try {
    const state = reset
      ? await resetDesktopLayoutRows(reset === "all" || reset === "" ? "all" : [reset])
      : await buildDesktopLayoutState();

    if (state.changed) invalidatePublishedCmsEntries();

    return NextResponse.json({
      items: state.items,
      inputs: state.inputs,
      layout: state.layout,
      entryId: state.entryId,
      entryUpdatedAt: state.entryUpdatedAt,
      created: state.created,
      changed: state.changed,
    });
  } catch (error) {
    return layoutError(error);
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { layout?: unknown; items?: unknown }
    | null;
  const payload = body && typeof body === "object" ? body.layout ?? body.items ?? body : null;
  const overlay = normalizeLayoutOverlay(payload);
  if (Object.keys(overlay).length === 0) {
    return NextResponse.json({ error: "No layout rows in the payload." }, { status: 400 });
  }

  try {
    // Merge over the current coverage: a row the editor did not send (a portfolio
    // entry created in another tab, say) keeps its position instead of losing it.
    const state = await buildDesktopLayoutState();
    const merged: DesktopLayoutMap = { ...state.layout };
    for (const [itemId, config] of Object.entries(overlay)) {
      if (merged[itemId]) merged[itemId] = config;
    }

    const saved = await writeLayoutOverlay(merged);
    invalidatePublishedCmsEntries();

    // Answer with the *resolved* coverage (the same pass the homepage runs), not
    // the raw payload: the phone tier re-derives `base` widths, so the editor
    // shows what will actually be rendered.
    const resolved = await buildDesktopLayoutState();

    return NextResponse.json({
      items: resolved.items,
      inputs: resolved.inputs,
      layout: resolved.layout,
      entryId: saved.entryId,
      entryUpdatedAt: resolved.entryUpdatedAt ?? saved.updatedAt,
      savedItems: saved.itemCount,
      created: false,
      changed: true,
    });
  } catch (error) {
    return layoutError(error);
  }
}
