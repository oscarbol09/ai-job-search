#!/usr/bin/env bun
import { runSearch } from "./commands/search.js"
import { runDetail } from "./commands/detail.js"
import { writeError } from "./helpers.js"

const VERSION = "1.0.0"

const USAGE = `ticjob-search CLI v${VERSION}

Usage:
  bun run cli.ts search --query <text> [options]
  bun run cli.ts detail <url-or-id> [options]

Commands:
  search                Search tech vacancies on Ticjob Colombia
  detail                Fetch vacancy detail

Search Options:
  --query, -q <text>    Keywords or job title (required)
  --limit, -n <n>       Max results to return (default: 20)
  --format <fmt>        Output format: json (default), table, plain

Detail Options:
  --format <fmt>        Output format: json (default), plain
`

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE)
    process.exit(0)
  }

  const command = args[0]
  const rest = args.slice(1)

  if (command === "search") {
    let query = ""
    let limit = 20
    let format: "json" | "table" | "plain" = "json"

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i]
      if (arg === "--query" || arg === "-q") query = rest[++i] || ""
      else if (arg === "--limit" || arg === "-n") limit = parseInt(rest[++i], 10) || 20
      else if (arg === "--format") {
        const fmt = rest[++i]
        if (fmt === "json" || fmt === "table" || fmt === "plain") format = fmt
      }
    }

    if (!query) {
      writeError("Missing required flag: --query, -q", "MISSING_QUERY")
      process.exit(1)
    }

    const code = await runSearch({ query, limit, format })
    process.exit(code)
  }

  if (command === "detail") {
    let input = ""
    let format: "json" | "plain" = "json"
    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i]
      if (arg === "--format") {
        const fmt = rest[++i]
        if (fmt === "json" || fmt === "plain") format = fmt
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
  process.exit(1)
}

main().catch((err) => {
  writeError(err.message || String(err), "UNCAUGHT_ERROR")
  process.exit(1)
})
