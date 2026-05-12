"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@/components/Icon";
import { albums, playlists } from "@/lib/data";
import { Album, Song, Playlist } from "@/lib/types";

function formatTime(s: number) {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function allSongs() {
  return albums.flatMap((a) => a.songs);
}

function songAlbum(songId: string) {
  return albums.find((a) => a.songs.some((s) => s.id === songId)) || null;
}

export default function Music() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");

  const currentSong = currentSongId ? allSongs().find((s) => s.id === currentSongId) : null;
  const currentAlbum = currentSongId ? songAlbum(currentSongId) : selectedAlbum;

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
      } else if (repeat === "all") {
        const source = selectedAlbum || selectedPlaylist;
        const songs = source
          ? "songs" in source
            ? source.songs
            : source.songIds.map((id) => allSongs().find((s) => s.id === id)!).filter(Boolean)
          : [];
        const idx = songs.findIndex((s) => s.id === currentSongId);
        if (idx < songs.length - 1) {
          const nextSong = songs[idx + 1];
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
  }, [repeat, selectedAlbum, selectedPlaylist, currentSongId]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const playSong = useCallback((song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentSongId(song.id);
    audio.src = song.audioUrl;
    audio.currentTime = 0;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    setDuration(0);
    setCurrentTime(0);
  }, []);

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
    if (!currentSongId) return;
    const source = selectedAlbum || selectedPlaylist;
    const songs = source
      ? "songs" in source
        ? source.songs
        : source.songIds.map((id) => allSongs().find((s) => s.id === id)!).filter(Boolean)
      : [];
    const idx = songs.findIndex((s) => s.id === currentSongId);
    if (idx > 0) playSong(songs[idx - 1]);
  }, [currentSongId, selectedAlbum, selectedPlaylist, playSong]);

  const handleNext = useCallback(() => {
    if (!currentSongId) return;
    const source = selectedAlbum || selectedPlaylist;
    const songs = source
      ? "songs" in source
        ? source.songs
        : source.songIds.map((id) => allSongs().find((s) => s.id === id)!).filter(Boolean)
      : [];
    const idx = songs.findIndex((s) => s.id === currentSongId);
    if (shuffle && songs.length > 1) {
      const pick = songs[Math.floor(Math.random() * songs.length)];
      if (pick) { playSong(pick); return; }
    }
    if (idx < songs.length - 1) playSong(songs[idx + 1]);
  }, [currentSongId, selectedAlbum, selectedPlaylist, shuffle, playSong]);

  const playPauseCurrent = useCallback(
    (song: Song) => {
      if (currentSongId === song.id) togglePlay();
      else playSong(song);
    },
    [currentSongId, togglePlay, playSong]
  );

  const noRepeatCycle: Record<string, "off" | "one" | "all"> = { off: "all", all: "one", one: "off" };

  const sidebarItems: { id: string; label: string; icon: string }[] = [
    { id: "albums", label: "Albums", icon: "Disc" },
    ...playlists.map((p) => ({ id: p.id, label: p.name, icon: p.icon })),
  ];

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

        {sidebarItems.map((item) => {
          const isActive = item.id === "albums"
            ? selectedPlaylist === null
            : selectedPlaylist?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "albums") { setSelectedPlaylist(null); setSelectedAlbum(null); }
                else { const p = playlists.find((pl) => pl.id === item.id)!; setSelectedPlaylist(p); setSelectedAlbum(null); }
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
              style={{
                background: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
              }}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
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
          {/* Album detail view */}
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
                songs={selectedAlbum.songs}
                currentSongId={currentSongId}
                isPlaying={isPlaying}
                onPlay={playPauseCurrent}
              />
            </div>
          ) : /* Playlist view */
          selectedPlaylist ? (
            <div className="space-y-6">
              <div className="flex items-end gap-6">
                <div className="w-40 h-40 rounded-xl shadow-2xl flex-shrink-0 flex items-center justify-center" style={{ background: selectedPlaylist.color }}>
                  <Icon name={selectedPlaylist.icon as any} size={48} className="text-white/80" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Playlist</div>
                  <h2 className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{selectedPlaylist.name}</h2>
                  <div className="mt-1" style={{ color: "var(--text-secondary)" }}>{selectedPlaylist.songIds.length} songs</div>
                </div>
              </div>

              <TrackList
                songs={selectedPlaylist.songIds.map((id) => allSongs().find((s) => s.id === id)!).filter(Boolean)}
                currentSongId={currentSongId}
                isPlaying={isPlaying}
                onPlay={playPauseCurrent}
              />
            </div>
          ) : (
            /* Album grid */
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Albums</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {albums.map((album) => (
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
              {currentAlbum?.cover && <img src={currentAlbum.cover} alt="" className="w-full h-full object-cover" draggable={false} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{currentSong?.title || "Not Playing"}</div>
              <div className="text-xs truncate flex gap-2" style={{ color: "var(--text-tertiary)" }}>
                <span>{currentAlbum?.artist || "—"}</span>
                <span>{currentSong ? formatTime(currentTime) : ""}</span>
                <span>{currentSong ? formatTime(duration) : ""}</span>
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
}: {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
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
        return (
          <button
            key={song.id}
            onClick={() => onPlay(song)}
            className="flex items-center px-3 py-2.5 transition-colors text-left group"
            style={{ background: isCurrent ? "var(--bg-hover)" : "transparent" }}
            onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
          >
            <span className="w-12 text-sm flex items-center gap-1.5" style={{ color: isCurrent ? "#fa2d48" : "var(--text-tertiary)" }}>
              {isCurrent && isPlaying ? (
                <span className="flex gap-[2px] items-center">
                  <span className="w-[2.5px] h-3 bg-[#fa2d48] rounded-full animate-pulse" />
                  <span className="w-[2.5px] h-2 bg-[#fa2d48] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                  <span className="w-[2.5px] h-3 bg-[#fa2d48] rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                </span>
              ) : (
                song.track
              )}
            </span>
            <span className="flex-1 text-sm truncate pr-2" style={{ color: isCurrent ? "#fa2d48" : "var(--text-primary)" }}>{song.title}</span>
            <span className="w-16 text-right text-sm" style={{ color: "var(--text-tertiary)" }}>{song.duration}</span>
          </button>
        );
      })}
    </div>
  );
}
