"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]/85 backdrop-blur-xl border-b border-[var(--border)]">
      <nav className="max-w-3xl mx-auto flex items-center justify-between px-5 sm:px-6 h-14">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/icon.svg"
            alt="Brain Memory"
            width={24}
            height={24}
            className="rounded-[6px]"
          />
          <span className="font-mono text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            brain memory
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/docs"
            className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            docs
          </Link>
          <a
            href="https://github.com/onurkarali/brain"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            github
          </a>
          <a
            href="https://www.npmjs.com/package/brain-memory"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            npm
          </a>
          <a
            href="https://omelas.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            omelas
          </a>
          <a
            href="https://app.brainmemory.work/login"
            className="font-mono text-xs font-medium bg-[var(--text-primary)] text-[var(--bg)] hover:bg-[var(--accent)] transition-colors px-3 py-1.5 rounded-md"
          >
            login
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-px bg-[var(--text-secondary)] transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-px bg-[var(--text-secondary)] transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-[var(--text-secondary)] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="flex flex-col px-5 py-3 gap-1">
            <Link href="/docs" className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2" onClick={() => setIsMenuOpen(false)}>docs</Link>
            <a href="https://github.com/onurkarali/brain" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2" onClick={() => setIsMenuOpen(false)}>github</a>
            <a href="https://www.npmjs.com/package/brain-memory" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2" onClick={() => setIsMenuOpen(false)}>npm</a>
            <a href="https://omelas.tech" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2" onClick={() => setIsMenuOpen(false)}>omelas</a>
            <a href="https://app.brainmemory.work/login" className="font-mono text-xs font-medium bg-[var(--text-primary)] text-[var(--bg)] hover:bg-[var(--accent)] transition-colors px-3 py-2 rounded-md text-center mt-2" onClick={() => setIsMenuOpen(false)}>login</a>
          </div>
        </div>
      )}
    </header>
  );
}
