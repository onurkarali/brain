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
};
