# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately via email to **onur@omelas.tech**. Do not open a public GitHub issue for security vulnerabilities.

You should receive a response within 48 hours. Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Scope

Brain Memory handles sensitive data in several areas:

- **OAuth tokens** — Stored locally in `.brain/.sync/credentials.enc`, encrypted with AES-256-GCM
- **AES-256-GCM encryption** — Optional encryption for cloud-synced memory files using a user-provided passphrase
- **File system access** — Reads and writes to the `.brain/` directory tree
- **Cloud provider APIs** — Communicates with Dropbox, Google Drive, and OneDrive APIs when sync is configured

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x (beta) | Yes |

## Design Principles

- **No runtime dependencies** — Reduces supply chain attack surface
- **Local-first** — Sensitive data stays on disk by default; cloud sync is opt-in
- **User-owned credentials** — Users register their own OAuth apps; Brain Memory never has access to a shared client secret
