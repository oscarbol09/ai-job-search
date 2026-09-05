import {
  SEARCH_API_URL,
  POST_BASE_URL,
  apiFetch,
  writeError,
  formatCompensation,
  formatLocation,
  formatIsoDate,
  type TorreJobCard,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  remote?: boolean
  page: number
  limit: number
  format: "json" | "table" | "plain"
}

export function buildSearchPayload(opts: SearchOpts): any {
  const andClauses: any[] = [
    {
      "skill/role": {
        text: opts.query,
        experience: "potential-to-develop",
      },
    },
    {
      status: {
        code: "open",
      },
    },
  ]

  if (opts.location && opts.location.toLowerCase() !== "remote") {
    andClauses.push({
      location: {
        term: opts.location,
      },
    })
  }

  return {
    and: andClauses,
  }
}

function renderTable(cards: TorreJobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 36).padEnd(36)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const sal = (c.salary || "—").slice(0, 22).padEnd(22)
    const date = c.date || "—"
    return `${c.id.padEnd(10)} ${title} ${company} ${loc} ${sal} ${date}`
  })
  const header =
    "ID".padEnd(10) +
    " " +
    "TITLE".padEnd(36) +
    " " +
    "COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(22) +
    " " +
    "SALARY".padEnd(22) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const limit = Math.max(1, Math.min(opts.limit, 50))
    const offset = Math.max(0, (opts.page - 1) * limit)
    const url = `${SEARCH_API_URL}/?size=${limit}&offset=${offset}`
    const payload = buildSearchPayload(opts)

    const response = await apiFetch<any>(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    })

    if (!response || !Array.isArray(response.results)) {
      writeError("Invalid response from Torre search API", "INVALID_RESPONSE")
      return 1
    }

    const cards: TorreJobCard[] = response.results.map((r: any) => {
      const org = Array.isArray(r.organizations) && r.organizations[0] ? r.organizations[0] : null
      const isRemote = Boolean(r.remote)
      const skills = Array.isArray(r.skills) ? r.skills.map((s: any) => s.name).filter(Boolean) : []
      return {
        id: r.id,
        title: r.objective || "",
        company: org ? org.name : null,
        location: formatLocation(r.locations, isRemote),
        date: formatIsoDate(r.created),
        url: `${POST_BASE_URL}/${r.id}`,
        salary: formatCompensation(r.compensation),
        remote: isRemote,
        skills: skills.slice(0, 8),
      }
    })

    // Filter remote client-side if explicitly requested
    const filtered = opts.remote ? cards.filter((c) => c.remote) : cards

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(filtered, null, 2) + "\n")
    } else if (opts.format === "table") {
      process.stdout.write(renderTable(filtered) + "\n")
    } else {
      for (const card of filtered) {
        process.stdout.write(`• ${card.title}\n`)
        process.stdout.write(`  Company:  ${card.company || "Unknown"}\n`)
        process.stdout.write(`  Location: ${card.location}\n`)
        if (card.salary) process.stdout.write(`  Salary:   ${card.salary}\n`)
        if (card.date) process.stdout.write(`  Date:     ${card.date}\n`)
        if (card.skills && card.skills.length > 0) {
          process.stdout.write(`  Skills:   ${card.skills.join(", ")}\n`)
        }
        process.stdout.write(`  URL:      ${card.url}\n\n`)
      }
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
