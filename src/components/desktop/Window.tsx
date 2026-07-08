"use client";

import { motion, useDragControls } from "framer-motion";
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
  isMobile?: boolean;
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
  isMobile = false,
}: WindowProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const dragControls = useDragControls();

  useEffect(() => {
    const clamp = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const TOPBAR_H = 28; // h-7 desktop menu bar
      const safeX = Math.min(Math.max(x, 0), Math.max(vw - width - 20, 0));
      const safeY = Math.max(Math.min(y, Math.max(vh - height - 80, TOPBAR_H)), TOPBAR_H);
      setPosition({ x: safeX, y: safeY });
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [x, y, width, height]);

  if (isMinimized) return null;

  // ── iOS bottom sheet (mobile) ──────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Dim backdrop — tap to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[9990] bg-black/40"
        />

        <motion.div
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) onClose();
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 42, mass: 0.9 }}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9992,
            maxHeight: "92vh",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          className="window-glass rounded-t-[28px] overflow-hidden flex flex-col"
        >
          {/* Grabber + iOS nav bar act as the drag handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex-shrink-0"
          >
            <div className="pt-2.5 pb-1 flex justify-center">
              <div className="w-9 h-1 rounded-full bg-white/25 dark:bg-white/25" />
            </div>

            <div
              className="flex items-center justify-between px-4 h-12 border-b"
              style={{
                background: "var(--bg-titlebar)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <button
                onClick={onClose}
                className="text-[17px] font-medium min-w-12 min-h-11 -ml-1 flex items-center"
                style={{ color: "var(--accent)" }}
              >
                Done
              </button>
              <div
                className="flex-1 text-center text-[17px] font-semibold truncate px-2 flex items-center justify-center gap-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                {icon && <Icon name={icon} size={15} />}
                <span>{title}</span>
              </div>
              <div className="w-12 flex-shrink-0" />
            </div>
          </div>

          {/* Content — natively scrollable */}
          <div
            className="flex-1 overflow-auto overscroll-contain relative"
            style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>
        </motion.div>
      </>
    );
  }

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
