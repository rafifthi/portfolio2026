"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { OdysseyGameProps } from "../index";
import { HintBar, Lives, ResultOverlay, StartScrim } from "../shared";

interface Soul {
  id: string;
  name: string;
  item: string;
  trait: string;
  clue: string;
}

const POOL: Soul[] = [
  { id: "tiresias", name: "Tiresias", item: "🦯", trait: "The Seer", clue: "The blind prophet who kept his wits in death — find the shade leaning on a pale staff." },
  { id: "agamemnon", name: "Agamemnon", item: "👑", trait: "The Slain King", clue: "A great king cut down at his own hearth — he still wears his golden crown." },
  { id: "achilles", name: "Achilles", item: "🛡️", trait: "The Warrior", clue: "The swiftest and proudest of the Greeks — look for his gleaming shield." },
  { id: "elpenor", name: "Elpenor", item: "🍷", trait: "The Fallen Sailor", clue: "Youngest of the crew, who fell from Circe's roof — the shade still cradling a wine cup." },
  { id: "anticleia", name: "Anticleia", item: "🧵", trait: "The Mother", clue: "A mother who died of longing for her son — she holds a spinner's thread." },
  { id: "orion", name: "Orion", item: "🏹", trait: "The Hunter", clue: "A giant who hunts across the asphodel meadow — spot the one bearing a great bow." },
  { id: "minos", name: "Minos", item: "⚖️", trait: "The Judge", clue: "The judge of the dead who weighs each soul — find his even scales." },
  { id: "heracles", name: "Heracles", item: "🦁", trait: "The Strongman", clue: "The hero draped in a lion's hide, his labors done — seek the lion pelt." },
];

const SLOTS = [
  { x: 0.2, y: 0.3 },
  { x: 0.5, y: 0.22 },
  { x: 0.8, y: 0.32 },
  { x: 0.27, y: 0.68 },
  { x: 0.55, y: 0.74 },
  { x: 0.78, y: 0.64 },
];

const ROUNDS = 4;
const PER_ROUND = 5;
const MAX_MISTAKES = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RoundData {
  target: Soul;
  souls: (Soul & { x: number; y: number })[];
}

function buildRounds(): RoundData[] {
  const targets = shuffle(POOL).slice(0, ROUNDS);
  return targets.map((target) => {
    const distractors = shuffle(POOL.filter((s) => s.id !== target.id)).slice(0, PER_ROUND - 1);
    const chosen = shuffle([target, ...distractors]);
    const slots = shuffle(SLOTS).slice(0, chosen.length);
    return {
      target,
      souls: chosen.map((s, i) => ({ ...s, x: slots[i].x, y: slots[i].y })),
    };
  });
}

