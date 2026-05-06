"use client";

import { useState } from "react";
import DocsNav from "./DocsNav";

export default function DocsMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors"
      >
        <span>navigation</span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
      </button>
      {isOpen && (
        <div className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <div onClick={() => setIsOpen(false)}>
            <DocsNav />
          </div>
        </div>
      )}
    </div>
  );
}
