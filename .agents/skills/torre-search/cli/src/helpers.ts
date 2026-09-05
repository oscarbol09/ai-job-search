// Data source: Torre open public REST APIs (search.torre.co & torre.co/api/suite).
// Zero runtime dependencies, runs with native fetch and Bun.

export const SEARCH_API_URL = "https://search.torre.co/opportunities/_search"
export const DETAIL_API_URL = "https://torre.co/api/suite/opportunities"
export const POST_BASE_URL = "https://torre.ai/post"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; torre-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)"

export interface TorreJobCard {
  id: string
  title: string
  company: string | null
  companyUrl?: string | null
  location: string | null
  date: string | null
  url: string
  salary?: string | null
  remote?: boolean
  skills?: string[]
}

export interface TorreJobDetail extends TorreJobCard {
  description: string | null
  requirements?: string | null
  responsibilities?: string | null
  deadline?: string | null
  employmentType?: string | null
  applyUrl?: string | null
}

/** Fetch JSON with exponential backoff on 429/5xx. Returns null on 404. */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  const maxRetries = 5
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(15000),
    })

    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }

    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as T
  }
  throw new Error("Request failed after max retries")
}

/** Extract Torre opportunity ID from URL or bare ID string */
export function extractTorreId(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/(?:opportunities|post)\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  // If it's already an ID (alphanumeric string without slashes)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed
  }
  return trimmed
}

/** Format Torre compensation object into clean human-readable string */
export function formatCompensation(comp: any): string | null {
  if (!comp) return null
  const data = comp.data || comp
  const currency = data.currency || "USD"
  const periodicity = data.periodicity ? ` / ${data.periodicity}` : ""

  const min = data.minAmount !== undefined && data.minAmount !== null ? Number(data.minAmount) : null
  const max = data.maxAmount !== undefined && data.maxAmount !== null ? Number(data.maxAmount) : null

  if (min !== null && max !== null) {
    const minStr = min.toLocaleString("en-US")
    const maxStr = max.toLocaleString("en-US")
    return `${currency} ${minStr} - ${maxStr}${periodicity}`
  }
  if (min !== null) {
    return `${currency} ${min.toLocaleString("en-US")}+${periodicity}`
  }
  if (max !== null) {
    return `Up to ${currency} ${max.toLocaleString("en-US")}${periodicity}`
  }
  return null
}

/** Format location and remote status */
export function formatLocation(locations: string[] | undefined, isRemote?: boolean): string {
  const locList = (locations || []).filter(Boolean)
  const locStr = locList.length > 0 ? locList.join(", ") : "Anywhere"
  if (isRemote) {
    return locList.length > 0 ? `${locStr} (Remote)` : "Remote"
  }
  return locStr
}

/** Format ISO date string into YYYY-MM-DD */
export function formatIsoDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split("T")[0]
  } catch {
    return null
  }
}
