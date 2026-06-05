"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";

interface DockItemDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSeparator?: boolean;
  isOpen?: boolean;
}

interface DockProps {
  items: DockItemDef[];
  onOpenApp: (appId: string) => void;
  isVertical?: boolean;
  theme?: "dark" | "light";
}

function getDockIconSrc(id: string, theme: "dark" | "light") {
  const map: Record<string, string> = {
    finder: "/dock/finder.png",
    mail: "/dock/email.png",
    music: "/dock/music.png",
    terminal: "/dock/terminal.png",
    linkedin: "/dock/linkedin.png",
    twitter: "/dock/X.png",
    instagram: "/dock/instagram.png",
  };
  if (id === "notes") return theme === "dark" ? "/dock/notes-dark.png" : "/dock/notes-light.png";
  if (id === "photos") return theme === "dark" ? "/dock/photos-dark.png" : "/dock/photos-light.png";
  if (id === "github") return theme === "dark" ? "/dock/github-dark.png" : "/dock/github-light.png";
  if (id === "lumona") return theme === "dark" ? "/dock/lumona-dark.png" : "/dock/lumona-light.png";
  if (id === "invitation") return "/dock/digital-invitation.png";
  if (id === "apps") return "/dock/spotlight.png";
  return map[id] || null;
}

function DockIcon({ item, isVertical, theme }: { item: DockItemDef; isVertical: boolean; theme: "dark" | "light" }) {
  const size = isVertical ? 44 : 52;
  const src = getDockIconSrc(item.id, theme);

  if (src) {
    return (
      <img
        src={src}
        alt={item.name}
        className="rounded-xl shadow-md object-cover"
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }

  // Fallback for apps without custom assets
  const fallbackColors: Record<string, string> = {
    lumona: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    invitation: "linear-gradient(135deg, #d4a574 0%, #b8855a 100%)",
    apps: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  };

  return (
    <div
      className="rounded-xl flex items-center justify-center shadow-md"
      style={{ width: size, height: size, background: fallbackColors[item.id] || item.color || "#6b7280" }}
    >
      <Icon name={item.icon || "Box"} size={22} className="text-white" />
    </div>
  );
}

function DockItemComponent({
  item,
  onOpen,
  isVertical,
  theme,
}: {
  item: DockItemDef;
  onOpen: () => void;
  isVertical: boolean;
  theme: "dark" | "light";
}) {
  const [hovered, setHovered] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  if (item.isSeparator) {
    return (
      <div
        className="rounded-full transition-colors duration-300"
        style={{
          width: isVertical ? 28 : 1,
          height: isVertical ? 1 : 28,
          margin: isVertical ? "0 4px" : "4px 0",
          background: "var(--border-hover)",
        }}
      />
    );
  }

  const handleClick = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 400);
    onOpen();
  };

  return (
    <motion.button
      id={`dock-${item.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={`relative flex items-center justify-center ${
        bouncing ? "dock-bounce" : ""
      }`}
      whileHover={{ scale: 1.15, y: isVertical ? 0 : -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <DockIcon item={item} isVertical={isVertical} theme={theme} />

      {item.isOpen && (
        <div
          className={`absolute rounded-full bg-white/70 ${
            isVertical
              ? "right-0 top-1/2 -translate-y-1/2 w-1 h-1"
              : "bottom-0 left-1/2 -translate-x-1/2 w-1 h-1"
          }`}
        />
      )}

      {hovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: isVertical ? 0 : 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
          className={`absolute px-2.5 py-1 rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg text-xs ${
            isVertical ? "left-full ml-2" : "bottom-full mb-2"
          }`}
          style={{
            background: "var(--bg-window)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
            backdropFilter: "blur(12px)",
          }}
        >
          {item.name}
        </motion.div>
      )}
    </motion.button>
  );
}

export default function Dock({ items, onOpenApp, isVertical, theme = "dark" }: DockProps) {
  return (
    <div
      id="tour-dock"
      className={`dock-glass flex items-center ${
        isVertical
          ? "flex-col py-3 px-2 rounded-2xl fixed left-3 top-1/2 -translate-y-1/2 z-50 gap-2.5"
          : "flex-row px-3 py-2.5 rounded-2xl fixed bottom-4 left-1/2 -translate-x-1/2 z-50 gap-2.5"
      }`}
    >
      {items.map((item) => (
        <DockItemComponent
          key={item.id}
          item={item}
          onOpen={() => onOpenApp(item.id)}
          isVertical={isVertical || false}
          theme={theme}
        />
      ))}
    </div>
  );
}
