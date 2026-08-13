"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  wallpaper: string | null;
  setWallpaper: (url: string | null) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
  wallpaper: null,
  setWallpaper: () => {},
  accentColor: "#3b82f6",
  setAccentColor: () => {},
});

const THEME_KEY = "portfolio-theme";
const WALLPAPER_KEY = "portfolio-wallpaper";
const ACCENT_KEY = "portfolio-accent";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [wallpaper, setWallpaperState] = useState<string | null>("/wallpaper/ascii-magic-1.gif");
  const [accentColor, setAccentColorState] = useState("#3b82f6");
  // Gate persistence writes until the saved values have been read on mount, so
  // the initial render's defaults don't clobber what the user chose last time.
  const [ready, setReady] = useState(false);

  // Restore persisted preferences once, after hydration. localStorage is
  // client-only, so state must start at the defaults on the server and resolve
  // here (same deliberate setState-in-effect pattern as the boot flag).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
      const savedWallpaper = localStorage.getItem(WALLPAPER_KEY);
      if (savedWallpaper !== null) setWallpaperState(savedWallpaper === "" ? null : savedWallpaper);
      const savedAccent = localStorage.getItem(ACCENT_KEY);
      if (savedAccent) setAccentColorState(savedAccent);
    } catch {
      // localStorage may be unavailable (private mode) — ignore.
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (ready) {
      try { localStorage.setItem(THEME_KEY, theme); } catch {}
    }
  }, [theme, ready]);

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(WALLPAPER_KEY, wallpaper ?? ""); } catch {}
    }
  }, [wallpaper, ready]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    if (ready) {
      try { localStorage.setItem(ACCENT_KEY, accentColor); } catch {}
    }
  }, [accentColor, ready]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const setWallpaper = useCallback((url: string | null) => {
    setWallpaperState(url);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme, wallpaper, setWallpaper, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
