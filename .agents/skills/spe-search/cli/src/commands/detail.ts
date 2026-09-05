import {
  API_BASE_URL,
  WEB_PORTAL_URL,
  apiFetch,
  extractSpeCode,
  formatSpeLocation,
  formatIsoDate,
  writeError,
  type SpeJobDetail,
} from "../helpers.js"

export interface DetailOpts {
  input: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const code = extractSpeCode(opts.input)
  if (!code) {
    writeError("Missing or invalid vacancy code / URL", "INVALID_INPUT")
    return 1
  }

  try {
    const url = `${API_BASE_URL}?page=1&BUSQUEDA=${encodeURIComponent(code)}`
    const response = await apiFetch<any>(url)

    if (!response || !Array.isArray(response.resultados) || response.resultados.length === 0) {
      writeError(`Vacancy not found for code: ${code}`, "JOB_NOT_FOUND")
      return 1
    }

    const match = response.resultados.find((r: any) => String(r.CODIGO_VACANTE) === code) || response.resultados[0]
    const providersList = Array.isArray(match.DETALLES_PRESTADOR) ? match.DETALLES_PRESTADOR : []
    const primaryProvider = providersList.length > 0 ? providersList[0].NOMBRE_PRESTADOR : null
    const directUrl = providersList.length > 0 && providersList[0].URL_DETALLE_VACANTE ? providersList[0].URL_DETALLE_VACANTE : WEB_PORTAL_URL

    const detail: SpeJobDetail = {
      id: String(match.CODIGO_VACANTE || code),
      title: match.TITULO_VACANTE || match.CARGO || "",
      company: primaryProvider,
      location: formatSpeLocation(match.MUNICIPIO, match.DEPARTAMENTO),
      date: formatIsoDate(match.FECHA_PUBLICACION),
      deadline: formatIsoDate(match.FECHA_VENCIMIENTO),
      salary: match.RANGO_SALARIAL || null,
      url: directUrl,
      contractType: match.TIPO_CONTRATO || null,
      experienceMonths: match.MESES_EXPERIENCIA_CARGO !== undefined ? Number(match.MESES_EXPERIENCIA_CARGO) : null,
      description: match.DESCRIPCION_VACANTE || null,
      educationLevel: match.NIVEL_ESTUDIOS || null,
      vacanciesCount: match.CANTIDAD_VACANTES ? Number(match.CANTIDAD_VACANTES) : 1,
      economicSector: match.SECTOR_ECONOMICO || null,
      providers: providersList.map((p: any) => ({
        name: p.NOMBRE_PRESTADOR,
        url: p.URL_DETALLE_VACANTE,
      })),
    }

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    } else {
      process.stdout.write(`Title:       ${detail.title}\n`)
      process.stdout.write(`ID:          ${detail.id}\n`)
      process.stdout.write(`Provider:    ${detail.company || "SPE Prestador"}\n`)
      process.stdout.write(`Location:    ${detail.location}\n`)
      if (detail.salary) process.stdout.write(`Salary:      ${detail.salary}\n`)
      if (detail.contractType) process.stdout.write(`Contract:    ${detail.contractType}\n`)
      if (detail.educationLevel) process.stdout.write(`Education:   ${detail.educationLevel}\n`)
      if (detail.experienceMonths !== null && detail.experienceMonths !== undefined) {
        process.stdout.write(`Experience:  ${detail.experienceMonths} months\n`)
      }
      if (detail.economicSector) process.stdout.write(`Sector:      ${detail.economicSector}\n`)
      if (detail.date) process.stdout.write(`Published:   ${detail.date}\n`)
      if (detail.deadline) process.stdout.write(`Deadline:    ${detail.deadline}\n`)
      process.stdout.write(`URL:         ${detail.url}\n`)
      process.stdout.write(`\n--- DESCRIPTION ---\n`)
      process.stdout.write(`${detail.description || "(No description provided)"}\n`)
      if (detail.providers && detail.providers.length > 0) {
        process.stdout.write(`\n--- REGISTERED AGENCIES / PROVIDERS ---\n`)
        for (const p of detail.providers) {
          process.stdout.write(`- ${p.name}: ${p.url}\n`)
        }
      }
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
