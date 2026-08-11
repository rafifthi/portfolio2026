import type { MissionDefinition } from "./types";

export const ODYSSEY_STORAGE_KEY = "portfolio-odyssey-progress-v1";

export const missions: MissionDefinition[] = [
  {
    id: "cyclops",
    chapter: "I",
    title: "Outwit the Cyclops",
    shortTitle: "Cyclops",
    description: "Slip from the one-eyed shepherd's cave to the waiting ship.",
    instruction: "Move between flocks while the great eye looks away.",
    accent: "oklch(0.61 0.16 48)",
    position: { x: 12, y: 65 },
    icon: "Eye",
  },
  {
    id: "circe",
    chapter: "II",
    title: "Circe's Palace",
    shortTitle: "Circe",
    description: "Brew the charm that restores Odysseus' transformed crew.",
    instruction: "Read the clue, mix the ingredients, then brew.",
    accent: "oklch(0.67 0.13 145)",
    position: { x: 32, y: 61 },
    icon: "FlaskConical",
  },
  {
    id: "underworld",
    chapter: "III",
    title: "Voices Below",
    shortTitle: "Underworld",
    description: "Find the three souls who know the way home.",
    instruction: "Guide the torchlight and call each soul in order.",
    accent: "oklch(0.59 0.14 302)",
    position: { x: 51, y: 63 },
    icon: "Ghost",
  },
  {
    id: "scylla",
    chapter: "IV",
    title: "The Narrow Strait",
    shortTitle: "Scylla & Charybdis",
    description: "Steer through jaws and whirlpool with your crew aboard.",
    instruction: "Choose a lane, brace at the right moment, keep sailing.",
    accent: "oklch(0.62 0.13 220)",
    position: { x: 70, y: 66 },
    icon: "Waves",
  },
  {
    id: "ithaca",
    chapter: "V",
    title: "The Bow of Ithaca",
    shortTitle: "Ithaca",
    description: "String the old bow and send one true shot through the axes.",
    instruction: "Set direction, power, and accuracy with a steady hand.",
    accent: "oklch(0.68 0.15 84)",
    position: { x: 88, y: 62 },
    icon: "Target",
  },
];

export const defaultSave: OdysseySaveShape = {
  currentMission: 0,
  completed: [],
  muted: false,
  best: {},
};

type OdysseySaveShape = {
  currentMission: number;
  completed: MissionDefinition["id"][];
  muted: boolean;
  best: Partial<Record<MissionDefinition["id"], number>>;
};

