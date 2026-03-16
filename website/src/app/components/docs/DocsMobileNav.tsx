"use client";

import { useState } from "react";
import DocsNav from "./DocsNav";

export default function DocsMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-300 hover:border-gray-700 transition-colors"
      >
        <span>Navigation</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900/80 p-4 backdrop-blur-sm">
          <div onClick={() => setIsOpen(false)}>
            <DocsNav />
          </div>
        </div>
      )}
    </div>
  );
}
