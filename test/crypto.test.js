const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveKey,
  encrypt,
  decrypt,
  encryptBuffer,
  decryptBuffer,
  SALT_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
} = require('../src/crypto');

// ===========================================================================
// deriveKey
// ===========================================================================

describe('deriveKey', () => {
  it('produces a 32-byte buffer', () => {
    const salt = Buffer.alloc(32, 'a');
    const key = deriveKey('test-pass', salt);
    assert.equal(key.length, 32);
  });

  it('is deterministic for the same inputs', () => {
    const salt = Buffer.alloc(32, 'b');
    const k1 = deriveKey('pass', salt);
    const k2 = deriveKey('pass', salt);
    assert.ok(k1.equals(k2));
  });

  it('produces different keys for different passphrases', () => {
    const salt = Buffer.alloc(32, 'c');
    const k1 = deriveKey('pass1', salt);
    const k2 = deriveKey('pass2', salt);
    assert.ok(!k1.equals(k2));
  });
});

// ===========================================================================
// encrypt / decrypt (string)
// ===========================================================================

describe('encrypt / decrypt', () => {
  it('round-trips a string', () => {
    const plaintext = 'Hello, Brain Memory!';
    const passphrase = 'my-secret';
    const encrypted = encrypt(plaintext, passphrase);
    const decrypted = decrypt(encrypted, passphrase);
    assert.equal(decrypted, plaintext);
  });

  it('round-trips an empty string', () => {
    const encrypted = encrypt('', 'pass');
    const decrypted = decrypt(encrypted, 'pass');
    assert.equal(decrypted, '');
  });

  it('round-trips unicode content', () => {
    const text = '日本語テスト 🧠💡';
    const encrypted = encrypt(text, 'pass');
    assert.equal(decrypt(encrypted, 'pass'), text);
  });

  it('produces output with salt + iv + authTag + ciphertext', () => {
    const encrypted = encrypt('test', 'pass');
    assert.ok(encrypted.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1);
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encrypt('secret data', 'correct-pass');
    assert.throws(() => decrypt(encrypted, 'wrong-pass'));
  });

  it('throws on truncated data', () => {
    assert.throws(() => decrypt(Buffer.alloc(10), 'pass'), /too short/);
  });

  it('throws on tampered data', () => {
    const encrypted = encrypt('test', 'pass');
    // Flip a byte in the ciphertext region
    encrypted[encrypted.length - 1] ^= 0xff;
    assert.throws(() => decrypt(encrypted, 'pass'));
  });
});

// ===========================================================================
// encryptBuffer / decryptBuffer
// ===========================================================================

describe('encryptBuffer / decryptBuffer', () => {
  it('round-trips a buffer', () => {
    const buf = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe]);
    const encrypted = encryptBuffer(buf, 'pass');
    const decrypted = decryptBuffer(encrypted, 'pass');
    assert.ok(decrypted.equals(buf));
  });

  it('round-trips an empty buffer', () => {
    const buf = Buffer.alloc(0);
    const encrypted = encryptBuffer(buf, 'pass');
    const decrypted = decryptBuffer(encrypted, 'pass');
    assert.ok(decrypted.equals(buf));
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encryptBuffer(Buffer.from('data'), 'right');
    assert.throws(() => decryptBuffer(encrypted, 'wrong'));
  });

  it('throws on truncated data', () => {
    assert.throws(() => decryptBuffer(Buffer.alloc(5), 'pass'), /too short/);
  });
});
