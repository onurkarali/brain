# Brain Memory Benchmark

Empirical benchmark framework proving that AI agents with persistent memory produce more consistent, more successful outputs while using fewer tokens.

## What It Measures

For each scenario, the benchmark runs identical coding tasks across AI agents — **with** and **without** Brain Memory — measuring:

| Metric | What it means |
|--------|---------------|
| **Token usage** | Total input + output tokens consumed |
| **Success rate** | Whether the output passes evaluation criteria |
| **Consistency** | Pairwise similarity of outputs across runs/agents |
| **Time** | Wall-clock execution time |

## 5 Benchmark Scenarios

| # | Scenario | What it proves | Key metric |
|---|----------|---------------|------------|
| 1 | **Multi-Session Continuity** | Decisions from Session 1 carry to Session 2 | Architectural alignment score |
| 2 | **Cross-Agent Consistency** | All agents follow the same memorized style | Pairwise consistency matrix |
| 3 | **Accumulated Knowledge** | 5 sessions of learning → better Session 6 | Token usage + correctness |
| 4 | **Error Pattern Learning** | Past debugging → faster fix of similar bug | Tokens to resolution |
| 5 | **Preference Retention** | Preferences applied without re-stating | Preference compliance score |

## Quick Start

### Prerequisites

- Node.js >= 18
- At least one AI agent CLI installed: `claude`, `gemini`, or `codex`
- For local testing: [Ollama](https://ollama.ai) with Qwen 2.5 Coder 14B

### Run Tests

```bash
cd benchmark
npm test
```

### Run Benchmarks (Cloud APIs — default)

Each agent uses its native cloud API (Anthropic, Google, OpenAI). Cost is ~$1-2 per full run.

```bash
# All scenarios, all available agents
node harness/runner.js

# Single scenario
node harness/runner.js --scenario continuity

# Single agent
node harness/runner.js --agent claude

# More runs for statistical confidence
node harness/runner.js --runs 5

# Dry run (show plan)
node harness/runner.js --dry-run
```

### Run Benchmarks (Ollama — local, free)

Routes all agents through a single local model via Ollama for controlled, zero-cost comparison. Requires [Ollama](https://ollama.ai) running with Qwen 2.5 Coder 14B (fits 16GB VRAM).

```bash
# Pull the model
ollama pull qwen2.5-coder:14b

# Run with --ollama flag
node harness/runner.js --ollama
```

For Gemini CLI, a LiteLLM proxy is needed to translate between API formats:

```bash
docker compose -f docker/docker-compose.yml up ollama litellm
node harness/runner.js --ollama
```

### Docker (Full Stack)

Runs everything in containers — Ollama, LiteLLM, and agent benchmarks:

```bash
docker compose -f docker/docker-compose.yml up
```

## How It Works

```
For each scenario × each agent × {with-brain, without-brain}:
  1. Create isolated temp workspace
  2. Copy fixture project files
  3. If with-brain: init ~/.brain/, seed deterministic memories
  4. Run training prompts (build context)
  5. Run test prompts (measured: tokens, time, output)
  6. Evaluate output (pass/fail, consistency score)
  7. Aggregate across 3 runs → report (median values)
```

### Key Design Decisions

- **Direct memory seeding** — Uses `src/index-manager.js` APIs to create deterministic memories. Ensures reproducibility: the test measures whether agents *recall and use* memories, not whether they can store them.
- **Zero dependencies** — Matches brain-memory's philosophy. Node.js builtins only.
- **Regex-based evaluation** — No AST parser needed. Pattern matching for architectural alignment.
- **Graceful agent skipping** — Works with 1, 2, or all 3 agents installed.
- **Multiple runs** — Each scenario runs 3 times; median values reported to handle AI non-determinism.

## Output

### Console

ASCII comparison table printed after each scenario.

### JSON

```json
{
  "scenario": "multi-session-continuity",
  "model": "qwen2.5-coder:14b",
  "results": {
    "claude": {
      "with_brain":    { "tokens": 1801, "time_ms": 4500, "success": true,  "consistency": 0.95 },
      "without_brain": { "tokens": 2990, "time_ms": 7200, "success": false, "consistency": 0.42 }
    }
  },
  "summary": {
    "token_reduction_pct": 39.8,
    "success_improvement_pct": 40.0,
    "consistency_improvement_pct": 55.3
  }
}
```

### Markdown

Generated in `results/` alongside JSON — ready for README inclusion.

## Methodology & Limitations

### Fair Control Group

The "without brain" control group uses the same fixture project files as the "with brain" variant. Fixtures include realistic reference code (full CRUD routes, connection pooling, functional patterns) so that the control group has a fair baseline — it can infer conventions from existing code rather than starting from a blank stub. This ensures the benchmark measures **memory recall**, not "some context vs. none."

### Memory Injection

Memory context is surfaced as conversational recall (e.g., "You decided...", "You prefer...") rather than injected instructions. Only the concise `body` field is used — full content with code examples is not included. This approximates how brain-memory works in practice: the agent recalls summaries, not verbatim documentation.

### Evaluation

Evaluators use regex pattern matching, not AST parsing. This is intentionally coarse-grained — it measures whether the agent applied the right architectural patterns, not whether it produced syntactically perfect code. Known limitations:

- **False positives**: An agent might match patterns incidentally without truly applying the memorized convention
- **False negatives**: Valid implementations using different naming or structure may score low
- **No semantic analysis**: Two functionally equivalent implementations may score differently
- **Model sensitivity**: Results vary across model versions and temperature settings

### Reproducibility

- Each scenario runs multiple times (default: 3); median values are reported
- Seeded memories are deterministic — the same memories are injected for every run
- Workspace isolation ensures no cross-contamination between runs
- Results should be compared within the same model/run, not across different models or dates

## File Structure

```
benchmark/
├── package.json
├── config.json
├── README.md
├── harness/
│   ├── runner.js              # Main orchestrator
│   ├── agents/
│   │   ├── index.js           # Agent registry + availability check
│   │   ├── claude.js          # claude -p adapter
│   │   ├── gemini.js          # gemini -p adapter
│   │   └── codex.js           # codex exec adapter
│   ├── metrics.js             # Token extraction, timing, aggregation
│   ├── evaluator.js           # Output evaluation (success, consistency)
│   ├── seeder.js              # Seed memories via index-manager.js
│   ├── brain-setup.js         # Init brain + install prompts
│   ├── reporter.js            # Results → JSON, console, markdown
│   └── formatter.js           # ASCII/markdown table rendering
├── docker/
│   ├── Dockerfile.agent       # Parameterized agent container
│   ├── Dockerfile.ollama      # Ollama + pre-pulled model
│   ├── Dockerfile.litellm     # LiteLLM proxy
│   ├── docker-compose.yml     # Full stack orchestration
│   ├── litellm-config.yaml    # LiteLLM → Ollama routing
│   └── entrypoint.sh          # Ollama readiness + model pull
├── scenarios/
│   ├── scenario-1-continuity/
│   ├── scenario-2-consistency/
│   ├── scenario-3-knowledge/
│   ├── scenario-4-error-learning/
│   └── scenario-5-preferences/
├── test/
│   ├── harness.test.js        # Unit tests for harness modules
│   └── scenarios.test.js      # Tests for scenario evaluators
└── results/                   # Generated benchmark output
```
