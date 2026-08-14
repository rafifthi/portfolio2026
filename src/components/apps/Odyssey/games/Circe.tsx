"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OdysseyGameProps } from "../index";
import { PALETTE } from "../theme";
import { useRafLoop } from "../hooks";
import { HintBar, Lives, ResultOverlay, StartScrim } from "../shared";

const INGREDIENTS = [
  { id: "moly", name: "Moly", emoji: "🌼" },
  { id: "nightshade", name: "Nightshade", emoji: "🫐" },
  { id: "honey", name: "Honey", emoji: "🍯" },
  { id: "mandrake", name: "Mandrake", emoji: "🌱" },
  { id: "wine", name: "Wine", emoji: "🍷" },
  { id: "saffron", name: "Saffron", emoji: "🌾" },
] as const;
type IngredientId = (typeof INGREDIENTS)[number]["id"];

type Step =
  | { kind: "add"; ingredient: IngredientId }
  | { kind: "stir"; revolutions: number }
  | { kind: "heat"; seconds: number };

const RECIPE: Step[] = [
  { kind: "add", ingredient: "moly" },
  { kind: "stir", revolutions: 2 },
  { kind: "add", ingredient: "nightshade" },
  { kind: "heat", seconds: 3.5 },
  { kind: "add", ingredient: "honey" },
  { kind: "stir", revolutions: 2 },
];

const ADD_TIME = 5.5;
const MAX_MISTAKES = 3;

interface St {
  step: number;
  mistakes: number;
  addTimer: number;
  stir: number; // revolutions accumulated
  lastAngle: number | null;
  heat: number; // 0..1
  heatZoneTime: number;
  heatHold: boolean;
  overheated: boolean;
  shake: number;
  flash: "good" | "bad" | null;
  flashT: number;
}

function fresh(): St {
  return {
    step: 0,
    mistakes: 0,
    addTimer: ADD_TIME,
    stir: 0,
    lastAngle: null,
    heat: 0,
    heatZoneTime: 0,
    heatHold: false,
    overheated: false,
    shake: 0,
    flash: null,
    flashT: 0,
  };
}

const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

