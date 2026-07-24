import { NextRequest, NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TMDB_BASE = "https://api.themoviedb.org/3";

// v4 read access tokens are JWTs (start with "eyJ") and go in a Bearer header;
// v3 API keys are plain strings passed as an api_key query param.
function tmdbRequest(path: string, params: Record<string, string>) {
  const key = process.env.TMDB_API_KEY as string;
  const search = new URLSearchParams(params);
  const headers: HeadersInit = { accept: "application/json" };
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    search.set("api_key", key);
  }
  return fetch(`${TMDB_BASE}${path}?${search.toString()}`, { headers });
}

interface TmdbSearchItem {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetails {
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  number_of_seasons?: number;
  genres?: TmdbGenre[];
  credits?: { cast?: { name: string }[] };
}

function yearOf(date?: string) {
  const year = Number((date ?? "").slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

function formatRuntime(minutes?: number) {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB_API_KEY not configured." }, { status: 503 });
  }

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "search") {
      const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
      if (query.length < 2) return NextResponse.json({ results: [] });

      const res = await tmdbRequest("/search/multi", { query, include_adult: "false" });
      if (!res.ok) {
        return NextResponse.json({ error: "TMDB search failed." }, { status: res.status });
      }

      const data = (await res.json()) as { results?: TmdbSearchItem[] };
      const results = (data.results ?? [])
        .filter((item) => item.media_type === "movie" || item.media_type === "tv")
        .slice(0, 8)
        .map((item) => ({
          tmdbId: item.id,
          mediaType: item.media_type as "movie" | "tv",
          title: item.title ?? item.name ?? "",
          year: yearOf(item.release_date ?? item.first_air_date),
          posterPath: item.poster_path ?? null,
        }));

      return NextResponse.json({ results });
    }

    if (action === "details") {
      const mediaType = req.nextUrl.searchParams.get("mediaType");
      const id = req.nextUrl.searchParams.get("id");
      if ((mediaType !== "movie" && mediaType !== "tv") || !id) {
        return NextResponse.json({ error: "Invalid details request." }, { status: 400 });
      }

      const res = await tmdbRequest(`/${mediaType}/${id}`, { append_to_response: "credits" });
      if (!res.ok) {
        return NextResponse.json({ error: "TMDB details failed." }, { status: res.status });
      }

      const data = (await res.json()) as TmdbDetails;
      const prefill = {
        kind: mediaType === "movie" ? ("movie" as const) : ("series" as const),
        title: data.title ?? data.name ?? "",
        year: yearOf(data.release_date ?? data.first_air_date) ?? new Date().getFullYear(),
        description: data.overview ?? "",
        poster: data.poster_path ?? "",
        backdrop: data.backdrop_path ?? "",
        genres: (data.genres ?? []).map((genre) => genre.name),
        cast: (data.credits?.cast ?? []).slice(0, 3).map((member) => member.name),
        duration:
          mediaType === "movie"
            ? formatRuntime(data.runtime)
            : data.number_of_seasons
              ? `${data.number_of_seasons} Season${data.number_of_seasons === 1 ? "" : "s"}`
              : "",
      };

      return NextResponse.json({ prefill });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "TMDB request failed." }, { status: 500 });
  }
}
