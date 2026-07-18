"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

interface DesktopIconProps {
  id: string;
  label: string;
  image: string;
  x: number;
  y: number;
  width: number;
  onOpen: () => void;
  disableDrag?: boolean;
  compact?: boolean;
}

const DESKTOP_ICON_RADIUS = 14;

export default function DesktopIcon({ id, label, image, x, y, width, onOpen, disableDrag = false, compact = false }: DesktopIconProps) {
  const ptr = useRef({ downX: 0, downY: 0, dragged: false });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      id={id}
      drag={!disableDrag}
      dragMomentum={false}
      initial={false}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();
        ptr.current.downX = e.clientX;
        ptr.current.downY = e.clientY;
        ptr.current.dragged = false;
      }}
      onDragStart={() => { ptr.current.dragged = true; }}
      onPointerUp={(e) => {
        // Mobile icons use the native click path below. On iOS, pointer-up can
        // be cancelled by the browser's touch gesture handling even for a tap.
        if (disableDrag) {
          ptr.current.dragged = false;
          return;
        }

        // Robust click detection: open if the pointer barely moved between
        // down and up (a tap), regardless of how long the press took.
        if (ptr.current.dragged) {
          ptr.current.dragged = false;
          return;
        }
        const dx = e.clientX - ptr.current.downX;
        const dy = e.clientY - ptr.current.downY;
        const moved = Math.hypot(dx, dy);
        if (moved < 6) {
          onOpen();
        }
        ptr.current.dragged = false;
      }}
      onPointerCancel={() => {
        ptr.current.dragged = false;
      }}
      aria-label={`Open ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        // Pointer clicks are handled above on draggable desktop icons. Native
        // click is the reliable path for touch and keyboard activation.
        if (disableDrag || e.detail === 0) {
          onOpen();
        }
      }}
      className="absolute flex appearance-none flex-col items-center gap-0 border-0 bg-transparent p-0 text-inherit cursor-pointer group select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width,
        touchAction: disableDrag ? "manipulation" : "none",
      }}
    >
      {/* Hover glass wrapper — wraps both thumbnail + label */}
      <div
        className="flex flex-col items-center gap-0.5 rounded-2xl p-1.5 transition-all duration-150"
        style={{
          background: hovered
            ? "rgba(255, 255, 255, 0.12)"
            : "transparent",
          backdropFilter: hovered ? "blur(12px)" : "none",
          WebkitBackdropFilter: hovered ? "blur(12px)" : "none",
          boxShadow: hovered
            ? "0 0 0 1px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)"
            : "none",
        }}
      >
        {/* Thumbnail */}
        <div
          className={`${compact ? "h-20" : ""} w-full overflow-hidden shadow-lg transition-all duration-150 flex items-center justify-center`}
          style={{
            borderRadius: DESKTOP_ICON_RADIUS,
            boxShadow: hovered
              ? `0 0 0 2px rgba(59,130,246,0.6), 0 8px 24px rgba(0,0,0,0.4)`
              : `0 6px 20px rgba(0, 0, 0, 0.35)`,
          }}
        >
          <img
            src={image}
            alt={label}
            className={compact ? "max-h-full max-w-full h-auto w-auto object-contain" : "w-full h-auto object-contain"}
            style={{ borderRadius: DESKTOP_ICON_RADIUS }}
            loading="eager"
            fetchPriority="high"
            draggable={false}
          />
        </div>

        {/* Label */}
        <span
          className="text-[11px] font-medium text-center px-3 py-0.5 rounded-md leading-tight max-w-full truncate transition-all duration-150"
          style={{
            backgroundColor: hovered
              ? "rgba(59, 130, 246, 0.85)"
              : "transparent",
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          }}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}
