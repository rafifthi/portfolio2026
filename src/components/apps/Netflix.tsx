"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import {
  NetflixTitle,
  backdropUrl,
  netflixMovies,
  netflixSeries,
  posterUrl,
} from "@/lib/netflix-data";

const RED = "#E50914";
const BG = "#141414";
const CARD = "#181818";
const MATCH_GREEN = "#46d369";

function TitleImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] p-2 text-center ${className || ""}`}
      >
        <span className="text-xs font-semibold text-neutral-400">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

function NetflixNav({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      className="relative z-30 flex h-12 flex-shrink-0 items-center gap-6 px-4 sm:px-6"
      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(20,20,20,0.4))" }}
    >
      <span
        className="select-none text-xl font-black tracking-tighter"
        style={{ color: RED, fontFamily: "'Arial Black', Arial, sans-serif" }}
      >
        NETFLIX
      </span>
      {!isMobile && (
        <nav className="flex items-center gap-4 text-[13px] text-neutral-300">
          <span className="font-semibold text-white">Home</span>
          <span className="cursor-default transition-colors hover:text-white">Movies</span>
          <span className="cursor-default transition-colors hover:text-white">Series</span>
          <span className="cursor-default transition-colors hover:text-white">My List</span>
        </nav>
      )}
      <div className="flex-1" />
      <Icon name="Search" size={18} className="text-neutral-300" />
      <div
        className="h-7 w-7 rounded"
        style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
        aria-label="Profile"
      />
    </div>
  );
}

function HeroBanner({
  title,
  isMobile,
  onMoreInfo,
  onPlay,
}: {
  title: NetflixTitle;
  isMobile: boolean;
  onMoreInfo: () => void;
  onPlay: () => void;
}) {
  return (
    <div
      className="relative w-full flex-shrink-0"
      style={{ height: isMobile ? 300 : 340, marginTop: -48 }}
    >
      <TitleImage
        src={backdropUrl(title.backdrop, "w1280")}
        alt={title.title}
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to top, ${BG} 2%, transparent 45%)` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.72), transparent 65%)" }}
      />
      <div className={`absolute bottom-6 left-4 sm:left-6 ${isMobile ? "right-4" : "max-w-[55%]"}`}>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-sm text-[11px] font-black text-white"
            style={{ background: RED }}
          >
            N
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-300">
            #1 in Movies Today
          </span>
        </div>
        <h1 className={`mb-2 font-black text-white drop-shadow-lg ${isMobile ? "text-2xl" : "text-4xl"}`}>
          {title.title}
        </h1>
        {!isMobile && (
          <p className="mb-4 line-clamp-2 text-sm text-neutral-200 drop-shadow">
            {title.description}
          </p>
        )}
        <div className={`flex items-center gap-2 ${isMobile ? "mt-3" : ""}`}>
          <button
            type="button"
            onClick={onPlay}
            className="flex items-center gap-1.5 rounded bg-white px-4 py-1.5 text-sm font-bold text-black transition-opacity hover:opacity-80"
          >
            <Icon name="Play" size={16} style={{ fill: "black" }} />
            Play
          </button>
          <button
            type="button"
            onClick={onMoreInfo}
            className="flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold text-white transition-colors"
            style={{ background: "rgba(109,109,110,0.7)" }}
          >
            <Icon name="Info" size={16} />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}

