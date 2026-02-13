# /brain:sleep — Overnight Memory Reorganization

You are performing a **sleep cycle** on the Brain Memory system. Just like the human brain during sleep — where the hippocampus replays recent experiences and the neocortex reorganizes them into long-term structured knowledge — this command restructures, consolidates, prunes, and deepens the `.brain/` hierarchy.

**Scope:** $ARGUMENTS

## Overview

Sleep performs five phases, mimicking real neuroscience:

1. **Replay** — Scan recent activity and compute decay across all memories
2. **Reorganize** — Detect flat clusters and restructure into deeper sub-categories
3. **Consolidate** — Merge weak related memories into stronger combined knowledge
4. **Prune** — Archive memories that have decayed beyond recovery
5. **Expertise Detection** — Identify dense knowledge areas and generate expertise profiles

---

## Phase 1: Replay (Hippocampal Scan)

During sleep, the hippocampus replays the day's events. Here, we scan and assess the full brain state.

### Steps

1. Read `.brain/index.json` to load all memories
2. If $ARGUMENTS specifies a category path, limit scope to that subtree. Otherwise, process the entire brain.
3. For **every** memory, compute the current decayed strength:

```
days_elapsed = (now - last_accessed) / (1000 * 60 * 60 * 24)
decayed_strength = strength * (decay_rate ^ days_elapsed)
```

4. Categorize each memory into tiers:
   - **Strong** (decayed_strength >= 0.6) — healthy, no action needed
   - **Moderate** (0.3 <= decayed_strength < 0.6) — consolidation candidates
   - **Weak** (0.1 <= decayed_strength < 0.3) — urgent: consolidate or lose
   - **Fading** (decayed_strength < 0.1) — prune candidates

5. Collect statistics:
   - Memories per tier
   - Memories per directory (for cluster detection)
   - Tag frequency analysis (for sub-category extraction)

Present a brief replay summary before continuing:

```
## Phase 1: Replay Complete

Scanned <N> memories across <M> categories

  Strong (>=0.6):   <count> memories — healthy
  Moderate (0.3-0.6): <count> memories — consolidation candidates
  Weak (0.1-0.3):   <count> memories — urgent attention needed
  Fading (<0.1):    <count> memories — pruning candidates

Proceeding to reorganization...
```

---

## Phase 2: Reorganize (Neocortical Restructuring)

During sleep, the brain transfers memories from the hippocampus to the neocortex, organizing them into structured long-term storage. This phase detects **flat clusters** — directories with many memories that should be organized into deeper sub-categories.

### Steps

1. **Scan for flat clusters**: For each directory in the brain, count the number of memory files (not counting `_meta.json`).

2. **Identify restructuring candidates** — directories where:
   - There are **3 or more** memory files at the same level, AND
   - The memories can be meaningfully grouped by **tag overlap**, **title similarity**, or **semantic themes**

3. **Extract sub-categories**: For each candidate directory, analyze the memory files within it:
   - Read each memory's tags, title, and content summary
   - Identify natural groupings (2+ memories that share a common theme)
   - Propose sub-category directory names using kebab-case

   **Sub-category extraction rules:**
   - A group needs at least **2 memories** to justify a sub-category
   - The sub-category name should be a **clear, descriptive noun** (e.g., `authentication`, `state-management`, `deployment`)
   - Memories that don't fit any group stay at the current level (don't force-categorize)
   - Never exceed `max_depth` from config

4. **Present the reorganization plan** to the user:

```
## Phase 2: Reorganization Plan

### professional/skills/ (7 memories → 3 sub-categories)

Current (flat):
  ├── flutter-auth-basics.md
  ├── flutter-oauth-flow.md
  ├── flutter-token-refresh.md
  ├── flutter-state-riverpod.md
  ├── flutter-bloc-pattern.md
  ├── react-hooks-patterns.md
  └── react-server-components.md

Proposed (restructured):
  ├── flutter/
  │   ├── authentication/          ← NEW sub-category
  │   │   ├── flutter-auth-basics.md
  │   │   ├── flutter-oauth-flow.md
  │   │   └── flutter-token-refresh.md
  │   └── state-management/        ← NEW sub-category
  │       ├── flutter-state-riverpod.md
  │       └── flutter-bloc-pattern.md
  └── react/                       ← NEW sub-category
      ├── react-hooks-patterns.md
      └── react-server-components.md
```

