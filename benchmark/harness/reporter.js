/**
 * Results reporter — writes benchmark output to JSON, console, and markdown.
 */

const fs = require('fs');
const path = require('path');
const { renderConsoleTable, renderMarkdownReport } = require('./formatter');

const RESULTS_DIR = path.join(__dirname, '..', 'results');

/**
 * Save a single scenario result to a timestamped JSON file.
 *
 * @param {Object} result - Scenario result object
 * @returns {string} Path to the saved file
 */
function saveResult(result) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${result.scenario}_${timestamp}.json`;
  const filePath = path.join(RESULTS_DIR, filename);

  fs.writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n');
  return filePath;
}

/**
 * Save all results to a combined JSON file and markdown report.
 *
 * @param {Object[]} allResults - Array of scenario results
 * @returns {{ jsonPath: string, markdownPath: string }}
 */
function saveAllResults(allResults) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // JSON
  const jsonPath = path.join(RESULTS_DIR, `benchmark_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    model: allResults[0]?.model || 'unknown',
    scenarios: allResults,
  }, null, 2) + '\n');

  // Markdown
  const markdownPath = path.join(RESULTS_DIR, `benchmark_${timestamp}.md`);
  fs.writeFileSync(markdownPath, renderMarkdownReport(allResults));

  return { jsonPath, markdownPath };
}

/**
 * Print results to console.
 *
 * @param {Object} result - Scenario result object
 */
function printResult(result) {
  process.stdout.write(renderConsoleTable(result));
}

/**
 * Print a summary of all scenario results.
 *
 * @param {Object[]} allResults - Array of scenario results
 */
function printSummary(allResults) {
  console.log('\n  ════════════════════════════════════════════');
  console.log('  BENCHMARK SUMMARY');
  console.log('  ════════════════════════════════════════════\n');

  const avgTokenReduction = average(allResults.map((r) => r.summary?.token_reduction_pct).filter(Boolean));
  const avgSuccessImprovement = average(allResults.map((r) => r.summary?.success_improvement_pct).filter(Boolean));
  const avgConsistencyImprovement = average(allResults.map((r) => r.summary?.consistency_improvement_pct).filter(Boolean));

  console.log(`  Scenarios run:              ${allResults.length}`);
  console.log(`  Avg token reduction:        ${avgTokenReduction > 0 ? '+' : ''}${avgTokenReduction}%`);
  console.log(`  Avg success improvement:    ${avgSuccessImprovement > 0 ? '+' : ''}${avgSuccessImprovement}%`);
  console.log(`  Avg consistency improvement: ${avgConsistencyImprovement > 0 ? '+' : ''}${avgConsistencyImprovement}%`);
  console.log('');
}

function average(nums) {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

module.exports = { saveResult, saveAllResults, printResult, printSummary };
