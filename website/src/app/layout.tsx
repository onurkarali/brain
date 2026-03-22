import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brain Memory — Memory for AI Agents",
  description:
    "A hierarchical, file-system-based memory system for AI coding agents. Inspired by human neuroscience — memories decay, strengthen through recall, and connect via associative networks.",
  keywords: [
    "brain-memory",
    "AI agent memory",
    "Claude Code",
    "Gemini CLI",
    "OpenAI Codex",
    "neuroscience",
    "spaced repetition",
    "hierarchical memory",
    "context engineering",
  ],
  authors: [{ name: "Omelas" }],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Brain Memory — Memory for AI Agents",
    description:
      "A hierarchical, file-system-based memory system for AI coding agents inspired by human neuroscience.",
    type: "website",
    url: "https://brainmemory.work",
    images: [{ url: "/icon.png", width: 766, height: 763 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF9F7] text-[#191716] antialiased">{children}</body>
    </html>
  );
}
