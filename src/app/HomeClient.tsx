"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import Readme from "@/components/apps/Readme";
import AboutRafif from "@/components/apps/AboutRafif";
import Wife from "@/components/apps/Wife";
import CV from "@/components/apps/CV";
import MenuDropdown from "@/components/MenuDropdown";
import Onboarding from "@/components/Onboarding";
import BootScreen from "@/components/BootScreen";
import Settings from "@/components/apps/Settings";
import StructuredCaseViewer from "@/components/apps/StructuredCaseViewer";
import { Icon } from "@/components/Icon";
import { desktopItems } from "@/lib/data";
import { DesktopItem, WindowState } from "@/lib/types";
import { AboutData, browserImageUrl, CmsEntry, NoteData, PortfolioEntryData, WifeData } from "@/lib/cms";
import { fallbackAboutData, fallbackWifeData } from "@/lib/profile-content";

interface AppComponentProps {
  windowId: string;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  finderItems?: DesktopItem[];
  initialNoteEntries?: CmsEntry<NoteData>[];
  aboutData?: AboutData;
  wifeData?: WifeData;
  isMaximized?: boolean;
  isMobile?: boolean;
}

interface AppConfig {
  title: string;
  icon: string;
  color: string;
  width: number;
  height: number;
  component: React.ComponentType<AppComponentProps>;
}

const APP_CONFIGS: Record<string, AppConfig> = {
  // Desktop items
  readme: { title: "README.txt", icon: "FileText", color: "#6b7280", width: 520, height: 640, component: Readme },
  wife: { title: "wife", icon: "Heart", color: "#ec4899", width: 520, height: 640, component: Wife },
  cv: { title: "CV.pdf", icon: "FileText", color: "#ef4444", width: 640, height: 720, component: CV },
  // Dock apps
  finder: { title: "Finder", icon: "FolderOpen", color: "#60a5fa", width: 640, height: 440, component: Finder },
  mail: { title: "Mail", icon: "Mail", color: "#3b82f6", width: 560, height: 540, component: Mail },
  notes: { title: "Notes", icon: "StickyNote", color: "#f59e0b", width: 980, height: 620, component: Notes },
  photos: { title: "Photos", icon: "Image", color: "#a78bfa", width: 640, height: 480, component: Photos },
  music: { title: "Music", icon: "Music", color: "#ff2d55", width: 800, height: 520, component: Music },
  terminal: { title: "Terminal", icon: "Terminal", color: "#1f2937", width: 600, height: 420, component: Terminal },
  lumona: { title: "Lumona ERP", icon: "Box", color: "#3b82f6", width: 720, height: 520, component: LumonaERP },
  invitation: { title: "Digital Invitation", icon: "Mail", color: "#d4a574", width: 640, height: 520, component: DigitalInvitation },
  apps: { title: "Spotlight", icon: "/dock/spotlight.png", color: "#6b7280", width: 640, height: 520, component: AppLauncher },
  settings: { title: "Settings", icon: "Settings", color: "#6b7280", width: 680, height: 540, component: Settings },
  about: { title: "About Rafif", icon: "User", color: "#3b82f6", width: 560, height: 600, component: AboutRafif },
};

const DOCK_ITEMS = [
  { id: "finder", name: "Finder", icon: "FolderOpen", color: "#60a5fa" },
  { id: "mail", name: "Mail", icon: "Mail", color: "#3b82f6" },
  { id: "notes", name: "Notes", icon: "StickyNote", color: "#f59e0b" },
  { id: "photos", name: "Photos", icon: "Image", color: "#a78bfa" },
  { id: "music", name: "Music", icon: "Music", color: "#ff2d55" },
  { id: "terminal", name: "Terminal", icon: "Terminal", color: "#1f2937" },
  { id: "separator", name: "", icon: "", color: "", isSeparator: true },
  { id: "apps", name: "Spotlight", icon: "Search", color: "#6b7280" },
];

