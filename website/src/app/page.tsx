"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Orbs Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb orb-1" />
        <div className="floating-orb orb-2" />
        <div className="floating-orb orb-3" />
      </div>

      <Header />

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Hero Section */}
        <section className="py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl fade-in">
                Memory for
                <br />
                <span className="gradient-text-brain">AI Agents</span>
              </h1>
              <p className="mt-6 text-lg text-gray-400 max-w-xl fade-in fade-in-delay-1">
                A hierarchical, file-system-based memory system inspired by human
                neuroscience. Your AI agents remember decisions, learn from
                experience, and build expertise over time.
              </p>
              <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start fade-in fade-in-delay-2">
                <Link
                  href="/docs"
                  className="btn-primary inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 font-semibold text-white hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
                <CopyButton />
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start fade-in fade-in-delay-3">
                <img
                  src="https://img.shields.io/npm/v/brain-memory"
                  alt="npm version"
                  className="h-5"
                />
                <img
                  src="https://github.com/onurkarali/brain/actions/workflows/ci.yml/badge.svg"
                  alt="CI"
                  className="h-5"
                />
                <img
                  src="https://img.shields.io/npm/l/brain-memory"
                  alt="license"
                  className="h-5"
                />
              </div>
            </div>

            {/* Brain Icon Hero */}
            <div className="hidden lg:flex justify-center fade-in fade-in-delay-3">
              <div className="relative">
                <Image
                  src="/icon.png"
                  alt="Brain Memory"
                  width={300}
                  height={300}
                  className="relative z-10 rounded-[54px]"
                  style={{
                    filter: "drop-shadow(0 0 40px rgba(245, 158, 11, 0.3))",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-gray-800/50 py-20 lg:py-28">
          <h2 className="text-center text-3xl font-bold mb-4">
            <span className="gradient-text">Features</span>
          </h2>
          <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
            Neuroscience-inspired memory for your AI coding agents
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<HierarchicalIcon />}
              title="Hierarchical Memory"
              description="The directory tree IS the semantic structure. Browse your AI's brain in any file explorer."
            />
            <FeatureCard
              icon={<DecayIcon />}
              title="Strength & Decay"
              description="Memories naturally fade over time. Recalled memories get stronger. Just like your brain."
            />
            <FeatureCard
              icon={<AssociativeIcon />}
              title="Associative Network"
              description="Memories link to each other with weighted connections. Recalling one activates related ones."
            />
            <FeatureCard
              icon={<SpacedIcon />}
              title="Spaced Reinforcement"
              description="Longer intervals between recalls produce larger boosts. Cramming yields diminishing returns."
            />
            <FeatureCard
              icon={<CognitiveIcon />}
              title="Cognitive Types"
              description="Episodic, semantic, and procedural memories each decay differently, mirroring human cognition."
            />
            <FeatureCard
              icon={<CrossAgentIcon />}
              title="Cross-Agent"
              description="Works with Claude Code, Gemini CLI, and OpenAI Codex CLI. One brain, all agents."
            />
            <FeatureCard
              icon={<SleepIcon />}
              title="Sleep & Consolidation"
              description="A 9-phase maintenance cycle inspired by how brains reorganize during sleep."
            />
            <FeatureCard
              icon={<SyncIcon />}
              title="Portable Sync"
              description="Sync memories across devices via Git remote or encrypted export/import."
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-gray-800/50 py-20 lg:py-28">
          <h2 className="text-center text-3xl font-bold mb-12">
            <span className="gradient-text">How It Works</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10">
            {[
              "Create",
              "Store",
              "Decay",
              "Recall",
              "Reinforce",
              "Review",
              "Sleep",
              "Archive",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3 md:gap-4">
                <div className="lifecycle-step glass-card rounded-full px-4 py-2 text-sm font-medium text-gray-300 whitespace-nowrap">
                  {step}
                </div>
                {i < 7 && (
                  <div className="hidden md:block w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-amber-500/40" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 max-w-3xl mx-auto">
            Memories are created during conversations, stored as Markdown files
            with YAML frontmatter, and naturally decay over time following
            Ebbinghaus&apos;s forgetting curve. When recalled, they strengthen
            through spaced reinforcement. Periodic review sessions surface
            fading memories, and the sleep cycle consolidates, reorganizes, and
            prunes the entire memory graph -- just like the human brain during
            REM sleep. Weak or irrelevant memories are archived, keeping the
            active brain lean and relevant.
          </p>
        </section>

        {/* Benchmark Results */}
        <section className="border-t border-gray-800/50 py-20 lg:py-28">
          <h2 className="text-center text-3xl font-bold mb-4">
            <span className="gradient-text">Empirically Proven</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Agents with Brain Memory produce more consistent and more successful
            outputs.{" "}
            <a
              href="https://github.com/onurkarali/brain/tree/main/benchmark"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              See the benchmark
            </a>
          </p>

          {/* Summary Cards */}
          <div className="grid gap-6 sm:grid-cols-3 mb-10 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold gradient-text-brain mb-1">
                +18.3%
              </div>
              <div className="text-sm text-gray-400">
                Average Consistency Improvement
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold gradient-text-brain mb-1">
                +33.3%
              </div>
              <div className="text-sm text-gray-400">
                Success Improvement
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold gradient-text-brain mb-1">
                3 / 3
              </div>
              <div className="text-sm text-gray-400">
                Agents Improved
              </div>
            </div>
          </div>

          {/* Scenario Summary Table */}
          <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="px-6 py-4 text-sm font-semibold text-amber-400 uppercase tracking-wider">
                    Scenario
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-amber-400 uppercase tracking-wider text-center">
                    Consistency
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-amber-400 uppercase tracking-wider text-center">
                    Success
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-300 font-medium">
                      Preference Retention
                    </div>
                    <div className="text-sm text-gray-500">
                      Preferences applied without re-stating
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-semibold">
                    +34.7%
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-semibold">
                    +33.3%
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-300 font-medium">
                      Multi-Session Continuity
                    </div>
                    <div className="text-sm text-gray-500">
                      Decisions carry across sessions
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-semibold">
                    +26.2%
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    —
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-300 font-medium">
                      Accumulated Knowledge
                    </div>
                    <div className="text-sm text-gray-500">
                      5 sessions of learning improve output
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-semibold">
                    +7.3%
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    —
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-300 font-medium">
                      Error Pattern Learning
                    </div>
                    <div className="text-sm text-gray-500">
                      Past debugging helps fix similar bugs
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-semibold">
                    +4.8%
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    —
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-300 font-medium">
                      Cross-Agent Consistency
                    </div>
                    <div className="text-sm text-gray-500">
                      All agents follow the same memorized style
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    inconclusive
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Per-Agent Breakdown */}
          <BenchmarkAgentDetails />

          <p className="text-center text-gray-500 text-sm mt-8 max-w-2xl mx-auto">
            Tested with Claude Code, Gemini CLI, and Codex CLI using their default cloud models.
            Each scenario ran 3 times with median values reported.
            Claude Code without Brain Memory failed the preference scenario entirely
            — with Brain Memory, it passed every run.
          </p>
        </section>

        {/* Neuroscience Foundations */}
        <section className="border-t border-gray-800/50 py-20 lg:py-28">
          <h2 className="text-center text-3xl font-bold mb-12">
            <span className="gradient-text">Grounded in Neuroscience</span>
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="px-6 py-4 text-sm font-semibold text-amber-400 uppercase tracking-wider">
                    Brain Mechanism
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-amber-400 uppercase tracking-wider">
                    Implementation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    Spreading activation
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Recalling memory A automatically surfaces linked memories B
                    and C
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    Hebbian learning
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Memories recalled together strengthen mutual links
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    Context-dependent recall
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Memories encoded in similar context score higher
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    Spacing effect
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Longer recall intervals produce larger strength boosts
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    Ebbinghaus decay
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Exponential forgetting with per-memory decay rates
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">
                    Synaptic homeostasis
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    Global strength downscaling during sleep prevents inflation
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Compatibility Section */}
        <section className="border-t border-gray-800/50 py-20 lg:py-28">
          <h2 className="text-center text-3xl font-bold mb-12">
            <span className="gradient-text">One Brain, Every Agent</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card rounded-2xl p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-1">
                Claude Code
              </h3>
              <p className="text-sm text-gray-500 mb-4">Anthropic</p>
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-4 py-3">
                <code className="text-sm text-amber-400 font-mono">
                  npx brain-memory --claude --global
                </code>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-1">
                Gemini CLI
              </h3>
              <p className="text-sm text-gray-500 mb-4">Google</p>
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-4 py-3">
                <code className="text-sm text-amber-400 font-mono">
                  npx brain-memory --gemini --global
                </code>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-1">
                OpenAI Codex CLI
              </h3>
              <p className="text-sm text-gray-500 mb-4">OpenAI</p>
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-4 py-3">
                <code className="text-sm text-amber-400 font-mono">
                  npx brain-memory --codex --global
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="border-t border-gray-800/50 py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              <span className="gradient-text">Quick Start</span>
            </h2>
            <div className="glass-card rounded-2xl p-8 mb-6">
              <code className="text-xl sm:text-2xl font-mono text-amber-400">
                npx brain-memory@beta
              </code>
            </div>
            <p className="text-gray-400">
              The interactive installer asks which runtime(s) to configure and
              whether to install globally or for the current project.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Copy Button ─────────────────────────────────────────────────── */

function CopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx brain-memory");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full bg-gray-800/80 backdrop-blur px-6 py-3 font-semibold text-white border border-gray-700 hover:bg-gray-700/80 transition-all hover:-translate-y-0.5"
    >
      <code className="text-sm font-mono text-amber-400">npx brain-memory</code>
      <svg
        className="h-4 w-4 text-gray-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </>
        )}
      </svg>
    </button>
  );
}

