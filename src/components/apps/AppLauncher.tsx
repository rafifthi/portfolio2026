"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useTheme } from "@/components/ThemeProvider";
import { siteLinks } from "@/lib/site";

interface AppLauncherProps {
  onOpenApp: (appId: string) => void;
}

const apps = [
  { id: "finder", name: "Finder", icon: "FolderOpen", color: "#60a5fa", img: "/dock/finder.png" },
  { id: "mail", name: "Mail", icon: "Mail", color: "#3b82f6", img: "/dock/email.png" },
  { id: "notes", name: "Notes", icon: "StickyNote", color: "#f59e0b", img: "/dock/notes-dark.png" },
  { id: "photos", name: "Photos", icon: "Image", color: "#a78bfa", img: "/dock/photos-dark.png" },
  { id: "music", name: "Music", icon: "Music", color: "#ff2d55", img: "/dock/music.png" },
  { id: "terminal", name: "Terminal", icon: "Terminal", color: "#1f2937", img: "/dock/terminal.png" },
  { id: "github", name: "GitHub", icon: "GitBranch", color: "#333", img: null },
  { id: "linkedin", name: "LinkedIn", icon: "Link", color: "#0077b5", img: null },
  { id: "twitter", name: "Twitter", icon: "MessageCircle", color: "#1da1f2", img: null },
  { id: "instagram", name: "Instagram", icon: "Camera", color: "#e4405f", img: null },
];

function getAppImg(appId: string, theme: string) {
  const map: Record<string, string> = {
    finder: "/dock/finder.png",
    mail: "/dock/email.png",
    notes: "/dock/notes-dark.png",
    photos: "/dock/photos-dark.png",
    music: "/dock/music.png",
    terminal: "/dock/terminal.png",
    github: theme === "light" ? "/dock/github-light.png" : "/dock/github-dark.png",
    linkedin: "/dock/linkedin.png",
    twitter: "/dock/X.png",
    instagram: "/dock/instagram.png",
  };
  return map[appId] || null;
}

const SOCIAL_URLS: Record<string, string> = {
  github: siteLinks.github,
  linkedin: siteLinks.linkedin,
  twitter: siteLinks.twitter,
  instagram: siteLinks.instagram,
};

export default function AppLauncher({ onOpenApp }: AppLauncherProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? apps.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.id.toLowerCase().includes(query.toLowerCase())
      )
    : apps;

  return (
    <div
      className="h-full flex flex-col transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Spotlight-style big search */}
      <div className="px-6 pt-6 pb-4">
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 border transition-colors duration-300"
          style={{
            background: "var(--bg-input)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <Icon name="Search" size={22} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spotlight Search"
            autoFocus
            className="flex-1 bg-transparent outline-none text-lg font-medium placeholder:text-[var(--text-tertiary)] transition-colors duration-300"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results with big icons */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((app) => {
            const imgSrc = getAppImg(app.id, theme);
            const socialUrl = SOCIAL_URLS[app.id];
            return (
              <button
                key={app.id}
                onClick={() =>
                  socialUrl
                    ? window.open(socialUrl, "_blank", "noopener")
                    : onOpenApp(app.id)
                }
                className="flex flex-col items-center gap-3 p-4 rounded-2xl transition-colors duration-200 group"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={app.name}
                    className="w-16 h-16 rounded-2xl shadow-lg object-cover transition-transform duration-200 group-hover:scale-110"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: app.color }}
                  >
                    <Icon name={app.icon} size={32} className="text-white" />
                  </div>
                )}
                <span
                  className="text-sm font-medium text-center transition-colors duration-300"
                  style={{ color: "var(--text-primary)" }}
                >
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Icon name="SearchX" size={32} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No results found
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
