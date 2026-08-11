"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import styles from "./Odyssey.module.css";

interface UnderworldGameProps {
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (score: number) => void;
  onSound: (name: "move" | "caught" | "success" | "select" | "brew") => void;
}

const souls = [
  { id: "dolon", name: "Dolon", icon: "Footprints", x: 16, y: 43 },
  { id: "elpenor", name: "Elpenor", icon: "Wine", x: 31, y: 34 },
  { id: "orpheus", name: "Orpheus", icon: "Music2", x: 49, y: 45 },
  { id: "tiresias", name: "Tiresias", icon: "WandSparkles", x: 67, y: 35 },
  { id: "ajax", name: "Ajax", icon: "Shield", x: 83, y: 45 },
  { id: "sisyphus", name: "Sisyphus", icon: "Circle", x: 25, y: 66 },
  { id: "anticlea", name: "Anticlea", icon: "Sprout", x: 43, y: 65 },
  { id: "minos", name: "Minos", icon: "Scale", x: 63, y: 66 },
  { id: "achilles", name: "Achilles", icon: "Swords", x: 81, y: 65 },
] as const;

const order = ["elpenor", "tiresias", "anticlea"] as const;
const clues = [
  "Find the young sailor with the overturned cup.",
  "Now seek the prophet who carries a star-tipped staff.",
  "Last, find the mother waiting with an olive sprig.",
];

