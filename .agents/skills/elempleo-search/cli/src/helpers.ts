// Data source: El Empleo Colombia public pages (www.elempleo.com/co).
// Search returns an HTML list of job cards (`div.result-item`); detail returns
// single offer HTML embedding official schema.org JobPosting JSON-LD.
// Zero runtime dependencies, runs with native fetch and Bun.

export const BASE_URL = "https://www.elempleo.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; elempleo-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
      },
      redirect: "follow",
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
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface ElempleoJobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  date: string | null
  url: string
  salary?: string | null
}

export interface ElempleoJobDetail extends ElempleoJobCard {
  description: string | null
  salary: string | null
  applyUrl: string | null
  deadline: string | null
  employmentType?: string | null
}

export function decodeHtmlEntities(text: string): string {
  if (!text) return ""
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16))
      } catch {
        return ""
      }
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10))
      } catch {
        return ""
      }
    })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
}

export function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim()
}

/** Convert Spanish relative date ("Hoy", "Ayer", "Hace N días", etc.) to ISO YYYY-MM-DD */
export function relativeDateToISO(raw: string | null | undefined, now = new Date()): string | null {
  if (!raw) return null
  const clean = decodeHtmlEntities(raw).replace(/\s+/g, " ").trim()
  if (!clean) return null

  // If already ISO YYYY-MM-DD or YYYY-M-D
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, "0")
    const d = isoMatch[3].padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const lower = clean.toLowerCase()

  if (lower.startsWith("hoy") || lower.includes("hace un momento") || /hace\s+\d+\s+(minuto|hora)/.test(lower)) {
    return base.toISOString().slice(0, 10)
  }
  if (lower.startsWith("ayer")) {
    base.setUTCDate(base.getUTCDate() - 1)
    return base.toISOString().slice(0, 10)
  }

  const daysMatch = lower.match(/hace\s+(\d+)\s+d[ií]as?/)
  if (daysMatch) {
    base.setUTCDate(base.getUTCDate() - parseInt(daysMatch[1], 10))
    return base.toISOString().slice(0, 10)
  }

  const weeksMatch = lower.match(/hace\s+(\d+)\s+semanas?/)
  if (weeksMatch) {
    base.setUTCDate(base.getUTCDate() - parseInt(weeksMatch[1], 10) * 7)
    return base.toISOString().slice(0, 10)
  }

  const monthsMatch = lower.match(/hace\s+(\d+)\s+mes(es)?/)
  if (monthsMatch) {
    base.setUTCDate(base.getUTCDate() - parseInt(monthsMatch[1], 10) * 30)
    return base.toISOString().slice(0, 10)
  }

  const yearsMatch = lower.match(/hace\s+(\d+)\s+a[nñ]os?/)
  if (yearsMatch) {
    base.setUTCDate(base.getUTCDate() - parseInt(yearsMatch[1], 10) * 365)
    return base.toISOString().slice(0, 10)
  }

  return null
}

/** Parse search result page cards */
export function parseJobCards(html: string): ElempleoJobCard[] {
  const cards: ElempleoJobCard[] = []
  // Split on result-item boundaries
  const itemMatches = html.split(/<div[^>]+class="[^"]*result-item[^"]*"[^>]*>/i)

  for (let i = 1; i < itemMatches.length; i++) {
    const chunk = itemMatches[i]
    let id: string | null = null
    let title: string | null = null
    let company: string | null = null
    let location: string | null = null
    let salary: string | null = null
    let url: string | null = null

    // Method 1: parse data-ga4-offerdata JSON attribute
    const ga4Match = chunk.match(/data-ga4-offerdata="([^"]+)"/i)
    if (ga4Match) {
      try {
        const decodedJson = decodeHtmlEntities(ga4Match[1])
        const data = JSON.parse(decodedJson)
        if (data.id) id = String(data.id)
        if (data.title) title = decodeHtmlEntities(String(data.title)).trim()
        if (data.company) company = decodeHtmlEntities(String(data.company)).trim()
        if (data.location) location = decodeHtmlEntities(String(data.location)).trim()
        if (data.salary) salary = decodeHtmlEntities(String(data.salary)).trim()
      } catch {
        // ignore and use html fallbacks
      }
    }

    // URL from data-url or title link
    const urlMatch = chunk.match(/data-url="([^"]+)"/i) ?? chunk.match(/href="([^"]*\/ofertas-trabajo\/[^"]+)"/i)
    if (urlMatch) {
      const rel = urlMatch[1].trim()
      url = rel.startsWith("http") ? rel : `${BASE_URL}${rel}`
      if (!id) {
        const idM = rel.match(/-(\d{8,12})(?:\?|#|$)/)
        if (idM) id = idM[1]
      }
    }

    // Title fallback
    if (!title) {
      const titleMatch = chunk.match(/<a[^>]+class="[^"]*js-offer-title[^"]*"[^>]*>(.*?)<\/a>/is)
      if (titleMatch) title = stripHtml(titleMatch[1])
    }

    // Company fallback
    if (!company) {
      const compMatch = chunk.match(/class="[^"]*js-offer-company[^"]*"[^>]*>(.*?)<\/span>/is)
      if (compMatch) company = stripHtml(compMatch[1])
    }

    // Location fallback
    if (!location) {
      const locMatch = chunk.match(/class="[^"]*js-offer-city[^"]*"[^>]*>(.*?)<\/span>/is)
      if (locMatch) location = stripHtml(locMatch[1])
    }

    // Date from .js-offer-date
    let date: string | null = null
    const dateMatch = chunk.match(/class="[^"]*js-offer-date[^"]*"[^>]*>(.*?)<\/span>/is)
    if (dateMatch) {
      const dateText = stripHtml(dateMatch[1])
      date = relativeDateToISO(dateText)
    }

    if (id && title && url) {
      cards.push({
        id,
        title,
        company: company || null,
        companyUrl: null,
        location: location || null,
        date,
        url,
        salary: salary || null,
      })
    }
  }

  return cards
}

