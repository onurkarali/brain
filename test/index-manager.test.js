const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getBrainDir,
  readIndex,
  writeIndex,
  addMemory,
  removeMemory,
  updateMemory,
  generateId,
  readMeta,
  writeMeta,
  groupByCategory,
  readAssociations,
  writeAssociations,
  reinforceEdge,
  getNeighbors,
  decayAssociations,
  readContexts,
  writeContexts,
  readReviewQueue,
  writeReviewQueue,
  readArchiveIndex,
  writeArchiveIndex,
} = require('../src/index-manager');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-test-'));
  fs.mkdirSync(path.join(tmpDir, '.brain'), { recursive: true });
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function makeIndex(memories = {}) {
  return {
    version: '2.0',
    memory_count: Object.keys(memories).length,
    memories,
    last_updated: new Date().toISOString(),
  };
}

// ===========================================================================
// getBrainDir
// ===========================================================================
describe('getBrainDir', () => {
  it('returns <projectRoot>/.brain', () => {
    const input = path.join(path.sep, 'some', 'project');
    assert.equal(getBrainDir(input), path.join(input, '.brain'));
  });

  it('defaults to ~/.brain when no arg', () => {
    const result = getBrainDir();
    assert.equal(result, path.join(os.homedir(), '.brain'));
  });
});

// ===========================================================================
// readIndex / writeIndex
// ===========================================================================
describe('readIndex / writeIndex', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('returns null for missing file', () => {
    assert.equal(readIndex(tmpDir), null);
  });

  it('round-trips correctly (write then read)', () => {
    const index = makeIndex({ m1: { path: 'core/test.md', strength: 0.8 } });
    writeIndex(index, tmpDir);
    const result = readIndex(tmpDir);
    assert.equal(result.memories.m1.strength, 0.8);
    assert.equal(result.memory_count, 1);
  });

  it('writeIndex sets last_updated timestamp', () => {
    const index = makeIndex();
    const before = new Date().toISOString();
    writeIndex(index, tmpDir);
    const result = readIndex(tmpDir);
    assert.ok(result.last_updated >= before);
  });
});

// ===========================================================================
// addMemory / removeMemory / updateMemory
// ===========================================================================
describe('addMemory / removeMemory / updateMemory', () => {
  it('addMemory adds entry and increments count', () => {
    const index = makeIndex();
    addMemory(index, 'm1', { path: 'core/test.md', strength: 0.8 });
    assert.ok(index.memories.m1);
    assert.equal(index.memory_count, 1);
  });

  it('addMemory multiple adds count correctly', () => {
    const index = makeIndex();
    addMemory(index, 'm1', { path: 'a.md' });
    addMemory(index, 'm2', { path: 'b.md' });
    addMemory(index, 'm3', { path: 'c.md' });
    assert.equal(index.memory_count, 3);
  });

  it('removeMemory removes and decrements count', () => {
    const index = makeIndex();
    addMemory(index, 'm1', { path: 'a.md' });
    addMemory(index, 'm2', { path: 'b.md' });
    removeMemory(index, 'm1');
    assert.equal(index.memory_count, 1);
    assert.equal(index.memories.m1, undefined);
  });

  it('removeMemory on non-existent ID is a no-op', () => {
    const index = makeIndex({ m1: { path: 'a.md' } });
    removeMemory(index, 'nonexistent');
    assert.equal(index.memory_count, 1);
  });

  it('updateMemory partial update merges fields', () => {
    const index = makeIndex();
    addMemory(index, 'm1', { path: 'a.md', strength: 0.5, tags: ['old'] });
    updateMemory(index, 'm1', { strength: 0.8 });
    assert.equal(index.memories.m1.strength, 0.8);
    assert.deepEqual(index.memories.m1.tags, ['old']); // preserved
  });

  it('updateMemory on non-existent ID is a no-op', () => {
    const index = makeIndex();
    updateMemory(index, 'nonexistent', { strength: 0.9 });
    assert.equal(Object.keys(index.memories).length, 0);
  });
});

