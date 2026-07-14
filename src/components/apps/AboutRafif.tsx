"use client";

import type { AboutData } from "@/lib/cms";
import { fallbackAboutData } from "@/lib/profile-content";

export default function AboutRafif({ aboutData = fallbackAboutData }: { aboutData?: AboutData }) {
  const paragraphs = aboutData.body.split(/\n\s*\n/).filter(Boolean);

  return (
    <div
      className="h-full overflow-auto flex flex-col items-center px-8 py-10"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {aboutData.photo && (
        <div className="mb-5 h-40 w-full max-w-md overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-subtle)" }}>
          <img src={aboutData.photo} alt={aboutData.title} className="h-full w-full object-cover" draggable={false} />
        </div>
      )}

      <h1 className="text-2xl font-bold text-center">{aboutData.title}</h1>
      <p
        className="text-xs uppercase tracking-wider mt-1 text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {aboutData.subtitle}
      </p>

      {/* Short bio */}
      <div className="max-w-md mt-6 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      {/* Tag row */}
      <div className="flex flex-wrap justify-center gap-2 mt-7">
        {aboutData.tags.map(
          (tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-3 py-1 rounded-full"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {tag}
            </span>
          )
        )}
      </div>

    </div>
  );
}
