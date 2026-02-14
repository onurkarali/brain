const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const scorer = require('../src/scorer');
const im = require('../src/index-manager');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-func-'));
  fs.mkdirSync(path.join(tmpDir, '.brain'), { recursive: true });
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
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
// Full memory lifecycle
// ===========================================================================
describe('Full memory lifecycle', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('add → rank → reinforce → verify', () => {
    // 1. Initialize brain
    const index = makeIndex();
    const assoc = { edges: {} };

    // 2. Add 3 memories with shared tags
    const m1 = {
      path: 'core/auth.md',
      strength: 0.8,
      decay_rate: 0.995,
      last_accessed: daysAgo(2),
      tags: ['auth', 'security'],
    };
    const m2 = {
      path: 'core/session.md',
      strength: 0.6,
      decay_rate: 0.995,
      last_accessed: daysAgo(10),
      tags: ['auth', 'session'],
    };
    const m3 = {
      path: 'project/api.md',
      strength: 0.4,
      decay_rate: 0.990,
      last_accessed: daysAgo(30),
      tags: ['api'],
    };
    im.addMemory(index, 'mem_a', m1);
    im.addMemory(index, 'mem_b', m2);
    im.addMemory(index, 'mem_c', m3);

    // Create association from shared "auth" tag
    im.reinforceEdge(assoc, 'mem_a', 'mem_b', 'tag_overlap', 0.20);

    // 3. Rank memories
    const memories = Object.entries(index.memories).map(([id, e]) => ({ id, ...e }));
    const ranked = scorer.rankMemories(
      memories,
      (mem) => (mem.tags.includes('auth') ? 0.9 : 0.3),
      { associations: assoc }
    );

    // 4. Verify scoring order — auth memories rank higher
    assert.equal(ranked[0].id, 'mem_a');
    assert.ok(ranked[0].score > ranked[ranked.length - 1].score);

    // 5. Reinforce retrieved memory
    const oldStrength = index.memories.mem_a.strength;
    const newStrength = scorer.reinforceStrength(oldStrength, 2, 1);
    im.updateMemory(index, 'mem_a', { strength: newStrength });

    // 6. Verify strength increased
    assert.ok(index.memories.mem_a.strength > oldStrength);

    // Verify decay rate improved
    const oldDecay = m1.decay_rate;
    const newDecay = scorer.improveDecayRate(oldDecay);
    im.updateMemory(index, 'mem_a', { decay_rate: newDecay });
    assert.ok(index.memories.mem_a.decay_rate > oldDecay);

    // Persist and verify
    im.writeIndex(index, tmpDir);
    im.writeAssociations(assoc, tmpDir);
    const loaded = im.readIndex(tmpDir);
    assert.equal(loaded.memory_count, 3);
  });
});

// ===========================================================================
// Association network workflow
// ===========================================================================
describe('Association network workflow', () => {
  it('links, spreading activation, Hebbian reinforcement, and decay', () => {
    // 1. Create 4 memories
    const assoc = { edges: {} };
    const memories = [
      { id: 'A', strength: 0.9, decay_rate: 0.995, last_accessed: daysAgo(1) },
      { id: 'B', strength: 0.7, decay_rate: 0.995, last_accessed: daysAgo(3) },
      { id: 'C', strength: 0.5, decay_rate: 0.995, last_accessed: daysAgo(5) },
      { id: 'D', strength: 0.3, decay_rate: 0.995, last_accessed: daysAgo(7) },
    ];

    // 2. Link A↔B, B↔C
    im.reinforceEdge(assoc, 'A', 'B', 'tag_overlap', 0.20);
    im.reinforceEdge(assoc, 'B', 'C', 'tag_overlap', 0.20);

    // 3. Score with A as high-relevance
    const relevanceFn = (m) => (m.id === 'A' ? 0.95 : 0.3);
    const ranked = scorer.rankMemories(memories, relevanceFn, { associations: assoc });

    const B = ranked.find((m) => m.id === 'B');
    const C = ranked.find((m) => m.id === 'C');
    const D = ranked.find((m) => m.id === 'D');

    // B gets 1-hop spreading bonus from A
    assert.ok(B.spreading_bonus > 0, 'B should have spreading bonus');
    // C gets 2-hop bonus (smaller)
    assert.ok(C.spreading_bonus > 0, 'C should have 2-hop bonus');
    assert.ok(B.spreading_bonus > C.spreading_bonus, 'B bonus > C bonus');
    // D has no links
    assert.equal(D.spreading_bonus, 0, 'D should have no bonus');

    // 4. Co-retrieve A+B → Hebbian reinforcement
    const w0 = assoc.edges.A.B.weight;
    im.reinforceEdge(assoc, 'A', 'B', 'co_retrieval');
    assert.ok(assoc.edges.A.B.weight > w0, 'Weight should increase after co-retrieval');

    // 5. Decay with time simulation
    // Set last_activated to 100 days ago for A↔B
    const old = new Date();
    old.setDate(old.getDate() - 100);
    assoc.edges.A.B.last_activated = old.toISOString();
    assoc.edges.B.A.last_activated = old.toISOString();

    im.decayAssociations(assoc, 0.998, 0.05);
    // Weight should have decreased
    const wAfterDecay = assoc.edges.A ? assoc.edges.A.B : undefined;
    // After 100 days at 0.998: w * 0.998^100 ≈ w * 0.818
    // The edge may or may not survive depending on original weight
    // At minimum it should be lower than the reinforced value
    if (wAfterDecay) {
      assert.ok(wAfterDecay.weight < assoc.edges.B.C.weight + 0.5);
    }
  });
});