export default function Underworld({ accent, reducedMotion, onWin, onExit }: OdysseyGameProps) {
  const [rounds, setRounds] = useState<RoundData[]>(() => buildRounds());
  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"won" | "lost" | null>(null);

  const round = rounds[roundIdx];

  const reset = useCallback(() => {
    setRounds(buildRounds());
    setRoundIdx(0);
    setSelected(null);
    setWrong(new Set());
    setMistakes(0);
    setStatus(null);
    setRunning(true);
  }, []);

  const confirm = () => {
    if (!selected || !round) return;
    if (selected === round.target.id) {
      if (roundIdx + 1 >= ROUNDS) {
        onWin();
        setRunning(false);
        setStatus("won");
      } else {
        setRoundIdx((i) => i + 1);
        setSelected(null);
        setWrong(new Set());
      }
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setWrong((w) => new Set(w).add(selected));
      setSelected(null);
      if (nextMistakes >= MAX_MISTAKES) {
        setRunning(false);
        setStatus("lost");
      }
    }
  };

  const selectedSoul = useMemo(
    () => round?.souls.find((s) => s.id === selected) ?? null,
    [round, selected]
  );

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: `radial-gradient(120% 100% at 50% 0%, #241d3a, #0b0913 70%)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-2.5">
        <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
          Shade {Math.min(roundIdx + 1, ROUNDS)} / {ROUNDS}
        </span>
        <div className="rounded-full px-2 py-0.5" style={{ background: "rgba(0,0,0,0.35)" }}>
          <Lives total={MAX_MISTAKES} left={MAX_MISTAKES - mistakes} />
        </div>
      </div>

      {/* Clue */}
      <div className="px-5 pt-2 text-center">
        <p className="text-sm font-semibold leading-snug text-white/90">{round?.target.clue}</p>
      </div>

      {/* Mist field with souls */}
      <div className="relative flex-1">
        {round?.souls.map((soul) => {
          const isWrong = wrong.has(soul.id);
          const isSel = selected === soul.id;
          return (
            <motion.button
              key={soul.id + roundIdx}
              disabled={isWrong}
              onClick={() => !isWrong && setSelected(soul.id)}
              className="absolute flex flex-col items-center"
              style={{ left: `${soul.x * 100}%`, top: `${soul.y * 100}%`, transform: "translate(-50%,-50%)", touchAction: "manipulation" }}
              animate={
                reducedMotion
                  ? undefined
                  : { y: [0, -8, 0], opacity: isWrong ? 0.18 : [0.85, 1, 0.85] }
              }
              transition={{ duration: 3 + (soul.x + soul.y), repeat: Infinity, ease: "easeInOut" }}
              whileTap={isWrong ? undefined : { scale: 0.9 }}
              aria-label={`A shade holding ${soul.item}`}
            >
              {/* wisp body */}
              <span
                className="relative flex items-center justify-center rounded-full"
                style={{
                  width: 60,
                  height: 72,
                  borderRadius: "50% 50% 46% 46%",
                  background: isSel
                    ? "radial-gradient(circle at 50% 30%, #d9e6ff, #7f8fd6)"
                    : "radial-gradient(circle at 50% 30%, rgba(200,214,255,0.85), rgba(90,104,160,0.55))",
                  boxShadow: isSel
                    ? `0 0 22px ${accent}, 0 0 0 2px #fff`
                    : "0 0 16px rgba(150,170,255,0.4)",
                  opacity: isWrong ? 0.25 : 1,
                  filter: isWrong ? "grayscale(1)" : "none",
                }}
              >
                {/* face */}
                <span className="absolute top-3 flex gap-2" aria-hidden>
                  <span className="block h-1.5 w-1.5 rounded-full bg-[#2a2540]" />
                  <span className="block h-1.5 w-1.5 rounded-full bg-[#2a2540]" />
                </span>
                {/* held item */}
                <span className="absolute -bottom-1 text-xl" aria-hidden>
                  {soul.item}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selection bar */}
      <div className="px-3 pb-2" style={{ minHeight: 76 }}>
        {selectedSoul ? (
          <div
            className="flex items-center gap-3 rounded-2xl p-2.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <span className="text-2xl" aria-hidden>
              {selectedSoul.item}
            </span>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-white/50">You approach the shade with…</p>
              <p className="text-sm font-bold text-white">the {selectedSoul.item} — is this the one?</p>
            </div>
            <button
              onClick={confirm}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
              style={{ background: accent }}
            >
              Summon
            </button>
          </div>
        ) : (
          <p className="pt-4 text-center text-[12px] text-white/45">
            Tap a drifting soul to approach it, then Summon the one that fits the clue.
          </p>
        )}
      </div>

      {!running && !status && (
        <StartScrim
          title="The Underworld"
          instruction="Read each clue and pick the matching shade by the token it carries. Four souls to summon — three wrong guesses and the mist claims you."
          accent={accent}
          onStart={reset}
        />
      )}

      <ResultOverlay
        status={status}
        accent={accent}
        title={status === "won" ? "The shades answered" : "Lost to the mist"}
        message={
          status === "won"
            ? "Every soul you sought stepped forward from the dark."
            : "You summoned the wrong shades too often. Read the clues again."
        }
        onRetry={reset}
        onMap={onExit}
      />

      <HintBar hints={["Tap a soul to approach", "Match the clue to the token it holds", "Then press Summon"]} />
    </div>
  );
}
