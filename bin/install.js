#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

const RUNTIMES = {
  claude: {
    name: 'Claude Code',
    globalDir: path.join(require('os').homedir(), '.claude'),
    localDir: '.claude',
    commandsSubdir: 'commands',
    promptFile: 'CLAUDE.md',
    promptSource: 'claude.md',
    settingsFile: 'settings.json',
    commandStyle: 'flat',
  },
  gemini: {
    name: 'Gemini CLI',
    globalDir: path.join(require('os').homedir(), '.gemini'),
    localDir: '.gemini',
    commandsSubdir: 'commands',
    promptFile: 'GEMINI.md',
    promptSource: 'gemini.md',
    settingsFile: null,
    commandStyle: 'flat',
  },
  openai: {
    name: 'OpenAI Codex CLI',
    globalDir: path.join(require('os').homedir(), '.codex'),
    localDir: '.codex',
    commandsSubdir: 'skills',
    promptFile: 'AGENTS.md',
    promptSource: 'openai.md',
    settingsFile: null,
    commandStyle: 'skills',
  },
};

const BRAIN_MARKER_START = '<!-- BRAIN-MEMORY-START -->';
const BRAIN_MARKER_END = '<!-- BRAIN-MEMORY-END -->';

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installSkills(commandsSrc, skillsDest) {
  const entries = fs.readdirSync(commandsSrc).filter((f) => f.endsWith('.md'));
  for (const file of entries) {
    const name = file.replace('.md', '');
    const skillDir = path.join(skillsDest, `brain-${name}`);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.copyFileSync(
      path.join(commandsSrc, file),
      path.join(skillDir, 'SKILL.md')
    );
  }
}

function injectPrompt(targetDir, promptFile, promptSource) {
  const promptContent = fs.readFileSync(
    path.join(PACKAGE_ROOT, 'prompts', promptSource),
    'utf-8'
  );
  const targetPath = path.join(targetDir, promptFile);

  const wrappedContent = `\n${BRAIN_MARKER_START}\n${promptContent}\n${BRAIN_MARKER_END}\n`;

  if (fs.existsSync(targetPath)) {
    let existing = fs.readFileSync(targetPath, 'utf-8');
    // Remove old brain section if present
    const startIdx = existing.indexOf(BRAIN_MARKER_START);
    const endIdx = existing.indexOf(BRAIN_MARKER_END);
    if (startIdx !== -1 && endIdx !== -1) {
      existing =
        existing.substring(0, startIdx) +
        existing.substring(endIdx + BRAIN_MARKER_END.length);
    }
    fs.writeFileSync(targetPath, existing.trimEnd() + '\n' + wrappedContent);
  } else {
    fs.writeFileSync(targetPath, wrappedContent.trim() + '\n');
  }
}

function installForRuntime(runtime, scope) {
  const config = RUNTIMES[runtime];
  const targetDir = scope === 'global' ? config.globalDir : config.localDir;
  const commandsSrc = path.join(PACKAGE_ROOT, 'commands', 'brain');

  console.log(`\n  Installing for ${config.name} (${scope})...`);

  if (config.commandStyle === 'skills') {
    // Codex: each command becomes a skill directory with SKILL.md
    const skillsDest = path.join(targetDir, config.commandsSubdir);
    console.log(`    Installing skills to ${skillsDest}`);
    installSkills(commandsSrc, skillsDest);
  } else {
    // Claude / Gemini: flat copy into commands/brain/
    const commandsDest = path.join(targetDir, config.commandsSubdir, 'brain');
    console.log(`    Copying commands to ${commandsDest}`);
    copyDir(commandsSrc, commandsDest);
  }

  // Inject prompt into CLAUDE.md / GEMINI.md / AGENTS.md
  const promptTarget = scope === 'global' ? config.globalDir : '.';
  console.log(`    Injecting brain context into ${path.join(promptTarget, config.promptFile)}`);
  injectPrompt(promptTarget, config.promptFile, config.promptSource);

  console.log(`    Done!`);
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🧠  Brain Memory — Installer                      ║
║                                                      ║
║   Hierarchical memory system for AI coding agents    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);

  const args = process.argv.slice(2);
  const flags = new Set(args.map((a) => a.replace(/^--/, '')));

  let runtimes = [];
  let scope = null;

  // Check for non-interactive flags
  if (flags.has('claude')) runtimes.push('claude');
  if (flags.has('gemini')) runtimes.push('gemini');
  if (flags.has('openai') || flags.has('codex')) runtimes.push('openai');
  if (flags.has('all')) runtimes = ['claude', 'gemini', 'openai'];
  if (flags.has('global')) scope = 'global';
  if (flags.has('local')) scope = 'local';

  const rl = createRL();

  try {
    // Interactive runtime selection
    if (runtimes.length === 0) {
      console.log('  Which runtimes would you like to install for?\n');
      console.log('    1) Claude Code');
      console.log('    2) Gemini CLI');
      console.log('    3) OpenAI Codex CLI');
      console.log('    4) All');
      console.log('');

      const choice = await ask(rl, '  Select (1/2/3/4): ');
      switch (choice.trim()) {
        case '1':
          runtimes = ['claude'];
          break;
        case '2':
          runtimes = ['gemini'];
          break;
        case '3':
          runtimes = ['openai'];
          break;
        case '4':
          runtimes = ['claude', 'gemini', 'openai'];
          break;
        default:
          console.log('  Invalid choice. Defaulting to Claude Code.');
          runtimes = ['claude'];
      }
    }

    // Interactive scope selection
    if (!scope) {
      console.log('\n  Installation scope:\n');
      console.log('    1) Global  — Available in all projects (~/.claude/, ~/.gemini/, ~/.codex/)');
      console.log('    2) Local   — This project only (./.claude/, ./.gemini/, ./.codex/)');
      console.log('');

      const choice = await ask(rl, '  Select (1/2): ');
      scope = choice.trim() === '2' ? 'local' : 'global';
    }

    // Initialize .brain structure?
    console.log('');
    const initBrain = await ask(
      rl,
      '  Initialize .brain/ directory in current project? (Y/n): '
    );

    // Perform installation
    console.log('\n  Installing...');
    for (const runtime of runtimes) {
      installForRuntime(runtime, scope);
    }

    // Initialize .brain if requested
    if (initBrain.trim().toLowerCase() !== 'n') {
      initializeBrain();
    }

    console.log(`
  ✓ Installation complete!

  Available commands:
    /brain:init          Initialize brain structure
    /brain:memorize      Store a new memory
    /brain:remember      Recall relevant memories
    /brain:review        Spaced repetition review session
    /brain:explore       Browse the brain hierarchy
    /brain:consolidate   Merge related memories
    /brain:forget        Decay or remove memories
    /brain:sunshine      Deep forensic memory erasure
    /brain:sleep         Full maintenance cycle
    /brain:status        Brain overview dashboard

  Get started by running /brain:init in your agent session.
    `);
  } finally {
    rl.close();
  }
}

