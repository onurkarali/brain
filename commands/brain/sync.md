# /brain:sync — Portable Sync

You are managing synchronization for the Brain Memory system. This enables manual push/pull of `~/.brain/` memories via any Git remote, plus encrypted single-file export/import for portable transfers.

**CRITICAL RULES:**
- NEVER auto-sync — always require explicit user action
- NEVER silently overwrite files — always show a preview first
- NEVER display passphrases or secrets in output
- ALWAYS show what will change before executing push/pull/import

## Subcommands

Parse the user's input to determine the subcommand:
- `setup <url>` → Configure a Git remote for sync
- `push` → Commit and push local changes to remote
- `pull` → Fetch and merge remote changes to local
- `status` → Show sync state (ahead/behind)
- `export [path]` → Export ~/.brain/ to an encrypted single file
- `import <path>` → Import from an export file
- `disconnect` → Remove sync configuration

If no subcommand is given, show available subcommands.

---

## `/brain:sync setup <url>`

### Steps

1. **Check prerequisites:**
   - Verify `~/.brain/` exists. If not, suggest `/brain:init` first.
   - Verify `git` is available (`checkGitAvailable()` from `src/git-sync.js`).
   - Check if sync is already configured (`~/.brain/.sync/config.json`). If so, ask if they want to reconfigure.

2. **Get remote URL** (if not provided):
   - Ask for the Git remote URL (SSH or HTTPS).
   - Auto-detect `gh` CLI: if available, offer to create a private repo with `gh repo create brain-data --private`.
   - Examples:
     - `git@github.com:user/brain-data.git`
     - `https://github.com/user/brain-data.git`
     - `git@gitlab.com:user/brain-data.git`

3. **Ask about encryption** (optional):
   - "Would you like to encrypt memories before pushing? (recommended for sensitive data)"
   - If yes, ask for a passphrase (will be needed on every push/pull and on other devices).

4. **Initialize sync:**
   - Call `initSyncRepo()` and `configureRemote()` from `src/git-sync.js`.
   - Write config to `~/.brain/.sync/config.json` via `writeSyncConfig()`.

5. **Show result:**
   ```
   ✓ Git sync configured!
     Remote:      <remote-url>
     Branch:      main
     Encryption:  <enabled/disabled>

   Use /brain:sync push to upload your memories.
   Use /brain:sync pull to download from remote.
   ```

---

## `/brain:sync push`

### Steps

1. **Check sync is configured.** If not, suggest `/brain:sync setup`.

2. **Preview changes:**
   - Call `getStatus()` from `src/git-sync.js`.
   - Display summary:
   ```
   📤 Push Preview:
     Remote:  <remote-url>
     Status:  <ahead> commits ahead, <behind> behind
   ```
   - If behind > 0, warn: "Remote has newer changes. Consider pulling first."

3. **Ask for confirmation** before proceeding.

4. **Execute push:**
   - If encryption is enabled, ask for passphrase.
   - Call `push()` from `src/git-sync.js`.
   - Show result:
   ```
   ✓ Push complete!
     Committed: <message>
     Remote:    <remote-url>
   ```

---

## `/brain:sync pull`

### Steps

1. **Check sync is configured.**

2. **Preview:**
   - Call `getStatus()` to show ahead/behind count.
   ```
   📥 Pull Preview:
     Remote:  <remote-url>
     Status:  <behind> new commits to pull
   ```

3. **Ask for confirmation.**

4. **Execute pull:**
   - If encryption is enabled, ask for passphrase.
   - Call `pull()` from `src/git-sync.js`.
   - Show result:
   ```
   ✓ Pull complete!
     Updated <count> files from remote.
   ```

---

## `/brain:sync status`

### Steps

1. **Read sync config** using `getSyncConfig()` from `src/git-sync.js`.

2. **Display dashboard:**
   ```
   🔄 Sync Status
   ─────────────────────
   Remote:      <remote-url or "not configured">
   Branch:      <branch>
   Encryption:  <enabled/disabled>
   Last Push:   <timestamp or "never">
   Last Pull:   <timestamp or "never">
   Ahead:       <count> commits
   Behind:      <count> commits
   ```

---

## `/brain:sync export [path]`

### Steps

1. **Determine output path:**
   - Default: `.brain-export` in the current directory.
   - User can specify a custom path.

2. **Ask about encryption:**
   - "Would you like to encrypt the export? (recommended)"
   - If yes, ask for a passphrase.

3. **Execute export:**
   - Call `exportBrain()` from `src/export-import.js`.
   - Show result:
   ```
   ✓ Brain exported!
     File:     <output-path>
     Memories: <count> files packed
     Encrypted: <yes/no>
     Size:     <file-size>

   Transfer this file to another machine and run /brain:sync import <path>
   ```

---

## `/brain:sync import <path>`

### Steps

1. **Preview the import:**
   - Call `previewImport()` from `src/export-import.js`.
   - Display:
   ```
   📦 Import Preview:
     File:        <path>
     Exported at: <date>
     Total files: <count>
     New:         <count> (will be created)
     Existing:    <count> (will be overwritten)
   ```

2. **Ask for import mode:**
   - **Overwrite** (default): Replace all matching files with the imported versions.
   - **Merge**: Only import files newer than local versions.

3. **If encrypted, ask for passphrase.**

4. **Ask for confirmation.**

5. **Execute import:**
   - Call `importBrain()` from `src/export-import.js`.
   - Show result:
   ```
   ✓ Import complete!
     Imported: <count> files
     Skipped:  <count> (merge mode, local was newer)
   ```

---

## `/brain:sync disconnect`

### Steps

1. **Show current config** (remote URL).
2. **Ask for confirmation:** "This will remove sync configuration. Your remote data will NOT be deleted."
3. **Remove `~/.brain/.sync/` directory.**
4. **Confirm:** "✓ Sync disconnected. Remote repository is untouched."

---

## Key Implementation Notes

- Git sync engine: `src/git-sync.js`
- Export/import: `src/export-import.js`
- Crypto utilities: `src/crypto.js`
- Sync config stored in `~/.brain/.sync/config.json` (local only)
- Hidden git repo at `~/.brain/.sync/repo/` — never interferes with the project's own git
- All git operations use `execFileSync` — no npm dependencies