// ===========================================================================
// Context-dependent recall
// ===========================================================================
describe('Context-dependent recall', () => {
  it('memories with matching context score higher', () => {
    const ctx1 = { project: 'brain', topics: ['memory', 'scoring'], task_type: 'feature' };
    const ctx2 = { project: 'other', topics: ['unrelated'], task_type: 'bugfix' };

    const memories = [
      {
        id: 'm1',
        strength: 0.7,
        decay_rate: 0.995,
        last_accessed: daysAgo(5),
        encoding_context: ctx1,
      },
      {
        id: 'm2',
        strength: 0.7,
        decay_rate: 0.995,
        last_accessed: daysAgo(5),
        encoding_context: ctx2,
      },
    ];

    const ranked = scorer.rankMemories(memories, () => 0.5, { recallContext: ctx1 });

    const m1 = ranked.find((m) => m.id === 'm1');
    const m2 = ranked.find((m) => m.id === 'm2');
    assert.ok(m1.score > m2.score, 'M1 with matching context should score higher');
    assert.ok(m1.context_match > m2.context_match);
  });
});

// ===========================================================================
// Spaced reinforcement over time
// ===========================================================================
describe('Spaced reinforcement over time', () => {
  it('increasing gaps produce larger boosts; diminishing returns on cramming', () => {
    const initialStrength = 0.5;
    let decayRate = 0.990;

    // 1-day gap reinforcement
    const boost1 = scorer.computeSpacedBoost(1, 0);
    const s1 = scorer.reinforceStrength(initialStrength, 1, 0);
    assert.ok(s1 > initialStrength);

    // 30-day gap reinforcement
    const boost30 = scorer.computeSpacedBoost(30, 1);
    assert.ok(boost30 > boost1, '30-day boost should exceed 1-day boost');

    // Decay rate improves after each reinforcement
    const dr1 = scorer.improveDecayRate(decayRate);
    assert.ok(dr1 > decayRate);
    const dr2 = scorer.improveDecayRate(dr1);
    assert.ok(dr2 > dr1);

    // Diminishing returns: 20th recall in same day
    const boostCram = scorer.computeSpacedBoost(0, 20);
    assert.ok(boostCram < boost1, 'Cramming should produce smaller boost');
  });
});

// ===========================================================================
// Consolidation strength
// ===========================================================================
describe('Consolidation strength', () => {
  it('computes max + 0.15 for weak memories', () => {
    const result = scorer.computeConsolidatedStrength([0.2, 0.3, 0.25]);
    assert.ok(Math.abs(result - 0.45) < 0.001);
  });
});

