import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800/50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Brain Memory"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-gray-500">
              &copy; {new Date().getFullYear()} Omelas. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/docs" className="text-gray-500 hover:text-white transition-colors">
              Docs
            </Link>
            <a href="https://github.com/onurkarali/brain" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/brain-memory" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              npm
            </a>
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <a href="https://omelas.tech" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              Omelas
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
