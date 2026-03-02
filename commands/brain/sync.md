# /brain:sync — Cloud Sync

You are managing cloud synchronization for the Brain Memory system. This enables manual push/pull of `.brain/` memories to Dropbox, Google Drive, or OneDrive.

**CRITICAL RULES:**
- NEVER auto-sync — always require explicit user action
- NEVER silently overwrite files — always show a preview first
- NEVER display OAuth tokens, credentials, or secrets in output
- ALWAYS show what will change before executing push/pull

## Subcommands

Parse the user's input to determine the subcommand:
- `login [provider]` → Setup OAuth + configure sync
- `push` → Upload local changes to cloud
- `pull` → Download remote changes to local
- `status` → Show sync state and pending changes
- `logout` → Remove credentials and disconnect
- `resolve [file]` → Resolve a sync conflict

If no subcommand is given, show available subcommands.

---

## `/brain:sync login [provider]`

### Steps

1. **Check prerequisites:**
   - Verify `.brain/` exists. If not, suggest `/brain:init` first.
   - Check if sync is already configured (`.brain/.sync/config.json`). If so, ask if they want to reconfigure.

2. **Select provider** (if not specified):
   - Present options: `dropbox`, `google-drive`, `onedrive`
   - Explain each briefly:
     - **Dropbox**: Simplest setup, App Folder isolation
     - **Google Drive**: Uses hidden appDataFolder (invisible in Drive UI)
     - **OneDrive**: Microsoft Graph API, App Folder isolation

3. **Get OAuth Client ID:**
   - Explain that Brain Memory requires the user to register their own OAuth app
   - Provide provider-specific instructions:

   **Dropbox:**
   - Go to https://www.dropbox.com/developers/apps
   - Create app → Scoped access → App folder → Name it "BrainMemory"
   - Under Permissions, enable: `files.metadata.read`, `files.metadata.write`, `files.content.read`, `files.content.write`
   - Copy the App Key (this is the client ID)
   - Add `http://127.0.0.1` to Redirect URIs (any port)

   **Google Drive:**
   - Go to https://console.cloud.google.com → Create project
   - Enable "Google Drive API"
   - Create OAuth 2.0 credentials → Desktop app
   - Copy the Client ID
   - Add `http://127.0.0.1` to Authorized redirect URIs

   **OneDrive:**
   - Go to https://portal.azure.com → App registrations
   - New registration → Personal Microsoft accounts
   - Add redirect URI: `http://localhost` (Mobile and desktop applications)
   - Copy Application (client) ID

4. **Ask for Client ID** from the user.

5. **Ask about encryption** (optional):
   - "Would you like to encrypt memories before uploading? (recommended for sensitive data)"
   - If yes, ask for a passphrase (will be needed on every push/pull and on other devices)

6. **Run OAuth flow:**
   - Use `setupSync()` from `src/sync/sync-engine.js`
   - This will open the browser for authorization
   - If in SSH/headless environment, offer Device Code Flow as alternative

7. **Show result:**
   ```
   ✓ Cloud sync configured!
     Provider:     [provider]
     Account:      [email/name]
     Encryption:   [enabled/disabled]
     Remote files: [count]

   Use /brain:sync push to upload your memories.
   Use /brain:sync pull to download from cloud.
   ```

---

## `/brain:sync push`

### Steps

1. **Check sync is configured.** If not, suggest `/brain:sync login`.

2. **Preview changes** (always show before executing):
   - Use `push()` with `{ dryRun: true }` from `src/sync/sync-engine.js`
   - Display summary:
   ```
   📤 Push Preview:
     Upload:  [count] files ([new] new, [modified] modified)
     Delete:  [count] files (deleted locally)
     Skip:    [count] unchanged
     ⚠️ Conflicts: [count] (modified both locally and remotely)
   ```
   - If there are conflicts, list them and explain options

3. **Ask for confirmation** before proceeding.

4. **Execute push:**
   - Use `push()` from `src/sync/sync-engine.js`
   - Show progress for each file
   - Show final results:
   ```
   ✓ Push complete!
     Uploaded:  [count] files
     Deleted:   [count] files
     Conflicts: [count] (use /brain:sync resolve to fix)
     Errors:    [count]
   ```

---

## `/brain:sync pull`

### Steps

1. **Check sync is configured.**

2. **Preview changes** (always show before executing):
   - Use `pull()` with `{ dryRun: true }`
   - Display summary:
   ```
   📥 Pull Preview:
     Download: [count] files ([new] new, [modified] modified)
     Delete:   [count] files (deleted remotely)
     Skip:     [count] unchanged
     ⚠️ Conflicts: [count]
   ```

3. **Ask for confirmation.**

4. **Execute pull:**
   - Use `pull()` from `src/sync/sync-engine.js`
   - Show results:
   ```
   ✓ Pull complete!
     Downloaded: [count] files
     Deleted:    [count] files
     Conflicts:  [count]
     Errors:     [count]
   ```

---

## `/brain:sync status`

### Steps

1. **Read sync status** using `syncStatus()` from `src/sync/sync-engine.js`

2. **Display dashboard:**
   ```
   ☁️ Cloud Sync Status
   ─────────────────────
   Provider:       [provider]
   Account:        [account]
   Connected:      [yes/no]
   Encryption:     [enabled/disabled]
   Last Sync:      [timestamp or "never"]
   Tracked Files:  [count]
   Pending Changes:[count] local files modified since last sync

   Conflicts: [count]
     [list conflict files if any]
   ```

---

## `/brain:sync logout`

### Steps

1. **Show current config** (provider, account).
2. **Ask for confirmation:** "This will remove stored credentials. Your cloud data will NOT be deleted."
3. **Execute:** Use `logout()` from `src/sync/sync-engine.js`
4. **Confirm:** "✓ Logged out from [provider]. Credentials removed."

---

## `/brain:sync resolve [file]`

### Steps

1. **List conflicts** if no file specified using `listConflicts()`.

2. **For a specific file:**
   - Show the conflict details (reason, local hash, remote hash)
   - Present resolution options:
     - **keep-local**: Push your local version (overwrites remote)
     - **keep-remote**: Pull the remote version (overwrites local)
     - **keep-both**: Save local as `filename.local.ext`, pull remote as `filename.ext`

3. **Execute resolution** using `resolveConflict()` from `src/sync/sync-engine.js`

4. **Show result:**
   ```
   ✓ Conflict resolved for [file]
     Action: [description]
   ```

---

## Key Implementation Notes

- All sync functions are in `src/sync/sync-engine.js`
- Crypto utilities in `src/sync/crypto-utils.js`
- OAuth in `src/sync/oauth.js`
- Provider implementations in `src/sync/providers/`
- Sync state stored in `.brain/.sync/` (never synced to cloud)
- Uses three-way diff: local state vs remote state vs last-known sync state
