"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";

interface SearchEntry {
  title: string;
  description: string;
  href: string;
  category: string;
  content?: string;
}

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchIndex, setSearchIndex] = useState<Fuse<SearchEntry> | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load search index
  useEffect(() => {
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchEntry[]) => {
        const fuse = new Fuse(data, {
          keys: [
            { name: "title", weight: 0.4 },
            { name: "description", weight: 0.3 },
            { name: "content", weight: 0.2 },
            { name: "category", weight: 0.1 },
          ],
          threshold: 0.4,
          includeScore: true,
        });
        setSearchIndex(fuse);
      })
      .catch(() => {
        // Search index not available yet
      });
  }, []);

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search
  useEffect(() => {
    if (!searchIndex || !query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    const fuseResults = searchIndex.search(query, { limit: 8 });
    setResults(fuseResults.map((r) => r.item));
    setSelectedIndex(0);
  }, [query, searchIndex]);

  const navigate = useCallback(
    (href: string) => {
      setIsOpen(false);
      router.push(href);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].href);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span className="hidden sm:inline">search docs</span>
        <kbd className="hidden sm:inline rounded border border-[var(--border)] bg-[var(--surface-2)] px-1 py-0.5 text-[10px] text-[var(--text-tertiary)]">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-lg mx-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
        <div className="flex items-center border-b border-[var(--border)] px-4">
          <svg className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent px-3 py-3.5 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
          />
          <kbd className="rounded border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">esc</kbd>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto p-2">
            {results.map((result, index) => (
              <li key={result.href}>
                <button
                  onClick={() => navigate(result.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full flex-col rounded px-3 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="text-sm font-medium">{result.title}</span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                    {result.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center font-mono text-xs text-[var(--text-tertiary)]">
            no results for &quot;{query}&quot;
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-8 text-center font-mono text-xs text-[var(--text-tertiary)]">
            type to search the documentation
          </div>
        )}
      </div>
    </div>
  );
}
