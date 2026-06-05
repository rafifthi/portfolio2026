"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

interface WindowProps {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized?: boolean;
  isMaximized?: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  children: React.ReactNode;
  icon?: string;
}

export default function Window({
  id,
  title,
  x,
  y,
  width,
  height,
  zIndex,
  isMinimized,
  isMaximized,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  children,
  icon,
}: WindowProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const TOPBAR_H = 28; // h-7 desktop menu bar
    const safeX = Math.min(Math.max(x, 0), Math.max(vw - width - 20, 0));
    const safeY = Math.max(Math.min(y, Math.max(vh - height - 80, TOPBAR_H)), TOPBAR_H);
    setPosition({ x: safeX, y: safeY });
  }, [x, y, width, height]);

  if (isMinimized) return null;

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          isMaximized
            ? { opacity: 1, scale: 1, x: 0, y: 28 }
            : { opacity: 1, scale: 1, x: position.x, y: position.y }
        }
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.9 }}
        onPointerDown={onFocus}
        style={{
          position: "absolute",
          width: isMaximized ? "100vw" : width,
          height: isMaximized ? "calc(100vh - 28px)" : height,
          zIndex,
          left: 0,
          top: 0,
        }}
        className="window-glass rounded-xl overflow-hidden flex flex-col"
      >
        {/* Title Bar */}
        <div
          className="h-9 flex items-center px-4 select-none border-b cursor-default transition-colors duration-300"
          style={{
            background: "var(--bg-titlebar)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-3 h-3 rounded-full flex items-center justify-center group transition-colors"
              style={{ background: "#ff5f57" }}
            >
              <Icon name="X" size={8} className="text-black/0 group-hover:text-black/60" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMinimize?.();
              }}
              className="w-3 h-3 rounded-full flex items-center justify-center group transition-colors"
              style={{ background: "#febc2e" }}
            >
              <Icon name="Minus" size={8} className="text-black/0 group-hover:text-black/60" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMaximize?.();
              }}
              className="w-3 h-3 rounded-full flex items-center justify-center group transition-colors"
              style={{ background: "#28c840" }}
            >
              <Icon name="Maximize2" size={8} className="text-black/0 group-hover:text-black/60" />
            </button>
          </div>
          <div
            className="flex-1 text-center text-xs font-medium truncate px-4 flex items-center justify-center gap-1.5 transition-colors duration-300"
            style={{ color: "var(--text-primary)" }}
          >
            {icon && <Icon name={icon} size={12} />}
            <span>{title}</span>
          </div>
          <div className="w-14" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </motion.div>

      {/* Drag constraints */}
      <div
        ref={constraintsRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </>
  );
}
