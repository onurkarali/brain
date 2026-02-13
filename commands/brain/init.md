# /brain:init — Initialize Brain Memory Structure

You are initializing the Brain Memory system. This creates a `.brain/` directory that serves as a hierarchical, file-system-based memory store inspired by human cognition.

## Steps

### 1. Check for Existing Brain

Check if `.brain/` directory already exists in the current project root.

- If it exists, inform the user and ask if they want to reset or keep it.
- If not, proceed with creation.

### 2. Create Directory Structure

Create the following structure:

```
.brain/
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

### 3. Create index.json

```json
{
  "version": 1,
  "created": "<current ISO timestamp>",
  "last_updated": "<current ISO timestamp>",
  "memory_count": 0,
  "memories": {},
  "config": {
    "max_depth": 6,
    "consolidation_threshold": 0.3,
    "decay_check_interval_days": 7,
    "strength_boost_on_recall": 0.05,
    "auto_consolidate": true
  }
}
```

### 4. Create _meta.json for Each Top Category

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

### 5. Ask User for Customization (Optional)

Ask the user:
- "Would you like to add any custom top-level categories beyond the defaults (professional, personal, social, family)?"
- "Do you have specific subcategories you'd like pre-created? (e.g., a company name under professional/companies/)"

If the user provides custom categories or subcategories, create them with appropriate `_meta.json` files.

### 6. Add .brain to .gitignore (Optional)

Ask the user if they want `.brain/` added to `.gitignore` (some users may want to track their memory in git, others may not).

### 7. Confirm

Print a summary of what was created, including the full tree structure. Inform the user of available commands:

- `/brain:memorize` — Store a new memory
- `/brain:remember` — Recall relevant memories
- `/brain:explore` — Browse the brain structure
- `/brain:consolidate` — Merge related memories
- `/brain:forget` — Decay or remove memories
- `/brain:status` — View brain overview
