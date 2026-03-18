/**
 * ASCII and Markdown table rendering for benchmark results.
 */

/**
 * Render an ASCII comparison table to the console.
 *
 * @param {Object} results - Full benchmark results object
 */
function renderConsoleTable(results) {
  const { scenario, model, results: agentResults, summary } = results;

  const lines = [];
  lines.push('');
  lines.push(`  Scenario: ${scenario}`);
  lines.push(`  Model:    ${model}`);
  lines.push('');

  // Header
  const agents = Object.keys(agentResults);
  const colWidth = 18;
  const headerCols = ['', 'Tokens', 'Time (ms)', 'Success', 'Consistency'];
  const headerLine = headerCols.map((h) => h.padEnd(colWidth)).join('');
  lines.push(`  ${headerLine}`);
  lines.push(`  ${'─'.repeat(colWidth * headerCols.length)}`);

  // Agent rows
  for (const agent of agents) {
    const data = agentResults[agent];

    // With brain row
    const wb = data.with_brain;
    if (wb) {
      const totalTokens = wb.tokens.input + wb.tokens.output;
      lines.push(`  ${(agent + ' +brain').padEnd(colWidth)}${
        String(totalTokens).padEnd(colWidth)}${
        String(wb.time_ms).padEnd(colWidth)}${
        (wb.success ? 'PASS' : 'FAIL').padEnd(colWidth)}${
        String(wb.consistency)}`);
    }

    // Without brain row
    const wo = data.without_brain;
    if (wo) {
      const totalTokens = wo.tokens.input + wo.tokens.output;
      lines.push(`  ${(agent + ' -brain').padEnd(colWidth)}${
        String(totalTokens).padEnd(colWidth)}${
        String(wo.time_ms).padEnd(colWidth)}${
        (wo.success ? 'PASS' : 'FAIL').padEnd(colWidth)}${
        String(wo.consistency)}`);
    }

    lines.push('');
  }

  // Summary
  if (summary) {
    lines.push(`  ${'─'.repeat(colWidth * headerCols.length)}`);
    lines.push(`  Token reduction:       ${formatDelta(summary.token_reduction_pct)}%`);
    lines.push(`  Success improvement:   ${formatDelta(summary.success_improvement_pct)}%`);
    lines.push(`  Consistency improvement: ${formatDelta(summary.consistency_improvement_pct)}%`);
    lines.push(`  Time reduction:        ${formatDelta(summary.time_reduction_pct)}%`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Render a Markdown table for README inclusion.
 *
 * @param {Object[]} allResults - Array of scenario result objects
 * @returns {string} Markdown content
 */
function renderMarkdownReport(allResults) {
  const lines = [];

  lines.push('# Brain Memory Benchmark Results');
  lines.push('');
  lines.push(`**Date**: ${new Date().toISOString().slice(0, 10)}`);
  if (allResults.length > 0) {
    lines.push(`**Model**: ${allResults[0].model}`);
  }
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Scenario | Token Reduction | Success Improvement | Consistency Improvement |');
  lines.push('|----------|:--------------:|:------------------:|:----------------------:|');

  for (const result of allResults) {
    const s = result.summary || {};
    lines.push(
      `| ${result.scenario} ` +
      `| ${formatDelta(s.token_reduction_pct)}% ` +
      `| ${formatDelta(s.success_improvement_pct)}% ` +
      `| ${formatDelta(s.consistency_improvement_pct)}% |`
    );
  }

  lines.push('');

  // Per-scenario details
  for (const result of allResults) {
    lines.push(`## ${result.scenario}`);
    lines.push('');
    lines.push('| Agent | Variant | Tokens | Time (ms) | Success | Consistency |');
    lines.push('|-------|---------|-------:|----------:|:-------:|:-----------:|');

    for (const [agent, data] of Object.entries(result.results)) {
      for (const variant of ['with_brain', 'without_brain']) {
        const v = data[variant];
        if (!v) continue;
        const totalTokens = v.tokens.input + v.tokens.output;
        const label = variant === 'with_brain' ? '+brain' : '-brain';
        lines.push(
          `| ${agent} | ${label} | ${totalTokens} | ${v.time_ms} | ${v.success ? 'PASS' : 'FAIL'} | ${v.consistency} |`
        );
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format a delta value with sign.
 */
function formatDelta(value) {
  if (value == null) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}

module.exports = { renderConsoleTable, renderMarkdownReport, formatDelta };
