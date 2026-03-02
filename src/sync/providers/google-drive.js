/**
 * Brain Memory — Google Drive Sync Provider
 *
 * Google Drive API v3 integration using appDataFolder space.
 * Key challenge: Drive is ID-based, not path-based. Maintains a path↔ID cache.
 */

const crypto = require('crypto');
const { SyncProvider } = require('../provider');

const API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

class GoogleDriveProvider extends SyncProvider {
  constructor(config) {
    super(config);
    this._pathToId = new Map(); // 'professional/skills/ts.md' → fileId
    this._idToPath = new Map(); // fileId → 'professional/skills/ts.md'
    this._parentCache = new Map(); // folderId → parentFolderId

    // Restore cache from persisted state if available
    if (config.options?.pathCache) {
      for (const [p, id] of Object.entries(config.options.pathCache)) {
        this._pathToId.set(p, id);
        this._idToPath.set(id, p);
      }
    }
  }

  /**
   * Compute content hash using MD5 (matches Drive's md5Checksum).
   *
   * @param {Buffer} buffer - File content
   * @returns {string} Hex-encoded MD5 hash
   */
  computeContentHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Export the path↔ID cache for persistence in sync-state.json.
   *
   * @returns {Object} Cache as plain object
   */
  exportPathCache() {
    const cache = {};
    for (const [p, id] of this._pathToId) {
      cache[p] = id;
    }
    return cache;
  }

  async listFiles(cursor) {
    if (cursor) {
      return this._listChanges(cursor);
    }
    return this._buildFullListing();
  }

  async _buildFullListing() {
    const files = [];
    let pageToken = null;

    do {
      const params = new URLSearchParams({
        spaces: 'appDataFolder',
        fields: 'nextPageToken, files(id, name, parents, md5Checksum, modifiedTime, size, mimeType)',
        pageSize: '1000',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await fetch(`${API_BASE}/files?${params}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google Drive list failed (${response.status}): ${text}`);
      }

      const data = await response.json();

      for (const file of data.files || []) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // Cache folder ID → name for path resolution
          this._idToPath.set(file.id, file.name);
          if (file.parents?.[0]) {
            this._parentCache.set(file.id, file.parents[0]);
          }
        } else {
          files.push(file);
        }
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    // Resolve full paths for all files
    const result = [];
    for (const file of files) {
      const filePath = this._resolveIdToPath(file);
      if (filePath) {
        this._pathToId.set(filePath, file.id);
        this._idToPath.set(file.id, filePath);
        result.push({
          path: filePath,
          rev: file.id, // Use file ID as revision identifier
          hash: file.md5Checksum || '',
          modified: file.modifiedTime,
          size: parseInt(file.size || '0', 10),
        });
      }
    }

    // Get the initial changes start token for delta sync
    const startTokenResp = await fetch(
      `${API_BASE}/changes/getStartPageToken?${new URLSearchParams({ spaces: 'appDataFolder' })}`,
      { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
    );
    const startTokenData = await startTokenResp.json();

    return {
      files: result,
      cursor: startTokenData.startPageToken,
      hasMore: false,
    };
  }

  _resolveIdToPath(file) {
    const parts = [file.name];
    let parentId = file.parents?.[0];

    // Walk up the parent chain
    while (parentId) {
      const parentName = this._idToPath.get(parentId);
      const grandparentId = this._parentCache.get(parentId);

      // If we've reached the appDataFolder root, stop
      if (!grandparentId || !parentName) break;

      parts.unshift(parentName);
      parentId = grandparentId;
    }

    return parts.join('/');
  }

  async _listChanges(cursor) {
    const params = new URLSearchParams({
      pageToken: cursor,
      spaces: 'appDataFolder',
      fields: 'nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, parents, md5Checksum, modifiedTime, size, mimeType))',
    });

    const response = await fetch(`${API_BASE}/changes/list?${params}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Drive changes.list failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    const files = [];

    for (const change of data.changes || []) {
      if (change.removed) {
        // File was deleted — find its cached path
        const cachedPath = this._idToPath.get(change.fileId);
        if (cachedPath) {
          files.push({
            path: cachedPath,
            rev: change.fileId,
            hash: '',
            modified: '',
            size: 0,
            deleted: true,
          });
          this._pathToId.delete(cachedPath);
          this._idToPath.delete(change.fileId);
        }
      } else if (change.file && change.file.mimeType !== 'application/vnd.google-apps.folder') {
        const filePath = this._resolveIdToPath(change.file);
        if (filePath) {
          this._pathToId.set(filePath, change.file.id);
          this._idToPath.set(change.file.id, filePath);
          files.push({
            path: filePath,
            rev: change.file.id,
            hash: change.file.md5Checksum || '',
            modified: change.file.modifiedTime,
            size: parseInt(change.file.size || '0', 10),
          });
        }
      }
    }

    return {
      files,
      cursor: data.newStartPageToken || data.nextPageToken,
      hasMore: !!data.nextPageToken,
    };
  }

  async downloadFile(remotePath) {
    const fileId = await this._resolvePathToId(remotePath);
    if (!fileId) throw new Error(`File not found in Google Drive: ${remotePath}`);

    const response = await fetch(`${API_BASE}/files/${fileId}?alt=media`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Drive download failed (${response.status}): ${text}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Get metadata for hash
    const metaResp = await fetch(
      `${API_BASE}/files/${fileId}?fields=md5Checksum`,
      { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
    );
    const meta = metaResp.ok ? await metaResp.json() : {};

    return {
      content: buffer,
      rev: fileId,
      hash: meta.md5Checksum || this.computeContentHash(buffer),
    };
  }

  async uploadFile(remotePath, content, options = {}) {
    const existingId = await this._resolvePathToId(remotePath);

    if (existingId) {
      return this._updateFile(existingId, remotePath, content);
    }

    return this._createFile(remotePath, content);
  }

  async _createFile(remotePath, content) {
    const parts = remotePath.split('/');
    const fileName = parts.pop();
    const parentId = await this._ensureParentFolders(parts);

    // Multipart upload: metadata + content
    const boundary = `brain_${Date.now()}`;
    const metadata = JSON.stringify({
      name: fileName,
      parents: [parentId],
    });

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
      Buffer.from(metadata),
      Buffer.from(`\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
      content,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const response = await fetch(
      `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,md5Checksum`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Drive upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    this._pathToId.set(remotePath, data.id);
    this._idToPath.set(data.id, remotePath);

    return {
      rev: data.id,
      hash: data.md5Checksum || '',
    };
  }

  async _updateFile(fileId, remotePath, content) {
    const response = await fetch(
      `${UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,md5Checksum`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: content,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Drive update failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return {
      rev: data.id,
      hash: data.md5Checksum || '',
    };
  }

  async _ensureParentFolders(pathParts) {
    let parentId = 'appDataFolder';

    for (const folderName of pathParts) {
      const existingId = this._pathToId.get(
        this._buildPartialPath(pathParts, folderName)
      );
      if (existingId) {
        parentId = existingId;
        continue;
      }

      // Search for existing folder
      const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const params = new URLSearchParams({
        q: query,
        spaces: 'appDataFolder',
        fields: 'files(id)',
      });

      const searchResp = await fetch(`${API_BASE}/files?${params}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });

      if (searchResp.ok) {
        const searchData = await searchResp.json();
        if (searchData.files?.length > 0) {
          parentId = searchData.files[0].id;
          continue;
        }
      }

      // Create folder
      const createResp = await fetch(`${API_BASE}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }),
      });

      if (!createResp.ok) {
        const text = await createResp.text();
        throw new Error(`Google Drive folder creation failed (${createResp.status}): ${text}`);
      }

      const folder = await createResp.json();
      parentId = folder.id;
    }

    return parentId;
  }

  _buildPartialPath(allParts, upToName) {
    const idx = allParts.indexOf(upToName);
    return allParts.slice(0, idx + 1).join('/');
  }

  async deleteFile(remotePath) {
    const fileId = await this._resolvePathToId(remotePath);
    if (!fileId) return { success: true }; // Already gone

    const response = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`Google Drive delete failed (${response.status}): ${text}`);
    }

    this._pathToId.delete(remotePath);
    this._idToPath.delete(fileId);

    return { success: true };
  }

