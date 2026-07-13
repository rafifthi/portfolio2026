"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import { photos } from "@/lib/data";
import { MobileStack, MobileBackHeader } from "@/components/mobile/MobileStack";
import { browserImageUrl, CmsEntry, GalleryImageData } from "@/lib/cms";
import { Photo } from "@/lib/types";

interface GalleryPhoto extends Photo {
  labels: string[];
  defaultFavorite: boolean;
}

const FAVORITES_STORAGE_KEY = "portfolio-photo-favorites";

function PhotoTile({ item }: { item: GalleryPhoto }) {
  if (item.src) {
    return (
      <img
        src={browserImageUrl(item.src)}
        alt={item.title || "Gallery photo"}
        className="h-full w-full object-cover"
        draggable={false}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: "var(--bg-card)", color: "var(--text-tertiary)" }}>
      <Icon name="ImageOff" size={24} />
      <span className="text-[11px]">Image unavailable</span>
    </div>
  );
}

function FavoriteButton({ active, onClick, label, compact = false }: { active: boolean; onClick: () => void; label: string; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      aria-pressed={active}
      className={`${compact ? "p-2" : "p-2.5"} rounded-full shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2`}
      style={{
        background: active ? "var(--bg-app)" : "rgba(15, 18, 24, 0.66)",
        color: active ? "#e64c68" : "rgba(248, 248, 248, 0.88)",
        outlineColor: "var(--accent)",
      }}
    >
      <Icon name="Heart" size={compact ? 15 : 17} className={active ? "fill-current" : ""} />
    </button>
  );
}

