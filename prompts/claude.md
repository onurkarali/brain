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

- `/brain:init` — Initialize the brain structure
- `/brain:memorize [topic]` — Store memories from current context
- `/brain:remember [query]` — Recall relevant memories with spreading activation and context matching
- `/brain:review [scope]` — Spaced repetition review session for due memories
- `/brain:explore [category]` — Browse the brain hierarchy
- `/brain:consolidate [scope]` — Merge related weak memories into stronger ones
- `/brain:forget [target]` — Decay or archive memories
- `/brain:sleep [scope]` — Full maintenance cycle: replay, synaptic homeostasis, knowledge propagation, semantic crystallization, reorganize, consolidate, prune, REM dreaming, and expertise detection
- `/brain:status` — Dashboard with brain health overview

## Auto-Memorize Guidance

At the end of significant sessions, consider suggesting `/brain:memorize` to the user if important decisions, learnings, or insights occurred during the conversation. Do NOT automatically memorize without the user's awareness.

## When Recalling Memories

When the user asks you to "remember" something, or when context from past sessions would be helpful:
1. Check `.brain/index.json` for relevant memories
2. Load `.brain/associations.json` for spreading activation
3. Score by v4 formula: `0.38*relevance + 0.18*decayed_strength + 0.08*recency + 0.14*spreading_bonus + 0.14*context_match + 0.08*salience`
4. Return strong individual matches or synthesize from multiple related memories
5. Apply spaced reinforcement (spacing-aware boost) and improve decay rate
6. Strengthen Hebbian links between co-retrieved memories
7. If no active matches, search the archive (`.brain/_archived/`)
