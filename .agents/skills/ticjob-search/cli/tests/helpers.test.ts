import { describe, expect, test } from "bun:test"
import { extractTicjobId, parseTicjobCards, BASE_URL } from "../src/helpers.js"

describe("extractTicjobId", () => {
  test("extracts numeric ID from full URL", () => {
    expect(extractTicjobId("https://ticjob.co/es/search/job/desarrollador-datos/20906")).toBe("20906")
  })

  test("extracts numeric ID from bare ID string", () => {
    expect(extractTicjobId("20906")).toBe("20906")
  })

  test("extracts ID from URL with trailing query params or slash", () => {
    expect(extractTicjobId("https://ticjob.co/es/search/job/ingeniero-devops/98765/?source=search#top")).toBe("98765")
  })

  test("handles arbitrary non-numeric text gracefully", () => {
    expect(extractTicjobId("custom-slug")).toBe("custom-slug")
  })
})

describe("parseTicjobCards", () => {
  const mockHtml = `
    <div class="results">
      <a href="/es/search/job/desarrollador-python/12345">Ver empleo</a>
      <!-- Duplicate link for the same posting -->
      <a href="/es/search/job/desarrollador-python/12345">Ver empleo</a>
      <a href="/es/search/job/ingeniero-datos-senior/67890">Ver empleo</a>
    </div>
  `

  test("parses vacancy links and deduplicates repeated links", () => {
    const cards = parseTicjobCards(mockHtml)
    expect(cards.length).toBe(2)
    expect(cards[0].id).toBe("12345")
    expect(cards[1].id).toBe("67890")
  })

  test("converts kebab-case slug into human-readable title", () => {
    const cards = parseTicjobCards(mockHtml)
    expect(cards[0].title).toBe("Desarrollador Python")
    expect(cards[1].title).toBe("Ingeniero Datos Senior")
  })

  test("populates all required /scrape contract fields", () => {
    const cards = parseTicjobCards(mockHtml)
    const card = cards[0]
    expect(card.id).toBe("12345")
    expect(card.title).toBe("Desarrollador Python")
    expect(card.company).toBe("Empresa TI en Ticjob")
    expect(card.location).toBe("Colombia")
    expect(card.url).toBe(`${BASE_URL}/es/search/job/desarrollador-python/12345`)
  })

  test("returns empty array on empty HTML or HTML without vacancy links", () => {
    expect(parseTicjobCards("").length).toBe(0)
    expect(parseTicjobCards("<div><p>No hay ofertas disponibles</p></div>").length).toBe(0)
  })
})

