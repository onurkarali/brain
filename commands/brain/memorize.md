# /brain:memorize — Store a New Memory

You are storing a new memory in the Brain Memory system. Memories are filed into the `.brain/` hierarchical directory structure based on their semantic content.

**User input:** $ARGUMENTS

## Steps

### 0. Resolve Brain Path

Determine where the brain is located:

1. Check if `~/.brain/index.json` exists (global brain)
2. Check if `.brain/index.json` exists in the current project root (project brain)
3. If **both** exist, use the **global** brain by default (the user chose global for cross-project experience). Optionally note that a project-local brain also exists.
4. If **neither** exists, inform the user and suggest running `/brain:init`

Set `BRAIN_PATH` to the resolved location. All subsequent references to `.brain/` in this command refer to `BRAIN_PATH`.

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
created: <ISO timestamp>
last_accessed: <ISO timestamp>
access_count: 0
strength: <calculated strength 0.0-1.0>
decay_rate: <decay rate per day>
tags: [<relevant tags>]
related: [<related memory IDs if any>]
source: <brief session identifier or context>
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
    "strength": <strength>,
    "decay_rate": <decay_rate>,
    "created": "<ISO timestamp>",
    "last_accessed": "<ISO timestamp>",
    "access_count": 0,
    "tags": ["<tags>"]
  }
}
```

Increment `memory_count`. Update `last_updated`.

### 7. Update _meta.json

Update the `_meta.json` in each directory along the path:
- Increment `memory_count`
- Add new subcategories to the `subcategories` array if any were created

### 8. Confirm

Print what was stored:
- Memory title and ID
- Full path in the brain
- Assigned type and strength
- Tags
- Any new directories that were created
