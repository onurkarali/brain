/**
 * Claude Code agent adapter.
 *
 * Runs prompts via `claude -p` in headless mode with JSON output.
 * Uses spawn (not execFile) to avoid buffering issues.
 */

const { execFile, spawn } = require('child_process');

const AGENT_NAME = 'claude';

/**
 * Check if Claude Code CLI is installed and accessible.
 * @returns {Promise<boolean>}
 */
function isAvailable() {
  return new Promise((resolve) => {
    execFile('claude', ['--version'], { timeout: 5000 }, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Run a prompt through Claude Code CLI.
 *
 * @param {string} prompt - The prompt text to send
 * @param {Object} options
 * @param {string} options.cwd - Working directory for the agent
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {Object} [options.env] - Additional environment variables
 * @returns {Promise<{output: string, raw: Object, tokens: {input: number, output: number}, time_ms: number}>}
 */
function run(prompt, { cwd, timeout = 300000, env = {} }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'json',
      '--permission-mode', 'bypassPermissions',
      '--model', 'sonnet',
      '--max-turns', '15',
    ];

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let settled = false;

    // env already includes process.env + HOME override from buildAgentEnv
    const proc = spawn('claude', args, {
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
        reject(new Error(`Claude timed out after ${timeout}ms`));
      }
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;

      const time_ms = Date.now() - startTime;

      if (code !== 0 && !stdout) {
        return reject(new Error(`Claude exited with code ${code}\n${stderr}`));
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
        reject(new Error(`Claude failed to start: ${err.message}`));
      }
    });
  });
}

/**
 * Extract token usage from Claude's JSON output.
 * Claude format: { usage: { input_tokens, cache_creation_input_tokens, output_tokens } }
 */
function extractTokens(raw) {
  if (raw && raw.usage) {
    return {
      input: (raw.usage.input_tokens || 0) +
             (raw.usage.cache_creation_input_tokens || 0) +
             (raw.usage.cache_read_input_tokens || 0),
      output: raw.usage.output_tokens || 0,
    };
  }
  return { input: 0, output: 0 };
}

/**
 * Extract the text output from Claude's JSON response.
 */
function extractOutput(raw) {
  if (raw && typeof raw.result === 'string') return raw.result;
  if (raw && raw.result && typeof raw.result.text === 'string') return raw.result.text;
  if (raw && typeof raw.text === 'string') return raw.text;
  return JSON.stringify(raw);
}

module.exports = { name: AGENT_NAME, isAvailable, run };
