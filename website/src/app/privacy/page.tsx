import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Brain Memory",
  description: "Privacy policy for the Brain Memory website.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="border-b border-[#E8E3DC]">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-[#191716]">
            Brain Memory
          </Link>
          <Link
            href="/"
            className="text-sm text-[#6B6662] hover:text-[#191716] transition-colors"
          >
            Back to Home
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#191716] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#918C87] mb-12">Last updated: March 2026</p>

        <div className="space-y-8 text-[#6B6662] leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-semibold text-[#191716] mb-2">No tracking</h2>
            <p>
              This website does not use cookies, analytics, or tracking of any kind.
              No personal data is collected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#191716] mb-2">Local-first data</h2>
            <p>
              All memory data is stored locally in <code className="bg-[#F0ECE7] text-[#9E7048] px-1.5 py-0.5 rounded text-sm">~/.brain/</code> on
              your machine. Nothing is sent to external servers. The optional <code className="bg-[#F0ECE7] text-[#9E7048] px-1.5 py-0.5 rounded text-sm">/brain:sync</code> feature
              pushes data to a Git remote of your choosing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#191716] mb-2">No telemetry</h2>
            <p>
              The <code className="bg-[#F0ECE7] text-[#9E7048] px-1.5 py-0.5 rounded text-sm">brain-memory</code> npm
              package collects no telemetry, usage data, or analytics. It operates entirely
              offline using local file I/O.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#191716] mb-2">Contact</h2>
            <p>
              <a
                href="mailto:support@omelas.tech"
                className="text-[#B5845A] hover:text-[#9E7048] underline underline-offset-2"
              >
                support@omelas.tech
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#E8E3DC] mt-16">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-[#918C87] text-sm">
          &copy; {new Date().getFullYear()} Omelas. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
