"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

export default function Mail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() && !body.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSubject("");
      setBody("");
    }, 3000);
  };

  return (
    <div
      className="h-full flex flex-col transition-colors duration-300"
      style={{ background: "var(--bg-app)", color: "var(--text-primary)" }}
    >
      {/* Toolbar */}
      <div
        className="h-11 flex items-center px-4 border-b justify-between transition-colors duration-300"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          New Message
        </span>
        <button
          onClick={handleSend}
          className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ background: "#007aff", color: "#fff" }}
        >
          Send
        </button>
      </div>

      {/* Compose Form */}
      <div className="flex-1 flex flex-col overflow-auto">
        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <Icon name="Check" size={24} style={{ color: "#10b981" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Message sent to rafifthii@gmail.com
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* To field - locked */}
            <div
              className="flex items-center gap-3 px-4 py-3 text-sm border-b transition-colors duration-300"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="text-xs font-medium w-16" style={{ color: "var(--text-tertiary)" }}>
                To:
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
              >
                rafifthii@gmail.com
              </span>
            </div>

            {/* Subject */}
            <div
              className="flex items-center gap-3 px-4 py-3 text-sm border-b transition-colors duration-300"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="text-xs font-medium w-16" style={{ color: "var(--text-tertiary)" }}>
                Subject:
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--text-tertiary)] transition-colors duration-300"
                style={{ color: "var(--text-primary)" }}
              />
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 min-h-[200px] p-4 bg-transparent outline-none text-sm leading-relaxed resize-none placeholder:text-[var(--text-tertiary)] transition-colors duration-300"
              style={{ color: "var(--text-primary)" }}
              placeholder="Write your message here..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
