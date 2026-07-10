"use client";

import { Icon } from "@/components/Icon";
import { CmsEntry, PortfolioEntryData } from "@/lib/cms";
import { NotionBlock } from "@/lib/types";

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

function Block({ block }: { block: NotionBlock }) {
  if (block.type === "heading") {
    const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
    return (
      <Tag
        className={block.level === 1 ? "mt-7 text-2xl font-bold" : block.level === 2 ? "mt-7 text-xl font-bold" : "mt-5 text-lg font-semibold"}
        style={{ color: "var(--text-primary)" }}
      >
        {block.text}
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{block.text}</p>;
  }

  if (block.type === "blockquote") {
    return (
      <blockquote className="mt-4 border-l-2 pl-4 text-sm italic leading-7" style={{ borderColor: "var(--accent)", color: "var(--text-secondary)" }}>
        {block.text}
      </blockquote>
    );
  }

  if (block.type === "bulleted_list" || block.type === "numbered_list") {
    const List = block.type === "bulleted_list" ? "ul" : "ol";
    return (
      <List className={`mt-3 space-y-2 pl-5 text-sm leading-6 ${block.type === "bulleted_list" ? "list-disc" : "list-decimal"}`} style={{ color: "var(--text-secondary)" }}>
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </List>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="mt-4 overflow-auto rounded-lg p-4 text-xs" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="mt-4 flex gap-3 rounded-lg border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <Icon name={block.icon} size={18} style={{ color: "var(--accent)" }} />
        <div className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{block.text}</div>
      </div>
    );
  }

  if (block.type === "divider") {
    return <div className="my-6 h-px" style={{ background: "var(--border-subtle)" }} />;
  }

  if (block.type === "image") {
    return (
      <figure className="mt-5">
        <img src={block.src} alt={block.caption || ""} className="w-full rounded-lg object-cover" />
        {block.caption && <figcaption className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>{block.caption}</figcaption>}
      </figure>
    );
  }

  return null;
}

export default function StructuredCaseViewer({ entry }: { entry: CmsEntry<PortfolioEntryData> }) {
  const data = entry.data;

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="relative h-40 flex-shrink-0 overflow-hidden">
        {data.banner ? (
          <img src={data.banner} alt={data.title || entry.title} className="h-full w-full object-cover" draggable={false} />
        ) : null}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg-app) 0%, transparent 60%)" }} />
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8 -mt-6 relative">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          {data.title || entry.title}
        </h1>

        <div className="flex flex-wrap gap-x-6 gap-y-3 border-b pb-4 mb-4" style={{ borderColor: "var(--border-subtle)" }}>
          {(data.meta || []).map((item) => <MetaBadge key={item.label} label={item.label} value={item.value} />)}
        </div>

        <div className="max-w-2xl pb-6">
          {(data.blocks || []).map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)}
        </div>
      </div>
    </div>
  );
}

