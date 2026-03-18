/**
 * Gemini CLI agent adapter.
 *
 * Runs prompts via `gemini -p` in headless mode with JSON output.
 * Uses spawn to avoid buffering issues.
 */

const { execFile, spawn } = require('child_process');

const AGENT_NAME = 'gemini';

function isAvailable() {
  return new Promise((resolve) => {
    execFile('gemini', ['--version'], { timeout: 5000 }, (err) => {
      resolve(!err);
    });
  });
}

function run(prompt, { cwd, timeout = 300000, env = {} }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--yolo',
    ];

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let settled = false;

    const proc = spawn('gemini', args, {
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
        reject(new Error(`Gemini timed out after ${timeout}ms`));
      }
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;

      const time_ms = Date.now() - startTime;

      if (code !== 0 && !stdout) {
        return reject(new Error(`Gemini exited with code ${code}\n${stderr}`));
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
        reject(new Error(`Gemini failed to start: ${err.message}`));
      }
    });
  });
}

/**
 * Extract token usage from Gemini's JSON output.
 * Gemini CLI format: { stats: { models: { <model>: { tokens: { input, candidates } } } } }
 */
function extractTokens(raw) {
  if (raw && raw.stats && raw.stats.models) {
    let input = 0;
    let output = 0;
    for (const model of Object.values(raw.stats.models)) {
      if (model.tokens) {
        input += model.tokens.input || 0;
        output += model.tokens.candidates || 0;
      }
    }
    if (input > 0 || output > 0) return { input, output };
  }
  if (raw && raw.usage) {
    return {
      input: raw.usage.input_tokens || raw.usage.prompt_tokens || 0,
      output: raw.usage.output_tokens || raw.usage.completion_tokens || 0,
    };
  }
  return { input: 0, output: 0 };
}

function extractOutput(raw) {
  if (raw && typeof raw.response === 'string') return raw.response;
  if (raw && typeof raw.text === 'string') return raw.text;
  if (raw && typeof raw.result === 'string') return raw.result;
  return JSON.stringify(raw);
}

module.exports = { name: AGENT_NAME, isAvailable, run };
