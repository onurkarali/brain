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
        <h1 className="text-4xl font-bold text-[#191716] mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-[#4A4744] leading-relaxed">
          <p>
            <strong className="text-[#191716]">Last updated:</strong> March 2026
          </p>

          <h2 className="text-2xl font-semibold text-[#191716] mt-8">
            No Tracking, No Cookies
          </h2>
          <p>
            The Brain Memory website (brainmemory.work) does not use cookies, analytics,
            tracking pixels, or any other form of user tracking. We do not collect any
            personal data through this website.
          </p>

          <h2 className="text-2xl font-semibold text-[#191716] mt-8">
            Brain Memory Data
          </h2>
          <p>
            Brain Memory is a local-first tool. All memory data is stored on your own
            machine in the <code className="bg-[#F0ECE7] text-[#9E7048] px-1.5 py-0.5 rounded text-sm">~/.brain/</code> directory.
            No memory data is ever sent to our servers or any third-party service.
          </p>
          <p>
            If you use the optional <code className="bg-[#F0ECE7] text-[#9E7048] px-1.5 py-0.5 rounded text-sm">/brain:sync</code> feature,
            your data is pushed to a Git remote of your choosing. We have no access to
            that data.
          </p>

          <h2 className="text-2xl font-semibold text-[#191716] mt-8">
            npm Package
          </h2>
          <p>
            The <code className="bg-[#F0ECE7] text-[#9E7048] px-1.5 py-0.5 rounded text-sm">brain-memory</code> npm
            package does not collect telemetry, usage data, or any other information.
            It operates entirely offline using local file I/O.
          </p>

          <h2 className="text-2xl font-semibold text-[#191716] mt-8">Contact</h2>
          <p>
            If you have questions about this privacy policy, contact us at{" "}
            <a
              href="mailto:support@omelas.tech"
              className="text-[#B5845A] hover:text-[#9E7048] underline underline-offset-2"
            >
              support@omelas.tech
            </a>
            .
          </p>
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
