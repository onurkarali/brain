# Changelog

All notable changes to brain-memory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

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
- Session lifecycle hooks (session-start, session-end)
- 114 tests covering scorer, index-manager, and end-to-end lifecycle
- Zero external dependencies
