"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Header />

      <main className="max-w-3xl mx-auto px-5 sm:px-6">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="pt-[var(--space-hero-top)] pb-[var(--space-hero-bottom)]">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-12 items-center">
            <div>
              <h1
                className="font-semibold tracking-tight leading-[1.04] mb-6 sm:mb-8 text-[var(--text-primary)] fade-in"
                style={{ fontSize: "var(--fs-h1)" }}
              >
                Memory for AI agents,{" "}
                <span className="italic text-[var(--text-secondary)]">
                  modeled on the brain.
                </span>
              </h1>
              <p
                className="text-[var(--text-secondary)] leading-relaxed mb-8 max-w-xl fade-in fade-in-delay-1"
                style={{ fontSize: "var(--fs-lead)" }}
              >
                Hierarchical, file-system-based memory that decays, strengthens
                through recall, and consolidates during sleep. Claude Code,
                Gemini CLI, and Codex CLI — one brain, all agents.
              </p>
              <div className="flex flex-wrap items-center gap-3 fade-in fade-in-delay-2">
                <Link
                  href="/docs"
                  className="font-mono text-sm font-medium bg-[var(--text-primary)] text-[var(--bg)] hover:bg-[var(--accent)] transition-colors px-4 py-2 rounded-md"
                >
                  get started
                </Link>
                <CopyButton />
              </div>
              <div className="mt-6 flex flex-wrap gap-3 fade-in fade-in-delay-3">
                <img src="https://img.shields.io/npm/v/brain-memory" alt="npm version" className="h-5" />
                <img src="https://github.com/onurkarali/actions/workflows/ci.yml/badge.svg" alt="CI" className="h-5" />
                <img src="https://img.shields.io/npm/l/brain-memory" alt="license" className="h-5" />
              </div>
            </div>

            <div className="hidden lg:block fade-in fade-in-delay-3">
              <Image
                src="/icon.svg"
                alt="Brain Memory"
                width={220}
                height={220}
                className="rounded-[44px]"
                priority
              />
            </div>
          </div>
        </section>

        {/* ─── 01 Features ──────────────────────────────────────────── */}
        <Section number="01" title="What's inside">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
            <Feature
              title="Hierarchical memory"
              description="The directory tree is the semantic structure. Browseable in any file explorer."
            />
            <Feature
              title="Strength & decay"
              description="Memories fade following Ebbinghaus' forgetting curve. Recalled memories strengthen."
            />
            <Feature
              title="Associative network"
              description="Weighted connections between memories. Recalling one activates related ones."
            />
            <Feature
              title="Spaced reinforcement"
              description="Longer recall intervals produce larger boosts. Diminishing returns on cramming."
            />
            <Feature
              title="Cognitive types"
              description="Episodic, semantic, and procedural memories each decay differently."
            />
            <Feature
              title="Cross-agent"
              description="Claude Code, Gemini CLI, Codex CLI. Same memory store, deterministic recall."
            />
            <Feature
              title="Sleep & consolidation"
              description="Nine-phase nightly cycle: replay, consolidation, pruning, reorganization."
            />
            <Feature
              title="Portable sync"
              description="Git remote or AES-256-GCM encrypted export. Self-hosted on your VPS."
            />
          </div>
        </Section>

        {/* ─── 02 How it works ──────────────────────────────────────── */}
        <Section number="02" title="How it works">
          <ol className="space-y-7">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <span className="font-mono text-xs text-[var(--text-tertiary)] pt-1 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{s.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-[0.9375rem]">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ─── 03 Benchmarks ────────────────────────────────────────── */}
        <Section number="03" title="Benchmark results">
          <p className="text-[var(--text-secondary)] leading-relaxed mb-8 text-[0.9375rem]">
            Tested across Claude Code, Gemini CLI, and Codex CLI.{" "}
            <a
              href="https://github.com/onurkarali/brain/tree/main/benchmark"
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Full methodology →
            </a>
          </p>

          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-[var(--border)] mb-8">
            <Stat label="avg consistency" value="+18.3%" />
            <Stat label="avg success" value="+33.3%" />
            <Stat label="agents improved" value="3 / 3" />
          </div>

          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)] mb-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">scenario</th>
                  <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">consistency</th>
                  <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">success</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((r, i) => (
                  <tr key={r.name} className={i < summaryRows.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}>
                    <td className="px-5 py-3.5">
                      <div className="text-[var(--text-primary)] font-medium">{r.name}</div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{r.note}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      <DeltaCell value={r.consistency} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      <DeltaCell value={r.success} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <BenchmarkAgentDetails />
        </Section>

        {/* ─── 04 Neuroscience ──────────────────────────────────────── */}
        <Section number="04" title="Neuroscience foundations">
          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">mechanism</th>
                  <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">implementation</th>
                </tr>
              </thead>
              <tbody>
                {neuroRows.map((r, i) => (
                  <tr key={r.name} className={i < neuroRows.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}>
                    <td className="px-5 py-3.5 text-[var(--text-primary)] font-medium">{r.name}</td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)]">{r.impl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ─── 05 Compatibility ─────────────────────────────────────── */}
        <Section number="05" title="Compatibility">
          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-[var(--border)]">
            <AgentCell name="Claude Code" vendor="anthropic" cmd="brain-memory --claude --global" />
            <AgentCell name="Gemini CLI" vendor="google" cmd="brain-memory --gemini --global" />
            <AgentCell name="Codex CLI" vendor="openai" cmd="brain-memory --codex --global" />
          </div>
        </Section>

        {/* ─── 06 Quick start ───────────────────────────────────────── */}
        <Section number="06" title="Quick start">
          <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--surface)] mb-4">
            <code className="font-mono text-base sm:text-lg text-[var(--text-primary)]">
              <span className="text-[var(--text-tertiary)]">$ </span>
              npm install -g brain-memory@beta
            </code>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Install globally, then run{" "}
            <code className="font-mono text-xs bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded">brain-memory</code>{" "}
            to configure your runtime(s).
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────────────────────────── */
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-[var(--space-section)] border-t border-[var(--border)]">
      <div className="flex items-baseline gap-3 mb-8">
        <span className="font-mono text-xs text-[var(--text-tertiary)] tabular-nums">{number}</span>
        <h2
          className="font-semibold text-[var(--text-primary)] tracking-tight"
          style={{ fontSize: "var(--fs-h2)" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
      <p className="text-[var(--text-secondary)] leading-relaxed text-[0.9375rem]">{description}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] p-5">
      <div className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight mb-1">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
    </div>
  );
}

