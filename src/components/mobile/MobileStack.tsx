"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/Icon";

/**
 * iOS-style push/pop page container for mobile app layouts.
 * Renders one page at a time (keyed by pageKey); direction is derived from
 * the depth delta, so pushing slides in from the right and popping slides back.
 */
export function MobileStack({
  pageKey,
  depth,
  children,
}: {
  pageKey: string;
  depth: number;
  children: React.ReactNode;
}) {
  // Derived state adjusted during render (React-endorsed pattern) so the
  // slide direction is correct on the very render where the page changes.
  const [nav, setNav] = useState({ depth, dir: 1 });
  if (nav.depth !== depth) {
    setNav({ depth, dir: depth > nav.depth ? 1 : -1 });
  }
  const dir = nav.depth !== depth ? (depth > nav.depth ? 1 : -1) : nav.dir;

  return (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={pageKey}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? "100%" : "-30%" }),
            center: { x: 0 },
            exit: (d: number) => ({ x: d > 0 ? "-30%" : "100%" }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="absolute inset-0 flex flex-col min-h-0"
          style={{ background: "var(--bg-app)" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** iOS-style navigation sub-header with a back chevron. */
export function MobileBackHeader({
  label,
  onBack,
  title,
  trailing,
}: {
  label: string;
  onBack: () => void;
  title?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className="relative h-11 flex-shrink-0 flex items-center px-1 border-b"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-0.5 min-h-11 pr-3 pl-1 text-[16px]"
        style={{ color: "var(--accent)" }}
      >
        <Icon name="ChevronLeft" size={22} />
        <span>{label}</span>
      </button>
      {title && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold truncate max-w-[50%]"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </div>
      )}
      <div className="flex-1" />
      {trailing}
    </div>
  );
}
