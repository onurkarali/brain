/**
 * Evaluator for Scenario 1: Multi-Session Continuity
 *
 * Checks if the posts route follows the architectural patterns from memory:
 * async/await, arrow functions, destructuring, centralized error handling,
 * express.Router, modular structure.
 *
 * With brain: agent has memories of the exact architecture decisions.
 * Without brain: agent has only a bare app.js and a minimal placeholder users route.
 * The patterns are NOT visible in the fixtures.
 */

const { scorePatterns, evaluateFiles } = require('../../harness/evaluator');

// Patterns from the memorized architecture decision
const ARCHITECTURE_PATTERNS = [
  /async\s*\(/,                        // Uses async functions
  /await\s/,                           // Uses await keyword
  /const\s+\{.*\}\s*=\s*req\.params/,  // Destructures req.params
  /const\s+\{.*\}\s*=\s*req\.body/,    // Destructures req.body
  /next\(err\)/,                       // Passes errors to next()
  /router\.(get|post|put|delete)\(/,   // Uses express.Router methods
  /module\.exports|export/,            // Exports the module
  /=>\s*\{/,                           // Arrow function syntax
  /express\.Router\(\)/,              // Creates a router instance
];

// Anti-patterns that violate the memorized architecture
const ANTI_PATTERNS = [
  /\.then\(/,                          // Promise chaining instead of await
  /callback/i,                        // Callback pattern
];

function evaluate(workDir, outputs, setup) {
  const fileResult = evaluateFiles(workDir, [
    { file: 'routes/posts.js', patterns: ARCHITECTURE_PATTERNS },
  ]);

  const outputText = outputs.join('\n');
  const patternResult = scorePatterns(outputText, ARCHITECTURE_PATTERNS);

  const antiResult = scorePatterns(outputText, ANTI_PATTERNS);
  const antiPenalty = antiResult.matched * 0.1;

  // File check in alternative paths
  const altFileResult = evaluateFiles(workDir, [
    { file: 'src/routes/posts.js', patterns: ARCHITECTURE_PATTERNS },
  ]);
  const bestFileScore = Math.max(fileResult.score, altFileResult.score);
  const anyFileExists = fileResult.files.some((f) => f.exists) || altFileResult.files.some((f) => f.exists);

  const rawScore = (bestFileScore * 0.5) + (patternResult.score * 0.3) + (anyFileExists ? 0.2 : 0) - antiPenalty;
  const score = Math.max(0, Math.min(1, Math.round(rawScore * 1000) / 1000));

  return {
    success: score >= 0.5 || anyFileExists,
    consistency: score,
    score,
    details: {
      file_score: bestFileScore,
      pattern_score: patternResult.score,
      anti_patterns_found: antiResult.matched,
      any_file_exists: anyFileExists,
    },
  };
}

module.exports = { evaluate };
