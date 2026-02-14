/**
 * Brain Memory — Index Manager
 *
 * Utilities for reading, updating, and maintaining the .brain/index.json
 * file. Used by hooks and external integrations.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BRAIN_DIR = '.brain';
const INDEX_FILE = 'index.json';
const ASSOCIATIONS_FILE = 'associations.json';
const CONTEXTS_FILE = 'contexts.json';
const REVIEW_QUEUE_FILE = 'review-queue.json';
const ARCHIVE_INDEX_FILE = '_archived/index.json';

/**
 * Resolve the brain directory path.
 *
 * @param {string} [projectRoot] - Project root directory (defaults to cwd)
 * @returns {string} Absolute path to .brain/
 */
function getBrainDir(projectRoot) {
  return path.join(projectRoot || process.cwd(), DEFAULT_BRAIN_DIR);
}

/**
 * Read and parse the brain index.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Parsed index or null if not found
 */
function readIndex(projectRoot) {
  const indexPath = path.join(getBrainDir(projectRoot), INDEX_FILE);
  if (!fs.existsSync(indexPath)) return null;
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

/**
 * Write the brain index back to disk.
 *
 * @param {Object} index - The index object to write
 * @param {string} [projectRoot] - Project root directory
 */
function writeIndex(index, projectRoot) {
  const indexPath = path.join(getBrainDir(projectRoot), INDEX_FILE);
  index.last_updated = new Date().toISOString();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
}

/**
 * Add a memory entry to the index.
 *
 * @param {Object} index - The index object
 * @param {string} id - Memory ID
 * @param {Object} entry - Memory index entry
 * @returns {Object} Updated index
 */
function addMemory(index, id, entry) {
  index.memories[id] = entry;
  index.memory_count = Object.keys(index.memories).length;
  return index;
}

/**
 * Remove a memory entry from the index.
 *
 * @param {Object} index - The index object
 * @param {string} id - Memory ID to remove
 * @returns {Object} Updated index
 */
function removeMemory(index, id) {
  delete index.memories[id];
  index.memory_count = Object.keys(index.memories).length;
  return index;
}

/**
 * Update a memory entry in the index (partial update).
 *
 * @param {Object} index - The index object
 * @param {string} id - Memory ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated index
 */
function updateMemory(index, id, updates) {
  if (index.memories[id]) {
    Object.assign(index.memories[id], updates);
  }
  return index;
}

/**
 * Generate a new memory ID.
 *
 * @returns {string} Memory ID in format mem_YYYYMMDD_<6-hex>
 */
function generateId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const hex = Math.random().toString(16).slice(2, 8);
  return `mem_${date}_${hex}`;
}

/**
 * Read a _meta.json file from a brain subdirectory.
 *
 * @param {string} categoryPath - Relative path within .brain/
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Parsed meta or null
 */
function readMeta(categoryPath, projectRoot) {
  const metaPath = path.join(getBrainDir(projectRoot), categoryPath, '_meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

/**
 * Write a _meta.json file to a brain subdirectory.
 *
 * @param {string} categoryPath - Relative path within .brain/
 * @param {Object} meta - Meta object to write
 * @param {string} [projectRoot] - Project root directory
 */
function writeMeta(categoryPath, meta, projectRoot) {
  const metaPath = path.join(getBrainDir(projectRoot), categoryPath, '_meta.json');
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
}

/**
 * Get all memories grouped by category.
 *
 * @param {Object} index - The index object
 * @returns {Object} Map of category => [memory entries]
 */
function groupByCategory(index) {
  const groups = {};
  for (const [id, entry] of Object.entries(index.memories)) {
    const category = entry.path.split('/')[0];
    if (!groups[category]) groups[category] = [];
    groups[category].push({ id, ...entry });
  }
  return groups;
}

// --- Associations (Phase 1: Associative Network) ---

/**
 * Read the associations graph.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Parsed associations or null
 */
function readAssociations(projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), ASSOCIATIONS_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Write the associations graph to disk.
 *
 * @param {Object} associations - The associations object
 * @param {string} [projectRoot] - Project root directory
 */
function writeAssociations(associations, projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), ASSOCIATIONS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(associations, null, 2) + '\n');
}

/**
 * Reinforce (or create) an edge between two memories.
 *
 * @param {Object} associations - The associations object
 * @param {string} idA - First memory ID
 * @param {string} idB - Second memory ID
 * @param {string} origin - Origin type (manual, tag_overlap, co_retrieval, propagation, creative)
 * @param {number} [initialWeight=0.20] - Weight for new edges
 * @returns {Object} Updated associations
 */
