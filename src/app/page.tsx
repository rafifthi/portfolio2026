import HomeClient from "./HomeClient";
import { connection } from "next/server";
import type { AboutData, CmsEntry, NoteData, PortfolioEntryData, WifeData } from "@/lib/cms";
import { listPublishedCmsEntries } from "@/lib/cms-cache";

async function getPortfolioEntries(): Promise<CmsEntry<PortfolioEntryData>[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    return (await listPublishedCmsEntries("portfolio")) as CmsEntry<PortfolioEntryData>[];
  } catch {
    // Keep the public desktop usable when the CMS database is unavailable.
    return [];
  }
}

async function getNoteEntries(): Promise<CmsEntry<NoteData>[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    return (await listPublishedCmsEntries("notes")) as CmsEntry<NoteData>[];
  } catch {
    // Notes still has static fallback content when the CMS is unavailable.
    return [];
  }
}

async function getProfileEntry<TData>(type: "about" | "wife"): Promise<CmsEntry<TData> | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    return ((await listPublishedCmsEntries(type)) as CmsEntry<TData>[])[0] || null;
  } catch {
    return null;
  }
}

export default async function Home() {
  // DATABASE_URL and published CMS content must be resolved at request time.
  // Otherwise a build without runtime env can permanently prerender an empty desktop.
  await connection();

  const [portfolioEntries, noteEntries, aboutEntry, wifeEntry] = await Promise.all([
    getPortfolioEntries(),
    getNoteEntries(),
    getProfileEntry<AboutData>("about"),
    getProfileEntry<WifeData>("wife"),
  ]);

  return (
    <HomeClient
      initialPortfolioEntries={portfolioEntries}
      initialNoteEntries={noteEntries}
      initialAboutEntry={aboutEntry}
      initialWifeEntry={wifeEntry}
    />
  );
}
