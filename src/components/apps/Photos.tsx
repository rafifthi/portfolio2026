"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/Icon";
import { photos } from "@/lib/data";
import { MobileStack, MobileBackHeader } from "@/components/mobile/MobileStack";
import { browserImageUrl, CmsEntry, GalleryImageData } from "@/lib/cms";
import { Photo } from "@/lib/types";

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

function PhotoTile({ item, index }: { item: Photo; index: number }) {
  if (item.src) {
    return <img src={browserImageUrl(item.src)} alt={item.title} className="h-full w-full object-cover" draggable={false} />;
  }

  return <div className="h-full w-full" style={{ background: gradients[index % gradients.length] }} />;
}

export default function Photos({ isMobile = false }: { isMobile?: boolean }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cmsPhotos, setCmsPhotos] = useState<Photo[]>([]);
  // Mobile-only: slide-over drawer for the Library/Albums sections
  const [drawerOpen, setDrawerOpen] = useState(false);
  const allPhotos = cmsPhotos.length ? cmsPhotos : photos;

  const photo = allPhotos.find((p) => p.id === selectedPhoto);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content?type=gallery")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { entries?: CmsEntry<GalleryImageData>[] } | null) => {
        if (cancelled || !payload?.entries?.length) return;
        setCmsPhotos(
          payload.entries.map((entry) => ({
            id: entry.id,
            src: entry.data.src,
            title: "",
            date: "",
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── iOS layout (mobile): All Photos grid, sections in a slide-over drawer ──
  if (isMobile) {
    const drawerItems = [
      { icon: "Image", label: "All Photos", active: true },
      { icon: "Clock", label: "Recents" },
      { icon: "Star", label: "Favorites" },
      { icon: "Trash2", label: "Recently Deleted" },
    ];
    const drawerAlbums = [
      { icon: "Folder", label: "Travel" },
      { icon: "Folder", label: "Food" },
    ];

    return (
      <div className="relative h-full flex flex-col min-h-0 transition-colors duration-300" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
        <MobileStack
          pageKey={photo && selectedPhoto ? `detail-${selectedPhoto}` : "grid"}
          depth={photo && selectedPhoto ? 1 : 0}
        >
          {photo && selectedPhoto ? (
            <>
              <MobileBackHeader label="Photos" onBack={() => setSelectedPhoto(null)} />
              <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
                <div className="w-full max-w-sm aspect-square overflow-hidden rounded-xl shadow-2xl">
                  <PhotoTile item={photo} index={allPhotos.indexOf(photo)} />
                </div>
                <div className="mt-4 text-center">
                  {photo.title && <div className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>{photo.title}</div>}
                  {photo.date && <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{photo.date}</div>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-11 flex-shrink-0 flex items-center px-2 gap-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="min-w-11 min-h-11 flex items-center justify-center"
                  style={{ color: "var(--accent)" }}
                  aria-label="Open library"
                >
                  <Icon name="PanelLeft" size={20} />
                </button>
                <span className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>All Photos</span>
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{allPhotos.length} items</span>
              </div>
              <div className="flex-1 overflow-auto overscroll-contain p-1">
                <div className="grid grid-cols-3 gap-1">
                  {allPhotos.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPhoto(p.id)}
                      className="aspect-square rounded-md overflow-hidden"
                      aria-label={p.title}
                    >
                      <PhotoTile item={p} index={i} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </MobileStack>

        {/* Slide-over library drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 z-20 bg-black/40"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="absolute inset-y-0 left-0 z-30 w-64 flex flex-col py-4 px-3 gap-0.5 overflow-auto shadow-2xl"
                style={{ background: "var(--bg-app)" }}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider px-2 mb-2" style={{ color: "var(--text-tertiary)" }}>Library</div>
                {drawerItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] text-left"
                    style={{
                      background: item.active ? "var(--accent)" : "transparent",
                      color: item.active ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
                <div className="text-[11px] font-bold uppercase tracking-wider px-2 mt-4 mb-2" style={{ color: "var(--text-tertiary)" }}>Albums</div>
                {drawerAlbums.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] text-left"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

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
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{allPhotos.length} items</span>
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
            <div className="w-full max-w-lg aspect-square overflow-hidden rounded-xl shadow-2xl">
              <PhotoTile item={photo} index={allPhotos.indexOf(photo)} />
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>{photo.title}</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{photo.date}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-4 gap-2">
              {allPhotos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo.id)}
                  className="aspect-square rounded-lg overflow-hidden relative group transition-all hover:ring-2"
                  style={{ boxShadow: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <PhotoTile item={photo} index={i} />
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