function reinforceEdge(associations, idA, idB, origin, initialWeight = 0.20) {
  if (idA === idB) return associations;
  if (!associations.edges) associations.edges = {};

  // Ensure bidirectional entries
  for (const [src, dst] of [[idA, idB], [idB, idA]]) {
    if (!associations.edges[src]) associations.edges[src] = {};
    const edge = associations.edges[src][dst];
    if (edge) {
      // Hebbian reinforcement: new_weight = min(1.0, weight + 0.10 * (1.0 - weight))
      edge.weight = Math.min(1.0, edge.weight + 0.10 * (1.0 - edge.weight));
      edge.co_retrievals = (edge.co_retrievals || 0) + 1;
      edge.last_activated = new Date().toISOString();
    } else {
      associations.edges[src][dst] = {
        weight: initialWeight,
        co_retrievals: 0,
        last_activated: new Date().toISOString(),
        origin: origin,
      };
    }
  }
  return associations;
}

/**
 * Get all neighbors of a memory with their edge weights.
 *
 * @param {Object} associations - The associations object
 * @param {string} id - Memory ID
 * @returns {Object[]} Array of {id, weight, co_retrievals, last_activated, origin}
 */
function getNeighbors(associations, id) {
  if (!associations || !associations.edges || !associations.edges[id]) return [];
  return Object.entries(associations.edges[id]).map(([neighborId, edge]) => ({
    id: neighborId,
    ...edge,
  }));
}

/**
 * Apply time-based decay to all association weights and prune weak links.
 *
 * @param {Object} associations - The associations object
 * @param {number} [decayBase=0.998] - Daily decay base
 * @param {number} [pruneThreshold=0.05] - Prune links below this weight
 * @returns {Object} Updated associations with decayed/pruned edges
 */
function decayAssociations(associations, decayBase = 0.998, pruneThreshold = 0.05) {
  if (!associations || !associations.edges) return associations;
  const now = new Date();

  for (const srcId of Object.keys(associations.edges)) {
    for (const dstId of Object.keys(associations.edges[srcId])) {
      const edge = associations.edges[srcId][dstId];
      const lastActivated = new Date(edge.last_activated);
      const daysSince = (now - lastActivated) / (1000 * 60 * 60 * 24);
      edge.weight = edge.weight * Math.pow(decayBase, daysSince);

      if (edge.weight < pruneThreshold) {
        delete associations.edges[srcId][dstId];
      }
    }
    // Clean up empty neighbor maps
    if (Object.keys(associations.edges[srcId]).length === 0) {
      delete associations.edges[srcId];
    }
  }
  return associations;
}

// --- Contexts (Phase 2: Context-Dependent Memory) ---

/**
 * Read the contexts file.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Parsed contexts or null
 */
function readContexts(projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), CONTEXTS_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Write the contexts file to disk.
 *
 * @param {Object} contexts - The contexts object
 * @param {string} [projectRoot] - Project root directory
 */
function writeContexts(contexts, projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), CONTEXTS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(contexts, null, 2) + '\n');
}

// --- Review Queue (Phase 4: Spaced Repetition) ---

/**
 * Read the review queue.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Parsed review queue or null
 */
function readReviewQueue(projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), REVIEW_QUEUE_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Write the review queue to disk.
 *
 * @param {Object} queue - The review queue object
 * @param {string} [projectRoot] - Project root directory
 */
function writeReviewQueue(queue, projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), REVIEW_QUEUE_FILE);
  fs.writeFileSync(filePath, JSON.stringify(queue, null, 2) + '\n');
}

// --- Archive Index (Phase 4: Archive Search) ---

/**
 * Read the archive index.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {Object|null} Parsed archive index or null
 */
function readArchiveIndex(projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), ARCHIVE_INDEX_FILE);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Write the archive index to disk.
 *
 * @param {Object} archiveIndex - The archive index object
 * @param {string} [projectRoot] - Project root directory
 */
function writeArchiveIndex(archiveIndex, projectRoot) {
  const filePath = path.join(getBrainDir(projectRoot), ARCHIVE_INDEX_FILE);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(archiveIndex, null, 2) + '\n');
}

module.exports = {
  getBrainDir,
  readIndex,
  writeIndex,
  addMemory,
  removeMemory,
  updateMemory,
  generateId,
  readMeta,
  writeMeta,
  groupByCategory,
  // Phase 1: Associative Network
  readAssociations,
  writeAssociations,
  reinforceEdge,
  getNeighbors,
  decayAssociations,
  // Phase 2: Context-Dependent Memory
  readContexts,
  writeContexts,
  // Phase 4: Spaced Repetition & Archive
  readReviewQueue,
  writeReviewQueue,
  readArchiveIndex,
  writeArchiveIndex,
};
