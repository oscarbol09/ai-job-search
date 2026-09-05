#!/usr/bin/env bun
import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { writeError } from "./helpers.js"

const VERSION = "1.0.0"

const USAGE = `torre-search CLI v${VERSION}

Usage:
  bun run cli.ts search --query <text> [options]
  bun run cli.ts detail <url-or-id> [options]

Commands:
  search                Search job opportunities on Torre
  detail                Fetch full opportunity detail

Search Options:
  --query, -q <text>    Keywords, skills, or job title (required)
  --location, -l <text> Filter by country or location (e.g. "Colombia")
  --remote              Filter only remote opportunities
  --page, -p <n>        1-indexed page number (default: 1)
  --limit, -n <n>       Max results to return (default: 20, max: 50)
  --format <fmt>        Output format: json (default), table, plain

Detail Options:
  --format <fmt>        Output format: json (default), plain

General:
  --help, -h            Show this help text
  --version, -v         Show version
`

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE)
    process.exit(0)
  }

  if (args.includes("--version") || args.includes("-v")) {
    process.stdout.write(`torre-search v${VERSION}\n`)
    process.exit(0)
  }

  const command = args[0]
  const rest = args.slice(1)

  if (command === "search") {
    let query = ""
    let location: string | undefined
    let remote = false
    let page = 1
    let limit = 20
    let format: "json" | "table" | "plain" = "json"

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i]
      if (arg === "--query" || arg === "-q") {
        query = rest[++i] || ""
      } else if (arg === "--location" || arg === "-l") {
        location = rest[++i]
      } else if (arg === "--remote") {
        remote = true
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

    const code = await runSearch({ query, location, remote, page, limit, format })
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
      writeError("Missing required argument: <url-or-id>", "MISSING_INPUT")
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
