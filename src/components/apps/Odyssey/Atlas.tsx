"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ISLANDS, HOME_PORT, PALETTE, GameId, Island } from "./theme";
import { useIsTouch } from "./hooks";

type PinState = "done" | "active" | "locked";

/** Tiny per-island emblem, drawn in a 24×24 box. */
function Emblem({ id }: { id: GameId }) {
  const stroke = "#fff";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "cyclops":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path {...common} d="M3 12c3-4.5 6-6.5 9-6.5s6 2 9 6.5c-3 4.5-6 6.5-9 6.5s-6-2-9-6.5Z" />
          <circle cx="12" cy="12" r="2.6" fill={stroke} />
        </svg>
      );
    case "circe":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path {...common} d="M9 3h6M10 3v5l-4.4 8.2A2 2 0 0 0 7.4 19h9.2a2 2 0 0 0 1.8-2.8L14 8V3" />
          <path {...common} d="M7.4 13.5c1.6-1 3.2 1 4.9 0s3.1 1 4.4.3" />
        </svg>
      );
    case "underworld":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path {...common} d="M12 3a7 7 0 0 0-7 7v3.5c0 1 .8 1.8 1.8 1.8H8v2.7h8v-2.7h1.2c1 0 1.8-.8 1.8-1.8V10a7 7 0 0 0-7-7Z" />
          <circle cx="9.3" cy="10.5" r="1.4" fill={stroke} />
          <circle cx="14.7" cy="10.5" r="1.4" fill={stroke} />
        </svg>
      );
    case "scylla":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path {...common} d="M12 5.5a6.5 6.5 0 1 1-6 4" />
          <path {...common} d="M12 9a3 3 0 1 1-2.6 1.5" />
          <path {...common} d="M12 12a1 1 0 1 0 0 .01" />
        </svg>
      );
  }
}

/** The caravel that lives on the map and sails between islands. Arrival is
 *  handled by a timer in the shell, so this only draws the motion. */
