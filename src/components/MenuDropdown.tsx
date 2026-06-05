"use client";

import { useRef, useEffect } from "react";
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
}

export default function MenuDropdown({ items, onClose }: MenuDropdownProps) {
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
