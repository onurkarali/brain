/**
 * Evaluator for Scenario 4: Error Pattern Learning
 *
 * Checks whether the agent:
 * 1. Correctly identified the race condition (understanding)
 * 2. Fixed BOTH processAll and processInBatches (completeness)
 * 3. Used the right fix pattern — map return values, not shared push (quality)
 *
 * With brain: agent has a memory of debugging an identical race condition,
 * including the exact fix pattern. Should identify it faster and fix completely.
 *
 * Without brain: agent must discover the issue from scratch by reading the code.
 */

const { scorePatterns, evaluateFiles } = require('../../harness/evaluator');

// Patterns indicating correct understanding of the root cause
const UNDERSTANDING_PATTERNS = [
  /race\s*condition/i,
  /shared\s*(state|mutation|array|variable)/i,
  /concurrent|parallel.*push|push.*concurrent/i,
  /not\s*(atomic|thread.?safe)|atomic/i,
  /mutate|mutation/i,
];

// Patterns indicating the correct fix was applied
const FIX_PATTERNS = [
  /const\s+\w+\s*=\s*await\s+Promise\.all\(/,    // Capture Promise.all return
  /return\s+(await\s+)?processItem/,               // Return from map callback
  /\.map\(async\s*\(.*\)\s*=>\s*\{?\s*(return|await)/, // Proper map with return
];

// Patterns indicating BOTH functions were fixed (completeness)
const COMPLETENESS_PATTERNS = [
  /processAll/,
  /processInBatches|processBatch/i,
];

// Bug patterns that should be REMOVED from the fixed file
const BUG_PATTERNS = [
  /results\.push\(processed\)/,
  /batchResults\.push\(result\)/,
];

function evaluate(workDir, outputs, setup) {
  const outputText = outputs.join('\n');

  const understanding = scorePatterns(outputText, UNDERSTANDING_PATTERNS);
  const fixResult = scorePatterns(outputText, FIX_PATTERNS);
  const completeness = scorePatterns(outputText, COMPLETENESS_PATTERNS);

  // Check the fixed file
  const fileResult = evaluateFiles(workDir, [
    {
      file: 'processor.js',
      patterns: [
        /const\s+\w+\s*=\s*await\s+Promise\.all\(/,
        /return/,
        /async/,
        /processAll/,
        /processInBatches|processBatch/i,
      ],
    },
  ]);

  // Penalty for bug patterns still present in file
  const fs = require('fs');
  const path = require('path');
  const fixedPath = path.join(workDir, 'processor.js');
  let bugStillPresent = 0;
  if (fs.existsSync(fixedPath)) {
    const content = fs.readFileSync(fixedPath, 'utf-8');
    for (const pattern of BUG_PATTERNS) {
      if (pattern.test(content)) bugStillPresent++;
    }
  }
  const bugPenalty = bugStillPresent * 0.15;

  // Weighted: understanding (30%) + fix quality (25%) + completeness (15%) + file (30%) - bug penalty
  const rawScore = (understanding.score * 0.3) + (fixResult.score * 0.25) +
                   (completeness.score * 0.15) + (fileResult.score * 0.3) - bugPenalty;
  const score = Math.round(Math.max(0, Math.min(1, rawScore)) * 1000) / 1000;

  return {
    success: score >= 0.4,
    consistency: score,
    score,
    details: {
      understanding: understanding.score,
      fix_quality: fixResult.score,
      completeness: completeness.score,
      file_score: fileResult.score,
      bug_still_present: bugStillPresent,
    },
  };
}

module.exports = { evaluate };
