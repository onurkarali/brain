const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const {
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
  SALT_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
} = require('../src/sync/crypto-utils');

const {
  generateCodeVerifier,
  generateCodeChallenge,
  startLoopbackServer,
  exchangeCodeForTokens,
  isTokenExpired,
  OAUTH_CONFIGS,
} = require('../src/sync/oauth');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-oauth-test-'));
  fs.mkdirSync(path.join(tmpDir, '.brain', '.sync'), { recursive: true });
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ===========================================================================
// Crypto Utils
// ===========================================================================

describe('deriveKey', () => {
  it('produces a 32-byte Buffer', () => {
    const salt = crypto.randomBytes(32);
    const key = deriveKey('test-passphrase', salt);
    assert.equal(key.length, 32);
    assert.ok(Buffer.isBuffer(key));
  });

  it('is deterministic for same passphrase + salt', () => {
    const salt = crypto.randomBytes(32);
    const key1 = deriveKey('same-pass', salt);
    const key2 = deriveKey('same-pass', salt);
    assert.deepEqual(key1, key2);
  });

  it('differs for different passphrases', () => {
    const salt = crypto.randomBytes(32);
    const key1 = deriveKey('pass-a', salt);
    const key2 = deriveKey('pass-b', salt);
    assert.notDeepEqual(key1, key2);
  });

  it('differs for different salts', () => {
    const salt1 = crypto.randomBytes(32);
    const salt2 = crypto.randomBytes(32);
    const key1 = deriveKey('same-pass', salt1);
    const key2 = deriveKey('same-pass', salt2);
    assert.notDeepEqual(key1, key2);
  });
});