function Top10Row({
  label,
  titles,
  isMobile,
  onSelect,
}: {
  label: string;
  titles: NetflixTitle[];
  isMobile: boolean;
  onSelect: (t: NetflixTitle) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const numeralSize = isMobile ? 88 : 140;
  const posterWidth = isMobile ? 92 : 124;

  return (
    <div className="group/row relative mt-6">
      <h2 className="mb-2 px-4 text-base font-bold text-white sm:px-6 sm:text-lg">{label}</h2>
      <div className="relative">
        <div
          ref={scrollRef}
          className="no-scrollbar flex items-end gap-1 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6"
        >
          {titles.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => onSelect(t)}
              className="relative flex flex-shrink-0 items-end focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={`Open ${t.title}`}
            >
              <span
                aria-hidden
                className="pointer-events-none relative z-0 select-none font-black"
                style={{
                  fontSize: numeralSize,
                  lineHeight: 0.75,
                  color: BG,
                  WebkitTextStroke: "4px #595959",
                  marginRight: isMobile ? -12 : -18,
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  letterSpacing: "-0.08em",
                }}
              >
                {t.rank}
              </span>
              <motion.div
                whileHover={isMobile ? undefined : { scale: 1.08, zIndex: 20 }}
                transition={{ type: "tween", duration: 0.18 }}
                className="relative z-10 overflow-hidden rounded-md shadow-lg"
                style={{ width: posterWidth }}
              >
                <TitleImage
                  src={posterUrl(t.poster)}
                  alt={t.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              </motion.div>
            </button>
          ))}
        </div>
        {!isMobile && (
          <>
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              aria-label="Scroll left"
              className="absolute left-0 top-0 z-20 flex h-full w-8 items-center justify-center bg-gradient-to-r from-black/70 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
            >
              <Icon name="ChevronLeft" size={26} className="text-white" />
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              aria-label="Scroll right"
              className="absolute right-0 top-0 z-20 flex h-full w-8 items-center justify-center bg-gradient-to-l from-black/70 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100"
            >
              <Icon name="ChevronRight" size={26} className="text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DetailModal({
  title,
  isMobile,
  onClose,
  onPlay,
}: {
  title: NetflixTitle;
  isMobile: boolean;
  onClose: () => void;
  onPlay: () => void;
}) {
  // HomeClient closes the topmost window on Escape via a bubble-phase window
  // listener — intercept in capture phase so Esc #1 only closes this modal.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose]);

  const rankLabel = `#${title.rank} in ${title.kind === "movie" ? "Movies" : "Series"} Today`;

  const card = (
    <div className="flex flex-col">
      <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden">
        <TitleImage
          src={backdropUrl(title.backdrop, "w780")}
          alt={title.title}
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${CARD} 4%, transparent 50%)` }}
        />
        <div className="absolute bottom-4 left-4 right-4 sm:left-6">
          <h2 className="text-2xl font-black text-white drop-shadow sm:text-3xl">{title.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
        >
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlay}
            className="flex items-center gap-1.5 rounded bg-white px-5 py-1.5 text-sm font-bold text-black transition-opacity hover:opacity-80"
          >
            <Icon name="Play" size={16} style={{ fill: "black" }} />
            Play
          </button>
          <button
            type="button"
            aria-label="Add to My List"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-500 text-white transition-colors hover:border-white"
          >
            <Icon name="Plus" size={16} />
          </button>
          <button
            type="button"
            aria-label="Like"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-500 text-white transition-colors hover:border-white"
          >
            <Icon name="ThumbsUp" size={14} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="font-bold" style={{ color: MATCH_GREEN }}>
            {title.match}% Match
          </span>
          <span className="text-neutral-300">{title.year}</span>
          <span className="border border-neutral-500 px-1 text-[10px] uppercase text-neutral-300">
            {title.maturity}
          </span>
          <span className="text-neutral-300">{title.duration}</span>
          <span className="rounded-sm border border-neutral-500 px-1 text-[10px] text-neutral-300">
            HD
          </span>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-200">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-sm text-[11px] font-black text-white"
            style={{ background: RED }}
          >
            N
          </span>
          {rankLabel}
        </div>

        <p className="text-sm leading-relaxed text-neutral-200">{title.description}</p>

        <div className="flex flex-col gap-1 text-[13px]">
          <p>
            <span className="text-neutral-500">Cast: </span>
            <span className="text-neutral-200">{title.cast.join(", ")}</span>
          </p>
          <p>
            <span className="text-neutral-500">Genres: </span>
            <span className="text-neutral-200">{title.genres.join(", ")}</span>
          </p>
        </div>
      </div>
    </div>
  );

  // Portal to <body> so the modal centers on the actual screen (like the real
  // Netflix app) instead of being trapped inside the app window, which is
  // cascade-positioned on desktop and transform-scaled on tablet.
  if (typeof document === "undefined") return null;

  const overlay = (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
    >
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 h-full w-full bg-black/70"
        onClick={onClose}
      />
      {isMobile ? (
        <motion.div
          key="netflix-detail-mobile"
          className="absolute inset-0 overflow-y-auto"
          style={{ background: CARD }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
        >
          {card}
        </motion.div>
      ) : (
        <motion.div
          key="netflix-detail-desktop"
          className="relative z-10 mx-4 max-h-[86vh] w-full max-w-[850px] overflow-y-auto overflow-x-hidden rounded-lg shadow-2xl"
          style={{ background: CARD }}
          initial={{ scale: 0.96, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
        >
          {card}
        </motion.div>
      )}
    </motion.div>
  );

  return createPortal(overlay, document.body);
}

export default function Netflix({
  isMobile = false,
  netflixMovies: movies = netflixMovies,
  netflixSeries: series = netflixSeries,
}: {
  isMobile?: boolean;
  netflixMovies?: NetflixTitle[];
  netflixSeries?: NetflixTitle[];
}) {
  const [selected, setSelected] = useState<NetflixTitle | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const handlePlay = () => {
    showToast("This is a portfolio, not a streaming service 🍿");
  };

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: BG, color: "white" }}
    >
      <NetflixNav isMobile={isMobile} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <HeroBanner
          title={movies[0]}
          isMobile={isMobile}
          onMoreInfo={() => setSelected(movies[0])}
          onPlay={handlePlay}
        />
        <Top10Row
          label="Top 10 Movies"
          titles={movies}
          isMobile={isMobile}
          onSelect={setSelected}
        />
        <Top10Row
          label="Top 10 Series"
          titles={series}
          isMobile={isMobile}
          onSelect={setSelected}
        />
        <div className="h-8" />
      </div>

      {selected && (
        <DetailModal
          key={selected.id}
          title={selected}
          isMobile={isMobile}
          onClose={() => setSelected(null)}
          onPlay={handlePlay}
        />
      )}

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex justify-center">
          <motion.div
            className="whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium text-white shadow-xl"
            style={{ background: "rgba(40,40,40,0.95)", border: "1px solid rgba(255,255,255,0.15)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {toast}
          </motion.div>
        </div>
      )}
    </div>
  );
}
