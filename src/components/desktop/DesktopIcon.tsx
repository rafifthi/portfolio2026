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
}

export default function DesktopIcon({ label, image, x, y, width, onOpen }: DesktopIconProps) {
  const ptr = useRef({ downTime: 0, dragged: false });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={false}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onPointerDown={(e) => {
        e.stopPropagation();
        ptr.current.downTime = Date.now();
        ptr.current.dragged = false;
      }}
      onDragStart={() => { ptr.current.dragged = true; }}
      onTap={() => {
        if (!ptr.current.dragged) {
          const elapsed = Date.now() - ptr.current.downTime;
          if (elapsed < 300) {
            onOpen();
          }
        }
        ptr.current.dragged = false;
      }}
      className="absolute flex flex-col items-center gap-0 cursor-pointer group select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width,
        touchAction: "none",
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
          className="w-full overflow-hidden rounded-xl shadow-lg transition-all duration-150"
          style={{
            boxShadow: hovered
              ? `0 0 0 2px rgba(59,130,246,0.6), 0 8px 24px rgba(0,0,0,0.4)`
              : `0 6px 20px rgba(0, 0, 0, 0.35)`,
          }}
        >
          <img
            src={image}
            alt={label}
            className="w-full h-auto object-contain"
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
    </motion.div>
  );
}
