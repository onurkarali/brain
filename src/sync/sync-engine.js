/**
 * Brain Memory — Sync Engine
 *
 * Local-first sync with three-way diff (local vs remote vs last-known sync state).
 * Supports push/pull, conflict resolution, and optional encryption.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getBrainDir } = require('../index-manager');
const { getSyncDir, encryptBuffer, decryptBuffer } = require('./crypto-utils');
const { createProvider } = require('./provider');
const { loadCredentials, saveCredentials, deleteCredentials } = require('./crypto-utils');
const { OAUTH_CONFIGS, authorizeWithPKCE, authorizeWithDeviceCode, ensureFreshTokens } = require('./oauth');

const CONFIG_FILE = 'config.json';
const STATE_FILE = 'sync-state.json';

// Files/dirs to exclude from sync
const EXCLUDED = new Set(['.sync']);

// ---------------------------------------------------------------------------
// Config & State Management
// ---------------------------------------------------------------------------

/**
 * Read sync configuration from .brain/.sync/config.json.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Config or null if not configured
 */
function readSyncConfig(projectRoot) {
  const configPath = path.join(getSyncDir(projectRoot), CONFIG_FILE);
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

/**
 * Write sync configuration to .brain/.sync/config.json.
 *
 * @param {Object} config - Configuration to write
 * @param {string} [projectRoot] - Project root directory
 */
function writeSyncConfig(config, projectRoot) {
  const syncDir = getSyncDir(projectRoot);
  fs.mkdirSync(syncDir, { recursive: true });
  fs.writeFileSync(
    path.join(syncDir, CONFIG_FILE),
    JSON.stringify(config, null, 2) + '\n'
  );
}

/**
 * Read sync state from .brain/.sync/sync-state.json.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object} Sync state (defaults to empty state)
 */
function readSyncState(projectRoot) {
  const statePath = path.join(getSyncDir(projectRoot), STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return { version: 1, files: {}, cursor: null, lastSync: null, pathCache: null };
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

/**
 * Write sync state to .brain/.sync/sync-state.json.
 *
 * @param {Object} state - State to write
 * @param {string} [projectRoot] - Project root directory
 */
function writeSyncState(state, projectRoot) {
  const syncDir = getSyncDir(projectRoot);
  fs.mkdirSync(syncDir, { recursive: true });
  fs.writeFileSync(
    path.join(syncDir, STATE_FILE),
    JSON.stringify(state, null, 2) + '\n'
  );
}

// ---------------------------------------------------------------------------
// Local File Discovery
// ---------------------------------------------------------------------------

/**
 * Recursively walk .brain/ and collect all syncable files.
 * Excludes .brain/.sync/ directory.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Map<string, {hash: string, size: number, modified: string}>} Relative path → file info
 */
function getLocalFiles(projectRoot) {
  const brainDir = getBrainDir(projectRoot);
  const files = new Map();

  if (!fs.existsSync(brainDir)) return files;

  function walk(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (EXCLUDED.has(entry.name)) continue;
        walk(path.join(dir, entry.name), relativePath);
      } else {
        const fullPath = path.join(dir, entry.name);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath);
        files.set(relativePath, {
          hash: computeLocalHash(content),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    }
  }

  walk(brainDir, '');
  return files;
}

/**
 * Compute SHA-256 hash of file content (universal local hash).
 *
 * @param {Buffer|string} content - File content
 * @returns {string} Hex-encoded SHA-256 hash
 */
function computeLocalHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ---------------------------------------------------------------------------
// Three-Way Diff
// ---------------------------------------------------------------------------

/**
 * Compute the sync diff using three-way comparison.
 *
 * sync-state.json tracks per file: { localHash, remoteHash, remoteRev, lastSynced }
 *
 * | Local vs SyncState | Remote vs SyncState | Action        |
 * |--------------------|---------------------|---------------|
 * | Changed            | Unchanged           | → toUpload    |
 * | Unchanged          | Changed             | → toDownload  |
 * | Changed            | Changed             | → conflict    |
 * | New (not in state) | —                   | → toUpload    |
 * | —                  | New (not in state)  | → toDownload  |
 * | Deleted            | Unchanged           | → toDeleteRemote |
 * | Unchanged          | Deleted             | → toDeleteLocal  |
 *
 * @param {Map<string, Object>} localFiles - From getLocalFiles()
 * @param {Array<Object>} remoteFiles - From provider.listFiles()
 * @param {Object} syncState - From readSyncState()
 * @returns {Object} { toUpload, toDownload, toDeleteRemote, toDeleteLocal, conflicts, unchanged }
 */
function computeSyncDiff(localFiles, remoteFiles, syncState) {
  const stateFiles = syncState.files || {};
  const remoteMap = new Map();
  for (const rf of remoteFiles) {
    remoteMap.set(rf.path, rf);
  }

  const toUpload = [];
  const toDownload = [];
  const toDeleteRemote = [];
  const toDeleteLocal = [];
  const conflicts = [];
  const unchanged = [];

  // All known paths: local + remote + state
  const allPaths = new Set([
    ...localFiles.keys(),
    ...remoteMap.keys(),
    ...Object.keys(stateFiles),
  ]);

  for (const filePath of allPaths) {
    const local = localFiles.get(filePath);
    const remote = remoteMap.get(filePath);
    const state = stateFiles[filePath];

    const localExists = !!local;
    const remoteExists = !!remote && !remote.deleted;
    const stateExists = !!state;

    if (localExists && !remoteExists && !stateExists) {
      // New local file, not known to sync → upload
      toUpload.push({ path: filePath, reason: 'new_local' });
    } else if (!localExists && remoteExists && !stateExists) {
      // New remote file, not known to sync → download
      toDownload.push({ path: filePath, rev: remote.rev, reason: 'new_remote' });
    } else if (localExists && remoteExists && !stateExists) {
      // Both exist but no state — treat as conflict
      conflicts.push({ path: filePath, rev: remote.rev, reason: 'both_new' });
    } else if (localExists && remoteExists && stateExists) {
      const localChanged = local.hash !== state.localHash;
      const remoteChanged = remote.hash !== state.remoteHash;

      if (localChanged && remoteChanged) {
        conflicts.push({ path: filePath, rev: remote.rev, reason: 'both_modified' });
      } else if (localChanged && !remoteChanged) {
        toUpload.push({ path: filePath, rev: state.remoteRev, reason: 'local_modified' });
      } else if (!localChanged && remoteChanged) {
        toDownload.push({ path: filePath, rev: remote.rev, reason: 'remote_modified' });
      } else {
        unchanged.push({ path: filePath });
      }
    } else if (localExists && !remoteExists && stateExists) {
      // Remote was deleted since last sync
      if (local.hash !== state.localHash) {
        // Local also changed — conflict
        conflicts.push({ path: filePath, reason: 'local_modified_remote_deleted' });
      } else {
        toDeleteLocal.push({ path: filePath, reason: 'remote_deleted' });
      }
    } else if (!localExists && remoteExists && stateExists) {
      // Local was deleted since last sync
      if (remote.hash !== state.remoteHash) {
        // Remote also changed — conflict
        conflicts.push({ path: filePath, rev: remote.rev, reason: 'remote_modified_local_deleted' });
      } else {
        toDeleteRemote.push({ path: filePath, rev: state.remoteRev, reason: 'local_deleted' });
      }
    } else if (!localExists && !remoteExists && stateExists) {
      // Both deleted — just clean up state (handled in unchanged/cleanup)
      unchanged.push({ path: filePath, bothDeleted: true });
    }
  }

  return { toUpload, toDownload, toDeleteRemote, toDeleteLocal, conflicts, unchanged };
}

// ---------------------------------------------------------------------------
// Push / Pull Operations
// ---------------------------------------------------------------------------

/**
 * Push local changes to the cloud.
 *
 * @param {string} [projectRoot] - Project root directory
 * @param {Object} [options]
 * @param {boolean} [options.dryRun] - Preview without executing
 * @param {boolean} [options.force] - Force upload even on conflicts
 * @returns {Promise<Object>} Push results
 */
async function push(projectRoot, options = {}) {
  const config = readSyncConfig(projectRoot);
  if (!config) throw new Error('Sync not configured. Run setup first.');

  const provider = await _getProvider(config, projectRoot);
  const state = readSyncState(projectRoot);

  // Get local and remote file lists
  const localFiles = getLocalFiles(projectRoot);

  let allRemoteFiles = [];
  let cursor = state.cursor;
  if (cursor) {
    // Delta sync
    let result = await provider.listFiles(cursor);
    allRemoteFiles = result.files;
    cursor = result.cursor;
    while (result.hasMore) {
      result = await provider.listFiles(cursor);
      allRemoteFiles = allRemoteFiles.concat(result.files);
      cursor = result.cursor;
    }
  } else {
    // Full listing
    const result = await provider.listFiles(null);
    allRemoteFiles = result.files;
    cursor = result.cursor;
  }

  const diff = computeSyncDiff(localFiles, allRemoteFiles, state);

  if (options.dryRun) {
    return { dryRun: true, ...diff };
  }

  const results = { uploaded: [], deleted: [], conflicts: diff.conflicts, errors: [] };

  // Upload changed/new files
  for (const item of diff.toUpload) {
    try {
      await _pushFile(provider, item, projectRoot, config, state);
      results.uploaded.push(item.path);
    } catch (err) {
      if (err.code === 'CONFLICT') {
        results.conflicts.push({ path: item.path, reason: 'upload_conflict' });
      } else {
        results.errors.push({ path: item.path, error: err.message });
      }
    }
  }

  // Delete remote files that were deleted locally
  for (const item of diff.toDeleteRemote) {
    try {
      await provider.deleteFile(item.path);
      delete state.files[item.path];
      results.deleted.push(item.path);
    } catch (err) {
      results.errors.push({ path: item.path, error: err.message });
    }
  }

  // Handle force mode for conflicts
  if (options.force) {
    for (const item of diff.conflicts) {
      try {
        await _pushFile(provider, { ...item, mode: 'overwrite' }, projectRoot, config, state);
        results.uploaded.push(item.path);
      } catch (err) {
        results.errors.push({ path: item.path, error: err.message });
      }
    }
    results.conflicts = [];
  }

  // Update path cache for Google Drive
  if (config.provider === 'google-drive' && provider.exportPathCache) {
    state.pathCache = provider.exportPathCache();
  }

  // Update cursor and timestamp
  state.cursor = cursor;
  state.lastSync = new Date().toISOString();

  // Clean up state for both-deleted files
  for (const item of diff.unchanged) {
    if (item.bothDeleted) {
      delete state.files[item.path];
    }
  }

  writeSyncState(state, projectRoot);

  return results;
}

/**
 * Pull remote changes to local.
 *
 * @param {string} [projectRoot] - Project root directory
 * @param {Object} [options]
 * @param {boolean} [options.dryRun] - Preview without executing
 * @param {boolean} [options.force] - Force download even on conflicts
 * @returns {Promise<Object>} Pull results
 */
async function pull(projectRoot, options = {}) {
  const config = readSyncConfig(projectRoot);
  if (!config) throw new Error('Sync not configured. Run setup first.');

  const provider = await _getProvider(config, projectRoot);
  const state = readSyncState(projectRoot);

  // Get local and remote file lists
  const localFiles = getLocalFiles(projectRoot);

  let allRemoteFiles = [];
  let cursor = state.cursor;
  if (cursor) {
    let result = await provider.listFiles(cursor);
    allRemoteFiles = result.files;
    cursor = result.cursor;
    while (result.hasMore) {
      result = await provider.listFiles(cursor);
      allRemoteFiles = allRemoteFiles.concat(result.files);
      cursor = result.cursor;
    }
  } else {
    const result = await provider.listFiles(null);
    allRemoteFiles = result.files;
    cursor = result.cursor;
  }

  const diff = computeSyncDiff(localFiles, allRemoteFiles, state);

  if (options.dryRun) {
    return { dryRun: true, ...diff };
  }

  const results = { downloaded: [], deleted: [], conflicts: diff.conflicts, errors: [] };

  // Download changed/new files
  for (const item of diff.toDownload) {
    try {
      await _pullFile(provider, item, projectRoot, config, state);
      results.downloaded.push(item.path);
    } catch (err) {
      results.errors.push({ path: item.path, error: err.message });
    }
  }

  // Delete local files that were deleted remotely
  for (const item of diff.toDeleteLocal) {
    try {
      const fullPath = path.join(getBrainDir(projectRoot), item.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      delete state.files[item.path];
      results.deleted.push(item.path);
    } catch (err) {
      results.errors.push({ path: item.path, error: err.message });
    }
  }

  // Handle force mode for conflicts
  if (options.force) {
    for (const item of diff.conflicts) {
      try {
        await _pullFile(provider, item, projectRoot, config, state);
        results.downloaded.push(item.path);
      } catch (err) {
        results.errors.push({ path: item.path, error: err.message });
      }
    }
    results.conflicts = [];
  }

  // Update path cache for Google Drive
  if (config.provider === 'google-drive' && provider.exportPathCache) {
    state.pathCache = provider.exportPathCache();
  }

  state.cursor = cursor;
  state.lastSync = new Date().toISOString();

  for (const item of diff.unchanged) {
    if (item.bothDeleted) {
      delete state.files[item.path];
    }
  }

  writeSyncState(state, projectRoot);

  return results;
}

/**
 * Push a single file to the provider (with optional encryption).
 */
async function _pushFile(provider, item, projectRoot, config, state) {
  const fullPath = path.join(getBrainDir(projectRoot), item.path);
  let content = fs.readFileSync(fullPath);
  const localHash = computeLocalHash(content);

  // Encrypt if enabled
  if (config.encryption?.enabled && config.encryption?.passphrase) {
    content = encryptBuffer(content, config.encryption.passphrase);
  }

  const uploadOptions = {};
  if (item.rev) uploadOptions.rev = item.rev;
  if (item.mode) uploadOptions.mode = item.mode;
  else uploadOptions.mode = item.rev ? 'update' : 'add';

  const result = await provider.uploadFile(item.path, content, uploadOptions);

  // Update sync state for this file
  if (!state.files) state.files = {};
  state.files[item.path] = {
    localHash,
    remoteHash: result.hash || provider.computeContentHash(content),
    remoteRev: result.rev,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * Pull a single file from the provider (with optional decryption).
 */
async function _pullFile(provider, item, projectRoot, config, state) {
  const { content: rawContent, rev, hash } = await provider.downloadFile(item.path);

  // Decrypt if enabled
  let content = rawContent;
  if (config.encryption?.enabled && config.encryption?.passphrase) {
    content = decryptBuffer(rawContent, config.encryption.passphrase);
  }

  // Write to local filesystem
  const fullPath = path.join(getBrainDir(projectRoot), item.path);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);

  // Update sync state
  if (!state.files) state.files = {};
  state.files[item.path] = {
    localHash: computeLocalHash(content),
    remoteHash: hash || provider.computeContentHash(rawContent),
    remoteRev: rev,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * Get an authenticated provider instance.
 */
async function _getProvider(config, projectRoot) {
  let tokens = loadCredentials(projectRoot, config.credentialPassphrase);
  if (!tokens) throw new Error('No credentials found. Run login first.');

  tokens = await ensureFreshTokens(
    tokens, config.provider, config.clientId, projectRoot, config.credentialPassphrase
  );

  const providerConfig = {
    accessToken: tokens.access_token,
    options: {},
  };

  // Restore Google Drive path cache
  if (config.provider === 'google-drive') {
    const state = readSyncState(projectRoot);
    if (state.pathCache) {
      providerConfig.options.pathCache = state.pathCache;
    }
  }

  return createProvider(config.provider, providerConfig);
}

// ---------------------------------------------------------------------------
// Conflict Resolution
// ---------------------------------------------------------------------------

/**
 * List current conflicts.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Array<Object>} Conflict entries from sync state
 */
function listConflicts(projectRoot) {
  const state = readSyncState(projectRoot);
  return Object.entries(state.files || {})
    .filter(([, info]) => info.conflict)
    .map(([filePath, info]) => ({
      path: filePath,
      reason: info.conflict,
      localHash: info.localHash,
      remoteHash: info.remoteHash,
    }));
}

/**
 * Resolve a conflict for a specific file.
 *
 * @param {string} [projectRoot] - Project root directory
 * @param {string} filePath - Relative path of conflicted file
 * @param {string} resolution - 'keep-local' | 'keep-remote' | 'keep-both'
 * @returns {Promise<Object>} Resolution result
 */
async function resolveConflict(projectRoot, filePath, resolution) {
  const config = readSyncConfig(projectRoot);
  if (!config) throw new Error('Sync not configured.');

  const state = readSyncState(projectRoot);

  switch (resolution) {
    case 'keep-local': {
      // Push local version to remote
      const provider = await _getProvider(config, projectRoot);
      await _pushFile(provider, { path: filePath, mode: 'overwrite' }, projectRoot, config, state);
      if (state.files[filePath]) delete state.files[filePath].conflict;
      writeSyncState(state, projectRoot);
      return { resolved: true, action: 'pushed local version' };
    }
    case 'keep-remote': {
      // Pull remote version to local
      const provider = await _getProvider(config, projectRoot);
      await _pullFile(provider, { path: filePath }, projectRoot, config, state);
      if (state.files[filePath]) delete state.files[filePath].conflict;
      writeSyncState(state, projectRoot);
      return { resolved: true, action: 'pulled remote version' };
    }
    case 'keep-both': {
      // Rename local file with .local suffix, then pull remote
      const brainDir = getBrainDir(projectRoot);
      const localPath = path.join(brainDir, filePath);
      const ext = path.extname(filePath);
      const base = filePath.slice(0, -ext.length);
      const conflictPath = `${base}.local${ext}`;
      const conflictFullPath = path.join(brainDir, conflictPath);

      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, conflictFullPath);
      }

      const provider = await _getProvider(config, projectRoot);
      await _pullFile(provider, { path: filePath }, projectRoot, config, state);
      if (state.files[filePath]) delete state.files[filePath].conflict;
      writeSyncState(state, projectRoot);
      return { resolved: true, action: `kept both (local saved as ${conflictPath})` };
    }
    default:
      throw new Error(`Unknown resolution: ${resolution}. Use keep-local, keep-remote, or keep-both.`);
  }
}

// ---------------------------------------------------------------------------
// Status & Setup
// ---------------------------------------------------------------------------

/**
 * Get sync status information.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Promise<Object>} Status info
 */
async function syncStatus(projectRoot) {
  const config = readSyncConfig(projectRoot);
  if (!config) {
    return { configured: false };
  }

  const state = readSyncState(projectRoot);
  const localFiles = getLocalFiles(projectRoot);

  // Count pending changes
  let pendingChanges = 0;
  for (const [filePath, local] of localFiles) {
    const stateEntry = state.files?.[filePath];
    if (!stateEntry || stateEntry.localHash !== local.hash) {
      pendingChanges++;
    }
  }

  const status = {
    configured: true,
    provider: config.provider,
    encryption: config.encryption?.enabled || false,
    lastSync: state.lastSync,
    pendingChanges,
    conflicts: listConflicts(projectRoot),
    trackedFiles: Object.keys(state.files || {}).length,
  };

  // Test connection
  try {
    const provider = await _getProvider(config, projectRoot);
    const conn = await provider.testConnection();
    status.connected = conn.ok;
    status.account = conn.account;
  } catch {
    status.connected = false;
    status.account = null;
  }

  return status;
}

/**
 * Set up cloud sync for a brain.
 *
 * @param {string} [projectRoot] - Project root directory
 * @param {string} providerName - Provider: 'dropbox', 'google-drive', 'onedrive'
 * @param {string} clientId - OAuth client ID
 * @param {Object} [options]
 * @param {boolean} [options.encryption] - Enable encryption
 * @param {string} [options.passphrase] - Encryption passphrase
 * @param {boolean} [options.useDeviceCode] - Use Device Code Flow instead of PKCE
 * @param {Function} [options.onUserCode] - Callback for Device Code Flow
 * @returns {Promise<Object>} Setup result
 */
async function setupSync(projectRoot, providerName, clientId, options = {}) {
  if (!OAUTH_CONFIGS[providerName]) {
    throw new Error(`Unknown provider: ${providerName}. Use: dropbox, google-drive, onedrive`);
  }

  // Authorize
  let tokens;
  if (options.useDeviceCode) {
    tokens = await authorizeWithDeviceCode({
      provider: providerName,
      clientId,
      onUserCode: options.onUserCode,
    });
  } else {
    tokens = await authorizeWithPKCE({
      provider: providerName,
      clientId,
    });
  }

  // Save config
  const config = {
    provider: providerName,
    clientId,
    encryption: {
      enabled: options.encryption || false,
      passphrase: options.passphrase || null,
    },
    credentialPassphrase: options.credentialPassphrase || null,
    createdAt: new Date().toISOString(),
  };
  writeSyncConfig(config, projectRoot);

  // Save credentials
  saveCredentials(tokens, projectRoot, config.credentialPassphrase);

  // Test connection
  const provider = createProvider(providerName, {
    accessToken: tokens.access_token,
  });
  const connection = await provider.testConnection();

  // Initialize sync state with a full remote listing
  const listing = await provider.listFiles(null);
  const state = {
    version: 1,
    files: {},
    cursor: listing.cursor,
    lastSync: null,
  };

  if (providerName === 'google-drive' && provider.exportPathCache) {
    state.pathCache = provider.exportPathCache();
  }

  writeSyncState(state, projectRoot);

  return {
    success: true,
    provider: providerName,
    account: connection.account,
    remoteFiles: listing.files.length,
  };
}

/**
 * Log out: delete credentials and clear sync state.
 *
 * @param {string} [projectRoot] - Project root directory
 */
function logout(projectRoot) {
  const config = readSyncConfig(projectRoot);
  deleteCredentials(projectRoot, config?.credentialPassphrase);

  // Clear state but keep config
  const syncDir = getSyncDir(projectRoot);
  const statePath = path.join(syncDir, STATE_FILE);
  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }
}

module.exports = {
  // Config & State
  readSyncConfig,
  writeSyncConfig,
  readSyncState,
  writeSyncState,
  // File Discovery
  getLocalFiles,
  computeLocalHash,
  // Diff
  computeSyncDiff,
  // Operations
  push,
  pull,
  // Conflicts
  listConflicts,
  resolveConflict,
  // Status & Setup
  syncStatus,
  setupSync,
  logout,
};
