"use client";

import { useTheme } from "@/components/ThemeProvider";

const WALLPAPERS = [
  { id: "ascii-magic-1", label: "Blue", src: "/wallpaper/ascii-magic-1.gif", accent: "#3b82f6" },
  { id: "ascii-magic-2", label: "Neutral", src: "/wallpaper/ascii-magic-2.gif", accent: "#6b7280" },
  { id: "ascii-magic-3", label: "Green", src: "/wallpaper/ascii-magic-3.gif", accent: "#22c55e" },
];

export default function Settings() {
  const { theme, setTheme, wallpaper, setWallpaper, setAccentColor } = useTheme();

  function selectWallpaper(w: typeof WALLPAPERS[number]) {
    setWallpaper(w.src);
    setAccentColor(w.accent);
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      <div className="p-6 flex flex-col gap-4 max-w-full">
        <h1 className="text-2xl font-light">Settings</h1>

        {/* Appearance */}
        <section
          className="rounded-lg p-5 border"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-window)" }}
        >
          <h2 className="text-lg font-medium mb-4">Appearance</h2>

          <div>
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Theme mode</p>
            <div
              className="flex rounded-md overflow-hidden border"
              style={{ borderColor: "var(--border-hover)", width: "fit-content" }}
            >
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="px-5 py-1.5 text-sm capitalize transition-colors duration-150"
                  style={{
                    background: theme === t ? "var(--accent)" : "transparent",
                    color: theme === t ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Wallpaper */}
        <section
          className="rounded-lg p-5 border"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-window)" }}
        >
          <h2 className="text-lg font-medium mb-1">Wallpaper</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Accent color is automatically matched to the wallpaper.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {WALLPAPERS.map((w) => {
              const selected = wallpaper === w.src;
              return (
                <button
                  key={w.id}
                  onClick={() => selectWallpaper(w)}
                  className="relative rounded-lg overflow-hidden border-2 transition-all duration-150"
                  style={{
                    borderColor: selected ? w.accent : "transparent",
                    aspectRatio: "16 / 9",
                    boxShadow: selected ? `0 0 0 1px ${w.accent}` : "none",
                  }}
                >
                  <img
                    src={w.src}
                    alt={w.label}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[11px] text-white truncate text-left"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.65))" }}
                  >
                    {w.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
