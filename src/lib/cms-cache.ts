import { revalidateTag, unstable_cache } from "next/cache";
import { CmsEntryType } from "./cms";
import { listCmsEntries } from "./cms-db";

const CMS_PUBLISHED_TAG = "cms:published";

const getCachedEntries = unstable_cache(
  async (type: CmsEntryType) => listCmsEntries(type, false),
  ["cms-published-by-type"],
  {
    tags: [CMS_PUBLISHED_TAG],
    revalidate: 300,
  }
);

export function listPublishedCmsEntries(type: CmsEntryType) {
  return getCachedEntries(type);
}

export function invalidatePublishedCmsEntries() {
  revalidateTag(CMS_PUBLISHED_TAG, { expire: 0 });
}