function AgentCell({ name, vendor, cmd }: { name: string; vendor: string; cmd: string }) {
  return (
    <div className="bg-[var(--surface)] p-5">
      <div className="font-semibold text-[var(--text-primary)] mb-0.5">{name}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">{vendor}</div>
      <code className="block font-mono text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-secondary)] overflow-x-auto whitespace-nowrap">
        {cmd}
      </code>
    </div>
  );
}

function DeltaCell({ value }: { value: string }) {
  if (value === "—") return <span className="text-[var(--text-tertiary)]">—</span>;
  if (value === "inconclusive") return <span className="text-[var(--text-tertiary)] text-xs">inconclusive</span>;
  const positive = value.startsWith("+");
  return (
    <span className={positive ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--danger)]"}>
      {value}
    </span>
  );
}

/* ─── Copy Button ─────────────────────────────────────────────────── */
function CopyButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText("npm install -g brain-memory@beta");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="font-mono text-xs border border-[var(--border-strong)] hover:border-[var(--text-primary)] rounded-md px-3 py-2 inline-flex items-center gap-2 transition-colors"
    >
      <span className="text-[var(--text-tertiary)]">$</span>
      <span className="text-[var(--text-primary)]">npm i -g brain-memory</span>
      <span className="text-[var(--text-tertiary)]">{copied ? "✓" : "⧉"}</span>
    </button>
  );
}

/* ─── Static content ──────────────────────────────────────────────── */
const steps = [
  {
    title: "Memorize",
    body: "Agents store decisions, learnings, and preferences as Markdown files with YAML frontmatter. Initial strength is set by type and impact.",
  },
  {
    title: "Decay",
    body: "Strength decays exponentially per memory's decay rate. Episodic fades fast; procedural is sticky.",
  },
  {
    title: "Recall",
    body: "Deterministic TF-IDF + decayed strength + spreading activation + context match. Identical scoring across all agents.",
  },
  {
    title: "Reinforce",
    body: "Recalled memories strengthen via spaced reinforcement. Longer gaps → larger boosts. Decay rate improves with each recall.",
  },
  {
    title: "Sleep",
    body: "Nine-phase maintenance: replay, synaptic homeostasis, knowledge propagation, semantic crystallization, reorganize, consolidate, prune, REM dream, expertise detection.",
  },
];

const summaryRows = [
  { name: "Preference retention", note: "Preferences applied without re-stating", consistency: "+34.7%", success: "+33.3%" },
  { name: "Multi-session continuity", note: "Decisions carry across sessions", consistency: "+26.2%", success: "—" },
  { name: "Accumulated knowledge", note: "5 sessions of learning improve output", consistency: "+7.3%", success: "—" },
  { name: "Error pattern learning", note: "Past debugging helps fix similar bugs", consistency: "+4.8%", success: "—" },
  { name: "Cross-agent consistency", note: "All agents follow the same memorized style", consistency: "inconclusive", success: "—" },
];

const neuroRows = [
  { name: "Spreading activation", impl: "Recalling memory A automatically surfaces linked memories B and C." },
  { name: "Hebbian learning", impl: "Memories recalled together strengthen mutual links." },
  { name: "Context-dependent recall", impl: "Memories encoded in similar context score higher at retrieval." },
  { name: "Spacing effect", impl: "Longer recall intervals produce larger strength boosts." },
  { name: "Ebbinghaus decay", impl: "Exponential forgetting with per-memory decay rates." },
  { name: "Synaptic homeostasis", impl: "Global strength downscaling during sleep prevents inflation." },
];

