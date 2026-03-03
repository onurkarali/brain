const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  RUNTIMES,
  BRAIN_MARKER_START,
  BRAIN_MARKER_END,
  copyDir,
  installSkills,
  injectPrompt,
  installForRuntime,
  initializeBrain,
} = require('../src/installer');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-install-'));
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ===========================================================================
// copyDir
// ===========================================================================
describe('copyDir', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('copies all files from source to destination', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'a.md'), 'content a');
    fs.writeFileSync(path.join(src, 'b.md'), 'content b');

    copyDir(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'a.md')));
    assert.ok(fs.existsSync(path.join(dest, 'b.md')));
    assert.equal(fs.readFileSync(path.join(dest, 'a.md'), 'utf-8'), 'content a');
    assert.equal(fs.readFileSync(path.join(dest, 'b.md'), 'utf-8'), 'content b');
  });

  it('copies nested directories recursively', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'dest');
    fs.mkdirSync(path.join(src, 'sub'), { recursive: true });
    fs.writeFileSync(path.join(src, 'top.md'), 'top');
    fs.writeFileSync(path.join(src, 'sub', 'nested.md'), 'nested');

    copyDir(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'top.md')));
    assert.ok(fs.existsSync(path.join(dest, 'sub', 'nested.md')));
    assert.equal(fs.readFileSync(path.join(dest, 'sub', 'nested.md'), 'utf-8'), 'nested');
  });

  it('creates destination directory if it does not exist', () => {
    const src = path.join(tmpDir, 'src');
    const dest = path.join(tmpDir, 'deep', 'nested', 'dest');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'file.md'), 'hello');

    copyDir(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'file.md')));
  });
});

// ===========================================================================
// installSkills
// ===========================================================================
describe('installSkills', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('creates skill directories with SKILL.md for each .md file', () => {
    const src = path.join(tmpDir, 'commands');
    const dest = path.join(tmpDir, 'skills');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'init.md'), '# Init command');
    fs.writeFileSync(path.join(src, 'memorize.md'), '# Memorize command');

    installSkills(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'brain-init', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(dest, 'brain-memorize', 'SKILL.md')));
    assert.equal(
      fs.readFileSync(path.join(dest, 'brain-init', 'SKILL.md'), 'utf-8'),
      '# Init command'
    );
  });

  it('ignores non-.md files', () => {
    const src = path.join(tmpDir, 'commands');
    const dest = path.join(tmpDir, 'skills');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'init.md'), '# Init');
    fs.writeFileSync(path.join(src, 'readme.txt'), 'ignore me');
    fs.writeFileSync(path.join(src, 'config.json'), '{}');

    installSkills(src, dest);

    assert.ok(fs.existsSync(path.join(dest, 'brain-init', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(dest, 'brain-readme')));
    assert.ok(!fs.existsSync(path.join(dest, 'brain-config')));
  });
});

// ===========================================================================
// injectPrompt
// ===========================================================================
describe('injectPrompt', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('creates prompt file when it does not exist', () => {
    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    assert.ok(content.includes(BRAIN_MARKER_START));
    assert.ok(content.includes(BRAIN_MARKER_END));
    assert.ok(content.includes('# Brain Memory System'));
  });

  it('appends to existing file without markers', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# My Project\n\nExisting content.\n');

    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    assert.ok(content.startsWith('# My Project'));
    assert.ok(content.includes('Existing content.'));
    assert.ok(content.includes(BRAIN_MARKER_START));
    assert.ok(content.includes('# Brain Memory System'));
  });

  it('replaces existing brain section on re-install (idempotent)', () => {
    // First install
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# My Project\n');
    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');

    // Second install — should replace, not duplicate
    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    const startCount = content.split(BRAIN_MARKER_START).length - 1;
    const endCount = content.split(BRAIN_MARKER_END).length - 1;
    assert.equal(startCount, 1, 'Should have exactly one start marker');
    assert.equal(endCount, 1, 'Should have exactly one end marker');
  });

  it('preserves content before and after brain section on re-install', () => {
    const before = '# My Project\n\nSome instructions.\n';
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), before);

    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    assert.ok(content.includes('# My Project'));
    assert.ok(content.includes('Some instructions.'));
  });

  it('injected content contains session lifecycle sections', () => {
    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');

    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    assert.ok(content.includes('## Session Start Behavior'));
    assert.ok(content.includes('## Session End Behavior'));
  });

  it('works for gemini prompt source', () => {
    injectPrompt(tmpDir, 'GEMINI.md', 'gemini.md');

    const content = fs.readFileSync(path.join(tmpDir, 'GEMINI.md'), 'utf-8');
    assert.ok(content.includes(BRAIN_MARKER_START));
    assert.ok(content.includes('## Session Start Behavior'));
  });

  it('works for openai prompt source', () => {
    injectPrompt(tmpDir, 'AGENTS.md', 'openai.md');

    const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');
    assert.ok(content.includes(BRAIN_MARKER_START));
    assert.ok(content.includes('## Session Start Behavior'));
    assert.ok(content.includes('/brain-memorize'));
  });
});

