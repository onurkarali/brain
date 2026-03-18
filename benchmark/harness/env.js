/**
 * Minimal .env loader — zero dependencies.
 *
 * Reads benchmark/.env and returns key-value pairs.
 * Does NOT mutate process.env; the runner passes these
 * explicitly to agent subprocesses via buildAgentEnv.
 */

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

/**
 * Parse a .env file into a plain object.
 * Supports: KEY=VALUE, quoted values, comments, blank lines.
 *
 * @param {string} [filePath] - Path to .env file (default: benchmark/.env)
 * @returns {Object} Parsed key-value pairs
 */
function loadEnv(filePath = ENV_PATH) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) env[key] = value;
  }

  return env;
}

module.exports = { loadEnv };
