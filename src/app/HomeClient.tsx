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
import Netflix from "@/components/apps/Netflix";
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
import { DesktopItem, WindowState } from "@/lib/types";
import {
  buildDesktopLayout,
  DESKTOP_DEFAULT_ICON_WIDTH,
  estimateImageHeight,
  layoutBreakpointQueries,
  MOBILE_ICON_WIDTH,
  normalizeLayoutOverlay,
  resolveDesktopItemLayout,
  resolveLayoutBreakpoint,
  type DesktopLayoutData,
  type LayoutBreakpoint,
  type LayoutViewport,
} from "@/lib/desktop-layout";
import { AboutData, CmsEntry, NetflixTitleData, NoteData, PortfolioEntryData, WifeData } from "@/lib/cms";
import {
  aboutDesktopItem,
  portfolioDesktopItem,
  staticDesktopItems,
  wifeDesktopItem,
} from "@/lib/desktop-items";
import { buildNetflixLists, NetflixTitle } from "@/lib/netflix-data";
import { fallbackAboutData, fallbackWifeData } from "@/lib/profile-content";

interface AppComponentProps {
  windowId: string;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  finderItems?: DesktopItem[];
  initialNoteEntries?: CmsEntry<NoteData>[];
  aboutData?: AboutData;
  wifeData?: WifeData;
  netflixMovies?: NetflixTitle[];
  netflixSeries?: NetflixTitle[];
  netflixMyList?: NetflixTitle[];
  isMaximized?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
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
  netflix: { title: "Netflix", icon: "Play", color: "#E50914", width: 960, height: 600, component: Netflix },
  apps: { title: "Spotlight", icon: "/dock/spotlight.png", color: "#6b7280", width: 640, height: 520, component: AppLauncher },
  settings: { title: "Settings", icon: "Settings", color: "#6b7280", width: 680, height: 540, component: Settings },
  about: { title: "About Rafif", icon: "User", color: "#3b82f6", width: 560, height: 600, component: AboutRafif },
};

/** Reads a `/api/content` list; failures degrade to `null` (static fallbacks). */
async function fetchEntries<TEntry>(url: string): Promise<{ entries?: TEntry[] } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as { entries?: TEntry[] };
  } catch {
    return null;
  }
}

const DOCK_ITEMS = [
  { id: "finder", name: "Finder", icon: "FolderOpen", color: "#60a5fa" },
  { id: "mail", name: "Mail", icon: "Mail", color: "#3b82f6" },
  { id: "notes", name: "Notes", icon: "StickyNote", color: "#f59e0b" },
  { id: "photos", name: "Photos", icon: "Image", color: "#a78bfa" },
  { id: "music", name: "Music", icon: "Music", color: "#ff2d55" },
  { id: "terminal", name: "Terminal", icon: "Terminal", color: "#1f2937" },
  { id: "netflix", name: "Netflix", icon: "Play", color: "#E50914" },
  { id: "separator", name: "", icon: "", color: "", isSeparator: true },
  { id: "apps", name: "Spotlight", icon: "Search", color: "#6b7280" },
];

interface HomeClientProps {
  initialPortfolioEntries: CmsEntry<PortfolioEntryData>[];
  initialNoteEntries: CmsEntry<NoteData>[];
  initialAboutEntry: CmsEntry<AboutData> | null;
  initialWifeEntry: CmsEntry<WifeData> | null;
  initialNetflixEntries: CmsEntry<NetflixTitleData>[];
  /** Published payload of the CMS **Desktop Layout** module (singleton `layout`
   *  entry) — the primary source of icon positions. `null` before the module has
   *  ever been saved. */
  initialLayoutData: DesktopLayoutData | null;
}

