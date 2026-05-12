"use client";

import React from "react";
import { Icon } from "@/components/Icon";
import { StudyCase } from "@/lib/types";

interface NotionViewerProps {
  studyCase: StudyCase;
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function BlockRenderer({ block }: { block: StudyCase["blocks"][0] }) {
  switch (block.type) {
    case "heading":
      const HeadingTag = `h${block.level}` as keyof React.JSX.IntrinsicElements;
      const headingSize = block.level === 1 ? "text-2xl" : block.level === 2 ? "text-xl" : "text-lg";
      const headingWeight = block.level === 1 ? "font-bold" : "font-semibold";
      const headingMargin = block.level === 1 ? "mt-6 mb-3" : block.level === 2 ? "mt-5 mb-2.5" : "mt-4 mb-2";
      return (
        <HeadingTag className={`${headingSize} ${headingWeight} ${headingMargin}`} style={{ color: "var(--text-primary)" }}>
          {block.text}
        </HeadingTag>
      );

    case "paragraph":
      return (
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          {block.text}
        </p>
      );

    case "blockquote":
      return (
        <blockquote
          className="pl-4 py-2 my-3 border-l-[3px] rounded-r-md text-sm italic leading-relaxed"
          style={{
            borderColor: "var(--accent)",
            background: "var(--bg-hover)",
            color: "var(--text-secondary)",
          }}
        >
          {block.text}
        </blockquote>
      );

    case "bulleted_list":
      return (
        <ul className="mb-3 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--text-tertiary)" }} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "numbered_list":
      return (
        <ol className="mb-3 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="text-xs font-medium mt-0.5 flex-shrink-0 w-4" style={{ color: "var(--text-tertiary)" }}>
                {i + 1}.
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      );

    case "code":
      return (
        <div className="mb-4 rounded-lg overflow-hidden" style={{ background: "#1e1e2e" }}>
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#16161e" }}>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              {block.language}
            </span>
          </div>
          <pre className="p-3 overflow-x-auto">
            <code className="text-xs font-mono leading-relaxed" style={{ color: "#a6accd" }}>
              {block.code}
            </code>
          </pre>
        </div>
      );

    case "callout":
      return (
        <div
          className="flex items-start gap-3 p-3 rounded-lg mb-3"
          style={{ background: "var(--bg-hover)" }}
        >
          <div className="mt-0.5 flex-shrink-0">
            <Icon name={block.icon} size={16} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {block.text}
          </p>
        </div>
      );

    case "divider":
      return <div className="my-5 border-t" style={{ borderColor: "var(--border-subtle)" }} />;

    case "image":
      return (
        <figure className="mb-4">
          <img
            src={block.src}
            alt={block.caption || ""}
            className="w-full rounded-lg"
            draggable={false}
          />
          {block.caption && (
            <figcaption className="text-xs text-center mt-1.5" style={{ color: "var(--text-tertiary)" }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    default:
      return null;
  }
}

export default function NotionViewer({ studyCase }: NotionViewerProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Banner */}
      <div className="relative h-40 flex-shrink-0 overflow-hidden">
        <img
          src={studyCase.banner}
          alt={studyCase.title}
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
        {/* Title */}
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          {studyCase.title}
        </h1>

        {/* Metadata */}
        <div
          className="flex flex-wrap gap-x-6 gap-y-3 pb-4 mb-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {studyCase.meta.map((m) => (
            <MetaBadge key={m.label} label={m.label} value={m.value} />
          ))}
        </div>

        {/* Blocks */}
        <div className="max-w-2xl">
          {studyCase.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}
