# Brain Memory

A hierarchical, file-system-based memory plugin for AI coding agents. Inspired by human cognition — memories are organized into deep nested life-domain categories, strengthened through recall, and naturally decay over time.

Works with **Claude Code** and **Gemini CLI**.

```
.brain/
├── professional/
│   └── companies/
│       └── acme-corp/
│           └── projects/
│               └── alpha-launch.md        ⚡ 0.88
├── personal/
│   └── education/
│       └── typescript-generics.md         ⚡ 0.72
├── social/
│   └── communities/
│       └── open-source-contrib.md         ⚡ 0.65
└── family/
    └── events/
        └── annual-reunion-planning.md     ⚡ 0.55
```

## Why Brain Memory?

Existing AI memory solutions use flat databases with tag-based retrieval. Brain Memory is different:

- **The directory tree IS the semantic structure** — `professional/companies/acme/projects/` tells the agent everything about context without vector search
- **Human-inspectable** — Browse your "brain" in any file explorer
- **Git-friendly** — Full version history of how memories evolve
- **Strength + decay** — Recalled memories get stronger, forgotten ones fade. Just like your brain
- **On-demand depth** — Subcategories are created as needed, not pre-defined
- **Consolidation** — Weak related memories merge into stronger combined knowledge
- **Zero dependencies** — Pure file I/O, no databases, no servers, no embeddings required

## Install

```bash
npx brain-memory
```

The interactive installer asks which runtime(s) to configure (Claude Code, Gemini CLI, or both) and whether to install globally or for the current project.

### Non-interactive

```bash
npx brain-memory --claude --global        # Claude Code, global
npx brain-memory --gemini --local         # Gemini CLI, local project
npx brain-memory --all --global           # Both runtimes, global
```

### Manual Install

Copy the `commands/brain/` directory to your agent's commands folder:

```bash
# Claude Code
cp -r commands/brain/ ~/.claude/commands/brain/

# Gemini CLI
cp -r commands/brain/ ~/.gemini/commands/brain/
```

Then append the contents of `prompts/claude.md` (or `prompts/gemini.md`) to your project's `CLAUDE.md` (or `GEMINI.md`).

## Commands

| Command | Description |
|---------|-------------|
| `/brain:init` | Initialize `.brain/` directory structure with default categories |
| `/brain:memorize [topic]` | Store memories from current session context |
| `/brain:remember [query]` | Recall relevant memories, scored by strength and relevance |
| `/brain:explore [category]` | Browse the brain hierarchy with visual tree view |
| `/brain:consolidate [scope]` | Merge related weak memories into stronger combined ones |
| `/brain:forget [target]` | Decay, archive, or remove memories |
| `/brain:sleep [scope]` | Overnight reorganization — restructure, consolidate, prune, and detect expertise |
| `/brain:status` | Dashboard with brain health metrics and recommendations |

## How It Works

### Memory Lifecycle

```
Create → Store → Decay → Recall → Reinforce → Sleep (Reorganize + Consolidate + Prune + Expertise) → Archive
```

1. **Create** — When you use `/brain:memorize`, the agent analyzes the session and extracts significant decisions, learnings, insights, or experiences
2. **Store** — Each memory is filed into the hierarchy at the appropriate depth, with YAML frontmatter tracking metadata
3. **Decay** — Memories naturally weaken over time: `effective_strength = base_strength * (decay_rate ^ days_since_access)`
4. **Recall** — `/brain:remember` searches and scores memories: `0.55 * relevance + 0.30 * decayed_strength + 0.15 * recency`
5. **Reinforce** — Every recall boosts the memory's strength by +0.05 (capped at 1.0)
6. **Consolidate** — Multiple weak related memories can be merged into a single stronger memory
7. **Sleep** — `/brain:sleep` performs a full maintenance cycle: reorganizes flat clusters, reconsolidates new learnings into existing memories, consolidates weak ones, prunes faded ones, and detects expertise areas — just like the brain during sleep
8. **Archive** — Fully decayed memories move to `_archived/` (recoverable) or can be permanently deleted