function GalleryGrid({
  items,
  isFavorite,
  toggleFavorite,
  selectPhoto,
  compact = false,
}: {
  items: GalleryPhoto[];
  isFavorite: (photo: GalleryPhoto) => boolean;
  toggleFavorite: (photo: GalleryPhoto) => void;
  selectPhoto: (id: string) => void;
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center" style={{ color: "var(--text-tertiary)" }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--bg-card)" }}>
          <Icon name="Images" size={22} />
        </div>
        <div className="mt-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No photos here yet</div>
        <div className="mt-1 max-w-60 text-xs leading-5">Add photos or assign a label from the CMS to populate this album.</div>
      </div>
    );
  }

  return (
    <div className={`grid ${compact ? "grid-cols-3 gap-1" : "grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4"}`}>
      {items.map((photo) => {
        const favorite = isFavorite(photo);
        return (
          <article key={photo.id} className={`group relative aspect-square overflow-hidden ${compact ? "rounded-md" : "rounded-lg"}`} style={{ background: "var(--bg-card)" }}>
            <button type="button" onClick={() => selectPhoto(photo.id)} className="h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-2px]" style={{ outlineColor: "var(--accent)" }} aria-label={`Open ${photo.title || "photo"}`}>
              <PhotoTile item={photo} />
              {(photo.title || photo.labels.length > 0) && (
                <div className={`absolute inset-x-0 bottom-0 bg-black/65 text-left text-white transition-opacity ${compact ? "p-1.5 opacity-0 group-hover:opacity-100" : "p-2.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
                  {photo.title && <div className="truncate text-xs font-medium">{photo.title}</div>}
                  {photo.labels.length > 0 && <div className="mt-0.5 truncate text-[10px] text-white/65">{photo.labels.join(" · ")}</div>}
                </div>
              )}
            </button>
            <div className={`absolute right-1.5 top-1.5 transition-opacity ${favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
              <FavoriteButton
                active={favorite}
                onClick={() => toggleFavorite(photo)}
                label={favorite ? "Remove from favorites" : "Add to favorites"}
                compact
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PhotoDetail({
  photo,
  favorite,
  toggleFavorite,
  close,
  mobile = false,
}: {
  photo: GalleryPhoto;
  favorite: boolean;
  toggleFavorite: () => void;
  close: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      {mobile ? (
        <MobileBackHeader label="Photos" onBack={close} />
      ) : (
        <button type="button" onClick={close} aria-label="Close photo" className="absolute right-4 top-3 z-10 rounded-full p-2 transition-colors" style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}>
          <Icon name="X" size={18} />
        </button>
      )}
      <div className={`flex flex-1 flex-col items-center justify-center ${mobile ? "p-5" : "p-8"}`} style={{ background: "var(--bg-base)" }}>
        <div className={`relative w-full overflow-hidden rounded-xl shadow-2xl ${mobile ? "max-w-sm aspect-square" : "max-w-lg aspect-square"}`}>
          <PhotoTile item={photo} />
          <div className="absolute right-3 top-3">
            <FavoriteButton active={favorite} onClick={toggleFavorite} label={favorite ? "Remove from favorites" : "Add to favorites"} />
          </div>
        </div>
        {(photo.title || photo.date || photo.labels.length > 0) && (
          <div className="mt-4 text-center">
            {photo.title && <div className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{photo.title}</div>}
            {photo.date && <div className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{photo.date}</div>}
            {photo.labels.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {photo.labels.map((label) => <span key={label} className="rounded-md px-2 py-1 text-[11px]" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>{label}</span>)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function LibraryNav({
  activeView,
  labels,
  counts,
  selectView,
}: {
  activeView: string;
  labels: string[];
  counts: Record<string, number>;
  selectView: (view: string) => void;
}) {
  const itemClass = "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors";
  const itemStyle = (active: boolean) => ({
    background: active ? "var(--accent)" : "transparent",
    color: active ? "rgb(248, 250, 252)" : "var(--text-secondary)",
  });

  return (
    <>
      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Library</div>
      <button type="button" onClick={() => selectView("all")} className={itemClass} style={itemStyle(activeView === "all")}>
        <Icon name="Image" size={16} /><span>All Photos</span><span className="ml-auto text-[11px] opacity-60">{counts.all || 0}</span>
      </button>
      <button type="button" onClick={() => selectView("favorites")} className={itemClass} style={itemStyle(activeView === "favorites")}>
        <Icon name="Heart" size={16} className={activeView === "favorites" ? "fill-current" : ""} /><span>Favorites</span><span className="ml-auto text-[11px] opacity-60">{counts.favorites || 0}</span>
      </button>

      <div className="mb-2 mt-5 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Albums</div>
      {labels.map((label) => {
        const view = `album:${label}`;
        return (
          <button key={label} type="button" onClick={() => selectView(view)} className={itemClass} style={itemStyle(activeView === view)}>
            <Icon name="Folder" size={16} /><span className="truncate">{label}</span><span className="ml-auto text-[11px] opacity-60">{counts[view] || 0}</span>
          </button>
        );
      })}
      {!labels.length && <div className="px-2 py-2 text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>Albums appear after photos are labelled in the CMS.</div>}
    </>
  );
}

export default function Photos({ isMobile = false }: { isMobile?: boolean }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cmsPhotos, setCmsPhotos] = useState<GalleryPhoto[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState("all");
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});

  const fallbackPhotos = useMemo<GalleryPhoto[]>(
    () => photos.map((photo) => ({ ...photo, labels: [], defaultFavorite: false })),
    []
  );
  const allPhotos = cmsPhotos.length ? cmsPhotos : fallbackPhotos;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        // Browser-local overrides let visitors use Favorites like a wishlist.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavoriteOverrides(JSON.parse(stored) as Record<string, boolean>);
      }
    } catch {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/content?type=gallery", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { entries?: CmsEntry<GalleryImageData>[] } | null) => {
        if (cancelled || !payload?.entries?.length) return;
        setCmsPhotos(
          payload.entries.map((entry) => ({
            id: entry.id,
            src: entry.data.src,
            title: entry.data.title?.trim() || "",
            date: entry.data.date || "",
            labels: Array.from(new Set((entry.data.labels || []).filter(Boolean))),
            defaultFavorite: Boolean(entry.data.favorite),
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = (photo: GalleryPhoto) => favoriteOverrides[photo.id] ?? photo.defaultFavorite;
  const toggleFavorite = (photo: GalleryPhoto) => {
    setFavoriteOverrides((current) => {
      const active = current[photo.id] ?? photo.defaultFavorite;
      const next = { ...current, [photo.id]: !active };
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const labels = useMemo(
    () => Array.from(new Set(allPhotos.flatMap((photo) => photo.labels))).sort((a, b) => a.localeCompare(b)),
    [allPhotos]
  );
  const visiblePhotos = allPhotos.filter((photo) => {
    if (activeView === "favorites") return isFavorite(photo);
    if (activeView.startsWith("album:")) return photo.labels.includes(activeView.slice(6));
    return true;
  });
  const counts = Object.fromEntries([
    ["all", allPhotos.length],
    ["favorites", allPhotos.filter(isFavorite).length],
    ...labels.map((label) => [`album:${label}`, allPhotos.filter((photo) => photo.labels.includes(label)).length]),
  ]);
  const activeTitle = activeView === "favorites" ? "Favorites" : activeView.startsWith("album:") ? activeView.slice(6) : "All Photos";
  const photo = allPhotos.find((item) => item.id === selectedPhoto);
  const selectView = (view: string) => {
    setActiveView(view);
    setSelectedPhoto(null);
    setDrawerOpen(false);
  };

  if (isMobile) {
    return (
      <div className="relative flex h-full min-h-0 flex-col transition-colors duration-300" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
        <MobileStack pageKey={photo && selectedPhoto ? `detail-${selectedPhoto}` : activeView} depth={photo && selectedPhoto ? 1 : 0}>
          {photo && selectedPhoto ? (
            <PhotoDetail photo={photo} favorite={isFavorite(photo)} toggleFavorite={() => toggleFavorite(photo)} close={() => setSelectedPhoto(null)} mobile />
          ) : (
            <>
              <div className="flex h-11 flex-shrink-0 items-center gap-2 border-b px-2" style={{ borderColor: "var(--border-subtle)" }}>
                <button type="button" onClick={() => setDrawerOpen(true)} className="flex min-h-11 min-w-11 items-center justify-center" style={{ color: "var(--accent)" }} aria-label="Open photo library">
                  <Icon name="PanelLeft" size={20} />
                </button>
                <span className="text-[16px] font-semibold">{activeTitle}</span>
                <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{visiblePhotos.length} items</span>
              </div>
              <div className="flex-1 overflow-auto overscroll-contain p-1">
                <GalleryGrid items={visiblePhotos} isFavorite={isFavorite} toggleFavorite={toggleFavorite} selectPhoto={setSelectedPhoto} compact />
              </div>
            </>
          )}
        </MobileStack>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.button type="button" aria-label="Close photo library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => setDrawerOpen(false)} className="absolute inset-0 z-20 bg-black/40" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-y-0 left-0 z-30 w-64 overflow-auto px-3 py-4 shadow-2xl" style={{ background: "var(--bg-sidebar)" }}>
                <LibraryNav activeView={activeView} labels={labels} counts={counts} selectView={selectView} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-full transition-colors duration-300" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      {sidebarOpen && (
        <aside className="w-52 flex-shrink-0 overflow-auto border-r px-2 py-3" style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
          <LibraryNav activeView={activeView} labels={labels} counts={counts} selectView={selectView} />
        </aside>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 flex-shrink-0 items-center gap-3 border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded p-1 transition-colors" style={{ color: "var(--text-tertiary)" }} aria-label={sidebarOpen ? "Hide photo library" : "Show photo library"}>
            <Icon name={sidebarOpen ? "PanelLeftClose" : "PanelLeft"} size={16} />
          </button>
          <span className="text-sm font-medium">{activeTitle}</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{visiblePhotos.length} items</span>
        </div>

        {photo && selectedPhoto ? (
          <PhotoDetail photo={photo} favorite={isFavorite(photo)} toggleFavorite={() => toggleFavorite(photo)} close={() => setSelectedPhoto(null)} />
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <GalleryGrid items={visiblePhotos} isFavorite={isFavorite} toggleFavorite={toggleFavorite} selectPhoto={setSelectedPhoto} />
          </div>
        )}
      </div>
    </div>
  );
}
