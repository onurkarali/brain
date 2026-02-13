# Brain Memory — Session Start Hook

This hook is triggered at the start of a coding session. Its purpose is to load relevant context from the brain memory system.

## Behavior

At session start, if `.brain/index.json` exists:

1. **Read the index** to understand the current brain state
2. **Identify high-value memories** — the top 3-5 memories by effective strength that are relevant to the current project
3. **Silently load context** — internalize these memories so you can reference them naturally during the session
4. **Do NOT dump memories** — do not print memory contents at session start unless the user asks

**The goal is ambient awareness** — you should know about important past decisions, learnings, and preferences without explicitly reciting them. If a situation arises where a past memory is relevant, naturally reference it.

## Quick Stats (Optional)

If the brain has memories, you may briefly mention:

```
🧠 Brain active — <N> memories loaded (<M> in current project context)
```

Keep it to one line. The user can run `/brain:status` for details.