export default function Circe({ accent, reducedMotion, onWin, onExit }: OdysseyGameProps) {
  const st = useRef<St>(fresh());
  const cauldronRef = useRef<HTMLDivElement>(null);
  const stirKey = useRef(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"won" | "lost" | null>(null);
  // Render snapshot published by the loop (see ScyllaCharybdis for rationale).
  const [snap, setSnap] = useState<St>(fresh);
  const wonRef = useRef(false);

  const reset = useCallback(() => {
    st.current = fresh();
    setSnap(fresh());
    wonRef.current = false;
    setStatus(null);
    setRunning(true);
  }, []);

  const registerMistake = (s: St) => {
    s.mistakes += 1;
    s.flash = "bad";
    s.flashT = 0.5;
    s.shake = 0.4;
    if (s.mistakes >= MAX_MISTAKES) {
      setRunning(false);
      setStatus("lost");
    }
  };

  const advance = (s: St) => {
    s.flash = "good";
    s.flashT = 0.45;
    s.step += 1;
    s.addTimer = ADD_TIME;
    s.stir = 0;
    s.lastAngle = null;
    s.heat = 0;
    s.heatZoneTime = 0;
    s.overheated = false;
    if (s.step >= RECIPE.length) {
      if (!wonRef.current) {
        wonRef.current = true;
        onWin();
        setRunning(false);
        setStatus("won");
      }
    }
  };

  const pick = (id: IngredientId) => {
    const s = st.current;
    const cur = RECIPE[s.step];
    if (!running || !cur || cur.kind !== "add") return;
    if (id === cur.ingredient) advance(s);
    else registerMistake(s);
  };

  const stirMove = (e: React.PointerEvent) => {
    const s = st.current;
    const cur = RECIPE[s.step];
    if (!running || !cur || cur.kind !== "stir") return;
    if (e.buttons === 0 && e.pointerType === "mouse") return; // require drag on desktop
    const box = cauldronRef.current?.getBoundingClientRect();
    if (!box) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const ang = Math.atan2(e.clientY - cy, e.clientX - cx);
    if (s.lastAngle !== null) s.stir += Math.abs(angleDiff(ang, s.lastAngle)) / (2 * Math.PI);
    s.lastAngle = ang;
  };

  useRafLoop((dt) => {
    const s = st.current;
    if (s.flashT > 0) s.flashT = Math.max(0, s.flashT - dt);
    else s.flash = null;
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
    const cur = RECIPE[s.step];
    if (!cur) return;

    if (cur.kind === "add") {
      s.addTimer -= dt;
      if (s.addTimer <= 0) {
        registerMistake(s);
        s.addTimer = ADD_TIME; // give another chance rather than skipping
      }
    } else if (cur.kind === "stir") {
      if (stirKey.current) s.stir += 1.1 * dt;
      if (s.stir >= cur.revolutions) advance(s);
    } else if (cur.kind === "heat") {
      s.heat += (s.heatHold ? 0.85 : -0.7) * dt;
      s.heat = Math.min(1, Math.max(0, s.heat));
      if (s.heat >= 0.5 && s.heat <= 0.8) s.heatZoneTime += dt;
      if (s.heat >= 1 && !s.overheated) {
        s.overheated = true;
        registerMistake(s);
      }
      if (s.heat < 0.85) s.overheated = false;
      if (s.heatZoneTime >= cur.seconds) advance(s);
    }

    setSnap({ ...s });
  }, running);

  // Keyboard: number keys pick ingredients; space/right stirs or heats.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!running) return;
      const cur = RECIPE[st.current.step];
      if (!cur) return;
      if (cur.kind === "add") {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= INGREDIENTS.length) {
          e.preventDefault();
          pick(INGREDIENTS[n - 1].id);
        }
      } else if (cur.kind === "stir") {
        if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowLeft") {
          stirKey.current = true;
          e.preventDefault();
        }
      } else if (cur.kind === "heat") {
        if (e.key === " ") {
          st.current.heatHold = true;
          e.preventDefault();
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowLeft") stirKey.current = false;
      if (e.key === " ") st.current.heatHold = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const s = snap;
  const step = RECIPE[s.step];
  const isAdd = step?.kind === "add";
  const isStir = step?.kind === "stir";
  const isHeat = step?.kind === "heat";
  const wanted = isAdd ? INGREDIENTS.find((i) => i.id === (step as { ingredient: IngredientId }).ingredient) : null;
  const stirTarget = isStir ? (step as { revolutions: number }).revolutions : 1;
  const stirPct = isStir ? Math.min(1, s.stir / stirTarget) : 0;
  const cauldronColor = s.flash === "good" ? PALETTE.vine : s.flash === "bad" ? PALETTE.crimson : accent;

  return (
    <div className="relative flex h-full w-full flex-col" style={{ background: `radial-gradient(120% 90% at 50% 10%, #21331f, #0d160c)` }}>
      {/* Step pips + lives */}
      <div className="flex items-center justify-between px-4 pt-2.5">
        <div className="flex items-center gap-1.5">
          {RECIPE.map((_, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: i < s.step ? PALETTE.goldBright : i === s.step ? "#fff" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
        <div className="rounded-full px-2 py-0.5" style={{ background: "rgba(0,0,0,0.35)" }}>
          <Lives total={MAX_MISTAKES} left={MAX_MISTAKES - s.mistakes} />
        </div>
      </div>

      {/* Instruction */}
      <div className="px-4 pt-2 text-center">
        <p className="text-sm font-bold text-white">
          {isAdd && `Add the ${wanted?.name} ${wanted?.emoji}`}
          {isStir && "Stir the cauldron — circle it!"}
          {isHeat && "Keep the flame in the amber zone"}
        </p>
      </div>

      {/* Cauldron */}
      <div className="flex flex-1 items-center justify-center">
        <div
          ref={cauldronRef}
          onPointerMove={stirMove}
          onPointerDown={stirMove}
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: "min(46vw, 200px)",
            height: "min(46vw, 200px)",
            transform: s.shake > 0 ? `translateX(${Math.sin(s.shake * 60) * 4}px)` : undefined,
            touchAction: "none",
          }}
        >
          {/* stir progress ring */}
          {isStir && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={PALETTE.goldBright}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - stirPct)}
              />
            </svg>
          )}
          {/* pot */}
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: "78%",
              height: "78%",
              background: `radial-gradient(circle at 50% 35%, ${cauldronColor}, #10241a 70%)`,
              boxShadow: "inset 0 -10px 30px rgba(0,0,0,0.6), 0 10px 24px rgba(0,0,0,0.5)",
              border: "4px solid #1c130a",
              transition: "background 200ms ease",
            }}
          >
            {/* brew surface + bubbles */}
            <div
              className="absolute rounded-full"
              style={{ inset: "18%", background: `radial-gradient(circle at 50% 40%, ${cauldronColor}, #0c1e14)`, opacity: 0.9 }}
            />
            {!reducedMotion &&
              [0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="absolute rounded-full animate-ping"
                  style={{
                    left: `${30 + i * 12}%`,
                    top: `${40 + (i % 2) * 15}%`,
                    width: 6,
                    height: 6,
                    background: "rgba(255,255,255,0.4)",
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            {/* spoon during stir, follows accumulated angle */}
            {isStir && (
              <div
                className="absolute"
                style={{
                  width: 6,
                  height: "52%",
                  top: "0%",
                  left: "calc(50% - 3px)",
                  transformOrigin: "50% 100%",
                  transform: `rotate(${s.stir * 360}deg)`,
                  background: "#c9a06a",
                  borderRadius: 3,
                }}
              />
            )}
            {isHeat && (
              <span className="text-3xl" aria-hidden>
                {s.heat >= 0.5 && s.heat <= 0.8 ? "🔥" : s.heat > 0.8 ? "🌋" : "💨"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Control zone */}
      <div className="px-3 pb-2" style={{ minHeight: 92 }}>
        {isAdd && (
          <div className="grid grid-cols-6 gap-1.5">
            {INGREDIENTS.map((ing, i) => {
              const highlight = wanted?.id === ing.id;
              return (
                <button
                  key={ing.id}
                  onClick={() => pick(ing.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-2 transition-transform active:scale-90 ${
                    highlight && !reducedMotion ? "animate-pulse" : ""
                  }`}
                  style={{
                    background: highlight ? "rgba(242,198,90,0.22)" : "rgba(255,255,255,0.06)",
                    border: highlight ? `2px solid ${PALETTE.goldBright}` : "2px solid transparent",
                  }}
                  aria-label={ing.name}
                >
                  <span className="text-xl" aria-hidden>
                    {ing.emoji}
                  </span>
                  <span className="text-[9px] font-semibold text-white/80">{ing.name}</span>
                  <span className="text-[8px] text-white/35">{i + 1}</span>
                </button>
              );
            })}
          </div>
        )}

        {isStir && (
          <div className="flex flex-col items-center justify-center gap-1 pt-3 text-center">
            <p className="text-xs text-white/70">Drag in circles over the cauldron{"  "}·{"  "}or hold Space</p>
            <p className="text-[11px] font-semibold" style={{ color: PALETTE.goldBright }}>
              {Math.floor(stirPct * 100)}%
            </p>
          </div>
        )}

        {isHeat && (
          <div className="flex items-center justify-center gap-4 pt-2">
            {/* gauge */}
            <div className="relative h-16 w-4 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.4)" }}>
              {/* target zone (0.5..0.8) */}
              <div className="absolute inset-x-0" style={{ bottom: "50%", height: "30%", background: "rgba(242,198,90,0.35)" }} />
              <div
                className="absolute inset-x-0 bottom-0 rounded-full"
                style={{
                  height: `${s.heat * 100}%`,
                  background: s.heat > 0.8 ? PALETTE.crimson : s.heat >= 0.5 ? PALETTE.ember : PALETTE.sea,
                  transition: "height 60ms linear",
                }}
              />
            </div>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                st.current.heatHold = true;
              }}
              onPointerUp={() => (st.current.heatHold = false)}
              onPointerLeave={() => (st.current.heatHold = false)}
              onPointerCancel={() => (st.current.heatHold = false)}
              className="rounded-full px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
              style={{ background: accent, touchAction: "none", userSelect: "none" }}
            >
              🔥 Hold to blow the bellows
            </button>
          </div>
        )}
      </div>

      {!running && !status && (
        <StartScrim
          title="Circe's Cauldron"
          instruction="Follow the recipe: add each ingredient when called, stir by circling the pot, and hold the bellows to keep the flame steady. Three slips and the brew curdles."
          accent={accent}
          onStart={reset}
        />
      )}

      <ResultOverlay
        status={status}
        accent={accent}
        title={status === "won" ? "The potion gleams!" : "The brew curdled"}
        message={
          status === "won"
            ? "Circe nods — a flawless draught of moly."
            : "The cauldron hisses and spoils. Steady hands next time."
        }
        onRetry={reset}
        onMap={onExit}
      />

      <HintBar hints={["Tap ingredient (or keys 1–6)", "Drag to stir / hold Space", "Hold bellows for heat"]} />
    </div>
  );
}