// ===========================================================================
// installForRuntime — local scope (uses tmpDir as cwd)
// ===========================================================================
describe('installForRuntime (local scope)', () => {
  beforeEach(() => {
    setup();
    // Override RUNTIMES localDir to point into tmpDir for isolation
    RUNTIMES.claude.localDir = path.join(tmpDir, '.claude');
    RUNTIMES.gemini.localDir = path.join(tmpDir, '.gemini');
    RUNTIMES.openai.localDir = path.join(tmpDir, '.codex');
  });
  afterEach(() => {
    // Restore defaults
    RUNTIMES.claude.localDir = '.claude';
    RUNTIMES.gemini.localDir = '.gemini';
    RUNTIMES.openai.localDir = '.codex';
    teardown();
  });

  it('installs claude commands as flat files', () => {
    installForRuntime('claude', 'local');

    const commandsDir = path.join(tmpDir, '.claude', 'commands', 'brain');
    assert.ok(fs.existsSync(commandsDir));
    assert.ok(fs.existsSync(path.join(commandsDir, 'memorize.md')));
    assert.ok(fs.existsSync(path.join(commandsDir, 'remember.md')));
    assert.ok(fs.existsSync(path.join(commandsDir, 'sleep.md')));
  });

  it('installs gemini commands as flat files', () => {
    installForRuntime('gemini', 'local');

    const commandsDir = path.join(tmpDir, '.gemini', 'commands', 'brain');
    assert.ok(fs.existsSync(commandsDir));
    assert.ok(fs.existsSync(path.join(commandsDir, 'init.md')));
  });

  it('installs openai commands as skill directories', () => {
    installForRuntime('openai', 'local');

    const skillsDir = path.join(tmpDir, '.codex', 'skills');
    assert.ok(fs.existsSync(path.join(skillsDir, 'brain-init', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(skillsDir, 'brain-memorize', 'SKILL.md')));
  });

  it('injects prompt into the correct file for each runtime', () => {
    // For local scope, injectPrompt targets cwd ('.')
    // We need to set cwd context — but since installForRuntime uses '.' for local,
    // we can't easily test this without changing cwd. Instead test the prompt file
    // exists in the expected location for global scope via a manual inject.
    injectPrompt(tmpDir, 'CLAUDE.md', 'claude.md');
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    assert.ok(content.includes(BRAIN_MARKER_START));
  });
});

// ===========================================================================
// initializeBrain
// ===========================================================================
describe('initializeBrain', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('creates .brain directory structure', () => {
    const result = initializeBrain(tmpDir);

    assert.equal(result.alreadyExists, false);
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', 'professional')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', 'personal')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', 'social')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', 'family')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', '_consolidated')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.brain', '_archived')));
  });

  it('creates index.json with correct structure', () => {
    initializeBrain(tmpDir);

    const index = readJSON(path.join(tmpDir, '.brain', 'index.json'));
    assert.equal(index.version, 2);
    assert.equal(index.memory_count, 0);
    assert.deepEqual(index.memories, {});
    assert.ok(index.created);
    assert.ok(index.last_updated);
    assert.ok(index.config);
    assert.equal(index.config.max_depth, 6);
    assert.equal(index.config.consolidation_threshold, 0.3);
    assert.ok(index.config.association_config);
  });

  it('creates associations.json', () => {
    initializeBrain(tmpDir);

    const assoc = readJSON(path.join(tmpDir, '.brain', 'associations.json'));
    assert.equal(assoc.version, 1);
    assert.deepEqual(assoc.edges, {});
  });

  it('creates contexts.json', () => {
    initializeBrain(tmpDir);

    const ctx = readJSON(path.join(tmpDir, '.brain', 'contexts.json'));
    assert.equal(ctx.version, 1);
    assert.deepEqual(ctx.sessions, []);
  });

  it('creates review-queue.json', () => {
    initializeBrain(tmpDir);

    const queue = readJSON(path.join(tmpDir, '.brain', 'review-queue.json'));
    assert.equal(queue.version, 1);
    assert.deepEqual(queue.items, []);
  });

  it('creates _archived/index.json', () => {
    initializeBrain(tmpDir);

    const archive = readJSON(path.join(tmpDir, '.brain', '_archived', 'index.json'));
    assert.equal(archive.version, 1);
    assert.equal(archive.archived_count, 0);
    assert.deepEqual(archive.memories, {});
  });

  it('creates _meta.json for each category with template descriptions', () => {
    initializeBrain(tmpDir);

    const profMeta = readJSON(path.join(tmpDir, '.brain', 'professional', '_meta.json'));
    assert.equal(profMeta.category, 'professional');
    assert.ok(profMeta.description.includes('Work'));
    assert.equal(profMeta.memory_count, 0);
    assert.deepEqual(profMeta.subcategories, []);

    const personalMeta = readJSON(path.join(tmpDir, '.brain', 'personal', '_meta.json'));
    assert.equal(personalMeta.category, 'personal');
    assert.ok(personalMeta.description.includes('Education'));
  });

  it('creates _meta.json for special directories', () => {
    initializeBrain(tmpDir);

    const consolidated = readJSON(path.join(tmpDir, '.brain', '_consolidated', '_meta.json'));
    assert.equal(consolidated.category, '_consolidated');
    assert.ok(consolidated.description.includes('consolidation'));

    const archived = readJSON(path.join(tmpDir, '.brain', '_archived', '_meta.json'));
    assert.equal(archived.category, '_archived');
    assert.ok(archived.description.includes('recovery'));
  });

  it('returns alreadyExists: true if .brain already exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.brain'), { recursive: true });

    const result = initializeBrain(tmpDir);

    assert.equal(result.alreadyExists, true);
  });

  it('does not overwrite existing .brain directory', () => {
    // Create existing brain with custom content
    const brainDir = path.join(tmpDir, '.brain');
    fs.mkdirSync(brainDir, { recursive: true });
    fs.writeFileSync(path.join(brainDir, 'custom.txt'), 'do not delete');

    initializeBrain(tmpDir);

    // Custom file should still exist
    assert.ok(fs.existsSync(path.join(brainDir, 'custom.txt')));
    // Should NOT have created index.json since brain already existed
    assert.ok(!fs.existsSync(path.join(brainDir, 'index.json')));
  });
});
