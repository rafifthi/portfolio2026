"use client";

import type { WifeData } from "@/lib/cms";
import { fallbackWifeData } from "@/lib/profile-content";

export default function Wife({ wifeData = fallbackWifeData }: { wifeData?: WifeData }) {
  return (
    <div
      className="h-full overflow-auto flex flex-col items-center px-8 py-10"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Framed portrait */}
      {wifeData.photo && (
        <div
          className="rounded-2xl p-3"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--window-shadow)",
          }}
        >
          <div className="overflow-hidden rounded-xl" style={{ width: 240, aspectRatio: "3 / 4" }}>
            <img src={wifeData.photo} alt={wifeData.name} className="w-full h-full object-cover" draggable={false} />
          </div>
        </div>
      )}

      {/* Name */}
      <h1 className="text-2xl font-bold mt-6">{wifeData.name}</h1>

      {/* Short narrative */}
      <p
        className="text-sm leading-relaxed text-center max-w-sm mt-4"
        style={{ color: "var(--text-secondary)" }}
      >
        {wifeData.description}
      </p>
    </div>
  );
}
