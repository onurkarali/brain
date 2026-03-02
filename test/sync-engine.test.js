const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  readSyncConfig,
  writeSyncConfig,
  readSyncState,
  writeSyncState,
  getLocalFiles,
  computeLocalHash,
  computeSyncDiff,
} = require('../src/sync/sync-engine');

const { encryptBuffer, decryptBuffer } = require('../src/sync/crypto-utils');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-sync-test-'));
  fs.mkdirSync(path.join(tmpDir, '.brain', '.sync'), { recursive: true });
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function writeBrainFile(relativePath, content) {
  const fullPath = path.join(tmpDir, '.brain', relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ===========================================================================
// Config & State Management
// ===========================================================================

describe('readSyncConfig / writeSyncConfig', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('returns null when no config', () => {
    assert.equal(readSyncConfig(tmpDir), null);
  });

  it('round-trips config', () => {
    const config = { provider: 'dropbox', clientId: 'abc123' };
    writeSyncConfig(config, tmpDir);
    assert.deepEqual(readSyncConfig(tmpDir), config);
  });
});

describe('readSyncState / writeSyncState', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('returns default state when no file', () => {
    const state = readSyncState(tmpDir);
    assert.equal(state.version, 1);
    assert.deepEqual(state.files, {});
    assert.equal(state.cursor, null);
    assert.equal(state.lastSync, null);
  });

  it('round-trips state', () => {
    const state = {
      version: 1,
      files: { 'index.json': { localHash: 'abc', remoteHash: 'def', remoteRev: 'r1' } },
      cursor: 'cursor123',
      lastSync: '2026-01-01T00:00:00Z',
    };
    writeSyncState(state, tmpDir);
    assert.deepEqual(readSyncState(tmpDir), state);
  });
});

// ===========================================================================
// Local File Discovery
// ===========================================================================

describe('getLocalFiles', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('returns empty map for empty brain', () => {
    const files = getLocalFiles(tmpDir);
    assert.equal(files.size, 0);
  });

  it('discovers root-level files', () => {
    writeBrainFile('index.json', '{"version": 2}');
    const files = getLocalFiles(tmpDir);
    assert.ok(files.has('index.json'));
    assert.equal(files.get('index.json').hash, sha256('{"version": 2}'));
  });

  it('discovers nested files', () => {
    writeBrainFile('professional/skills/typescript.md', '# TS');
    const files = getLocalFiles(tmpDir);
    assert.ok(files.has('professional/skills/typescript.md'));
  });

  it('excludes .sync directory', () => {
    writeBrainFile('.sync/config.json', '{}');
    writeBrainFile('index.json', '{}');
    const files = getLocalFiles(tmpDir);
    assert.ok(!files.has('.sync/config.json'));
    assert.ok(files.has('index.json'));
  });

  it('includes file size and modified date', () => {
    writeBrainFile('test.md', 'hello');
    const files = getLocalFiles(tmpDir);
    const info = files.get('test.md');
    assert.equal(info.size, 5);
    assert.ok(info.modified);
  });
});

describe('computeLocalHash', () => {
  it('computes SHA-256', () => {
    const hash = computeLocalHash(Buffer.from('test'));
    assert.equal(hash, sha256('test'));
  });

  it('is deterministic', () => {
    assert.equal(computeLocalHash('data'), computeLocalHash('data'));
  });

  it('differs for different content', () => {
    assert.notEqual(computeLocalHash('a'), computeLocalHash('b'));
  });
});

// ===========================================================================
// Three-Way Diff
// ===========================================================================

