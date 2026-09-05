#!/usr/bin/env bun
// Self-contained CLI for searching jobs on El Empleo Colombia (elempleo.com/co).
// Zero runtime dependencies, runs with native Bun.
// Respects robots.txt and includes exponential backoff on rate limits.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

const KNOWN_SEARCH_FLAGS = new Set([
  "query",
  "q",
  "location",
  "l",
  "jobage",
  "page",
  "p",
  "limit",
  "n",
  "format",
  "help",
  "h",
])

const KNOWN_DETAIL_FLAGS = new Set(["format", "help", "h"])

function parseFlags(argv: string[]): { flags: Flags; rawFlags: string[] } {
  const flags: Flags = { _: [] }
  const rawFlags: string[] = []
  const alias: Record<string, string> = {
    q: "query",
    l: "location",
    p: "page",
    n: "limit",
    h: "help",
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const rawName = a.replace(/^-+/, "")
      rawFlags.push(rawName)
      const key = alias[rawName] ?? rawName
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return { flags, rawFlags }
}

const HELP = `elempleo-cli — search jobs on El Empleo Colombia (www.elempleo.com/co)

USAGE
  bun run src/cli.ts search --query "<text>" [flags]
  bun run src/cli.ts detail <url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>        Keywords (job title, skill). REQUIRED, e.g. "desarrollador python"
  --location, -l <text>     City or department, e.g. "Bogotá", "Medellín", "Cali"
  --jobage <days>           Max age in days: 1, 7, 14, 30
  --page, -p <n>            1-indexed page number (default 1)
  --limit, -n <n>           Cap results emitted (client-side)
  --format <fmt>            json (default) | table | plain

EXAMPLES
  bun run src/cli.ts search -q "ingeniero software" --location "Bogotá" --format table
  bun run src/cli.ts search -q "analista de datos" --jobage 7 -n 5
  bun run src/cli.ts detail "https://www.elempleo.com/co/ofertas-trabajo/desarrollador-fullstack-1886762593" --format plain
`

function validateIntFlag(name: string, raw: unknown, min = 0): number | null {
  if (raw === undefined) return null
  const str = String(raw).trim()
  if (!/^-?\d+$/.test(str)) {
    writeError(`--${name} must be an integer, got "${raw}"`, "BAD_ARG")
    return -1
  }
  const val = parseInt(str, 10)
  if (val < min) {
    writeError(`--${name} must be at least ${min}, got ${val}`, "BAD_ARG")
    return -1
  }
  return val
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const { flags, rawFlags } = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    // Unknown flag guard (reject undefined flags, single or double dash)
    for (const raw of rawFlags) {
      if (!KNOWN_SEARCH_FLAGS.has(raw)) {
        writeError(`Unknown flag: --${raw}`, "BAD_ARG")
        return 1
      }
    }

    const query = typeof flags.query === "string" ? flags.query.trim() : undefined
    if (!query) {
      writeError("the --query/-q flag is required (e.g. -q \"desarrollador python\")", "NO_QUERY")
      return 1
    }

    const location = typeof flags.location === "string" ? flags.location.trim() : undefined

    let page = 1
    if (flags.page !== undefined) {
      const p = validateIntFlag("page", flags.page, 1)
      if (p === -1) return 1
      if (p !== null) page = p
    }

    let limit: number | undefined = undefined
    if (flags.limit !== undefined) {
      const l = validateIntFlag("limit", flags.limit, 0)
      if (l === -1) return 1
      if (l !== null) limit = l
    }

    let jobage: number | undefined = undefined
    if (flags.jobage !== undefined) {
      const j = validateIntFlag("jobage", flags.jobage, 1)
      if (j === -1) return 1
      if (j !== null) jobage = j
    }

    const fmt = (flags.format as string) || "json"
    if (!["json", "table", "plain"].includes(fmt)) {
      writeError(`Invalid format "${fmt}". Must be json, table, or plain.`, "BAD_ARG")
      return 1
    }

    const opts: SearchOpts = {
      query,
      location,
      jobage,
      page,
      limit,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    for (const raw of rawFlags) {
      if (!KNOWN_DETAIL_FLAGS.has(raw)) {
        writeError(`Unknown flag: --${raw}`, "BAD_ARG")
        return 1
      }
    }

    const input = (flags._ as string[])[1]
    if (!input) {
      writeError("detail requires a <url>", "NO_ID")
      return 1
    }

    const fmt = (flags.format as string) || "json"
    if (!["json", "plain"].includes(fmt)) {
      writeError(`Invalid format "${fmt}". Must be json or plain.`, "BAD_ARG")
      return 1
    }

    const opts: DetailOpts = {
      input,
      format: fmt as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  writeError(`Unknown command "${cmd}"`, "BAD_CMD")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    writeError(e instanceof Error ? e.message : String(e), "INTERNAL_ERROR")
    process.exit(1)
  })
