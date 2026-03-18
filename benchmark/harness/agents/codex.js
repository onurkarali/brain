/**
 * Codex CLI agent adapter.
 *
 * Runs prompts via `codex exec` in headless mode with JSON output.
 * Uses spawn to avoid buffering issues.
 */

const { execFile, spawn } = require('child_process');

const AGENT_NAME = 'codex';

function isAvailable() {
  return new Promise((resolve) => {
    execFile('codex', ['--version'], { timeout: 5000 }, (err) => {
      resolve(!err);
    });
  });
}

function run(prompt, { cwd, timeout = 300000, env = {} }) {
  return new Promise((resolve, reject) => {
    const args = [
      'exec', prompt,
      '--json',
      '--full-auto',
      '--skip-git-repo-check',
    ];

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let settled = false;

    const proc = spawn('codex', args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: env && env.HOME ? env : { ...process.env, ...env },
    });

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill();
        reject(new Error(`Codex timed out after ${timeout}ms`));
      }
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;

      const time_ms = Date.now() - startTime;

      if (code !== 0 && !stdout) {
        return reject(new Error(`Codex exited with code ${code}\n${stderr}`));
      }

      try {
        const raw = JSON.parse(stdout);
        const tokens = extractTokens(raw);
        const output = extractOutput(raw);
        resolve({ output, raw, tokens, time_ms });
      } catch (parseErr) {
        resolve({
          output: stdout.trim(),
          raw: { stdout, stderr },
          tokens: { input: 0, output: 0 },
          time_ms,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(new Error(`Codex failed to start: ${err.message}`));
      }
    });
  });
}

function extractTokens(raw) {
  if (raw && raw.usage) {
    return {
      input: raw.usage.prompt_tokens || raw.usage.input_tokens || 0,
      output: raw.usage.completion_tokens || raw.usage.output_tokens || 0,
    };
  }
  return { input: 0, output: 0 };
}

function extractOutput(raw) {
  if (raw && typeof raw.output === 'string') return raw.output;
  if (raw && typeof raw.result === 'string') return raw.result;
  if (raw && raw.choices && raw.choices[0]) {
    const msg = raw.choices[0].message || raw.choices[0];
    return msg.content || msg.text || '';
  }
  return JSON.stringify(raw);
}

module.exports = { name: AGENT_NAME, isAvailable, run };
