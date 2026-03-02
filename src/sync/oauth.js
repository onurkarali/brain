/**
 * Brain Memory — OAuth2 Authentication
 *
 * PKCE authorization code flow + Device Code Flow fallback.
 * Zero external dependencies — uses only Node.js built-in http, crypto, fetch.
 */

const crypto = require('crypto');
const http = require('http');
const { execSync } = require('child_process');
const { saveCredentials } = require('./crypto-utils');

/**
 * Provider-specific OAuth configurations.
 * Users must register their own OAuth app with each provider
 * and supply their client ID via .brain/.sync/config.json.
 */
const OAUTH_CONFIGS = {
  dropbox: {
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    revokeUrl: 'https://api.dropboxapi.com/2/auth/token/revoke',
    scopes: [],
    extraAuthParams: { token_access_type: 'offline' },
    supportsDeviceCode: false,
    supportsPKCE: true,
  },
  'google-drive': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    supportsDeviceCode: true,
    deviceAuthUrl: 'https://oauth2.googleapis.com/device/code',
    supportsPKCE: true,
  },
  onedrive: {
    authUrl: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    revokeUrl: null, // OneDrive doesn't have a standard revoke endpoint
    scopes: ['Files.ReadWrite.AppFolder', 'offline_access'],
    extraAuthParams: {},
    supportsDeviceCode: true,
    deviceAuthUrl: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode',
    supportsPKCE: true,
  },
};

/**
 * Generate a cryptographically random code verifier for PKCE.
 * 64 random bytes → base64url → 86 characters.
 *
 * @returns {string} Code verifier (86 chars, base64url)
 */
function generateCodeVerifier() {
  return crypto.randomBytes(64).toString('base64url');
}

/**
 * Generate a code challenge from a verifier (S256 method).
 * SHA-256 of verifier → base64url.
 *
 * @param {string} verifier - Code verifier string
 * @returns {string} Code challenge (base64url-encoded SHA-256)
 */
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Start a temporary loopback HTTP server to receive the OAuth callback.
 * Listens on 127.0.0.1 with an OS-assigned port. Returns an HTML success
 * page to the browser on callback, then shuts down.
 *
 * @param {Function} onCode - Callback receiving (code, error) from the redirect
 * @returns {Promise<{server: http.Server, port: number, close: Function}>}
 */
function startLoopbackServer(onCode) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      if (code) {
        res.end(`<html><body><h2>Authorization successful!</h2>
          <p>You can close this tab and return to your terminal.</p></body></html>`);
        onCode(code, null);
      } else {
        const errMsg = error || 'No authorization code received';
        res.end(`<html><body><h2>Authorization failed</h2>
          <p>${errMsg}</p></body></html>`);
        onCode(null, new Error(errMsg));
      }

      // Shut down after response
      setTimeout(() => server.close(), 500);
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();

      // Auto-timeout after 5 minutes
      const timeout = setTimeout(() => {
        server.close();
        onCode(null, new Error('Authorization timed out (300s)'));
      }, 300000);

      const close = () => {
        clearTimeout(timeout);
        server.close();
      };

      resolve({ server, port, close });
    });

    server.on('error', reject);
  });
}

/**
 * Open a URL in the user's default browser.
 * Platform-specific: open (macOS), xdg-open (Linux), start (Windows).
 *
 * @param {string} url - URL to open
 */
function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (platform === 'win32') {
      execSync(`start "" "${url}"`);
    } else {
      execSync(`xdg-open "${url}"`);
    }
  } catch {
    // If exec fails, the user will need to open manually
  }
}

/**
 * Exchange an authorization code for tokens via POST to the token endpoint.
 *
 * @param {string} tokenUrl - Provider's token endpoint
 * @param {Object} params - Key-value pairs for the POST body
 * @returns {Promise<Object>} Token response
 * @throws {Error} If the exchange fails
 */
