# Brain Memory System

This project uses the **Brain Memory** plugin — a hierarchical, file-system-based memory system that mimics human cognition.

## Memory Location

The brain can exist in two locations:

- **Global (`~/.brain/`)** — A single brain shared across ALL projects and runtimes. Experiences, decisions, and learnings from any project are available everywhere.
- **Project (`.brain/`)** — Isolated brain local to the current project only.

**Resolution order when looking for the brain:**
1. If `~/.brain/index.json` exists, use it (global brain)
2. If `.brain/index.json` exists in the project root, use it (project brain)
3. If both exist, prefer global for cross-project knowledge; search both when recalling

Memories are organized in a deep nested directory structure by life domains (professional, personal, social, family) with on-demand subcategories.

## How It Works

### Memory Format
Each memory is a Markdown file with YAML frontmatter containing: `id`, `type`, `created`, `last_accessed`, `access_count`, `strength` (0.0-1.0), `decay_rate` (per day), `tags`, and `related` memory IDs.

### Strength & Decay Model
- Memories have a base `strength` set at creation based on their impact/type
- Strength decays over time: `effective = strength * (decay_rate ^ days_since_access)`
- Recalled memories get **stronger** (+0.05 per recall, capped at 1.0)
- Unaccessed memories gradually fade
- Weak memories can be consolidated into stronger combined memories

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

## Available Commands

Brain skills are available via `/brain-` prefix:
- `/brain-init` — Initialize the brain structure
- `/brain-memorize [topic]` — Store memories from current context
- `/brain-remember [query]` — Recall relevant memories with strength-based scoring
- `/brain-explore [category]` — Browse the brain hierarchy
- `/brain-consolidate [scope]` — Merge related weak memories into stronger ones
- `/brain-forget [target]` — Decay or archive memories
- `/brain-sleep [scope]` — Full maintenance cycle: replay, knowledge propagation, reorganize, consolidate, prune, and expertise detection
- `/brain-status` — Dashboard with brain health overview

## Auto-Memorize Guidance

At the end of significant sessions, consider suggesting `/brain-memorize` to the user if important decisions, learnings, or insights occurred during the conversation. Do NOT automatically memorize without the user's awareness.

## When Recalling Memories

When the user asks you to "remember" something, or when context from past sessions would be helpful:
1. Check for brain at `~/.brain/index.json` (global) and/or `.brain/index.json` (project) for relevant memories
2. Score by: `0.55 * relevance + 0.30 * decayed_strength + 0.15 * recency_bonus`
3. Return strong individual matches or synthesize from multiple related memories
4. Always reinforce (update access_count, last_accessed, strength) the memories you retrieve
