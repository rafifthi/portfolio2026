"use client";

import { Icon } from "@/components/Icon";

export default function AboutRafif() {
  return (
    <div
      className="h-full overflow-auto flex flex-col items-center px-8 py-10"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Avatar / mark */}
      <div
        className="rounded-full flex items-center justify-center shadow-lg"
        style={{
          width: 96,
          height: 96,
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
        }}
      >
        <Icon name="User" size={44} className="text-white" />
      </div>

      <h1 className="text-2xl font-bold mt-5 text-center">Rafif Fathi Misbah</h1>
      <p
        className="text-xs uppercase tracking-wider mt-1 text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        Product Manager · Business Analyst
      </p>

      {/* Short bio */}
      <div className="max-w-md mt-6 space-y-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <p>
          I&apos;m a product manager who likes the messy middle — the gap
          between a fuzzy business problem and something a real person can click.
          I sit across product, business analysis, and product design, mostly in
          SME and retail.
        </p>
        <p>
          Day to day that means discovery, requirements, and the unglamorous
          backbone of shipping: backlogs, sprint planning, ticketing, QA. I map
          how a business actually works, then translate that into specs
          engineering can build without a séance.
        </p>
        <p>
          I&apos;m also an early adopter of agentic AI for the product pipeline —
          Hermes Agent, Claude Code, and Codex are part of how I move fast now,
          not a gimmick for a slide. If there&apos;s a way to compress
          idea-to-MVP, I&apos;m trying it.
        </p>
      </div>

      {/* Tag row */}
      <div className="flex flex-wrap justify-center gap-2 mt-7">
        {["Product Discovery", "Business Analysis", "Product Design", "Agentic AI", "MVP"].map(
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

      <p
        className="text-xs mt-8 text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        Open the CV app for the full résumé — this is the human version.
      </p>
    </div>
  );
}
