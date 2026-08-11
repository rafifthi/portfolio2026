"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import { missions } from "./data";
import type { MissionId } from "./types";
import styles from "./Odyssey.module.css";

interface WorldMapProps {
  isMobile?: boolean;
  selectedIndex: number;
  currentMission: number;
  completed: MissionId[];
  traveling?: boolean;
  travelFrom?: number;
  travelTo?: number;
  travelReady?: boolean;
  muted: boolean;
  onSelect: (index: number) => void;
  onStart: () => void;
  onToggleMute: () => void;
}

export default function WorldMap({
  isMobile = false,
  selectedIndex,
  currentMission,
  completed,
  traveling = false,
  travelFrom = currentMission,
  travelTo = currentMission,
  travelReady = false,
  muted,
  onSelect,
  onStart,
  onToggleMute,
}: WorldMapProps) {
  const mission = missions[selectedIndex];
  const shipOrigin = missions[traveling ? travelFrom : currentMission].position;
  const shipDestination = missions[traveling ? travelTo : currentMission].position;
  const checkpointTop = (top: number) => top - (isMobile ? 7 : 0);
  const shipTop = (top: number) => top + (isMobile ? -2 : 8);

  return (
    <section className={styles.mapScreen} aria-label="Odyssey voyage map">
      <div className={styles.mapArtwork} aria-hidden />
      <div className={styles.mapWash} aria-hidden />

      <header className={styles.mapHeader}>
        <div>
          <span className={styles.eyebrow}>A five-chapter voyage</span>
          <h1>The Odyssey</h1>
        </div>
        <div className={styles.mapUtilities}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleMute}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
          >
            <Icon name={muted ? "VolumeX" : "Volume2"} size={18} />
          </button>
          <span className={styles.progressPill}>{currentMission + 1}/5</span>
        </div>
      </header>

      <svg
        className={styles.routeLine}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M12 65 C20 70 25 57 32 61 S43 68 51 63 S62 58 70 66 S82 69 88 62" />
      </svg>

      {missions.map((item, index) => {
        const isComplete = completed.includes(item.id);
        const isCurrent = index === currentMission;
        const isUnlocked = index <= currentMission;
        const isSelected = index === selectedIndex;

        return (
          <button
            type="button"
            key={item.id}
            className={`${styles.checkpoint} ${isSelected ? styles.checkpointSelected : ""}`}
            style={{ left: `${item.position.x}%`, top: `${checkpointTop(item.position.y)}%` }}
            onClick={() => isUnlocked && !traveling && onSelect(index)}
            disabled={!isUnlocked || traveling}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`${item.shortTitle}, ${
              isComplete ? "complete" : isCurrent ? "current mission" : "locked"
            }`}
          >
            <span
              className={styles.checkpointMedallion}
              style={{ backgroundColor: isUnlocked ? item.accent : undefined }}
            >
              <Icon name={isComplete ? "Check" : isUnlocked ? item.icon : "LockKeyhole"} size={18} />
            </span>
            <span className={styles.checkpointLabel}>{item.shortTitle}</span>
          </button>
        );
      })}

      <motion.div
        className={styles.mapShip}
        initial={false}
        animate={{
          left: `${shipDestination.x}%`,
          top: `${shipTop(shipDestination.y)}%`,
        }}
        transition={
          traveling
            ? { duration: 1.75, ease: [0.16, 1, 0.3, 1] }
            : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
        style={{ left: `${shipOrigin.x}%`, top: `${shipTop(shipOrigin.y)}%` }}
        aria-label="Ship position"
      >
        <Icon name="Sailboat" size={27} />
      </motion.div>

      {traveling ? (
        <motion.div
          className={styles.travelJournal}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          aria-live="polite"
        >
          <span className={styles.eyebrow}>Sailing onward</span>
          <h2>{missions[travelTo].title}</h2>
          <p>{missions[travelTo].description}</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onStart}
            disabled={!travelReady}
            autoFocus={travelReady}
          >
            {travelReady ? "Start mission" : "Following the stars…"}
            <Icon name="ArrowRight" size={17} />
          </button>
        </motion.div>
      ) : (
        <aside className={styles.missionSheet} aria-label="Selected mission">
          <span className={styles.chapterSeal}>Chapter {mission.chapter}</span>
          <div className={styles.missionIllustration} data-mission={mission.id} aria-hidden>
            <Icon name={mission.icon} size={34} />
          </div>
          <span className={styles.eyebrow}>Next landing</span>
          <h2>{mission.title}</h2>
          <p>{mission.description}</p>
          <ul className={styles.missionGoals}>
            <li><Icon name="MousePointer2" size={15} /> Tap or click</li>
            <li><Icon name="Keyboard" size={15} /> Keyboard ready</li>
            <li><Icon name="Heart" size={15} /> Forgiving retries</li>
          </ul>
          <div className={styles.chapterNavigator} aria-label="Browse unlocked chapters">
            <button
              type="button"
              onClick={() => onSelect(selectedIndex - 1)}
              disabled={selectedIndex === 0}
              aria-label="Previous chapter"
            >
              <Icon name="ChevronLeft" size={17} />
            </button>
            <span>{selectedIndex + 1} of {currentMission + 1}</span>
            <button
              type="button"
              onClick={() => onSelect(selectedIndex + 1)}
              disabled={selectedIndex >= currentMission}
              aria-label="Next chapter"
            >
              <Icon name="ChevronRight" size={17} />
            </button>
          </div>
          <button type="button" className={styles.primaryButton} onClick={onStart}>
            {completed.includes(mission.id) ? "Play again" : "Start mission"}
            <Icon name="ArrowRight" size={17} />
          </button>
        </aside>
      )}
    </section>
  );
}
