"use client";

import { Icon } from "@/components/Icon";

export default function Readme() {
  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Welcome to rafifthi.com</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Your personal macOS-style portfolio experience.
          </p>

          <div className="space-y-5">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Getting Started
              </h2>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
                This website replicates a macOS desktop environment. Everything is interactive and draggable.
              </p>
              <ul className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <Icon name="MousePointerClick" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span><strong>Single click</strong> an item to select it. Click again to open.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Move" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span><strong>Drag</strong> any desktop item or window to move it around.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Layers" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span><strong>Stack windows</strong> on top of each other — click a window to bring it to front.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Moon" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span>Toggle <strong>dark/light mode</strong> from the top-right menu bar.</span>
                </li>
              </ul>
            </section>

            <div className="border-t" style={{ borderColor: "var(--border-subtle)" }} />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                What's on the Desktop
              </h2>
              <ul className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <Icon name="FileText" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <span><strong>README.txt</strong> — This file. You're reading it now!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Heart" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <span><strong>wife</strong> — A little story about the most important person in my life.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="FileText" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <span><strong>CV.pdf</strong> — My curriculum vitae. Downloadable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="FolderOpen" size={14} className="mt-1 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                  <span><strong>Study Cases</strong> — Detailed write-ups of projects I've built.</span>
                </li>
              </ul>
            </section>

            <div className="border-t" style={{ borderColor: "var(--border-subtle)" }} />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Dock Apps
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                The dock at the bottom (or left on mobile) contains quick-launch apps: Finder, Mail, Notes, Photos, Music, Terminal, and more. Click to open. Right-click or long-press is not implemented yet — keep it simple.
              </p>
            </section>

            <div className="border-t" style={{ borderColor: "var(--border-subtle)" }} />

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Spotlight Search
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Click the <strong>Spotlight</strong> icon (magnifying glass) in the dock to open a search interface. You can quickly find and open any app from there.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-4 text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
            Built with Next.js, Tailwind CSS, and Framer Motion.
            <br />
            Designed & developed by rafifthi.
          </div>
        </div>
      </div>
    </div>
  );
}
