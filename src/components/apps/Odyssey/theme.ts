// Odyssey minigame — shared visual language + island metadata.
// The game keeps its own immersive "atlas" palette (parchment + Aegean sea +
// gold) independent of the OS light/dark theme, so it always reads as a map.

export const PALETTE = {
  parchment: "#e9d8b4",
  parchmentDeep: "#d8c096",
  parchmentShadow: "#c2a878",
  ink: "#3a2a17",
  inkSoft: "#6b5334",
  sea: "#12384a",
  seaDeep: "#0b2531",
  seaLight: "#1d556b",
  foam: "#a9d8dd",
  gold: "#d8a63a",
  goldBright: "#f2c65a",
  crimson: "#a4331f",
  vine: "#3f6b3a",
  night: "#0a1016",
  ember: "#e07a2f",
} as const;

export type GameId = "cyclops" | "circe" | "underworld" | "scylla";

export interface Island {
  id: GameId;
  /** Short name shown on the pin. */
  name: string;
  /** One-line flavour shown on hover / in the voyage caption. */
  subtitle: string;
  /** Longer lore shown in the quest drawer. */
  lore: string;
  /** What the player must do. */
  objective: string;
  /** Genre tag shown in the drawer. */
  kind: string;
  /** Reward name shown in the drawer. */
  reward: string;
  /** Emoji for the reward chip. */
  rewardIcon: string;
  /** Position on the atlas, as a percentage of the map area. */
  x: number;
  y: number;
  /** Accent colour for the pin + game chrome. */
  accent: string;
}

export const ISLANDS: Island[] = [
  {
    id: "cyclops",
    name: "Cave of the Cyclops",
    subtitle: "Slip past Polyphemus while his eye is shut",
    lore: "Odysseus and his crew are trapped in the cave of Polyphemus, the man-eating giant. Their only escape is to move while his single eye is closed — and freeze the instant it opens.",
    objective: "Creep to the cave mouth unseen. Hide behind the sheep when the eye opens.",
    kind: "Stealth",
    reward: "The Blinded Eye",
    rewardIcon: "👁️",
    x: 24,
    y: 30,
    accent: PALETTE.crimson,
  },
  {
    id: "circe",
    name: "Circe's Hut",
    subtitle: "Brew the potion before it curdles",
    lore: "On the isle of Aeaea, the enchantress Circe turns sailors into swine. Brew the moly draught exactly to her recipe to break the spell.",
    objective: "Add each ingredient on cue, stir the cauldron, and keep the flame steady.",
    kind: "Cooking / Timing",
    reward: "Moly Draught",
    rewardIcon: "🧪",
    x: 71,
    y: 24,
    accent: PALETTE.vine,
  },
  {
    id: "underworld",
    name: "The Underworld",
    subtitle: "Summon the right shade from the mist",
    lore: "At the world's edge Odysseus calls upon the dead for guidance. Read each riddle and summon the shade the prophecy names from the drifting mist.",
    objective: "Match every clue to the soul that fits it.",
    kind: "Deduction",
    reward: "Tiresias's Prophecy",
    rewardIcon: "🔮",
    x: 30,
    y: 71,
    accent: "#6d5fa8",
  },
  {
    id: "scylla",
    name: "Scylla & Charybdis",
    subtitle: "Thread the strait between beast and whirlpool",
    lore: "The last trial: a narrow strait guarded by the six-headed Scylla above and the all-swallowing whirlpool Charybdis below. Only a steady hand at the helm makes it home.",
    objective: "Steer the ship through the strait and survive the crossing.",
    kind: "Action / Dodge",
    reward: "Safe Passage Home",
    rewardIcon: "🏛️",
    x: 75,
    y: 66,
    accent: PALETTE.sea,
  },
];

/** Home port the voyage starts from before any island is chosen. */
export const HOME_PORT = { x: 11, y: 87 };

export const STORAGE_KEY = "odyssey-progress-v1";
