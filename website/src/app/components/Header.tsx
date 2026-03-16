"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative z-10 border-b border-gray-800/50 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="Brain Memory"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="text-xl font-semibold">Brain Memory</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
            Docs
          </Link>
          <a href="https://github.com/onurkarali/brain" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            GitHub
          </a>
          <a href="https://www.npmjs.com/package/brain-memory" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            npm
          </a>
          <a href="https://omelas.tech" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            Omelas
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-gray-400 transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-gray-400 transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-gray-400 transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-800/50 bg-gray-900/95 backdrop-blur-xl">
          <div className="flex flex-col px-6 py-4 gap-4">
            <Link
              href="/docs"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Docs
            </Link>
            <a
              href="https://github.com/onurkarali/brain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/brain-memory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              npm
            </a>
            <a
              href="https://omelas.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Omelas
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
