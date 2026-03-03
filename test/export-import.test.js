const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { exportBrain, importBrain, previewImport } = require('../src/export-import');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir, brainDir, exportPath;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-export-test-'));
  brainDir = path.join(tmpDir, '.brain');
  exportPath = path.join(tmpDir, 'test.brain-export');
  fs.mkdirSync(brainDir, { recursive: true });
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function writeBrainFile(relPath, content) {
  const full = path.join(brainDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

// ===========================================================================
// exportBrain
// ===========================================================================

describe('exportBrain', () => {
  beforeEach(setup);
  afterEach(teardown);

  it('creates a single export file', () => {
    writeBrainFile('index.json', '{"memories":[]}');
    writeBrainFile('professional/_meta.json', '{}');

    const result = exportBrain(brainDir, exportPath, null);
    assert.ok(fs.existsSync(exportPath));
    assert.equal(result.fileCount, 2);
  });

  it('excludes .sync/ directory', () => {
    writeBrainFile('index.json', '{}');
    fs.mkdirSync(path.join(brainDir, '.sync'), { recursive: true });
    fs.writeFileSync(path.join(brainDir, '.sync', 'config.json'), '{}');

    const result = exportBrain(brainDir, exportPath, null);
    assert.equal(result.fileCount, 1);

    const payload = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert.ok(!Object.keys(payload.files).some(k => k.includes('.sync')));
  });

  it('export file is valid JSON when unencrypted', () => {
    writeBrainFile('index.json', '{"test":true}');
    exportBrain(brainDir, exportPath, null);

    const payload = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert.equal(payload.version, 1);
    assert.ok(payload.exportedAt);
    assert.equal(payload.files['index.json'], '{"test":true}');
  });

  it('creates an encrypted file when passphrase is provided', () => {
    writeBrainFile('index.json', '{"secret":true}');
    exportBrain(brainDir, exportPath, 'my-pass');

    // Encrypted file should NOT be valid JSON
    assert.throws(() => JSON.parse(fs.readFileSync(exportPath, 'utf8')));
  });

  it('throws when .brain/ does not exist', () => {
    fs.rmSync(brainDir, { recursive: true, force: true });
    assert.throws(() => exportBrain(brainDir, exportPath, null), /not found/);
  });

  it('handles empty brain directory', () => {
    const result = exportBrain(brainDir, exportPath, null);
    assert.equal(result.fileCount, 0);
  });
});

// ===========================================================================
// importBrain
// ===========================================================================

describe('importBrain', () => {
  beforeEach(setup);
  afterEach(teardown);

  it('restores all files from an export', () => {
    writeBrainFile('index.json', '{"memories":[]}');
    writeBrainFile('professional/_meta.json', '{"cat":"pro"}');
    exportBrain(brainDir, exportPath, null);

    // Wipe the brain
    fs.rmSync(brainDir, { recursive: true, force: true });
    fs.mkdirSync(brainDir, { recursive: true });

    const result = importBrain(exportPath, brainDir, null);
    assert.equal(result.fileCount, 2);
    assert.equal(fs.readFileSync(path.join(brainDir, 'index.json'), 'utf8'), '{"memories":[]}');
    assert.equal(fs.readFileSync(path.join(brainDir, 'professional', '_meta.json'), 'utf8'), '{"cat":"pro"}');
  });

  it('round-trips with encryption', () => {
    writeBrainFile('index.json', '{"encrypted":true}');
    exportBrain(brainDir, exportPath, 'secret');

    fs.rmSync(brainDir, { recursive: true, force: true });
    fs.mkdirSync(brainDir, { recursive: true });

    const result = importBrain(exportPath, brainDir, 'secret');
    assert.equal(result.fileCount, 1);
    assert.equal(fs.readFileSync(path.join(brainDir, 'index.json'), 'utf8'), '{"encrypted":true}');
  });

  it('throws with wrong passphrase', () => {
    writeBrainFile('index.json', '{}');
    exportBrain(brainDir, exportPath, 'correct');

    assert.throws(
      () => importBrain(exportPath, brainDir, 'wrong'),
      /Decryption failed|wrong passphrase|unable to authenticate/i
    );
  });

  it('throws when file does not exist', () => {
    assert.throws(() => importBrain('/nonexistent/path', brainDir, null), /not found/);
  });

  it('throws on non-JSON unencrypted file', () => {
    fs.writeFileSync(exportPath, 'not json at all');
    assert.throws(() => importBrain(exportPath, brainDir, null), /Invalid export file/);
  });

  it('supports merge mode — skips newer local files', (t) => {
    writeBrainFile('index.json', '{"local":true}');
    exportBrain(brainDir, exportPath, null);

    // Touch the local file to make it newer
    const localPath = path.join(brainDir, 'index.json');
    fs.writeFileSync(localPath, '{"local":"newer"}', 'utf8');
    // Set mtime to the future to guarantee it's newer
    const future = new Date(Date.now() + 60000);
    fs.utimesSync(localPath, future, future);

    const result = importBrain(exportPath, brainDir, null, { mode: 'merge' });
    assert.equal(result.skipped, 1);
    assert.equal(result.fileCount, 0);
    // Local file should be unchanged
    assert.equal(fs.readFileSync(localPath, 'utf8'), '{"local":"newer"}');
  });

  it('overwrite mode replaces existing files', () => {
    writeBrainFile('index.json', '{"original":true}');
    exportBrain(brainDir, exportPath, null);

    // Modify local
    writeBrainFile('index.json', '{"modified":true}');

    const result = importBrain(exportPath, brainDir, null, { mode: 'overwrite' });
    assert.equal(result.fileCount, 1);
    assert.equal(fs.readFileSync(path.join(brainDir, 'index.json'), 'utf8'), '{"original":true}');
  });
});

// ===========================================================================
// previewImport
// ===========================================================================

describe('previewImport', () => {
  beforeEach(setup);
  afterEach(teardown);

  it('shows new and existing files', () => {
    writeBrainFile('index.json', '{}');
    writeBrainFile('extra.json', '{}');
    exportBrain(brainDir, exportPath, null);

    // Remove one file locally
    fs.unlinkSync(path.join(brainDir, 'extra.json'));

    const preview = previewImport(exportPath, brainDir, null);
    assert.equal(preview.totalFiles, 2);
    assert.equal(preview.existingFiles.length, 1);
    assert.equal(preview.newFiles.length, 1);
    assert.ok(preview.exportedAt);
  });
});
