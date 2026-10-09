"use client";

import { FormEvent, useSyncExternalStore, useState } from "react";
import { Icon } from "@/components/Icon";
import { CmsEntry, DEFAULT_PORTFOLIO_PASSCODE, PortfolioEntryData } from "@/lib/cms";
import { renderInline } from "@/lib/inline-markdown";
import { NotionBlock } from "@/lib/types";

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span className="break-words text-sm font-medium leading-5 sm:text-[15px]" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

type ProjectLink = { href: string; isFigma: boolean };

function getProjectLink(value?: string): ProjectLink | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    const hostname = url.hostname.replace(/^www\./, "");
    const isFigma = hostname === "figma.com" || hostname.endsWith(".figma.com");

    return { href: url.toString(), isFigma };
  } catch {
    return null;
  }
}

const PASSCODE_STORAGE_PREFIX = "portfolio-project-passcode:";

/** Static label shown for the project link (the raw URL stays in `href`). */
const PROJECT_LINK_LABEL = "Project Link";

function subscribePasscodeUnlock(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStoredUnlock(storageKey: string) {
  try {
    return window.sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function writeStoredUnlock(storageKey: string) {
  try {
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Persistence is a nicety; the link stays unlocked for this mount either way.
  }
}

function ProjectLinkButton({
  link,
  entryId,
  passcode,
  gated,
}: {
  link: ProjectLink;
  entryId: string;
  passcode?: string;
  gated: boolean;
}) {
  const requiredPasscode = passcode && passcode.length > 0 ? passcode : DEFAULT_PORTFOLIO_PASSCODE;
  const storageKey = `${PASSCODE_STORAGE_PREFIX}${entryId}`;
  const [unlockedByUser, setUnlockedByUser] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const unlockedInSession = useSyncExternalStore(
    subscribePasscodeUnlock,
    () => readStoredUnlock(storageKey),
    () => false
  );
  const unlocked = !gated || unlockedByUser || unlockedInSession;

  function submitPasscode(event: FormEvent) {
    event.preventDefault();
    if (typed === requiredPasscode) {
      setUnlockedByUser(true);
      setError("");
      writeStoredUnlock(storageKey);
      return;
    }
    setError("Incorrect passcode. Try again.");
  }

  if (gated && !unlocked) {
    return (
      <form
        onSubmit={submitPasscode}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full min-w-0 flex-col gap-2 rounded-lg border px-3 py-2.5 lg:w-80 lg:shrink-0"
        style={{
          background: "color-mix(in srgb, var(--accent) 12%, transparent)",
          borderColor: "color-mix(in srgb, var(--accent) 42%, var(--border-subtle))",
        }}
      >
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--accent)" }}>
          <Icon name="Lock" size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
          {PROJECT_LINK_LABEL}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <input
            type="password"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              if (error) setError("");
            }}
            placeholder="Enter passcode"
            autoComplete="off"
            spellCheck={false}
            aria-label="Project link passcode"
            className="min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm outline-none"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            className="flex-shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:brightness-110"
            style={{
              background: "color-mix(in srgb, var(--accent) 18%, transparent)",
              borderColor: "color-mix(in srgb, var(--accent) 42%, var(--border-subtle))",
              color: "var(--accent)",
            }}
          >
            Unlock
          </button>
        </div>
        {error ? (
          <span className="text-xs" style={{ color: "#fda4af" }}>{error}</span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            This project link is passcode protected.
          </span>
        )}
      </form>
    );
  }

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      title={link.href}
      aria-label={`${PROJECT_LINK_LABEL}: ${link.href}`}
      className="flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 lg:w-auto lg:max-w-80 lg:shrink-0"
      style={{
        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
        borderColor: "color-mix(in srgb, var(--accent) 42%, var(--border-subtle))",
        outlineColor: "var(--accent)",
      }}
    >
      <Icon name={link.isFigma ? "PenTool" : "ExternalLink"} size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
      <span className="min-w-0 truncate text-sm font-medium" style={{ color: "var(--accent)" }}>
        {PROJECT_LINK_LABEL}
      </span>
      <Icon name="ArrowUpRight" size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
    </a>
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
    <div className="h-full min-h-0 flex flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <div className="relative h-40 flex-shrink-0 overflow-hidden">
        {data.banner ? (
          <img src={data.banner} alt={data.title || entry.title} className="h-full w-full object-cover" draggable={false} />
        ) : null}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg-app) 0%, transparent 60%)" }} />
      </div>

      <div
        className="relative -mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 sm:px-8"
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      >
        <h1 className="mb-5 break-words text-2xl font-bold leading-tight sm:text-3xl" style={{ color: "var(--text-primary)", textWrap: "balance" }}>
          {data.title || entry.title}
        </h1>

        <div className="mb-6 flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:flex lg:flex-1 lg:flex-wrap lg:gap-x-6">
            {(data.meta || []).map((item) => <MetaBadge key={item.label} label={item.label} value={item.value} />)}
          </div>

          {projectLink && (
            <ProjectLinkButton
              link={projectLink}
              entryId={entry.id}
              passcode={data.passcode}
              gated={Boolean(data.passcodeToAccess)}
            />
          )}
        </div>

        <div className="max-w-2xl pb-6">
          {(data.blocks || []).map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)}
        </div>
      </div>
    </div>
  );
}
