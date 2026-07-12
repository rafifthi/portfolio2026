"use client";

import { Icon } from "@/components/Icon";

export default function CV() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#f5f5f5" }}>
      {/* Toolbar */}
      <div className="h-10 flex items-center px-4 border-b bg-white gap-2">
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <Icon name="Printer" size={14} />
        </button>
        <a
          href="/ATS PM Q3 2026 - Rafif Fathi.pdf"
          download
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
        >
          <Icon name="Download" size={14} />
        </a>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">ATS PM Q3 2026 - Rafif Fathi.pdf</span>
      </div>

      {/* CV Document */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="/ATS PM Q3 2026 - Rafif Fathi.pdf"
          className="w-full h-full border-none"
          title="CV - Rafif Fathi Misbah"
        />
      </div>
    </div>
  );
}
