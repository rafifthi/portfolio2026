"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PALETTE } from "./theme";
import { useMeasure } from "./hooks";

/** A measured play surface. Children receive pixel dimensions so every game can
 *  compute geometry in real pixels that fit the current window / sheet exactly,
 *  with touch-action disabled so drags don't scroll the page. */
export function GameArea({
  children,
  background,
  className = "",
  onPointerLeave,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode;
  background?: string;
  className?: string;
  onPointerLeave?: () => void;
}) {
  const [ref, size] = useMeasure<HTMLDivElement>();
  return (
    <div
      ref={ref}
      onPointerLeave={onPointerLeave}
      className={`relative flex-1 min-h-0 w-full overflow-hidden select-none ${className}`}
      style={{ background, touchAction: "none", WebkitUserSelect: "none" }}
    >
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}

/** Row of control hints shown at the foot of a game. */
export function HintBar({ hints }: { hints: string[] }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-[11px] font-medium"
      style={{
        color: "rgba(255,255,255,0.72)",
        background: "rgba(0,0,0,0.28)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {hints.map((h, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span style={{ opacity: 0.3 }}>·</span>}
          {h}
        </span>
      ))}
    </div>
  );
}

/** Small heart pip row for lives. */
export function Lives({ total, left }: { total: number; left: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            fontSize: 14,
            lineHeight: 1,
            filter: i < left ? "none" : "grayscale(1)",
            opacity: i < left ? 1 : 0.35,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

/** Win / lose overlay with retry + return-to-map. */
export function ResultOverlay({
  status,
  title,
  message,
  accent,
  onRetry,
  onMap,
}: {
  status: "won" | "lost" | null;
  title: string;
  message: string;
  accent: string;
  onRetry: () => void;
  onMap: () => void;
}) {
  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-center justify-center p-6"
          style={{ background: "rgba(6,10,16,0.72)", backdropFilter: "blur(3px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="w-full max-w-[320px] rounded-2xl p-6 text-center"
            style={{
              background: PALETTE.parchment,
              color: PALETTE.ink,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              border: `1px solid ${PALETTE.parchmentShadow}`,
            }}
          >
            <div className="text-4xl mb-2" aria-hidden>
              {status === "won" ? "🏛️" : "⚓"}
            </div>
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            <p className="mt-1.5 text-sm" style={{ color: PALETTE.inkSoft }}>
              {message}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={onRetry}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
                style={{ background: accent }}
              >
                {status === "won" ? "Play again" : "Try again"}
              </button>
              <button
                onClick={onMap}
                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-transform active:scale-95"
                style={{
                  background: "transparent",
                  color: PALETTE.ink,
                  border: `1px solid ${PALETTE.parchmentShadow}`,
                }}
              >
                Back to the map
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Centered "tap to begin" scrim so no game auto-runs before the player is
 *  ready (also lets the sheet finish its open animation first). */
export function StartScrim({
  title,
  instruction,
  accent,
  onStart,
}: {
  title: string;
  instruction: string;
  accent: string;
  onStart: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 p-6 text-center"
      style={{ background: "rgba(6,10,16,0.55)", backdropFilter: "blur(2px)" }}
    >
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="max-w-[300px] text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
        {instruction}
      </p>
      <button
        onClick={onStart}
        className="mt-1 rounded-full px-7 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
        style={{ background: accent, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
      >
        Begin
      </button>
    </div>
  );
}