  async getFileMetadata(remotePath) {
    const fileId = await this._resolvePathToId(remotePath);
    if (!fileId) return null;

    const params = new URLSearchParams({
      fields: 'id, md5Checksum, modifiedTime, size',
    });

    const response = await fetch(`${API_BASE}/files/${fileId}?${params}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const text = await response.text();
      throw new Error(`Google Drive metadata failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return {
      rev: data.id,
      hash: data.md5Checksum || '',
      modified: data.modifiedTime,
      size: parseInt(data.size || '0', 10),
    };
  }

  async createFolder(remotePath) {
    const parts = remotePath.split('/');
    await this._ensureParentFolders(parts);
  }

  async testConnection() {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      return { ok: false, account: null };
    }

    const data = await response.json();
    return {
      ok: true,
      account: data.user?.emailAddress || data.user?.displayName || 'Unknown',
    };
  }

  /**
   * Resolve a relative path to a Google Drive file ID.
   * Uses cache first, falls back to API search.
   *
   * @param {string} remotePath - Relative path
   * @returns {Promise<string|null>} File ID or null
   */
  async _resolvePathToId(remotePath) {
    // Check cache first
    const cached = this._pathToId.get(remotePath);
    if (cached) return cached;

    // Walk path components via API
    const parts = remotePath.split('/');
    let parentId = 'appDataFolder';

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const mimeFilter = isLast ? '' : ` and mimeType='application/vnd.google-apps.folder'`;

      const query = `name='${name}' and '${parentId}' in parents${mimeFilter} and trashed=false`;
      const params = new URLSearchParams({
        q: query,
        spaces: 'appDataFolder',
        fields: 'files(id)',
      });

      const response = await fetch(`${API_BASE}/files?${params}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.files?.length) return null;

      parentId = data.files[0].id;
    }

    // Cache the result
    this._pathToId.set(remotePath, parentId);
    this._idToPath.set(parentId, remotePath);

    return parentId;
  }
}

module.exports = { GoogleDriveProvider };
