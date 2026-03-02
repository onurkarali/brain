# Brain Memory Plugin - Development Guide

This repository is the **brain-memory** plugin — a hierarchical, file-system-based memory system for AI coding agents (Claude Code, Gemini CLI).

## Architecture

- `commands/brain/*.md` — Slash command prompts (`/brain:remember`, `/brain:memorize`, etc.)
- `prompts/` — CLAUDE.md / GEMINI.md content injected into user projects
- `templates/` — Default brain structure definitions
- `hooks/` — Session lifecycle hook definitions
- `bin/install.js` — Interactive installer
- `src/` — Shared utilities (scorer, index manager, sync engine)

## Key Design Principles

1. **File system IS the database** — The `.brain/` directory tree encodes semantic meaning through its hierarchy
2. **Agent-driven intelligence** — The AI agent performs categorization, scoring, and consolidation guided by command prompts
3. **No runtime dependencies** — Pure file I/O, no databases, no servers
4. **Human-readable** — YAML frontmatter + Markdown, browseable in any file explorer
5. **Git-friendly** — Full version history of memory evolution
