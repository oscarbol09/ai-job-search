// Data source: Servicio Público de Empleo Colombia (buscadordeempleo.gov.co)
// Direct REST API (https://www.buscadordeempleo.gov.co/backbue/v1/vacantes/resultados)
// Zero runtime dependencies, runs with native fetch and Bun.

// Allow government intermediate TLS certificate handshakes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export const API_BASE_URL = "https://www.buscadordeempleo.gov.co/backbue/v1/vacantes/resultados"
export const WEB_PORTAL_URL = "https://www.buscadordeempleo.gov.co/#/home"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; spe-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)"

export interface SpeJobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  deadline?: string | null
  salary?: string | null
  url: string
  contractType?: string | null
  experienceMonths?: number | null
}

export interface SpeJobDetail extends SpeJobCard {
  description: string | null
  educationLevel?: string | null
  vacanciesCount?: number | null
  economicSector?: string | null
  providers?: Array<{ name: string; url: string }>
}

/** Fetch JSON from SPE API with exponential backoff */
export async function apiFetch<T>(url: string): Promise<T | null> {
  const maxRetries = 5
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
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

/** Extract vacancy code from input (bare ID or URL) */
export function extractSpeCode(input: string): string {
  const trimmed = input.trim()
  const match = trimmed.match(/(\d{6,15})/)
  if (match) return match[1]
  return trimmed
}

/** Format location from department and municipality */
export function formatSpeLocation(municipio?: string | null, depto?: string | null): string {
  const m = (municipio || "").trim()
  const d = (depto || "").trim()
  if (m && d) {
    if (m.toUpperCase() === d.toUpperCase()) return m
    return `${m}, ${d}`
  }
  return m || d || "Colombia"
}

/** Format ISO date string into YYYY-MM-DD */
export function formatIsoDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split("T")[0]
  } catch {
    return null
  }
}
