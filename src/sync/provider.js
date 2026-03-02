/**
 * Brain Memory — Sync Provider Base Class & Factory
 *
 * Unified interface for cloud storage providers.
 * All paths are relative to the brain root (e.g. 'index.json', 'professional/skills/ts.md').
 */

/**
 * Abstract base class for sync providers.
 * Each provider translates relative brain paths to its own addressing model.
 */
class SyncProvider {
  /**
   * @param {Object} config
   * @param {string} config.accessToken - OAuth access token
   * @param {Object} [config.options] - Provider-specific options
   */
  constructor(config) {
    if (new.target === SyncProvider) {
      throw new Error('SyncProvider is abstract and cannot be instantiated directly');
    }
    this.accessToken = config.accessToken;
    this.options = config.options || {};
  }

  /**
   * List all files in the remote brain folder.
   *
   * @param {string|null} cursor - Pagination/delta cursor from previous call, or null for full listing
   * @returns {Promise<{files: Array<{path: string, rev: string, hash: string, modified: string, size: number}>, cursor: string, hasMore: boolean}>}
   */
  async listFiles(_cursor) {
    throw new Error('listFiles() not implemented');
  }

  /**
   * Download a single file.
   *
   * @param {string} remotePath - Relative path (e.g. 'index.json')
   * @returns {Promise<{content: Buffer, rev: string, hash: string}>}
   */
  async downloadFile(_remotePath) {
    throw new Error('downloadFile() not implemented');
  }

  /**
   * Upload a single file. Uses rev for optimistic concurrency (409 = conflict).
   *
   * @param {string} remotePath - Relative path
   * @param {Buffer} content - File content
   * @param {Object} [options]
   * @param {string} [options.rev] - Expected revision for conditional write
   * @param {string} [options.mode] - 'add' for new files, 'update' for existing
   * @returns {Promise<{rev: string, hash: string}>}
   */
  async uploadFile(_remotePath, _content, _options) {
    throw new Error('uploadFile() not implemented');
  }

  /**
   * Delete a single file.
   *
   * @param {string} remotePath - Relative path
   * @returns {Promise<{success: boolean}>}
   */
  async deleteFile(_remotePath) {
    throw new Error('deleteFile() not implemented');
  }

  /**
   * Get metadata for a single file.
   *
   * @param {string} remotePath - Relative path
   * @returns {Promise<{rev: string, hash: string, modified: string, size: number}|null>}
   */
  async getFileMetadata(_remotePath) {
    throw new Error('getFileMetadata() not implemented');
  }

  /**
   * Create a folder (some providers require explicit creation).
   *
   * @param {string} remotePath - Relative folder path
   * @returns {Promise<void>}
   */
  async createFolder(_remotePath) {
    // Default no-op — providers that need explicit folder creation override this
  }

  /**
   * Test the connection and return account info.
   *
   * @returns {Promise<{ok: boolean, account: string}>}
   */
  async testConnection() {
    throw new Error('testConnection() not implemented');
  }

  /**
   * Refresh auth tokens if needed. Called before operations.
   */
  async refreshAuth() {
    // Default no-op — subclasses override if needed
  }

  /**
   * Compute a provider-specific content hash for a buffer.
   * Used to compare local and remote file content.
   *
   * @param {Buffer} buffer - File content
   * @returns {string} Hash string
   */
  computeContentHash(_buffer) {
    throw new Error('computeContentHash() not implemented');
  }
}

/**
 * Factory function to create a provider instance.
 *
 * @param {string} name - Provider name: 'dropbox', 'google-drive', 'onedrive'
 * @param {Object} config - Provider configuration (accessToken, options)
 * @returns {SyncProvider} Provider instance
 */
function createProvider(name, config) {
  switch (name) {
    case 'dropbox': {
      const { DropboxProvider } = require('./providers/dropbox');
      return new DropboxProvider(config);
    }
    case 'google-drive': {
      const { GoogleDriveProvider } = require('./providers/google-drive');
      return new GoogleDriveProvider(config);
    }
    case 'onedrive': {
      const { OneDriveProvider } = require('./providers/onedrive');
      return new OneDriveProvider(config);
    }
    default:
      throw new Error(`Unknown sync provider: ${name}`);
  }
}

module.exports = { SyncProvider, createProvider };