function Ship({
  shipPos,
  sailingTo,
  sailMs,
  reducedMotion,
}: {
  shipPos: { x: number; y: number };
  sailingTo: Island | null;
  sailMs: number;
  reducedMotion: boolean;
}) {
  const target = sailingTo ?? shipPos;
  const facingLeft = sailingTo ? sailingTo.x < shipPos.x : false;
  return (
    <motion.div
      className="pointer-events-none absolute z-[5]"
      style={{ transform: "translate(-50%,-50%)" }}
      initial={false}
      animate={{ left: `${target.x}%`, top: `${target.y}%` }}
      transition={{ duration: sailingTo ? sailMs / 1000 : 0, ease: "easeInOut" }}
    >
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -3, 0], rotate: [-2.5, 2.5, -2.5] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ transform: `translate(-50%,-50%) scaleX(${facingLeft ? -1 : 1})` }}
      >
        <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden>
          <path d="M24 7 L24 26 L11 26 Z" fill={PALETTE.parchment} />
          <path d="M24 9 L24 24 L35 24 Z" fill={PALETTE.parchmentDeep} />
          <line x1="24" y1="5" x2="24" y2="30" stroke={PALETTE.ink} strokeWidth="1.6" />
          <path d="M9 30 L39 30 L33.5 40 L14.5 40 Z" fill={PALETTE.crimson} />
          <path d="M9 30 L39 30 L37.5 33 L10.5 33 Z" fill={PALETTE.ink} opacity="0.55" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function Pin({
  island,
  order,
  state,
  touch,
  onSelect,
}: {
  island: Island;
  order: number;
  state: PinState;
  touch: boolean;
  onSelect: () => void;
}) {
  const [hover, setHover] = useState(false);
  const locked = state === "locked";
  const done = state === "done";
  const active = state === "active";

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="absolute flex flex-col items-center"
      style={{
        left: `${island.x}%`,
        top: `${island.y}%`,
        transform: "translate(-50%, -50%)",
        touchAction: "manipulation",
        cursor: "pointer",
      }}
      aria-label={
        locked
          ? `${island.name} — locked. View quest details.`
          : `${island.name}. ${island.subtitle}`
      }
    >
      <motion.span
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={active ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 52,
          height: 52,
          background: locked ? "#8a8377" : island.accent,
          filter: locked ? "grayscale(0.6)" : "none",
          opacity: locked ? 0.75 : 1,
          boxShadow: active
            ? `0 6px 16px rgba(0,0,0,0.45), 0 0 0 3px ${PALETTE.goldBright}, 0 0 18px ${PALETTE.goldBright}`
            : `0 6px 16px rgba(0,0,0,0.45), 0 0 0 3px ${PALETTE.parchment}, 0 0 0 4px rgba(0,0,0,0.25)`,
        }}
      >
        {locked ? (
          <span className="text-xl" aria-hidden>
            🔒
          </span>
        ) : (
          <Emblem id={island.id} />
        )}

        {/* order number badge */}
        <span
          className="absolute -left-1.5 -top-1.5 flex items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            width: 18,
            height: 18,
            background: PALETTE.ink,
            color: PALETTE.parchment,
            boxShadow: `0 0 0 2px ${PALETTE.parchment}`,
          }}
          aria-hidden
        >
          {order}
        </span>

        {done && (
          <span
            className="absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full text-[11px]"
            style={{
              width: 20,
              height: 20,
              background: PALETTE.goldBright,
              color: PALETTE.ink,
              boxShadow: `0 0 0 2px ${PALETTE.parchment}`,
            }}
            aria-hidden
          >
            ★
          </span>
        )}
      </motion.span>

      <span
        className="mt-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold"
        style={{
          background: "rgba(20,12,4,0.82)",
          color: locked ? "rgba(233,216,180,0.6)" : PALETTE.parchment,
          opacity: touch || hover || active ? 1 : 0.85,
        }}
      >
        {island.name}
      </span>
      {active && (
        <span
          className="mt-0.5 rounded px-1.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: PALETTE.goldBright, color: PALETTE.ink }}
        >
          Tap ▸ Quest
        </span>
      )}
      {hover && !touch && !locked && !active && (
        <span
          className="mt-1 max-w-[160px] whitespace-normal text-center text-[10px] leading-tight"
          style={{ color: PALETTE.ink, textShadow: `0 1px 0 ${PALETTE.parchmentDeep}` }}
        >
          {island.subtitle}
        </span>
      )}
    </button>
  );
}

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: PALETTE.inkSoft }}>
        {label}
      </p>
      <p className="text-[12px] leading-snug">{children}</p>
    </div>
  );
}

