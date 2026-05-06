import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    title: "Brain Memory — Memory for AI Agents",
    description:
      "A hierarchical, file-system-based memory system for AI coding agents inspired by human neuroscience.",
    type: "website",
    url: "https://brainmemory.work",
    images: [{ url: "/icon.png", width: 1024, height: 1024 }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0E0D" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jbmono.variable}`}>
      <body className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
