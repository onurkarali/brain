"use client";

import { useState, ReactNode } from "react";

interface CodeBlockProps {
  title?: string;
  children: ReactNode;
}

export default function CodeBlock({ title, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    // Find the code text within children
    const codeElement = document.querySelector(
      "[data-code-block-active] code"
    );
    if (codeElement) {
      navigator.clipboard.writeText(codeElement.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="group relative my-4" data-code-block-active="">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-[#E8E3DC] bg-[#F0ECE7] px-4 py-2">
          <span className="text-xs font-medium text-[#6B6662]">{title}</span>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`absolute right-3 top-3 rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300 opacity-0 transition-all hover:bg-gray-600 hover:text-gray-100 group-hover:opacity-100 ${
          title ? "top-12" : ""
        }`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      {/* Code content */}
      <div
        className={`overflow-x-auto [&>pre]:!my-0 ${
          title ? "[&>pre]:!rounded-t-none" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
