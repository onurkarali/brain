/**
 * Evaluator for Scenario 3: Accumulated Knowledge
 *
 * Checks whether the agent applied accumulated patterns from memory:
 * 1. Connection pooling (pool, release, parameterized queries)
 * 2. Custom error hierarchy (AppError, statusCode, isOperational)
 * 3. Validation middleware (validate, safeParse, Zod)
 * 4. Centralized error handling (next(err))
 * 5. Modular structure (separate db/ and routes/)
 *
 * Without brain: agent has only a bare Express skeleton, no examples.
 * With brain: agent has 5 memories describing each pattern.
 */

const { scorePatterns, evaluateFiles } = require('../../harness/evaluator');

// Patterns that indicate accumulated knowledge was applied
const KNOWLEDGE_PATTERNS = [
  // Connection pooling
  /new\s+Pool|createPool|pg\.Pool|Pool\s*\(/,
  /release|\.end\(\)/,
  /\$\d|\?\s/,                          // Parameterized queries ($1 or ?)

  // Custom error handling
  /class\s+\w*Error\s+extends|AppError|NotFoundError|ValidationError/,
  /statusCode|status_code/,

  // Validation
  /validate|validation|schema/i,
  /safeParse|z\.\w+|Joi\.|yup\./,

  // Centralized error handling
  /next\(err|next\(new\s/,

  // Modular structure
  /require\(['"]\.\.?\/db|require\(['"]\.\.?\/routes/,
  /router\.(get|post|put|delete)\(/,

  // Async patterns
  /async\s/,
];

function evaluate(workDir, outputs, setup) {
  const outputText = outputs.join('\n');
  const patternResult = scorePatterns(outputText, KNOWLEDGE_PATTERNS);

  // Check for generated files — accept flexible paths
  const fileResult = evaluateFiles(workDir, [
    {
      file: 'db/comments.js',
      patterns: [/pool|query|connect/, /\$\d|\?/, /async/],
    },
    {
      file: 'routes/comments.js',
      patterns: [/router|Router/, /async/, /next\(/],
    },
  ]);

  // Also check alternative paths agents might use
  const altFileResult = evaluateFiles(workDir, [
    {
      file: 'src/db/comments.js',
      patterns: [/pool|query/, /async/],
    },
    {
      file: 'src/routes/comments.js',
      patterns: [/router|Router/, /async/],
    },
  ]);

  const bestFileScore = Math.max(fileResult.score, altFileResult.score);
  const anyFileExists = fileResult.files.some((f) => f.exists) || altFileResult.files.some((f) => f.exists);

  const combinedScore = (patternResult.score * 0.4) + (bestFileScore * 0.4) + (anyFileExists ? 0.2 : 0);
  const score = Math.round(Math.max(0, Math.min(1, combinedScore)) * 1000) / 1000;

  return {
    success: score >= 0.4 || anyFileExists,
    consistency: score,
    score,
    details: {
      patterns_matched: patternResult.matched,
      patterns_total: patternResult.total,
      file_score: bestFileScore,
      any_file_exists: anyFileExists,
    },
  };
}

module.exports = { evaluate };
