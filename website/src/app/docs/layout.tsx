import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DocsNav from "@/app/components/docs/DocsNav";
import DocsMobileNav from "@/app/components/docs/DocsMobileNav";
import SearchDialog from "@/app/components/docs/SearchDialog";
import TableOfContents from "@/app/components/docs/TableOfContents";

export const metadata: Metadata = {
  title: "Documentation - Brain Memory",
  description:
    "Learn how to use Brain Memory — a neuroscience-inspired memory system for AI coding agents.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8E3DC] bg-[#FAF9F7]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-4 sm:px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon.png"
                alt="Brain Memory"
                width={28}
                height={28}
                className="rounded-[6px]"
              />
              <span className="text-sm font-semibold text-[#191716]">
                Brain Memory
              </span>
            </Link>
            <span className="hidden text-[#D0C9C0] sm:inline">/</span>
            <Link
              href="/docs"
              className="hidden text-sm text-[#6B6662] hover:text-[#191716] transition-colors sm:inline"
            >
              Docs
            </Link>
          </div>

          {/* Right: Search + Links */}
          <div className="flex items-center gap-3">
            <SearchDialog />
            <Link
              href="/"
              className="hidden text-sm text-[#6B6662] hover:text-[#191716] transition-colors sm:inline"
            >
              Home
            </Link>
            <a
              href="https://github.com/onurkarali/brain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6662] hover:text-[#191716] transition-colors"
              aria-label="GitHub"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex max-w-[90rem] px-4 sm:px-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E8E3DC]/50">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-6">
            <DocsNav />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-12">
          <DocsMobileNav />
          <article className="prose max-w-3xl prose-headings:scroll-mt-20">
            {children}
          </article>
        </main>

        {/* Table of Contents */}
        <TableOfContents />
      </div>
    </div>
  );
}
