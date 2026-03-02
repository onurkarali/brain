const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const { SyncProvider, createProvider } = require('../src/sync/provider');
const { computeDropboxHash, BLOCK_SIZE } = require('../src/sync/providers/dropbox');

// ===========================================================================
// SyncProvider Base Class
// ===========================================================================

describe('SyncProvider', () => {
  it('cannot be instantiated directly', () => {
    assert.throws(
      () => new SyncProvider({ accessToken: 'test' }),
      /abstract/
    );
  });

  it('base class methods throw "not implemented"', async () => {
    // Create a minimal subclass to test base methods
    class TestProvider extends SyncProvider {
      constructor() {
        super({ accessToken: 'test' });
      }
    }

    const p = new TestProvider();

    await assert.rejects(() => p.listFiles(null), /not implemented/);
    await assert.rejects(() => p.downloadFile('test'), /not implemented/);
    await assert.rejects(() => p.uploadFile('test', Buffer.alloc(0)), /not implemented/);
    await assert.rejects(() => p.deleteFile('test'), /not implemented/);
    await assert.rejects(() => p.getFileMetadata('test'), /not implemented/);
    await assert.rejects(() => p.testConnection(), /not implemented/);
    assert.throws(() => p.computeContentHash(Buffer.alloc(0)), /not implemented/);
  });

  it('createFolder has default no-op', async () => {
    class TestProvider extends SyncProvider {
      constructor() {
        super({ accessToken: 'test' });
      }
    }
    const p = new TestProvider();
    await assert.doesNotReject(() => p.createFolder('test'));
  });

  it('refreshAuth has default no-op', async () => {
    class TestProvider extends SyncProvider {
      constructor() {
        super({ accessToken: 'test' });
      }
    }
    const p = new TestProvider();
    await assert.doesNotReject(() => p.refreshAuth());
  });
});

// ===========================================================================
// Provider Factory
// ===========================================================================

describe('createProvider', () => {
  it('creates a Dropbox provider', () => {
    const p = createProvider('dropbox', { accessToken: 'test' });
    assert.ok(p);
    assert.equal(p.accessToken, 'test');
  });

  it('creates a Google Drive provider', () => {
    const p = createProvider('google-drive', { accessToken: 'test' });
    assert.ok(p);
  });

  it('creates a OneDrive provider', () => {
    const p = createProvider('onedrive', { accessToken: 'test' });
    assert.ok(p);
  });

  it('throws for unknown provider', () => {
    assert.throws(
      () => createProvider('icloud', { accessToken: 'test' }),
      /Unknown sync provider: icloud/
    );
  });
});

// ===========================================================================
// Dropbox Content Hash
// ===========================================================================

describe('Dropbox content hash', () => {
  it('hashes an empty buffer', () => {
    const hash = computeDropboxHash(Buffer.alloc(0));
    // SHA-256 of (SHA-256 of empty) — Dropbox still processes 0 blocks
    // but our impl adds one empty-block hash
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);

    // Known value: SHA-256(SHA-256('')) = SHA-256(e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855)
    const innerHash = crypto.createHash('sha256').update(Buffer.alloc(0)).digest();
    const expected = crypto.createHash('sha256').update(innerHash).digest('hex');
    assert.equal(hash, expected);
  });

  it('hashes a small file (single block)', () => {
    const data = Buffer.from('Hello, Brain Memory!');
    const hash = computeDropboxHash(data);
    assert.equal(hash.length, 64);

    // Manual computation: single block
    const blockHash = crypto.createHash('sha256').update(data).digest();
    const expected = crypto.createHash('sha256').update(blockHash).digest('hex');
    assert.equal(hash, expected);
  });

  it('is deterministic', () => {
    const data = Buffer.from('deterministic test');
    assert.equal(computeDropboxHash(data), computeDropboxHash(data));
  });

  it('differs for different content', () => {
    const a = computeDropboxHash(Buffer.from('aaa'));
    const b = computeDropboxHash(Buffer.from('bbb'));
    assert.notEqual(a, b);
  });

  it('handles exactly one block boundary (4MB)', () => {
    // Use a simulated 4MB buffer (we just need the hash to be valid)
    const block = Buffer.alloc(BLOCK_SIZE, 0x42);
    const hash = computeDropboxHash(block);
    assert.equal(hash.length, 64);

    // Single block → SHA-256(SHA-256(block))
    const blockHash = crypto.createHash('sha256').update(block).digest();
    const expected = crypto.createHash('sha256').update(blockHash).digest('hex');
    assert.equal(hash, expected);
  });

  it('handles multi-block data (> 4MB)', () => {
    // 4MB + 1 byte = 2 blocks
    const data = Buffer.alloc(BLOCK_SIZE + 1, 0xAA);
    const hash = computeDropboxHash(data);
    assert.equal(hash.length, 64);

    // Manual: block1 = first 4MB, block2 = last 1 byte
    const block1 = data.subarray(0, BLOCK_SIZE);
    const block2 = data.subarray(BLOCK_SIZE);
    const hash1 = crypto.createHash('sha256').update(block1).digest();
    const hash2 = crypto.createHash('sha256').update(block2).digest();
    const combined = Buffer.concat([hash1, hash2]);
    const expected = crypto.createHash('sha256').update(combined).digest('hex');
    assert.equal(hash, expected);
  });
});

