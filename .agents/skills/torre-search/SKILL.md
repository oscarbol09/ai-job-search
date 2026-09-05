---
name: torre-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search tech, software engineering,
  data, product, design, or remote job listings on Torre (torre.ai / torre.co),
  one of the most prominent platforms for tech talent in Colombia and Latin America
  founded by Alexander Torrenegra. Invoke for roles in Colombia, Latin America,
  and global remote positions with explicit salary ranges (USD/COP).
  Trigger phrases: torre, torre.ai, torre.co, torre jobs, empleos torre, vacantes torre,
  trabajo remoto torre, empleos tech colombia, buscar trabajo remoto torre.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/torre-search/cli/src/cli.ts *)
---

# Torre Search Skill

Search live tech, software, data, product, and remote job listings from **Torre** (`torre.ai` / `torre.co`).
Powered by Torre's open public REST API — **zero scraping, zero authentication, no API key required**, and **zero runtime dependencies** (runs with pure TypeScript on `bun`).

> Colombian-founded tech and remote talent platform connecting professionals across Colombia,
> Latin America, and globally with top startups, scaleups, and tech enterprises.

## When to use this skill

- Search for software engineering, tech, data, AI, product, and remote roles
- Filter jobs in Colombia, specific LATAM countries, or global remote
- Filter by currency or salary ranges (USD, COP)
- Retrieve rich job details: required skills/strengths, compensation ranges, remote status, and direct apply links

## Commands

### 1. Search job listings

```bash
bun run .agents/skills/torre-search/cli/src/cli.ts search --query "<text>" [flags]
```

Flags:
- `--query, -q <text>`: Role keywords, skills, or job title (e.g. `"python"`, `"fullstack"`, `"react"`, `"data engineer"`). **Required**.
- `--location, -l <country>`: Country restriction (e.g. `"Colombia"`, `"remote"`).
- `--remote`: Filter only remote positions.
- `--page, -p <n>`: 1-indexed page number (default `1`).
- `--limit, -n <n>`: Cap results emitted (default `20`, max `50`).
- `--format <fmt>`: `json` (default) | `table` | `plain`.

### 2. Fetch job detail

```bash
bun run .agents/skills/torre-search/cli/src/cli.ts detail <url-or-id> [--format json|plain]
```

Accepts either a Torre opportunity ID (e.g. `Yd6mq4kw`) or a full URL (`https://torre.ai/post/Yd6mq4kw` or `https://torre.co/post/Yd6mq4kw`).

## Output Schema (Normalized)

```json
{
  "id": "Yd6mq4kw",
  "title": "Fullstack - Python Engineer",
  "company": "Cognits an HTEC Company",
  "location": "Colombia, Guatemala (Remote)",
  "date": "2025-08-29",
  "salary": "USD 3,500 - 5,500 / month",
  "url": "https://torre.ai/post/Yd6mq4kw",
  "skills": ["Python", "JavaScript", "Docker", "Unit testing"]
}
```
