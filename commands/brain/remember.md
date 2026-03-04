# /brain:remember — Recall Relevant Memories

You are recalling memories from the Brain Memory system. This command searches the `~/.brain/` hierarchy, scores memories by relevance, strength, associative links, and context match, and returns the most useful memories — either individually or as a consolidated synthesis.

**User query:** $ARGUMENTS

## Steps

### 1. Parse the Query

Analyze $ARGUMENTS to determine:
- **Keywords**: Extract key terms and concepts
- **Category hints**: Does the query suggest a specific life domain? (professional, personal, social, family)
- **Time hints**: Is the user asking about recent or old memories?
- **Intent**: Are they looking for a specific memory, a pattern, or general knowledge?

### 2. Capture Recall Context

Determine the current session context for context-dependent matching:

```yaml
recall_context:
  project: <current project name>
  topics: [<key topics from query and session>]
  task_type: <debugging|implementing|designing|reviewing|discussing|learning>
```

### 3. Search the Brain

Read `~/.brain/index.json` to get the full memory inventory.

**Search strategy (in order):**

1. **Category-first**: If the query clearly maps to a category, traverse that subtree first
2. **Tag matching**: Match query keywords against memory tags
3. **Title matching**: Match against memory titles in the index
4. **Full-text search**: If index matching yields few results, read memory files in relevant categories and search content

Collect all candidate memories.

### 3.5. Spreading Activation

Read `~/.brain/associations.json`. For each candidate memory scoring > 0.3 in initial relevance:
1. Traverse the association graph up to 2 hops
2. For each reached memory: `spread_bonus = parent_score * link_weight * 0.5^hop`
3. Memories NOT in the initial candidates but reached via spreading activation with bonus >= 0.05 are **added** to the candidate pool (they were "reminded" by association)

This implements how the brain works: thinking about topic A naturally activates related topics B and C.

### 4. Score Candidates

For each candidate memory, compute an **effective score** using the v4 formula:

```
days_elapsed = (now - last_accessed) / (1000 * 60 * 60 * 24)
decayed_strength = strength * (decay_rate ^ days_elapsed)
recency_bonus = max(0, 1 - (days_elapsed / 365))
spreading_bonus = <computed in step 3.5, 0 if not reached via associations>
context_match = 0.3*(project matches) + 0.4*jaccard(topics) + 0.3*(task_type matches)
salience_bonus = salience (from memory frontmatter, default 0.5)

effective_score = 0.38 * relevance
               + 0.18 * decayed_strength
               + 0.08 * recency_bonus
               + 0.14 * spreading_bonus
               + 0.14 * context_match
               + 0.08 * salience_bonus
```

**Note:** If a memory lacks some fields (spreading_bonus, context_match, salience), the formula renormalizes weights across the available terms.

### 5. Decide Response Strategy

Based on the scored results:

**Case A — Single strong match (top score > 0.7 and 2x higher than second):**
Return the full memory content directly.

**Case B — Multiple related memories (2-5 candidates with scores > 0.4):**
Read all candidate memory files and synthesize a **consolidated response** that:
- Weaves together insights from all relevant memories
- Notes which memories contributed (by ID and title)
- Highlights patterns or evolution across memories
- Presents the most current/relevant information prominently

**Case C — Many weak matches (>5 candidates, all scores < 0.4):**
List the top 5-7 memories with titles, paths, types, and effective scores.
Ask the user which ones they'd like to explore in detail.

**Case D — No matches in active brain:**
Search `~/.brain/_archived/` via the archive index (`_archived/index.json`). If archived matches are found with relevance > 0.3:
- Present them with a note that they're archived
- Offer to restore them (move back to active brain with strength +0.10)

If still no matches, inform the user and suggest:
- Trying different keywords
- Exploring the brain structure with `/brain:explore`
- Storing new memories with `/brain:memorize`

### 6. Reinforce Retrieved Memories (Spaced Reinforcement)

For every memory that was returned to the user (Cases A and B), apply spaced reinforcement:

**Calculate spacing-aware boost:**
```
daysSinceLastAccess = (now - last_accessed) / (1000 * 60 * 60 * 24)
recallCount = access_count (or len(recall_history))
spacingMultiplier = min(3.0, 1.0 + log2(1 + daysSinceLastAccess))
diminishingFactor = 1.0 / (1.0 + 0.1 * recallCount)
boost = 0.05 * spacingMultiplier * diminishingFactor
```

Examples: 1 day gap = +0.05, 7 days = +0.08, 30 days = +0.10, cramming same day 20th recall = +0.02.

**Update in both the memory file AND index.json:**
- `last_accessed` → current timestamp
- `access_count` → increment by 1
- `recall_history` → append current timestamp
- `strength` → min(1.0, strength + boost)
- `decay_rate` → improved via: `decay_rate + 0.10 * (0.999 - decay_rate)` (memories become progressively more forgetting-resistant)

### 7. Hebbian Co-Retrieval Learning

When multiple memories are returned together (Case B), strengthen their mutual association edges in `associations.json`:
- For each pair of retrieved memories, call `reinforceEdge()` with origin `co_retrieval`
- This implements "neurons that fire together wire together" — memories recalled in the same context become more tightly linked over time

Write the updated `associations.json`.

### 8. Present Results

Format the output clearly. Include confidence indicators for low-confidence memories.

```
## Recalled Memory: <Title>

**Path:** ~/.brain/<path>
**Strength:** <decayed_strength> (original: <base_strength>)
**Type:** <type> (<cognitive_type>) | **Created:** <date> | **Recalled:** <access_count> times
**Confidence:** <confidence> <show ⚠️ if < 0.5>

<memory content>

---
*Memory reinforced — strength updated to <new_strength>, decay improved to <new_decay_rate>*
```

For consolidated responses (Case B):

```
## Synthesized from <N> memories

<consolidated narrative>

### Contributing Memories
1. **<title>** (~/.brain/<path>) — score: <score>, confidence: <confidence>
2. **<title>** (~/.brain/<path>) — score: <score>, confidence: <confidence>
...

---
*<N> memories reinforced, <M> association links strengthened*
```

For archived matches (Case D fallback):

```
## Found in Archive: <Title>

**Path:** ~/.brain/_archived/<path>
**Original Strength:** <strength> | **Archived:** <date>

<memory content summary>

---
*Would you like to restore this memory to active brain?*
```
