#!/usr/bin/env node

/**
 * Brain Memory — Sync Integration Test
 *
 * Full end-to-end test against a real cloud provider.
 * NOT part of `npm test` — requires manual OAuth authorization.
 *
 * Usage:
 *   node test/sync-integration.js <provider> <client-id> [--encryption]
 *
 * Examples:
 *   node test/sync-integration.js dropbox YOUR_APP_KEY
 *   node test/sync-integration.js google-drive YOUR_CLIENT_ID
 *   node test/sync-integration.js onedrive YOUR_CLIENT_ID
 *   node test/sync-integration.js dropbox YOUR_APP_KEY --encryption
 *
 * What it tests (full lifecycle):
 *   1. Setup/login (opens browser for OAuth)
 *   2. Initial push (all local files upload)
 *   3. Status check (connection, account, tracked files)
 *   4. Modify local file → push (only changed file uploads)
 *   5. Simulate remote modification → pull (downloads changed file)
 *   6. Verify pulled content matches what was "remotely" written
 *   7. Simulate conflict (modify same file locally + remotely)
 *   8. Push detects conflict
 *   9. Resolve conflict (keep-local)
 *  10. Delete local file → push (deletes from remote)
 *  11. Encryption round-trip (if --encryption flag)
 *  12. Logout
 *  13. Cleanup
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  setupSync,
  push,
  pull,
  syncStatus,
  logout,
  readSyncConfig,
  readSyncState,
  writeSyncState,
  getLocalFiles,
  computeLocalHash,
} = require('../src/sync/sync-engine');

const { loadCredentials } = require('../src/sync/crypto-utils');
const { createProvider } = require('../src/sync/provider');
const { ensureFreshTokens } = require('../src/sync/oauth');

// ---------------------------------------------------------------------------
// Test Harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function ok(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  ❌ ${message}`);
  }
}

function section(title) {
  console.log(`\n━━━ ${title} ━━━`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Provider Helper (for simulating remote changes)
// ---------------------------------------------------------------------------

async function getDirectProvider(testDir) {
  const config = readSyncConfig(testDir);
  let tokens = loadCredentials(testDir, config.credentialPassphrase);
  tokens = await ensureFreshTokens(
    tokens,
    config.provider,
    config.clientId,
    testDir,
    config.credentialPassphrase
  );

  const opts = {};
  if (config.provider === 'google-drive') {
    const state = readSyncState(testDir);
    if (state.pathCache) opts.pathCache = state.pathCache;
  }

  return createProvider(config.provider, {
    accessToken: tokens.access_token,
    options: opts,
  });
}

// ---------------------------------------------------------------------------
// Test Setup
// ---------------------------------------------------------------------------

function createTestBrain(testDir) {
  const brainDir = path.join(testDir, '.brain');
  fs.mkdirSync(path.join(brainDir, 'professional'), { recursive: true });
  fs.mkdirSync(path.join(brainDir, '_archived'), { recursive: true });

  const now = new Date().toISOString();

  // index.json
  fs.writeFileSync(
    path.join(brainDir, 'index.json'),
    JSON.stringify(
      {
        version: 2,
        created: now,
        last_updated: now,
        memory_count: 1,
        memories: {
          mem_test_001: {
            path: 'professional/test-memory.md',
            title: 'Integration Test Memory',
            type: 'learning',
            strength: 0.7,
            decay_rate: 0.99,
            tags: ['test', 'integration'],
            created: now,
            last_accessed: now,
          },
        },
      },
      null,
      2
    ) + '\n'
  );

  // associations.json
  fs.writeFileSync(
    path.join(brainDir, 'associations.json'),
    JSON.stringify({ version: 1, edges: {} }, null, 2) + '\n'
  );

  // A memory file
  fs.writeFileSync(
    path.join(brainDir, 'professional', 'test-memory.md'),
    [
      '---',
      'id: mem_test_001',
      'type: learning',
      'strength: 0.70',
      `created: ${now}`,
      'tags: [test, integration]',
      '---',
      '',
      '# Integration Test Memory',
      '',
      'This memory was created by the sync integration test.',
      '',
    ].join('\n')
  );

  // _archived/index.json
  fs.writeFileSync(
    path.join(brainDir, '_archived', 'index.json'),
    JSON.stringify({ version: 1, archived_count: 0, memories: {} }, null, 2) + '\n'
  );

  return brainDir;
}

// ---------------------------------------------------------------------------
// Clean remote files (best-effort)
// ---------------------------------------------------------------------------

async function cleanRemote(provider, testDir) {
  try {
    const { files } = await provider.listFiles(null);
    for (const file of files) {
      await provider.deleteFile(file.path);
    }
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Main Test Sequence
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const providerName = args[0];
  const clientId = args[1];
  const useEncryption = args.includes('--encryption');

  if (!providerName || !clientId) {
    console.log(`
Usage: node test/sync-integration.js <provider> <client-id> [--encryption]

Providers: dropbox, google-drive, onedrive

This test:
  1. Creates a temporary .brain/ directory
  2. Opens your browser for OAuth authorization (one-time)
  3. Runs the full sync lifecycle against the real cloud API
  4. Cleans up everything when done

You need to register an OAuth app first. See commands/brain/sync.md for instructions.
`);
    process.exit(1);
  }

  const validProviders = ['dropbox', 'google-drive', 'onedrive'];
  if (!validProviders.includes(providerName)) {
    console.error(`Unknown provider: ${providerName}. Use: ${validProviders.join(', ')}`);
    process.exit(1);
  }

  // Create isolated test directory
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-sync-e2e-'));
  console.log(`\n🧪 Sync Integration Test`);
  console.log(`   Provider:    ${providerName}`);
  console.log(`   Encryption:  ${useEncryption ? 'enabled' : 'disabled'}`);
  console.log(`   Test dir:    ${testDir}`);

  try {
    // -----------------------------------------------------------------------
    // Step 1: Create test brain
    // -----------------------------------------------------------------------
    section('Step 1: Create test brain');
    createTestBrain(testDir);
    const localFiles = getLocalFiles(testDir);
    ok(localFiles.size >= 3, `Created test brain with ${localFiles.size} files`);

    // -----------------------------------------------------------------------
    // Step 2: Setup / Login
    // -----------------------------------------------------------------------
    section('Step 2: OAuth login');
    console.log('  ⏳ Opening browser for authorization...');
    console.log('     (Complete the OAuth flow in your browser)\n');

    const setupOpts = {};
    if (useEncryption) {
      setupOpts.encryption = true;
      setupOpts.passphrase = 'integration-test-passphrase-2026';
    }

    const setupResult = await setupSync(testDir, providerName, clientId, setupOpts);

    ok(setupResult.success, 'Setup completed successfully');
    ok(!!setupResult.account, `Authenticated as: ${setupResult.account}`);
    console.log(`  ℹ️  Remote files before test: ${setupResult.remoteFiles}`);

    // Get direct provider handle for simulating remote changes
    const provider = await getDirectProvider(testDir);

    // Clean any pre-existing remote files
    if (setupResult.remoteFiles > 0) {
      console.log('  🧹 Cleaning pre-existing remote files...');
      await cleanRemote(provider, testDir);
      // Reset sync state since we wiped remote
      const state = readSyncState(testDir);
      state.files = {};
      state.cursor = null;
      writeSyncState(state, testDir);
    }

    // -----------------------------------------------------------------------
    // Step 3: Initial push
    // -----------------------------------------------------------------------
    section('Step 3: Initial push');

    // Dry run first
    const dryRun = await push(testDir, { dryRun: true });
    ok(dryRun.dryRun === true, `Dry run: ${dryRun.toUpload.length} files to upload`);
    ok(dryRun.toUpload.length >= 3, 'All local files detected for upload');

    // Real push
    const pushResult = await push(testDir);
    ok(pushResult.uploaded.length >= 3, `Pushed ${pushResult.uploaded.length} files`);
    ok(pushResult.errors.length === 0, `No push errors${pushResult.errors.length > 0 ? ': ' + JSON.stringify(pushResult.errors) : ''}`);

    console.log('  📁 Uploaded:', pushResult.uploaded.join(', '));

    // -----------------------------------------------------------------------
    // Step 4: Status check
    // -----------------------------------------------------------------------
    section('Step 4: Status check');
    const status = await syncStatus(testDir);
    ok(status.configured, 'Sync is configured');
    ok(status.connected, 'Connected to provider');
    ok(status.provider === providerName, `Provider: ${status.provider}`);
    ok(!!status.account, `Account: ${status.account}`);
    ok(!!status.lastSync, `Last sync: ${status.lastSync}`);
    ok(status.pendingChanges === 0, `Pending changes: ${status.pendingChanges} (expected 0)`);
    ok(status.trackedFiles >= 3, `Tracked files: ${status.trackedFiles}`);

    // -----------------------------------------------------------------------
    // Step 5: Push after no changes (should be no-op)
    // -----------------------------------------------------------------------
    section('Step 5: No-op push');

    // Need to re-list remote to get fresh state for delta comparison.
    // Force a full re-list by clearing cursor.
    const stateForNoop = readSyncState(testDir);
    stateForNoop.cursor = null;
    writeSyncState(stateForNoop, testDir);

    const noopDry = await push(testDir, { dryRun: true });
    ok(noopDry.toUpload.length === 0, 'No files to upload when nothing changed');
    ok(noopDry.conflicts.length === 0, 'No conflicts');

    // -----------------------------------------------------------------------
    // Step 6: Modify local file → push
    // -----------------------------------------------------------------------
    section('Step 6: Local modification → push');
    const memoryPath = path.join(testDir, '.brain', 'professional', 'test-memory.md');
    const originalContent = fs.readFileSync(memoryPath, 'utf-8');
    const modifiedContent = originalContent + '\n## Updated\n\nModified by integration test step 6.\n';
    fs.writeFileSync(memoryPath, modifiedContent);

    // Clear cursor to force full listing for accurate diff
    const stateForMod = readSyncState(testDir);
    stateForMod.cursor = null;
    writeSyncState(stateForMod, testDir);

    const modPush = await push(testDir);
    ok(modPush.uploaded.length === 1, `Pushed ${modPush.uploaded.length} modified file(s)`);
    ok(
      modPush.uploaded.includes('professional/test-memory.md'),
      'Correct file was uploaded'
    );
    ok(modPush.errors.length === 0, `No errors${modPush.errors.length > 0 ? ': ' + JSON.stringify(modPush.errors) : ''}`);

    // -----------------------------------------------------------------------
    // Step 7: Simulate remote modification → pull
    // -----------------------------------------------------------------------
    section('Step 7: Remote modification → pull');

    // Wait a moment for provider to settle
    console.log('  ⏳ Waiting 2s for provider to settle...');
    await sleep(2000);

    // Directly upload a modified file via the provider (simulating another device)
    const remoteContent = Buffer.from(
      originalContent + '\n## Remote Update\n\nModified remotely in step 7.\n'
    );

    let contentToUpload = remoteContent;
    if (useEncryption) {
      const { encryptBuffer } = require('../src/sync/crypto-utils');
      contentToUpload = encryptBuffer(remoteContent, 'integration-test-passphrase-2026');
    }

    await provider.uploadFile('professional/test-memory.md', contentToUpload, {
      mode: 'overwrite',
    });

    // Clear cursor and invalidate the remote hash in state to force detection
    const stateForPull = readSyncState(testDir);
    stateForPull.cursor = null;
    writeSyncState(stateForPull, testDir);

    const pullResult = await pull(testDir);
    ok(pullResult.downloaded.length >= 1, `Pulled ${pullResult.downloaded.length} file(s)`);
    ok(pullResult.errors.length === 0, `No pull errors${pullResult.errors.length > 0 ? ': ' + JSON.stringify(pullResult.errors) : ''}`);

    // Verify content
    const pulledContent = fs.readFileSync(memoryPath, 'utf-8');
    ok(
      pulledContent.includes('Remote Update'),
      'Pulled content contains remote modification'
    );
    ok(
      pulledContent.includes('Modified remotely in step 7'),
      'Pulled content matches expected text'
    );

    // -----------------------------------------------------------------------
    // Step 8: Simulate conflict
    // -----------------------------------------------------------------------
    section('Step 8: Conflict detection');

    // Modify locally
    fs.writeFileSync(
      memoryPath,
      pulledContent + '\n## Local Edit\n\nLocal change in step 8.\n'
    );

    // Wait and modify remotely
    await sleep(2000);
    const remoteConflictContent = Buffer.from(
      pulledContent + '\n## Remote Edit\n\nRemote change in step 8.\n'
    );

    let conflictUpload = remoteConflictContent;
    if (useEncryption) {
      const { encryptBuffer } = require('../src/sync/crypto-utils');
      conflictUpload = encryptBuffer(remoteConflictContent, 'integration-test-passphrase-2026');
    }

    await provider.uploadFile('professional/test-memory.md', conflictUpload, {
      mode: 'overwrite',
    });

    // Clear cursor for fresh comparison
    const stateForConflict = readSyncState(testDir);
    stateForConflict.cursor = null;
    writeSyncState(stateForConflict, testDir);

    const conflictPush = await push(testDir);
    const hasConflicts = conflictPush.conflicts.length > 0;
    ok(hasConflicts, `Conflict detected: ${conflictPush.conflicts.length} conflict(s)`);

    if (hasConflicts) {
      console.log(
        '  ℹ️  Conflicts:',
        conflictPush.conflicts.map((c) => `${c.path} (${c.reason})`).join(', ')
      );
    }

    // -----------------------------------------------------------------------
    // Step 9: Resolve conflict (keep-local)
    // -----------------------------------------------------------------------
    section('Step 9: Conflict resolution (force push)');

    // Use force push to resolve by keeping local
    const stateForResolve = readSyncState(testDir);
    stateForResolve.cursor = null;
    writeSyncState(stateForResolve, testDir);

    const resolveResult = await push(testDir, { force: true });
    ok(resolveResult.conflicts.length === 0, 'No conflicts after force push');
    ok(resolveResult.uploaded.length >= 1, `Force-pushed ${resolveResult.uploaded.length} file(s)`);
    ok(resolveResult.errors.length === 0, 'No errors during resolution');

    // Verify local version won
    const resolvedContent = fs.readFileSync(memoryPath, 'utf-8');
    ok(resolvedContent.includes('Local Edit'), 'Local version preserved after keep-local');

    // -----------------------------------------------------------------------
    // Step 10: Delete local file → push
    // -----------------------------------------------------------------------
    section('Step 10: Local deletion → push');

    // Add a temporary file, push it, then delete and push again
    const tempFilePath = path.join(testDir, '.brain', 'professional', 'temp-delete-test.md');
    fs.writeFileSync(tempFilePath, '# Temporary\n\nThis file will be deleted.\n');

    const stateForAdd = readSyncState(testDir);
    stateForAdd.cursor = null;
    writeSyncState(stateForAdd, testDir);

    const addPush = await push(testDir);
    ok(
      addPush.uploaded.some((p) => p.includes('temp-delete-test')),
      'Temp file uploaded'
    );

    // Now delete it locally
    fs.unlinkSync(tempFilePath);

    const stateForDel = readSyncState(testDir);
    stateForDel.cursor = null;
    writeSyncState(stateForDel, testDir);

    const delPush = await push(testDir);
    ok(
      delPush.deleted.some((p) => p.includes('temp-delete-test')),
      `Deletion synced: ${delPush.deleted.join(', ') || '(none)'}`
    );

    // -----------------------------------------------------------------------
    // Step 11: Encryption verification (if enabled)
    // -----------------------------------------------------------------------
    if (useEncryption) {
      section('Step 11: Encryption verification');

      // Download raw bytes from provider
      const { content: rawBytes } = await provider.downloadFile('index.json');

      // Should NOT be valid JSON (it's encrypted)
      let isEncrypted = false;
      try {
        JSON.parse(rawBytes.toString('utf-8'));
        // If it parses, it's NOT encrypted
      } catch {
        isEncrypted = true;
      }
      ok(isEncrypted, 'Cloud content is encrypted (not readable as JSON)');

      // But pulling should give us readable content
      const localIndex = fs.readFileSync(
        path.join(testDir, '.brain', 'index.json'),
        'utf-8'
      );
      let isValidJson = false;
      try {
        JSON.parse(localIndex);
        isValidJson = true;
      } catch {
        // not valid
      }
      ok(isValidJson, 'Local content is decrypted and valid JSON');
    }

    // -----------------------------------------------------------------------
    // Step 12: Final status
    // -----------------------------------------------------------------------
    section('Step 12: Final status');
    const finalStatus = await syncStatus(testDir);
    ok(finalStatus.connected, 'Still connected');
    ok(finalStatus.conflicts.length === 0, 'No unresolved conflicts');
    console.log(`  ℹ️  Tracked files: ${finalStatus.trackedFiles}`);
    console.log(`  ℹ️  Pending changes: ${finalStatus.pendingChanges}`);

    // -----------------------------------------------------------------------
    // Step 13: Logout
    // -----------------------------------------------------------------------
    section('Step 13: Logout');
    logout(testDir);

    const postLogoutConfig = readSyncConfig(testDir);
    ok(postLogoutConfig !== null, 'Config preserved after logout');

    const credPath = path.join(testDir, '.brain', '.sync', 'credentials.enc');
    ok(!fs.existsSync(credPath), 'Credentials deleted');

    const statePath = path.join(testDir, '.brain', '.sync', 'sync-state.json');
    ok(!fs.existsSync(statePath), 'Sync state cleared');

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    section('Step 14: Cleanup');

    // Clean remote files
    try {
      // Re-auth to clean up (need fresh provider since we logged out)
      // Skip if credentials are gone — remote files stay in app folder
      console.log('  ℹ️  Remote files left in provider app folder (manual cleanup)');
      console.log(`     Provider: ${providerName}`);
      console.log('     Location: Apps/BrainMemory (Dropbox) or appDataFolder (Drive/OneDrive)');
    } catch {
      // Best effort
    }

    // Remove temp directory
    fs.rmSync(testDir, { recursive: true, force: true });
    ok(!fs.existsSync(testDir), 'Temp directory cleaned up');
  } catch (err) {
    console.error(`\n💥 Test failed with error:\n`);
    console.error(err);
    failed++;
    failures.push(`Uncaught: ${err.message}`);

    // Cleanup on failure
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {
      console.error(`  ⚠️  Could not clean up: ${testDir}`);
    }
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n' + '═'.repeat(50));
  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

  if (failures.length > 0) {
    console.log('  Failures:');
    for (const f of failures) {
      console.log(`    ❌ ${f}`);
    }
    console.log('');
  }

  if (failed === 0) {
    console.log('  🎉 All integration tests passed!\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
