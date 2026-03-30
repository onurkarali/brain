"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative z-10 border-b border-[#E8E3DC]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="Brain Memory"
            width={36}
            height={36}
            className="rounded-[8px]"
          />
          <span className="text-lg font-semibold text-[#191716]">Brain Memory</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/docs" className="text-[#6B6662] hover:text-[#191716] transition-colors text-sm">
            Docs
          </Link>
          <a href="https://github.com/onurkarali/brain" target="_blank" rel="noopener noreferrer" className="text-[#6B6662] hover:text-[#191716] transition-colors text-sm">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/brain-memory" target="_blank" rel="noopener noreferrer" className="text-[#6B6662] hover:text-[#191716] transition-colors text-sm">
            npm
          </a>
          <a href="https://omelas.tech" target="_blank" rel="noopener noreferrer" className="text-[#6B6662] hover:text-[#191716] transition-colors text-sm">
            Omelas
          </a>
          <a href="https://app.brainmemory.work/login" className="inline-flex items-center gap-2 rounded-full bg-[#B5845A] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#9E7048] hover:shadow-md">
            Login
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-[#918C87] transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-[#918C87] transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-[#918C87] transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#E8E3DC] bg-white">
          <div className="flex flex-col px-6 py-4 gap-4">
            <Link
              href="/docs"
              className="text-[#6B6662] hover:text-[#191716] transition-colors py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Docs
            </Link>
            <a
              href="https://github.com/onurkarali/brain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6662] hover:text-[#191716] transition-colors py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/brain-memory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6662] hover:text-[#191716] transition-colors py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              npm
            </a>
            <a
              href="https://omelas.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6662] hover:text-[#191716] transition-colors py-2 text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Omelas
            </a>
            <a
              href="https://app.brainmemory.work/login"
              className="inline-flex items-center justify-center rounded-full bg-[#B5845A] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#9E7048]"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
