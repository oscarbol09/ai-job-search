---
name: ticjob-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search specialized IT, telecommunications,
  and tech job vacancies on Ticjob Colombia (ticjob.co), a vertical employment portal
  dedicated exclusively to the technology sector. Invoke for software engineering,
  DevOps, cybersecurity, sysadmin, QA, and data roles in Colombia.
  Trigger phrases: ticjob, ticjob colombia, ticjob.co, empleos ticjob, empleos ti colombia,
  vacantes ticjob.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/ticjob-search/cli/src/cli.ts *)
---

# Ticjob Colombia Search Skill

Search specialized tech and IT job listings from **Ticjob Colombia** (`ticjob.co`).
Zero runtime dependencies — runs with pure TypeScript on `bun`.

> Niche tech job portal in Colombia covering software development, infrastructure,
> cloud, architecture, and IT consulting vacancies.

## Commands

### 1. Search job listings

```bash
bun run .agents/skills/ticjob-search/cli/src/cli.ts search --query "<text>" [flags]
```

Flags:
- `--query, -q <text>`: Keywords (e.g. `"python"`, `"analitica"`, `"react"`). **Required**.
- `--limit, -n <n>`: Cap results emitted.
- `--format <fmt>`: `json` (default) | `table` | `plain`.

### 2. Fetch job detail

```bash
bun run .agents/skills/ticjob-search/cli/src/cli.ts detail <url-or-id> [--format json|plain]
```
