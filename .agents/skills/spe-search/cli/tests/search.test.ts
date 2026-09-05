import { describe, expect, test } from "bun:test"
import { buildSearchUrl } from "../src/commands/search.js"

describe("buildSearchUrl", () => {
  test("builds basic search URL with query and page", () => {
    const url = buildSearchUrl({
      query: "ingeniero",
      page: 1,
      limit: 20,
      format: "json",
    })
    expect(url).toContain("page=1")
    expect(url).toContain("BUSQUEDA=ingeniero")
  })

  test("adds department filter when specified", () => {
    const url = buildSearchUrl({
      query: "desarrollador",
      department: "ANTIOQUIA",
      page: 2,
      limit: 10,
      format: "table",
    })
    expect(url).toContain("page=2")
    expect(url).toContain("DEPARTAMENTO=ANTIOQUIA")
  })
})
