import { ReactNode } from "react";

/**
 * Minimal inline-markdown renderer for block text: `code`, **bold**,
 * *italic*, [link](url). No nesting — token contents render as plain text.
 */
const INLINE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(text.slice(cursor, index));
    }

    const [full, code, bold, italic, linkText, linkHref] = match;
    const key = `${index}-${full.length}`;

    if (code) {
      nodes.push(
        <code
          key={key}
          className="rounded px-1 py-0.5 text-[0.85em]"
          style={{ background: "var(--bg-input)" }}
        >
          {code.slice(1, -1)}
        </code>
      );
    } else if (bold) {
      nodes.push(<strong key={key}>{bold.slice(2, -2)}</strong>);
    } else if (italic) {
      nodes.push(<em key={key}>{italic.slice(1, -1)}</em>);
    } else {
      nodes.push(
        <a
          key={key}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
          style={{ color: "var(--accent)" }}
        >
          {linkText}
        </a>
      );
    }

    cursor = index + full.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}
