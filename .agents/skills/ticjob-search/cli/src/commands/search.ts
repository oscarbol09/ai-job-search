import {
  BASE_URL,
  htmlFetch,
  parseTicjobCards,
  writeError,
  type TicjobJobCard,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  limit?: number
  format: "json" | "table" | "plain"
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = `${BASE_URL}/es/search?keywords=${encodeURIComponent(opts.query)}`
    const html = await htmlFetch(url)
    const cards = parseTicjobCards(html)
    const filtered = opts.limit ? cards.slice(0, opts.limit) : cards

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(filtered, null, 2) + "\n")
    } else if (opts.format === "table") {
      if (filtered.length === 0) {
        process.stdout.write("No results.\n")
        return 0
      }
      const header = "ID".padEnd(8) + " TITLE".padEnd(45) + " URL"
      const rows = filtered.map((c) => `${c.id.padEnd(8)} ${(c.title || "").slice(0, 42).padEnd(44)} ${c.url}`)
      process.stdout.write([header, "-".repeat(header.length + 30), ...rows].join("\n") + "\n")
    } else {
      for (const card of filtered) {
        process.stdout.write(`• ${card.title}\n`)
        process.stdout.write(`  ID:  ${card.id}\n`)
        process.stdout.write(`  URL: ${card.url}\n\n`)
      }
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
