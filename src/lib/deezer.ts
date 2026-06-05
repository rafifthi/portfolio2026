import { Song } from "./types";

async function dz(path: string) {
  return fetch(`/api/deezer?path=${encodeURIComponent(path)}`);
}

const previewCache = new Map<string, string>();
const trackCache = new Map<number, Song | null>();
const albumCache = new Map<string, {
  artist: string;
  title: string;
  year: string;
  cover: string;
  songs: Song[];
} | null>();

const playlistCache = new Map<string, {
  title: string;
  cover: string;
  songs: Song[];
} | null>();

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function mapTrack(t: any): Song {
  return {
    id: `dz-${t.id}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || "",
    duration: formatDuration(t.duration),
    track: t.track_position || 0,
    audioUrl: t.preview || "",
  };
}

export async function fetchPreview(artist: string, title: string): Promise<string> {
  const key = `${artist}||${title}`;
  if (previewCache.has(key)) return previewCache.get(key)!;

  try {
    const query = `track:"${title}" artist:"${artist}"`;
    const res = await dz(`search?q=${encodeURIComponent(query)}&limit=1`);
    if (!res.ok) {
      previewCache.set(key, "");
      return "";
    }
    const data = await res.json();
    const preview: string = data?.data?.[0]?.preview || "";
    previewCache.set(key, preview);
    return preview;
  } catch {
    previewCache.set(key, "");
    return "";
  }
}

export async function fetchTrackById(id: number): Promise<Song | null> {
  if (trackCache.has(id)) return trackCache.get(id)!;

  try {
    const res = await dz(`track/${id}`);
    if (!res.ok) {
      trackCache.set(id, null);
      return null;
    }
    const data = await res.json();
    const song = mapTrack(data);
    trackCache.set(id, song);
    return song;
  } catch {
    trackCache.set(id, null);
    return null;
  }
}

export async function fetchTracksByIds(ids: number[]): Promise<Song[]> {
  const results = await Promise.all(ids.map(fetchTrackById));
  return results.filter((s): s is Song => s !== null);
}

export async function fetchPlaylistById(playlistId: number): Promise<{
  title: string;
  cover: string;
  songs: Song[];
} | null> {
  const cacheKey = `pl:${playlistId}`;
  const cached = playlistCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await dz(`playlist/${playlistId}`);
    if (!res.ok) {
      playlistCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    const pl = {
      title: data.title || "",
      cover: data.picture_xl || data.picture_big || data.picture_medium || "",
      songs: (data.tracks?.data || []).map((t: any, i: number) =>
        mapTrack({ ...t, track_position: t.track_position || i + 1 })
      ),
    };
    playlistCache.set(cacheKey, pl);
    return pl;
  } catch {
    playlistCache.set(cacheKey, null);
    return null;
  }
}

export async function fetchAlbumById(deezerId: number): Promise<{
  artist: string;
  title: string;
  year: string;
  cover: string;
  songs: Song[];
} | null> {
  const cacheKey = `id:${deezerId}`;
  const cached = albumCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await dz(`album/${deezerId}`);
    if (!res.ok) {
      albumCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    const album: { artist: string; title: string; year: string; cover: string; songs: Song[] } = {
      artist: data.artist?.name || "",
      title: data.title || "",
      year: data.release_date ? data.release_date.substring(0, 4) : "",
      cover: data.cover_xl || data.cover_big || data.cover_medium || "",
      songs: (data.tracks?.data || []).map((t: any, i: number) => mapTrack({ ...t, track_position: t.track_position || i + 1 })),
    };
    albumCache.set(cacheKey, album);
    return album;
  } catch {
    albumCache.set(cacheKey, null);
    return null;
  }
}

