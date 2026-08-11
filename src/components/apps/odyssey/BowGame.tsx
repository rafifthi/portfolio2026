"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/Icon";
import styles from "./Odyssey.module.css";

interface BowGameProps {
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (score: number) => void;
  onSound: (name: "move" | "caught" | "success" | "select" | "brew") => void;
}

type ShotPhase = "aim" | "power" | "accuracy" | "flying";

interface Flight {
  id: number;
  targetY: number;
  hit: boolean;
}

export default function BowGame({
  muted,
  onToggleMute,
  onExit,
  onComplete,
  onSound,
}: BowGameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef({ aim: 1, power: 1, accuracy: 1 });
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<ShotPhase>("aim");
  const [aim, setAim] = useState(-0.65);
  const [power, setPower] = useState(0.2);
  const [accuracy, setAccuracy] = useState(-0.8);
  const [arrows, setArrows] = useState(3);
  const [misses, setMisses] = useState(0);
  const [ghosts, setGhosts] = useState<number[]>([]);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [message, setMessage] = useState("First click: choose the angle.");
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  useEffect(() => {
    if (paused || won || phase === "flying") return;
    const interval = window.setInterval(() => {
      if (phase === "aim") {
        setAim((value) => {
          const next = value + 0.045 * directionRef.current.aim;
          if (next >= 1 || next <= -1) directionRef.current.aim *= -1;
          return Math.max(-1, Math.min(1, next));
        });
      }
      if (phase === "power") {
        setPower((value) => {
          const next = value + 0.035 * directionRef.current.power;
          if (next >= 1 || next <= 0) directionRef.current.power *= -1;
          return Math.max(0, Math.min(1, next));
        });
      }
      if (phase === "accuracy") {
        setAccuracy((value) => {
          const next = value + 0.065 * directionRef.current.accuracy;
          if (next >= 1 || next <= -1) directionRef.current.accuracy *= -1;
          return Math.max(-1, Math.min(1, next));
        });
      }
    }, 45);
    return () => window.clearInterval(interval);
  }, [paused, phase, won]);

  const resetMeters = useCallback(() => {
    directionRef.current = { aim: 1, power: 1, accuracy: 1 };
    setAim(-0.65);
    setPower(0.2);
    setAccuracy(-0.8);
    setPhase("aim");
    setFlight(null);
  }, []);

  const reset = useCallback(() => {
    resetMeters();
    setArrows(3);
    setMisses(0);
    setGhosts([]);
    setMessage("First click: choose the angle.");
    setPaused(false);
    setWon(false);
    requestAnimationFrame(() => rootRef.current?.focus());
  }, [resetMeters]);

  const fire = useCallback(() => {
    const targetY = 56 + aim * 18 + accuracy * 8 + (0.72 - power) * 17;
    const error = Math.abs(aim) * 0.34 + Math.abs(power - 0.72) * 0.64 + Math.abs(accuracy) * 0.46;
    const threshold = 0.28 + Math.min(misses, 2) * 0.14;
    const hit = error <= threshold;
    setPhase("flying");
    setFlight({ id: Date.now(), targetY: hit ? 56 : targetY, hit });
    setMessage("The string sings…");
    onSound("brew");

    window.setTimeout(() => {
      if (hit) {
        setWon(true);
        setMessage("One clean line through every axe.");
        onSound("success");
        return;
      }

      const nextArrows = arrows - 1;
      const nextMisses = misses + 1;
      setGhosts((value) => [...value.slice(-1), targetY]);
      setMisses(nextMisses);
      onSound("caught");

      if (nextArrows <= 0) {
        setArrows(3);
        setMessage("The olive tree offers three more arrows. The accuracy window is wider now.");
      } else {
        setArrows(nextArrows);
        setMessage(targetY < 56 ? "High. Follow the pale ghost line a little lower." : "Low. Let the next arrow rise along the ghost line.");
      }
      resetMeters();
    }, prefersReducedMotion ? 220 : 900);
  }, [accuracy, aim, arrows, misses, onSound, power, prefersReducedMotion, resetMeters]);

  const lock = useCallback(() => {
    if (paused || won || phase === "flying") return;
    onSound("select");
    if (phase === "aim") {
      setPhase("power");
      setMessage("Second click: set the draw power.");
      return;
    }
    if (phase === "power") {
      setPhase("accuracy");
      setMessage("Third click: stop the marker in the gold zone.");
      return;
    }
    fire();
  }, [fire, onSound, paused, phase, won]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if ([" ", "enter", "r", "p", "escape", "m"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if ((key === " " || key === "enter") && !event.repeat) lock();
    if (key === "r") reset();
    if (key === "p" || key === "escape") setPaused((value) => !value);
    if (key === "m") onToggleMute();
  };

  const score = misses === 0 ? 3 : misses <= 2 ? 2 : 1;
  const buttonLabel = phase === "aim" ? "Lock aim" : phase === "power" ? "Lock power" : phase === "accuracy" ? "Loose arrow" : "Arrow flying";

  return (
    <div
      ref={rootRef}
      className={styles.gameScreen}
      data-odyssey-game
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        if ((event.target as Element).closest("button")) return;
        lock();
      }}
      aria-label="Bow of Ithaca precision game. Click or press Space three times to set aim, power, and accuracy."
    >
      <div className={`${styles.sceneArtwork} ${styles.ithacaArtwork}`} aria-hidden />
      <div className={styles.sceneShade} aria-hidden />

      <header className={styles.gameHud}>
        <button type="button" className={styles.hudButton} onClick={onExit} aria-label="Return to voyage map"><Icon name="Map" size={17} /><span>Map</span></button>
        <div className={styles.hudTitle}><span>Chapter V</span><strong>The Bow of Ithaca</strong></div>
        <div className={styles.hudActions}>
          <span className={styles.crewCounter}><Icon name="Navigation" size={16} /> {arrows}</span>
          <button type="button" className={styles.iconButton} onClick={onToggleMute} aria-label={muted ? "Turn sound on" : "Mute sound"}><Icon name={muted ? "VolumeX" : "Volume2"} size={17} /></button>
          <button type="button" className={styles.iconButton} onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume game" : "Pause game"}><Icon name={paused ? "Play" : "Pause"} size={17} /></button>
        </div>
      </header>

      <svg className={styles.trajectoryLayer} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {ghosts.map((targetY, index) => <path key={`${targetY}-${index}`} d={`M 14 61 Q 48 ${44 + (targetY - 56) * 0.35} 90 ${targetY}`} />)}
        {phase !== "flying" && <path className={styles.aimPreview} d={`M 14 61 Q 48 ${44 + aim * 7} 90 ${56 + aim * 18}`} />}
      </svg>

      <div className={styles.bowStand} aria-hidden><Icon name="BowArrow" size={78} /></div>

      {flight && (
        <motion.div
          key={flight.id}
          className={styles.flyingArrow}
          initial={{ left: "14%", top: "61%", rotate: -4 }}
          animate={{ left: "90%", top: `${flight.targetY}%`, rotate: flight.hit ? 0 : flight.targetY < 56 ? -8 : 8 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          aria-label={flight.hit ? "Arrow on target" : "Arrow missed the target"}
        >
          <Icon name="MoveRight" size={43} />
        </motion.div>
      )}

      <div className={styles.shotMeters}>
        <div data-active={phase === "aim"}>
          <span>Aim</span><i><b style={{ left: `${(aim + 1) * 50}%` }} /></i>
        </div>
        <div data-active={phase === "power"}>
          <span>Power</span><i><em style={{ width: `${power * 100}%` }} /></i>
        </div>
        <div data-active={phase === "accuracy"}>
          <span>Accuracy</span><i><u style={{ width: `${18 + Math.min(misses, 2) * 12}%` }} /><b style={{ left: `${(accuracy + 1) * 50}%` }} /></i>
        </div>
      </div>

      <button type="button" className={styles.shotButton} onClick={lock} disabled={phase === "flying" || paused}>
        {buttonLabel}<Icon name={phase === "accuracy" ? "Navigation" : "MousePointerClick"} size={19} />
      </button>

      <div className={styles.gamePrompt} aria-live="polite"><span className={styles.promptIcon}><Icon name="Target" size={16} /></span><p>{message}</p><span className={styles.caughtCount}>{phase}</span></div>

      {paused && <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Game paused"><div><span className={styles.eyebrow}>Bowstring relaxed</span><h2>Voyage paused</h2><p>Your current meter positions remain ready.</p><button type="button" className={styles.primaryButton} onClick={() => setPaused(false)} autoFocus>Resume <Icon name="Play" size={17} /></button></div></div>}

      {won && <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Mission complete"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><span className={styles.eyebrow}>The final shot</span><h2>The hall falls silent.</h2><p>The arrow hums through every bronze ring.</p><div className={styles.resultStars} aria-label={`${score} out of 3 laurels`}>{[0, 1, 2].map((index) => <Icon key={index} name="Leaf" size={24} className={index < score ? styles.starEarned : styles.starEmpty} />)}</div><button type="button" className={styles.primaryButton} onClick={() => onComplete(score)} autoFocus>Enter Ithaca <Icon name="ArrowRight" size={17} /></button><button type="button" className={styles.textButton} onClick={reset}>Shoot again</button></motion.div></div>}
    </div>
  );
}
