# /brain:memorize — Store a New Memory

You are storing a new memory in the Brain Memory system. Memories are filed into the `.brain/` hierarchical directory structure based on their semantic content.

**User input:** $ARGUMENTS

## Steps

### 1. Determine Memory Content

If the user provided specific content in $ARGUMENTS, use that as the basis for the memory.

If $ARGUMENTS is empty or vague, analyze the **current conversation context** and extract the most significant learnings, decisions, insights, or experiences from the session. Summarize them into one or more distinct memories.

### 2. Classify Each Memory

For each memory to store, determine:

**Type** (one of):
- `decision` — A choice that was made and why (strength: 0.85, decay: 0.995/day)
- `learning` — Something new that was learned (strength: 0.70, decay: 0.990/day)
- `experience` — A notable event or process (strength: 0.75, decay: 0.985/day)
- `insight` — A deep realization or pattern (strength: 0.90, decay: 0.997/day)
- `observation` — A casual notice or fact (strength: 0.40, decay: 0.950/day)
- `goal` — An objective or aspiration (strength: 0.80, decay: 0.993/day)
- `preference` — A user preference or style (strength: 0.60, decay: 0.998/day)
- `relationship` — A connection between people/things (strength: 0.70, decay: 0.997/day)

**Impact assessment** — Adjust the base strength up or down by up to ±0.15 based on:
- How significant is this to the user's life/work?
- Is this likely to be needed again?
- Does it represent a turning point or just routine?

**Cognitive type** (one of):
- `episodic` — Tied to a specific event/time. Add +0.10 to strength (vivid at first, fades faster). Multiply decay rate by 0.995. E.g., "The deployment failed Tuesday because X"
- `semantic` — Abstracted knowledge, context-free. Use default strength/decay. E.g., "React hooks must follow rules of hooks"
- `procedural` — How-to workflows, skills. Subtract -0.10 from strength but multiply decay rate by 1.003 (extremely slow decay once established). E.g., "Steps to debug memory leaks"

**Salience** (0.0-1.0) — How emotionally or motivationally significant this memory is:
- 0.0-0.3: Low — routine information
- 0.4-0.6: Moderate — professionally relevant
- 0.7-1.0: High — critical decisions, hard-won lessons, emotionally significant events. High-salience memories are NEVER auto-pruned.

**Confidence** (0.0-1.0) — Epistemic certainty about the memory's accuracy:
- 0.9-1.0: Verified/tested firsthand
- 0.7-0.8: Reliable source, consistent with experience
- 0.5-0.6: Plausible but unverified
- 0.1-0.4: Uncertain, speculative, or hearsay

### 3. Determine File Path (Categorization)

Choose the most appropriate path in the `.brain/` hierarchy. This is the most critical step.

**Rules for path selection:**
1. Start with the top-level category: `professional/`, `personal/`, `social/`, `family/`
2. Go as deep as semantically justified — but not deeper than necessary
3. Create subdirectories on demand if they don't exist (add `_meta.json` for each)
4. Use kebab-case for directory and file names
5. File name should be a short descriptive slug + `.md`

**Depth guidelines:**
- Generic career thought → `professional/career-direction.md`
- Decision about a specific company → `professional/companies/acme-corp/joining-decision.md`
- A specific project issue → `professional/companies/acme-corp/projects/alpha/deployment-incident.md`
- Learning TypeScript → `personal/education/typescript-generics.md`
- User prefers dark mode → `personal/preferences/dark-mode.md`

**If a memory spans categories**, place it in the most relevant one and note the cross-reference in `related` metadata.

### 4. Generate Memory ID

Format: `mem_<YYYYMMDD>_<6-char-random-hex>`

Example: `mem_20260213_a3f2c1`

### 5. Write Memory File

Create the memory file at the determined path with this format:

```markdown
---
id: <memory_id>
type: <memory_type>
cognitive_type: <episodic|semantic|procedural>
created: <ISO timestamp>
last_accessed: <ISO timestamp>
access_count: 0
recall_history: []
strength: <calculated strength 0.0-1.0>
decay_rate: <decay rate per day>
salience: <0.0-1.0>
confidence: <0.0-1.0>
tags: [<relevant tags>]
related: [<related memory IDs if any>]
source: <brief session identifier or context>
encoding_context:
  project: <current project name>
  topics: [<2-5 key topics from session>]
  task_type: <debugging|implementing|designing|reviewing|discussing|learning>
---

# <Short Descriptive Title>

<2-5 sentence summary of the memory. Be specific and actionable. Include the WHY, not just the WHAT.>

## Context

<1-3 sentences about the circumstances — when, where, what was happening>

## Key Details

<Bullet points of the most important specifics>

## Connections

<How this relates to other knowledge, patterns, or goals — if applicable>
```

### 6. Update Index

Read `.brain/index.json` and add an entry:

```json
{
  "<memory_id>": {
    "path": "<relative path from .brain/>",
    "title": "<short title>",
    "type": "<memory_type>",
    "cognitive_type": "<episodic|semantic|procedural>",
    "strength": <strength>,
    "decay_rate": <decay_rate>,
    "salience": <salience>,
    "confidence": <confidence>,
    "created": "<ISO timestamp>",
    "last_accessed": "<ISO timestamp>",
    "access_count": 0,
    "tags": ["<tags>"],
    "encoding_context": {
      "project": "<project>",
      "topics": ["<topics>"],
      "task_type": "<task_type>"
    }
  }
}
```

Increment `memory_count`. Update `last_updated`.

### 7. Update Associations

Read `.brain/associations.json` and create edges for this memory:

**A. Explicit `related` links:** For each ID in the `related` field, create an edge with weight 0.20 and origin `manual`.

**B. Auto-discovered links:** Scan `index.json` for other memories sharing **2 or more tags** with this memory. For each match, create an edge with weight 0.10 and origin `tag_overlap`.

Use the `reinforceEdge()` function — if an edge already exists (e.g., the related memory already links back), it will be strengthened via Hebbian reinforcement instead of creating a duplicate.

Write the updated `associations.json`.

### 8. Update _meta.json

Update the `_meta.json` in each directory along the path:
- Increment `memory_count`
- Add new subcategories to the `subcategories` array if any were created

### 9. Confirm

Print what was stored:
- Memory title and ID
- Full path in the brain
- Assigned type, cognitive type, and strength
- Salience and confidence levels
- Tags
- Association edges created (count and targets)
- Any new directories that were created
