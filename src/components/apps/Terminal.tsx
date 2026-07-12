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
    "",
    "  ✨ psst... try 'tahubulat' or 'merdeka'",
  ],
  whoami: () => ["guest"],
  date: () => [new Date().toString()],
  ls: () => [
    "Desktop       Documents     Downloads",
    "Applications  Projects      CV.pdf",
  ],
  pwd: () => ["/Users/guest"],
  echo: (args) => [args.join(" ") || ""],
  cat: (args) => {
    const file = args[0];
    if (!file) return ["Usage: cat <file>"];
    const files: Record<string, string[]> = {
      "CV.pdf": ["[PDF Content - Binary data]"],
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
    "   cKMMMMMMMMMMNWMMMMMMMMMM0:    DE: Next.js 16.2.6",
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

// --- Animated commands -----------------------------------------------------
// These break out of the synchronous string[] model: they push frames over
// time via the provided context. `block` lines are transient (a live-updating
// frame), `commit` lines are appended permanently to the scrollback.
interface AnimCtx {
  setBlock: (lines: string[]) => void;
  commit: (lines: string[]) => void;
  sleep: (ms: number) => Promise<void>;
  signal: { aborted: boolean };
}

const ANIMATED: Record<string, (args: string[], ctx: AnimCtx) => Promise<void>> = {
  // 🥔 Tahu Bulat — tribute to the legendary Indonesian mobile game
  tahubulat: async (_args, { setBlock, commit, sleep, signal }) => {
    commit(["", "🥔 TAHU BULAT — Digoreng Dadakan™", "════════════════════════════════"]);

    const oilRows = [
      "~~~~~~~~~~~~~~~~",
      "~ ° ~ . ~ ° ~ .~",
      "~~ . ~~ ° ~~ . ~",
      "° ~~ . ~~ ° ~~ .",
    ];
    const tahuRows = [
      "( O   o    O  )",
      "(  o   O   o  )",
      "( o    O    O )",
      "(  O   o   o  )",
    ];

    const FRY_TOTAL = 14;
    for (let t = 1; t <= FRY_TOTAL; t++) {
      if (signal.aborted) break;
      const filled = Math.round((t / FRY_TOTAL) * 14);
      const bar = "▰".repeat(filled) + "▱".repeat(14 - filled);
      const pct = Math.round((t / FRY_TOTAL) * 100);
      setBlock([
        "    .-= MENGGORENG =-.",
        "     " + oilRows[t % oilRows.length],
        "     " + tahuRows[t % tahuRows.length],
        "     " + oilRows[(t + 1) % oilRows.length],
        "     ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾",
        "       🔥   🔥   🔥",
        `   [${bar}] ${pct}%`,
      ]);
      await sleep(150);
    }

    setBlock([]);
    const jingle = [
      "",
      "       ✨  MATANG!  ✨",
      "",
      "🎵 Tahu bulat...",
      "🎵 digoreng dadakan...",
      "🎵 lima ratusan...",
      "🎵 gurih gurih nyoooy~ 😋",
      "",
      "Tahu bulat siap! Beli, Mas? 🥔🔥",
    ];
    for (const line of jingle) {
      if (signal.aborted) break;
      commit([line]);
      await sleep(line.startsWith("🎵") ? 420 : 240);
    }
  },

  // 🇮🇩 Merdeka — a little Independence Day flag raise
  merdeka: async (_args, { setBlock, commit, sleep, signal }) => {
    commit(["", "🇮🇩  DIRGAHAYU REPUBLIK INDONESIA  🇮🇩", ""]);

    const waves = [
      [
        "  ┃▛▀▀▀▀▀▀▀▀▜",
        "  ┃█████████▓",
        "  ┃█████████▒",
        "  ┃░░░░░░░░░▒",
        "  ┃░░░░░░░░░▓",
        "  ┃▙▄▄▄▄▄▄▄▄▟",
        "  ┃",
        " ═╩═",
      ],
      [
        "  ┃▛▀▀▀▀▀▀▀▀▜",
        "  ┃█████████▒",
        "  ┃█████████▓",
        "  ┃░░░░░░░░░▓",
        "  ┃░░░░░░░░░▒",
        "  ┃▙▄▄▄▄▄▄▄▄▟",
        "  ┃",
        " ═╩═",
      ],
    ];
    for (let t = 0; t < 8; t++) {
      if (signal.aborted) break;
      setBlock(waves[t % waves.length]);
      await sleep(260);
    }

    setBlock([]);
    const finale = [
      "",
      "       M E R D E K A !",
      "      🎉  🎉  🎉  🎉",
      "",
      "Sekali merdeka, tetap merdeka! 🔴⚪",
    ];
    for (const line of finale) {
      if (signal.aborted) break;
      commit([line]);
      await sleep(280);
    }
  },
};

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: "init1", type: "output", text: "Last login: " + new Date().toLocaleString() },
    { id: "init2", type: "output", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [animating, setAnimating] = useState(false);
  const [animBlock, setAnimBlock] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const nextId = () => `l${++idRef.current}`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, animBlock]);

  // Abort any running animation if the terminal unmounts
  useEffect(() => {
    const ref = abortRef;
    return () => {
      ref.current.aborted = true;
    };
  }, []);

  const runAnimated = async (cmd: string, args: string[]) => {
    setAnimating(true);
    const signal = { aborted: false };
    abortRef.current = signal;

    const ctx: AnimCtx = {
      setBlock: (l) => setAnimBlock(l),
      commit: (l) =>
        setLines((prev) => [
          ...prev,
          ...l.map((text) => ({ id: nextId(), type: "output" as const, text })),
        ]),
      sleep: (ms) => new Promise((res) => setTimeout(res, ms)),
      signal,
    };

    try {
      await ANIMATED[cmd](args, ctx);
    } finally {
      setAnimBlock([]);
      setAnimating(false);
      // refocus the prompt once the show is over
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleSubmit = () => {
    const raw = input;
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    setLines((prev) => [...prev, { id: nextId(), type: "input", text: raw }]);
    setInput("");

    if (!raw.trim()) return;

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    if (ANIMATED[cmd]) {
      runAnimated(cmd, args);
      return;
    }

    const handler = COMMANDS[cmd];
    if (handler) {
      const outputs = handler(args);
      setLines((prev) => [
        ...prev,
        ...outputs.map((text) => ({ id: nextId(), type: "output" as const, text })),
      ]);
    } else {
      setLines((prev) => [
        ...prev,
        { id: nextId(), type: "error", text: `zsh: command not found: ${cmd}` },
      ]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  // Esc skips a running animation
  const handleContainerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (animating && e.key === "Escape") {
      abortRef.current.aborted = true;
    }
  };

  return (
    <div
      className="h-full flex flex-col terminal-bg text-white/90"
      onKeyDown={handleContainerKeyDown}
      onClick={() => !animating && inputRef.current?.focus()}
    >
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
            {line.type === "input" && <span className="text-green-500 mr-2">➜</span>}
            {line.text}
          </div>
        ))}

        {/* Transient animation frame */}
        {animating &&
          animBlock.map((text, i) => (
            <div key={`anim-${i}`} className="whitespace-pre-wrap break-words text-yellow-300/90">
              {text}
            </div>
          ))}

        {animating ? (
          <div className="text-white/30 text-xs mt-1">running… (press Esc to skip)</div>
        ) : (
          <div className="flex items-center text-sm">
            <span className="text-green-500 mr-2">➜</span>
            <span className="text-blue-400 mr-2">~</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-white/80 font-mono"
              autoFocus
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
