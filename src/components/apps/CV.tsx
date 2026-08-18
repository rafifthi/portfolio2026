"use client";

import { Icon } from "@/components/Icon";
import { useState } from "react";

const PDF_SRC = "/ATS PM Q3 2026 - Rafif Fathi.pdf";
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;

export default function CV() {
  // Zoom is applied as a CSS transform on the iframe so we control it uniformly
  // across browsers and on mobile (where the native PDF viewer's own zoom
  // controls aren't available). The inner wrapper is sized to the scaled
  // dimensions so the scroll container can pan around a zoomed-in document.
  const [zoom, setZoom] = useState(1);

  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  const resetZoom = () => setZoom(1);

  return (
    <div className="h-full flex flex-col" style={{ background: "#f5f5f5" }}>
      {/* Toolbar */}
      <div className="h-10 flex items-center px-3 border-b bg-white gap-1">
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Print">
          <Icon name="Printer" size={14} />
        </button>
        <a
          href={PDF_SRC}
          download
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
          title="Download"
        >
          <Icon name="Download" size={14} />
        </a>

        <div className="flex-1" />

        {/* Zoom controls */}
        <button
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Icon name="ZoomOut" size={14} />
        </button>
        <button
          onClick={resetZoom}
          className="min-w-[3rem] px-1.5 py-0.5 rounded hover:bg-gray-100 text-xs text-gray-500 tabular-nums"
          title="Reset zoom"
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Icon name="ZoomIn" size={14} />
        </button>
      </div>

      {/* CV Document */}
      <div className="flex-1 overflow-auto bg-gray-200">
        <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <iframe
            src={PDF_SRC}
            title="CV - Rafif Fathi Misbah"
            className="border-none"
            style={{
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}
