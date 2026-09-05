import { describe, expect, test } from "bun:test"
import { buildSearchPayload } from "../src/commands/search.js"

describe("buildSearchPayload", () => {
  test("builds basic payload with query and open status", () => {
    const payload = buildSearchPayload({
      query: "python",
      page: 1,
      limit: 20,
      format: "json",
    })
    expect(payload.and).toBeArray()
    expect(payload.and.length).toBe(2)
    expect(payload.and[0]["skill/role"].text).toBe("python")
    expect(payload.and[1].status.code).toBe("open")
  })

  test("adds location clause when specified", () => {
    const payload = buildSearchPayload({
      query: "react",
      location: "Colombia",
      page: 1,
      limit: 10,
      format: "table",
    })
    expect(payload.and.length).toBe(3)
    expect(payload.and[2].location.term).toBe("Colombia")
  })

  test("ignores 'remote' as location term", () => {
    const payload = buildSearchPayload({
      query: "node",
      location: "remote",
      remote: true,
      page: 1,
      limit: 10,
      format: "json",
    })
    expect(payload.and.length).toBe(2)
  })
})
