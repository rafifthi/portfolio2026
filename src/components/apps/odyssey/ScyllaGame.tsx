"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/Icon";
import styles from "./Odyssey.module.css";

interface ScyllaGameProps {
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (score: number) => void;
  onSound: (name: "move" | "caught" | "success" | "select" | "brew") => void;
}

type Hazard = { id: string; at: number; lane: number; type: "scylla" | "charybdis" };

const hazards: Hazard[] = [
  { id: "s1", at: 28, lane: 0, type: "scylla" },
  { id: "c1", at: 46, lane: 2, type: "charybdis" },
  { id: "s2", at: 64, lane: 1, type: "scylla" },
  { id: "c2", at: 82, lane: 2, type: "charybdis" },
];

const laneY = [34, 52, 70];

export default function ScyllaGame({
  muted,
  onToggleMute,
  onExit,
  onComplete,
  onSound,
}: ScyllaGameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const braceTimer = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [lane, setLane] = useState(1);
  const [progress, setProgress] = useState(0);
  const [crew, setCrew] = useState(6);
  const [handled, setHandled] = useState<string[]>([]);
  const [braced, setBraced] = useState(false);
  const [braceReady, setBraceReady] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("Choose a lane. Brace when the sea flashes gold.");

  useEffect(() => {
    rootRef.current?.focus();
    return () => {
      if (braceTimer.current) window.clearTimeout(braceTimer.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (braceTimer.current) window.clearTimeout(braceTimer.current);
    setLane(1);
    setProgress(0);
    setCrew(6);
    setHandled([]);
    setBraced(false);
    setBraceReady(true);
    setDragging(false);
    setPaused(false);
    setWon(false);
    setMessage("Choose a lane. Brace when the sea flashes gold.");
    requestAnimationFrame(() => rootRef.current?.focus());
  }, []);

  useEffect(() => {
    if (paused || won) return;
    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + 0.62));
    }, 90);
    return () => window.clearInterval(interval);
  }, [paused, won]);

  useEffect(() => {
    if (progress >= 100 && !won) {
      // Progress is driven by the game loop, so completion is derived here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWon(true);
      setMessage("The strait opens. Count the oars: the crew made it through.");
      onSound("success");
      return;
    }

    const hazard = hazards.find((item) => item.at <= progress && !handled.includes(item.id));
    if (!hazard) return;
    setHandled((items) => [...items, hazard.id]);

    if (hazard.lane !== lane) {
      setMessage(hazard.type === "scylla" ? "Claws snap behind the stern. Clear!" : "The whirlpool tugs at empty water.");
      onSound("select");
      return;
    }

    if (braced) {
      setMessage("Oars locked. The whole crew holds the line.");
      onSound("select");
      return;
    }

    if (hazard.type === "charybdis") {
      setMessage("Charybdis spins the ship back to the start. Everyone is still aboard.");
      setProgress(0);
      setHandled([]);
      setLane(1);
      onSound("caught");
      return;
    }

    setCrew((value) => {
      const next = value - 1;
      if (next <= 0) {
        setMessage("The last token slips, but Aeolus sends a gentle restart.");
        window.setTimeout(reset, 900);
        return 0;
      }
      setMessage(`Scylla steals one crew token. ${next} still row together.`);
      return next;
    });
    onSound("caught");
  }, [braced, handled, lane, onSound, progress, reset, won]);

  const changeLane = useCallback(
    (next: number) => {
      if (paused || won) return;
      const clamped = Math.min(2, Math.max(0, next));
      if (clamped === lane) return;
      setLane(clamped);
      setMessage(clamped === 0 ? "Hugging the cliff lane." : clamped === 2 ? "Skimming the whirlpool lane." : "Holding the middle water.");
      onSound("move");
    },
    [lane, onSound, paused, won]
  );

  const brace = useCallback(() => {
    if (!braceReady || paused || won) return;
    setBraced(true);
    setBraceReady(false);
    setMessage("Brace! Shields low, oars steady.");
    onSound("brew");
    braceTimer.current = window.setTimeout(() => {
      setBraced(false);
      window.setTimeout(() => setBraceReady(true), 650);
    }, 850);
  }, [braceReady, onSound, paused, won]);

  const setLaneFromPointer = (clientY: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const percent = ((clientY - rect.top) / rect.height) * 100;
    const nearest = laneY.map((value) => Math.abs(value - percent)).indexOf(Math.min(...laneY.map((value) => Math.abs(value - percent))));
    changeLane(nearest);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "w", "s", " ", "r", "p", "escape", "m"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (key === "arrowup" || key === "w") changeLane(lane - 1);
    if (key === "arrowdown" || key === "s") changeLane(lane + 1);
    if (key === " " && !event.repeat) brace();
    if (key === "r") reset();
    if (key === "p" || key === "escape") setPaused((value) => !value);
    if (key === "m") onToggleMute();
  };

  const upcoming = hazards.find((hazard) => hazard.at > progress && hazard.at - progress < 13);
  const score = crew >= 5 ? 3 : crew >= 3 ? 2 : 1;

  return (
    <div
      ref={rootRef}
      className={styles.gameScreen}
      data-odyssey-game
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        if ((event.target as Element).closest("button")) return;
        setDragging(true);
        setLaneFromPointer(event.clientY, event.currentTarget);
      }}
      onPointerMove={(event) => dragging && setLaneFromPointer(event.clientY, event.currentTarget)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      aria-label="Scylla and Charybdis steering game. Use up and down arrows to steer and Space to brace."
    >
      <div className={`${styles.sceneArtwork} ${styles.scyllaArtwork}`} aria-hidden />
      <div className={styles.sceneShade} aria-hidden />

      <header className={styles.gameHud}>
        <button type="button" className={styles.hudButton} onClick={onExit} aria-label="Return to voyage map"><Icon name="Map" size={17} /><span>Map</span></button>
        <div className={styles.hudTitle}><span>Chapter IV</span><strong>The Narrow Strait</strong></div>
        <div className={styles.hudActions}>
          <span className={styles.crewCounter}><Icon name="Users" size={16} /> {crew}</span>
          <button type="button" className={styles.iconButton} onClick={onToggleMute} aria-label={muted ? "Turn sound on" : "Mute sound"}><Icon name={muted ? "VolumeX" : "Volume2"} size={17} /></button>
          <button type="button" className={styles.iconButton} onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume game" : "Pause game"}><Icon name={paused ? "Play" : "Pause"} size={17} /></button>
        </div>
      </header>

      <div className={styles.voyageMeter} aria-label={`${Math.round(progress)} percent through the strait`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.seaLanes} aria-hidden>
        {laneY.map((top, index) => <span key={top} style={{ top: `${top}%` }} data-active={index === lane} />)}
      </div>

      {upcoming && (
        <motion.div className={styles.hazardWarning} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
          <Icon name={upcoming.type === "scylla" ? "BadgeAlert" : "Waves"} size={18} />
          <span>{upcoming.type === "scylla" ? "Scylla above" : "Whirlpool below"}</span>
        </motion.div>
      )}

      <motion.div
        className={`${styles.playerShip} ${braced ? styles.shipBraced : ""}`}
        animate={{ left: `${9 + progress * 0.79}%`, top: `${laneY[lane]}%`, rotate: braced ? -2 : 0 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`Ship in lane ${lane + 1} with ${crew} crew tokens`}
      >
        <Icon name="Sailboat" size={48} />
        {braced && <span><Icon name="ShieldCheck" size={24} /></span>}
      </motion.div>

      <div className={styles.crewTokens} aria-label={`${crew} crew remaining`}>
        {[0, 1, 2, 3, 4, 5].map((token) => <span key={token} data-lost={token >= crew}><Icon name="CircleUserRound" size={17} /></span>)}
      </div>

      <div className={styles.steeringControls}>
        <div>
          <button type="button" onClick={() => changeLane(lane - 1)} disabled={lane === 0 || paused} aria-label="Steer up"><Icon name="ChevronUp" size={21} /><span>Up</span></button>
          <button type="button" onClick={() => changeLane(lane + 1)} disabled={lane === 2 || paused} aria-label="Steer down"><Icon name="ChevronDown" size={21} /><span>Down</span></button>
        </div>
        <button type="button" className={styles.braceButton} onClick={brace} disabled={!braceReady || paused}>{braced ? "Holding!" : braceReady ? "Brace" : "Steady…"}<Icon name="Shield" size={20} /></button>
      </div>

      <div className={styles.gamePrompt} aria-live="polite"><span className={styles.promptIcon}><Icon name="Navigation" size={16} /></span><p>{message}</p><span className={styles.caughtCount}>{Math.round(progress)}%</span></div>

      {paused && <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Game paused"><div><span className={styles.eyebrow}>Oars at rest</span><h2>Voyage paused</h2><p>The current will wait for you.</p><button type="button" className={styles.primaryButton} onClick={() => setPaused(false)} autoFocus>Resume <Icon name="Play" size={17} /></button></div></div>}

      {won && <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Mission complete"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><span className={styles.eyebrow}>Mission complete</span><h2>Open water ahead.</h2><p>{crew} crew token{crew === 1 ? "" : "s"} made the crossing.</p><div className={styles.resultStars} aria-label={`${score} out of 3 laurels`}>{[0, 1, 2].map((index) => <Icon key={index} name="Leaf" size={24} className={index < score ? styles.starEarned : styles.starEmpty} />)}</div><button type="button" className={styles.primaryButton} onClick={() => onComplete(score)} autoFocus>Continue voyage <Icon name="ArrowRight" size={17} /></button><button type="button" className={styles.textButton} onClick={reset}>Sail again</button></motion.div></div>}
    </div>
  );
}