describe('computeSyncDiff', () => {
  it('detects new local files', () => {
    const localFiles = new Map([['new-file.md', { hash: 'abc', size: 10 }]]);
    const remoteFiles = [];
    const state = { files: {} };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toUpload.length, 1);
    assert.equal(diff.toUpload[0].path, 'new-file.md');
    assert.equal(diff.toUpload[0].reason, 'new_local');
  });

  it('detects new remote files', () => {
    const localFiles = new Map();
    const remoteFiles = [{ path: 'remote.md', rev: 'r1', hash: 'def', modified: '', size: 10 }];
    const state = { files: {} };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toDownload.length, 1);
    assert.equal(diff.toDownload[0].path, 'remote.md');
    assert.equal(diff.toDownload[0].reason, 'new_remote');
  });

  it('detects locally modified files', () => {
    const localFiles = new Map([['file.md', { hash: 'new_hash', size: 10 }]]);
    const remoteFiles = [{ path: 'file.md', rev: 'r1', hash: 'remote_hash', modified: '', size: 10 }];
    const state = {
      files: {
        'file.md': { localHash: 'old_hash', remoteHash: 'remote_hash', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toUpload.length, 1);
    assert.equal(diff.toUpload[0].reason, 'local_modified');
  });

  it('detects remotely modified files', () => {
    const localFiles = new Map([['file.md', { hash: 'local_hash', size: 10 }]]);
    const remoteFiles = [{ path: 'file.md', rev: 'r2', hash: 'new_remote_hash', modified: '', size: 10 }];
    const state = {
      files: {
        'file.md': { localHash: 'local_hash', remoteHash: 'old_remote_hash', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toDownload.length, 1);
    assert.equal(diff.toDownload[0].reason, 'remote_modified');
  });

  it('detects conflicts (both modified)', () => {
    const localFiles = new Map([['file.md', { hash: 'new_local', size: 10 }]]);
    const remoteFiles = [{ path: 'file.md', rev: 'r2', hash: 'new_remote', modified: '', size: 10 }];
    const state = {
      files: {
        'file.md': { localHash: 'old_local', remoteHash: 'old_remote', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.conflicts.length, 1);
    assert.equal(diff.conflicts[0].reason, 'both_modified');
  });

  it('detects conflicts when both are new (no state)', () => {
    const localFiles = new Map([['file.md', { hash: 'local_hash', size: 10 }]]);
    const remoteFiles = [{ path: 'file.md', rev: 'r1', hash: 'remote_hash', modified: '', size: 10 }];
    const state = { files: {} };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.conflicts.length, 1);
    assert.equal(diff.conflicts[0].reason, 'both_new');
  });

  it('detects local deletions (delete remote)', () => {
    const localFiles = new Map(); // file deleted locally
    const remoteFiles = [{ path: 'file.md', rev: 'r1', hash: 'hash', modified: '', size: 10 }];
    const state = {
      files: {
        'file.md': { localHash: 'hash_local', remoteHash: 'hash', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toDeleteRemote.length, 1);
    assert.equal(diff.toDeleteRemote[0].reason, 'local_deleted');
  });

  it('detects remote deletions (delete local)', () => {
    const localFiles = new Map([['file.md', { hash: 'hash_local', size: 10 }]]);
    const remoteFiles = []; // file deleted remotely
    const state = {
      files: {
        'file.md': { localHash: 'hash_local', remoteHash: 'hash_remote', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toDeleteLocal.length, 1);
    assert.equal(diff.toDeleteLocal[0].reason, 'remote_deleted');
  });

  it('detects conflict: local modified + remote deleted', () => {
    const localFiles = new Map([['file.md', { hash: 'new_local', size: 10 }]]);
    const remoteFiles = [];
    const state = {
      files: {
        'file.md': { localHash: 'old_local', remoteHash: 'old_remote', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.conflicts.length, 1);
    assert.equal(diff.conflicts[0].reason, 'local_modified_remote_deleted');
  });

  it('detects conflict: remote modified + local deleted', () => {
    const localFiles = new Map();
    const remoteFiles = [{ path: 'file.md', rev: 'r2', hash: 'new_remote', modified: '', size: 10 }];
    const state = {
      files: {
        'file.md': { localHash: 'old_local', remoteHash: 'old_remote', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.conflicts.length, 1);
    assert.equal(diff.conflicts[0].reason, 'remote_modified_local_deleted');
  });

  it('marks unchanged files', () => {
    const localFiles = new Map([['file.md', { hash: 'same_hash', size: 10 }]]);
    const remoteFiles = [{ path: 'file.md', rev: 'r1', hash: 'same_remote', modified: '', size: 10 }];
    const state = {
      files: {
        'file.md': { localHash: 'same_hash', remoteHash: 'same_remote', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.unchanged.length, 1);
    assert.equal(diff.toUpload.length, 0);
    assert.equal(diff.toDownload.length, 0);
  });

  it('handles both-deleted files', () => {
    const localFiles = new Map();
    const remoteFiles = [];
    const state = {
      files: {
        'file.md': { localHash: 'h1', remoteHash: 'h2', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    const bothDeleted = diff.unchanged.find((u) => u.bothDeleted);
    assert.ok(bothDeleted);
    assert.equal(bothDeleted.path, 'file.md');
  });

  it('handles complex multi-file scenario', () => {
    const localFiles = new Map([
      ['unchanged.md', { hash: 'h1', size: 5 }],
      ['local-new.md', { hash: 'h2', size: 5 }],
      ['local-modified.md', { hash: 'h3_new', size: 5 }],
      ['remote-modified.md', { hash: 'rm_local', size: 5 }],
      ['conflict.md', { hash: 'h4_local', size: 5 }],
    ]);

    const remoteFiles = [
      { path: 'unchanged.md', rev: 'r1', hash: 'rh1', modified: '', size: 5 },
      { path: 'remote-new.md', rev: 'r2', hash: 'rh2', modified: '', size: 5 },
      { path: 'local-modified.md', rev: 'r3', hash: 'rh3_same', modified: '', size: 5 },
      { path: 'remote-modified.md', rev: 'r4', hash: 'rh4_new', modified: '', size: 5 },
      { path: 'conflict.md', rev: 'r5', hash: 'rh5_new', modified: '', size: 5 },
    ];

    const state = {
      files: {
        'unchanged.md': { localHash: 'h1', remoteHash: 'rh1', remoteRev: 'r1' },
        'local-modified.md': { localHash: 'h3_old', remoteHash: 'rh3_same', remoteRev: 'r3' },
        'remote-modified.md': { localHash: 'rm_local', remoteHash: 'rh4_old', remoteRev: 'r4' },
        'conflict.md': { localHash: 'h4_old', remoteHash: 'rh5_old', remoteRev: 'r5_old' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);

    // unchanged.md → unchanged
    assert.ok(diff.unchanged.some((u) => u.path === 'unchanged.md'));

    // local-new.md → toUpload (new_local)
    assert.ok(diff.toUpload.some((u) => u.path === 'local-new.md' && u.reason === 'new_local'));

    // local-modified.md → toUpload (local_modified)
    assert.ok(diff.toUpload.some((u) => u.path === 'local-modified.md' && u.reason === 'local_modified'));

    // remote-new.md → toDownload (new_remote)
    assert.ok(diff.toDownload.some((d) => d.path === 'remote-new.md' && d.reason === 'new_remote'));

    // remote-modified.md → toDownload (remote_modified)
    assert.ok(diff.toDownload.some((d) => d.path === 'remote-modified.md' && d.reason === 'remote_modified'));

    // conflict.md → conflict (both_modified)
    assert.ok(diff.conflicts.some((c) => c.path === 'conflict.md' && c.reason === 'both_modified'));
  });

  it('handles empty state (first sync)', () => {
    const localFiles = new Map([
      ['index.json', { hash: 'h1', size: 10 }],
      ['professional/skills.md', { hash: 'h2', size: 20 }],
    ]);

    const remoteFiles = [];
    const state = { files: {} };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toUpload.length, 2);
    assert.equal(diff.toDownload.length, 0);
    assert.equal(diff.conflicts.length, 0);
  });

  it('handles deleted remote files in delta', () => {
    const localFiles = new Map([['file.md', { hash: 'h1', size: 10 }]]);
    const remoteFiles = [{ path: 'file.md', rev: '', hash: '', modified: '', size: 0, deleted: true }];
    const state = {
      files: {
        'file.md': { localHash: 'h1', remoteHash: 'rh1', remoteRev: 'r1' },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toDeleteLocal.length, 1);
  });
});

// ===========================================================================
// Mock Provider for Push/Pull Tests
// ===========================================================================

class MockProvider {
  constructor() {
    this.files = new Map(); // path → { content, rev, hash }
    this.callLog = [];
  }

  computeContentHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async listFiles(_cursor) {
    this.callLog.push('listFiles');
    const files = [];
    for (const [filePath, data] of this.files) {
      files.push({
        path: filePath,
        rev: data.rev,
        hash: data.hash,
        modified: new Date().toISOString(),
        size: data.content.length,
      });
    }
    return { files, cursor: 'mock_cursor', hasMore: false };
  }

  async downloadFile(remotePath) {
    this.callLog.push(`download:${remotePath}`);
    const file = this.files.get(remotePath);
    if (!file) throw new Error(`Not found: ${remotePath}`);
    return { content: file.content, rev: file.rev, hash: file.hash };
  }

  async uploadFile(remotePath, content, _options = {}) {
    this.callLog.push(`upload:${remotePath}`);
    const hash = this.computeContentHash(content);
    const rev = `rev_${Date.now()}`;
    this.files.set(remotePath, { content: Buffer.from(content), rev, hash });
    return { rev, hash };
  }

  async deleteFile(remotePath) {
    this.callLog.push(`delete:${remotePath}`);
    this.files.delete(remotePath);
    return { success: true };
  }

  async testConnection() {
    return { ok: true, account: 'mock@test.com' };
  }

  // Helper to seed remote files for testing
  seedFile(filePath, content) {
    const buf = Buffer.from(content);
    this.files.set(filePath, {
      content: buf,
      rev: `rev_seed_${filePath}`,
      hash: this.computeContentHash(buf),
    });
  }
}

// ===========================================================================
// Encryption Integration
// ===========================================================================

describe('encryption round-trip through sync', () => {
  it('encrypts and decrypts file content transparently', () => {
    const original = Buffer.from('# My Secret Memory\n\nThis is private.');
    const passphrase = 'test-encryption-key';

    const encrypted = encryptBuffer(original, passphrase);
    assert.notDeepEqual(encrypted, original);

    const decrypted = decryptBuffer(encrypted, passphrase);
    assert.deepEqual(decrypted, original);
  });

  it('encrypted content is larger than original', () => {
    const original = Buffer.from('short');
    const encrypted = encryptBuffer(original, 'pass');
    // salt(32) + iv(12) + authTag(16) + ciphertext >= original
    assert.ok(encrypted.length > original.length);
    assert.ok(encrypted.length >= 32 + 12 + 16);
  });

  it('same content encrypts differently each time', () => {
    const content = Buffer.from('same content');
    const a = encryptBuffer(content, 'pass');
    const b = encryptBuffer(content, 'pass');
    assert.notDeepEqual(a, b); // random salt + IV
  });
});

// ===========================================================================
// Mock Provider Tests
// ===========================================================================

describe('MockProvider', () => {
  it('seeds and downloads files', async () => {
    const provider = new MockProvider();
    provider.seedFile('index.json', '{"version": 2}');

    const { content } = await provider.downloadFile('index.json');
    assert.equal(content.toString(), '{"version": 2}');
  });

  it('uploads and lists files', async () => {
    const provider = new MockProvider();
    await provider.uploadFile('test.md', Buffer.from('hello'));

    const { files } = await provider.listFiles(null);
    assert.equal(files.length, 1);
    assert.equal(files[0].path, 'test.md');
  });

  it('deletes files', async () => {
    const provider = new MockProvider();
    provider.seedFile('to-delete.md', 'content');
    await provider.deleteFile('to-delete.md');

    const { files } = await provider.listFiles(null);
    assert.equal(files.length, 0);
  });

  it('tracks call log', async () => {
    const provider = new MockProvider();
    await provider.listFiles(null);
    await provider.uploadFile('x.md', Buffer.from(''));
    await provider.downloadFile('x.md');
    await provider.deleteFile('x.md');

    assert.deepEqual(provider.callLog, ['listFiles', 'upload:x.md', 'download:x.md', 'delete:x.md']);
  });
});

// ===========================================================================
// Diff + Mock Provider Integration
// ===========================================================================

describe('diff with mock provider data', () => {
  it('first push: all local files should upload', async () => {
    const provider = new MockProvider();
    const { files: remoteFiles } = await provider.listFiles(null);

    const localFiles = new Map([
      ['index.json', { hash: 'h1', size: 10 }],
      ['memories.md', { hash: 'h2', size: 20 }],
    ]);

    const diff = computeSyncDiff(localFiles, remoteFiles, { files: {} });
    assert.equal(diff.toUpload.length, 2);
    assert.equal(diff.toDownload.length, 0);
  });

  it('first pull: all remote files should download', async () => {
    const provider = new MockProvider();
    provider.seedFile('index.json', '{}');
    provider.seedFile('memories.md', '# Memories');

    const { files: remoteFiles } = await provider.listFiles(null);

    const diff = computeSyncDiff(new Map(), remoteFiles, { files: {} });
    assert.equal(diff.toDownload.length, 2);
    assert.equal(diff.toUpload.length, 0);
  });

  it('synced state: no changes needed', async () => {
    const provider = new MockProvider();
    provider.seedFile('index.json', '{}');

    const { files: remoteFiles } = await provider.listFiles(null);

    const localFiles = new Map([
      ['index.json', { hash: sha256('{}'), size: 2 }],
    ]);

    const state = {
      files: {
        'index.json': {
          localHash: sha256('{}'),
          remoteHash: remoteFiles[0].hash,
          remoteRev: remoteFiles[0].rev,
        },
      },
    };

    const diff = computeSyncDiff(localFiles, remoteFiles, state);
    assert.equal(diff.toUpload.length, 0);
    assert.equal(diff.toDownload.length, 0);
    assert.equal(diff.conflicts.length, 0);
    assert.equal(diff.unchanged.length, 1);
  });
});
