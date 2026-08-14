"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OdysseyGameProps } from "../index";
import { PALETTE } from "../theme";
import { useRafLoop, useNormalizedPointer } from "../hooks";
import { GameArea, HintBar, Lives, ResultOverlay, StartScrim } from "../shared";

const SHIP_X = 0.24; // fixed horizontal lane (fraction of width)
const SHIP_R = 0.055; // ship radius as fraction of height
const WIN_TIME = 30; // seconds to cross the strait
const TOP_BAND = 0.13;
const BOTTOM_BAND = 0.13;

type Obstacle =
  | { id: number; kind: "scylla"; x: number; w: number; depth: number }
  | { id: number; kind: "charybdis"; x: number; w: number; height: number }
  | { id: number; kind: "rock"; x: number; y: number; r: number };

interface GameState {
  shipY: number;
  targetY: number;
  obstacles: Obstacle[];
  spawnTimer: number;
  elapsed: number;
  lives: number;
  invuln: number;
  lastKind: Obstacle["kind"] | null;
  nextId: number;
}

function freshState(): GameState {
  return {
    shipY: 0.5,
    targetY: 0.5,
    obstacles: [],
    spawnTimer: 0.8,
    elapsed: 0,
    lives: 3,
    invuln: 0,
    lastKind: null,
    nextId: 1,
  };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function ScyllaCharybdis({ accent, reducedMotion, onWin, onExit }: OdysseyGameProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const toNorm = useNormalizedPointer(areaRef);
  const game = useRef<GameState>(freshState());
  const keys = useRef<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"won" | "lost" | null>(null);
  // Render snapshot — the loop mutates the ref for speed, then publishes an
  // immutable copy here for React to paint from.
  const [snap, setSnap] = useState<GameState>(freshState);
  const wonRef = useRef(false);

  const reset = useCallback(() => {
    game.current = freshState();
    setSnap(freshState());
    wonRef.current = false;
    setStatus(null);
    setRunning(true);
  }, []);

  // Keyboard steering
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "w", "s"].includes(k)) {
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

  const spawn = (g: GameState) => {
    const id = g.nextId++;
    // Avoid repeating a band type back-to-back so a gap always exists.
    const roll = Math.random();
    let kind: Obstacle["kind"] = roll < 0.4 ? "scylla" : roll < 0.8 ? "charybdis" : "rock";
    if (kind === g.lastKind && kind !== "rock") kind = kind === "scylla" ? "charybdis" : "scylla";
    g.lastKind = kind;
    if (kind === "scylla") g.obstacles.push({ id, kind, x: 1.15, w: rand(0.05, 0.08), depth: rand(0.28, 0.52) });
    else if (kind === "charybdis") g.obstacles.push({ id, kind, x: 1.15, w: rand(0.06, 0.09), height: rand(0.28, 0.52) });
    else g.obstacles.push({ id, kind, x: 1.15, y: rand(0.24, 0.76), r: rand(0.05, 0.08) });
  };

  useRafLoop((dt) => {
    const g = game.current;
    const size = areaRef.current?.getBoundingClientRect();
    if (!size) return;
    const W = size.width;
    const H = size.height;
    const difficulty = Math.min(1, g.elapsed / WIN_TIME);
    const speed = 0.34 + 0.24 * difficulty;

    // Steering: keyboard nudges the target, pointer follow is handled on events.
    if (keys.current.has("arrowup") || keys.current.has("w")) g.targetY -= 0.95 * dt;
    if (keys.current.has("arrowdown") || keys.current.has("s")) g.targetY += 0.95 * dt;
    g.targetY = Math.min(0.94, Math.max(0.06, g.targetY));
    g.shipY += (g.targetY - g.shipY) * Math.min(1, dt * 12);

    // Advance world (rebuild immutably so the render snapshot is a clean copy)
    g.obstacles = g.obstacles
      .map((o) => ({ ...o, x: o.x - speed * dt }))
      .filter((o) => o.x > -0.2);

    // Spawn
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      spawn(g);
      g.spawnTimer = 1.5 - 0.78 * difficulty + rand(-0.1, 0.15);
    }

    // Collision (pixel space)
    if (g.invuln > 0) g.invuln -= dt;
    const shipPxX = SHIP_X * W;
    const shipPxY = g.shipY * H;
    const rp = SHIP_R * H;
    if (g.invuln <= 0) {
      for (const o of g.obstacles) {
        let hit = false;
        if (o.kind === "scylla") {
          const left = (o.x - o.w) * W;
          const right = (o.x + o.w) * W;
          hit = shipPxX + rp > left && shipPxX - rp < right && shipPxY - rp < o.depth * H;
        } else if (o.kind === "charybdis") {
          const left = (o.x - o.w) * W;
          const right = (o.x + o.w) * W;
          hit = shipPxX + rp > left && shipPxX - rp < right && shipPxY + rp > (1 - o.height) * H;
        } else {
          const dx = shipPxX - o.x * W;
          const dy = shipPxY - o.y * H;
          hit = Math.hypot(dx, dy) < rp + o.r * H;
        }
        if (hit) {
          g.lives -= 1;
          g.invuln = 1.3;
          g.targetY = 0.5;
          if (g.lives <= 0) {
            setRunning(false);
            setStatus("lost");
          }
          break;
        }
      }
    }

    // Progress
    g.elapsed += dt;
    if (g.elapsed >= WIN_TIME && !wonRef.current) {
      wonRef.current = true;
      onWin();
      setRunning(false);
      setStatus("won");
    }

    setSnap({ ...g });
  }, running);

  const handlePointer = (e: React.PointerEvent) => {
    if (!running) return;
    game.current.targetY = Math.min(0.94, Math.max(0.06, toNorm(e).y));
  };

  const g = snap;
  const progress = Math.min(1, g.elapsed / WIN_TIME);

  return (
    <div className="flex h-full w-full flex-col">
      <GameArea
        background={`linear-gradient(180deg, ${PALETTE.seaLight} 0%, ${PALETTE.sea} 45%, ${PALETTE.seaDeep} 100%)`}
      >
        {({ width: W, height: H }) => (
          <div
            ref={areaRef}
            className="absolute inset-0"
            style={{ touchAction: "none" }}
            onPointerDown={handlePointer}
            onPointerMove={handlePointer}
          >
            {/* Top cliff band (Scylla's lair) */}
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: TOP_BAND * H,
                background: `linear-gradient(180deg, #2a2118, #4a3626)`,
                boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.4)",
              }}
            />
            {/* Bottom churn band (Charybdis) */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: BOTTOM_BAND * H,
                background: `linear-gradient(0deg, #06202a, #0f3a4a)`,
                boxShadow: "inset 0 6px 12px rgba(0,0,0,0.35)",
              }}
            />

            {/* Obstacles */}
            {g.obstacles.map((o) => {
              if (o.kind === "scylla") {
                const w = o.w * 2 * W;
                const h = o.depth * H;
                return (
                  <div
                    key={o.id}
                    className="absolute"
                    style={{ left: (o.x - o.w) * W, top: 0, width: w, height: h }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 rounded-b-[40%]"
                      style={{ height: h, background: `linear-gradient(180deg,#5a4130,#7a5a3e)` }}
                    />
                    {/* serpent head */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: w / 2 - w * 0.32,
                        bottom: -w * 0.16,
                        width: w * 0.64,
                        height: w * 0.64,
                        background: PALETTE.crimson,
                        boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                      }}
                    >
                      <span
                        className="absolute rounded-full"
                        style={{ left: "26%", top: "34%", width: 5, height: 5, background: "#ffe08a" }}
                      />
                      <span
                        className="absolute rounded-full"
                        style={{ right: "26%", top: "34%", width: 5, height: 5, background: "#ffe08a" }}
                      />
                    </div>
                  </div>
                );
              }
              if (o.kind === "charybdis") {
                const w = o.w * 2 * W;
                const h = o.height * H;
                return (
                  <div
                    key={o.id}
                    className="absolute overflow-hidden"
                    style={{ left: (o.x - o.w) * W, bottom: 0, width: w, height: h }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-[45%]"
                      style={{ height: h, background: `linear-gradient(0deg,#0a3040,#1a6f86)` }}
                    />
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 rounded-full border-2 ${
                        reducedMotion ? "" : "animate-spin"
                      }`}
                      style={{
                        bottom: h * 0.22,
                        width: w * 0.7,
                        height: w * 0.7,
                        borderColor: "rgba(255,255,255,0.35)",
                        borderTopColor: "rgba(255,255,255,0.75)",
                      }}
                    />
                  </div>
                );
              }
              // rock
              const d = o.r * 2 * H;
              return (
                <div
                  key={o.id}
                  className="absolute rounded-full"
                  style={{
                    left: o.x * W - d / 2,
                    top: o.y * H - d / 2,
                    width: d,
                    height: d,
                    background: "radial-gradient(circle at 35% 30%, #8a8f96, #4b5158)",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
                  }}
                />
              );
            })}

            {/* Ship */}
            <div
              className="absolute"
              style={{
                left: SHIP_X * W,
                top: g.shipY * H,
                transform: "translate(-50%,-50%)",
                opacity: g.invuln > 0 ? (Math.floor(g.invuln * 12) % 2 ? 0.35 : 1) : 1,
              }}
            >
              <svg viewBox="0 0 48 48" width={Math.max(34, SHIP_R * H * 2.1)} height={Math.max(34, SHIP_R * H * 2.1)} aria-hidden>
                <path d="M24 6 L24 26 L11 26 Z" fill={PALETTE.parchment} />
                <line x1="24" y1="4" x2="24" y2="30" stroke={PALETTE.ink} strokeWidth="1.6" />
                <path d="M9 29 L41 29 L35 40 L15 40 Z" fill={PALETTE.crimson} />
                <path d="M9 29 L41 29 L39.5 32 L10.5 32 Z" fill={PALETTE.ink} opacity="0.5" />
              </svg>
            </div>

            {/* HUD */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-2.5">
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.4)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress * 100}%`, background: PALETTE.goldBright, transition: "width 120ms linear" }}
                  />
                </div>
              </div>
              <div className="rounded-full px-2 py-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
                <Lives total={3} left={g.lives} />
              </div>
            </div>

            {!running && !status && (
              <StartScrim
                title="Scylla & Charybdis"
                instruction="Steer the ship up and down to thread the strait — the six-headed Scylla snaps from the cliffs above, Charybdis churns below. Survive the crossing."
                accent={accent}
                onStart={reset}
              />
            )}

            <ResultOverlay
              status={status}
              accent={accent}
              title={status === "won" ? "The strait is crossed!" : "The sea took its toll"}
              message={
                status === "won"
                  ? "You slipped past beast and whirlpool alike."
                  : "Your ship was dashed. Steady the helm and try again."
              }
              onRetry={reset}
              onMap={onExit}
            />
          </div>
        )}
      </GameArea>
      <HintBar hints={["Move mouse / drag to steer", "↑ ↓ or W S", "Avoid the heads & whirlpools"]} />
    </div>
  );
}
