import {
  DETAIL_API_URL,
  POST_BASE_URL,
  apiFetch,
  extractTorreId,
  formatCompensation,
  formatLocation,
  formatIsoDate,
  writeError,
  type TorreJobDetail,
} from "../helpers.js"

export interface DetailOpts {
  input: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = extractTorreId(opts.input)
  if (!id) {
    writeError("Missing or invalid job ID / URL", "INVALID_INPUT")
    return 1
  }

  try {
    const url = `${DETAIL_API_URL}/${encodeURIComponent(id)}`
    const data = await apiFetch<any>(url)

    if (!data) {
      writeError(`Job not found: ${id}`, "JOB_NOT_FOUND")
      return 1
    }

    const org = Array.isArray(data.organizations) && data.organizations[0] ? data.organizations[0] : null
    const place = data.place || {}
    const isRemote = Boolean(place.remote)
    const locations = Array.isArray(place.location)
      ? place.location.map((l: any) => l.countryName || l.id).filter(Boolean)
      : []

    const strengths = Array.isArray(data.strengths) ? data.strengths.map((s: any) => s.name).filter(Boolean) : []
    const details = Array.isArray(data.details) ? data.details : []

    const descItem = details.find((d: any) => d.code === "reason")
    const responsibilitiesItem = details.find((d: any) => d.code === "responsibilities")
    const requirementsItem = details.find((d: any) => d.code === "requirements")

    const jobDetail: TorreJobDetail = {
      id: data.id || id,
      title: data.objective || "",
      company: org ? org.name : null,
      companyUrl: org && org.publicId ? `https://torre.ai/${org.publicId}` : null,
      location: formatLocation(locations, isRemote),
      date: formatIsoDate(data.created),
      url: `${POST_BASE_URL}/${data.id || id}`,
      salary: formatCompensation(data.compensation),
      remote: isRemote,
      employmentType: data.commitment?.code || data.type || null,
      deadline: formatIsoDate(data.deadline),
      skills: strengths,
      description: descItem ? descItem.content : null,
      responsibilities: responsibilitiesItem ? responsibilitiesItem.content : null,
      requirements: requirementsItem ? requirementsItem.content : null,
      applyUrl: `${POST_BASE_URL}/${data.id || id}`,
    }

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(jobDetail, null, 2) + "\n")
    } else {
      process.stdout.write(`Title:       ${jobDetail.title}\n`)
      process.stdout.write(`Company:     ${jobDetail.company || "Unknown"}\n`)
      process.stdout.write(`Location:    ${jobDetail.location}\n`)
      if (jobDetail.salary) process.stdout.write(`Salary:      ${jobDetail.salary}\n`)
      if (jobDetail.employmentType) process.stdout.write(`Type:        ${jobDetail.employmentType}\n`)
      if (jobDetail.date) process.stdout.write(`Published:   ${jobDetail.date}\n`)
      if (jobDetail.deadline) process.stdout.write(`Deadline:    ${jobDetail.deadline}\n`)
      if (jobDetail.skills && jobDetail.skills.length > 0) {
        process.stdout.write(`Skills:      ${jobDetail.skills.join(", ")}\n`)
      }
      process.stdout.write(`URL:         ${jobDetail.url}\n`)
      process.stdout.write(`\n--- DESCRIPTION ---\n`)
      process.stdout.write(`${jobDetail.description || "(No description provided)"}\n`)
      if (jobDetail.responsibilities) {
        process.stdout.write(`\n--- RESPONSIBILITIES ---\n`)
        process.stdout.write(`${jobDetail.responsibilities}\n`)
      }
      if (jobDetail.requirements) {
        process.stdout.write(`\n--- REQUIREMENTS ---\n`)
        process.stdout.write(`${jobDetail.requirements}\n`)
      }
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
