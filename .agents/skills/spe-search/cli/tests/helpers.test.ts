import { describe, expect, test } from "bun:test"
import {
  extractSpeCode,
  formatSpeLocation,
  formatIsoDate,
} from "../src/helpers.js"

describe("extractSpeCode", () => {
  test("extracts code from bare ID", () => {
    expect(extractSpeCode("1886761088")).toBe("1886761088")
    expect(extractSpeCode("  1886761088  ")).toBe("1886761088")
  })

  test("extracts code from complex ID or URL", () => {
    expect(extractSpeCode("https://www.elempleo.com/co/ofertas-trabajo/dev-1886761088")).toBe("1886761088")
    expect(extractSpeCode("1625943542-27")).toBe("1625943542")
  })
})

describe("formatSpeLocation", () => {
  test("formats municipality and department", () => {
    expect(formatSpeLocation("MEDELLÍN", "ANTIOQUIA")).toBe("MEDELLÍN, ANTIOQUIA")
  })

  test("collapses identical municipality and department", () => {
    expect(formatSpeLocation("BOGOTÁ, D.C.", "BOGOTÁ, D.C.")).toBe("BOGOTÁ, D.C.")
  })

  test("falls back to department or default", () => {
    expect(formatSpeLocation(null, "CUNDINAMARCA")).toBe("CUNDINAMARCA")
    expect(formatSpeLocation(null, null)).toBe("Colombia")
  })
})

describe("formatIsoDate", () => {
  test("formats ISO datetime into YYYY-MM-DD", () => {
    expect(formatIsoDate("2026-09-02T00:00:00.000Z")).toBe("2026-09-02")
  })

  test("returns null for invalid inputs", () => {
    expect(formatIsoDate(null)).toBeNull()
    expect(formatIsoDate("invalid")).toBeNull()
  })
})
