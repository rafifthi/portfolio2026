"use client";

import { Icon } from "@/components/Icon";
import { CmsEntry, PortfolioEntryData } from "@/lib/cms";
import { renderInline } from "@/lib/inline-markdown";
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

function getProjectLink(value?: string) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    const hostname = url.hostname.replace(/^www\./, "");
    const isFigma = hostname === "figma.com" || hostname.endsWith(".figma.com");
    let displayUrl = `${hostname}${url.pathname === "/" ? "" : url.pathname}`;

    if (isFigma) {
      const parts = url.pathname.split("/").filter(Boolean);
      const section = parts[0] || "design";
      const rawName = parts.at(-1) || "prototype";
      const readableName = decodeURIComponent(rawName).replace(/[-_]+/g, " ");
      const shortName = readableName.length > 28
        ? `${readableName.slice(0, 27)}…`
        : readableName;
      displayUrl = `${hostname}/${section}/…/${shortName}`;
    }

    return {
      href: url.toString(),
      displayUrl,
      label: isFigma ? "Open Figma prototype" : "Visit live project",
      isFigma,
    };
  } catch {
    return null;
  }
}

function Block({ block }: { block: NotionBlock }) {
  if (block.type === "heading") {
    const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
    return (
      <Tag
        className={block.level === 1 ? "mt-7 text-2xl font-bold" : block.level === 2 ? "mt-7 text-xl font-bold" : "mt-5 text-lg font-semibold"}
        style={{ color: "var(--text-primary)" }}
      >
        {renderInline(block.text)}
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return <p className="mt-3 text-sm leading-7 whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{renderInline(block.text)}</p>;
  }

  if (block.type === "blockquote") {
    return (
      <blockquote className="mt-4 border-l-2 pl-4 text-sm italic leading-7" style={{ borderColor: "var(--accent)", color: "var(--text-secondary)" }}>
        {renderInline(block.text)}
      </blockquote>
    );
  }

  if (block.type === "bulleted_list" || block.type === "numbered_list") {
    const List = block.type === "bulleted_list" ? "ul" : "ol";
    return (
      <List className={`mt-3 space-y-2 pl-5 text-sm leading-6 ${block.type === "bulleted_list" ? "list-disc" : "list-decimal"}`} style={{ color: "var(--text-secondary)" }}>
        {block.items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
      </List>
    );
  }

  if (block.type === "todo_list") {
    return (
      <div className="mt-3 space-y-2">
        {block.items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 text-sm leading-6">
            <Icon
              name={item.checked ? "SquareCheck" : "Square"}
              size={16}
              className="mt-1 flex-shrink-0"
              style={{ color: item.checked ? "var(--accent)" : "var(--text-tertiary)" }}
            />
            <span style={{ color: item.checked ? "var(--text-tertiary)" : "var(--text-secondary)" }}>
              {renderInline(item.text)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="mt-4 overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: "var(--bg-card)" }}>
              {block.header.map((cell, index) => (
                <th key={index} className="border-b px-3 py-2 text-left text-xs font-semibold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`px-3 py-2 align-top ${rowIndex < block.rows.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <div className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{renderInline(block.text)}</div>
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
  const projectLink = getProjectLink(data.projectUrl);

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

        {projectLink && (
          <a
            href={projectLink.href}
            target="_blank"
            rel="noopener noreferrer"
            title={projectLink.href}
            aria-label={`${projectLink.label}: ${projectLink.href}`}
            className="mb-6 flex max-w-2xl items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              borderColor: "color-mix(in srgb, var(--accent) 42%, var(--border-subtle))",
              outlineColor: "var(--accent)",
            }}
          >
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--accent)", color: "#f8fafc" }}
            >
              <Icon name={projectLink.isFigma ? "PenTool" : "ExternalLink"} size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {projectLink.label}
              </span>
              <span className="mt-0.5 block truncate text-sm" style={{ color: "var(--accent)" }}>
                {projectLink.displayUrl}
              </span>
            </span>
            <Icon name="ArrowUpRight" size={18} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
          </a>
        )}

        <div className="max-w-2xl pb-6">
          {(data.blocks || []).map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)}
        </div>
      </div>
    </div>
  );
}
