# Changelog

All notable changes to brain-memory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `/brain:sunshine` command — deep forensic memory erasure that traces and removes all references across the `.brain/` tree (related arrays, content mentions, association edges, context sessions, review queue, archive index, crystallization comments)
- `removeEdgesForMemory()` utility in index-manager for removing all association edges involving a memory
- `removeFromReviewQueue()` utility in index-manager for removing a memory from the review queue
- `_erased.json` audit log schema for tracking erasures without preserving erased content
- 16 new tests for erasure utilities

## [0.1.0] - 2026-02-15

Initial beta release.

### Added

- 9 slash commands: `init`, `memorize`, `remember`, `review`, `explore`, `consolidate`, `forget`, `sleep`, `status`
- Neuroscience-inspired v2 scoring with Ebbinghaus exponential decay
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
- v4 recall scoring formula with graceful v1 degradation
- Multi-runtime installer: Claude Code, Gemini CLI, OpenAI Codex CLI
- Interactive and non-interactive installation modes
- Session lifecycle hooks (session-start, session-end)
- 114 tests covering scorer, index-manager, and end-to-end lifecycle
- Zero external dependencies