describe('getMachineIdentifier', () => {
  it('returns a 64-char hex string', () => {
    const id = getMachineIdentifier();
    assert.equal(id.length, 64);
    assert.match(id, /^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    assert.equal(getMachineIdentifier(), getMachineIdentifier());
  });
});

describe('encrypt / decrypt', () => {
  it('round-trips a short string', () => {
    const original = 'hello world';
    const encrypted = encrypt(original, 'my-passphrase');
    const decrypted = decrypt(encrypted, 'my-passphrase');
    assert.equal(decrypted, original);
  });

  it('round-trips a JSON object', () => {
    const obj = { access_token: 'abc123', refresh_token: 'def456' };
    const encrypted = encrypt(JSON.stringify(obj), 'secret');
    const decrypted = JSON.parse(decrypt(encrypted, 'secret'));
    assert.deepEqual(decrypted, obj);
  });

  it('round-trips unicode content', () => {
    const original = '日本語テスト 🧠 émojis';
    const encrypted = encrypt(original, 'pass');
    assert.equal(decrypt(encrypted, 'pass'), original);
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encrypt('secret data', 'correct-pass');
    assert.throws(
      () => decrypt(encrypted, 'wrong-pass'),
      (err) => err instanceof Error
    );
  });

  it('detects tampering (GCM auth tag)', () => {
    const encrypted = encrypt('data', 'pass');
    // Flip a bit in the ciphertext
    encrypted[encrypted.length - 1] ^= 0xff;
    assert.throws(
      () => decrypt(encrypted, 'pass'),
      (err) => err instanceof Error
    );
  });

  it('rejects too-short data', () => {
    assert.throws(
      () => decrypt(Buffer.alloc(10), 'pass'),
      /too short/
    );
  });

  it('produces different ciphertext each time (random IV + salt)', () => {
    const a = encrypt('same text', 'same pass');
    const b = encrypt('same text', 'same pass');
    assert.notDeepEqual(a, b);
  });

  it('output has correct structure: salt + iv + authTag + ciphertext', () => {
    const encrypted = encrypt('test', 'pass');
    assert.ok(encrypted.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1);
  });
});

describe('encryptBuffer / decryptBuffer', () => {
  it('round-trips a Buffer', () => {
    const original = Buffer.from('binary data \x00\x01\x02\xff');
    const encrypted = encryptBuffer(original, 'pass');
    const decrypted = decryptBuffer(encrypted, 'pass');
    assert.deepEqual(decrypted, original);
  });

  it('round-trips an empty Buffer', () => {
    const original = Buffer.alloc(0);
    const encrypted = encryptBuffer(original, 'pass');
    const decrypted = decryptBuffer(encrypted, 'pass');
    assert.deepEqual(decrypted, original);
  });

  it('round-trips a large Buffer', () => {
    const original = crypto.randomBytes(1024 * 100); // 100KB
    const encrypted = encryptBuffer(original, 'pass');
    const decrypted = decryptBuffer(encrypted, 'pass');
    assert.deepEqual(decrypted, original);
  });

  it('throws on wrong passphrase', () => {
    const encrypted = encryptBuffer(Buffer.from('data'), 'correct');
    assert.throws(() => decryptBuffer(encrypted, 'wrong'));
  });
});

describe('credentials storage', () => {
  beforeEach(() => setup());
  afterEach(() => teardown());

  it('saves and loads credentials', () => {
    const tokens = { access_token: 'abc', refresh_token: 'xyz', expires_at: 9999999999999 };
    saveCredentials(tokens, tmpDir, 'test-pass');
    const loaded = loadCredentials(tmpDir, 'test-pass');
    assert.deepEqual(loaded, tokens);
  });

  it('returns null when no credentials file', () => {
    assert.equal(loadCredentials(tmpDir, 'pass'), null);
  });

  it('throws on wrong passphrase', () => {
    saveCredentials({ token: 'secret' }, tmpDir, 'correct');
    assert.throws(() => loadCredentials(tmpDir, 'wrong'));
  });

  it('creates .sync dir if needed', () => {
    const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-cred-test-'));
    fs.mkdirSync(path.join(freshDir, '.brain'), { recursive: true });
    saveCredentials({ token: 'x' }, freshDir, 'p');
    assert.ok(fs.existsSync(path.join(freshDir, '.brain', '.sync', 'credentials.enc')));
    fs.rmSync(freshDir, { recursive: true, force: true });
  });

  it('deletes credentials', () => {
    saveCredentials({ token: 'x' }, tmpDir, 'p');
    assert.ok(loadCredentials(tmpDir, 'p'));
    deleteCredentials(tmpDir);
    assert.equal(loadCredentials(tmpDir, 'p'), null);
  });

  it('deleteCredentials is safe when file does not exist', () => {
    assert.doesNotThrow(() => deleteCredentials(tmpDir));
  });

  it('uses machine identifier as default passphrase', () => {
    const tokens = { access_token: 'default-pass-test' };
    saveCredentials(tokens, tmpDir); // no passphrase
    const loaded = loadCredentials(tmpDir); // no passphrase
    assert.deepEqual(loaded, tokens);
  });
});

describe('getSyncDir', () => {
  it('returns <projectRoot>/.brain/.sync', () => {
    const result = getSyncDir('/some/project');
    assert.equal(result, path.join('/some/project', '.brain', '.sync'));
  });
});

// ===========================================================================
// OAuth Utils
// ===========================================================================

describe('generateCodeVerifier', () => {
  it('returns a base64url string of 86 chars', () => {
    const verifier = generateCodeVerifier();
    assert.equal(verifier.length, 86);
    assert.match(verifier, /^[A-Za-z0-9_-]+$/);
  });

  it('generates different values each time', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    assert.notEqual(a, b);
  });
});

describe('generateCodeChallenge', () => {
  it('returns a base64url string', () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    assert.match(challenge, /^[A-Za-z0-9_-]+$/);
  });

  it('is deterministic for same verifier', () => {
    const verifier = generateCodeVerifier();
    const c1 = generateCodeChallenge(verifier);
    const c2 = generateCodeChallenge(verifier);
    assert.equal(c1, c2);
  });

  it('produces different challenges for different verifiers', () => {
    const c1 = generateCodeChallenge('verifier-aaa');
    const c2 = generateCodeChallenge('verifier-bbb');
    assert.notEqual(c1, c2);
  });

  it('matches manual SHA-256 base64url computation', () => {
    const verifier = 'test-verifier-value';
    const expected = crypto.createHash('sha256').update(verifier).digest('base64url');
    assert.equal(generateCodeChallenge(verifier), expected);
  });
});