export default function UnderworldGame({
  muted,
  onToggleMute,
  onExit,
  onComplete,
  onSound,
}: UnderworldGameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 52 });
  const [step, setStep] = useState(0);
  const [offerings, setOfferings] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Move the torchlight across the waiting souls.");
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const reset = useCallback(() => {
    setSpotlight({ x: 50, y: 52 });
    setStep(0);
    setOfferings(3);
    setMistakes(0);
    setFound([]);
    setMessage("Move the torchlight across the waiting souls.");
    setPaused(false);
    setWon(false);
    requestAnimationFrame(() => rootRef.current?.focus());
  }, []);

  const selectSoul = useCallback(
    (id: string) => {
      if (paused || won || found.includes(id)) return;
      if (id === order[step]) {
        const soul = souls.find((item) => item.id === id);
        const nextStep = step + 1;
        setFound((value) => [...value, id]);
        setStep(nextStep);
        setMessage(`${soul?.name} answers. The next voice rises from the mist.`);
        onSound("select");
        if (nextStep === order.length) {
          setWon(true);
          setMessage("Three true voices point toward the living sea.");
          onSound("success");
        }
        return;
      }

      setMistakes((value) => value + 1);
      setOfferings((value) => {
        const next = value - 1;
        if (next <= 0) {
          setMessage("The shades murmur. Hermes quietly returns one offering.");
          return 1;
        }
        setMessage("A different shade accepts the offering. Read the clue again.");
        return next;
      });
      onSound("caught");
    },
    [found, onSound, paused, step, won]
  );

  const nearestSoul = useMemo(() => {
    return souls
      .filter((soul) => !found.includes(soul.id))
      .map((soul) => ({ soul, distance: Math.hypot(soul.x - spotlight.x, soul.y - spotlight.y) }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [found, spotlight]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "r", "p", "escape", "m"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (paused || won) {
      if (key === "p" || key === "escape") setPaused(false);
      return;
    }
    const delta = 7;
    if (key === "arrowup" || key === "w") setSpotlight((value) => ({ ...value, y: Math.max(18, value.y - delta) }));
    if (key === "arrowdown" || key === "s") setSpotlight((value) => ({ ...value, y: Math.min(82, value.y + delta) }));
    if (key === "arrowleft" || key === "a") setSpotlight((value) => ({ ...value, x: Math.max(7, value.x - delta) }));
    if (key === "arrowright" || key === "d") setSpotlight((value) => ({ ...value, x: Math.min(93, value.x + delta) }));
    if (key === " " && nearestSoul?.distance < 14) selectSoul(nearestSoul.soul.id);
    if (key === "r") reset();
    if (key === "p" || key === "escape") setPaused(true);
    if (key === "m") onToggleMute();
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.gameScreen} ${styles.underworldScreen}`}
      data-odyssey-game
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerMove={(event) => {
        if (paused || won) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setSpotlight({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      aria-label="Underworld soul finding game. Move the torch with pointer or arrow keys and select souls in order."
    >
      <div className={`${styles.sceneArtwork} ${styles.underworldArtwork}`} aria-hidden />
      <div className={styles.underworldVeil} aria-hidden />

      <header className={styles.gameHud}>
        <button type="button" className={styles.hudButton} onClick={onExit} aria-label="Return to voyage map"><Icon name="Map" size={17} /><span>Map</span></button>
        <div className={styles.hudTitle}><span>Chapter III</span><strong>Voices Below</strong></div>
        <div className={styles.hudActions}>
          <span className={styles.crewCounter} title="Offerings remaining"><Icon name="Coins" size={16} /> {offerings}</span>
          <button type="button" className={styles.iconButton} onClick={onToggleMute} aria-label={muted ? "Turn sound on" : "Mute sound"}><Icon name={muted ? "VolumeX" : "Volume2"} size={17} /></button>
          <button type="button" className={styles.iconButton} onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume game" : "Pause game"}><Icon name={paused ? "Play" : "Pause"} size={17} /></button>
        </div>
      </header>

      <aside className={styles.soulClue}>
        <span>Voice {Math.min(step + 1, 3)} of 3</span>
        <p>{won ? "The path is known." : clues[step]}</p>
      </aside>

      <div
        className={styles.spotlight}
        style={{ left: `${spotlight.x}%`, top: `${spotlight.y}%` }}
        aria-hidden
      />

      <div className={styles.soulField}>
        {souls.map((soul) => {
          const distance = Math.hypot(soul.x - spotlight.x, soul.y - spotlight.y);
          const revealed = distance < 17;
          const isFound = found.includes(soul.id);
          return (
            <motion.button
              type="button"
              key={soul.id}
              className={`${styles.soul} ${revealed ? styles.soulRevealed : ""} ${isFound ? styles.soulFound : ""}`}
              style={{ left: `${soul.x}%`, top: `${soul.y}%`, opacity: isFound ? 0.22 : Math.max(0.38, 1 - mistakes * 0.12) }}
              onClick={() => selectSoul(soul.id)}
              disabled={isFound || paused}
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 2.4 + (soul.x % 4) * 0.2, repeat: Infinity, ease: "easeInOut" }}
              aria-label={`Call ${soul.name}, marked by ${soul.icon}`}
            >
              <span className={styles.soulBody}><Icon name="Ghost" size={34} /></span>
              <span className={styles.soulToken}><Icon name={soul.icon} size={13} /></span>
              <strong>{soul.name}</strong>
            </motion.button>
          );
        })}
      </div>

      <div className={styles.gamePrompt} aria-live="polite">
        <span className={styles.promptIcon}><Icon name="LampDesk" size={16} /></span>
        <p>{message}</p>
        {mistakes > 0 && <span className={styles.caughtCount}>{mistakes} echoes</span>}
      </div>

      {paused && (
        <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Game paused"><div>
          <span className={styles.eyebrow}>The shades wait</span><h2>Voyage paused</h2><p>Your three true voices remain remembered.</p>
          <button type="button" className={styles.primaryButton} onClick={() => setPaused(false)} autoFocus>Resume <Icon name="Play" size={17} /></button>
        </div></div>
      )}

      {won && (
        <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Mission complete"><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className={styles.eyebrow}>Mission complete</span><h2>Three voices, one road home.</h2><p>The living sea calls from beyond the gate.</p>
          <div className={styles.resultStars} aria-label={`${Math.max(1, offerings)} out of 3 laurels`}>{[0, 1, 2].map((index) => <Icon key={index} name="Leaf" size={24} className={index < Math.max(1, offerings) ? styles.starEarned : styles.starEmpty} />)}</div>
          <button type="button" className={styles.primaryButton} onClick={() => onComplete(Math.max(1, offerings))} autoFocus>Continue voyage <Icon name="ArrowRight" size={17} /></button>
          <button type="button" className={styles.textButton} onClick={reset}>Search again</button>
        </motion.div></div>
      )}
    </div>
  );
}