/** Parse full detail page for single offer */
export function parseJobDetail(html: string, fallbackUrl = ""): ElempleoJobDetail {
  let id = idFromUrl(fallbackUrl) || ""
  let title: string | null = null
  let company: string | null = null
  let location: string | null = null
  let date: string | null = null
  let deadline: string | null = null
  let description: string | null = null
  let salary: string | null = null
  let employmentType: string | null = null

  // 1. Primary extraction: JobPosting JSON-LD
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
  for (const match of jsonLdMatches) {
    try {
      const raw = match[1].trim()
      const data = JSON.parse(raw)
      if (data["@type"] === "JobPosting") {
        if (data.title) title = decodeHtmlEntities(String(data.title)).trim()
        if (data.description) description = decodeHtmlEntities(String(data.description)).trim()
        if (data.datePosted) date = relativeDateToISO(data.datePosted)
        if (data.validThrough) deadline = relativeDateToISO(data.validThrough)
        if (data.employmentType) employmentType = String(data.employmentType).trim()

        if (data.hiringOrganization && typeof data.hiringOrganization === "object") {
          const org = data.hiringOrganization as Record<string, unknown>
          if (org.name) company = decodeHtmlEntities(String(org.name)).trim()
        }

        if (data.jobLocation && typeof data.jobLocation === "object") {
          const locObj = data.jobLocation as Record<string, unknown>
          const addr = locObj.address as Record<string, unknown> | undefined
          if (addr && typeof addr === "object") {
            const locParts = [addr.addressRegion, addr.addressLocality].filter(Boolean).map(String)
            if (locParts.length > 0) {
              location = decodeHtmlEntities(locParts.join(", ")).trim()
            }
          }
        }

        if (data.baseSalary && typeof data.baseSalary === "object") {
          const salObj = data.baseSalary as Record<string, unknown>
          const cur = salObj.currency ? String(salObj.currency) : "COP"
          const val = salObj.value as Record<string, unknown> | undefined
          if (val && typeof val === "object") {
            const min = val.minValue ? Number(val.minValue).toLocaleString("es-CO") : null
            const max = val.maxValue ? Number(val.maxValue).toLocaleString("es-CO") : null
            if (min && max) {
              salary = `$${min} a $${max} ${cur}`
            } else if (min || max) {
              salary = `$${min || max} ${cur}`
            }
          }
        }
        break
      }
    } catch {
      // ignore JSON parse error in script tag and fall back to HTML
    }
  }

  // 2. HTML fallbacks if JSON-LD missing or partial
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is)
    if (h1Match) title = stripHtml(h1Match[1])
  }

  if (!description) {
    const descMatch = html.match(/<div[^>]+class="[^"]*description-block[^"]*"[^>]*>(.*?)<\/div>/is)
    if (descMatch) description = stripHtml(descMatch[1])
  }

  if (!company) {
    const compMatch = html.match(/class="[^"]*js-offer-company[^"]*"[^>]*>(.*?)<\/span>/is)
    if (compMatch) company = stripHtml(compMatch[1])
  }

  if (!location) {
    const locMatch = html.match(/class="[^"]*js-offer-city[^"]*"[^>]*>(.*?)<\/span>/is)
    if (locMatch) location = stripHtml(locMatch[1])
  }

  if (!salary) {
    const salMatch = html.match(/class="[^"]*text-blue-petrol-dark[^"]*"[^>]*>(.*?)<\/div>/is)
    if (salMatch) {
      const s = stripHtml(salMatch[1])
      if (s) salary = s
    }
  }

  return {
    id: id || "unknown",
    title: title || "Unknown Title",
    company: company || null,
    companyUrl: null,
    location: location || null,
    date: date || null,
    deadline: deadline || null,
    url: fallbackUrl,
    description: description || null,
    salary: salary || null,
    applyUrl: fallbackUrl,
    employmentType: employmentType || null,
  }
}

/** Extract 8 to 12 digit numeric ID from Elempleo URL */
export function idFromUrl(url: string): string | null {
  const match = url.match(/-(\d{8,12})(?:\?|#|$)/)
  return match ? match[1] : null
}

/** Validate and normalize detail URL */
export function normalizeDetailUrl(urlOrId: string): string {
  const trimmed = urlOrId.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.split("#")[0]
  }
  if (trimmed.startsWith("/")) {
    return `${BASE_URL}${trimmed}`.split("#")[0]
  }
  // If user passed bare id or slug, require /co/ofertas-trabajo/
  if (/^\d{8,12}$/.test(trimmed)) {
    throw new Error(
      `Invalid URL: "${trimmed}". Elempleo detail URLs require the full URL with job slug (e.g. "https://www.elempleo.com/co/ofertas-trabajo/slug-${trimmed}").`
    )
  }
  return `${BASE_URL}/co/ofertas-trabajo/${trimmed}`.split("#")[0]
}
