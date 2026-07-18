"use client";

import { motion, useDragControls } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
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
  isTablet?: boolean;
  isTop?: boolean;
  mobilePresentation?: "full" | "terminal" | "spotlight";
}

function WindowIcon({ icon, size }: { icon?: string; size: number }) {
  if (!icon) return null;
  if (icon.startsWith("/")) {
    return <Image src={icon} alt="" width={size} height={size} className="shrink-0 object-contain" aria-hidden />;
  }
  return <Icon name={icon} size={size} />;
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
  isTablet = false,
  isTop = true,
  mobilePresentation = "full",
}: WindowProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [mobileViewport, setMobileViewport] = useState<{
    height: number;
    bottomInset: number;
  } | null>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    const clamp = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const TOPBAR_H = 28; // h-7 desktop menu bar
      const frameWidth = isTablet ? Math.min(Math.round(width * 0.86), vw - 40) : width;
      const frameHeight = isTablet ? Math.min(Math.round(height * 0.86), vh - 104) : height;
      const safeX = Math.min(Math.max(x, 0), Math.max(vw - frameWidth - 20, 0));
      const safeY = Math.max(Math.min(y, Math.max(vh - frameHeight - 80, TOPBAR_H)), TOPBAR_H);
      setPosition({ x: safeX, y: safeY });
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [x, y, width, height, isTablet]);

  useEffect(() => {
    if (!isMobile) return;

    const updateViewport = () => {
      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const bottomInset = viewport
        ? Math.max(window.innerHeight - viewport.height - viewport.offsetTop, 0)
        : 0;

      setMobileViewport({ height: viewportHeight, bottomInset });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, [isMobile]);

  if (isMinimized) return null;

  // ── iOS bottom sheet (mobile) ──────────────────────────────
  // The dim backdrop is rendered once by page.tsx (shared across sheets).
  if (isMobile) {
    const availableHeight = Math.max(mobileViewport?.height ?? window.innerHeight, 180);
    const cappedHeight = Math.max(availableHeight - 8, 180);
    const sheetHeight =
      mobilePresentation === "spotlight"
        ? Math.min(560, cappedHeight, availableHeight * 0.68)
        : Math.min(cappedHeight, availableHeight * 0.92);
    const maxSheetHeight =
      mobilePresentation === "terminal"
        ? Math.min(520, cappedHeight, availableHeight * 0.72)
        : sheetHeight;

    return (
        <motion.div
          data-window-id={id}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) onClose();
          }}
          onPointerDown={onFocus}
          initial={{ y: "100%" }}
          animate={
            isTop
              ? { y: 0, scale: 1, opacity: 1 }
              : { y: -10, scale: 0.96, opacity: 0.85 }
          }
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 42, mass: 0.9 }}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: mobileViewport?.bottomInset ?? 0,
            zIndex,
            height: mobilePresentation === "terminal" ? "auto" : sheetHeight,
            maxHeight: maxSheetHeight,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          className="window-glass min-h-0 rounded-t-[28px] overflow-hidden flex flex-col"
        >
          {/* Grabber + iOS nav bar act as the drag handle */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex-shrink-0"
          >
            <div className="pt-2.5 pb-1 flex justify-center">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: "var(--text-tertiary)" }}
              />
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
                <WindowIcon icon={icon} size={15} />
                <span>{title}</span>
              </div>
              <div className="w-12 flex-shrink-0" />
            </div>
          </div>

          {/* Content — natively scrollable */}
          <div
            className={`${
              mobilePresentation === "terminal" ? "flex-none" : "flex-1"
            } min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain relative`}
            style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>
        </motion.div>
    );
  }

  return (
    <>
      <motion.div
        data-window-id={id}
        drag
        dragListener={false}
        dragControls={dragControls}
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
          width: isMaximized ? "100vw" : isTablet ? Math.round(width * 0.86) : width,
          height: isMaximized ? "calc(100dvh - 28px)" : isTablet ? Math.round(height * 0.86) : height,
          maxWidth: isMaximized ? undefined : isTablet ? "calc(100vw - 40px)" : "calc(100vw - 24px)",
          maxHeight: isMaximized ? undefined : isTablet ? "calc(100dvh - 104px)" : undefined,
          zIndex,
          left: 0,
          top: 0,
        }}
        className="window-glass min-h-0 rounded-xl overflow-hidden flex flex-col"
      >
        {/* Title Bar */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
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
            <WindowIcon icon={icon} size={14} />
            <span>{title}</span>
          </div>
          <div className="w-14" />
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-hidden relative">
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
