"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import Window from "@/components/desktop/Window";
import DesktopIcon from "@/components/desktop/DesktopIcon";
import Dock from "@/components/dock/Dock";
import Finder from "@/components/apps/Finder";
import Mail from "@/components/apps/Mail";
import Notes from "@/components/apps/Notes";
import Photos from "@/components/apps/Photos";
import Music from "@/components/apps/Music";
import Terminal from "@/components/apps/Terminal";
import LumonaERP from "@/components/apps/LumonaERP";
import DigitalInvitation from "@/components/apps/DigitalInvitation";
import AppLauncher from "@/components/apps/AppLauncher";
import NotionViewer from "@/components/apps/NotionViewer";
import Readme from "@/components/apps/Readme";
import Wife from "@/components/apps/Wife";
import CV from "@/components/apps/CV";
import { Icon } from "@/components/Icon";
import { desktopItems, studyCases } from "@/lib/data";
import { WindowState } from "@/lib/types";

const APP_CONFIGS: Record<string, { title: string; icon: string; color: string; width: number; height: number; component: React.FC<any> }> = {
  // Desktop items
  readme: { title: "README.txt", icon: "FileText", color: "#6b7280", width: 520, height: 640, component: Readme },
  wife: { title: "wife", icon: "Heart", color: "#ec4899", width: 520, height: 640, component: Wife },
  cv: { title: "CV.pdf", icon: "FileText", color: "#ef4444", width: 640, height: 720, component: CV },
  "lumona-case": { title: "Lumona ERP", icon: "Box", color: "#3b82f6", width: 720, height: 640, component: () => {
    const study = studyCases.find((s) => s.id === "lumona-case");
    if (!study) return null;
    return <NotionViewer studyCase={study} />;
  }},
  "siti-case": { title: "Siti Khadija", icon: "Heart", color: "#10b981", width: 720, height: 640, component: () => {
    const study = studyCases.find((s) => s.id === "siti-case");
    if (!study) return null;
    return <NotionViewer studyCase={study} />;
  }},
  "invitation-case": { title: "Digital Invitation", icon: "Mail", color: "#d4a574", width: 720, height: 640, component: () => {
    const study = studyCases.find((s) => s.id === "invitation-case");
    if (!study) return null;
    return <NotionViewer studyCase={study} />;
  }},
  // Dock apps
  finder: { title: "Finder", icon: "FolderOpen", color: "#60a5fa", width: 640, height: 440, component: Finder },
  mail: { title: "Mail", icon: "Mail", color: "#3b82f6", width: 560, height: 540, component: Mail },
  notes: { title: "Notes", icon: "StickyNote", color: "#f59e0b", width: 700, height: 480, component: Notes },
  photos: { title: "Photos", icon: "Image", color: "#a78bfa", width: 640, height: 480, component: Photos },
  music: { title: "Music", icon: "Music", color: "#ff2d55", width: 800, height: 520, component: Music },
  terminal: { title: "Terminal", icon: "Terminal", color: "#1f2937", width: 600, height: 420, component: Terminal },
  lumona: { title: "Lumona ERP", icon: "Box", color: "#3b82f6", width: 720, height: 520, component: LumonaERP },
  invitation: { title: "Digital Invitation", icon: "Mail", color: "#d4a574", width: 640, height: 520, component: DigitalInvitation },
  apps: { title: "Spotlight", icon: "Search", color: "#6b7280", width: 640, height: 520, component: AppLauncher },
};

const DOCK_ITEMS = [
  { id: "finder", name: "Finder", icon: "FolderOpen", color: "#60a5fa" },
  { id: "mail", name: "Mail", icon: "Mail", color: "#3b82f6" },
  { id: "notes", name: "Notes", icon: "StickyNote", color: "#f59e0b" },
  { id: "photos", name: "Photos", icon: "Image", color: "#a78bfa" },
  { id: "music", name: "Music", icon: "Music", color: "#ff2d55" },
  { id: "terminal", name: "Terminal", icon: "Terminal", color: "#1f2937" },
  { id: "separator", name: "", icon: "", color: "", isSeparator: true },
  { id: "lumona", name: "Lumona ERP", icon: "Box", color: "#3b82f6" },
  { id: "invitation", name: "Digital Invitation", icon: "Mail", color: "#d4a574" },
  { id: "apps", name: "Spotlight", icon: "Search", color: "#6b7280" },
];

