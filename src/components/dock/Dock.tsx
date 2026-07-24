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
  isMobile?: boolean;
  theme?: "dark" | "light";
}

function getDockIconSrc(id: string, theme: "dark" | "light") {
  const map: Record<string, string> = {
    finder: "/dock/finder.png",
    mail: "/dock/email.png",
    music: "/dock/music.png",
    terminal: "/dock/terminal.png",
    netflix: "/dock/netflix.svg",
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

function DockIcon({ item, isMobile, theme }: { item: DockItemDef; isMobile: boolean; theme: "dark" | "light" }) {
  const size = isMobile ? 48 : 52;
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
  isMobile,
  theme,
}: {
  item: DockItemDef;
  onOpen: () => void;
  isMobile: boolean;
  theme: "dark" | "light";
}) {
  const [hovered, setHovered] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  if (item.isSeparator) {
    return (
      <div
        className="rounded-full transition-colors duration-300 flex-shrink-0"
        style={{
          width: 1,
          height: 28,
          margin: "4px 0",
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
      className={`relative flex items-center justify-center flex-shrink-0 ${
        bouncing && !isMobile ? "dock-bounce" : ""
      }`}
      whileHover={isMobile ? undefined : { scale: 1.15, y: -10 }}
      whileTap={isMobile ? { scale: 0.85 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <DockIcon item={item} isMobile={isMobile} theme={theme} />

      {item.isOpen && (
        <div
          className="absolute rounded-full bg-white/70 bottom-0 left-1/2 -translate-x-1/2 w-1 h-1"
        />
      )}

      {hovered && !isMobile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
          className="absolute px-2.5 py-1 rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg text-xs bottom-full mb-2"
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

export default function Dock({ items, onOpenApp, isMobile = false, theme = "dark" }: DockProps) {
  // iOS docks have no separators
  const visibleItems = isMobile ? items.filter((i) => !i.isSeparator) : items;

  return (
    <div
      id="tour-dock"
      className={`dock-glass fixed z-50 ${
        isMobile
          ? "bottom-0 left-0 right-0 px-3 pt-2.5 rounded-t-3xl overflow-x-auto no-scrollbar"
          : "bottom-4 left-1/2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 px-3 py-2.5 rounded-2xl"
      }`}
      style={
        isMobile
          ? { paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }
          : undefined
      }
    >
      {/* w-max + mx-auto centers the icons when they fit, scrolls when they don't */}
      <div className={`flex w-max items-center ${isMobile ? "gap-3 mx-auto" : "gap-2.5"}`}>
        {visibleItems.map((item) => (
          <DockItemComponent
            key={item.id}
            item={item}
            onOpen={() => onOpenApp(item.id)}
            isMobile={isMobile}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}
