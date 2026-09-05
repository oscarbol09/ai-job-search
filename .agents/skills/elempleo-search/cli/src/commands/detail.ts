import {
  htmlFetch,
  parseJobDetail,
  writeError,
  normalizeDetailUrl,
  idFromUrl,
} from "../helpers.js"

export interface DetailOpts {
  input: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  let url: string
  try {
    url = normalizeDetailUrl(opts.input)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    writeError(msg, "BAD_ID")
    return 1
  }

  const id = idFromUrl(url)
  if (!url || !id || !/ofertas-trabajo/.test(url)) {
    writeError(
      `Could not parse an El Empleo posting URL from "${opts.input}" (pass the full URL from search results — the address includes the job slug and 10-digit ID)`,
      "BAD_ID",
    )
    return 1
  }

  try {
    const html = await htmlFetch(url)
    if (!html) {
      writeError("Job posting not found or expired (404)", "NOT_FOUND")
      return 1
    }

    const job = parseJobDetail(html, url)

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}`,
        job.salary ? `Salary: ${job.salary}` : "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Deadline: ${job.deadline}` : "",
        job.employmentType ? `Contract: ${job.employmentType}` : "",
        "",
        job.description || "(no description)",
        "",
        `Apply: ${job.applyUrl}`,
      ].filter((l) => l !== "")

      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    writeError(`Detail fetch failed: ${msg}`, "API_ERROR")
    return 1
  }
}
