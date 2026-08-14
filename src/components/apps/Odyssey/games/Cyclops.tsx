"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OdysseyGameProps } from "../index";
import { PALETTE } from "../theme";
import { useRafLoop, useNormalizedPointer } from "../hooks";
import { GameArea, HintBar, Lives, ResultOverlay, StartScrim } from "../shared";

const SPEED = 0.34; // fraction of area per second
const START = { x: 0.08, y: 0.5 };
const EXIT_X = 0.92;

// Woolly cover the player can hide behind while the eye is open.
const SHEEP = [
  { x: 0.32, y: 0.28 },
  { x: 0.45, y: 0.72 },
  { x: 0.63, y: 0.34 },
  { x: 0.78, y: 0.66 },
];
const CHECKPOINT_X = 0.52;
const HIDE_R = 0.09;

type Phase = "closed" | "amber" | "open";

interface St {
  px: number;
  py: number;
  speed: number; // last applied speed magnitude
  phase: Phase;
  phaseT: number;
  lives: number;
  flash: number;
  grace: number; // post-catch safety
  checkpoint: number;
  hidden: boolean;
}

function fresh(): St {
  return {
    px: START.x,
    py: START.y,
    speed: 0,
    phase: "closed",
    phaseT: 2.2,
    lives: 3,
    flash: 0,
    grace: 0,
    checkpoint: START.x,
    hidden: false,
  };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Cyclops({ accent, reducedMotion, onWin, onExit }: OdysseyGameProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const toNorm = useNormalizedPointer(areaRef);
  const st = useRef<St>(fresh());
  const keys = useRef<Set<string>>(new Set());
  const held = useRef(false);
  const target = useRef({ x: START.x, y: START.y });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"won" | "lost" | null>(null);
  // Render snapshot published by the loop (see ScyllaCharybdis for rationale).
  const [snap, setSnap] = useState<St>(fresh);
  const wonRef = useRef(false);

  const reset = useCallback(() => {
    st.current = fresh();
    setSnap(fresh());
    held.current = false;
    wonRef.current = false;
    setStatus(null);
    setRunning(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        keys.current.add(k);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useRafLoop((dt) => {
    const s = st.current;
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
    if (s.grace > 0) s.grace = Math.max(0, s.grace - dt);

    // ── movement ──
    let dx = 0;
    let dy = 0;
    const k = keys.current;
    if (k.has("arrowup") || k.has("w")) dy -= 1;
    if (k.has("arrowdown") || k.has("s")) dy += 1;
    if (k.has("arrowleft") || k.has("a")) dx -= 1;
    if (k.has("arrowright") || k.has("d")) dx += 1;
    let vx = 0;
    let vy = 0;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      vx = (dx / len) * SPEED;
      vy = (dy / len) * SPEED;
    } else if (held.current) {
      const tx = target.current.x - s.px;
      const ty = target.current.y - s.py;
      const dist = Math.hypot(tx, ty);
      if (dist > 0.015) {
        vx = (tx / dist) * SPEED;
        vy = (ty / dist) * SPEED;
      }
    }
    s.px = Math.min(0.97, Math.max(0.03, s.px + vx * dt));
    s.py = Math.min(0.9, Math.max(0.1, s.py + vy * dt));
    s.speed = Math.hypot(vx, vy);

    // hidden if overlapping any sheep
    s.hidden = SHEEP.some((sh) => Math.hypot(sh.x - s.px, sh.y - s.py) < HIDE_R);

    // checkpoint
    if (s.px > CHECKPOINT_X && s.checkpoint < CHECKPOINT_X) s.checkpoint = CHECKPOINT_X;

    // ── eye cycle ──
    s.phaseT -= dt;
    if (s.phaseT <= 0) {
      if (s.phase === "closed") {
        s.phase = "amber";
        s.phaseT = 0.75;
      } else if (s.phase === "amber") {
        s.phase = "open";
        s.phaseT = rand(1.2, 1.9);
      } else {
        s.phase = "closed";
        s.phaseT = rand(1.8, 2.8);
      }
    }

    // ── detection ──
    if (s.phase === "open" && s.grace <= 0 && s.speed > 0.05 && !s.hidden) {
      s.lives -= 1;
      s.flash = 0.7;
      s.grace = 1.0;
      s.px = s.checkpoint;
      s.py = 0.5;
      s.phase = "closed";
      s.phaseT = 1.2;
      if (s.lives <= 0) {
        setRunning(false);
        setStatus("lost");
      }
    }

    // ── win ──
    if (s.px >= EXIT_X && !wonRef.current) {
      wonRef.current = true;
      onWin();
      setRunning(false);
      setStatus("won");
    }

    setSnap({ ...s });
  }, running);

  const onDown = (e: React.PointerEvent) => {
    if (!running) return;
    held.current = true;
    target.current = toNorm(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!held.current) return;
    target.current = toNorm(e);
  };
  const release = () => (held.current = false);

  const s = snap;
  const phaseColor = s.phase === "open" ? PALETTE.crimson : s.phase === "amber" ? PALETTE.ember : "#3ba55d";
  const eyeOpenAmount = s.phase === "open" ? 1 : s.phase === "amber" ? 0.5 : 0.08;
  const cue = s.phase === "open" ? "FREEZE!" : s.phase === "amber" ? "eye opening…" : "move now";

  return (
    <div className="flex h-full w-full flex-col">
      <GameArea background={`radial-gradient(120% 100% at 20% 30%, #2b2320, #140f0d 70%)`}>
        {({ width: W, height: H }) => (
          <div
            ref={areaRef}
            className="absolute inset-0"
            style={{ touchAction: "none" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
          >
            {/* watching-red vignette */}
            {s.phase === "open" && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 120px 30px rgba(164,51,31,0.55)", background: "rgba(164,51,31,0.06)" }}
              />
            )}

            {/* exit opening (cave mouth) */}
            <div
              className="absolute inset-y-0 right-0 flex items-center justify-center"
              style={{
                width: W * 0.1,
                background: "linear-gradient(90deg, rgba(0,0,0,0), rgba(160,200,230,0.35))",
              }}
            >
              <span className="rotate-90 text-[10px] font-bold tracking-widest text-white/70">EXIT</span>
            </div>

            {/* checkpoint cairn */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 text-lg opacity-70"
              style={{ left: CHECKPOINT_X * W, top: 0.5 * H }}
              aria-hidden
            >
              🪨
            </div>

            {/* sheep cover */}
            {SHEEP.map((sh, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: sh.x * W,
                  top: sh.y * H,
                  width: HIDE_R * 2 * Math.min(W, H),
                  height: HIDE_R * 2 * Math.min(W, H),
                  background: "radial-gradient(circle at 40% 35%, #f4f1ea, #cfc7b6)",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.12)",
                }}
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg" aria-hidden>
                  🐑
                </span>
              </div>
            ))}

            {/* player */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: s.px * W,
                top: s.py * H,
                opacity: s.flash > 0 ? (Math.floor(s.flash * 12) % 2 ? 0.3 : 1) : s.hidden ? 0.55 : 1,
                transition: "opacity 80ms linear",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 26,
                  height: 26,
                  background: s.hidden ? "rgba(120,150,120,0.9)" : accent,
                  boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                  border: "2px solid rgba(255,255,255,0.5)",
                }}
              >
                <span className="text-xs" aria-hidden>
                  🧔
                </span>
              </div>
            </div>

            {/* Cyclops eye indicator */}
            <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 flex-col items-center gap-1">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 62,
                  height: 62,
                  background: "#2a1a12",
                  border: `3px solid ${phaseColor}`,
                  boxShadow: `0 0 18px ${phaseColor}`,
                }}
              >
                {/* eyelid via scaleY on the iris */}
                <div className="relative flex items-center justify-center overflow-hidden rounded-full" style={{ width: 44, height: 44, background: "#f2ead2" }}>
                  <div
                    className="rounded-full"
                    style={{
                      width: 22,
                      height: 22,
                      background: phaseColor,
                      transform: `scaleY(${eyeOpenAmount})`,
                      transition: reducedMotion ? undefined : "transform 220ms ease",
                    }}
                  >
                    <div className="mx-auto mt-[6px] h-2.5 w-2.5 rounded-full bg-black" />
                  </div>
                  {/* lids */}
                  <div
                    className="absolute inset-x-0 top-0 bg-[#2a1a12]"
                    style={{ height: `${(1 - eyeOpenAmount) * 50}%`, transition: "height 220ms ease" }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 bg-[#2a1a12]"
                    style={{ height: `${(1 - eyeOpenAmount) * 50}%`, transition: "height 220ms ease" }}
                  />
                </div>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "rgba(0,0,0,0.5)", color: phaseColor }}>
                {cue}
              </span>
            </div>

            {/* lives */}
            <div className="pointer-events-none absolute right-2.5 top-2.5 rounded-full px-2 py-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
              <Lives total={3} left={s.lives} />
            </div>

            {!running && !status && (
              <StartScrim
                title="Cave of the Cyclops"
                instruction="Creep to the EXIT on the right. Move only while Polyphemus's eye is shut — the moment it opens, FREEZE, or duck behind a sheep to stay unseen."
                accent={accent}
                onStart={reset}
              />
            )}

            <ResultOverlay
              status={status}
              accent={accent}
              title={status === "won" ? "Escaped the cave!" : "Polyphemus spotted you"}
              message={
                status === "won"
                  ? "You slipped into the daylight, unseen."
                  : "The giant's eye found movement. Freeze sooner next time."
              }
              onRetry={reset}
              onMap={onExit}
            />
          </div>
        )}
      </GameArea>
      <HintBar hints={["Hold to move toward cursor / finger", "Arrows / WASD", "Freeze — or hide behind 🐑 — when the eye opens"]} />
    </div>
  );
}
