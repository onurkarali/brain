/**
 * Output evaluation — determines success/failure and consistency scores.
 *
 * Uses regex-based pattern matching (no AST parser needed).
 * Each scenario provides its own evaluate.js with specific checks;
 * this module provides shared evaluation primitives.
 */

/**
 * Check if output contains a pattern (string or regex).
 *
 * @param {string} output - The agent's output text
 * @param {string|RegExp} pattern - Pattern to match
 * @returns {boolean}
 */
function containsPattern(output, pattern) {
  if (typeof pattern === 'string') {
    return output.includes(pattern);
  }
  return pattern.test(output);
}

/**
 * Score how many required patterns are present in the output.
 *
 * @param {string} output - The agent's output text
 * @param {Array<string|RegExp>} patterns - Required patterns
 * @returns {{ score: number, matched: number, total: number, details: Object[] }}
 */
function scorePatterns(output, patterns) {
  const details = patterns.map((pattern) => {
    const matched = containsPattern(output, pattern);
    return {
      pattern: pattern instanceof RegExp ? pattern.source : pattern,
      matched,
    };
  });

  const matched = details.filter((d) => d.matched).length;
  const score = patterns.length > 0 ? matched / patterns.length : 1;

  return { score: Math.round(score * 1000) / 1000, matched, total: patterns.length, details };
}

/**
 * Compute pairwise consistency between multiple outputs.
 * Uses Jaccard similarity on extracted code patterns.
 *
 * @param {string[]} outputs - Array of output texts from different agents/runs
 * @param {Array<string|RegExp>} patterns - Patterns to check for consistency
 * @returns {{ score: number, matrix: number[][] }}
 */
function computeConsistency(outputs, patterns) {
  if (outputs.length < 2) return { score: 1.0, matrix: [[1.0]] };

  // Extract pattern presence vectors
  const vectors = outputs.map((output) =>
    patterns.map((pattern) => containsPattern(output, pattern) ? 1 : 0)
  );

  // Compute pairwise Jaccard similarity
  const n = outputs.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const pairScores = [];

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      const sim = jaccard(vectors[i], vectors[j]);
      matrix[i][j] = sim;
      matrix[j][i] = sim;
      pairScores.push(sim);
    }
  }

  const avgScore = pairScores.length > 0
    ? pairScores.reduce((a, b) => a + b, 0) / pairScores.length
    : 1.0;

  return {
    score: Math.round(avgScore * 1000) / 1000,
    matrix,
  };
}

/**
 * Jaccard similarity between two binary vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function jaccard(a, b) {
  let intersection = 0;
  let union = 0;

  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) union++;
    if (a[i] && b[i]) intersection++;
  }

  return union > 0 ? intersection / union : 1.0;
}

/**
 * Check if generated code files exist and match expected patterns.
 *
 * @param {string} workDir - Workspace directory to check
 * @param {Object[]} expectedFiles - Array of { path, patterns }
 * @returns {{ success: boolean, score: number, files: Object[] }}
 */
function evaluateFiles(workDir, expectedFiles) {
  const fs = require('fs');
  const path = require('path');

  const fileResults = expectedFiles.map(({ file, patterns: filePatterns }) => {
    const filePath = path.join(workDir, file);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      return { file, exists, score: 0, matched: 0, total: filePatterns.length };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const result = scorePatterns(content, filePatterns);

    return { file, exists, ...result };
  });

  const totalScore = fileResults.reduce((sum, f) => sum + f.score, 0);
  const avgScore = fileResults.length > 0 ? totalScore / fileResults.length : 0;
  const allExist = fileResults.every((f) => f.exists);

  return {
    success: allExist && avgScore >= 0.7,
    score: Math.round(avgScore * 1000) / 1000,
    files: fileResults,
  };
}

module.exports = {
  containsPattern,
  scorePatterns,
  computeConsistency,
  evaluateFiles,
  jaccard,
};
