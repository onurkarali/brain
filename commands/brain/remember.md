# /brain:remember — Recall Relevant Memories

You are recalling memories from the Brain Memory system. This command searches the `.brain/` hierarchy, scores memories by relevance and strength, and returns the most useful memories — either individually or as a consolidated synthesis.

**User query:** $ARGUMENTS

## Steps

### 1. Parse the Query

Analyze $ARGUMENTS to determine:
- **Keywords**: Extract key terms and concepts
- **Category hints**: Does the query suggest a specific life domain? (professional, personal, social, family)
- **Time hints**: Is the user asking about recent or old memories?
- **Intent**: Are they looking for a specific memory, a pattern, or general knowledge?

### 2. Search the Brain

Read `.brain/index.json` to get the full memory inventory.

**Search strategy (in order):**

1. **Category-first**: If the query clearly maps to a category, traverse that subtree first
2. **Tag matching**: Match query keywords against memory tags
3. **Title matching**: Match against memory titles in the index
4. **Full-text search**: If index matching yields few results, read memory files in relevant categories and search content

Collect all candidate memories.

### 3. Score Candidates

For each candidate memory, compute an **effective score**:

```
days_elapsed = (now - last_accessed) / (1000 * 60 * 60 * 24)
decayed_strength = strength * (decay_rate ^ days_elapsed)
relevance = <0.0-1.0 based on how well this matches the query>
effective_score = (0.55 * relevance) + (0.30 * decayed_strength) + (0.15 * recency_bonus)
```

Where `recency_bonus = max(0, 1 - (days_elapsed / 365))` — memories less than a year old get a recency bonus that linearly decays.

### 4. Decide Response Strategy

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

**Case D — No matches:**
Inform the user that no relevant memories were found. Suggest:
- Trying different keywords
- Exploring the brain structure with `/brain:explore`
- Storing new memories with `/brain:memorize`

### 5. Reinforce Retrieved Memories

For every memory that was returned to the user (Cases A and B), update:
- `last_accessed` → current timestamp
- `access_count` → increment by 1
- `strength` → min(1.0, strength + 0.05) — recalled memories get stronger

Update both the memory file's YAML frontmatter AND the corresponding entry in `index.json`.

### 6. Present Results

Format the output clearly:

```
## Recalled Memory: <Title>

**Path:** .brain/<path>
**Strength:** <decayed_strength> (original: <base_strength>)
**Type:** <type> | **Created:** <date> | **Recalled:** <access_count> times

<memory content>

---
*Memory reinforced — strength updated to <new_strength>*
```

For consolidated responses (Case B):

```
## Synthesized from <N> memories

<consolidated narrative>

### Contributing Memories
1. **<title>** (.brain/<path>) — strength: <score>
2. **<title>** (.brain/<path>) — strength: <score>
...

---
*<N> memories reinforced*
```