export default function HomeClient({
  initialPortfolioEntries,
  initialNoteEntries,
  initialAboutEntry,
  initialWifeEntry,
  initialNetflixEntries,
  initialLayoutData,
}: HomeClientProps) {
  const { theme, toggle, wallpaper } = useTheme();
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  // Layout breakpoint driving desktop icon placement (see desktop-layout.ts).
  // "xl" on the server and the first client render keeps SSR deterministic; the
  // effect below resolves the real breakpoint from matchMedia after hydration.
  const [breakpoint, setBreakpoint] = useState<LayoutBreakpoint>("xl");
  const [viewport, setViewport] = useState<LayoutViewport>({ width: 0, height: 0 });
  // Two-mode flags the window/sheet/dock code already speaks, derived from the
  // breakpoint: base = phones (<640), sm/md = tablets (640–1023).
  const isMobile = breakpoint === "base";
  const isTablet = breakpoint === "sm" || breakpoint === "md";
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [portfolioEntries, setPortfolioEntries] = useState(initialPortfolioEntries);
  const [layoutData, setLayoutData] = useState<DesktopLayoutData | null>(initialLayoutData);
  // CMS Desktop Layout rows — precedence 1 in `buildDesktopLayout`. Validated
  // (clamped, unknown rows dropped) so a bad payload can never break the desktop.
  const layoutOverlay = useMemo(() => normalizeLayoutOverlay(layoutData), [layoutData]);
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
  const netflixLists = useMemo(() => buildNetflixLists(initialNetflixEntries), [initialNetflixEntries]);
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

  useEffect(() => {
    let cancelled = false;
    // Re-read the two modules the desktop is built from, so a CMS save shows up
    // on the next visit without waiting for the server cache to expire.
    const load = async () => {
      const [portfolio, layout] = await Promise.all([
        fetchEntries<CmsEntry<PortfolioEntryData>>("/api/content?type=portfolio"),
        fetchEntries<CmsEntry<DesktopLayoutData>>("/api/content?type=layout"),
      ]);
      if (cancelled) return;
      if (portfolio?.entries?.length) setPortfolioEntries(portfolio.entries);
      const layoutEntry = layout?.entries?.[0];
      if (layoutEntry?.data) setLayoutData(layoutEntry.data);
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBootComplete = useCallback(() => {
    // Always persist, including the slow-connection cap path, so a visitor is
    // never re-trapped in the boot screen.
    localStorage.setItem("portfolio-boot-completed", "true");
    setBootStatus("done");
  }, []);

  useEffect(() => {
    // Desktop icon placement is resolved per breakpoint, against the live
    // viewport. matchMedia drives the breakpoint switches; the resize listener
    // refreshes the viewport for changes that stay inside one breakpoint.
    const mediaQueries = layoutBreakpointQueries().map(({ query }) => window.matchMedia(query));
    const syncLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setBreakpoint(resolveLayoutBreakpoint(width));
      setViewport((current) => (current.width === width && current.height === height ? current : { width, height }));
    };
    syncLayout();
    mediaQueries.forEach((list) => list.addEventListener("change", syncLayout));
    window.addEventListener("resize", syncLayout);

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      mediaQueries.forEach((list) => list.removeEventListener("change", syncLayout));
      window.removeEventListener("resize", syncLayout);
      clearInterval(interval);
    };
  }, []);

  // Item ids/labels/media metadata come from `desktop-items.ts` so the CMS
  // Desktop Layout editor and this render path can never disagree.
  const cmsDesktopItems = useMemo(
    () => portfolioEntries.map(portfolioDesktopItem),
    [portfolioEntries]
  );

  const profileDesktopItems = useMemo<DesktopItem[]>(
    () => [aboutDesktopItem(aboutData), wifeDesktopItem(wifeData)].filter((item) => Boolean(item.image)),
    [aboutData, wifeData]
  );

  const allDesktopItems = useMemo(
    () => [...staticDesktopItems(), ...profileDesktopItems, ...cmsDesktopItems],
    [cmsDesktopItems, profileDesktopItems]
  );

  // Every desktop item's position/width per breakpoint — CMS Desktop Layout rows
  // (edited in /admin), curated config fallback, and an auto-generated slot for
  // anything else. Rebuilt when the breakpoint or the viewport changes
  // (generated slots are viewport-aware).
  const desktopLayout = useMemo(
    () =>
      buildDesktopLayout(allDesktopItems, {
        activeBreakpoint: breakpoint,
        viewport,
        overlay: layoutOverlay,
      }),
    [allDesktopItems, breakpoint, viewport, layoutOverlay]
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
      // Skip the state update when the window is already frontmost. focusWindow
      // fires on every pointerdown inside a window/sheet; on touch devices an
      // unnecessary re-render (and z-index churn) here cancels the native scroll
      // gesture a touch-drag is starting — so scrolling silently fails on phones
      // while mouse-wheel scrolling (which fires no pointerdown) still works.
      const target = windows.find((w) => w.id === id);
      if (!target) return;
      const maxZ = windows.reduce((max, w) => Math.max(max, w.zIndex), 0);
      if (target.zIndex === maxZ && !target.isMinimized) return;
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w))
      );
      setNextZIndex((z) => z + 1);
    },
    [windows, nextZIndex]
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
      const frameWidth = isTablet
        ? Math.min(Math.round(width * 0.86), window.innerWidth - 40)
        : width;
      const frameHeight = isTablet
        ? Math.min(Math.round(height * 0.86), window.innerHeight - 104)
        : height;

      const TOPBAR_H = 28;
      const centerX = Math.max(20, (window.innerWidth - frameWidth) / 2);
      const centerY = Math.max(TOPBAR_H + 12, (window.innerHeight - frameHeight) / 3);

      let posX: number, posY: number;

      if (appId === "apps") {
        // Spotlight always dead center
        posX = (window.innerWidth - frameWidth) / 2;
        posY = Math.max(60, (window.innerHeight - frameHeight) / 4);
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
        const maxX = Math.max(window.innerWidth - frameWidth - 20, centerX);
        const maxY = Math.max(window.innerHeight - frameHeight - 80, centerY);
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
    [windows, nextZIndex, focusWindow, getAppConfig, isTablet]
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
      // A modal/dialog (passcode gate, onboarding, ...) that owns Escape marks
      // the event as consumed — never close a desktop window in that case.
      if (e.defaultPrevented) return;
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
        {allDesktopItems.map((item) => {
          // Position comes from desktop-layout.ts (curated config → CMS
          // override → generated slot). The item's own x/y is only a last-resort
          // fallback, so old CMS values never regress the layout.
          const fallback =
            typeof item.x === "number" && typeof item.y === "number"
              ? { x: item.x, y: item.y, width: item.width }
              : undefined;
          const position = resolveDesktopItemLayout(desktopLayout, item.id, breakpoint, fallback);
          return (
            <DesktopIcon
              key={item.id}
              id={item.id}
              label={item.label}
              image={item.image}
              x={position.x}
              y={position.y}
              width={position.width ?? (isMobile ? MOBILE_ICON_WIDTH : DESKTOP_DEFAULT_ICON_WIDTH)}
              imageHeight={position.imageHeight}
              imageMaxHeight={isMobile ? undefined : estimateImageHeight(position, breakpoint)}
              onOpen={() => openApp(item.appId)}
              compact={isMobile}
            />
          );
        })}
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
          // On mobile, only the frontmost app is shown as a sheet (iOS-style
          // single-app view). Others stay in state (still "open" in the dock)
          // but don't stack up visually; closing the top reveals the previous.
          if (isMobile && topWindow && win.id !== topWindow.id) return null;
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
              isTablet={isTablet}
              isTop={topWindow?.id === win.id}
              mobilePresentation={
                win.appId === "terminal"
                  ? "terminal"
                  : win.appId === "apps"
                    ? "spotlight"
                    : "full"
              }
            >
              <AppComponent
                windowId={win.id}
                onClose={() => closeWindow(win.id)}
                onOpenApp={openApp}
                finderItems={allDesktopItems}
                initialNoteEntries={initialNoteEntries}
                aboutData={aboutData}
                wifeData={wifeData}
                netflixMovies={netflixLists.movies}
                netflixSeries={netflixLists.series}
                netflixMyList={netflixLists.myList}
                isMaximized={win.isMaximized}
                isMobile={isMobile}
                isTablet={isTablet}
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
