"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { siteLinks } from "@/lib/site";
import { DesktopItem, FinderItem } from "@/lib/types";

type SectionKey = "Work" | "Profile" | "Connect";

interface FinderProps {
  onOpenApp: (appId: string) => void;
  finderItems?: DesktopItem[];
  isMobile?: boolean;
}

const sectionMeta: Record<SectionKey, { icon: string; label: string }> = {
  Work: { icon: "BriefcaseBusiness", label: "Work" },
  Profile: { icon: "UserRound", label: "Profile" },
  Connect: { icon: "AtSign", label: "Connect" },
};

const profileItems: FinderItem[] = [
  {
    id: "about",
    name: "About Rafif",
    kind: "Profile",
    icon: "UserRound",
    color: "#3b82f6",
    target: { type: "app", appId: "about" },
  },
  {
    id: "cv",
    name: "CV.pdf",
    kind: "PDF document",
    icon: "FileText",
    color: "#ef4444",
    target: { type: "app", appId: "cv" },
  },
  {
    id: "readme",
    name: "README.txt",
    kind: "Website guide",
    icon: "FileText",
    color: "#6b7280",
    target: { type: "app", appId: "readme" },
  },
  {
    id: "wife",
    name: "Kanza",
    kind: "Personal story",
    icon: "Heart",
    color: "#ec4899",
    target: { type: "app", appId: "wife" },
  },
];

const connectItems: FinderItem[] = [
  {
    id: "email",
    name: "Email Rafif",
    kind: "Email",
    icon: "Mail",
    color: "#3b82f6",
    target: { type: "link", href: siteLinks.email },
  },
  {
    id: "github",
    name: "GitHub",
    kind: "External link",
    icon: "GitBranch",
    color: "#6b7280",
    target: { type: "link", href: siteLinks.github },
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    kind: "External link",
    icon: "Linkedin",
    color: "#0a66c2",
    target: { type: "link", href: siteLinks.linkedin },
  },
  {
    id: "twitter",
    name: "X",
    kind: "External link",
    icon: "MessageCircle",
    color: "#6b7280",
    target: { type: "link", href: siteLinks.twitter },
  },
  {
    id: "instagram",
    name: "Instagram",
    kind: "External link",
    icon: "Instagram",
    color: "#e4405f",
    target: { type: "link", href: siteLinks.instagram },
  },
];

function toWorkItem(item: DesktopItem): FinderItem {
  return {
    id: item.id,
    name: item.label,
    kind: "Case study",
    icon: "BriefcaseBusiness",
    color: "#3b82f6",
    target: { type: "app", appId: item.appId },
  };
}

export default function Finder({ onOpenApp, finderItems = [], isMobile = false }: FinderProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("Work");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sections = useMemo<Record<SectionKey, FinderItem[]>>(
    () => ({
      Work: finderItems
        .filter(
          (item) =>
            item.appId.endsWith("-case") ||
            item.appId.startsWith("cms-portfolio:")
        )
        .map(toWorkItem),
      Profile: profileItems,
      Connect: connectItems,
    }),
    [finderItems]
  );

  const items = sections[activeSection];

  const openItem = (item: FinderItem) => {
    if (item.target.type === "app") {
      onOpenApp(item.target.appId);
      return;
    }

    if (item.target.href.startsWith("mailto:")) {
      window.open(item.target.href, "_self");
      return;
    }

    window.open(item.target.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="h-full flex transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Sidebar */}
      <div
        className={`${isMobile ? "w-28 px-1.5" : "w-44 px-2"} flex flex-shrink-0 flex-col gap-0.5 py-3 transition-colors duration-300`}
        style={{ background: "var(--bg-sidebar)" }}
      >
        <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Browse</div>
        {(Object.keys(sections) as SectionKey[]).map((section) => (
          <button
            type="button"
            key={section}
            onClick={() => setActiveSection(section)}
            aria-pressed={activeSection === section}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: activeSection === section ? "var(--accent)" : "transparent",
              color: activeSection === section ? "rgb(248, 250, 252)" : "var(--text-secondary)",
              outlineColor: "var(--accent)",
            }}
          >
            <Icon name={sectionMeta[section].icon} size={16} />
            <span className="truncate">{sectionMeta[section].label}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div
          className="flex h-11 items-center gap-3 border-b px-4 transition-colors duration-300"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{activeSection}</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{items.length} items</span>
          <div className="flex-1" />
          <div className="flex items-center rounded-md p-0.5" style={{ background: "var(--bg-input)" }}>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className="rounded p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: viewMode === "grid" ? "var(--bg-hover)" : "transparent", color: "var(--text-secondary)", outlineColor: "var(--accent)" }}
            >
              <Icon name="LayoutGrid" size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className="rounded p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: viewMode === "list" ? "var(--bg-hover)" : "transparent", color: "var(--text-secondary)", outlineColor: "var(--accent)" }}
            >
              <Icon name="List" size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="group flex min-w-0 flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors hover:bg-[var(--bg-hover)] focus-visible:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: "var(--accent)" }}
                  aria-label={`Open ${item.name}`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}22` }}>
                    <Icon name={item.icon} size={24} style={{ color: item.color }} />
                  </div>
                  <span className="w-full truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                  <span className="-mt-1 w-full truncate text-[10px]" style={{ color: "var(--text-tertiary)" }}>{item.kind}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex border-b px-3 py-1.5 text-xs transition-colors duration-300" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-subtle)" }}>
                <span className="flex-1">Name</span>
                {!isMobile && <span className="w-32">Kind</span>}
                <span className="w-8" aria-hidden="true" />
              </div>
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="flex items-center rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)] focus-visible:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ color: "var(--text-primary)", outlineColor: "var(--accent)" }}
                  aria-label={`Open ${item.name}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Icon name={item.icon} size={16} style={{ color: item.color }} />
                    <span className="truncate" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                  </div>
                  {!isMobile && <span className="w-32 truncate" style={{ color: "var(--text-secondary)" }}>{item.kind}</span>}
                  <span className="flex w-8 justify-end" style={{ color: "var(--text-tertiary)" }}>
                    <Icon name={item.target.type === "link" ? "ExternalLink" : "ChevronRight"} size={14} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
