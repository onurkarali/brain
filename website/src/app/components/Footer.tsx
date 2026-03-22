import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#E8E3DC]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Brain Memory"
              width={28}
              height={28}
              className="rounded-[6px]"
            />
            <span className="text-[#918C87] text-sm">
              &copy; {new Date().getFullYear()} Omelas. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/docs" className="text-[#918C87] hover:text-[#191716] transition-colors text-sm">
              Docs
            </Link>
            <a href="https://github.com/onurkarali/brain" target="_blank" rel="noopener noreferrer" className="text-[#918C87] hover:text-[#191716] transition-colors text-sm">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/brain-memory" target="_blank" rel="noopener noreferrer" className="text-[#918C87] hover:text-[#191716] transition-colors text-sm">
              npm
            </a>
            <Link href="/privacy" className="text-[#918C87] hover:text-[#191716] transition-colors text-sm">
              Privacy Policy
            </Link>
            <a href="https://omelas.tech" target="_blank" rel="noopener noreferrer" className="text-[#918C87] hover:text-[#191716] transition-colors text-sm">
              Omelas
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
