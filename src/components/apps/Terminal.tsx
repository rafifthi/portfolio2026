"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Icon } from "@/components/Icon";
import { TerminalLine } from "@/lib/types";

const COMMANDS: Record<string, (args: string[]) => string[]> = {
  help: () => [
    "Available commands:",
    "  help         Show this help message",
    "  clear        Clear the terminal",
    "  whoami       Display current user",
    "  date         Show current date and time",
    "  ls           List directory contents",
    "  pwd          Print working directory",
    "  echo <text>  Print text to terminal",
    "  cat <file>   Display file contents",
    "  open <app>   Open an application",
    "  neofetch     Display system info",
  ],
  whoami: () => ["guest"],
  date: () => [new Date().toString()],
  ls: () => [
    "Desktop       Documents     Downloads",
    "Applications  Projects      Resume.pdf",
  ],
  pwd: () => ["/Users/guest"],
  echo: (args) => [args.join(" ") || ""],
  cat: (args) => {
    const file = args[0];
    if (!file) return ["Usage: cat <file>"];
    const files: Record<string, string[]> = {
      "Resume.pdf": ["[PDF Content - Binary data]"],
      "README.md": [
        "# Portfolio",
        "",
        "Welcome to my portfolio!",
        "Built with Next.js and inspired by macOS.",
      ],
    };
    return files[file] || [`cat: ${file}: No such file or directory`];
  },
  open: (args) => {
    const app = args[0];
    if (!app) return ["Usage: open <app>"];
    return [`Opening ${app}...`];
  },
  neofetch: () => [
    "                    'c.          guest@portfolio",
    "                 ,xNMM.          ----------------",
    "               .OMMMMo           OS: macOS (Portfolio Web)",
    "               OMMM0,            Shell: zsh (simulated)",
    "     .;loddo:' loolloddol;.      Resolution: Responsive",
    "   cKMMMMMMMMMMNWMMMMMMMMMM0:    DE: Next.js 15",
    " .KMMMMMMMMMMMMMMMMMMMMMMMWd.    WM: Framer Motion",
    " XMMMMMMMMMMMMMMMMMMMMMMMX.      Theme: Dark",
    ";MMMMMMMMMMMMMMMMMMMMMMMM:       CPU: React Virtual DOM",
    ":MMMMMMMMMMMMMMMMMMMMMMMM:       Memory: Unlimited",
    ".MMMMMMMMMMMMMMMMMMMMMMMMX.      Uptime: Forever",
    " kMMMMMMMMMMMMMMMMMMMMMMMMWd.",
    " .XMMMMMMMMMMMMMMMMMMMMMMMMMMk",
    "  .XMMMMMMMMMMMMMMMMMMMMMMMMK.",
    "    kMMMMMMMMMMMMMMMMMMMMMMd",
    "     ;KMMMMMMMWXXWMMMMMMMk.",
    "       .cooc,.    .,coo:.",
  ],
  clear: () => [],
};

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: "init1", type: "output", text: "Last login: " + new Date().toLocaleString() },
    { id: "init2", type: "output", text: "" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const handleSubmit = () => {
    if (!input.trim()) {
      setLines((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "input", text: input },
      ]);
      setInput("");
      return;
    }

    const newLines: TerminalLine[] = [
      { id: Date.now().toString() + "_i", type: "input", text: input },
    ];

    const parts = input.trim().split(" ");
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === "clear") {
      setLines([]);
      setInput("");
      return;
    }

    const handler = COMMANDS[cmd];
    if (handler) {
      const outputs = handler(args);
      outputs.forEach((text, i) => {
        newLines.push({
          id: Date.now().toString() + "_o" + i,
          type: "output",
          text,
        });
      });
    } else {
      newLines.push({
        id: Date.now().toString() + "_e",
        type: "error",
        text: `zsh: command not found: ${cmd}`,
      });
    }

    setLines((prev) => [...prev, ...newLines]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col terminal-bg text-white/90">
      {/* Toolbar */}
      <div className="h-8 flex items-center px-3 bg-[#2d2d2d]/60 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Icon name="Terminal" size={12} />
          <span>guest — zsh — 80×24</span>
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 font-mono text-sm">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap break-words ${
              line.type === "input"
                ? "text-green-400"
                : line.type === "error"
                ? "text-red-400"
                : "text-white/80"
            }`}
          >
            {line.type === "input" && (
              <span className="text-green-500 mr-2">➜</span>
            )}
            {line.text}
          </div>
        ))}
        <div className="flex items-center text-sm">
          <span className="text-green-500 mr-2">➜</span>
          <span className="text-blue-400 mr-2">~</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-white/80 font-mono"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
