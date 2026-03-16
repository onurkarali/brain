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
        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <span className="hidden sm:inline">Search docs...</span>
        <kbd className="hidden rounded border border-gray-600 bg-gray-700/50 px-1.5 py-0.5 text-xs text-gray-400 sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-700 px-4">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent px-3 py-4 text-sm text-gray-100 placeholder-gray-500 outline-none"
          />
          <kbd className="rounded border border-gray-600 bg-gray-700/50 px-1.5 py-0.5 text-xs text-gray-400">
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto p-2">
            {results.map((result, index) => (
              <li key={result.href}>
                <button
                  onClick={() => navigate(result.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-amber-500/10 text-gray-100"
                      : "text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  <span className="text-sm font-medium">{result.title}</span>
                  <span className="mt-0.5 text-xs text-gray-500">
                    {result.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* No Results */}
        {query.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No results found for &quot;{query}&quot;
          </div>
        )}

        {/* Empty State */}
        {!query.trim() && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Type to search the documentation
          </div>
        )}
      </div>
    </div>
  );
}
