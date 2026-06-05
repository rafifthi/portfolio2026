"use client";

import React, { ComponentType } from "react";

interface CaseMeta {
  label: string;
  value: string;
}

export interface CaseMetadata {
  id: string;
  title: string;
  banner: string;
  meta: CaseMeta[];
}

interface CaseViewerProps {
  metadata: CaseMetadata;
  Content: ComponentType;
}

function MetaBadge({ label, value }: CaseMeta) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] uppercase tracking-wider font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export default function CaseViewer({ metadata, Content }: CaseViewerProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Banner */}
      <div className="relative h-40 flex-shrink-0 overflow-hidden">
        <img
          src={metadata.banner}
          alt={metadata.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, var(--bg-app) 0%, transparent 60%)" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 pb-8 -mt-6 relative">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          {metadata.title}
        </h1>

        <div
          className="flex flex-wrap gap-x-6 gap-y-3 pb-4 mb-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {metadata.meta.map((m) => (
            <MetaBadge key={m.label} label={m.label} value={m.value} />
          ))}
        </div>

        <div className="max-w-2xl">
          <Content />
        </div>
      </div>
    </div>
  );
}