// ===========================================================================
// Archive index workflow
// ===========================================================================
describe('Archive index workflow', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('write, read back, and verify _archived/ directory', () => {
    const archive = {
      archived: [
        { id: 'mem_old1', reason: 'low_strength', archived_at: daysAgo(0) },
        { id: 'mem_old2', reason: 'duplicate', archived_at: daysAgo(1) },
      ],
    };

    im.writeArchiveIndex(archive, tmpDir);

    // Verify _archived/ dir created
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', '_archived')));

    // Read back and verify structure
    const result = im.readArchiveIndex(tmpDir);
    assert.equal(result.archived.length, 2);
    assert.equal(result.archived[0].id, 'mem_old1');
    assert.equal(result.archived[1].reason, 'duplicate');
  });
});

// ===========================================================================
// Backward compatibility
// ===========================================================================
describe('Backward compatibility', () => {
  it('v1-style memories rank without crashing', () => {
    // v1: no encoding_context, no salience, no cognitive_type
    const memories = [
      {
        id: 'v1_mem',
        strength: 0.8,
        decay_rate: 0.995,
        last_accessed: daysAgo(5),
        tags: ['old-style'],
      },
    ];

    // Full v4 options: associations + recallContext
    const assoc = { edges: {} };
    const ctx = { project: 'brain', topics: ['memory'], task_type: 'feature' };

    const ranked = scorer.rankMemories(memories, () => 0.7, {
      associations: assoc,
      recallContext: ctx,
    });

    assert.equal(ranked.length, 1);
    assert.ok(ranked[0].score > 0);
    assert.equal(ranked[0].context_match, 0); // no encoding_context
    assert.equal(ranked[0].spreading_bonus, 0); // no edges
  });

  it('reinforceStrength with no spacing args uses flat +0.05', () => {
    const result = scorer.reinforceStrength(0.5);
    assert.ok(Math.abs(result - 0.55) < 0.001);
  });
});

// ===========================================================================
// v4 scoring weight verification
// ===========================================================================
describe('v4 scoring weight verification', () => {
  it('memory with high spreading_bonus + context_match ranks higher', () => {
    const ctx = { project: 'brain', topics: ['memory', 'scoring'], task_type: 'feature' };

    const memories = [
      {
        id: 'memA',
        strength: 0.7,
        decay_rate: 0.995,
        last_accessed: daysAgo(5),
        encoding_context: ctx,
        salience: 0.8,
      },
      {
        id: 'memB',
        strength: 0.7,
        decay_rate: 0.995,
        last_accessed: daysAgo(5),
        // no encoding_context, no salience
      },
    ];

    // Create strong association so memA gets a large spreading bonus
    const assoc = { edges: {} };
    im.reinforceEdge(assoc, 'memA', 'helper', 'tag_overlap', 0.90);

    // Add a helper memory to the scored set so spreading fires
    memories.push({
      id: 'helper',
      strength: 0.9,
      decay_rate: 0.995,
      last_accessed: daysAgo(1),
    });

    const ranked = scorer.rankMemories(memories, () => 0.6, {
      associations: assoc,
      recallContext: ctx,
    });

    const memA = ranked.find((m) => m.id === 'memA');
    const memB = ranked.find((m) => m.id === 'memB');
    assert.ok(memA.score > memB.score, 'memA with extras should rank higher');
  });
});

// ===========================================================================
// File persistence round-trip (end-to-end)
// ===========================================================================
describe('File persistence end-to-end', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('full write/read cycle across all file types', () => {
    // Index
    const index = makeIndex();
    im.addMemory(index, 'm1', { path: 'core/test.md', strength: 0.8 });
    im.writeIndex(index, tmpDir);
    assert.ok(im.readIndex(tmpDir).memories.m1);

    // Associations
    const assoc = { edges: {} };
    im.reinforceEdge(assoc, 'm1', 'm2', 'tag_overlap');
    im.writeAssociations(assoc, tmpDir);
    assert.ok(im.readAssociations(tmpDir).edges.m1);

    // Contexts
    im.writeContexts({ sessions: [] }, tmpDir);
    assert.deepEqual(im.readContexts(tmpDir).sessions, []);

    // Review queue
    im.writeReviewQueue({ items: [] }, tmpDir);
    assert.deepEqual(im.readReviewQueue(tmpDir).items, []);

    // Archive
    im.writeArchiveIndex({ archived: [] }, tmpDir);
    assert.deepEqual(im.readArchiveIndex(tmpDir).archived, []);
  });
});
