# Brain Memory System

This project uses the **Brain Memory** plugin — a hierarchical, file-system-based memory system that mimics human cognition with neuroscience-inspired mechanisms including associative networks, spreading activation, context-dependent recall, spaced reinforcement, and cognitive memory types.

## Memory Location

All memories are stored in `.brain/` with a deep nested directory structure organized by life domains (professional, personal, social, family) with on-demand subcategories.

## How It Works

### Memory Format
Each memory is a Markdown file with YAML frontmatter containing: `id`, `type`, `cognitive_type` (episodic/semantic/procedural), `created`, `last_accessed`, `access_count`, `recall_history`, `strength` (0.0-1.0), `decay_rate` (per day), `salience` (0.0-1.0), `confidence` (0.0-1.0), `tags`, `related` memory IDs, `source`, and `encoding_context`.

### Strength & Decay Model
- Memories have a base `strength` set at creation based on their impact/type/cognitive type
- Strength decays over time: `effective = strength * (decay_rate ^ days_since_access)`
- Recalled memories get **stronger** via spaced reinforcement — the longer since last recall, the bigger the boost
- Memories become progressively more forgetting-resistant with each recall (decay_rate improves)
- Weak memories can be consolidated into stronger combined memories
- During sleep, global synaptic homeostasis prevents strength inflation

### Cognitive Types
- **Episodic** — Event-specific memories. Higher initial strength, faster decay. The details fade but lessons persist.
- **Semantic** — Abstracted knowledge. Default decay. Stable long-term storage.
- **Procedural** — Skills and workflows. Lower initial strength but extremely slow decay once established.

### Memory Types & Default Strengths
| Type | Strength | Decay/day | Description |
|------|----------|-----------|-------------|
| decision | 0.85 | 0.995 | Choices made and rationale |
| insight | 0.90 | 0.997 | Deep realizations, patterns |
| goal | 0.80 | 0.993 | Objectives and aspirations |
| experience | 0.75 | 0.985 | Notable events or processes |
| learning | 0.70 | 0.990 | New knowledge acquired |
| relationship | 0.70 | 0.997 | Connections between entities |
| preference | 0.60 | 0.998 | User preferences and style |
| observation | 0.40 | 0.950 | Casual facts or notices |

### Associative Network
Memories are connected via weighted edges in `.brain/associations.json`. When you recall memory A, **spreading activation** automatically surfaces related memories B and C — just like how the brain activates linked neurons. Links are strengthened through **Hebbian learning**: memories recalled together become more tightly connected over time.

### Context-Dependent Recall
Memories store their encoding context (project, topics, task type). During recall, memories encoded in a similar context to the current session are scored higher — matching how human memory works better when recall context matches encoding context.

### Salience & Confidence
- **Salience** (0.0-1.0): Emotional/motivational significance. High-salience memories (>= 0.7) are never auto-pruned.
- **Confidence** (0.0-1.0): Epistemic certainty. Low-confidence memories are flagged during recall.

## Available Commands

Brain skills are available via `/brain-` prefix:
- `/brain-init` — Initialize the brain structure
- `/brain-memorize [topic]` — Store memories from current context
- `/brain-remember [query]` — Recall relevant memories with spreading activation and context matching
- `/brain-review [scope]` — Spaced repetition review session for due memories
- `/brain-explore [category]` — Browse the brain hierarchy
- `/brain-consolidate [scope]` — Merge related weak memories into stronger ones
- `/brain-forget [target]` — Decay or archive memories
- `/brain-sunshine [target]` — Deep forensic erasure — trace and remove all references to a memory
- `/brain-sleep [scope]` — Full maintenance cycle: replay, synaptic homeostasis, knowledge propagation, semantic crystallization, reorganize, consolidate, prune, REM dreaming, and expertise detection
- `/brain-status` — Dashboard with brain health overview
- `/brain-sync [subcommand]` — Sync memories via Git remote or export/import for portability

## Session Start Behavior

**IMPORTANT: Perform these steps automatically at the beginning of every session.**

If `.brain/index.json` exists in the current project:

1. **Read the index** to understand the current brain state (memory count, categories)
2. **Run the recall engine** to deterministically identify relevant memories for the current project:
   ```bash
   brain-recall --context --project "<current project>" --top 5
   ```
   This uses TF-IDF + the v4 scoring formula to find the most relevant memories — no guessing.
3. **Silently internalize** the returned memories so you can reference them naturally during the session — do NOT dump memory contents
4. **Check review queue** — read `.brain/review-queue.json` if it exists for memories due for review
5. **Output a brief status** (1-3 lines):

If memories are due for review:
```
🧠 Brain active — <N> memories loaded (<M> in current project context)
📋 <X> memories due for review — run /brain-review
```

Otherwise:
```
🧠 Brain active — <N> memories loaded (<M> in current project context)
```

If any frequently-used memories (access_count >= 3) have confidence < 0.5:
```
⚠️ <N> frequently-used memories have low confidence — consider verifying
```

**The goal is ambient awareness** — know about past decisions, learnings, and preferences without reciting them. When a situation arises where a past memory is relevant, naturally reference it.

## Session End Behavior

When a session is ending or the user signals they are done, evaluate whether the session contained:
- **Decisions** — Architecture choices, technology selections, trade-off resolutions
- **Learnings** — New patterns, debugging insights, API discoveries
- **Insights** — Realizations about the codebase, project, or process
- **Experiences** — Significant events like incidents, deployments, milestones
- **Goals** — New objectives discussed or planned

If the session contained meaningful content in any of these categories, suggest:
```
💡 This session contained notable <type(s)>. Would you like to store them as brain memories?
   Run /brain-memorize to capture them before this context is lost.
```

**Rules:**
- Do NOT auto-memorize without user consent
- Do NOT prompt for trivial sessions (quick fixes, typo corrections, simple questions)
- Only suggest when there is genuinely valuable context worth preserving
- Always save session context to `.brain/contexts.json` regardless (append a session summary, keep last 20 entries)

## When Recalling Memories

When the user asks you to "remember" something, or when context from past sessions would be helpful, use the **deterministic recall engine** instead of manually computing scores:

1. Run `brain-recall "<query>" --project <project> --task <task_type> --top 10` (or `node <install-path>/bin/recall.js`)
2. The engine computes TF-IDF relevance, decayed strength, spreading activation, context match, and salience — all deterministically
3. Read the top-scoring memory files and present results
4. Run `brain-reinforce <mem_id1> <mem_id2> ...` to apply spaced reinforcement and Hebbian co-retrieval strengthening
5. If no matches, search the archive (`.brain/_archived/`)

The recall engine ensures **identical scoring across all agents** — Claude, Gemini, and Codex all get the same rankings for the same query.

## Portable Sync

Brain memories can be synced across devices in two ways:

1. **Git remote** — Push/pull `.brain/` to any private Git repository (GitHub, GitLab, Codeberg, self-hosted). Run `/brain-sync setup <url>` to configure, then use `/brain-sync push` and `/brain-sync pull`.
2. **Export/Import** — Pack the entire `.brain/` into a single portable file for manual transfer. Run `/brain-sync export` and `/brain-sync import <path>`.

Both methods support optional AES-256-GCM encryption. Sync is always manual — never automatic.