// ===========================================================================
// generateId
// ===========================================================================
describe('generateId', () => {
  it('matches pattern mem_YYYYMMDD_<6-hex>', () => {
    const id = generateId();
    assert.match(id, /^mem_\d{8}_[0-9a-f]{1,6}$/);
  });

  it('two calls produce different IDs', () => {
    const a = generateId();
    const b = generateId();
    assert.notEqual(a, b);
  });
});

// ===========================================================================
// readMeta / writeMeta
// ===========================================================================
describe('readMeta / writeMeta', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('returns null for missing meta', () => {
    assert.equal(readMeta('core', tmpDir), null);
  });

  it('round-trips correctly', () => {
    const meta = { description: 'Core memories', count: 5 };
    writeMeta('core', meta, tmpDir);
    const result = readMeta('core', tmpDir);
    assert.deepEqual(result, meta);
  });

  it('writeMeta creates parent directories recursively', () => {
    const meta = { description: 'Deep nested' };
    writeMeta('deep/nested/path', meta, tmpDir);
    const result = readMeta('deep/nested/path', tmpDir);
    assert.deepEqual(result, meta);
  });
});

// ===========================================================================
// groupByCategory
// ===========================================================================
describe('groupByCategory', () => {
  it('groups by first path segment', () => {
    const index = makeIndex({
      m1: { path: 'core/a.md' },
      m2: { path: 'core/b.md' },
      m3: { path: 'project/c.md' },
    });
    const groups = groupByCategory(index);
    assert.equal(groups.core.length, 2);
    assert.equal(groups.project.length, 1);
  });

  it('includes id field in each entry', () => {
    const index = makeIndex({ m1: { path: 'core/a.md' } });
    const groups = groupByCategory(index);
    assert.equal(groups.core[0].id, 'm1');
  });

  it('empty memories returns empty groups', () => {
    const index = makeIndex();
    const groups = groupByCategory(index);
    assert.deepEqual(groups, {});
  });
});

// ===========================================================================
// reinforceEdge
// ===========================================================================
describe('reinforceEdge', () => {
  it('creates bidirectional edges with initial weight', () => {
    const assoc = { edges: {} };
    reinforceEdge(assoc, 'a', 'b', 'tag_overlap', 0.20);
    assert.ok(assoc.edges.a.b);
    assert.ok(assoc.edges.b.a);
    assert.equal(assoc.edges.a.b.weight, 0.20);
    assert.equal(assoc.edges.b.a.weight, 0.20);
    assert.equal(assoc.edges.a.b.origin, 'tag_overlap');
  });

  it('self-links are rejected', () => {
    const assoc = { edges: {} };
    reinforceEdge(assoc, 'a', 'a', 'manual');
    assert.equal(Object.keys(assoc.edges).length, 0);
  });

  it('repeated reinforcement applies Hebbian formula', () => {
    const assoc = { edges: {} };
    reinforceEdge(assoc, 'a', 'b', 'co_retrieval', 0.20);
    const w0 = assoc.edges.a.b.weight;
    reinforceEdge(assoc, 'a', 'b', 'co_retrieval');
    const w1 = assoc.edges.a.b.weight;
    // Hebbian: w1 = min(1, 0.20 + 0.10*(1-0.20)) = min(1, 0.28)
    const expected = Math.min(1.0, w0 + 0.10 * (1.0 - w0));
    assert.ok(Math.abs(w1 - expected) < 0.001);
  });

  it('co_retrievals increments on reinforcement', () => {
    const assoc = { edges: {} };
    reinforceEdge(assoc, 'a', 'b', 'tag_overlap');
    assert.equal(assoc.edges.a.b.co_retrievals, 0);
    reinforceEdge(assoc, 'a', 'b', 'co_retrieval');
    assert.equal(assoc.edges.a.b.co_retrievals, 1);
  });

  it('respects custom initialWeight', () => {
    const assoc = { edges: {} };
    reinforceEdge(assoc, 'a', 'b', 'manual', 0.50);
    assert.equal(assoc.edges.a.b.weight, 0.50);
  });
});