/** Floating quest drawer that slides in when a pin is tapped. */
function QuestDrawer({
  island,
  order,
  completed,
  locked,
  reducedMotion,
  onStart,
  onClose,
}: {
  island: Island;
  order: number;
  completed: boolean;
  locked: boolean;
  reducedMotion: boolean;
  onStart: (island: Island) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* click-away layer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-20"
        style={{ background: "rgba(6,14,20,0.28)" }}
      />
      <motion.aside
        initial={{ x: reducedMotion ? 0 : 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: reducedMotion ? 0 : 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="absolute bottom-2 right-2 top-2 z-30 flex w-[min(300px,86%)] flex-col overflow-hidden rounded-2xl"
        style={{
          background: PALETTE.parchment,
          color: PALETTE.ink,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          border: `1px solid ${PALETTE.parchmentShadow}`,
        }}
      >
        {/* header */}
        <div className="relative flex items-center gap-2.5 px-3 py-2.5" style={{ background: island.accent }}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Emblem id={island.id} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white">{island.name}</p>
            <p className="text-[10px] font-medium text-white/85">
              Trial {order} · {island.kind}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] text-white"
            style={{ background: "rgba(0,0,0,0.22)" }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <DrawerSection label="The Trial">{island.lore}</DrawerSection>
          <DrawerSection label="Objective">{island.objective}</DrawerSection>

          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: PALETTE.inkSoft }}>
            Reward
          </p>
          <div
            className="flex items-center gap-2 rounded-lg px-2.5 py-2"
            style={{ background: "rgba(216,166,58,0.18)", border: `1px solid ${PALETTE.parchmentShadow}` }}
          >
            <span className="text-lg" aria-hidden>
              {island.rewardIcon}
            </span>
            <span className="text-[12px] font-semibold">{island.reward}</span>
            {completed && (
              <span className="ml-auto text-[11px] font-bold" style={{ color: PALETTE.vine }}>
                Earned ★
              </span>
            )}
          </div>

          <div
            className="mt-3 text-[11px] font-semibold"
            style={{ color: locked ? PALETTE.ember : completed ? PALETTE.vine : PALETTE.inkSoft }}
          >
            {locked
              ? "🔒 Locked — clear the earlier trials to unlock this voyage"
              : completed
                ? "✓ Trial cleared — replay any time"
                : "◦ Not yet cleared"}
          </div>
        </div>

        {/* CTA */}
        <div className="px-3 py-2.5" style={{ borderTop: `1px solid ${PALETTE.parchmentShadow}` }}>
          <button
            onClick={() => onStart(island)}
            disabled={locked}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-transform enabled:active:scale-95"
            style={{
              background: locked ? PALETTE.parchmentShadow : island.accent,
              opacity: locked ? 0.85 : 1,
              cursor: locked ? "not-allowed" : "pointer",
              boxShadow: locked ? "none" : "0 6px 16px rgba(0,0,0,0.25)",
            }}
          >
            {locked ? `🔒 Locked · finish Trial ${order - 1} first` : `⛵ ${completed ? "Set sail again" : "Set sail"}`}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default function Atlas({
  completed,
  activeId,
  shipPos,
  sailingTo,
  sailMs,
  selected,
  reducedMotion,
  onSelect,
  onStartQuest,
  onCloseDrawer,
}: {
  completed: Record<GameId, boolean>;
  activeId: GameId | null;
  shipPos: { x: number; y: number };
  sailingTo: Island | null;
  sailMs: number;
  selected: Island | null;
  reducedMotion: boolean;
  onSelect: (id: GameId) => void;
  onStartQuest: (island: Island) => void;
  onCloseDrawer: () => void;
}) {
  const touch = useIsTouch();
  const activeIndex = activeId ? ISLANDS.findIndex((i) => i.id === activeId) : -1;
  const activeIsland = activeIndex >= 0 ? ISLANDS[activeIndex] : null;

  const pinState = (id: GameId): PinState =>
    completed[id] ? "done" : id === activeId ? "active" : "locked";

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5">
        <div>
          <h2
            className="text-[15px] font-bold tracking-tight"
            style={{ color: PALETTE.ink, fontFamily: "var(--font-geist-sans)" }}
          >
            The Odyssey
          </h2>
          <p className="text-[11px]" style={{ color: PALETTE.inkSoft }}>
            {activeIsland
              ? `Trial ${activeIndex + 1} of ${ISLANDS.length} — sail to ${activeIsland.name}`
              : `All ${ISLANDS.length} trials survived — the long way home`}
          </p>
        </div>
        <div className="flex items-center gap-1" aria-hidden>
          {ISLANDS.map((i) => (
            <span
              key={i.id}
              style={{
                fontSize: 13,
                color: completed[i.id] ? PALETTE.gold : PALETTE.parchmentShadow,
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="relative mx-3 mb-3 flex-1 overflow-hidden rounded-xl">
        {/* Sea */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 30% 20%, ${PALETTE.seaLight}, ${PALETTE.sea} 45%, ${PALETTE.seaDeep} 100%)`,
          }}
        />
        {/* Decorative sea + coastlines (stretched to fill) */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {[20, 40, 60, 80].map((p) => (
            <line key={`h${p}`} x1="0" y1={p} x2="100" y2={p} stroke="#ffffff" strokeWidth="0.15" opacity="0.08" />
          ))}
          {[20, 40, 60, 80].map((p) => (
            <line key={`v${p}`} x1={p} y1="0" x2={p} y2="100" stroke="#ffffff" strokeWidth="0.15" opacity="0.08" />
          ))}
          {Array.from({ length: 26 }).map((_, i) => {
            const wx = (i * 37) % 100;
            const wy = (i * 53) % 100;
            return (
              <path
                key={i}
                d={`M${wx} ${wy} q1.5 -1.4 3 0 t3 0`}
                fill="none"
                stroke={PALETTE.foam}
                strokeWidth="0.35"
                opacity="0.22"
              />
            );
          })}
          {/* island landmasses beneath each pin */}
          {ISLANDS.map((i) => (
            <ellipse key={i.id} cx={i.x} cy={i.y} rx="11" ry="8" fill={PALETTE.parchmentDeep} opacity="0.9" />
          ))}
          <ellipse cx={HOME_PORT.x} cy={HOME_PORT.y} rx="8" ry="6" fill={PALETTE.parchmentDeep} opacity="0.9" />

          {/* The sequential voyage route: Ithaca → island 1 → 2 → 3 → 4 */}
          {(() => {
            const stops = [HOME_PORT, ...ISLANDS];
            return stops.slice(0, -1).map((from, idx) => {
              const to = stops[idx + 1];
              // Bright once the leg is behind you (destination cleared), faint ahead.
              const legDone = completed[(stops[idx + 1] as Island).id];
              return (
                <line
                  key={idx}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={legDone ? PALETTE.goldBright : PALETTE.parchment}
                  strokeWidth={legDone ? 0.5 : 0.4}
                  strokeDasharray="1.4 1.6"
                  opacity={legDone ? 0.7 : 0.32}
                />
              );
            });
          })()}

          {/* Active sailing leg, highlighted */}
          {sailingTo && (
            <line
              x1={shipPos.x}
              y1={shipPos.y}
              x2={sailingTo.x}
              y2={sailingTo.y}
              stroke={PALETTE.goldBright}
              strokeWidth="0.6"
              strokeDasharray="1.6 1.4"
              opacity="0.85"
            />
          )}
        </svg>

        {/* Compass rose */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute h-16 w-16" style={{ right: 8, bottom: 8, opacity: 0.85 }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke={PALETTE.parchment} strokeWidth="3" opacity="0.5" />
          <path d="M50 6 L58 50 L50 94 L42 50 Z" fill={PALETTE.parchment} opacity="0.55" />
          <path d="M6 50 L50 42 L94 50 L50 58 Z" fill={PALETTE.parchment} opacity="0.35" />
          <path d="M50 6 L58 50 L50 50 Z" fill={PALETTE.gold} />
          <text x="50" y="20" textAnchor="middle" fontSize="12" fill={PALETTE.parchment} opacity="0.8">
            N
          </text>
        </svg>

        {/* Home port marker */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${HOME_PORT.x}%`, top: `${HOME_PORT.y}%`, transform: "translate(-50%,-50%)" }}
          aria-hidden
        >
          <span style={{ fontSize: 16 }}>🏛️</span>
          <span className="text-[9px] font-semibold" style={{ color: PALETTE.ink }}>
            Ithaca
          </span>
        </div>

        {/* The ship, sailing on the map */}
        <Ship shipPos={shipPos} sailingTo={sailingTo} sailMs={sailMs} reducedMotion={reducedMotion} />

        {/* Island pins */}
        {ISLANDS.map((island, idx) => (
          <Pin
            key={island.id}
            island={island}
            order={idx + 1}
            state={pinState(island.id)}
            touch={touch}
            onSelect={() => onSelect(island.id)}
          />
        ))}

        {/* Sailing caption */}
        {sailingTo && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center"
          >
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: "rgba(20,12,4,0.8)", color: PALETTE.parchment }}
            >
              ⛵ Setting sail for {sailingTo.name}…
            </span>
          </div>
        )}

        {/* Quest detail drawer */}
        <AnimatePresence>
          {selected && (
            <QuestDrawer
              island={selected}
              order={ISLANDS.findIndex((i) => i.id === selected.id) + 1}
              completed={completed[selected.id]}
              locked={pinState(selected.id) === "locked"}
              reducedMotion={reducedMotion}
              onStart={onStartQuest}
              onClose={onCloseDrawer}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
