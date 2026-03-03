# Changelog

All notable changes to brain-memory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Git-based sync — push/pull `.brain/` to any private Git remote (GitHub, GitLab, Codeberg, self-hosted) via `/brain:sync setup/push/pull`
- Export/Import — single-file encrypted backup for portable transfers via `/brain:sync export` and `/brain:sync import`
- `src/crypto.js` — standalone AES-256-GCM crypto module extracted from the old sync code
- `src/git-sync.js` — Git sync engine using `child_process.execFileSync`
- `src/export-import.js` — single-file export/import with encryption and merge mode
- 74 new tests: installer unit tests (`test/install.test.js`) and prompt content validation + integration tests (`test/prompts.test.js`)

### Changed

- `/brain:sync` now uses Git remotes instead of OAuth cloud providers — no more registering OAuth apps
- Replaced cloud sync dashboard in `/brain:status` with git sync status (remote URL, ahead/behind counts)
- Extracted installer logic from `bin/install.js` into `src/installer.js` for testability — `bin/install.js` is now a thin CLI wrapper
- Hook files (`hooks/session-start.md`, `hooks/session-end.md`) now have reference notes clarifying that behavior is delivered through prompt injection, not native hook events
- Removed dead `settingsFile` config from runtime definitions — it was never used
- Removed `hooks/` from npm package since they are internal reference docs, not user-facing files

### Removed

- Cloud sync module (`src/sync/`) — OAuth2, Dropbox, Google Drive, and OneDrive providers
- OAuth token storage (`credentials.enc`) and three-way diff sync state (`sync-state.json`)

### Fixed

- Session lifecycle was dead code — session-start/end hook instructions were defined in `hooks/` but never installed or referenced anywhere. The prompt injected into CLAUDE.md/GEMINI.md/AGENTS.md only had a weak one-liner about memorization. Now all three prompt files contain full "Session Start Behavior" and "Session End Behavior" sections with automatic brain context loading, review queue alerts, and end-of-session memorization suggestions.
- `release:beta` npm script now automatically updates the `latest` dist-tag after publishing

## [0.1.0-beta.4] - 2026-03-03

### Added

- `/brain:sync` command — cloud sync for pushing/pulling memories to Dropbox, Google Drive, or OneDrive
- Cloud sync module (`src/sync/`) with OAuth2 PKCE + Device Code Flow, AES-256-GCM encryption, three-way diff algorithm, and provider-specific implementations (Dropbox API v2, Google Drive API v3, Microsoft Graph API)
- Zero new dependencies — uses Node.js 18+ built-in `fetch`, `crypto`, `http`

### Changed

- Removed all v1 migration code and references — no v1 users exist
- Updated documentation to reflect 11 slash commands and cloud sync

## [0.1.0-beta.3] - 2026-02-28

### Added

- `/brain:sunshine` command — deep forensic memory erasure that traces and removes all references across the `.brain/` tree (related arrays, content mentions, association edges, context sessions, review queue, archive index, crystallization comments)
- `removeEdgesForMemory()` utility in index-manager for removing all association edges involving a memory
- `removeFromReviewQueue()` utility in index-manager for removing a memory from the review queue
- `_erased.json` audit log schema for tracking erasures without preserving erased content
- 16 new tests for erasure utilities
- npm release scripts (`release:beta`, `release:patch`, `release:minor`, `release:major`)

### Fixed

- Windows CI compatibility: explicit test file listing, bash shell for glob expansion, `path.join` in tests
- Relaxed stress test thresholds for CI runners (5x multiplier)

## [0.1.0-beta.1] - 2026-02-22

### Added

- 375x faster `rankMemories` via batch spreading activation

### Fixed

- Clamped recency bonus and optimized spreading activation loop
- Normalized `package.json` bin and repository fields for npm

## [0.1.0] - 2026-02-15

Initial beta release.

### Added

- 9 slash commands: `init`, `memorize`, `remember`, `review`, `explore`, `consolidate`, `forget`, `sleep`, `status`
- Neuroscience-inspired scoring with Ebbinghaus exponential decay
- Associative memory network with spreading activation (BFS, 2-hop, 50% decay per hop)
- Hebbian learning for co-retrieved memories
- Context-dependent recall scoring (project, topic Jaccard, task type matching)
- Spaced reinforcement with logarithmic spacing multiplier and diminishing returns
- 3 cognitive memory types: episodic, semantic, procedural (each with distinct decay behavior)
- Salience-based protection preventing auto-pruning of important memories
- Confidence tracking with contradiction detection
- 9-phase sleep cycle: replay, synaptic homeostasis, knowledge propagation, semantic crystallization, reorganize, consolidate, prune, REM dreaming, expertise detection
- SM-2 spaced repetition review scheduler
- Memory consolidation with salience anchoring
- Archive system with recoverable memories
- Multi-factor recall scoring formula (relevance, strength, recency, spreading, context, salience)
- Multi-runtime installer: Claude Code, Gemini CLI, OpenAI Codex CLI
- Interactive and non-interactive installation modes
- Session lifecycle hook definitions (session-start, session-end)
- 114 tests covering scorer, index-manager, and end-to-end lifecycle
- Zero external dependencies
