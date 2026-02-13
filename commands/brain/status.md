# /brain:status — Brain Overview Dashboard

You are displaying a comprehensive overview of the Brain Memory system's current state.

## Steps

### 0. Resolve Brain Path

Determine where the brain is located:

1. Check if `~/.brain/index.json` exists (global brain)
2. Check if `.brain/index.json` exists in the current project root (project brain)
3. If **both** exist, show status for **both** brains, clearly labeled as `[GLOBAL]` and `[PROJECT]`
4. If **neither** exists, inform the user and suggest running `/brain:init`

Set `BRAIN_PATH` to the resolved location(s). All subsequent references to `.brain/` in this command refer to `BRAIN_PATH`.

### 1. Read Brain State

Read `BRAIN_PATH/index.json` to get the full memory inventory. If no brain exists at any location, inform the user and suggest running `/brain:init`.

### 2. Compute Statistics

For each memory in the index, compute:

```
days_elapsed = (now - last_accessed) / (1000 * 60 * 60 * 24)
decayed_strength = strength * (decay_rate ^ days_elapsed)
```

Calculate aggregate stats:
- Total memory count
- Memories per top-level category
- Average effective (decayed) strength
- Memories by type distribution
- Total tags (unique count)

### 3. Display Dashboard

```
╔══════════════════════════════════════════╗
║          🧠 BRAIN STATUS                ║
╠══════════════════════════════════════════╣
║ Total Memories:     <count>             ║
║ Last Updated:       <date>              ║
║ Average Strength:   <avg> / 1.00        ║
║ Brain Age:          <days since init>   ║
╚══════════════════════════════════════════╝

## Categories
  professional:  ████████████░░░  <N> memories (avg ⚡<strength>)
  personal:      ██████░░░░░░░░░  <N> memories (avg ⚡<strength>)
  social:        ███░░░░░░░░░░░░  <N> memories (avg ⚡<strength>)
  family:        ████░░░░░░░░░░░  <N> memories (avg ⚡<strength>)

## Memory Types
  decision:     <N>  |  learning:    <N>
  experience:   <N>  |  insight:     <N>
  observation:  <N>  |  goal:        <N>
  preference:   <N>  |  relationship:<N>

## Strongest Memories (Top 5)
  1. ⚡0.92 — <title> (<path>)
  2. ⚡0.88 — <title> (<path>)
  ...

## Most Recalled (Top 5)
  1. 🔄 <count>x — <title> (<path>)
  2. 🔄 <count>x — <title> (<path>)
  ...

## Fading Memories (decayed strength < 0.3)
  ⚠ <count> memories below consolidation threshold
  Run /brain:consolidate to preserve them

## Recent Memories (Last 7 days)
  + <title> (<path>) — <date>
  + <title> (<path>) — <date>
  ...
```

### 4. Health Check

Analyze the brain's health and provide recommendations:

- **"Healthy"** — Good distribution across categories, strong average strength
- **"Needs consolidation"** — Many memories below threshold, suggest `/brain:consolidate`
- **"Imbalanced"** — One category dominates, suggest diversifying
- **"Stale"** — No new memories in 14+ days, suggest `/brain:memorize`
- **"Overloaded"** — More than 200 active memories, suggest pruning with `/brain:forget --prune`
- **"Needs propagation"** — Recent memories (created within the last `propagation_window_days`) exist alongside older related memories in the same category branches that haven't been updated. New knowledge may need to ripple through the hierarchy. Suggest `/brain:sleep` to propagate recent insights to related memories.
- **"Needs sleep"** — Multiple flat clusters detected (directories with 3+ memories that could be reorganized), OR many memories in moderate/weak tiers, OR no `_expertise.md` profiles exist despite having 10+ memories. Suggest `/brain:sleep` for a full maintenance cycle.
