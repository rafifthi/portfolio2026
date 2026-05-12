"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { photos } from "@/lib/data";

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
];

export default function Photos() {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const photo = photos.find((p) => p.id === selectedPhoto);

  return (
    <div
      className="h-full flex transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {sidebarOpen && (
        <div
          className="w-48 flex flex-col py-3 px-2 gap-0.5 border-r transition-colors duration-300"
          style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider px-2 mb-2" style={{ color: "var(--text-tertiary)" }}>Library</div>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors" style={{ background: "var(--accent)", color: "#fff" }}>
            <Icon name="Image" size={16} />
            <span>All Photos</span>
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Icon name="Clock" size={16} />
            <span>Recents</span>
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Icon name="Star" size={16} />
            <span>Favorites</span>
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Icon name="Trash2" size={16} />
            <span>Recently Deleted</span>
          </button>

          <div className="text-[10px] font-bold uppercase tracking-wider px-2 mt-4 mb-2" style={{ color: "var(--text-tertiary)" }}>Albums</div>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Icon name="Folder" size={16} />
            <span>Travel</span>
          </button>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <Icon name="Folder" size={16} />
            <span>Food</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="h-10 flex items-center px-4 border-b gap-3 transition-colors duration-300"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeft"} size={16} />
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>All Photos</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{photos.length} items</span>
          <div className="flex-1" />
          <button className="p-1 rounded transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <Icon name="Grid3x3" size={16} />
          </button>
        </div>

        {selectedPhoto && photo ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: "var(--bg-base)" }}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-12 right-4 p-2 rounded-full transition-colors"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
            >
              <Icon name="X" size={20} />
            </button>
            <div className="w-full max-w-lg aspect-square rounded-xl shadow-2xl" style={{ background: gradients[photos.indexOf(photo) % gradients.length] }} />
            <div className="mt-4 text-center">
              <div className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>{photo.title}</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{photo.date}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo.id)}
                  className="aspect-square rounded-lg overflow-hidden relative group transition-all hover:ring-2"
                  style={{ background: gradients[i % gradients.length], boxShadow: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs font-medium truncate text-white">{photo.title}</div>
                    <div className="text-[10px] text-white/60">{photo.date}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
