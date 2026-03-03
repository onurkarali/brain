# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately via email to **onur@omelas.tech**. Do not open a public GitHub issue for security vulnerabilities.

You should receive a response within 48 hours. Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Scope

Brain Memory handles sensitive data in several areas:

- **AES-256-GCM encryption** — Optional encryption for Git-synced and exported memory files using a user-provided passphrase (PBKDF2-SHA512, 100K iterations)
- **File system access** — Reads and writes to the `.brain/` directory tree
- **Git operations** — When sync is configured, pushes/pulls to a user-specified Git remote using the system `git` binary and the user's existing Git/SSH authentication

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x (beta) | Yes |

## Design Principles

- **No runtime dependencies** — Reduces supply chain attack surface
- **Local-first** — Sensitive data stays on disk by default; sync is opt-in
- **No stored credentials** — Git sync relies on the user's existing SSH keys or Git credential helpers; Brain Memory never stores auth tokens
