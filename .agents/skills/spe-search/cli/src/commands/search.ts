import {
  API_BASE_URL,
  WEB_PORTAL_URL,
  apiFetch,
  writeError,
  formatSpeLocation,
  formatIsoDate,
  type SpeJobCard,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  department?: string
  page: number
  limit: number
  format: "json" | "table" | "plain"
}

export function buildSearchUrl(opts: SearchOpts): string {
  const url = new URL(API_BASE_URL)
  url.searchParams.set("page", String(opts.page))
  url.searchParams.set("BUSQUEDA", opts.query)
  if (opts.department) {
    url.searchParams.set("DEPARTAMENTO", opts.department)
  }
  return url.toString()
}

function renderTable(cards: SpeJobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 36).padEnd(36)
    const company = (c.company || "SPE Prestador").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 20).padEnd(20)
    const sal = (c.salary || "—").slice(0, 22).padEnd(22)
    const date = c.date || "—"
    return `${c.id.padEnd(12)} ${title} ${company} ${loc} ${sal} ${date}`
  })
  const header =
    "ID".padEnd(12) +
    " " +
    "TITLE".padEnd(36) +
    " " +
    "PROVIDER/COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(20) +
    " " +
    "SALARY".padEnd(22) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildSearchUrl(opts)
    const response = await apiFetch<any>(url)

    if (!response || !Array.isArray(response.resultados)) {
      writeError("Invalid response from SPE API", "INVALID_RESPONSE")
      return 1
    }

    const cards: SpeJobCard[] = response.resultados.slice(0, opts.limit).map((r: any) => {
      const providers = Array.isArray(r.DETALLES_PRESTADOR) ? r.DETALLES_PRESTADOR : []
      const primaryProvider = providers.length > 0 ? providers[0].NOMBRE_PRESTADOR : null
      const directUrl = providers.length > 0 && providers[0].URL_DETALLE_VACANTE ? providers[0].URL_DETALLE_VACANTE : WEB_PORTAL_URL

      return {
        id: String(r.CODIGO_VACANTE || ""),
        title: r.TITULO_VACANTE || r.CARGO || "",
        company: primaryProvider,
        location: formatSpeLocation(r.MUNICIPIO, r.DEPARTAMENTO),
        date: formatIsoDate(r.FECHA_PUBLICACION),
        deadline: formatIsoDate(r.FECHA_VENCIMIENTO),
        salary: r.RANGO_SALARIAL || null,
        url: directUrl,
        contractType: r.TIPO_CONTRATO || null,
        experienceMonths: r.MESES_EXPERIENCIA_CARGO !== undefined ? Number(r.MESES_EXPERIENCIA_CARGO) : null,
      }
    })

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(cards, null, 2) + "\n")
    } else if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else {
      for (const card of cards) {
        process.stdout.write(`• ${card.title}\n`)
        process.stdout.write(`  ID:        ${card.id}\n`)
        process.stdout.write(`  Provider:  ${card.company || "SPE Prestador"}\n`)
        process.stdout.write(`  Location:  ${card.location}\n`)
        if (card.salary) process.stdout.write(`  Salary:    ${card.salary}\n`)
        if (card.contractType) process.stdout.write(`  Contract:  ${card.contractType}\n`)
        if (card.date) process.stdout.write(`  Published: ${card.date}\n`)
        if (card.deadline) process.stdout.write(`  Deadline:  ${card.deadline}\n`)
        process.stdout.write(`  URL:       ${card.url}\n\n`)
      }
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
