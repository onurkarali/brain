/**
 * Evaluator for Scenario 2: Cross-Agent Consistency
 *
 * Measures whether agents follow the memorized TypeScript style guide.
 * Patterns are broadened to accept both TypeScript and JavaScript output,
 * since agents may produce .ts or .js depending on their interpretation.
 */

const { scorePatterns, computeConsistency, evaluateFiles } = require('../../harness/evaluator');

// Broadened patterns that work for both TS and JS output
const CONSISTENCY_PATTERNS = [
  /interface\s+\w+|type\s+\w+\s*=/,    // Type definitions (interface preferred, type accepted)
  /enum\s+\w+|const\s+\w+\s*=\s*\{/,   // Enums or const objects for fixed sets
  /z\.\w+|zod|schema/i,                 // Zod usage (import, schema, z.xxx)
  /class\s+\w+Service/,                 // Service class pattern
  /async\s/,                            // Async methods
  /export\s|module\.exports/,           // Exports (TS or CJS)
  /create|find|delete/i,               // CRUD method names present
  /private\s|readonly\s|#\w+/,         // Encapsulation (TS private, readonly, or JS #private)
  /\bstring\b|\bnumber\b|\bunknown\b/, // Type annotations used
  /Promise</,                           // Returns Promises (typed)
];

// Patterns specifically rewarded (style guide compliance)
const STYLE_BONUS_PATTERNS = [
  /interface\s+\w+/,                    // interface over type (preferred)
  /enum\s+\w+/,                         // Real enum (preferred)
  /readonly\s/,                         // readonly properties (preferred)
  /unknown/,                            // unknown over any (preferred)
];

/**
 * @param {string} workDir - Workspace directory
 * @param {string[]} outputs - Raw outputs from test prompts
 * @param {Object} setup - Scenario setup
 * @returns {{ success: boolean, consistency: number, score: number, details: Object }}
 */
function evaluate(workDir, outputs, setup) {
  // Check generated file (agents may write .ts or .js)
  const fileResult = evaluateFiles(workDir, [
    {
      file: 'src/user-service.ts',
      patterns: CONSISTENCY_PATTERNS,
    },
    {
      file: 'src/user-service.js',
      patterns: CONSISTENCY_PATTERNS,
    },
  ]);

  // At least one file should exist
  const bestFileScore = Math.max(...fileResult.files.map((f) => f.exists ? f.score : 0), 0);
  const anyFileExists = fileResult.files.some((f) => f.exists);

  // Score outputs against broadened patterns
  const patternScores = outputs.map((output) =>
    scorePatterns(output, CONSISTENCY_PATTERNS)
  );
  const avgPatternScore = patternScores.reduce((s, p) => s + p.score, 0) / Math.max(1, patternScores.length);

  // Bonus for strict style guide compliance
  const bonusScores = outputs.map((output) =>
    scorePatterns(output, STYLE_BONUS_PATTERNS)
  );
  const avgBonus = bonusScores.reduce((s, p) => s + p.score, 0) / Math.max(1, bonusScores.length);

  // Compute pairwise consistency across outputs
  const consistency = computeConsistency(outputs, CONSISTENCY_PATTERNS);

  // Combined score: files (40%) + output patterns (30%) + style bonus (10%) + consistency (20%)
  const rawScore = (bestFileScore * 0.4) + (avgPatternScore * 0.3) + (avgBonus * 0.1) + (consistency.score * 0.2);
  const score = Math.round(Math.max(0, Math.min(1, rawScore)) * 1000) / 1000;

  return {
    success: score >= 0.4 || anyFileExists,
    consistency: consistency.score,
    score,
    details: {
      file_evaluation: fileResult,
      best_file_score: bestFileScore,
      pattern_scores: patternScores.map((p) => p.score),
      avg_pattern_score: Math.round(avgPatternScore * 1000) / 1000,
      style_bonus: Math.round(avgBonus * 1000) / 1000,
      pairwise_matrix: consistency.matrix,
    },
  };
}

module.exports = { evaluate };
