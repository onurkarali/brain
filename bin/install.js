#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  RUNTIMES,
  installForRuntime,
  initializeBrain,
  detectInstallations,
  uninstallForRuntime,
} = require('../src/installer');

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const subcommands = ['install', 'update', 'uninstall'];
  let subcommand = 'install';
  const flags = new Set();

  for (const arg of args) {
    const clean = arg.replace(/^--/, '');
    if (subcommands.includes(clean) && arg === clean) {
      // positional subcommand (no --)
      subcommand = clean;
    } else if (clean === 'update') {
      subcommand = 'update';
    } else if (clean === 'uninstall') {
      subcommand = 'uninstall';
    } else {
      flags.add(clean);
    }
  }

  return { subcommand, flags };
}

function resolveRuntimesFromFlags(flags) {
  const runtimes = [];
  if (flags.has('claude')) runtimes.push('claude');
  if (flags.has('gemini')) runtimes.push('gemini');
  if (flags.has('openai') || flags.has('codex')) runtimes.push('openai');
  if (flags.has('all')) return ['claude', 'gemini', 'openai'];
  return runtimes;
}

function resolveScopeFromFlags(flags) {
  if (flags.has('global')) return 'global';
  if (flags.has('local')) return 'local';
  return null;
}

// ---------------------------------------------------------------------------
// Install (original behavior, refactored from main)
// ---------------------------------------------------------------------------
async function runInstall(flags) {
  let runtimes = resolveRuntimesFromFlags(flags);
  let scope = resolveScopeFromFlags(flags);

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
      '  Initialize ~/.brain/ directory? (Y/n): '
    );

    // Perform installation
    console.log('\n  Installing...');
    for (const runtime of runtimes) {
      const config = RUNTIMES[runtime];
      console.log(`\n  Installing for ${config.name} (${scope})...`);
      installForRuntime(runtime, scope);
      console.log(`    Done!`);
    }

    // Initialize .brain if requested
    if (initBrain.trim().toLowerCase() !== 'n') {
      const result = initializeBrain();
      if (result.alreadyExists) {
        console.log('\n    ~/.brain/ already exists, skipping initialization.');
      } else {
        console.log('\n    ~/.brain/ initialized successfully.');
        console.log('');
        console.log('    Use /brain:sync to set up portable sync across devices.');
      }
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
    /brain:sync          Sync memories via Git remote or export/import

  Get started by running /brain:init in your agent session.
    `);
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
async function runUpdate(flags) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
  );
  const version = pkg.version;

  console.log('  Detecting existing installations...\n');

  let detections = detectInstallations();

  // Filter by explicit flags if provided
  const filterRuntimes = resolveRuntimesFromFlags(flags);
  const filterScope = resolveScopeFromFlags(flags);
  if (filterRuntimes.length > 0) {
    detections = detections.filter((d) => filterRuntimes.includes(d.runtime));
  }
  if (filterScope) {
    detections = detections.filter((d) => d.scope === filterScope);
  }

  if (detections.length === 0) {
    console.log('  No existing brain-memory installations found.\n');
    console.log('  To install, run: npx brain-memory@beta');
    if (filterRuntimes.length > 0) {
      console.log(`  (Searched for: ${filterRuntimes.join(', ')})`);
    }
    return;
  }

  console.log(`  Found ${detections.length} installation(s):\n`);
  for (const d of detections) {
    const parts = [];
    if (d.commandsFound) parts.push('commands');
    if (d.promptFound) parts.push('prompt');
    console.log(`    ${d.runtimeName} (${d.scope}) — ${parts.join(' + ')}`);
  }

  console.log('\n  Updating...');
  for (const d of detections) {
    console.log(`\n  Updating ${d.runtimeName} (${d.scope})...`);
    installForRuntime(d.runtime, d.scope);
    console.log('    Done!');
  }

  console.log(`\n  ✓ Updated to v${version}\n`);
}

// ---------------------------------------------------------------------------
// Uninstall
// ---------------------------------------------------------------------------
async function runUninstall(flags) {
  console.log('  Detecting existing installations...\n');

  let detections = detectInstallations();

  // Filter by explicit flags if provided
  const filterRuntimes = resolveRuntimesFromFlags(flags);
  const filterScope = resolveScopeFromFlags(flags);
  if (filterRuntimes.length > 0) {
    detections = detections.filter((d) => filterRuntimes.includes(d.runtime));
  }
  if (filterScope) {
    detections = detections.filter((d) => d.scope === filterScope);
  }

  if (detections.length === 0) {
    console.log('  No existing brain-memory installations found. Nothing to uninstall.\n');
    return;
  }

  console.log(`  Will remove ${detections.length} installation(s):\n`);
  for (const d of detections) {
    const parts = [];
    if (d.commandsFound) parts.push('commands');
    if (d.promptFound) parts.push('prompt section');
    console.log(`    ${d.runtimeName} (${d.scope}) — ${parts.join(' + ')}`);
  }

  // Confirm unless --yes
  if (!flags.has('yes') && !flags.has('y')) {
    const rl = createRL();
    try {
      console.log('');
      const answer = await ask(rl, '  Proceed? (y/N): ');
      if (answer.trim().toLowerCase() !== 'y') {
        console.log('\n  Cancelled.\n');
        return;
      }
    } finally {
      rl.close();
    }
  }

  console.log('\n  Uninstalling...');
  for (const d of detections) {
    console.log(`\n  Removing ${d.runtimeName} (${d.scope})...`);
    uninstallForRuntime(d.runtime, d.scope);
    console.log('    Done!');
  }

  // Handle .brain/ data
  const brainDir = path.join(os.homedir(), '.brain');
  if (fs.existsSync(brainDir)) {
    if (flags.has('delete-data')) {
      fs.rmSync(brainDir, { recursive: true, force: true });
      console.log('\n  Deleted ~/.brain/ directory.');
    } else if (!flags.has('yes') && !flags.has('y')) {
      const rl = createRL();
      try {
        console.log('');
        const answer = await ask(
          rl,
          '  Delete ~/.brain/ data directory? This removes all memories. (y/N): '
        );
        if (answer.trim().toLowerCase() === 'y') {
          fs.rmSync(brainDir, { recursive: true, force: true });
          console.log('  Deleted ~/.brain/ directory.');
        } else {
          console.log('  Kept ~/.brain/ directory (your memories are preserved).');
        }
      } finally {
        rl.close();
      }
    } else {
      console.log('\n  Kept ~/.brain/ directory (use --delete-data to remove memories).');
    }
  }

  console.log('\n  ✓ Uninstall complete.\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
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

  const { subcommand, flags } = parseArgs(process.argv);

  switch (subcommand) {
    case 'update':
      await runUpdate(flags);
      break;
    case 'uninstall':
      await runUninstall(flags);
      break;
    default:
      await runInstall(flags);
      break;
  }
}

main().catch((err) => {
  console.error('Operation failed:', err.message);
  process.exit(1);
});