/* ─── Benchmark Agent Details (preserved data, restyled) ──────────── */
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
      { name: "Consistency", withBrain: 0.4, withoutBrain: 0.4, tokens: { with: "133K", without: "125K" }, time: { with: "103s", without: "89s" } },
      { name: "Knowledge", withBrain: 1.0, withoutBrain: 0.891, tokens: { with: "511K", without: "312K" }, time: { with: "159s", without: "130s" } },
      { name: "Error Learning", withBrain: 0.57, withoutBrain: 0.57, tokens: { with: "248K", without: "141K" }, time: { with: "228s", without: "203s" }, successNote: "100% vs 67%" },
      { name: "Preferences", withBrain: 0.866, withoutBrain: 0.359, tokens: { with: "134K", without: "125K" }, time: { with: "106s", without: "93s" }, successNote: "PASS vs FAIL" },
    ],
  },
  "Gemini CLI": {
    subtitle: "gemini cli default",
    scenarios: [
      { name: "Continuity", withBrain: 0.822, withoutBrain: 0.555, tokens: { with: "34K", without: "16K" }, time: { with: "27s", without: "20s" } },
      { name: "Consistency", withBrain: 0, withoutBrain: 0, tokens: { with: "—", without: "—" }, time: { with: "—", without: "—" }, successNote: "Timed out" },
      { name: "Knowledge", withBrain: 0.964, withoutBrain: 0.927, tokens: { with: "47K", without: "23K" }, time: { with: "50s", without: "30s" } },
      { name: "Error Learning", withBrain: 0.57, withoutBrain: 0.63, tokens: { with: "38K", without: "40K" }, time: { with: "47s", without: "48s" } },
      { name: "Preferences", withBrain: 0.8, withoutBrain: 0.534, tokens: { with: "42K", without: "23K" }, time: { with: "33s", without: "27s" } },
    ],
  },
  "Codex CLI": {
    subtitle: "codex cli default",
    scenarios: [
      { name: "Continuity", withBrain: 0.767, withoutBrain: 0.545, tokens: null, time: { with: "101s", without: "69s" } },
      { name: "Consistency", withBrain: 1.0, withoutBrain: 1.0, tokens: null, time: { with: "89s", without: "48s" } },
      { name: "Knowledge", withBrain: 0.934, withoutBrain: 0.861, tokens: null, time: { with: "194s", without: "180s" } },
      { name: "Error Learning", withBrain: 0.773, withoutBrain: 0.57, tokens: null, time: { with: "230s", without: "196s" } },
      { name: "Preferences", withBrain: 0.934, withoutBrain: 0.666, tokens: null, time: { with: "76s", without: "44s" } },
    ],
  },
};

function BenchmarkAgentDetails() {
  const [activeAgent, setActiveAgent] = useState("Claude Code");
  const agents = Object.keys(agentData);
  const data = agentData[activeAgent];
  const showTokens = data.scenarios[0].tokens !== null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {agents.map((agent) => (
          <button
            key={agent}
            onClick={() => setActiveAgent(agent)}
            className={`font-mono text-xs px-3 py-1.5 rounded-md transition-colors ${
              activeAgent === agent
                ? "bg-[var(--text-primary)] text-[var(--bg)]"
                : "border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]"
            }`}
          >
            {agent}
          </button>
        ))}
      </div>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">scenario</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">+brain</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">−brain</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">Δ</th>
                {showTokens && (
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">tokens</th>
                )}
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">time</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] text-right">notes</th>
              </tr>
            </thead>
            <tbody>
              {data.scenarios.map((s, i) => {
                const diff = s.withBrain - s.withoutBrain;
                const pct = s.withoutBrain > 0 ? ((diff / s.withoutBrain) * 100).toFixed(1) : "—";
                const isPositive = diff > 0;
                const isNeutral = diff === 0;
                return (
                  <tr key={s.name} className={i < data.scenarios.length - 1 ? "border-b border-[var(--border-subtle)]" : ""}>
                    <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">{s.withBrain.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-tertiary)]">{s.withoutBrain.toFixed(3)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${isPositive ? "text-emerald-700 dark:text-emerald-400" : isNeutral ? "text-[var(--text-tertiary)]" : "text-[var(--danger)]"}`}>
                      {isNeutral ? "—" : `${isPositive ? "+" : ""}${pct}%`}
                    </td>
                    {showTokens && (
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--text-tertiary)]">
                        {s.tokens ? `${s.tokens.with}/${s.tokens.without}` : "n/a"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-mono text-xs text-[var(--text-tertiary)]">{s.time.with}/{s.time.without}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      {s.successNote ? (
                        <span className={s.successNote.includes("FAIL") || s.successNote.includes("Timed") ? "text-[var(--danger)]" : "text-[var(--text-secondary)]"}>
                          {s.successNote}
                        </span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
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
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-3">
          codex cli does not report token usage in its json output
        </p>
      )}
    </div>
  );
}
