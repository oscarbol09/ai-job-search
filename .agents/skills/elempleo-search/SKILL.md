---
name: elempleo-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search job listings on El Empleo
  Colombia (elempleo.com/co), one of the largest corporate job boards in
  Colombia, or look up a specific El Empleo posting. Invoke for vacancies, open
  positions, and hiring in Colombia: Bogotá, Medellín, Cali, Barranquilla, Bucaramanga,
  remote, and any city or sector (software, engineering, finance, healthcare, operations).
  Trigger phrases: elempleo, elempleo colombia, el empleo colombia, ofertas elempleo,
  vacantes elempleo, buscar trabajo colombia, empleos colombia, "are there any X jobs in colombia",
  look up this elempleo posting.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/elempleo-search/cli/src/cli.ts *)
---

# El Empleo Colombia Search Skill

Search live job listings from **El Empleo Colombia** (`www.elempleo.com/co`).
No authentication, no API key, and **zero runtime dependencies** — runs with just `bun`.

> Colombia-market portal skill providing native coverage of corporate, engineering,
> tech, and administrative vacancies alongside `computrabajo-search`.

## ⚠️ Personal use only

This uses El Empleo's public pages; automated access is against the portal's terms,
so **keep volume low and don't use it commercially or for bulk data collection.** Run it
on your own responsibility. The CLI respects rate limits and backs off on 429/5xx.

## When to use this skill

- Search for job openings in Colombia across any city or sector
- Filter jobs by city (`--location "Bogotá"`, `"Medellín"`, `"Cali"`, etc.)
- Filter jobs by posting recency (`--jobage 1`, `7`, `14`, `30`)
- Get full posting details (description, requirements, salary range in COP, contract type)

## Commands

### 1. Search job listings

```bash
bun run .agents/skills/elempleo-search/cli/src/cli.ts search --query "<text>" [flags]
```

Flags:
- `--query, -q <text>`: Keywords (job title, skill, technology). **Required**.
- `--location, -l <text>`: City or department (e.g. `"Bogotá"`, `"Medellín"`, `"Cali"`, `"Barranquilla"`).
- `--jobage <days>`: Max age in days (`1`, `7`, `14`, `30`).
- `--page, -p <n>`: 1-indexed page number (default `1`).
- `--limit, -n <n>`: Cap results emitted (client-side).
- `--format <fmt>`: `json` (default) | `table` | `plain`.

### 2. Fetch job detail

```bash
bun run .agents/skills/elempleo-search/cli/src/cli.ts detail <url> [--format json|plain]
```

The `<url>` must be the full job posting URL from search results (e.g. `https://www.elempleo.com/co/ofertas-trabajo/<slug>-<id>`).
Extracts structured data from official `JobPosting` JSON-LD: title, company, description, salary in COP, deadline, and contract type.

## Output contract

Emits the standard `/scrape` Step 2 fields (`id`, `title`, `company`, `location`, `date`, `url`, `salary`, `deadline`) for seamless pipeline integration with `/scrape`, `/rank`, and `/apply`.
