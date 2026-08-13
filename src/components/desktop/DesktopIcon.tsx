"use client";

import { motion, useDragControls } from "framer-motion";
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
  const [hovered, setHovered] = useState(false);
  const dragControls = useDragControls();
  const dragged = useRef(false);

  const handleActivate = () => {
    // Suppress the click that fires right after a drag; otherwise open the app.
    // The flag is cleared in onDragEnd (below), not here, so an icon that was
    // dragged without a trailing click still opens on its next click.
    if (dragged.current) return;
    onOpen();
  };

  return (
    <motion.div
      // Drag is driven by dragControls started from the inner handle's
      // pointerdown (the same pattern the Window title bar uses, which is the
      // configuration that actually engages framer's drag here). A plain
      // `drag` prop or self-started controls did not move the icon.
      id={id}
      drag={!disableDrag}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      whileDrag={{ zIndex: 50 }}
      initial={false}
      onDragStart={() => { dragged.current = true; }}
      onDragEnd={() => {
        // Clear after the click that may follow this drag has been handled.
        setTimeout(() => { dragged.current = false; }, 0);
      }}
      className="absolute flex flex-col items-center gap-0 text-inherit group select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width,
        touchAction: disableDrag ? "manipulation" : "none",
      }}
    >
      {/* Hover glass wrapper — also the click target + drag handle */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${label}`}
        onPointerDown={(e) => { if (!disableDrag) dragControls.start(e); }}
        onClick={handleActivate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="flex flex-col items-center gap-0.5 rounded-2xl p-1.5 transition-all duration-150 cursor-pointer"
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
        {/* Thumbnail — on mobile every icon is normalized to the same scale
            (fixed height) while keeping its own aspect ratio; the tile shrinks
            to the image so nothing is cropped or stretched into a square. */}
        <div
          className={`${compact ? "" : "w-full"} overflow-hidden shadow-lg transition-all duration-150 flex items-center justify-center`}
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
            className={
              compact
                ? "h-24 w-auto max-w-[120px] object-contain"
                : "w-full h-auto object-contain"
            }
            style={{ borderRadius: DESKTOP_ICON_RADIUS }}
            loading="eager"
            fetchPriority="high"
            draggable={false}
          />
        </div>

        {/* Label */}
        <span
          className={`${compact ? "text-[12px] mt-1" : "text-[11px]"} font-medium text-center px-3 py-0.5 rounded-md leading-tight max-w-full truncate transition-all duration-150`}
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
    </motion.div>
  );
}