async function exchangeCodeForTokens(tokenUrl, params) {
  const body = new URLSearchParams(params).toString();

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * Refresh an access token using a refresh token.
 *
 * @param {string} tokenUrl - Provider's token endpoint
 * @param {string} clientId - OAuth client ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token response
 * @throws {Error} If refresh fails
 */
async function refreshAccessToken(tokenUrl, clientId, refreshToken) {
  return exchangeCodeForTokens(tokenUrl, {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });
}

/**
 * Full PKCE authorization flow:
 * 1. Generate code verifier + challenge
 * 2. Start loopback server
 * 3. Open browser with auth URL
 * 4. Wait for callback with auth code
 * 5. Exchange code for tokens
 *
 * @param {Object} config
 * @param {string} config.provider - Provider name (dropbox, google-drive, onedrive)
 * @param {string} config.clientId - OAuth client ID
 * @returns {Promise<Object>} OAuth tokens
 */
async function authorizeWithPKCE(config) {
  const { provider, clientId } = config;
  const oauthConfig = OAUTH_CONFIGS[provider];
  if (!oauthConfig) throw new Error(`Unknown provider: ${provider}`);

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  // Wait for the auth code via loopback
  let resolveCode, rejectCode;
  const codePromise = new Promise((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const { port, close } = await startLoopbackServer((code, error) => {
    if (error) rejectCode(error);
    else resolveCode(code);
  });

  const redirectUri = `http://127.0.0.1:${port}`;

  // Build auth URL
  const authParams = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...oauthConfig.extraAuthParams,
  });

  if (oauthConfig.scopes.length > 0) {
    authParams.set('scope', oauthConfig.scopes.join(' '));
  }

  const authUrl = `${oauthConfig.authUrl}?${authParams.toString()}`;

  openBrowser(authUrl);

  try {
    const code = await codePromise;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(oauthConfig.tokenUrl, {
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    // Add metadata
    tokens.obtained_at = Date.now();
    if (tokens.expires_in) {
      tokens.expires_at = Date.now() + tokens.expires_in * 1000;
    }

    return tokens;
  } finally {
    close();
  }
}

/**
 * Device Code Flow authorization (fallback for headless/SSH).
 * Polls the token endpoint until the user authorizes in their browser.
 *
 * @param {Object} config
 * @param {string} config.provider - Provider name
 * @param {string} config.clientId - OAuth client ID
 * @param {Function} [config.onUserCode] - Callback to display the user code and verification URI
 * @returns {Promise<Object>} OAuth tokens
 */
async function authorizeWithDeviceCode(config) {
  const { provider, clientId, onUserCode } = config;
  const oauthConfig = OAUTH_CONFIGS[provider];
  if (!oauthConfig) throw new Error(`Unknown provider: ${provider}`);
  if (!oauthConfig.supportsDeviceCode) {
    throw new Error(`${provider} does not support Device Code Flow`);
  }

  // Request device code
  const deviceParams = new URLSearchParams({ client_id: clientId });
  if (oauthConfig.scopes.length > 0) {
    deviceParams.set('scope', oauthConfig.scopes.join(' '));
  }

  const deviceResponse = await fetch(oauthConfig.deviceAuthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: deviceParams.toString(),
  });

  if (!deviceResponse.ok) {
    const text = await deviceResponse.text();
    throw new Error(`Device code request failed (${deviceResponse.status}): ${text}`);
  }

  const deviceData = await deviceResponse.json();
  const {
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: verificationUri,
    verification_url, // Google uses this field name
    interval = 5,
    expires_in: expiresIn = 900,
  } = deviceData;

  const verifyUrl = verificationUri || verification_url;

  // Notify the user
  if (onUserCode) {
    onUserCode({ userCode, verifyUrl, expiresIn });
  }

  // Poll for authorization
  const pollInterval = Math.max(interval, 5) * 1000;
  const deadline = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: clientId,
        device_code: deviceCode,
      }).toString(),
    });

    if (tokenResponse.ok) {
      const tokens = await tokenResponse.json();
      tokens.obtained_at = Date.now();
      if (tokens.expires_in) {
        tokens.expires_at = Date.now() + tokens.expires_in * 1000;
      }
      return tokens;
    }

    const errorData = await tokenResponse.json().catch(() => ({}));
    const errorCode = errorData.error;

    if (errorCode === 'authorization_pending' || errorCode === 'slow_down') {
      // Keep polling
      continue;
    }

    // Any other error is terminal
    throw new Error(`Device authorization failed: ${errorCode || tokenResponse.status}`);
  }

  throw new Error('Device authorization timed out');
}

/**
 * Check if stored tokens are expired (with 5-minute buffer).
 *
 * @param {Object} tokens - Token object with expires_at or expires_in + obtained_at
 * @returns {boolean} True if tokens are expired or about to expire
 */
function isTokenExpired(tokens) {
  if (!tokens) return true;

  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (tokens.expires_at) {
    return Date.now() >= tokens.expires_at - bufferMs;
  }

  if (tokens.expires_in && tokens.obtained_at) {
    const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;
    return Date.now() >= expiresAt - bufferMs;
  }

  // If no expiry info, assume not expired (some providers like Dropbox
  // issue non-expiring access tokens with offline access)
  return false;
}

/**
 * Ensure tokens are fresh. If expired, refresh and persist.
 *
 * @param {Object} tokens - Current tokens
 * @param {string} provider - Provider name
 * @param {string} clientId - OAuth client ID
 * @param {string} [projectRoot] - Project root for credential storage
 * @param {string} [passphrase] - Passphrase for credential encryption
 * @returns {Promise<Object>} Fresh tokens
 * @throws {Error} If refresh fails and no refresh_token available
 */
async function ensureFreshTokens(tokens, provider, clientId, projectRoot, passphrase) {
  if (!isTokenExpired(tokens)) return tokens;

  if (!tokens.refresh_token) {
    throw new Error('Access token expired and no refresh token available. Please re-authorize.');
  }

  const oauthConfig = OAUTH_CONFIGS[provider];
  const newTokens = await refreshAccessToken(oauthConfig.tokenUrl, clientId, tokens.refresh_token);

  // Preserve refresh token if not returned in refresh response
  if (!newTokens.refresh_token) {
    newTokens.refresh_token = tokens.refresh_token;
  }

  newTokens.obtained_at = Date.now();
  if (newTokens.expires_in) {
    newTokens.expires_at = Date.now() + newTokens.expires_in * 1000;
  }

  // Persist refreshed tokens
  saveCredentials(newTokens, projectRoot, passphrase);

  return newTokens;
}

module.exports = {
  OAUTH_CONFIGS,
  generateCodeVerifier,
  generateCodeChallenge,
  startLoopbackServer,
  openBrowser,
  exchangeCodeForTokens,
  refreshAccessToken,
  authorizeWithPKCE,
  authorizeWithDeviceCode,
  isTokenExpired,
  ensureFreshTokens,
};