describe('startLoopbackServer', () => {
  it('starts server and receives auth code', async () => {
    let receivedCode = null;

    const { port, close } = await startLoopbackServer((code, error) => {
      if (error) throw error;
      receivedCode = code;
    });

    assert.ok(port > 0);

    // Simulate browser redirect
    const response = await fetch(`http://127.0.0.1:${port}?code=test_auth_code`);
    assert.equal(response.status, 200);

    // Wait a tick for the callback
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(receivedCode, 'test_auth_code');

    close();
  });

  it('handles error response', async () => {
    let receivedError = null;

    const { port, close } = await startLoopbackServer((code, error) => {
      receivedError = error;
    });

    await fetch(`http://127.0.0.1:${port}?error=access_denied`);
    await new Promise((r) => setTimeout(r, 100));

    assert.ok(receivedError instanceof Error);
    assert.match(receivedError.message, /access_denied/);

    close();
  });
});

describe('exchangeCodeForTokens', () => {
  it('exchanges code via mock server', async () => {
    const mockTokens = { access_token: 'mock_token', refresh_token: 'mock_refresh', expires_in: 3600 };

    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const params = new URLSearchParams(body);
        assert.equal(params.get('grant_type'), 'authorization_code');
        assert.equal(params.get('code'), 'test_code');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockTokens));
      });
    });

    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();

    try {
      const tokens = await exchangeCodeForTokens(`http://127.0.0.1:${port}/token`, {
        grant_type: 'authorization_code',
        code: 'test_code',
        client_id: 'test_client',
      });

      assert.equal(tokens.access_token, 'mock_token');
      assert.equal(tokens.refresh_token, 'mock_refresh');
    } finally {
      server.close();
    }
  });

  it('throws on error response', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_grant' }));
    });

    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address();

    try {
      await assert.rejects(
        () => exchangeCodeForTokens(`http://127.0.0.1:${port}/token`, { grant_type: 'authorization_code' }),
        /Token exchange failed \(400\)/
      );
    } finally {
      server.close();
    }
  });
});

describe('isTokenExpired', () => {
  it('returns true for null tokens', () => {
    assert.equal(isTokenExpired(null), true);
  });

  it('returns false for future expires_at', () => {
    assert.equal(isTokenExpired({ expires_at: Date.now() + 3600000 }), false);
  });

  it('returns true for past expires_at', () => {
    assert.equal(isTokenExpired({ expires_at: Date.now() - 1000 }), true);
  });

  it('returns true within 5-min buffer', () => {
    // Expires in 4 minutes — within the 5-min buffer
    assert.equal(isTokenExpired({ expires_at: Date.now() + 4 * 60 * 1000 }), true);
  });

  it('returns false just outside 5-min buffer', () => {
    assert.equal(isTokenExpired({ expires_at: Date.now() + 6 * 60 * 1000 }), false);
  });

  it('uses expires_in + obtained_at fallback', () => {
    assert.equal(
      isTokenExpired({ expires_in: 3600, obtained_at: Date.now() - 7200000 }),
      true
    );
    assert.equal(
      isTokenExpired({ expires_in: 3600, obtained_at: Date.now() }),
      false
    );
  });

  it('returns false when no expiry info (e.g. Dropbox offline)', () => {
    assert.equal(isTokenExpired({ access_token: 'abc' }), false);
  });
});

describe('OAUTH_CONFIGS', () => {
  it('has configs for all three providers', () => {
    assert.ok(OAUTH_CONFIGS['dropbox']);
    assert.ok(OAUTH_CONFIGS['google-drive']);
    assert.ok(OAUTH_CONFIGS['onedrive']);
  });

  it('dropbox has correct token URL', () => {
    assert.equal(OAUTH_CONFIGS['dropbox'].tokenUrl, 'https://api.dropboxapi.com/oauth2/token');
  });

  it('google-drive requests appdata scope', () => {
    assert.ok(OAUTH_CONFIGS['google-drive'].scopes.includes('https://www.googleapis.com/auth/drive.appdata'));
  });

  it('onedrive requests AppFolder scope', () => {
    assert.ok(OAUTH_CONFIGS['onedrive'].scopes.includes('Files.ReadWrite.AppFolder'));
  });

  it('google-drive and onedrive support device code', () => {
    assert.equal(OAUTH_CONFIGS['google-drive'].supportsDeviceCode, true);
    assert.equal(OAUTH_CONFIGS['onedrive'].supportsDeviceCode, true);
  });

  it('dropbox does not support device code', () => {
    assert.equal(OAUTH_CONFIGS['dropbox'].supportsDeviceCode, false);
  });
});
