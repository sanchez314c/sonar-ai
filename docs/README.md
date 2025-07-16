# SonarAI Documentation

SonarAI is a cross-platform desktop lyrics viewer. It detects the currently playing song from Spotify, Tidal, or VLC and fetches synced or plain-text lyrics from multiple sources.

## Quick Navigation

### Getting Started

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | Up and running in 5 minutes |
| [INSTALLATION.md](INSTALLATION.md) | Pre-built packages and from-source setup |
| [CONFIGURATION.md](CONFIGURATION.md) | Settings, environment variables, file paths |

### Development

| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Dev environment setup, project structure, code style |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, IPC flow, component tree, security model |
| [API.md](API.md) | IPC channels, Python JSON-RPC methods, TypeScript types |
| [TECHSTACK.md](TECHSTACK.md) | Technology choices and rationale |
| [WORKFLOW.md](WORKFLOW.md) | Branching, commits, release process |
| [TESTING.md](TESTING.md) | Manual test checklist, testing the Python backend, what to automate |
| [BUILD_COMPILE.md](BUILD_COMPILE.md) | Build commands, packaging, output formats |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Distribution, platform notes, release process |

### Reference

| Document | Description |
|----------|-------------|
| [FAQ.md](FAQ.md) | Common questions |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problem diagnosis and fixes |
| [PRD.md](PRD.md) | Product requirements document |
| [TODO.md](TODO.md) | Planned features, known issues, technical debt |
| [LEARNINGS.md](LEARNINGS.md) | Technical lessons from building the app |

### Project History

| Document | Description |
|----------|-------------|
| [../CHANGELOG.md](../CHANGELOG.md) | Full version history |
| [../AUDIT_REPORT.md](../AUDIT_REPORT.md) | Security audit report (v1.3.1) |

## Project at a Glance

**Stack:** Electron 28 + React 18 + TypeScript + Vite 5 + Tailwind CSS + Python 3

**Platform:** Linux (AppImage/deb), macOS (dmg), Windows (NSIS exe)

**Repo:** https://github.com/sanchez314c/sonar-ai

**Version:** 1.0.0
