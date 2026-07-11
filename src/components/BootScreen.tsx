"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Preload target must match the default wallpaper in ThemeProvider.tsx.
const GIF_URL = "/wallpaper/ascii-magic-1.gif";
const GIF_FALLBACK_BYTES = 16_647_745; // size of ascii-magic-1.gif when Content-Length is absent
const MIN_DURATION = 2500; // never finish faster than this (avoids flash-by)
const MAX_DURATION = 7000; // never stall longer than this (slow connections)

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const reducedMotion = useReducedMotion();

  // Refs shared between the fetch stream and the display loop
  const byteProgressRef = useRef(0);
  const fetchDoneRef = useRef(false);
  const syntheticRef = useRef(false); // true when byte progress is unavailable
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false; // guards StrictMode double-invoke in dev
    const controller = new AbortController();
    const start = performance.now();

    const preload = async () => {
      try {
        const res = await fetch(GIF_URL, { signal: controller.signal, cache: "force-cache" });
        if (!res.ok || !res.body) {
          syntheticRef.current = true;
          fetchDoneRef.current = true;
          return;
        }
        const total = Number(res.headers.get("Content-Length")) || GIF_FALLBACK_BYTES;
        const reader = res.body.getReader();
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          byteProgressRef.current = Math.min(1, received / total);
        }
        fetchDoneRef.current = true;
      } catch {
        // Network error / abort: fall back to time-based progress
        syntheticRef.current = true;
        fetchDoneRef.current = true;
      }
    };
    preload();

    const finish = () => {
      if (finishedRef.current || cancelled) return;
      finishedRef.current = true;
      clearInterval(interval);
      controller.abort();
      setProgress(1);
      // Trigger our own fade-out; onComplete fires when it finishes (see
      // onAnimationComplete below). Self-managed rather than relying on
      // AnimatePresence exit, which proved unreliable here.
      setExiting(true);
    };

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const timeProgress = Math.min(1, elapsed / MIN_DURATION);

      if (elapsed >= MAX_DURATION || (fetchDoneRef.current && elapsed >= MIN_DURATION)) {
        finish();
        return;
      }

      // Bar tracks the slower of real bytes vs. minimum duration; if bytes are
      // unknowable (synthetic) it tracks time alone.
      const next = syntheticRef.current
        ? timeProgress
        : Math.min(byteProgressRef.current, timeProgress);
      setProgress((prev) => Math.max(prev, next));
    }, 50);

    return () => {
      cancelled = true;
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  // Fire onComplete exactly once when the fade-out ends, with a hard timeout
  // fallback in case the animation callback never arrives.
  const completedRef = useRef(false);
  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);
  useEffect(() => {
    if (!exiting) return;
    const id = setTimeout(complete, 900);
    return () => clearTimeout(id);
  }, [exiting, complete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (exiting) complete();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#000000",
        pointerEvents: exiting ? "none" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Logo */}
      <img
        src="/logo/neutral-dark-logo.svg"
        alt="DeimOS"
        draggable={false}
        style={{ width: 72, height: 72 }}
      />

      {/* OS name */}
      <div
        style={{
          marginTop: 20,
          fontFamily: "var(--font-geist-sans)",
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: "rgba(255, 255, 255, 0.85)",
        }}
      >
        DeimOS
      </div>

      {/* Thin progress bar, macOS-boot style */}
      <div
        style={{
          marginTop: 56,
          width: "min(230px, 60vw)",
          height: 6,
          borderRadius: 3,
          background: "rgba(255, 255, 255, 0.22)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: "100%",
            borderRadius: 3,
            background: "#ffffff",
            transition: "width 0.2s ease-out",
          }}
        />
      </div>
    </motion.div>
  );
}
