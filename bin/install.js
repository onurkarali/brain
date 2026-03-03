#!/usr/bin/env node

const readline = require('readline');
const {
  RUNTIMES,
  installForRuntime,
  initializeBrain,
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
      const config = RUNTIMES[runtime];
      console.log(`\n  Installing for ${config.name} (${scope})...`);
      installForRuntime(runtime, scope);
      console.log(`    Done!`);
    }

    // Initialize .brain if requested
    if (initBrain.trim().toLowerCase() !== 'n') {
      const result = initializeBrain();
      if (result.alreadyExists) {
        console.log('\n    .brain/ already exists, skipping initialization.');
      } else {
        console.log('\n    .brain/ initialized successfully.');
        console.log('');
        console.log('    ☁️  Cloud sync is available! Use /brain:sync login to connect');
        console.log('       Dropbox, Google Drive, or OneDrive for cross-device access.');
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
    /brain:sync          Cloud sync (Dropbox/Google Drive/OneDrive)

  Get started by running /brain:init in your agent session.
    `);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('Installation failed:', err.message);
  process.exit(1);
});
