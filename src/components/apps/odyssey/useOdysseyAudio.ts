"use client";

import { useCallback, useRef } from "react";

type SoundName = "move" | "caught" | "success" | "select" | "brew";

const soundNotes: Record<SoundName, number[]> = {
  move: [330, 440],
  caught: [220, 164],
  success: [392, 523, 659],
  select: [440],
  brew: [294, 370, 494],
};

export function useOdysseyAudio(muted: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  return useCallback(
    (name: SoundName) => {
      if (muted || typeof window === "undefined") return;

      const AudioContextCtor = window.AudioContext;
      if (!AudioContextCtor) return;

      const context = contextRef.current ?? new AudioContextCtor();
      contextRef.current = context;
      const now = context.currentTime;

      soundNotes[name].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + index * 0.075;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.12);
      });
    },
    [muted]
  );
}

