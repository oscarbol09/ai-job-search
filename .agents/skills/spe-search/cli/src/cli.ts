#!/usr/bin/env bun
import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { writeError } from "./helpers.js"

const VERSION = "1.0.0"

const USAGE = `spe-search CLI v${VERSION}

Usage:
  bun run cli.ts search --query <text> [options]
  bun run cli.ts detail <codigo-or-url> [options]

Commands:
  search                  Search vacancies on Servicio Público de Empleo Colombia
  detail                  Fetch full vacancy details

Search Options:
  --query, -q <text>      Keywords, role, or municipality (required)
  --department, -d <text> Filter by department (e.g. "Antioquia", "Cundinamarca")
  --page, -p <n>          1-indexed page number (default: 1)
  --limit, -n <n>         Max results to return (default: 20, max: 50)
  --format <fmt>          Output format: json (default), table, plain

Detail Options:
  --format <fmt>          Output format: json (default), plain

General:
  --help, -h              Show this help text
  --version, -v           Show version
`

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE)
    process.exit(0)
  }

  if (args.includes("--version") || args.includes("-v")) {
    process.stdout.write(`spe-search v${VERSION}\n`)
    process.exit(0)
  }

  const command = args[0]
  const rest = args.slice(1)

  if (command === "search") {
    let query = ""
    let department: string | undefined
    let page = 1
    let limit = 20
    let format: "json" | "table" | "plain" = "json"

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i]
      if (arg === "--query" || arg === "-q") {
        query = rest[++i] || ""
      } else if (arg === "--department" || arg === "-d") {
        department = rest[++i]
      } else if (arg === "--page" || arg === "-p") {
        page = parseInt(rest[++i], 10) || 1
      } else if (arg === "--limit" || arg === "-n") {
        limit = parseInt(rest[++i], 10) || 20
      } else if (arg === "--format") {
        const fmt = rest[++i]
        if (fmt === "json" || fmt === "table" || fmt === "plain") {
          format = fmt
        }
      }
    }

    if (!query) {
      writeError("Missing required flag: --query, -q", "MISSING_QUERY")
      process.exit(1)
    }

    const code = await runSearch({ query, department, page, limit, format })
    process.exit(code)
  }

  if (command === "detail") {
    let input = ""
    let format: "json" | "plain" = "json"

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i]
      if (arg === "--format") {
        const fmt = rest[++i]
        if (fmt === "json" || fmt === "plain") {
          format = fmt
        }
      } else if (!arg.startsWith("-") && !input) {
        input = arg
      }
    }

    if (!input) {
      writeError("Missing required argument: <codigo-or-url>", "MISSING_INPUT")
      process.exit(1)
    }

    const code = await runDetail({ input, format })
    process.exit(code)
  }

  writeError(`Unknown command: ${command}`, "UNKNOWN_COMMAND")
  process.stdout.write(USAGE)
  process.exit(1)
}

main().catch((err) => {
  writeError(err.message || String(err), "UNCAUGHT_ERROR")
  process.exit(1)
})
