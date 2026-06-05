import type { MDXComponents } from "mdx/types";
import { Icon } from "@/components/Icon";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mt-6 mb-3" style={{ color: "var(--text-primary)" }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mt-5 mb-2.5" style={{ color: "var(--text-primary)" }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: "var(--text-primary)" }}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className="pl-4 py-2 my-3 border-l-[3px] rounded-r-md text-sm italic leading-relaxed"
        style={{
          borderColor: "var(--accent)",
          background: "var(--bg-hover)",
          color: "var(--text-secondary)",
        }}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 space-y-1.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 space-y-1.5 list-none">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--text-tertiary)" }} />
        <span className="leading-relaxed">{children}</span>
      </li>
    ),
    hr: () => (
      <div className="my-5 border-t" style={{ borderColor: "var(--border-subtle)" }} />
    ),
    pre: ({ children }) => (
      <div className="mb-4 rounded-lg overflow-hidden" style={{ background: "#1e1e2e" }}>
        {children}
      </div>
    ),
    code: ({ className, children }) => {
      const isBlock = className?.startsWith("language-");
      const lang = className?.replace("language-", "") ?? "";
      if (isBlock) {
        return (
          <>
            <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#16161e" }}>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                {lang}
              </span>
            </div>
            <pre className="p-3 overflow-x-auto m-0">
              <code className="text-xs font-mono leading-relaxed" style={{ color: "#a6accd" }}>
                {children}
              </code>
            </pre>
          </>
        );
      }
      return (
        <code
          className="text-xs font-mono px-1 py-0.5 rounded"
          style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
        >
          {children}
        </code>
      );
    },
    img: ({ src, alt }) => (
      <figure className="mb-4">
        <img src={src} alt={alt ?? ""} className="w-full rounded-lg" draggable={false} />
        {alt && (
          <figcaption className="text-xs text-center mt-1.5" style={{ color: "var(--text-tertiary)" }}>
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    // Custom components usable in MDX files
    Callout: ({ icon = "Lightbulb", children }: { icon?: string; children: React.ReactNode }) => (
      <div
        className="flex items-start gap-3 p-3 rounded-lg mb-3"
        style={{ background: "var(--bg-hover)" }}
      >
        <div className="mt-0.5 flex-shrink-0">
          <Icon name={icon} size={16} style={{ color: "var(--accent)" }} />
        </div>
        <span className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {children}
        </span>
      </div>
    ),
    ...components,
  };
}