// ===========================================================================
// Google Drive Content Hash (MD5)
// ===========================================================================

describe('Google Drive content hash', () => {
  it('uses MD5', () => {
    const p = createProvider('google-drive', { accessToken: 'test' });
    const hash = p.computeContentHash(Buffer.from('test'));
    const expected = crypto.createHash('md5').update(Buffer.from('test')).digest('hex');
    assert.equal(hash, expected);
  });
});

// ===========================================================================
// OneDrive Content Hash (SHA-1)
// ===========================================================================

describe('OneDrive content hash', () => {
  it('uses SHA-1 uppercase', () => {
    const p = createProvider('onedrive', { accessToken: 'test' });
    const hash = p.computeContentHash(Buffer.from('test'));
    const expected = crypto.createHash('sha1').update(Buffer.from('test')).digest('hex').toUpperCase();
    assert.equal(hash, expected);
  });
});

// ===========================================================================
// Google Drive Path Cache
// ===========================================================================

describe('Google Drive path cache', () => {
  it('restores cache from options', () => {
    const cache = { 'index.json': 'file_id_1', 'professional/skills.md': 'file_id_2' };
    const p = createProvider('google-drive', {
      accessToken: 'test',
      options: { pathCache: cache },
    });
    const exported = p.exportPathCache();
    assert.deepEqual(exported, cache);
  });

  it('exports empty cache by default', () => {
    const p = createProvider('google-drive', { accessToken: 'test' });
    assert.deepEqual(p.exportPathCache(), {});
  });
});

// ===========================================================================
// OneDrive Path Extraction
// ===========================================================================

describe('OneDrive path extraction', () => {
  it('extracts root-level file path', () => {
    const { OneDriveProvider } = require('../src/sync/providers/onedrive');
    const p = new OneDriveProvider({ accessToken: 'test' });

    const item = {
      name: 'index.json',
      parentReference: { path: '/drive/special/approot' },
    };
    assert.equal(p._extractPath(item), 'index.json');
  });

  it('extracts nested file path', () => {
    const { OneDriveProvider } = require('../src/sync/providers/onedrive');
    const p = new OneDriveProvider({ accessToken: 'test' });

    const item = {
      name: 'skills.md',
      parentReference: { path: '/drive/special/approot:/professional' },
    };
    assert.equal(p._extractPath(item), 'professional/skills.md');
  });

  it('extracts deeply nested file path', () => {
    const { OneDriveProvider } = require('../src/sync/providers/onedrive');
    const p = new OneDriveProvider({ accessToken: 'test' });

    const item = {
      name: 'ts.md',
      parentReference: { path: '/drive/special/approot:/professional/skills' },
    };
    assert.equal(p._extractPath(item), 'professional/skills/ts.md');
  });

  it('returns null for items without name', () => {
    const { OneDriveProvider } = require('../src/sync/providers/onedrive');
    const p = new OneDriveProvider({ accessToken: 'test' });
    assert.equal(p._extractPath({}), null);
  });
});
