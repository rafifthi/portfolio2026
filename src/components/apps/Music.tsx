"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@/components/Icon";
import { albumIds, albumColor, playlists } from "@/lib/data";
import { Album, Song, Playlist } from "@/lib/types";
import { fetchAlbumById, fetchPreview, fetchPlaylistById } from "@/lib/deezer";
import { MobileStack, MobileBackHeader } from "@/components/mobile/MobileStack";

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Music({ isMobile = false }: { isMobile?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mobile-only navigation: which root section is open (ignored on desktop)
  const [mobileSection, setMobileSection] = useState<"library" | "albums">("library");

  // Albums fetched on mount
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistData, setPlaylistData] = useState<Record<string, { title: string; cover: string; songs: Song[] }>>({});
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  // Snapshot of what's actually playing, captured at play time so the
  // now-playing bar (cover/title/artist) stays correct even after the user
  // navigates to a different album or playlist.
  const [nowPlaying, setNowPlaying] = useState<{ song: Song; cover: string; artist: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const playlistSongs = selectedPlaylist ? playlistData[selectedPlaylist.id]?.songs || [] : [];
  const tracks = selectedAlbum ? selectedAlbum.songs : playlistSongs;
  const playlistMeta = selectedPlaylist ? playlistData[selectedPlaylist.id] : undefined;

  // Fetch all albums on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all(albumIds.map((id) => fetchAlbumById(id))).then((results) => {
      if (cancelled) return;
      const loaded: Album[] = [];
      results.forEach((data, i) => {
        if (data) {
          loaded.push({
            deezerId: albumIds[i],
            id: `dz-album-${albumIds[i]}`,
            title: data.title,
            artist: data.artist,
            year: data.year,
            color: albumColor(i),
            cover: data.cover,
            songs: data.songs,
          });
        }
      });
      setAlbums(loaded);
      setLoadingAlbums(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Fetch playlist on select
  useEffect(() => {
    if (!selectedPlaylist) return;
    if (playlistData[selectedPlaylist.id]) return;
    let cancelled = false;
    setLoadingPlaylist(selectedPlaylist.id);
    fetchPlaylistById(selectedPlaylist.deezerPlaylistId).then((data) => {
      if (cancelled) return;
      if (data) {
        setPlaylistData((prev) => ({ ...prev, [selectedPlaylist.id]: data }));
      }
      setLoadingPlaylist(null);
    });
    return () => { cancelled = true; };
  }, [selectedPlaylist]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  // Audio setup (mount only)
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.volume = volume;
    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  // Ended handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === "all" && tracks.length > 0) {
        const idx = tracks.findIndex((s) => s.id === currentSongId);
        if (idx < tracks.length - 1) {
          const nextSong = tracks[idx + 1];
          setCurrentSongId(nextSong.id);
          audio.src = nextSong.audioUrl;
          audio.play().catch(() => {});
        } else {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [repeat, tracks, currentSongId]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const playSong = useCallback(async (song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Capture the source (album/playlist) cover + artist now, so the
    // now-playing bar doesn't depend on what's currently being browsed.
    const artist = selectedAlbum?.artist || song.artist || (selectedPlaylist?.name ?? "");
    const cover = selectedAlbum?.cover || playlistMeta?.cover || "";
    setNowPlaying({ song, cover, artist });

    setCurrentSongId(song.id);
    setDuration(0);
    setCurrentTime(0);

    if (song.audioUrl) {
      audio.src = song.audioUrl;
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      return;
    }

    if (!artist) return;
    setPreviewLoading(song.id);
    const previewUrl = await fetchPreview(artist, song.title);
    setPreviewLoading(null);

    if (previewUrl) {
      audio.src = previewUrl;
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [selectedAlbum, selectedPlaylist, playlistMeta]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
    else { audio.pause(); setIsPlaying(false); }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = t; setCurrentTime(t); }
  }, []);

  const handlePrev = useCallback(() => {
    if (!currentSongId || tracks.length === 0) return;
    const idx = tracks.findIndex((s) => s.id === currentSongId);
    if (idx > 0) playSong(tracks[idx - 1]);
  }, [currentSongId, tracks, playSong]);

  const handleNext = useCallback(() => {
    if (!currentSongId || tracks.length === 0) return;
    const idx = tracks.findIndex((s) => s.id === currentSongId);
    if (shuffle && tracks.length > 1) {
      const pick = tracks[Math.floor(Math.random() * tracks.length)];
      if (pick) { playSong(pick); return; }
    }
    if (idx < tracks.length - 1) playSong(tracks[idx + 1]);
  }, [currentSongId, tracks, shuffle, playSong]);

  const playPauseCurrent = useCallback(
    (song: Song) => {
      if (previewLoading) return;
      if (currentSongId === song.id) togglePlay();
      else playSong(song);
    },
    [currentSongId, togglePlay, playSong, previewLoading]
  );

  const noRepeatCycle: Record<string, "off" | "one" | "all"> = { off: "all", all: "one", one: "off" };

  // ── iOS layout (mobile): Library root page → drill-down, mini-player pinned ──
  if (isMobile) {
    const page = selectedAlbum
      ? { key: `album-${selectedAlbum.id}`, depth: 2 }
      : selectedPlaylist
      ? { key: `playlist-${selectedPlaylist.id}`, depth: 1 }
      : mobileSection === "albums"
      ? { key: "albums", depth: 1 }
      : { key: "library", depth: 0 };

    return (
      <div className="h-full flex flex-col min-h-0 transition-colors duration-300" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
        <MobileStack pageKey={page.key} depth={page.depth}>
          {selectedAlbum ? (
            <>
              <MobileBackHeader
                label="Albums"
                onBack={() => { setSelectedAlbum(null); setMobileSection("albums"); }}
              />
              <div className="flex-1 overflow-auto overscroll-contain">
                <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
                  <div className="w-44 h-44 rounded-xl shadow-2xl overflow-hidden" style={{ background: selectedAlbum.color }}>
                    {selectedAlbum.cover && <img src={selectedAlbum.cover} alt={selectedAlbum.title} className="w-full h-full object-cover" draggable={false} />}
                  </div>
                  <h2 className="text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>{selectedAlbum.title}</h2>
                  <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{selectedAlbum.artist} &middot; {selectedAlbum.year}</div>
                </div>
                <div className="px-3 pb-4">
                  <TrackList
                    songs={tracks}
                    currentSongId={currentSongId}
                    isPlaying={isPlaying}
                    onPlay={playPauseCurrent}
                    previewLoading={previewLoading}
                  />
                </div>
              </div>
            </>
          ) : selectedPlaylist ? (
            <>
              <MobileBackHeader label="Library" onBack={() => setSelectedPlaylist(null)} />
              <div className="flex-1 overflow-auto overscroll-contain">
                <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
                  <div className="w-44 h-44 rounded-xl shadow-2xl overflow-hidden" style={{ background: selectedPlaylist.color }}>
                    {playlistMeta?.cover ? (
                      <img src={playlistMeta.cover} alt="" className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name={selectedPlaylist.icon} size={48} className="text-white/80" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>{playlistMeta?.title || selectedPlaylist.name}</h2>
                  <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{playlistMeta?.songs?.length || 0} tracks</div>
                </div>
                <div className="px-3 pb-4">
                  {loadingPlaylist === selectedPlaylist.id ? (
                    <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--text-tertiary)" }}>
                      <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--text-tertiary)", borderTopColor: "#fa2d48" }} />
                      <span className="text-sm">Loading tracks...</span>
                    </div>
                  ) : tracks.length > 0 ? (
                    <TrackList
                      songs={tracks}
                      currentSongId={currentSongId}
                      isPlaying={isPlaying}
                      onPlay={playPauseCurrent}
                      previewLoading={previewLoading}
                    />
                  ) : (
                    <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                      No tracks found for this playlist.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : mobileSection === "albums" ? (
            <>
              <MobileBackHeader label="Library" onBack={() => setMobileSection("library")} />
              <div className="flex-1 overflow-auto overscroll-contain p-4">
                <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Albums</h2>
                <div className="grid grid-cols-2 gap-4">
                  {loadingAlbums
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="aspect-square rounded-xl animate-pulse" style={{ background: "var(--bg-input)" }} />
                          <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: "var(--bg-input)" }} />
                          <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "var(--bg-input)" }} />
                        </div>
                      ))
                    : albums.map((album) => (
                        <button key={album.id} onClick={() => setSelectedAlbum(album)} className="flex flex-col gap-2 text-left">
                          <div className="aspect-square rounded-xl shadow-lg relative overflow-hidden" style={{ background: album.color }}>
                            {album.cover && <img src={album.cover} alt={album.title} className="w-full h-full object-cover" draggable={false} />}
                          </div>
                          <div>
                            <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{album.title}</div>
                            <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{album.artist}</div>
                          </div>
                        </button>
                      ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto overscroll-contain">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Library</h2>
              </div>
              <button
                onClick={() => setMobileSection("albums")}
                className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <Icon name="Disc" size={22} style={{ color: "#fa2d48" }} />
                <span className="flex-1 text-[16px]" style={{ color: "var(--text-primary)" }}>Albums</span>
                <Icon name="ChevronRight" size={18} style={{ color: "var(--text-tertiary)" }} />
              </button>
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlaylist(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b text-left"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <Icon name={p.icon} size={22} style={{ color: "#fa2d48" }} />
                  <span className="flex-1 text-[16px]" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  <Icon name="ChevronRight" size={18} style={{ color: "var(--text-tertiary)" }} />
                </button>
              ))}
            </div>
          )}
        </MobileStack>

        {/* Mini-player — pinned below the page stack, iOS style */}
        <div className="flex-shrink-0 border-t transition-colors duration-300" style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
          <div className="px-4 pt-1.5">
            <input
              type="range" min={0} max={duration || 1} value={currentTime} onChange={handleSeek}
              className="w-full h-1 appearance-none cursor-pointer rounded-full"
              style={{ background: `linear-gradient(to right, #fa2d48 ${((currentTime || 0) / (duration || 1)) * 100}%, var(--bg-input) ${((currentTime || 0) / (duration || 1)) * 100}%)` }}
            />
          </div>
          <div className="h-14 flex items-center px-4 gap-3">
            <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: "var(--bg-input)" }}>
              {nowPlaying?.cover ? (
                <img src={nowPlaying.cover} alt="" className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
                  <Icon name="Music" size={16} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{nowPlaying?.song.title || "Not Playing"}</div>
              <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{nowPlaying?.artist || "—"}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="min-w-10 min-h-10 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
                <Icon name="SkipBack" size={20} />
              </button>
              <button onClick={togglePlay} className="min-w-10 min-h-10 flex items-center justify-center" style={{ color: "var(--text-primary)" }}>
                <Icon name={isPlaying ? "Pause" : "Play"} size={24} className={isPlaying ? "" : "ml-0.5"} />
              </button>
              <button onClick={handleNext} className="min-w-10 min-h-10 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
                <Icon name="SkipForward" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex transition-colors duration-300" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      {/* Sidebar */}
      <div className="w-48 flex flex-col py-4 px-3 gap-0.5 flex-shrink-0" style={{ background: "var(--bg-sidebar)" }}>
        <div className="flex items-center gap-2 px-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Icon name="Music" size={18} className="text-white" />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Music</span>
        </div>

        <button
          onClick={() => { setSelectedAlbum(null); setSelectedPlaylist(null); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
          style={{
            background: !selectedPlaylist ? "var(--accent)" : "transparent",
            color: !selectedPlaylist ? "#fff" : "var(--text-secondary)",
          }}
        >
          <Icon name="Disc" size={16} />
          <span>Albums</span>
        </button>

        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedAlbum(null); setSelectedPlaylist(p); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
            style={{
              background: selectedPlaylist?.id === p.id ? "var(--accent)" : "transparent",
              color: selectedPlaylist?.id === p.id ? "#fff" : "var(--text-secondary)",
            }}
          >
            <Icon name={p.icon as any} size={16} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 flex items-center px-4 border-b transition-colors duration-300 flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center rounded-lg px-3 py-1.5 gap-2 flex-1 max-w-xs transition-colors duration-300" style={{ background: "var(--bg-input)" }}>
            <Icon name="Search" size={14} style={{ color: "var(--text-tertiary)" }} />
            <input type="text" placeholder="Search" className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-tertiary)] w-full" style={{ color: "var(--text-primary)" }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedAlbum ? (
            <div className="space-y-6">
              <button onClick={() => setSelectedAlbum(null)} className="text-sm flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                <Icon name="ArrowLeft" size={14} />
                Back to Albums
              </button>

              <div className="flex items-end gap-6">
                <div className="w-40 h-40 rounded-xl shadow-2xl flex-shrink-0 overflow-hidden" style={{ background: selectedAlbum.color }}>
                  {selectedAlbum.cover && <img src={selectedAlbum.cover} alt={selectedAlbum.title} className="w-full h-full object-cover" draggable={false} />}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Album</div>
                  <h2 className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{selectedAlbum.title}</h2>
                  <div className="mt-1" style={{ color: "var(--text-secondary)" }}>{selectedAlbum.artist} &middot; {selectedAlbum.year}</div>
                </div>
              </div>

              <TrackList
                songs={tracks}
                currentSongId={currentSongId}
                isPlaying={isPlaying}
                onPlay={playPauseCurrent}
                previewLoading={previewLoading}
              />
            </div>
          ) : selectedPlaylist ? (
            <div className="space-y-6">
              <button onClick={() => { setSelectedPlaylist(null); setSelectedAlbum(null); }} className="text-sm flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                <Icon name="ArrowLeft" size={14} />
                Library
              </button>

              <div className="flex items-end gap-6">
                <div className="w-40 h-40 rounded-xl shadow-2xl flex-shrink-0 overflow-hidden" style={{ background: selectedPlaylist.color }}>
                  {playlistMeta?.cover ? (
                    <img src={playlistMeta.cover} alt="" className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name={selectedPlaylist.icon as any} size={48} className="text-white/80" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Playlist</div>
                  <h2 className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{playlistMeta?.title || selectedPlaylist.name}</h2>
                  <div className="mt-1" style={{ color: "var(--text-secondary)" }}>{playlistMeta?.songs?.length || 0} tracks</div>
                </div>
              </div>

              {loadingPlaylist === selectedPlaylist.id ? (
                <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--text-tertiary)" }}>
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--text-tertiary)", borderTopColor: "#fa2d48" }} />
                  <span className="text-sm">Loading tracks...</span>
                </div>
              ) : tracks.length > 0 ? (
                <TrackList
                  songs={tracks}
                  currentSongId={currentSongId}
                  isPlaying={isPlaying}
                  onPlay={playPauseCurrent}
                  previewLoading={previewLoading}
                />
              ) : (
                <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No tracks found for this playlist.
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Albums</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-5">
                {loadingAlbums
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="aspect-square rounded-xl animate-pulse" style={{ background: "var(--bg-input)" }} />
                        <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: "var(--bg-input)" }} />
                        <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "var(--bg-input)" }} />
                      </div>
                    ))
                  : albums.map((album) => (
                      <button key={album.id} onClick={() => setSelectedAlbum(album)} className="flex flex-col gap-2 text-left group">
                        <div className="aspect-square rounded-xl shadow-lg transition-transform group-hover:scale-105 relative overflow-hidden" style={{ background: album.color }}>
                          {album.cover && <img src={album.cover} alt={album.title} className="w-full h-full object-cover" draggable={false} />}
                          <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.35)" }}>
                            <Icon name="Play" size={13} className="text-white ml-0.5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{album.title}</div>
                          <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{album.artist}</div>
                        </div>
                      </button>
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Now Playing Bar */}
        <div className="flex-shrink-0 border-t transition-colors duration-300" style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
          <div className="px-4 py-1">
            <input
              type="range" min={0} max={duration || 1} value={currentTime} onChange={handleSeek}
              className="w-full h-1 appearance-none cursor-pointer rounded-full"
              style={{ background: `linear-gradient(to right, #fa2d48 ${((currentTime || 0) / (duration || 1)) * 100}%, var(--bg-input) ${((currentTime || 0) / (duration || 1)) * 100}%)` }}
            />
          </div>

          <div className="h-14 flex items-center px-4 gap-4">
            <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: "var(--bg-input)" }}>
              {nowPlaying?.cover ? (
                <img src={nowPlaying.cover} alt="" className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
                  <Icon name="Music" size={16} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{nowPlaying?.song.title || "Not Playing"}</div>
              <div className="text-xs truncate flex gap-2" style={{ color: "var(--text-tertiary)" }}>
                <span>{nowPlaying?.artist || "—"}</span>
                <span>{nowPlaying ? formatTime(currentTime) : ""}</span>
                <span>{nowPlaying ? formatTime(duration) : ""}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button onClick={() => setShuffle(!shuffle)} className="transition-colors" style={{ color: shuffle ? "#fa2d48" : "var(--text-tertiary)" }}>
                <Icon name="Shuffle" size={16} />
              </button>
              <button onClick={handlePrev} className="transition-colors" style={{ color: "var(--text-tertiary)" }}>
                <Icon name="SkipBack" size={18} />
              </button>
              <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105" style={{ background: "var(--text-primary)" }}>
                <Icon name={isPlaying ? "Pause" : "Play"} size={14} className="ml-0.5" style={{ color: "var(--bg-app)" }} />
              </button>
              <button onClick={handleNext} className="transition-colors" style={{ color: "var(--text-tertiary)" }}>
                <Icon name="SkipForward" size={18} />
              </button>
              <button onClick={() => setRepeat(noRepeatCycle[repeat])} className="transition-colors" style={{ color: repeat !== "off" ? "#fa2d48" : "var(--text-tertiary)" }}>
                <Icon name={repeat === "one" ? "Repeat1" : "Repeat"} size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 w-28">
              <Icon name={volume === 0 ? "VolumeX" : volume < 0.5 ? "Volume1" : "Volume2"} size={14} style={{ color: "var(--text-tertiary)" }} />
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 appearance-none cursor-pointer rounded-full" style={{ background: `linear-gradient(to right, var(--text-secondary) ${volume * 100}%, var(--bg-input) ${volume * 100}%)` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackList({
  songs,
  currentSongId,
  isPlaying,
  onPlay,
  previewLoading,
}: {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  previewLoading: string | null;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex text-xs px-3 py-2 border-b transition-colors duration-300" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-subtle)" }}>
        <span className="w-12">#</span>
        <span className="flex-1">Title</span>
        <span className="w-16 text-right">Time</span>
      </div>
      {songs.map((song) => {
        const isCurrent = currentSongId === song.id;
        const isLoading = previewLoading === song.id;
        return (
          <button
            key={song.id}
            onClick={() => onPlay(song)}
            className="flex items-center px-3 py-2 transition-colors text-left group"
            style={{ background: isCurrent ? "var(--bg-hover)" : "transparent" }}
            onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
          >
            <span className="w-12 text-sm flex items-center gap-1.5" style={{ color: isCurrent ? "#fa2d48" : "var(--text-tertiary)" }}>
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--text-tertiary)", borderTopColor: "#fa2d48" }} />
              ) : isCurrent && isPlaying ? (
                <span className="flex gap-[2px] items-center">
                  <span className="w-[2.5px] h-3 bg-[#fa2d48] rounded-full animate-pulse" />
                  <span className="w-[2.5px] h-2 bg-[#fa2d48] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                  <span className="w-[2.5px] h-3 bg-[#fa2d48] rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                </span>
              ) : (
                song.track
              )}
            </span>
            <span className="flex-1 flex flex-col min-w-0 pr-2">
              <span className="text-sm truncate" style={{ color: isLoading ? "var(--text-tertiary)" : isCurrent ? "#fa2d48" : "var(--text-primary)" }}>{song.title}</span>
              {song.artist && (
                <span className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>{song.artist}</span>
              )}
            </span>
            <span className="w-16 text-right text-sm" style={{ color: "var(--text-tertiary)" }}>{song.duration}</span>
          </button>
        );
      })}
    </div>
  );
}