function initializeBrain() {
  const brainDir = path.join(process.cwd(), '.brain');

  if (fs.existsSync(brainDir)) {
    console.log('\n    .brain/ already exists, skipping initialization.');
    return;
  }

  console.log('\n    Creating .brain/ directory structure...');

  const now = new Date().toISOString();

  // Create directories
  const categories = ['professional', 'personal', 'social', 'family', '_consolidated', '_archived'];
  for (const cat of categories) {
    fs.mkdirSync(path.join(brainDir, cat), { recursive: true });
  }

  // Create index.json
  const index = {
    version: 2,
    created: now,
    last_updated: now,
    memory_count: 0,
    memories: {},
    config: {
      max_depth: 6,
      consolidation_threshold: 0.3,
      decay_check_interval_days: 7,
      strength_boost_on_recall: 0.05,
      auto_consolidate: true,
      propagation_window_days: 7,
      association_config: {
        co_retrieval_boost: 0.10,
        link_decay_rate: 0.998,
        link_prune_threshold: 0.05,
        spreading_activation_depth: 2,
        spreading_activation_decay: 0.5,
      },
    },
  };
  fs.writeFileSync(
    path.join(brainDir, 'index.json'),
    JSON.stringify(index, null, 2) + '\n'
  );

  // Create associations.json
  fs.writeFileSync(
    path.join(brainDir, 'associations.json'),
    JSON.stringify({ version: 1, edges: {} }, null, 2) + '\n'
  );

  // Create contexts.json
  fs.writeFileSync(
    path.join(brainDir, 'contexts.json'),
    JSON.stringify({ version: 1, sessions: [] }, null, 2) + '\n'
  );

  // Create review-queue.json
  fs.writeFileSync(
    path.join(brainDir, 'review-queue.json'),
    JSON.stringify({ version: 1, items: [] }, null, 2) + '\n'
  );

  // Create _archived/index.json
  fs.writeFileSync(
    path.join(brainDir, '_archived', 'index.json'),
    JSON.stringify({ version: 1, archived_count: 0, memories: {} }, null, 2) + '\n'
  );

  // Load category descriptions from template
  const templatePath = path.join(PACKAGE_ROOT, 'templates', 'default-categories.json');
  let template = { top_categories: [] };
  if (fs.existsSync(templatePath)) {
    template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
  }

  // Create _meta.json for each category
  const mainCategories = ['professional', 'personal', 'social', 'family'];
  for (const cat of mainCategories) {
    const templateCat = template.top_categories.find((c) => c.name === cat) || {};
    const meta = {
      category: cat,
      description: templateCat.description || cat,
      created: now,
      memory_count: 0,
      subcategories: [],
    };
    fs.writeFileSync(
      path.join(brainDir, cat, '_meta.json'),
      JSON.stringify(meta, null, 2) + '\n'
    );
  }

  // Create _meta.json for special directories
  for (const special of ['_consolidated', '_archived']) {
    const meta = {
      category: special,
      description:
        special === '_consolidated'
          ? 'Merged memories from consolidation operations'
          : 'Archived memories preserved for recovery',
      created: now,
      memory_count: 0,
      subcategories: [],
    };
    fs.writeFileSync(
      path.join(brainDir, special, '_meta.json'),
      JSON.stringify(meta, null, 2) + '\n'
    );
  }

  console.log('    .brain/ initialized successfully.');
}

main().catch((err) => {
  console.error('Installation failed:', err.message);
  process.exit(1);
});
