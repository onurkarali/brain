/**
 * Brain Memory — Crypto Utilities
 *
 * AES-256-GCM encryption for sync credentials and file content.
 * Zero external dependencies — uses only Node.js built-in crypto.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getBrainDir } = require('../index-manager');

const SYNC_DIR = '.sync';
const CREDENTIALS_FILE = 'credentials.enc';

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha512';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive an AES-256 key from a passphrase using PBKDF2.
 *
 * @param {string} passphrase - User-provided passphrase
 * @param {Buffer} salt - 32-byte salt
 * @returns {Buffer} 32-byte derived key
 */
function deriveKey(passphrase, salt) {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

/**
 * Generate a machine-specific identifier (convenience default, not strong security).
 * SHA-256 of hostname + username.
 *
 * @returns {string} Hex-encoded machine identifier
 */
function getMachineIdentifier() {
  const data = `${os.hostname()}:${os.userInfo().username}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Encrypt a UTF-8 string with AES-256-GCM.
 *
 * Output format: salt (32) + iv (12) + authTag (16) + ciphertext
 *
 * @param {string} plaintext - UTF-8 string to encrypt
 * @param {string} passphrase - Passphrase (key derived via PBKDF2)
 * @returns {Buffer} Encrypted buffer
 */
function encrypt(plaintext, passphrase) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt an AES-256-GCM encrypted buffer back to a UTF-8 string.
 *
 * @param {Buffer} encrypted - Buffer produced by encrypt()
 * @param {string} passphrase - Same passphrase used for encryption
 * @returns {string} Decrypted UTF-8 string
 * @throws {Error} If passphrase is wrong or data is tampered
 */
function decrypt(encrypted, passphrase) {
  if (encrypted.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted data: too short');
  }

  const salt = encrypted.subarray(0, SALT_LENGTH);
  const iv = encrypted.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encrypted.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encrypted.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Encrypt a Buffer with AES-256-GCM (for file content before upload).
 *
 * Output format: salt (32) + iv (12) + authTag (16) + ciphertext
 *
 * @param {Buffer} buffer - Raw file content
 * @param {string} passphrase - Passphrase
 * @returns {Buffer} Encrypted buffer
 */
function encryptBuffer(buffer, passphrase) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt a Buffer encrypted with encryptBuffer().
 *
 * @param {Buffer} encrypted - Buffer produced by encryptBuffer()
 * @param {string} passphrase - Same passphrase used for encryption
 * @returns {Buffer} Decrypted buffer
 * @throws {Error} If passphrase is wrong or data is tampered
 */
function decryptBuffer(encrypted, passphrase) {
  if (encrypted.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data: too short');
  }

  const salt = encrypted.subarray(0, SALT_LENGTH);
  const iv = encrypted.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encrypted.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encrypted.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Get the path to the .sync directory.
 *
 * @param {string} [projectRoot] - Project root directory
 * @returns {string} Absolute path to .brain/.sync/
 */
function getSyncDir(projectRoot) {
  return path.join(getBrainDir(projectRoot), SYNC_DIR);
}

/**
 * Save OAuth tokens encrypted to .brain/.sync/credentials.enc.
 * Sets file permissions to 0600 (owner read/write only).
 *
 * @param {Object} tokens - OAuth tokens to store
 * @param {string} [projectRoot] - Project root directory
 * @param {string} [passphrase] - Passphrase (defaults to machine identifier)
 */
function saveCredentials(tokens, projectRoot, passphrase) {
  const syncDir = getSyncDir(projectRoot);
  fs.mkdirSync(syncDir, { recursive: true });

  const pass = passphrase || getMachineIdentifier();
  const encrypted = encrypt(JSON.stringify(tokens), pass);
  const credPath = path.join(syncDir, CREDENTIALS_FILE);

  fs.writeFileSync(credPath, encrypted);
  try {
    fs.chmodSync(credPath, 0o600);
  } catch {
    // chmod may not be supported on all platforms
  }
}

/**
 * Load and decrypt OAuth tokens from .brain/.sync/credentials.enc.
 *
 * @param {string} [projectRoot] - Project root directory
 * @param {string} [passphrase] - Passphrase (defaults to machine identifier)
 * @returns {Object|null} Decrypted tokens or null if file doesn't exist
 * @throws {Error} If passphrase is wrong
 */
function loadCredentials(projectRoot, passphrase) {
  const credPath = path.join(getSyncDir(projectRoot), CREDENTIALS_FILE);
  if (!fs.existsSync(credPath)) return null;

  const pass = passphrase || getMachineIdentifier();
  const encrypted = fs.readFileSync(credPath);
  return JSON.parse(decrypt(encrypted, pass));
}

/**
 * Delete stored credentials.
 *
 * @param {string} [projectRoot] - Project root directory
 */
function deleteCredentials(projectRoot) {
  const credPath = path.join(getSyncDir(projectRoot), CREDENTIALS_FILE);
  if (fs.existsSync(credPath)) {
    fs.unlinkSync(credPath);
  }
}

module.exports = {
  deriveKey,
  getMachineIdentifier,
  encrypt,
  decrypt,
  encryptBuffer,
  decryptBuffer,
  getSyncDir,
  saveCredentials,
  loadCredentials,
  deleteCredentials,
  // Expose constants for testing
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
};
