import {
  BASE_URL,
  htmlFetch,
  parseJobCards,
  writeError,
  type ElempleoJobCard,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

export function buildSearchUrl(opts: SearchOpts): string {
  const url = new URL("/co/ofertas-empleo", BASE_URL)
  url.searchParams.set("q", opts.query)
  if (opts.location) {
    url.searchParams.set("l", opts.location)
  }
  if (opts.jobage !== undefined) {
    url.searchParams.set("fecha", String(opts.jobage))
  }
  if (opts.page > 1) {
    url.searchParams.set("pag", String(opts.page))
  }
  return url.toString()
}

function renderTable(cards: ElempleoJobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 38).padEnd(38)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 18).padEnd(18)
    const sal = (c.salary || "—").slice(0, 20).padEnd(20)
    const date = c.date || "—"
    return `${c.id.padEnd(11)} ${title} ${company} ${loc} ${sal} ${date}`
  })
  const header =
    "ID".padEnd(11) +
    " " +
    "TITLE".padEnd(38) +
    " " +
    "COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(18) +
    " " +
    "SALARY".padEnd(20) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildSearchUrl(opts)
    const html = await htmlFetch(url)
    let cards = parseJobCards(html)

    if (opts.limit !== undefined && opts.limit >= 0) {
      cards = cards.slice(0, opts.limit)
    }

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.salary || "Salario no especificado"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: cards.length,
              page: opts.page,
            },
            results: cards,
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    writeError(`Search failed: ${msg}`, "API_ERROR")
    return 1
  }
}
