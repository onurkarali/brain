# /brain:forget — Decay or Remove Memories

You are managing memory decay in the Brain Memory system. This command accelerates forgetting for specific memories or prunes memories that have naturally decayed below usefulness.

**Target:** $ARGUMENTS

## Steps

### 0. Resolve Brain Path

Determine where the brain is located:

1. Check if `~/.brain/index.json` exists (global brain)
2. Check if `.brain/index.json` exists in the current project root (project brain)
3. If **both** exist, use the **global** brain by default. Optionally note that a project-local brain also exists.
4. If **neither** exists, inform the user and suggest running `/brain:init`

Set `BRAIN_PATH` to the resolved location. All subsequent references to `.brain/` in this command refer to `BRAIN_PATH`.

### 1. Determine Mode

Based on $ARGUMENTS:

**Mode A — Targeted forget** (e.g., "/brain:forget kubernetes deployment issue"):
Find specific memories matching the query and offer to accelerate their decay or remove them.

**Mode B — Threshold prune** (e.g., "/brain:forget --prune" or "/brain:forget --prune 0.2"):
Find all memories whose effective (decayed) strength is below the given threshold (default: 0.2) and offer to archive them.

**Mode C — Category prune** (e.g., "/brain:forget professional/companies/old-corp"):
Apply decay/removal to an entire category subtree.

### 2. Find Affected Memories

Read `index.json` and compute effective (decayed) strength for each candidate:

```
days_elapsed = (now - last_accessed) / (1000 * 60 * 60 * 24)
decayed_strength = strength * (decay_rate ^ days_elapsed)
```

For Mode A: Match query against titles, tags, and paths.
For Mode B: Filter by decayed strength < threshold.
For Mode C: Filter by path prefix.

### 3. Present Candidates

Show the user what would be affected:

```
## Memories to Forget

| # | Title | Path | Strength | Decayed | Age |
|---|-------|------|----------|---------|-----|
| 1 | K8s Config Issue | professional/companies/acme/k8s-config.md | 0.40 | 0.12 | 94d |
| 2 | Old Deploy Notes | professional/companies/acme/deploy-v1.md | 0.35 | 0.08 | 120d |

**Action options:**
- **Archive**: Move to `_archived/` (recoverable)
- **Accelerate decay**: Set decay_rate to 0.90 (fast fade)
- **Delete permanently**: Remove files entirely (not recoverable)
```

### 4. Get User Confirmation

The user must explicitly choose an action. Default to **archive** (safest).

**IMPORTANT:** Never delete memories without explicit user confirmation.

### 5. Execute

**Archive:**
- Move memory files to `.brain/_archived/<original-path>/`
- Remove entries from `index.json` `memories`
- Decrement `memory_count` in index and relevant `_meta.json` files
- Update `last_updated`

**Accelerate decay:**
- Set `decay_rate` to 0.90 in the memory file's frontmatter
- Update `index.json` entry
- Memory will naturally fade in subsequent sessions

**Delete permanently:**
- Remove memory files
- Remove entries from `index.json`
- Update `_meta.json` files
- Clean up empty directories

### 6. Suggest Consolidation

If any remaining memories in the affected area are also weak (decayed strength < 0.4), suggest running `/brain:consolidate` on that category to preserve the knowledge in a more durable form before it fades.

### 7. Confirm

Print summary:
- Number of memories affected
- Action taken (archived/accelerated/deleted)
- Current brain stats (total memories, average strength)
