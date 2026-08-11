"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import styles from "./Odyssey.module.css";

type IngredientId = "moly" | "olive" | "honey" | "lotus" | "salt" | "wine";

interface Ingredient {
  id: IngredientId;
  name: string;
  clue: string;
  icon: string;
  color: string;
}

interface CirceGameProps {
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
  onComplete: (score: number) => void;
  onSound: (name: "move" | "caught" | "success" | "select" | "brew") => void;
}

const ingredients: Ingredient[] = [
  { id: "moly", name: "Moly", clue: "white bloom", icon: "Flower2", color: "oklch(0.84 0.08 90)" },
  { id: "olive", name: "Olive leaf", clue: "silver-green", icon: "Leaf", color: "oklch(0.71 0.12 137)" },
  { id: "honey", name: "Wild honey", clue: "sun-sweet", icon: "Hexagon", color: "oklch(0.79 0.16 82)" },
  { id: "lotus", name: "Lotus", clue: "dreamy petals", icon: "Origami", color: "oklch(0.73 0.12 319)" },
  { id: "salt", name: "Sea salt", clue: "bright crystals", icon: "Gem", color: "oklch(0.86 0.05 219)" },
  { id: "wine", name: "Red wine", clue: "island vintage", icon: "Wine", color: "oklch(0.55 0.14 20)" },
];

const recipe: IngredientId[] = ["moly", "olive", "honey"];

