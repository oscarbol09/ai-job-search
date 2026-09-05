import { describe, expect, test } from "bun:test"
import { extractTicjobId, parseTicjobCards } from "../src/helpers.js"

describe("extractTicjobId", () => {
  test("extracts numeric ID from url", () => {
    expect(extractTicjobId("https://ticjob.co/es/search/job/desarrollador-datos/20906")).toBe("20906")
    expect(extractTicjobId("20906")).toBe("20906")
  })
})

describe("parseTicjobCards", () => {
  test("parses vacancy links from HTML", () => {
    const mockHtml = `
      <div>
        <a href="/es/search/job/desarrollador-python/12345">Ver empleo</a>
        <a href="/es/search/job/ingeniero-datos/67890">Ver empleo</a>
      </div>
    `
    const cards = parseTicjobCards(mockHtml)
    expect(cards.length).toBe(2)
    expect(cards[0].id).toBe("12345")
    expect(cards[0].title).toBe("Desarrollador Python")
    expect(cards[1].id).toBe("67890")
  })
})
