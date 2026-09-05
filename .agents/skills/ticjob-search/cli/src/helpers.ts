// Data source: Ticjob Colombia (ticjob.co)
// Server-rendered search listings + Schema.org JobPosting JSON-LD.
// Zero runtime dependencies, runs with native fetch and Bun.

export const BASE_URL = "https://ticjob.co"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; ticjob-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)"

export interface TicjobJobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  salary?: string | null
}

export interface TicjobJobDetail extends TicjobJobCard {
  description: string | null
  employmentType?: string | null
  deadline?: string | null
  skills?: string[]
}

/** Fetch HTML with exponential backoff */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 3
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      await new Promise((r) => setTimeout(r, delay))
      delay = Math.min(delay * 2, 4000)
      continue
    }

    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }
  throw new Error("Request failed after max retries")
}

/** Extract ID or URL */
export function extractTicjobId(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/\/(\d+)(?:[/?#]|$)/)
  if (match) return match[1]
  if (/^\d+$/.test(trimmed)) return trimmed
  return trimmed
}

/** Parse job cards from Ticjob search page HTML */
export function parseTicjobCards(html: string): TicjobJobCard[] {
  const cards: TicjobJobCard[] = []
  // Matches href="/es/search/job/<slug>/<id>" or full URL
  const linkRegex = /href="(\/es\/search\/job\/[a-zA-Z0-9_\-]+\/(\d+))"/g
  let match: RegExpExecArray | null
  const seenIds = new Set<string>()

  while ((match = linkRegex.exec(html)) !== null) {
    const rawPath = match[1]
    const id = match[2]
    if (seenIds.has(id)) continue
    seenIds.add(id)

    // Attempt to extract title slug converted to words
    const slugPart = rawPath.split("/")[4] || ""
    const title = slugPart.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

    cards.push({
      id,
      title: title || `Job ${id}`,
      company: "Empresa TI en Ticjob",
      location: "Colombia",
      date: null,
      url: `${BASE_URL}${rawPath}`,
    })
  }

  return cards
}
