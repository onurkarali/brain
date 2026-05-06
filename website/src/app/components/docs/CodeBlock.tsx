"use client";

import { useState, ReactNode } from "react";

interface CodeBlockProps {
  title?: string;
  children: ReactNode;
}

export default function CodeBlock({ title, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
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
      {title && (
        <div className="flex items-center justify-between rounded-t-md border border-b-0 border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {title}
          </span>
        </div>
      )}

      <button
        onClick={handleCopy}
        className={`absolute right-2 ${title ? "top-10" : "top-2"} font-mono text-[10px] uppercase tracking-wider rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[var(--text-secondary)] opacity-0 transition-all hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] group-hover:opacity-100`}
      >
        {copied ? "copied" : "copy"}
      </button>

      <div
        className={`overflow-x-auto [&>pre]:!my-0 ${title ? "[&>pre]:!rounded-t-none" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