function getDefaultPosition(appId: string, index: number, isMobile: boolean): { x: number; y: number } {
  if (isMobile) {
    return { x: 10, y: 40 + index * 10 };
  }
  const defaults: Record<string, { x: number; y: number }> = {
    finder: { x: 100, y: 50 },
    mail: { x: 140, y: 70 },
    notes: { x: 80, y: 40 },
    photos: { x: 120, y: 60 },
    music: { x: 160, y: 80 },
    terminal: { x: 200, y: 100 },
    lumona: { x: 60, y: 40 },
    invitation: { x: 100, y: 60 },
    apps: { x: 140, y: 80 },
  };
  const base = defaults[appId] || { x: 100 + index * 30, y: 80 + index * 20 };
  return {
    x: base.x + (index % 3) * 20,
    y: base.y + Math.floor(index / 3) * 20,
  };
}

export default function Home() {
  const { theme, toggle } = useTheme();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [isMobile, setIsMobile] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener("resize", checkMobile);
      clearInterval(interval);
    };
  }, []);

  const focusWindow = useCallback(
    (id: string) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w))
      );
      setNextZIndex((z) => z + 1);
    },
    [nextZIndex]
  );

  const openApp = useCallback(
    (appId: string) => {
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        if (existing.isMinimized) {
          setWindows((prev) =>
            prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w))
          );
          setNextZIndex((z) => z + 1);
        } else {
          focusWindow(existing.id);
        }
        return;
      }

      const config = APP_CONFIGS[appId];
      if (!config) return;

      const pos = getDefaultPosition(appId, windows.length, isMobile);
      const width = isMobile ? window.innerWidth - 20 : config.width;
      const height = isMobile ? window.innerHeight - 100 : config.height;
      const isSpotlight = appId === "apps";
      const newWindow: WindowState = {
        id: `win-${Date.now()}-${Math.random()}`,
        appId,
        title: config.title,
        x: isSpotlight ? (window.innerWidth - width) / 2 : pos.x,
        y: isSpotlight ? Math.max(60, (window.innerHeight - height) / 4) : pos.y,
        width,
        height,
        zIndex: nextZIndex,
        isMinimized: false,
        isMaximized: false,
      };

      setWindows((prev) => [...prev, newWindow]);
      setNextZIndex((z) => z + 1);
    },
    [windows, nextZIndex, isMobile, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  }, []);

  const dockItemsWithState = DOCK_ITEMS.map((item) => ({
    ...item,
    isOpen: windows.some((w) => w.appId === item.id && !w.isMinimized),
  }));

  const isDark = theme === "dark";

  return (
    <div
      className="h-full w-full relative desktop-bg overflow-hidden"
    >
      {/* Menu Bar */}
      <div
        className="h-7 backdrop-blur-xl border-b flex items-center px-4 text-xs fixed top-0 left-0 right-0 z-[9999] transition-colors duration-300"
        style={{
          background: "var(--menubar-bg)",
          borderColor: "var(--border-subtle)",
          color: "var(--menubar-text)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide" style={{ color: "var(--menubar-text)" }}>
            rafifthi
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3" style={{ color: "var(--menubar-text)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className="hover:opacity-80 transition-opacity"
            title="Toggle theme"
          >
            <Icon name={isDark ? "Moon" : "Sun"} size={13} />
          </button>
          <span className="hidden sm:inline opacity-80">{date}</span>
          <span className="opacity-90">{time}</span>
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute inset-0 pt-8 pb-20 px-4">
        {desktopItems.map((item) => (
          <DesktopIcon
            key={item.id}
            id={item.id}
            label={item.label}
            image={item.image}
            x={isMobile ? 10 : item.x}
            y={isMobile ? item.y * 0.5 + 8 : item.y}
            width={isMobile ? 100 : item.width}
            onOpen={() => openApp(item.appId)}
          />
        ))}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((win) => {
          const config = APP_CONFIGS[win.appId];
          if (!config || win.isMinimized) return null;
          const AppComponent = config.component;

          return (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              zIndex={win.zIndex}
              onFocus={() => focusWindow(win.id)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              icon={config.icon}
            >
              <AppComponent
                windowId={win.id}
                onClose={() => closeWindow(win.id)}
                onOpenApp={openApp}
              />
            </Window>
          );
        })}
      </AnimatePresence>

      {/* Bottom Gaussian Blur near dock */}
      <div className="bottom-blur" />

      {/* Dock */}
      <Dock
        items={dockItemsWithState}
        onOpenApp={openApp}
        isVertical={isMobile}
        theme={theme}
      />
    </div>
  );
}
