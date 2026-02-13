# Brain Memory — Session End Hook

This hook is triggered at the end of a coding session. Its purpose is to prompt the agent to consider storing important memories from the session.

## Behavior

When a session ends, evaluate whether the session contained any of the following:

1. **Decisions** — Architecture choices, technology selections, trade-off resolutions
2. **Learnings** — New patterns, debugging insights, API discoveries
3. **Insights** — Realizations about the codebase, project, or process
4. **Experiences** — Significant events like incidents, deployments, milestones
5. **Goals** — New objectives discussed or planned

If the session contained meaningful content in any of these categories, suggest to the user:

```
💡 This session contained notable <type(s)>. Would you like to store them as brain memories?
   Run /brain:memorize to capture them before this context is lost.
```

**Rules:**
- Do NOT auto-memorize without user consent
- Do NOT prompt for trivial sessions (quick fixes, typo corrections, simple questions)
- Only suggest when there is genuinely valuable context worth preserving
- Keep the suggestion brief and non-intrusive
