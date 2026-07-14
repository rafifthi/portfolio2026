import HomeClient from "./HomeClient";
import type { CmsEntry, NoteData, PortfolioEntryData } from "@/lib/cms";
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

export default async function Home() {
  const [portfolioEntries, noteEntries] = await Promise.all([
    getPortfolioEntries(),
    getNoteEntries(),
  ]);

  return (
    <HomeClient
      initialPortfolioEntries={portfolioEntries}
      initialNoteEntries={noteEntries}
    />
  );
}