5. **Get user approval**: The user can:
   - Approve all reorganizations
   - Select specific reorganizations
   - Modify proposed groupings
   - Skip this phase entirely

6. **Execute approved reorganizations**:
   - Create new sub-category directories with `_meta.json`
   - Move memory files to their new locations
   - Update `index.json` with new paths for all moved memories
   - Update `_meta.json` in affected directories (memory counts, subcategories)
   - **Preserve all memory content and metadata** — only the path changes

---

## Phase 3: Consolidate (Memory Integration)

During deep sleep, the brain merges related experiences into generalized knowledge. Weak memories that share themes are combined into stronger, more durable memories.

### Steps

1. From the Phase 1 scan, take all **Moderate** and **Weak** tier memories (decayed_strength < 0.6)

2. Group consolidation candidates by:
   - **Path proximity** — memories in the same or nearby directories (highest priority after reorganization)
   - **Tag overlap** — memories sharing 2+ tags
   - **Type similarity** — same memory type
   - **Temporal proximity** — created within similar time periods

3. For each viable group (2+ memories):
   - Read all source memories fully
   - Synthesize a consolidated memory that:
     - Preserves all key details and insights
     - Identifies patterns and evolution across the memories
     - Creates a coherent narrative
     - Is more concise than the sum of its parts
   - Calculate: `new_strength = max(source_strengths) + 0.15` (capped at 1.0)
   - Use the slowest decay rate from the sources
   - Merge all tags (union)

4. Present consolidation plan to user for approval (same format as `/brain:consolidate`)

5. For approved consolidations:
   - Write consolidated memory files using the standard format with `type: consolidated`
   - Archive source memories to `.brain/_archived/`
   - Update `index.json` and `_meta.json` files

---

## Phase 4: Prune (Synaptic Homeostasis)

During sleep, the brain prunes weak synaptic connections to maintain efficiency. Here, we archive memories that have faded beyond usefulness.

### Steps

1. Take all **Fading** tier memories (decayed_strength < 0.1) that were NOT already consolidated in Phase 3

2. Present the prune list:

```
## Phase 4: Pruning Faded Memories

The following memories have decayed below 0.1 strength and are no longer contributing meaningfully:

| # | Title | Path | Original | Decayed | Days Since Access |
|---|-------|------|----------|---------|-------------------|
| 1 | Old Deploy Notes | professional/... | 0.35 | 0.04 | 182d |
| 2 | Temp Fix Idea | personal/... | 0.25 | 0.02 | 210d |

Action: Archive to _archived/ (recoverable if needed)
```

3. Get user approval (default: archive all)

4. Execute: Move to `.brain/_archived/`, preserving directory structure. Update `index.json` and `_meta.json` files.

---

## Phase 5: Expertise Detection (Knowledge Crystallization)

This is the most powerful phase. When the brain repeatedly processes information in a domain, it forms **expertise** — fast, intuitive access to deep knowledge. Here, we detect when a sub-tree has become dense enough to represent genuine expertise.

### Steps

1. **Scan for expertise candidates**: For each directory (including newly reorganized ones), evaluate:
   - **Memory density**: 3+ memories in the subtree
   - **Average strength**: Mean decayed strength of memories in the subtree
   - **Recall frequency**: Sum of `access_count` across memories in the subtree
   - **Time span**: Duration between the oldest and newest memory
   - **Topic coherence**: How tightly related the memories are (based on tag overlap)

2. **Calculate expertise score** for each candidate directory:

```
density_score    = min(1.0, memory_count / 5)
strength_score   = average_decayed_strength
recall_score     = min(1.0, total_access_count / 10)
span_score       = min(1.0, time_span_days / 30)
coherence_score  = shared_tags / total_unique_tags

expertise_score  = (0.25 * density_score) + (0.25 * strength_score) + (0.20 * recall_score) + (0.15 * span_score) + (0.15 * coherence_score)
```

3. **Classify expertise level** based on the score:
   - **Awareness** (0.2 - 0.4) — Surface-level familiarity. You know it exists.
   - **Working Knowledge** (0.4 - 0.6) — Can work with this competently with some reference.
   - **Deep Knowledge** (0.6 - 0.8) — Strong command. Can reason about trade-offs and edge cases.
   - **Expert** (0.8 - 1.0) — Mastery. Dense, frequently-recalled, long-standing knowledge.

