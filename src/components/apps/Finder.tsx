"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { finderSections } from "@/lib/data";
import { FinderItem } from "@/lib/types";

type SectionKey = keyof typeof finderSections;

function getItemIcon(item: FinderItem) {
  switch (item.type) {
    case "folder": return "Folder";
    case "image": return "Image";
    case "pdf": return "FileText";
    case "app": return "AppWindow";
    default: return "File";
  }
}

function getItemColor(item: FinderItem) {
  switch (item.type) {
    case "folder": return "#60a5fa";
    case "image": return "#a78bfa";
    case "pdf": return "#f87171";
    case "app": return "#34d399";
    default: return "#9ca3af";
  }
}

export default function Finder() {
  const [activeSection, setActiveSection] = useState<SectionKey>("Recents");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sections = Object.keys(finderSections) as SectionKey[];
  const items = finderSections[activeSection];

  return (
    <div
      className="h-full flex transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Sidebar */}
      <div
        className="w-44 flex flex-col py-3 px-2 gap-0.5 transition-colors duration-300"
        style={{ background: "var(--bg-sidebar)" }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider px-2 mb-1" style={{ color: "var(--text-tertiary)" }}>Favorites</div>
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
            style={{
              background: activeSection === section ? "var(--accent)" : "transparent",
              color: activeSection === section ? "#fff" : "var(--text-secondary)",
            }}
          >
            <Icon name={section === "Recents" ? "Clock" : section === "Downloads" ? "Download" : section === "Desktop" ? "Monitor" : section === "Documents" ? "FileText" : "LayoutGrid"} size={16} />
            <span>{section}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div
          className="h-10 flex items-center px-4 border-b gap-3 transition-colors duration-300"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="ChevronLeft" size={16} />
            </button>
            <button className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{activeSection}</span>
          <div className="flex-1" />
          <div className="flex items-center rounded-md p-0.5" style={{ background: "var(--bg-input)" }}>
            <button
              onClick={() => setViewMode("grid")}
              className="p-1 rounded transition-colors"
              style={{ background: viewMode === "grid" ? "var(--bg-hover)" : "transparent", color: "var(--text-secondary)" }}
            >
              <Icon name="LayoutGrid" size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="p-1 rounded transition-colors"
              style={{ background: viewMode === "list" ? "var(--bg-hover)" : "transparent", color: "var(--text-secondary)" }}
            >
              <Icon name="List" size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-2 p-3 rounded-lg transition-colors cursor-pointer group" style={{ background: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: getItemColor(item) + "22" }}>
                    <Icon name={getItemIcon(item)} size={24} style={{ color: getItemColor(item) }} />
                  </div>
                  <span className="text-xs text-center truncate w-full" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex text-xs px-3 py-1 border-b transition-colors duration-300" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-subtle)" }}>
                <span className="flex-1">Name</span>
                <span className="w-32">Date Modified</span>
                <span className="w-20 text-right">Size</span>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-center px-3 py-2 transition-colors cursor-pointer text-sm" style={{ color: "var(--text-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <div className="flex-1 flex items-center gap-2">
                    <Icon name={getItemIcon(item)} size={16} style={{ color: getItemColor(item) }} />
                    <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
                  </div>
                  <span className="w-32" style={{ color: "var(--text-secondary)" }}>{item.date}</span>
                  <span className="w-20 text-right" style={{ color: "var(--text-secondary)" }}>{item.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