/* ─── Feature Card ────────────────────────────────────────────────── */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card glass-card rounded-2xl p-6 group">
      <div className="feature-icon mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

/* ─── Feature Icons ───────────────────────────────────────────────── */

function HierarchicalIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hierarchical-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M24 4L24 16M24 16L12 24M24 16L36 24M12 24L12 36M12 24L6 32M12 24L18 32M36 24L36 36M36 24L30 32M36 24L42 32"
        stroke="url(#hierarchical-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="4" r="3" fill="url(#hierarchical-grad)" />
      <circle cx="12" cy="24" r="3" fill="url(#hierarchical-grad)" />
      <circle cx="36" cy="24" r="3" fill="url(#hierarchical-grad)" />
      <circle cx="6" cy="32" r="2.5" fill="url(#hierarchical-grad)" />
      <circle cx="18" cy="32" r="2.5" fill="url(#hierarchical-grad)" />
      <circle cx="30" cy="32" r="2.5" fill="url(#hierarchical-grad)" />
      <circle cx="42" cy="32" r="2.5" fill="url(#hierarchical-grad)" />
      <circle cx="12" cy="36" r="2.5" fill="url(#hierarchical-grad)" />
      <circle cx="36" cy="36" r="2.5" fill="url(#hierarchical-grad)" />
    </svg>
  );
}

function DecayIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="decay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path
        d="M6 8V40H42"
        stroke="url(#decay-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12C10 12 12 14 16 26C20 38 22 38 24 30C26 22 28 18 30 22C32 26 34 36 38 38"
        stroke="url(#decay-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10 12L10 10L14 12L10 14L10 12Z"
        fill="url(#decay-grad)"
      />
    </svg>
  );
}

function AssociativeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="associative-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <line x1="16" y1="14" x2="32" y2="14" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <line x1="16" y1="14" x2="24" y2="34" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <line x1="32" y1="14" x2="24" y2="34" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <line x1="16" y1="14" x2="8" y2="28" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <line x1="32" y1="14" x2="40" y2="28" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <line x1="8" y1="28" x2="24" y2="34" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <line x1="40" y1="28" x2="24" y2="34" stroke="url(#associative-grad)" strokeWidth="2" opacity="0.6" />
      <circle cx="16" cy="14" r="5" fill="url(#associative-grad)" />
      <circle cx="32" cy="14" r="5" fill="url(#associative-grad)" />
      <circle cx="24" cy="34" r="5" fill="url(#associative-grad)" />
      <circle cx="8" cy="28" r="4" fill="url(#associative-grad)" />
      <circle cx="40" cy="28" r="4" fill="url(#associative-grad)" />
    </svg>
  );
}

function SpacedIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spaced-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" stroke="url(#spaced-grad)" strokeWidth="3" fill="none" />
      <path
        d="M24 12V24L32 28"
        stroke="url(#spaced-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 8L42 4M42 4L44 8M42 4L38 2"
        stroke="url(#spaced-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 16C41 14 42 12 42 10"
        stroke="url(#spaced-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
    </svg>
  );
}

function CognitiveIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cognitive-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C24 4 18 4 14 8C10 12 10 18 12 22C14 26 18 28 18 28"
        stroke="url(#cognitive-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4C24 4 30 4 34 8C38 12 38 18 36 22C34 26 30 28 30 28"
        stroke="url(#cognitive-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4V44"
        stroke="url(#cognitive-grad)"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <path
        d="M18 28C18 28 16 32 16 36C16 40 20 44 24 44C28 44 32 40 32 36C32 32 30 28 30 28"
        stroke="url(#cognitive-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="17" cy="16" r="2" fill="url(#cognitive-grad)" />
      <circle cx="31" cy="16" r="2" fill="url(#cognitive-grad)" />
      <circle cx="20" cy="36" r="1.5" fill="url(#cognitive-grad)" />
      <circle cx="28" cy="36" r="1.5" fill="url(#cognitive-grad)" />
    </svg>
  );
}

function CrossAgentIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crossagent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="url(#crossagent-grad)" strokeWidth="2.5" fill="none" />
      <path d="M7 10H17M7 14H14" stroke="url(#crossagent-grad)" strokeWidth="2" strokeLinecap="round" />
      <rect x="28" y="6" width="16" height="12" rx="2" stroke="url(#crossagent-grad)" strokeWidth="2.5" fill="none" />
      <path d="M31 10H41M31 14H38" stroke="url(#crossagent-grad)" strokeWidth="2" strokeLinecap="round" />
      <rect x="16" y="30" width="16" height="12" rx="2" stroke="url(#crossagent-grad)" strokeWidth="2.5" fill="none" />
      <path d="M19 34H29M19 38H26" stroke="url(#crossagent-grad)" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18V24L24 30" stroke="url(#crossagent-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 18V24L24 30" stroke="url(#crossagent-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sleep-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        d="M36 12C36 12 28 14 24 20C20 26 22 36 30 40C22 42 12 38 8 28C4 18 10 8 20 4C14 10 16 20 24 24C28 26 34 22 36 16"
        stroke="url(#sleep-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="36" cy="8" r="1.5" fill="url(#sleep-grad)" />
      <circle cx="40" cy="14" r="1" fill="url(#sleep-grad)" />
      <circle cx="42" cy="8" r="1.5" fill="url(#sleep-grad)" />
      <path d="M38 20L40 18L42 20" stroke="url(#sleep-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 26L39 23L42 26" stroke="url(#sleep-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Benchmark Agent Details ─────────────────────────────────────── */

interface ScenarioResult {
  name: string;
  withBrain: number;
  withoutBrain: number;
  tokens: { with: string; without: string } | null;
  time: { with: string; without: string };
  successNote?: string;
}

interface AgentResult {
  subtitle: string;
  scenarios: ScenarioResult[];
}

const agentData: Record<string, AgentResult> = {
  "Claude Code": {
    subtitle: "claude sonnet",
    scenarios: [
      { name: "Continuity", withBrain: 0.944, withoutBrain: 0.645, tokens: { with: "223K", without: "211K" }, time: { with: "108s", without: "98s" } },
      { name: "Consistency", withBrain: 0.400, withoutBrain: 0.400, tokens: { with: "133K", without: "125K" }, time: { with: "103s", without: "89s" } },
      { name: "Knowledge", withBrain: 1.000, withoutBrain: 0.891, tokens: { with: "511K", without: "312K" }, time: { with: "159s", without: "130s" } },
      { name: "Error Learning", withBrain: 0.570, withoutBrain: 0.570, tokens: { with: "248K", without: "141K" }, time: { with: "228s", without: "203s" }, successNote: "100% vs 67%" },
      { name: "Preferences", withBrain: 0.866, withoutBrain: 0.359, tokens: { with: "134K", without: "125K" }, time: { with: "106s", without: "93s" }, successNote: "PASS vs FAIL" },
    ],
  },
  "Gemini CLI": {
    subtitle: "gemini cli default",
    scenarios: [
      { name: "Continuity", withBrain: 0.822, withoutBrain: 0.555, tokens: { with: "34K", without: "16K" }, time: { with: "27s", without: "20s" } },
      { name: "Consistency", withBrain: 0, withoutBrain: 0, tokens: { with: "—", without: "—" }, time: { with: "—", without: "—" }, successNote: "Timed out" },
      { name: "Knowledge", withBrain: 0.964, withoutBrain: 0.927, tokens: { with: "47K", without: "23K" }, time: { with: "50s", without: "30s" } },
      { name: "Error Learning", withBrain: 0.570, withoutBrain: 0.630, tokens: { with: "38K", without: "40K" }, time: { with: "47s", without: "48s" } },
      { name: "Preferences", withBrain: 0.800, withoutBrain: 0.534, tokens: { with: "42K", without: "23K" }, time: { with: "33s", without: "27s" } },
    ],
  },
  "Codex CLI": {
    subtitle: "codex cli default",
    scenarios: [
      { name: "Continuity", withBrain: 0.767, withoutBrain: 0.545, tokens: null, time: { with: "101s", without: "69s" } },
      { name: "Consistency", withBrain: 1.000, withoutBrain: 1.000, tokens: null, time: { with: "89s", without: "48s" } },
      { name: "Knowledge", withBrain: 0.934, withoutBrain: 0.861, tokens: null, time: { with: "194s", without: "180s" } },
      { name: "Error Learning", withBrain: 0.773, withoutBrain: 0.570, tokens: null, time: { with: "230s", without: "196s" } },
      { name: "Preferences", withBrain: 0.934, withoutBrain: 0.666, tokens: null, time: { with: "76s", without: "44s" } },
    ],
  },
};

function BenchmarkAgentDetails() {
  const [activeAgent, setActiveAgent] = useState("Claude Code");
  const agents = Object.keys(agentData);
  const data = agentData[activeAgent];

  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-center text-xl font-semibold text-gray-300 mb-6">
        Per-Agent Results
      </h3>

      {/* Agent Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {agents.map((agent) => (
          <button
            key={agent}
            onClick={() => setActiveAgent(agent)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeAgent === agent
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20"
                : "glass-card text-gray-400 hover:text-gray-200"
            }`}
          >
            {agent}
            <span className="ml-1.5 text-xs opacity-70">({agentData[agent].subtitle})</span>
          </button>
        ))}
      </div>

      {/* Agent Detail Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800/50">
                <th className="px-4 py-3 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider text-center">
                  +Brain
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider text-center">
                  -Brain
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-amber-400 uppercase tracking-wider text-center">
                  Change
                </th>
                {data.scenarios[0].tokens !== null && (
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Tokens (+/-)
                  </th>
                )}
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Time (+/-)
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {data.scenarios.map((s) => {
                const diff = s.withBrain - s.withoutBrain;
                const pct = s.withoutBrain > 0 ? ((diff / s.withoutBrain) * 100).toFixed(1) : "—";
                const isPositive = diff > 0;
                const isNeutral = diff === 0;

                return (
                  <tr key={s.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-300 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-mono">
                      {s.withBrain.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 font-mono">
                      {s.withoutBrain.toFixed(3)}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-semibold ${
                        isPositive
                          ? "text-emerald-400"
                          : isNeutral
                          ? "text-gray-500"
                          : "text-red-400"
                      }`}
                    >
                      {isNeutral ? "—" : `${isPositive ? "+" : ""}${pct}%`}
                    </td>
                    {data.scenarios[0].tokens !== null && (
                      <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">
                        {s.tokens ? `${s.tokens.with} / ${s.tokens.without}` : "n/a"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">
                      {s.time.with} / {s.time.without}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {s.successNote ? (
                        <span
                          className={
                            s.successNote.includes("FAIL") || s.successNote.includes("Timed")
                              ? "text-red-400"
                              : "text-gray-400"
                          }
                        >
                          {s.successNote}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeAgent === "Codex CLI" && (
        <p className="text-center text-gray-600 text-xs mt-3">
          Codex CLI does not report token usage in its JSON output.
        </p>
      )}
    </div>
  );
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sync-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M36 16C36 16 32 8 24 8C16 8 10 14 10 22"
        stroke="url(#sync-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36 16L40 10M36 16L30 10"
        stroke="url(#sync-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 32C12 32 16 40 24 40C32 40 38 34 38 26"
        stroke="url(#sync-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 32L8 38M12 32L18 38"
        stroke="url(#sync-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
