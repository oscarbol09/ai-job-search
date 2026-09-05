---
name: spe-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search official government and public
  job listings in Colombia from the Servicio Público de Empleo (SPE Colombia /
  buscadordeempleo.gov.co), the centralized national employment network of the
  Ministry of Labor. Invoke for public sector jobs, certified agency vacancies
  (Cajas de Compensación: Compensar, Colsubsidio, Comfama, Cafam; SENA; alcaldías;
  and corporate partners), across all municipalities and departments in Colombia.
  Trigger phrases: servicio publico de empleo, spe, spe colombia, empleo publico colombia,
  buscadordeempleo, vacantes sena, vacantes alcaldia, trabajo gobierno colombia,
  buscar empleo publico colombia.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/spe-search/cli/src/cli.ts *)
---

# Servicio Público de Empleo (SPE Colombia) Search Skill

Search official Colombian public and private job listings from the **Servicio Público de Empleo** (`www.buscadordeempleo.gov.co` / `serviciodeempleo.gov.co`), the national network run by the Ministry of Labor of Colombia.
Direct JSON API consumption — **zero scraping, zero authentication, no API key required**, and **zero runtime dependencies** (runs with pure TypeScript on `bun`).

> Centralizes over 200,000 active vacancies across all 32 departments and 1,100+ municipalities of Colombia,
> aggregating job offerings from Cajas de Compensación (Compensar, Colsubsidio, Comfama, Comfenalco),
> SENA, universities, and registered employment agencies.

## When to use this skill

- Search for official and verified job vacancies across Colombia
- Filter vacancies by city, municipality, department, or keyword
- Filter by salary range in COP and contract type
- Retrieve official agency provider links (Cajas de Compensación, SENA, universities)

## Commands

### 1. Search job listings

```bash
bun run .agents/skills/spe-search/cli/src/cli.ts search --query "<text>" [flags]
```

Flags:
- `--query, -q <text>`: Keywords, role, skill, or municipality (e.g. `"ingeniero"`, `"desarrollador"`, `"contador"`, `"Bogotá"`). **Required**.
- `--department, -d <text>`: Department filter (e.g. `"Antioquia"`, `"Cundinamarca"`, `"Valle del Cauca"`).
- `--page, -p <n>`: 1-indexed page number (default `1`).
- `--limit, -n <n>`: Cap results emitted (default `20`, max `50`).
- `--format <fmt>`: `json` (default) | `table` | `plain`.

### 2. Fetch job detail

```bash
bun run .agents/skills/spe-search/cli/src/cli.ts detail <codigo-vacante-or-url> [--format json|plain]
```

Accepts either a SPE vacancy code (e.g. `1886761088`) or an agency detail URL.

## Output Schema (Normalized)

```json
{
  "id": "1886761088",
  "title": "Ingeniero de desarrollo Full Stack",
  "company": "POLITECNICO GRAN COLOMBIANO",
  "location": "BOGOTÁ, D.C.",
  "date": "2026-09-02",
  "deadline": "2026-11-01",
  "salary": "$4.000.001 - $6.000.000",
  "url": "https://www.buscadordeempleo.gov.co/#/home",
  "contractType": "Por obra o labor"
}
```