4. **Generate or update expertise profiles**: For each directory scoring >= 0.2, create or update an `_expertise.md` file:

```markdown
---
expertise_level: deep-knowledge
expertise_score: 0.72
memory_count: 6
average_strength: 0.78
total_recalls: 14
time_span_days: 45
last_evaluated: <ISO timestamp>
key_topics: [oauth2, token-refresh, biometric-auth, session-management]
---

# Expertise: Flutter Authentication

**Level:** Deep Knowledge (0.72)

You have strong command of Flutter authentication patterns. Your knowledge spans
OAuth2 flows, token management, biometric authentication, and session handling.
You can reason about trade-offs between different auth strategies and handle
edge cases in token refresh flows.

## What You Know Well
- OAuth2 authorization code flow with PKCE for mobile
- Token refresh strategies and silent re-authentication
- Biometric auth integration on iOS and Android
- Session persistence and secure storage patterns

## Knowledge Gaps
- SAML/enterprise SSO integration (no memories found)
- Multi-factor authentication flows (limited coverage)
- Auth testing strategies (no memories found)

## Contributing Memories
1. **Flutter Auth Basics** (authentication/flutter-auth-basics.md) — strength: 0.82
2. **OAuth2 Flow Deep Dive** (authentication/flutter-oauth-flow.md) — strength: 0.88
3. **Token Refresh Patterns** (authentication/flutter-token-refresh.md) — strength: 0.75
...
```

5. **Knowledge gap detection**: By analyzing what sub-topics exist vs. what commonly appears alongside them (using tag relationships across the whole brain), identify areas where expertise could be deepened. List these as "Knowledge Gaps" in the expertise profile.

6. Present expertise findings:

```
## Phase 5: Expertise Map

### Expert (0.8+)
  None yet — keep learning!

### Deep Knowledge (0.6-0.8)
  ⬆ professional/skills/flutter/authentication/ — 0.72 (6 memories, 14 recalls)
    "Strong command of OAuth2, token management, biometric auth"

### Working Knowledge (0.4-0.6)
  → professional/skills/react/ — 0.51 (3 memories, 5 recalls)
    "Can work with hooks and server components competently"

### Awareness (0.2-0.4)
  ○ personal/education/psychology/child-development/ — 0.32 (2 memories, 1 recall)
    "Surface familiarity with developmental stages"
```

---

## Sleep Report

After all phases complete, present a comprehensive sleep report:

```
╔═══════════════════════════════════════════════════════════════╗
║                    🌙 SLEEP CYCLE COMPLETE                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Phase 1 — Replay:          <N> memories scanned              ║
║  Phase 2 — Reorganized:     <N> memories moved into           ║
║                              <M> new sub-categories            ║
║  Phase 3 — Consolidated:    <N> memories merged into <M>      ║
║  Phase 4 — Pruned:          <N> faded memories archived       ║
║  Phase 5 — Expertise:       <N> domains profiled              ║
║                                                               ║
║  Brain Health:                                                ║
║    Before sleep: <count> memories, avg strength <X>           ║
║    After sleep:  <count> memories, avg strength <Y>           ║
║    Expertise areas: <count> domains mapped                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

### Expertise Summary
<expertise level list from Phase 5>

### Recommendations
- <actionable suggestions based on what sleep revealed>
```

---

## Important Rules

1. **Always ask for approval** before executing reorganization, consolidation, or pruning. Present the plan first.
2. **Never delete permanently** — pruned memories go to `_archived/` (recoverable).
3. **Preserve all content** — reorganization only changes paths, never memory content.
4. **Update all references** — when moving files, update `index.json`, all `_meta.json` files, and `related` fields in other memories that reference moved memories.
5. **Respect max_depth** — never create directories beyond the configured `max_depth`.
6. **Scope control** — if $ARGUMENTS specifies a path (e.g., "professional/skills"), only sleep-process that subtree.
7. **Idempotent expertise** — if `_expertise.md` already exists, update it rather than creating a duplicate.
8. **Skip empty phases** — if there's nothing to do in a phase (e.g., no flat clusters to reorganize), briefly note it and move on.
