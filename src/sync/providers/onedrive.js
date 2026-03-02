/**
 * Brain Memory — OneDrive Sync Provider
 *
 * Microsoft Graph API integration using AppFolder special folder.
 * Path-based access via approot:/{path}: — simpler than Google Drive.
 */

const crypto = require('crypto');
const { SyncProvider } = require('../provider');

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0/me/drive/special/approot';

class OneDriveProvider extends SyncProvider {
  constructor(config) {
    super(config);
  }

  /**
   * Compute content hash using SHA-1 (matches OneDrive's sha1Hash).
   *
   * @param {Buffer} buffer - File content
   * @returns {string} Uppercase hex-encoded SHA-1 hash
   */
  computeContentHash(buffer) {
    return crypto.createHash('sha1').update(buffer).digest('hex').toUpperCase();
  }

  async listFiles(cursor) {
    if (cursor) {
      return this._listDelta(cursor);
    }
    return this._listInitialDelta();
  }

  async _listInitialDelta() {
    const allFiles = [];
    let url = `${GRAPH_BASE}:/delta?$select=name,size,lastModifiedDateTime,file,parentReference,deleted`;

    let deltaLink = null;

    while (url) {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OneDrive delta failed (${response.status}): ${text}`);
      }

      const data = await response.json();

      for (const item of data.value || []) {
        if (item.deleted || !item.file) continue;

        const filePath = this._extractPath(item);
        if (!filePath) continue;

        allFiles.push({
          path: filePath,
          rev: item.eTag || item.id,
          hash: item.file?.hashes?.sha1Hash || '',
          modified: item.lastModifiedDateTime,
          size: item.size || 0,
        });
      }

      url = data['@odata.nextLink'] || null;
      if (data['@odata.deltaLink']) {
        deltaLink = data['@odata.deltaLink'];
      }
    }

    return {
      files: allFiles,
      cursor: deltaLink,
      hasMore: false,
    };
  }

  async _listDelta(deltaLink) {
    const files = [];
    let url = deltaLink;
    let newDeltaLink = null;

    while (url) {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OneDrive delta failed (${response.status}): ${text}`);
      }

      const data = await response.json();

      for (const item of data.value || []) {
        const filePath = this._extractPath(item);
        if (!filePath) continue;

        if (item.deleted) {
          files.push({
            path: filePath,
            rev: '',
            hash: '',
            modified: '',
            size: 0,
            deleted: true,
          });
        } else if (item.file) {
          files.push({
            path: filePath,
            rev: item.eTag || item.id,
            hash: item.file?.hashes?.sha1Hash || '',
            modified: item.lastModifiedDateTime,
            size: item.size || 0,
          });
        }
      }

      url = data['@odata.nextLink'] || null;
      if (data['@odata.deltaLink']) {
        newDeltaLink = data['@odata.deltaLink'];
      }
    }

    return {
      files,
      cursor: newDeltaLink || deltaLink,
      hasMore: false,
    };
  }

  /**
   * Extract relative path from a OneDrive item's parentReference.
   *
   * @param {Object} item - OneDrive drive item
   * @returns {string|null} Relative path or null
   */
  _extractPath(item) {
    if (!item.name) return null;

    const parentPath = item.parentReference?.path || '';
    // parentPath looks like: /drive/special/approot:/subfolder
    // or just /drive/special/approot for root items
    const appRootMarker = '/approot:';
    const markerIdx = parentPath.indexOf(appRootMarker);

    let relativePart = '';
    if (markerIdx !== -1) {
      relativePart = parentPath.substring(markerIdx + appRootMarker.length);
      if (relativePart.startsWith('/')) relativePart = relativePart.substring(1);
    }

    return relativePart ? `${relativePart}/${item.name}` : item.name;
  }

  async downloadFile(remotePath) {
    const response = await fetch(`${GRAPH_BASE}:/${remotePath}:/content`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
      redirect: 'follow',
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OneDrive download failed (${response.status}): ${text}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Get metadata for rev/hash
    const meta = await this.getFileMetadata(remotePath);

    return {
      content: buffer,
      rev: meta?.rev || '',
      hash: meta?.hash || this.computeContentHash(buffer),
    };
  }

  async uploadFile(remotePath, content, options = {}) {
    const { rev } = options;

    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/octet-stream',
    };

    // Use eTag for optimistic concurrency
    if (rev) {
      headers['If-Match'] = rev;
    }

    const response = await fetch(`${GRAPH_BASE}:/${remotePath}:/content`, {
      method: 'PUT',
      headers,
      body: content,
    });

    if (response.status === 412) {
      const err = new Error('Conflict: file was modified remotely');
      err.code = 'CONFLICT';
      throw err;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OneDrive upload failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return {
      rev: data.eTag || data.id,
      hash: data.file?.hashes?.sha1Hash || '',
    };
  }

  async deleteFile(remotePath) {
    const response = await fetch(`${GRAPH_BASE}:/${remotePath}:`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      throw new Error(`OneDrive delete failed (${response.status}): ${text}`);
    }

    return { success: true };
  }

  async getFileMetadata(remotePath) {
    const params = new URLSearchParams({
      $select: 'id,eTag,size,lastModifiedDateTime,file',
    });

    const response = await fetch(`${GRAPH_BASE}:/${remotePath}:?${params}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const text = await response.text();
      throw new Error(`OneDrive metadata failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    return {
      rev: data.eTag || data.id,
      hash: data.file?.hashes?.sha1Hash || '',
      modified: data.lastModifiedDateTime,
      size: data.size || 0,
    };
  }

  async createFolder(remotePath) {
    const parts = remotePath.split('/');

    // OneDrive auto-creates intermediate folders on upload,
    // but we create explicitly for completeness
    let currentPath = '';
    for (const part of parts) {
      const parentUrl = currentPath
        ? `${GRAPH_BASE}:/${currentPath}:/children`
        : `${GRAPH_BASE}/children`;

      const response = await fetch(parentUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: part,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        }),
      });

      // 409 = folder already exists, which is fine
      if (!response.ok && response.status !== 409) {
        const text = await response.text();
        throw new Error(`OneDrive folder creation failed (${response.status}): ${text}`);
      }

      currentPath = currentPath ? `${currentPath}/${part}` : part;
    }
  }

  async testConnection() {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      return { ok: false, account: null };
    }

    const data = await response.json();
    return {
      ok: true,
      account: data.userPrincipalName || data.displayName || 'Unknown',
    };
  }
}

module.exports = { OneDriveProvider };
