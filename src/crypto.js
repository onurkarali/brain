/**
 * Brain Memory — Crypto Utilities
 *
 * AES-256-GCM encryption for memory export/import and encrypted sync.
 * Zero external dependencies — uses only Node.js built-in crypto.
 */

const crypto = require('crypto');

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

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Encrypt a Buffer with AES-256-GCM.
 *
 * Output format: salt (32) + iv (12) + authTag (16) + ciphertext
 *
 * @param {Buffer} buffer - Raw buffer to encrypt
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

module.exports = {
  deriveKey,
  encrypt,
  decrypt,
  encryptBuffer,
  decryptBuffer,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
};
