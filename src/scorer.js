/**
 * Brain Memory — Scoring Utilities
 *
 * Computes effective memory strength after decay, relevance scoring,
 * and composite recall scores. Used by hooks and can be imported
 * by external tools.
 */

/**
 * Compute the effective (decayed) strength of a memory.
 *
 * @param {number} baseStrength - Original strength (0.0-1.0)
 * @param {number} decayRate - Daily decay factor (e.g., 0.995)
 * @param {string|Date} lastAccessed - ISO timestamp of last access
 * @returns {number} Effective strength after decay
 */
function computeDecayedStrength(baseStrength, decayRate, lastAccessed) {
  const lastDate = new Date(lastAccessed);
  const now = new Date();
  const daysElapsed = (now - lastDate) / (1000 * 60 * 60 * 24);
  return baseStrength * Math.pow(decayRate, daysElapsed);
}

/**
 * Compute recency bonus — linear decay over one year.
 *
 * @param {string|Date} lastAccessed - ISO timestamp of last access
 * @returns {number} Recency bonus (0.0-1.0)
 */
function computeRecencyBonus(lastAccessed) {
  const lastDate = new Date(lastAccessed);
  const now = new Date();
  const daysElapsed = (now - lastDate) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - daysElapsed / 365);
}

/**
 * Compute the composite recall score for a memory.
 *
 * @param {number} relevance - Query relevance (0.0-1.0)
 * @param {number} decayedStrength - Effective strength after decay
 * @param {number} recencyBonus - Recency bonus
 * @returns {number} Composite score
 */
function computeRecallScore(relevance, decayedStrength, recencyBonus) {
  return 0.55 * relevance + 0.30 * decayedStrength + 0.15 * recencyBonus;
}

/**
 * Compute the reinforced strength after a recall event.
 *
 * @param {number} currentStrength - Current base strength
 * @param {number} boost - Strength boost per recall (default: 0.05)
 * @returns {number} New base strength (capped at 1.0)
 */
function reinforceStrength(currentStrength, boost = 0.05) {
  return Math.min(1.0, currentStrength + boost);
}

/**
 * Compute consolidated strength from multiple source memories.
 *
 * @param {number[]} sourceStrengths - Strengths of source memories
 * @returns {number} Consolidated strength (capped at 1.0)
 */
function computeConsolidatedStrength(sourceStrengths) {
  const maxStrength = Math.max(...sourceStrengths);
  return Math.min(1.0, maxStrength + 0.15);
}

/**
 * Score and rank a list of memory entries for a given query.
 *
 * @param {Object[]} memories - Array of memory index entries
 * @param {Function} relevanceFn - Function(memory) => relevance score (0.0-1.0)
 * @returns {Object[]} Scored and sorted memories (highest first)
 */
function rankMemories(memories, relevanceFn) {
  return memories
    .map((mem) => {
      const decayedStrength = computeDecayedStrength(
        mem.strength,
        mem.decay_rate,
        mem.last_accessed
      );
      const recencyBonus = computeRecencyBonus(mem.last_accessed);
      const relevance = relevanceFn(mem);
      const score = computeRecallScore(relevance, decayedStrength, recencyBonus);

      return {
        ...mem,
        decayed_strength: Math.round(decayedStrength * 1000) / 1000,
        recency_bonus: Math.round(recencyBonus * 1000) / 1000,
        relevance: Math.round(relevance * 1000) / 1000,
        score: Math.round(score * 1000) / 1000,
      };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  computeDecayedStrength,
  computeRecencyBonus,
  computeRecallScore,
  reinforceStrength,
  computeConsolidatedStrength,
  rankMemories,
};
