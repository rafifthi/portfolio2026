"use client";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export interface MenuItem {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

interface MenuDropdownProps {
  items: MenuItem[];
  onClose: () => void;
  isMobile?: boolean;
}

export default function MenuDropdown({ items, onClose, isMobile = false }: MenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Close on next tick so the click that opened it doesn't immediately close it
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // ── iOS action sheet (mobile) ─────────────────────────────
  // Portaled to <body>: the menu bar's backdrop-filter creates a containing
  // block that would otherwise trap this position:fixed sheet inside the bar.
  if (isMobile) {
    const visibleItems = items.filter((it) => !it.separator);
    return createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[10000] bg-black/40"
        >
          <motion.div
            ref={ref}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 42, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            className="px-2 pb-2 flex flex-col gap-2"
          >
            {/* Action group */}
            <div
              className="rounded-2xl overflow-hidden window-glass"
              style={{ boxShadow: "var(--dropdown-shadow)" }}
            >
              {visibleItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!item.disabled && item.onClick) item.onClick();
                    onClose();
                  }}
                  disabled={item.disabled}
                  className="w-full text-center py-3 text-[17px] font-medium flex flex-col items-center justify-center min-h-[44px]"
                  style={{
                    color: item.disabled ? "var(--text-tertiary)" : "var(--accent)",
                    opacity: item.disabled ? 0.4 : 1,
                    cursor: item.disabled ? "default" : "pointer",
                    borderTop:
                      i === 0 ? "none" : "0.5px solid var(--border-subtle)",
                  }}
                >
                  {/* Keyboard shortcuts are desktop-only affordances */}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full text-center py-3 text-[17px] font-semibold rounded-2xl min-h-[44px] window-glass"
              style={{ color: "var(--accent)", boxShadow: "var(--dropdown-shadow)" }}
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>,
      document.body
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -3 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -3 }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
      className="absolute top-full left-0 mt-0.5 min-w-[180px] py-1 rounded-lg z-[10000]"
      style={{
        background: "var(--bg-window)",
        border: "0.5px solid var(--border-hover)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        boxShadow: "var(--dropdown-shadow)",
      }}
    >
      {items.map((item, i) => {
        if (item.separator) {
          return (
            <div
              key={i}
              className="mx-2 my-1 h-px"
              style={{ background: "var(--border-subtle)" }}
            />
          );
        }

        return (
          <button
            key={i}
            onClick={() => {
              if (!item.disabled && item.onClick) item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className="text-left px-2 py-[3px] text-[13px] transition-colors duration-75 flex items-center gap-2 rounded select-none"
            style={{
              margin: "0 4px",
              width: "calc(100% - 8px)",
              color: item.disabled ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: item.disabled ? "default" : "pointer",
              opacity: item.disabled ? 0.35 : 1,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = "#0066FF";
                e.currentTarget.style.color = "#ffffff";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = item.disabled
                ? "var(--text-tertiary)"
                : "var(--text-primary)";
            }}
          >
            <span className="flex-1 truncate">{item.label}</span>
            {item.shortcut && (
              <span
                className="text-[11px] tracking-wide"
                style={{ opacity: 0.65 }}
              >
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </motion.div>
  );
}
