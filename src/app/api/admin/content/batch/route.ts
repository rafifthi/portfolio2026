import { NextResponse } from "next/server";
import { CmsEntryInput, CmsEntryType, normalizeCmsEntryInput } from "@/lib/cms";
import { createCmsEntries, deleteCmsEntries, listCmsEntries, updateCmsEntries } from "@/lib/cms-db";
import { isAdminSession } from "@/lib/admin-auth";
import { invalidatePublishedCmsEntries } from "@/lib/cms-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 500;

function isSingletonType(type: CmsEntryType) {
  return type === "about" || type === "wife";
}

type BatchBody = {
  operation?: "create" | "update" | "delete";
  entries?: unknown[];
};

function invalidBatch() {
  return NextResponse.json(
    { error: `Batch must contain between 1 and ${MAX_BATCH_SIZE} valid entries.` },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as BatchBody | null;
  if (
    !body ||
    !Array.isArray(body.entries) ||
    body.entries.length < 1 ||
    body.entries.length > MAX_BATCH_SIZE
  ) {
    return invalidBatch();
  }

  try {
    if (body.operation === "delete") {
      const ids = body.entries.map((entry) => {
        const candidate = (entry ?? {}) as { id?: unknown };
        return typeof candidate.id === "string" ? candidate.id.trim() : "";
      });
      if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return invalidBatch();

      const entries = await deleteCmsEntries(ids);
      if (entries.length !== ids.length) {
        return NextResponse.json(
          { error: "One or more content entries were not found.", entries },
          { status: 404 }
        );
      }
      invalidatePublishedCmsEntries();
      return NextResponse.json({ entries });
    }

    if (body.operation === "create") {
      const inputs = body.entries.map((entry) =>
        normalizeCmsEntryInput((entry ?? {}) as Partial<CmsEntryInput>)
      );
      if (inputs.some((entry) => !entry)) return invalidBatch();

      const singletonTypes = (inputs as CmsEntryInput[])
        .filter((entry) => isSingletonType(entry.type))
        .map((entry) => entry.type);
      if (new Set(singletonTypes).size !== singletonTypes.length) {
        return NextResponse.json(
          { error: "About Rafif and Wife can only have one entry each." },
          { status: 409 }
        );
      }
      const existingSingletons = await Promise.all(
        singletonTypes.map(async (type) => ({ type, entries: await listCmsEntries(type, true) }))
      );
      if (existingSingletons.some(({ entries }) => entries.length)) {
        return NextResponse.json(
          { error: "About Rafif and Wife can only have one entry each." },
          { status: 409 }
        );
      }

      const entries = await createCmsEntries(inputs as CmsEntryInput[]);
      invalidatePublishedCmsEntries();
      return NextResponse.json({ entries }, { status: 201 });
    }

    if (body.operation === "update") {
      const updates = body.entries.map((entry) => {
        const candidate = (entry ?? {}) as {
          id?: unknown;
          input?: Partial<CmsEntryInput>;
        };
        const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
        const input = normalizeCmsEntryInput(candidate.input ?? {});
        return id && input ? { id, input } : null;
      });
      if (updates.some((entry) => !entry)) return invalidBatch();
      const ids = updates.map((entry) => entry?.id ?? "");
      if (new Set(ids).size !== ids.length) return invalidBatch();

      const entries = await updateCmsEntries(
        updates as { id: string; input: CmsEntryInput }[]
      );
      if (entries.length !== updates.length) {
        return NextResponse.json(
          { error: "One or more content entries were not found.", entries },
          { status: 404 }
        );
      }
      invalidatePublishedCmsEntries();
      return NextResponse.json({ entries });
    }

    return invalidBatch();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch update failed." },
      { status: 500 }
    );
  }
}
