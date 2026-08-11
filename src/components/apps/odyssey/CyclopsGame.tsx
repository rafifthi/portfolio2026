"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import styles from "./Odyssey.module.css";

interface CyclopsGameProps {
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (score: number) => void;
  onSound: (name: "move" | "caught" | "success" | "select") => void;
}

const positions = [12, 33, 55, 77, 92];

export default function CyclopsGame({
  muted,
  onToggleMute,
  onExit,
  onComplete,
  onSound,
}: CyclopsGameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const moveTimer = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [position, setPosition] = useState(0);
  const [movingTo, setMovingTo] = useState<number | null>(null);
  const [eyeWatching, setEyeWatching] = useState(false);
  const [caught, setCaught] = useState(0);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState("The eye is wandering. Pick the next flock.");

  const reset = useCallback(() => {
    if (moveTimer.current) window.clearTimeout(moveTimer.current);
    setPosition(0);
    setMovingTo(null);
    setEyeWatching(false);
    setCaught(0);
    setPaused(false);
    setWon(false);
    setMessage("The eye is wandering. Pick the next flock.");
    requestAnimationFrame(() => rootRef.current?.focus());
  }, []);

  useEffect(() => {
    rootRef.current?.focus();
    return () => {
      if (moveTimer.current) window.clearTimeout(moveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (paused || won) return;
    const interval = window.setInterval(
      () => {
        setEyeWatching((watching) => {
          const next = !watching;
          setMessage(
            next
              ? "The Cyclops is watching the path. Stay beneath the wool."
              : "The eye turned away. Move!"
          );
          return next;
        });
      },
      caught >= 2 ? 2400 : 1750
    );
    return () => window.clearInterval(interval);
  }, [caught, paused, won]);

  const move = useCallback(
    (next: number) => {
      if (paused || won || movingTo !== null || Math.abs(next - position) !== 1) return;
      setMovingTo(next);
      setMessage("Tiptoeing to the next flock…");
      onSound("move");

      moveTimer.current = window.setTimeout(() => {
        if (eyeWatching && next > position) {
          setCaught((value) => value + 1);
          setMovingTo(null);
          setMessage("Spotted! The sheep shuffled you back into hiding.");
          onSound("caught");
          return;
        }

        setPosition(next);
        setMovingTo(null);
        if (next === positions.length - 1) {
          setWon(true);
          setMessage("All aboard. The Cyclops is still counting sheep.");
          onSound("success");
        } else {
          setMessage(eyeWatching ? "Safe beneath the wool." : "Hidden. The next flock is clear.");
        }
      }, prefersReducedMotion ? 180 : 620);
    },
    [eyeWatching, movingTo, onSound, paused, position, prefersReducedMotion, won]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (["arrowright", "arrowleft", " ", "a", "d", "r", "p", "escape", "m"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (key === "arrowright" || key === "d" || key === " ") move(position + 1);
    if (key === "arrowleft" || key === "a") move(position - 1);
    if (key === "r") reset();
    if (key === "p" || key === "escape") setPaused((value) => !value);
    if (key === "m") onToggleMute();
  };

  const displayPosition = movingTo ?? position;

  return (
    <div
      ref={rootRef}
      className={styles.gameScreen}
      data-odyssey-game
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Cyclops stealth game. Use left and right arrows to move between hiding places."
    >
      <div className={`${styles.sceneArtwork} ${styles.cyclopsArtwork}`} aria-hidden />
      <div className={styles.sceneShade} aria-hidden />

      <header className={styles.gameHud}>
        <button type="button" className={styles.hudButton} onClick={onExit} aria-label="Return to voyage map">
          <Icon name="Map" size={17} />
          <span>Map</span>
        </button>
        <div className={styles.hudTitle}>
          <span>Chapter I</span>
          <strong>Outwit the Cyclops</strong>
        </div>
        <div className={styles.hudActions}>
          <span className={styles.crewCounter} title="Crew together">
            <Icon name="Users" size={16} /> 3
          </span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleMute}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
          >
            <Icon name={muted ? "VolumeX" : "Volume2"} size={17} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? "Resume game" : "Pause game"}
          >
            <Icon name={paused ? "Play" : "Pause"} size={17} />
          </button>
        </div>
      </header>

      <div className={styles.eyeStatus} data-watching={eyeWatching} aria-live="polite">
        <Icon name={eyeWatching ? "Eye" : "EyeClosed"} size={19} />
        <span>{eyeWatching ? "Watching" : "Looking away"}</span>
      </div>

      <motion.div
        className={styles.cyclopsCharacter}
        animate={{ x: eyeWatching ? "24vw" : "5vw", rotate: eyeWatching ? 0 : -4 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
      >
        <Image
          src="/games/odyssey/cyclops-sprite.webp"
          alt=""
          fill
          sizes="190px"
          className={styles.cyclopsSprite}
          draggable={false}
        />
      </motion.div>

      {eyeWatching && <div className={styles.detectionCone} aria-hidden />}

      <div className={styles.hidingSpots}>
        {positions.map((left, index) => {
          const isReachable = Math.abs(index - position) === 1 && movingTo === null && !won;
          return (
            <button
              type="button"
              key={left}
              className={`${styles.hidingSpot} ${index === position ? styles.hidingSpotCurrent : ""}`}
              style={{ left: `${left}%` }}
              onClick={() => move(index)}
              disabled={!isReachable || paused}
              aria-label={
                index === positions.length - 1
                  ? "Move to the ship"
                  : index === 0
                    ? "Return to the cave"
                    : `Move to hiding flock ${index}`
              }
            >
              <span>{index === positions.length - 1 ? "Ship" : index === 0 ? "Cave" : `Flock ${index}`}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        className={styles.crewPiece}
        initial={false}
        animate={{ left: `${positions[displayPosition]}%` }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.58, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`Crew at ${displayPosition === 4 ? "the ship" : `hiding place ${displayPosition + 1}`}`}
      >
        <Icon name="Users" size={19} />
        <span>3</span>
      </motion.div>

      <div className={styles.gamePrompt} aria-live="polite">
        <span className={styles.promptIcon}><Icon name="Sparkles" size={16} /></span>
        <p>{message}</p>
        {caught > 0 && <span className={styles.caughtCount}>{caught} close call{caught === 1 ? "" : "s"}</span>}
      </div>

      <div className={styles.mobileControls}>
        <button type="button" onClick={() => move(position - 1)} disabled={position === 0 || movingTo !== null || paused}>
          <Icon name="ArrowLeft" size={20} /> Back
        </button>
        <button type="button" onClick={() => move(position + 1)} disabled={position === 4 || movingTo !== null || paused}>
          Move <Icon name="ArrowRight" size={20} />
        </button>
      </div>

      {paused && (
        <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Game paused">
          <div>
            <span className={styles.eyebrow}>The crew holds still</span>
            <h2>Voyage paused</h2>
            <p>Press P or tap resume when you are ready.</p>
            <button type="button" className={styles.primaryButton} onClick={() => setPaused(false)} autoFocus>
              Resume <Icon name="Play" size={17} />
            </button>
          </div>
        </div>
      )}

      {won && (
        <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Mission complete">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className={styles.eyebrow}>Mission complete</span>
            <h2>The sheep never told.</h2>
            <p>{caught === 0 ? "A perfectly quiet escape." : `Safe aboard after ${caught} close call${caught === 1 ? "" : "s"}.`}</p>
            <div className={styles.resultStars} aria-label={`${Math.max(1, 3 - caught)} out of 3 laurels`}>
              {[0, 1, 2].map((index) => (
                <Icon key={index} name="Leaf" size={24} className={index < Math.max(1, 3 - caught) ? styles.starEarned : styles.starEmpty} />
              ))}
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => onComplete(Math.max(1, 3 - caught))}
              autoFocus
            >
              Continue voyage <Icon name="ArrowRight" size={17} />
            </button>
            <button type="button" className={styles.textButton} onClick={reset}>Play again</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
