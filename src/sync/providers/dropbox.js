/**
 * Brain Memory — Dropbox Sync Provider
 *
 * Dropbox API v2 integration using App Folder permissions.
 * Paths are relative to /Apps/BrainMemory/ but API treats them as root.
 */

const crypto = require('crypto');
const { SyncProvider } = require('../provider');

const API_BASE = 'https://api.dropboxapi.com/2';
const CONTENT_BASE = 'https://content.dropboxapi.com/2';

// Dropbox content hash block size: 4 MB
const BLOCK_SIZE = 4 * 1024 * 1024;

class DropboxProvider extends SyncProvider {
  constructor(config) {
    super(config);
  }

  /**
   * Compute Dropbox content hash.
   * Algorithm: split into 4MB blocks, SHA-256 each block,
   * concatenate block hashes, SHA-256 the result.
   *
   * @param {Buffer} buffer - File content
   * @returns {string} Hex-encoded content hash
   */
  computeContentHash(buffer) {
    return computeDropboxHash(buffer);
  }

  async listFiles(cursor) {
    if (cursor) {
      return this._listContinue(cursor);
    }
    return this._listFolder();
  }

  async _listFolder() {
    const response = await fetch(`${API_BASE}/files/list_folder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '',
        recursive: true,
        include_deleted: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dropbox list_folder failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return this._parseListResponse(data);
  }

  async _listContinue(cursor) {
    const response = await fetch(`${API_BASE}/files/list_folder/continue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cursor }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dropbox list_folder/continue failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return this._parseListResponse(data);
  }

  _parseListResponse(data) {
    const files = data.entries
      .filter((e) => e['.tag'] === 'file')
      .map((e) => ({
        path: e.path_display.replace(/^\//, ''), // Remove leading slash
        rev: e.rev,
        hash: e.content_hash,
        modified: e.server_modified,
        size: e.size,
      }));

    return {
      files,
      cursor: data.cursor,
      hasMore: data.has_more,
    };
  }

  async downloadFile(remotePath) {
    const apiArg = JSON.stringify({ path: `/${remotePath}` });

    const response = await fetch(`${CONTENT_BASE}/files/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Dropbox-API-Arg': apiArg,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dropbox download failed (${response.status}): ${text}`);
    }

    const resultHeader = response.headers.get('Dropbox-API-Result');
    const metadata = resultHeader ? JSON.parse(resultHeader) : {};
    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      content: buffer,
      rev: metadata.rev,
      hash: metadata.content_hash,
    };
  }

  async uploadFile(remotePath, content, options = {}) {
    const { rev, mode = 'add' } = options;

    let uploadMode;
    if (mode === 'update' && rev) {
      uploadMode = { '.tag': 'update', update: rev };
    } else if (mode === 'overwrite') {
      uploadMode = { '.tag': 'overwrite' };
    } else {
      uploadMode = { '.tag': 'add' };
    }

    const apiArg = JSON.stringify({
      path: `/${remotePath}`,
      mode: uploadMode,
      autorename: false,
      mute: true,
    });

    const response = await fetch(`${CONTENT_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Dropbox-API-Arg': apiArg,
        'Content-Type': 'application/octet-stream',
      },
      body: content,
    });

    if (response.status === 409) {
      const text = await response.text();
      const err = new Error(`Conflict: file was modified remotely`);
      err.code = 'CONFLICT';
      err.details = text;
      throw err;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dropbox upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return {
      rev: data.rev,
      hash: data.content_hash,
    };
  }

  async deleteFile(remotePath) {
    const response = await fetch(`${API_BASE}/files/delete_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: `/${remotePath}` }),
    });

    if (!response.ok) {
      const text = await response.text();
      // 409 with path/not_found is OK — file already deleted
      if (response.status === 409 && text.includes('not_found')) {
        return { success: true };
      }
      throw new Error(`Dropbox delete failed (${response.status}): ${text}`);
    }

    return { success: true };
  }

  async getFileMetadata(remotePath) {
    const response = await fetch(`${API_BASE}/files/get_metadata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: `/${remotePath}` }),
    });

    if (!response.ok) {
      if (response.status === 409) return null; // Not found
      const text = await response.text();
      throw new Error(`Dropbox get_metadata failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    if (data['.tag'] !== 'file') return null;

    return {
      rev: data.rev,
      hash: data.content_hash,
      modified: data.server_modified,
      size: data.size,
    };
  }

  async createFolder(remotePath) {
    const response = await fetch(`${API_BASE}/files/create_folder_v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: `/${remotePath}`, autorename: false }),
    });

    // 409 with path/conflict means folder already exists — that's fine
    if (response.status === 409) return;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dropbox create_folder failed (${response.status}): ${text}`);
    }
  }

  async testConnection() {
    const response = await fetch(`${API_BASE}/users/get_current_account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      return { ok: false, account: null };
    }

    const data = await response.json();
    return {
      ok: true,
      account: data.email || data.name?.display_name || 'Unknown',
    };
  }
}

/**
 * Compute Dropbox content hash for a buffer (exported for testing).
 *
 * @param {Buffer} buffer - File content
 * @returns {string} Hex-encoded content hash
 */
function computeDropboxHash(buffer) {
  const blockHashes = [];
  for (let offset = 0; offset < buffer.length; offset += BLOCK_SIZE) {
    const end = Math.min(offset + BLOCK_SIZE, buffer.length);
    const block = buffer.subarray(offset, end);
    blockHashes.push(crypto.createHash('sha256').update(block).digest());
  }

  // Handle empty file
  if (blockHashes.length === 0) {
    blockHashes.push(crypto.createHash('sha256').update(Buffer.alloc(0)).digest());
  }

  const combined = Buffer.concat(blockHashes);
  return crypto.createHash('sha256').update(combined).digest('hex');
}

module.exports = { DropboxProvider, computeDropboxHash, BLOCK_SIZE };
