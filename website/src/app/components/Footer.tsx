import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8 flex flex-col sm:flex-row justify-between gap-4 font-mono text-xs text-[var(--text-tertiary)]">
        <span>&copy; {new Date().getFullYear()} omelas</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/docs" className="hover:text-[var(--text-primary)] transition-colors">docs</Link>
          <a href="https://github.com/onurkarali/brain" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">github</a>
          <a href="https://www.npmjs.com/package/brain-memory" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">npm</a>
          <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">privacy</Link>
          <a href="https://omelas.tech" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">omelas</a>
        </div>
      </div>
    </footer>
  );
}
