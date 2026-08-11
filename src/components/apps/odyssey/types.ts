export type MissionId =
  | "cyclops"
  | "circe"
  | "underworld"
  | "scylla"
  | "ithaca";

export type OdysseyPhase = "map" | "mission" | "travel" | "epilogue";

export interface MissionDefinition {
  id: MissionId;
  chapter: string;
  title: string;
  shortTitle: string;
  description: string;
  instruction: string;
  accent: string;
  position: { x: number; y: number };
  icon: string;
}

export interface OdysseySave {
  currentMission: number;
  completed: MissionId[];
  muted: boolean;
  best: Partial<Record<MissionId, number>>;
}

