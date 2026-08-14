"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ISLANDS, HOME_PORT, PALETTE, STORAGE_KEY, GameId, Island } from "./theme";
import { usePrefersReducedMotion } from "./hooks";
import Atlas from "./Atlas";
import CyclopsGame from "./games/Cyclops";
import CirceGame from "./games/Circe";
import UnderworldGame from "./games/Underworld";
import ScyllaGame from "./games/ScyllaCharybdis";

export interface OdysseyGameProps {
  accent: string;
  reducedMotion: boolean;
  /** Mark this island as cleared (idempotent). */
  onWin: () => void;
  /** Return to the atlas. */
  onExit: () => void;
}

const GAME_COMPONENTS: Record<GameId, React.ComponentType<OdysseyGameProps>> = {
  cyclops: CyclopsGame,
  circe: CirceGame,
  underworld: UnderworldGame,
  scylla: ScyllaGame,
};

const emptyProgress: Record<GameId, boolean> = {
  cyclops: false,
  circe: false,
  underworld: false,
  scylla: false,
};

type View = { kind: "atlas" } | { kind: "playing"; island: Island };

/** Position of the last cleared island in story order — where the ship rests.
 *  Ithaca before anything is cleared. */
function restingPos(completed: Record<GameId, boolean>) {
  let idx = -1;
  for (let i = 0; i < ISLANDS.length; i++) {
    if (completed[ISLANDS[i].id]) idx = i;
    else break;
  }
  return idx >= 0 ? { x: ISLANDS[idx].x, y: ISLANDS[idx].y } : HOME_PORT;
}

export default function Odyssey() {
  const reducedMotion = usePrefersReducedMotion();
  const [view, setView] = useState<View>({ kind: "atlas" });
  const [completed, setCompleted] = useState<Record<GameId, boolean>>(emptyProgress);
  const [shipPos, setShipPos] = useState(HOME_PORT);
  const [sailingTo, setSailingTo] = useState<Island | null>(null);
  const [selectedId, setSelectedId] = useState<GameId | null>(null);

  // Load persisted progress once on mount. localStorage is client-only, so the
  // state must start empty on the server and resolve after hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = { ...emptyProgress, ...JSON.parse(raw) };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompleted(saved);
        setShipPos(restingPos(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Record<GameId, boolean>) => {
    setCompleted(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  // The single unlocked objective — first island in story order not yet cleared.
  const activeIndex = ISLANDS.findIndex((i) => !completed[i.id]);
  const activeId = activeIndex >= 0 ? ISLANDS[activeIndex].id : null;
  const allDone = activeId === null;

  const isPlayable = useCallback(
    (id: GameId) => completed[id] || id === activeId,
    [completed, activeId]
  );

  const selectedIsland = selectedId ? ISLANDS.find((i) => i.id === selectedId) ?? null : null;

  // Tapping any pin opens the quest drawer — even a locked one, so its details
  // can be previewed. Only the drawer's CTA is gated on being playable.
  const handleSelect = useCallback(
    (id: GameId) => {
      if (sailingTo) return; // don't open mid-voyage
      setSelectedId(id);
    },
    [sailingTo]
  );

  const handleCloseDrawer = useCallback(() => setSelectedId(null), []);

  // The drawer's CTA launches the voyage — no-op for a locked island.
  const handleStartQuest = useCallback(
    (island: Island) => {
      if (!isPlayable(island.id)) return;
      setSelectedId(null);
      setSailingTo(island);
    },
    [isPlayable]
  );

  // Sail the ship across the map, then open the game. Timer-driven so arrival
  // fires reliably even when the destination equals the ship's current spot
  // (e.g. replaying a cleared island the ship is already resting at).
  const sailMs = useMemo(() => {
    if (!sailingTo) return 0;
    if (reducedMotion) return 250;
    const d = Math.hypot(sailingTo.x - shipPos.x, sailingTo.y - shipPos.y);
    return Math.round(Math.min(2000, Math.max(650, 420 + d * 42)));
  }, [sailingTo, shipPos, reducedMotion]);

  useEffect(() => {
    if (!sailingTo) return;
    const target = sailingTo;
    const t = setTimeout(() => {
      setShipPos({ x: target.x, y: target.y });
      setView({ kind: "playing", island: target });
      setSailingTo(null);
    }, sailMs + 60);
    return () => clearTimeout(t);
  }, [sailingTo, sailMs]);

  const handleExit = useCallback(() => setView({ kind: "atlas" }), []);

  const handleWin = useCallback(
    (id: GameId) => {
      if (completed[id]) return;
      persist({ ...completed, [id]: true });
    },
    [completed, persist]
  );

  const resetProgress = useCallback(() => {
    persist({ ...emptyProgress });
    setShipPos(HOME_PORT);
    setSailingTo(null);
    setView({ kind: "atlas" });
  }, [persist]);

  const outerBg = useMemo(
    () =>
      view.kind === "atlas"
        ? `linear-gradient(160deg, ${PALETTE.parchment}, ${PALETTE.parchmentDeep})`
        : PALETTE.night,
    [view.kind]
  );

  const GameComponent = view.kind === "playing" ? GAME_COMPONENTS[view.island.id] : null;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: outerBg, transition: "background 240ms ease" }}
    >
      {/* Atlas layer — full-cover so the playing view can overlay/cross-fade. */}
      {view.kind === "atlas" && (
        <div className="absolute inset-0 flex flex-col">
          <Atlas
            completed={completed}
            activeId={activeId}
            shipPos={shipPos}
            sailingTo={sailingTo}
            sailMs={sailMs}
            selected={selectedIsland}
            reducedMotion={reducedMotion}
            onSelect={handleSelect}
            onStartQuest={handleStartQuest}
            onCloseDrawer={handleCloseDrawer}
          />
          {allDone && !sailingTo && (
            <div className="px-4 pb-2 text-center text-[11px]" style={{ color: PALETTE.inkSoft }}>
              🏛️ You are home, Odysseus — every trial survived. ·{" "}
              <button onClick={resetProgress} className="underline" style={{ color: PALETTE.crimson }}>
                Sail again
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {view.kind === "playing" && GameComponent && (
          <motion.div
            key={view.island.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Slim shell header — return to map without closing the app */}
            <div
              className="flex flex-shrink-0 items-center gap-2 px-3 py-1.5"
              style={{ background: "rgba(0,0,0,0.35)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={handleExit}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold transition-transform active:scale-95"
                style={{ color: PALETTE.parchment, background: "rgba(255,255,255,0.08)" }}
              >
                <span aria-hidden>⚓</span> Map
              </button>
              <span className="flex-1 truncate text-center text-[12px] font-semibold" style={{ color: PALETTE.parchment }}>
                {view.island.name}
              </span>
              <span className="w-[52px]" aria-hidden />
            </div>

            <GameComponent
              accent={view.island.accent}
              reducedMotion={reducedMotion}
              onWin={() => handleWin(view.island.id)}
              onExit={handleExit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
