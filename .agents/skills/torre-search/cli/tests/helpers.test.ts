import { describe, expect, test } from "bun:test"
import {
  extractTorreId,
  formatCompensation,
  formatLocation,
  formatIsoDate,
} from "../src/helpers.js"

describe("extractTorreId", () => {
  test("extracts ID from post URL", () => {
    expect(extractTorreId("https://torre.ai/post/Yd6mq4kw")).toBe("Yd6mq4kw")
    expect(extractTorreId("https://torre.co/post/abc12345")).toBe("abc12345")
  })

  test("extracts ID from opportunities API URL", () => {
    expect(extractTorreId("https://torre.co/api/suite/opportunities/XYZ789")).toBe("XYZ789")
  })

  test("handles bare ID", () => {
    expect(extractTorreId("Yd6mq4kw")).toBe("Yd6mq4kw")
    expect(extractTorreId("  Yd6mq4kw  ")).toBe("Yd6mq4kw")
  })
})

describe("formatCompensation", () => {
  test("formats range with currency and periodicity", () => {
    const comp = {
      data: {
        currency: "USD",
        minAmount: 3000,
        maxAmount: 5000,
        periodicity: "monthly",
      },
    }
    expect(formatCompensation(comp)).toBe("USD 3,000 - 5,000 / monthly")
  })

  test("formats minimum amount only", () => {
    const comp = {
      data: {
        currency: "COP",
        minAmount: 8000000,
        maxAmount: null,
        periodicity: "monthly",
      },
    }
    expect(formatCompensation(comp)).toBe("COP 8,000,000+ / monthly")
  })

  test("formats maximum amount only", () => {
    const comp = {
      data: {
        currency: "USD",
        minAmount: null,
        maxAmount: 4000,
      },
    }
    expect(formatCompensation(comp)).toBe("Up to USD 4,000")
  })

  test("returns null for missing or invalid compensation", () => {
    expect(formatCompensation(null)).toBeNull()
    expect(formatCompensation({})).toBeNull()
  })
})

describe("formatLocation", () => {
  test("formats multiple locations without remote", () => {
    expect(formatLocation(["Colombia", "Guatemala"], false)).toBe("Colombia, Guatemala")
  })

  test("formats location with remote flag", () => {
    expect(formatLocation(["Colombia"], true)).toBe("Colombia (Remote)")
  })

  test("formats remote with no locations", () => {
    expect(formatLocation([], true)).toBe("Remote")
    expect(formatLocation(undefined, true)).toBe("Remote")
  })

  test("formats empty location without remote", () => {
    expect(formatLocation([], false)).toBe("Anywhere")
  })
})

describe("formatIsoDate", () => {
  test("parses ISO timestamp into YYYY-MM-DD", () => {
    expect(formatIsoDate("2025-08-29T18:41:55.000Z")).toBe("2025-08-29")
  })

  test("returns null for invalid or empty dates", () => {
    expect(formatIsoDate(null)).toBeNull()
    expect(formatIsoDate("not-a-date")).toBeNull()
  })
})