### Memory Types

| Type | Base Strength | Daily Decay | Use Case |
|------|:---:|:---:|---|
| `insight` | 0.90 | 0.997 | Deep realizations, patterns discovered |
| `decision` | 0.85 | 0.995 | Choices made and their rationale |
| `goal` | 0.80 | 0.993 | Objectives and aspirations |
| `experience` | 0.75 | 0.985 | Notable events or processes |
| `learning` | 0.70 | 0.990 | New knowledge acquired |
| `relationship` | 0.70 | 0.997 | Connections between people/things |
| `preference` | 0.60 | 0.998 | User style and preferences |
| `observation` | 0.40 | 0.950 | Casual facts or notices |

### Memory File Format

Each memory is a Markdown file with YAML frontmatter:

```markdown
---
id: mem_20260213_a3f2c1
type: decision
created: 2026-02-13T14:30:00Z
last_accessed: 2026-02-13T14:30:00Z
access_count: 3
strength: 0.92
decay_rate: 0.995
tags: [architecture, microservices, scaling]
related: [mem_20260210_b4e5d6]
source: project-alpha-session
---

# Chose Event-Driven Architecture for Project Alpha

We decided to use event-driven architecture with Kafka instead of synchronous
REST calls between services, because the traffic analysis showed 10x burst
patterns that would overwhelm synchronous endpoints.

## Context

Sprint planning for Q2, evaluating scaling strategy for the notification system.

## Key Details

- Kafka chosen over RabbitMQ for its replay capability
- Event schema registry added to prevent breaking changes
- Estimated 3-week implementation vs 1-week for REST (but REST would need rework at scale)

## Connections

Related to the capacity planning decision (mem_20260210_b4e5d6) where we
identified the 10x burst pattern in notification traffic.
```

### Scoring Formula

When recalling memories, each candidate is scored:

```
score = 0.55 * relevance + 0.30 * decayed_strength + 0.15 * recency_bonus
```

- **relevance** (0.55 weight) — How well the memory matches the query
- **decayed_strength** (0.30 weight) — Base strength after time decay
- **recency_bonus** (0.15 weight) — Linear bonus that fades over one year

The agent then decides the response strategy:
- **Single strong match** (top score > 0.7) → Return the full memory
- **Multiple related** (2-5 candidates > 0.4) → Synthesize a consolidated response
- **Many weak** (>5, all < 0.4) → List candidates for the user to choose
- **No matches** → Suggest alternative approaches

### Consolidation

When memories decay below the threshold (default: 0.3), they become candidates for consolidation. The agent groups related weak memories by path proximity, tag overlap, and temporal closeness, then merges them into a single stronger memory:

```
consolidated_strength = max(source_strengths) + 0.15   (capped at 1.0)
consolidated_decay    = min(source_decay_rates)         (slowest decay wins)
```

Original memories are moved to `_archived/` (recoverable).

### Sleep Cycle

`/brain:sleep` is the brain's overnight maintenance — inspired by how human brains reorganize memories during sleep (hippocampal replay → neocortical transfer → reconsolidation). It runs six phases:

1. **Replay** — Scans all memories and computes current decayed strengths, categorizing into tiers (Strong / Moderate / Weak / Fading)
2. **Reorganize** — Detects flat clusters (3+ related memories at the same level) and restructures them into deeper sub-categories automatically
3. **Reconsolidate** — Takes recent memories and propagates their knowledge into related existing memories. Walks up (parent context), down (child specifics), across (siblings), and cross-category (tag-based) to find memories that should be updated. Can extend, refine, reinforce, contradict, or contextualize existing knowledge.
4. **Consolidate** — Merges weak related memories into stronger combined knowledge
5. **Prune** — Archives memories that have faded below 0.1 strength
6. **Expertise Detection** — Identifies dense knowledge areas and generates expertise profiles with level classification:

