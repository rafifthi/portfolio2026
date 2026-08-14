"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Measure an element's content box. Resolution-independent geometry across the
 *  desktop window and the mobile bottom-sheet all flows from this. */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
}

/** Honour the OS "reduce motion" setting. Used to shorten/skip the voyage
 *  animation and calm background motion. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Best-effort touch detection, only to tailor the on-screen hint copy. Both
 *  input paths always work regardless of what this returns. */
export function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const sync = () => setTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return touch;
}

type LoopCallback = (deltaSeconds: number, elapsedSeconds: number) => void;

/** requestAnimationFrame loop with a clamped delta (so a backgrounded tab that
 *  resumes doesn't teleport moving objects). Latest callback is always used. */
export function useRafLoop(callback: LoopCallback, active: boolean) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20); // cap at 50ms
      last = now;
      cbRef.current(dt, (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Convert a pointer event to normalized [0..1] coordinates within an element,
 *  clamped to the box. One code path for mouse + touch + pen. */
export function useNormalizedPointer(
  ref: React.RefObject<HTMLElement | null>
) {
  return useCallback(
    (e: { clientX: number; clientY: number }) => {
      const el = ref.current;
      if (!el) return { x: 0.5, y: 0.5 };
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const y = (e.clientY - rect.top) / Math.max(rect.height, 1);
      return {
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
      };
    },
    [ref]
  );
}
