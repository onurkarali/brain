/**
 * Evaluator for Scenario 5: Preference Retention
 *
 * Checks whether the agent automatically applied all memorized preferences:
 * 1. Functional style (map/filter/reduce, no for loops)
 * 2. Immutable data (Object.freeze, spread, const)
 * 3. Factory functions (no classes)
 * 4. Result pattern for errors ({ ok, data/error })
 * 5. Naming conventions (verb phrases, no abbreviations)
 */

const { scorePatterns, evaluateFiles } = require('../../harness/evaluator');

// Patterns indicating preference compliance
const PREFERENCE_PATTERNS = [
  // Functional style
  /\.map\(/,                           // Uses map
  /\.filter\(/,                        // Uses filter
  /\.reduce\(/,                        // Uses reduce
  /=>/,                                // Arrow functions

  // Immutable data
  /Object\.freeze/,                    // Freezes objects
  /\.\.\./,                            // Spread operator
  /^const\s/m,                         // Uses const

  // No classes, factory functions
  /const\s+(create|make|build)\w+\s*=/,  // Factory function pattern

  // Result pattern
  /ok:\s*(true|false)/,               // Result pattern
  /\{\s*ok:\s*true,\s*data/,          // Success result
  /\{\s*ok:\s*false,\s*error/,        // Error result

  // Naming conventions
  /validate\w+|parse\w+|transform\w+|filter\w+/i,  // Verb phrases
];

// Anti-patterns that violate preferences
const ANTI_PATTERNS = [
  /\bclass\s+\w+/,                    // Classes (should use factories)
  /\bfor\s*\(/,                        // For loops (should use map/filter)
  /\bwhile\s*\(/,                      // While loops
  /\blet\s/,                           // let (should use const)
  /\bvar\s/,                           // var
  /\.forEach\(/,                       // forEach (prefer map/filter)
  /catch\s*\(\w*\)\s*\{\s*\}/,        // Empty catch blocks
];

function evaluate(workDir, outputs, setup) {
  const outputText = outputs.join('\n');

  // Check preferences in output
  const prefResult = scorePatterns(outputText, PREFERENCE_PATTERNS);

  // Check anti-patterns
  const antiResult = scorePatterns(outputText, ANTI_PATTERNS);
  const antiPenalty = antiResult.matched * 0.1;

  // Check generated file
  const fileResult = evaluateFiles(workDir, [
    {
      file: 'pipeline.js',
      patterns: PREFERENCE_PATTERNS,
    },
  ]);

  // Check anti-patterns in file
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(workDir, 'pipeline.js');
  let fileAntiCount = 0;
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const p of ANTI_PATTERNS) {
      if (p.test(content)) fileAntiCount++;
    }
  }
  const fileAntiPenalty = fileAntiCount * 0.1;

  const rawScore = (prefResult.score * 0.3) + (fileResult.score * 0.5) + (0.2) - antiPenalty - fileAntiPenalty;
  const score = Math.round(Math.max(0, Math.min(1, rawScore)) * 1000) / 1000;

  return {
    success: score >= 0.5,
    consistency: score,
    score,
    details: {
      preference_compliance: prefResult.score,
      anti_patterns_in_output: antiResult.matched,
      file_evaluation: fileResult,
      anti_patterns_in_file: fileAntiCount,
    },
  };
}

module.exports = { evaluate };