| Level | Score | Meaning |
|-------|:---:|---------|
| Awareness | 0.2 - 0.4 | Surface familiarity |
| Working Knowledge | 0.4 - 0.6 | Competent with reference |
| Deep Knowledge | 0.6 - 0.8 | Strong command, can reason about trade-offs |
| Expert | 0.8 - 1.0 | Mastery — dense, frequently-recalled, long-standing |

Each expertise area gets an `_expertise.md` profile documenting what you know well, knowledge gaps, and contributing memories. Sleep can target a specific subtree (e.g., `/brain:sleep professional/skills`) or process the entire brain.

## File Structure

```
.brain/
├── index.json              # Memory inventory — fast lookup for all memories
├── professional/           # Work, career, technical skills
│   ├── _meta.json          # Category metadata and stats
│   ├── companies/          # On-demand: created when first needed
│   │   └── <company>/
│   │       ├── projects/
│   │       └── decisions/
│   ├── skills/
│   └── career/
├── personal/               # Education, health, hobbies, goals
│   ├── _meta.json
│   ├── education/
│   ├── health/
│   └── goals/
├── social/                 # Communities, networks, collaborations
│   ├── _meta.json
│   └── communities/
├── family/                 # Family relationships and events
│   ├── _meta.json
│   └── events/
├── _consolidated/          # Merged memories from consolidation
│   └── _meta.json
└── _archived/              # Decayed memories (recoverable)
    └── _meta.json
```

Subdirectories are created **on demand** — the agent decides placement depth based on how specific the memory is. A generic career thought lands in `professional/`, but a specific deployment incident goes to `professional/companies/acme/projects/alpha/`.

## Configuration

Brain configuration lives in `.brain/index.json` under the `config` key:

```json
{
  "config": {
    "max_depth": 6,
    "consolidation_threshold": 0.3,
    "decay_check_interval_days": 7,
    "strength_boost_on_recall": 0.05,
    "auto_consolidate": true
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `max_depth` | 6 | Maximum directory nesting depth |
| `consolidation_threshold` | 0.3 | Strength below which memories are consolidation candidates |
| `decay_check_interval_days` | 7 | How often to suggest decay maintenance |
| `strength_boost_on_recall` | 0.05 | Strength increase per recall event |
| `auto_consolidate` | true | Suggest consolidation when candidates are found |

## Project Structure

```
brain/
├── bin/
│   └── install.js              # Interactive installer (npx brain-memory)
├── commands/
│   └── brain/                  # Slash command definitions
│       ├── init.md
│       ├── memorize.md
│       ├── remember.md
│       ├── explore.md
│       ├── consolidate.md
│       ├── forget.md
│       ├── sleep.md
│       └── status.md
├── prompts/
│   ├── claude.md               # CLAUDE.md content (injected by installer)
│   └── gemini.md               # GEMINI.md content (injected by installer)
├── hooks/
│   ├── session-start.md        # Ambient memory loading guidance
│   └── session-end.md          # Auto-memorize suggestion guidance
├── templates/
│   └── default-categories.json # Default brain category definitions
├── src/
│   ├── scorer.js               # Decay, relevance, and recall scoring
│   └── index-manager.js        # Index CRUD operations
├── CLAUDE.md                   # Development guide for this repo
├── package.json
└── README.md
```

## Inspired By

- [get-shit-done](https://github.com/gsd-build/get-shit-done) — Structured file-based workflow orchestration for AI agents
- [Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564) — Comprehensive survey on agent memory architectures
- [Mem0](https://arxiv.org/pdf/2504.19413) — Human-like memory reinforcement and decay
- [MemOS](https://arxiv.org/pdf/2507.03724) — Memory lifecycle state management
- Human episodic memory — How our brains organize, strengthen, consolidate, and forget experiences

## License

MIT