// ===========================================================================
// getNeighbors
// ===========================================================================
describe('getNeighbors', () => {
  it('returns [] for null associations', () => {
    assert.deepEqual(getNeighbors(null, 'a'), []);
  });

  it('returns [] for empty associations', () => {
    assert.deepEqual(getNeighbors({ edges: {} }, 'a'), []);
  });

  it('returns [] for unknown ID', () => {
    const assoc = { edges: { x: { y: { weight: 0.5 } } } };
    assert.deepEqual(getNeighbors(assoc, 'unknown'), []);
  });

  it('returns array with edge fields spread', () => {
    const assoc = { edges: {} };
    reinforceEdge(assoc, 'a', 'b', 'tag_overlap', 0.30);
    const neighbors = getNeighbors(assoc, 'a');
    assert.equal(neighbors.length, 1);
    assert.equal(neighbors[0].id, 'b');
    assert.equal(neighbors[0].weight, 0.30);
    assert.equal(neighbors[0].origin, 'tag_overlap');
  });
});

// ===========================================================================
// decayAssociations
// ===========================================================================
describe('decayAssociations', () => {
  it('decays weights based on elapsed time', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const assoc = {
      edges: {
        a: { b: { weight: 0.5, last_activated: oldDate.toISOString() } },
        b: { a: { weight: 0.5, last_activated: oldDate.toISOString() } },
      },
    };
    decayAssociations(assoc, 0.998, 0.01);
    const expected = 0.5 * Math.pow(0.998, 10);
    assert.ok(Math.abs(assoc.edges.a.b.weight - expected) < 0.01);
  });

  it('prunes edges below threshold', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 500);
    const assoc = {
      edges: {
        a: { b: { weight: 0.1, last_activated: oldDate.toISOString() } },
        b: { a: { weight: 0.1, last_activated: oldDate.toISOString() } },
      },
    };
    decayAssociations(assoc, 0.998, 0.05);
    // After 500 days at 0.998: 0.1 * 0.998^500 ≈ 0.037 < 0.05
    assert.equal(assoc.edges.a, undefined);
  });

  it('cleans up empty neighbor maps', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 1000);
    const assoc = {
      edges: {
        a: { b: { weight: 0.05, last_activated: oldDate.toISOString() } },
      },
    };
    decayAssociations(assoc, 0.998, 0.05);
    assert.equal(assoc.edges.a, undefined);
  });

  it('returns unchanged for null input', () => {
    assert.equal(decayAssociations(null), null);
  });
});

// ===========================================================================
// File I/O round-trip tests
// ===========================================================================
describe('readAssociations / writeAssociations round-trip', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('round-trips correctly', () => {
    const assoc = { edges: { a: { b: { weight: 0.5 } } } };
    writeAssociations(assoc, tmpDir);
    const result = readAssociations(tmpDir);
    assert.deepEqual(result, assoc);
  });

  it('returns null when file does not exist', () => {
    assert.equal(readAssociations(tmpDir), null);
  });
});

describe('readContexts / writeContexts round-trip', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('round-trips correctly', () => {
    const ctx = { sessions: [{ project: 'brain', topics: ['memory'] }] };
    writeContexts(ctx, tmpDir);
    const result = readContexts(tmpDir);
    assert.deepEqual(result, ctx);
  });

  it('returns null when file does not exist', () => {
    assert.equal(readContexts(tmpDir), null);
  });
});

describe('readReviewQueue / writeReviewQueue round-trip', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('round-trips correctly', () => {
    const queue = { items: [{ id: 'm1', next_review: '2026-02-15' }] };
    writeReviewQueue(queue, tmpDir);
    const result = readReviewQueue(tmpDir);
    assert.deepEqual(result, queue);
  });

  it('returns null when file does not exist', () => {
    assert.equal(readReviewQueue(tmpDir), null);
  });
});

describe('readArchiveIndex / writeArchiveIndex round-trip', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('round-trips correctly', () => {
    const archive = { archived: [{ id: 'm1', reason: 'low strength' }] };
    writeArchiveIndex(archive, tmpDir);
    const result = readArchiveIndex(tmpDir);
    assert.deepEqual(result, archive);
  });

  it('creates _archived/ directory automatically', () => {
    writeArchiveIndex({ archived: [] }, tmpDir);
    const dirExists = fs.existsSync(path.join(tmpDir, '.brain', '_archived'));
    assert.ok(dirExists);
  });

  it('returns null when file does not exist', () => {
    assert.equal(readArchiveIndex(tmpDir), null);
  });
});