export default function CirceGame({
  muted,
  onToggleMute,
  onExit,
  onComplete,
  onSound,
}: CirceGameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<IngredientId[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("Three gifts break the spell. Follow Circe's riddle.");
  const [brewing, setBrewing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  const reset = useCallback(() => {
    setSelected([]);
    setMistakes(0);
    setMessage("Three gifts break the spell. Follow Circe's riddle.");
    setBrewing(false);
    setPaused(false);
    setWon(false);
    requestAnimationFrame(() => rootRef.current?.focus());
  }, []);

  const addIngredient = useCallback(
    (ingredient: IngredientId) => {
      if (paused || won || brewing) return;
      setSelected((current) => {
        if (current.includes(ingredient)) {
          setMessage(`${ingredients.find((item) => item.id === ingredient)?.name} returned to the table.`);
          return current.filter((item) => item !== ingredient);
        }
        if (current.length === 3) {
          setMessage("The cauldron holds three ingredients. Remove one first.");
          return current;
        }
        onSound("select");
        setMessage(`${ingredients.find((item) => item.id === ingredient)?.name} added.`);
        return [...current, ingredient];
      });
    },
    [brewing, onSound, paused, won]
  );

  const brew = useCallback(() => {
    if (paused || won || brewing) return;
    if (selected.length < 3) {
      setMessage(`The mixture needs ${3 - selected.length} more ingredient${selected.length === 2 ? "" : "s"}.`);
      onSound("caught");
      return;
    }

    setBrewing(true);
    setMessage("The cauldron sings…");
    onSound("brew");
    window.setTimeout(() => {
      const correct = recipe.every((ingredient) => selected.includes(ingredient));
      if (correct) {
        setWon(true);
        setMessage("Golden steam! The crew remembers their names.");
        onSound("success");
      } else {
        const wrong = selected.filter((ingredient) => !recipe.includes(ingredient));
        const kept = selected.filter((ingredient) => recipe.includes(ingredient));
        setMistakes((value) => value + 1);
        setSelected(kept);
        setMessage(
          wrong.includes("lotus")
            ? "Too dreamy. Keep the honest herbs and seek something sun-sweet."
            : wrong.includes("wine")
              ? "Too bold. The charm needs a gift from the hive."
              : "Almost. Keep the good ingredients and follow the riddle again."
        );
        onSound("caught");
      }
      setBrewing(false);
    }, 850);
  }, [brewing, onSound, paused, selected, won]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if (["1", "2", "3", "4", "5", "6", "b", "r", "p", "escape", "m"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    const number = Number(key);
    if (number >= 1 && number <= ingredients.length) addIngredient(ingredients[number - 1].id);
    if (key === "b") brew();
    if (key === "r") reset();
    if (key === "p" || key === "escape") setPaused((value) => !value);
    if (key === "m") onToggleMute();
  };

  return (
    <div
      ref={rootRef}
      className={styles.gameScreen}
      data-odyssey-game
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Circe potion game. Choose three ingredients and brew the restorative charm."
    >
      <div className={`${styles.sceneArtwork} ${styles.circeArtwork}`} aria-hidden />
      <div className={styles.sceneShade} aria-hidden />

      <header className={styles.gameHud}>
        <button type="button" className={styles.hudButton} onClick={onExit} aria-label="Return to voyage map">
          <Icon name="Map" size={17} /><span>Map</span>
        </button>
        <div className={styles.hudTitle}>
          <span>Chapter II</span>
          <strong>Circe&apos;s Palace</strong>
        </div>
        <div className={styles.hudActions}>
          <span className={styles.crewCounter}><Icon name="FlaskConical" size={16} /> {selected.length}/3</span>
          <button type="button" className={styles.iconButton} onClick={onToggleMute} aria-label={muted ? "Turn sound on" : "Mute sound"}>
            <Icon name={muted ? "VolumeX" : "Volume2"} size={17} />
          </button>
          <button type="button" className={styles.iconButton} onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume game" : "Pause game"}>
            <Icon name={paused ? "Play" : "Pause"} size={17} />
          </button>
        </div>
      </header>

      <aside className={styles.recipeScroll}>
        <span>Circe&apos;s riddle</span>
        <p>“White against magic, silver from the branch, and one spoon of captured sun.”</p>
      </aside>

      <div className={styles.ingredientShelf} aria-label="Potion ingredients">
        {ingredients.map((ingredient, index) => {
          const active = selected.includes(ingredient.id);
          return (
            <button
              type="button"
              key={ingredient.id}
              className={`${styles.ingredientToken} ${active ? styles.ingredientSelected : ""}`}
              style={{ "--ingredient": ingredient.color } as React.CSSProperties}
              onClick={() => addIngredient(ingredient.id)}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/ingredient", ingredient.id)}
              disabled={paused || brewing}
              aria-pressed={active}
            >
              <span><Icon name={ingredient.icon} size={20} /></span>
              <strong>{ingredient.name}</strong>
              <small>{index + 1}</small>
            </button>
          );
        })}
      </div>

      <div
        className={`${styles.cauldronTarget} ${brewing ? styles.cauldronBrewing : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const ingredient = event.dataTransfer.getData("text/ingredient");
          if (ingredients.some((item) => item.id === ingredient)) addIngredient(ingredient as IngredientId);
        }}
        aria-label="Cauldron drop area"
      >
        <div className={styles.potionSurface}>
          {selected.map((ingredient, index) => (
            <motion.span
              key={ingredient}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ left: `${28 + index * 22}%` }}
            >
              <Icon name={ingredients.find((item) => item.id === ingredient)?.icon ?? "Sparkles"} size={17} />
            </motion.span>
          ))}
        </div>
        <button type="button" className={styles.brewButton} onClick={brew} disabled={paused || brewing}>
          <Icon name="Sparkles" size={17} /> {brewing ? "Brewing…" : "Brew"}
        </button>
      </div>

      <div className={styles.gamePrompt} aria-live="polite">
        <span className={styles.promptIcon}><Icon name="BookOpenText" size={16} /></span>
        <p>{message}</p>
        {mistakes > 0 && <span className={styles.caughtCount}>{mistakes} hint{mistakes === 1 ? "" : "s"}</span>}
      </div>

      {paused && (
        <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Game paused">
          <div>
            <span className={styles.eyebrow}>The potion settles</span>
            <h2>Voyage paused</h2>
            <p>Your ingredients will stay in the cauldron.</p>
            <button type="button" className={styles.primaryButton} onClick={() => setPaused(false)} autoFocus>Resume <Icon name="Play" size={17} /></button>
          </div>
        </div>
      )}

      {won && (
        <div className={styles.gameOverlay} role="dialog" aria-modal="true" aria-label="Mission complete">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className={styles.eyebrow}>Mission complete</span>
            <h2>Golden steam, human feet.</h2>
            <p>{mistakes === 0 ? "Circe smiles at your first brew." : "The right charm is worth a little experimenting."}</p>
            <div className={styles.resultStars} aria-label={`${Math.max(1, 3 - mistakes)} out of 3 laurels`}>
              {[0, 1, 2].map((index) => <Icon key={index} name="Leaf" size={24} className={index < Math.max(1, 3 - mistakes) ? styles.starEarned : styles.starEmpty} />)}
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => onComplete(Math.max(1, 3 - mistakes))} autoFocus>Continue voyage <Icon name="ArrowRight" size={17} /></button>
            <button type="button" className={styles.textButton} onClick={reset}>Brew again</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
