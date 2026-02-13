# /brain:status — Brain Overview Dashboard

You are displaying a comprehensive overview of the Brain Memory system's current state.

## Steps

### 1. Read Brain State

Read `.brain/index.json` to get the full memory inventory. If `.brain/` doesn't exist, inform the user and suggest running `/brain:init`.

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