interface HomeClientProps {
  initialPortfolioEntries: CmsEntry<PortfolioEntryData>[];
  initialNoteEntries: CmsEntry<NoteData>[];
  initialAboutEntry: CmsEntry<AboutData> | null;
  initialWifeEntry: CmsEntry<WifeData> | null;
}

export default function HomeClient({
  initialPortfolioEntries,
  initialNoteEntries,
  initialAboutEntry,
  initialWifeEntry,
}: HomeClientProps) {
  const { theme, toggle, wallpaper } = useTheme();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [isMobile, setIsMobile] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const portfolioEntries = initialPortfolioEntries;
  const aboutData = useMemo<AboutData>(() => ({
    ...fallbackAboutData,
    ...initialAboutEntry?.data,
    desktop: { ...fallbackAboutData.desktop, ...initialAboutEntry?.data.desktop },
  }), [initialAboutEntry]);
  const wifeData = useMemo<WifeData>(() => ({
    ...fallbackWifeData,
    ...initialWifeEntry?.data,
    desktop: { ...fallbackWifeData.desktop, ...initialWifeEntry?.data.desktop },
  }), [initialWifeEntry]);
  // "pending" on both server and first client render (no hydration mismatch);
  // resolved to "booting" (first visit) or "done" (returning) in an effect.
  const [bootStatus, setBootStatus] = useState<"pending" | "booting" | "done">("pending");

  useEffect(() => {
    const booted = localStorage.getItem("portfolio-boot-completed");
    // Deliberate setState-in-effect: localStorage is client-only, so the state
    // must start as "pending" on the server and resolve after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBootStatus(booted ? "done" : "booting");
  }, []);

  const handleBootComplete = useCallback(() => {
    // Always persist, including the slow-connection cap path, so a visitor is
    // never re-trapped in the boot screen.
    localStorage.setItem("portfolio-boot-completed", "true");
    setBootStatus("done");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const syncMobile = () => setIsMobile(mq.matches);
    syncMobile();
    mq.addEventListener("change", syncMobile);

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      mq.removeEventListener("change", syncMobile);
      clearInterval(interval);
    };
  }, []);

  const cmsDesktopItems = useMemo(
    () =>
      portfolioEntries.map((entry, index) => {
        const desktop = entry.data.desktop;
        // Older CMS seeds put TDN directly below README. Move only that legacy
        // coordinate pair so existing custom placements remain untouched.
        const usesLegacyTdnPosition = entry.slug === "tdn-case" && desktop?.x === 80 && desktop?.y === 14;
        const position = usesLegacyTdnPosition ? { x: 76, y: 42 } : desktop;
        return {
          id: `cms-desktop-${entry.id}`,
          label: desktop?.label || entry.title,
          finderLabel: entry.data.title || entry.title,
          finderIcon: entry.data.finderIcon ? browserImageUrl(entry.data.finderIcon) : undefined,
          image: browserImageUrl(desktop?.image || entry.data.banner || "/placeholders/portfolio-thumb.svg"),
          x: Number.isFinite(position?.x) ? position.x : 10 + index * 8,
          y: Number.isFinite(position?.y) ? position.y : 28 + index * 6,
          width: Number.isFinite(desktop?.width) ? desktop.width : 170,
          appId: `cms-portfolio:${entry.id}`,
        };
      }),
    [portfolioEntries]
  );

  const profileDesktopItems = useMemo<DesktopItem[]>(
    () => [
      ...(aboutData.desktop.image
        ? [{
            id: "about",
            label: aboutData.desktop.label || aboutData.title,
            finderLabel: aboutData.title,
            finderIcon: aboutData.finderIcon ? browserImageUrl(aboutData.finderIcon) : undefined,
            image: browserImageUrl(aboutData.desktop.image),
            x: aboutData.desktop.x,
            y: aboutData.desktop.y,
            width: aboutData.desktop.width,
            appId: "about",
          }]
        : []),
      {
        id: "wife",
        label: wifeData.desktop.label || wifeData.name,
        finderLabel: wifeData.name,
        finderIcon: wifeData.finderIcon ? browserImageUrl(wifeData.finderIcon) : undefined,
        image: browserImageUrl(wifeData.desktop.image || wifeData.photo),
        x: wifeData.desktop.x,
        y: wifeData.desktop.y,
        width: wifeData.desktop.width,
        appId: "wife",
      },
    ].filter((item) => item.image),
    [aboutData, wifeData]
  );

  const allDesktopItems = useMemo(
    () => [...desktopItems, ...profileDesktopItems, ...cmsDesktopItems],
    [cmsDesktopItems, profileDesktopItems]
  );

  const getAppConfig = useCallback(
    (appId: string) => {
      if (appId.startsWith("cms-portfolio:")) {
        const entryId = appId.replace("cms-portfolio:", "");
        const entry = portfolioEntries.find((item) => item.id === entryId);
        if (!entry) return null;
        const desktop = entry.data.desktop;
        return {
          title: entry.data.title || entry.title,
          icon: desktop?.icon || "BriefcaseBusiness",
          color: desktop?.color || "#3b82f6",
          width: 720,
          height: 640,
          component: () => <StructuredCaseViewer entry={entry} />,
        };
      }

      if (appId === "about") {
        return {
          ...APP_CONFIGS.about,
          title: aboutData.title,
          icon: aboutData.desktop.image || aboutData.desktop.icon || APP_CONFIGS.about.icon,
          color: aboutData.desktop.color || APP_CONFIGS.about.color,
        };
      }

      if (appId === "wife") {
        return {
          ...APP_CONFIGS.wife,
          title: wifeData.name,
          icon: wifeData.desktop.image || wifeData.desktop.icon || APP_CONFIGS.wife.icon,
          color: wifeData.desktop.color || APP_CONFIGS.wife.color,
        };
      }

      return APP_CONFIGS[appId] || null;
    },
    [aboutData, portfolioEntries, wifeData]
  );

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

      const config = getAppConfig(appId);
      if (!config) return;

      // Always store desktop geometry — the mobile sheet ignores x/y/w/h,
      // so windows opened on mobile still restore correctly on desktop.
      const width = config.width;
      const height = config.height;

      const TOPBAR_H = 28;
      const centerX = Math.max(20, (window.innerWidth - width) / 2);
      const centerY = Math.max(TOPBAR_H + 12, (window.innerHeight - height) / 3);

      let posX: number, posY: number;

      if (appId === "apps") {
        // Spotlight always dead center
        posX = (window.innerWidth - width) / 2;
        posY = Math.max(60, (window.innerHeight - height) / 4);
      } else if (windows.length === 0) {
        // First window: centered
        posX = centerX;
        posY = centerY;
      } else {
        // Cascade: offset from center so title bars stay visible
        const visibleWindows = windows.filter((w) => !w.isMinimized);
        const step = 44;
        const maxCascade = 280;
        const cascade = Math.min(visibleWindows.length * step, maxCascade);
        posX = centerX + cascade;
        posY = centerY + cascade / 2;
        // Clamp within viewport bounds
        const maxX = Math.max(window.innerWidth - width - 20, centerX);
        const maxY = Math.max(window.innerHeight - height - 80, centerY);
        posX = Math.min(Math.max(posX, 20), maxX);
        posY = Math.min(Math.max(posY, 40), maxY);
      }

      const newWindow: WindowState = {
        id: `win-${Date.now()}-${Math.random()}`,
        appId,
        title: config.title,
        x: posX,
        y: posY,
        width,
        height,
        zIndex: nextZIndex,
        isMinimized: false,
        isMaximized: false,
      };

      setWindows((prev) => [...prev, newWindow]);
      setNextZIndex((z) => z + 1);
    },
    [windows, nextZIndex, focusWindow, getAppConfig]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  // Escape to close topmost window
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWindows((prev) => {
          if (prev.length === 0) return prev;
          const topmost = prev.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
          return prev.filter((w) => w.id !== topmost.id);
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const dockItemsWithState = DOCK_ITEMS.map((item) => ({
    ...item,
    isOpen: windows.some((w) => w.appId === item.id && !w.isMinimized),
  }));

  const isDark = theme === "dark";

  const MENU_ITEMS = [
    {
      id: "rafif",
      label: "rafifthi",
      items: [
        { label: "About Rafif", action: () => openApp("about") },
        { label: "Contact", action: () => openApp("mail") },
        { separator: true },
        { label: "Settings", action: () => openApp("settings"), shortcut: "⌘," },
      ],
    },
    {
      id: "file",
      label: "File",
      items: [{ label: "Download CV", action: () => {} }],
    },
    {
      id: "help",
      label: "Help",
      items: [
        { label: "Start Tour", action: () => { (window as Window & { __restartTour?: () => void }).__restartTour?.(); } },
        { separator: true },
        { label: "Keyboard Shortcuts", disabled: true },
      ],
    },
  ];

  const toDropdownItems = (
    items: { label?: string; action?: () => void; disabled?: boolean; separator?: boolean; shortcut?: string }[]
  ) =>
    items.map((item) => ({
      label: item.label,
      onClick: item.action,
      disabled: item.disabled,
      separator: item.separator,
      shortcut: item.shortcut,
    }));

  const logoSrc =
    wallpaper === "/wallpaper/ascii-magic-1.gif"
      ? "/logo/blue-logo.svg"
      : wallpaper === "/wallpaper/ascii-magic-3.gif"
      ? "/logo/green-logo.svg"
      : theme === "light"
      ? "/logo/neutral-light-logo.svg"
      : "/logo/neutral-dark-logo.svg";

  const visibleWindows = windows.filter((w) => !w.isMinimized);
  const topWindow = visibleWindows.length
    ? visibleWindows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
    : null;

  return (
    <div
      className={`h-full w-full relative overflow-hidden${wallpaper ? "" : " desktop-bg"}`}
      style={
        wallpaper
          ? { backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {/* Menu Bar — macOS menu bar on desktop, iOS status bar on mobile */}
      <div
        className={`backdrop-blur-xl border-b flex items-center fixed top-0 left-0 right-0 z-[9999] transition-colors duration-300 ${
          isMobile ? "px-5" : "h-7 px-3 text-xs"
        }`}
        style={{
          background: "var(--menubar-bg)",
          borderColor: "var(--border-subtle)",
          color: "var(--menubar-text)",
          ...(isMobile
            ? {
                height: "calc(2.75rem + env(safe-area-inset-top))",
                paddingTop: "env(safe-area-inset-top)",
              }
            : undefined),
        }}
      >
        {isMobile ? (
          <>
            {/* iOS status bar: time left, logo (menu) + theme right */}
            <span className="text-[15px] font-semibold tracking-tight opacity-95">
              {time}
            </span>
            <div className="flex-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === "rafif" ? null : "rafif");
              }}
              className="flex items-center justify-center min-w-11 min-h-11"
              aria-label="Open menu"
            >
              <img src={logoSrc} alt="Logo" className="w-5 h-5" draggable={false} />
            </button>
            <button
              id="tour-theme-toggle"
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              className="flex items-center justify-center min-w-11 min-h-11 -mr-2"
              title="Toggle theme"
            >
              <Icon name={isDark ? "Moon" : "Sun"} size={16} />
            </button>
            <AnimatePresence>
              {activeMenu === "rafif" && (
                <MenuDropdown
                  items={toDropdownItems(MENU_ITEMS[0].items)}
                  onClose={() => setActiveMenu(null)}
                  isMobile
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Logo */}
            <img
              src={logoSrc}
              alt="Logo"
              className="w-4 h-4 flex-shrink-0 mr-2"
              draggable={false}
            />

            {/* Menu items */}
            <div className="flex items-center gap-0.5">
              {MENU_ITEMS.map((menu) => (
                <div key={menu.id} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (menu.items) {
                        setActiveMenu(activeMenu === menu.id ? null : menu.id);
                      }
                    }}
                    className={`px-2 py-0.5 rounded transition-colors duration-150 ${
                      menu.id === "rafif" ? "font-bold" : "font-normal"
                    }`}
                    style={{
                      background: activeMenu === menu.id ? "var(--bg-hover)" : "transparent",
                      color: "var(--menubar-text)",
                    }}
                    onMouseEnter={(e) => {
                      if (activeMenu !== menu.id) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (activeMenu !== menu.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {menu.label}
                  </button>

                  <AnimatePresence>
                    {activeMenu === menu.id && menu.items && (
                      <MenuDropdown
                        items={toDropdownItems(menu.items)}
                        onClose={() => setActiveMenu(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="flex-1" />
            <div className="flex items-center gap-3" style={{ color: "var(--menubar-text)" }}>
              <button
                id="tour-theme-toggle"
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                className="hover:opacity-80 transition-opacity"
                title="Toggle theme"
              >
                <Icon name={isDark ? "Moon" : "Sun"} size={13} />
              </button>
              <span className="hidden sm:inline opacity-80">{date}</span>
              <span className="opacity-90">{time}</span>
            </div>
          </>
        )}
      </div>

      {/* Desktop Icons */}
      <div
        id="tour-desktop-area"
        className={`absolute inset-0 px-4 ${isMobile ? "pt-16 pb-28" : "pt-8 pb-20"}`}
      >
        {allDesktopItems.map((item, i) => (
          <DesktopIcon
            key={item.id}
            id={item.id}
            label={item.label}
            image={item.image}
            x={isMobile ? (i % 2 === 0 ? 8 : 56) : item.x}
            y={isMobile ? Math.floor(i / 2) * 17 + 10 : item.y}
            width={isMobile ? 96 : item.width}
            onOpen={() => openApp(item.appId)}
            compact={isMobile}
          />
        ))}
      </div>

      {/* Shared sheet backdrop (mobile) — single dim layer under all sheets */}
      <AnimatePresence>
        {isMobile && topWindow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => closeWindow(topWindow.id)}
            className="fixed inset-0"
            style={{ zIndex: 90, background: "rgba(0, 0, 0, 0.4)" }}
          />
        )}
      </AnimatePresence>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((win) => {
          const config = getAppConfig(win.appId);
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
              isMaximized={win.isMaximized}
              onFocus={() => focusWindow(win.id)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              onMaximize={() => maximizeWindow(win.id)}
              icon={config.icon}
              isMobile={isMobile}
              isTop={topWindow?.id === win.id}
            >
              <AppComponent
                windowId={win.id}
                onClose={() => closeWindow(win.id)}
                onOpenApp={openApp}
                finderItems={allDesktopItems}
                initialNoteEntries={initialNoteEntries}
                aboutData={aboutData}
                wifeData={wifeData}
                isMaximized={win.isMaximized}
                isMobile={isMobile}
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
        isMobile={isMobile}
        theme={theme}
      />

      {/* Onboarding Tour — mounts only after boot so its 1s timer starts post-fade */}
      {bootStatus === "done" && <Onboarding />}

      {/* Retro boot screen (first visit only) */}
      {bootStatus === "pending" && (
        <div
          aria-hidden
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#050508" }}
        />
      )}
      {/* BootScreen fades itself out before calling onComplete, so a plain
          conditional unmount is safe here (no AnimatePresence needed). */}
      {bootStatus === "booting" && <BootScreen onComplete={handleBootComplete} />}
    </div>
  );
}
