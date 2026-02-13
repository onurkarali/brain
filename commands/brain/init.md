# /brain:init — Initialize Brain Memory Structure

You are initializing the Brain Memory system. This creates a `.brain/` directory that serves as a hierarchical, file-system-based memory store inspired by human cognition.

## Steps

### 1. Choose Brain Scope

Ask the user where they want their brain to live:

```
Where would you like to create the brain?

  1) Global  — ~/.brain/ — Shared across ALL projects and runtimes (recommended)
  2) Project — .brain/  — Local to this project only
```

- **Global (`~/.brain/`)**: A single brain that grows with every project. Experiences, decisions, and learnings from any project are available everywhere. Works identically across Claude Code, Gemini CLI, and OpenAI Codex.
- **Project (`.brain/`)**: Isolated brain for this project only. Memories stay within this repository.

If the user does not specify, default to **global**.

Set `BRAIN_PATH` based on the user's choice:
- Global: `~/.brain/` (resolved to the user's home directory)
- Project: `.brain/` (relative to the current project root)

### 2. Check for Existing Brain

Check if a `.brain/` directory already exists at `BRAIN_PATH`.

- If it exists, inform the user and ask if they want to reset or keep it.
- If not, proceed with creation.

### 3. Create Directory Structure

Create the following structure at `BRAIN_PATH`:

```
<BRAIN_PATH>/
├── index.json
├── professional/
│   └── _meta.json
├── personal/
│   └── _meta.json
├── social/
│   └── _meta.json
├── family/
│   └── _meta.json
└── _consolidated/
    └── _meta.json
```

### 4. Create index.json

```json
{
  "version": 1,
  "scope": "<global|project>",
  "created": "<current ISO timestamp>",
  "last_updated": "<current ISO timestamp>",
  "memory_count": 0,
  "memories": {},
  "config": {
    "max_depth": 6,
    "consolidation_threshold": 0.3,
    "decay_check_interval_days": 7,
    "strength_boost_on_recall": 0.05,
    "auto_consolidate": true,
    "propagation_window_days": 7
  }
}
```

The `scope` field records whether this brain is global or project-local.

### 5. Create _meta.json for Each Top Category

For each top-level category (professional, personal, social, family, _consolidated), create a `_meta.json`:

```json
{
  "category": "<category_name>",
  "description": "<description from defaults>",
  "created": "<current ISO timestamp>",
  "memory_count": 0,
  "subcategories": []
}
```

### 6. Ask User for Customization (Optional)

Ask the user:
- "Would you like to add any custom top-level categories beyond the defaults (professional, personal, social, family)?"
- "Do you have specific subcategories you'd like pre-created? (e.g., a company name under professional/companies/)"

If the user provides custom categories or subcategories, create them with appropriate `_meta.json` files.

### 7. Add .brain to .gitignore (Optional)

If the brain is **project-local**, ask the user if they want `.brain/` added to `.gitignore` (some users may want to track their memory in git, others may not).

If the brain is **global**, skip this step (global brains are not inside any project's git repo).

### 8. Confirm

Print a summary of what was created, including:
- The brain scope (global or project) and full path
- The full tree structure
- Available commands:

- `/brain:memorize` — Store a new memory
- `/brain:remember` — Recall relevant memories
- `/brain:explore` — Browse the brain structure
- `/brain:consolidate` — Merge related memories
- `/brain:forget` — Decay or remove memories
- `/brain:sleep` — Overnight reorganization: restructure, consolidate, prune, and detect expertise areas
- `/brain:status` — View brain overview
