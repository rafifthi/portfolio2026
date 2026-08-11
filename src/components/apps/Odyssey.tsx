"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CyclopsGame from "./odyssey/CyclopsGame";
import CirceGame from "./odyssey/CirceGame";
import UnderworldGame from "./odyssey/UnderworldGame";
import ScyllaGame from "./odyssey/ScyllaGame";
import BowGame from "./odyssey/BowGame";
import WorldMap from "./odyssey/WorldMap";
import { Icon } from "@/components/Icon";
import { defaultSave, missions, ODYSSEY_STORAGE_KEY } from "./odyssey/data";
import type { MissionId, OdysseyPhase, OdysseySave } from "./odyssey/types";
import { useOdysseyAudio } from "./odyssey/useOdysseyAudio";
import styles from "./odyssey/Odyssey.module.css";

interface OdysseyProps {
  isMobile?: boolean;
}

function isMissionId(value: unknown): value is MissionId {
  return typeof value === "string" && missions.some((mission) => mission.id === value);
}

function readSave(): OdysseySave {
  try {
    const raw = window.localStorage.getItem(ODYSSEY_STORAGE_KEY);
    if (!raw) return defaultSave;
    const parsed = JSON.parse(raw) as Partial<OdysseySave>;
    return {
      currentMission: Math.min(Math.max(Number(parsed.currentMission) || 0, 0), missions.length - 1),
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter(isMissionId) : [],
      muted: Boolean(parsed.muted),
      best: parsed.best && typeof parsed.best === "object" ? parsed.best : {},
    };
  } catch {
    return defaultSave;
  }
}

export default function Odyssey({ isMobile = false }: OdysseyProps) {
  const [save, setSave] = useState<OdysseySave>(defaultSave);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<OdysseyPhase>("map");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [travel, setTravel] = useState({ from: 0, to: 1, ready: false });
  const playSound = useOdysseyAudio(save.muted);

  useEffect(() => {
    const stored = readSave();
    // localStorage is client-only, so the server-safe defaults resolve after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSave(stored);
    setSelectedIndex(stored.currentMission);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(ODYSSEY_STORAGE_KEY, JSON.stringify(save));
  }, [hydrated, save]);

  useEffect(() => {
    const artwork = [
      "/games/odyssey/cyclops.webp",
      "/games/odyssey/cyclops-sprite.webp",
      "/games/odyssey/circe.webp",
      "/games/odyssey/underworld.webp",
      "/games/odyssey/scylla.webp",
      "/games/odyssey/ithaca.webp",
    ];
    artwork.forEach((source) => {
      const image = new window.Image();
      image.src = source;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setSave((value) => ({ ...value, muted: !value.muted }));
  }, []);

  const startSelectedMission = useCallback(() => {
    playSound("select");
    setPhase("mission");
  }, [playSound]);

  const finishMission = useCallback(
    (score: number) => {
      const finishedIndex = selectedIndex;
      const finished = missions[finishedIndex];
      const nextIndex = Math.min(finishedIndex + 1, missions.length - 1);

      setSave((value) => ({
        ...value,
        currentMission: Math.max(value.currentMission, nextIndex),
        completed: value.completed.includes(finished.id)
          ? value.completed
          : [...value.completed, finished.id],
        best: {
          ...value.best,
          [finished.id]: Math.max(value.best[finished.id] ?? 0, score),
        },
      }));

      if (finishedIndex === missions.length - 1) {
        setPhase("epilogue");
        return;
      }

      setTravel({ from: finishedIndex, to: nextIndex, ready: false });
      setSelectedIndex(nextIndex);
      setPhase("travel");
      window.setTimeout(() => {
        setTravel((value) => ({ ...value, ready: true }));
      }, 1850);
    },
    [selectedIndex]
  );

  const missionContent = useMemo(() => {
    const mission = missions[selectedIndex];
    if (mission.id === "cyclops") {
      return (
        <CyclopsGame
          muted={save.muted}
          onToggleMute={toggleMute}
          onExit={() => setPhase("map")}
          onComplete={finishMission}
          onSound={playSound}
        />
      );
    }

    if (mission.id === "circe") {
      return (
        <CirceGame
          muted={save.muted}
          onToggleMute={toggleMute}
          onExit={() => setPhase("map")}
          onComplete={finishMission}
          onSound={playSound}
        />
      );
    }

    if (mission.id === "underworld") {
      return (
        <UnderworldGame
          muted={save.muted}
          onToggleMute={toggleMute}
          onExit={() => setPhase("map")}
          onComplete={finishMission}
          onSound={playSound}
        />
      );
    }

    if (mission.id === "scylla") {
      return (
        <ScyllaGame
          muted={save.muted}
          onToggleMute={toggleMute}
          onExit={() => setPhase("map")}
          onComplete={finishMission}
          onSound={playSound}
        />
      );
    }

    if (mission.id === "ithaca") {
      return (
        <BowGame
          muted={save.muted}
          onToggleMute={toggleMute}
          onExit={() => setPhase("map")}
          onComplete={finishMission}
          onSound={playSound}
        />
      );
    }

    return null;
  }, [finishMission, playSound, save.muted, selectedIndex, toggleMute]);

  if (!hydrated) {
    return (
      <div className={styles.odysseyRoot} aria-busy="true">
        <div className={styles.loadingMap}>Unrolling the map…</div>
      </div>
    );
  }

  return (
    <div
      className={styles.odysseyRoot}
      data-mobile={isMobile || undefined}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {phase === "map" && (
        <WorldMap
          isMobile={isMobile}
          selectedIndex={selectedIndex}
          currentMission={save.currentMission}
          completed={save.completed}
          muted={save.muted}
          onSelect={(index) => {
            setSelectedIndex(index);
            playSound("select");
          }}
          onStart={startSelectedMission}
          onToggleMute={toggleMute}
        />
      )}

      {phase === "travel" && (
        <WorldMap
          isMobile={isMobile}
          selectedIndex={travel.to}
          currentMission={save.currentMission}
          completed={save.completed}
          traveling
          travelFrom={travel.from}
          travelTo={travel.to}
          travelReady={travel.ready}
          muted={save.muted}
          onSelect={() => {}}
          onStart={startSelectedMission}
          onToggleMute={toggleMute}
        />
      )}

      {phase === "mission" && missionContent}

      {phase === "epilogue" && (
        <section className={styles.epilogue} aria-label="The Odyssey epilogue">
          <div className={`${styles.sceneArtwork} ${styles.ithacaArtwork}`} aria-hidden />
          <div className={styles.epilogueShade} aria-hidden />
          <div className={styles.epilogueCard}>
            <div className={styles.oliveSeal} aria-hidden><Icon name="Trees" size={30} /></div>
            <span className={styles.eyebrow}>Home at last</span>
            <h2>The olive tree still stands.</h2>
            <p>
              Beneath its branches, the wandering ends. Every close call, clever brew,
              whispered soul, and steady shot has carried you home to Ithaca.
            </p>
            <div className={styles.voyageSummary} aria-label="Voyage complete, five chapters finished">
              {missions.map((mission) => (
                <span key={mission.id} title={mission.title}>
                  <Icon name={mission.icon} size={15} />
                  <b>{save.best[mission.id] ?? 1}</b>
                </span>
              ))}
            </div>
            <small>5 chapters complete · your best laurels are saved</small>
            <button type="button" className={styles.primaryButton} onClick={() => setPhase("map")}>
              Return to the voyage <Icon name="Map" size={17} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
