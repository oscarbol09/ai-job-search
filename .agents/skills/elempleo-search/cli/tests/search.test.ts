import { describe, test, expect } from "bun:test";
import { buildSearchUrl, runSearch } from "../src/commands/search";

describe("Elempleo search command", () => {
  test("buildSearchUrl encodes query and optional filters correctly", () => {
    const u1 = buildSearchUrl({ query: "desarrollador python", page: 1, format: "json" });
    expect(u1).toBe("https://www.elempleo.com/co/ofertas-empleo?q=desarrollador+python");

    const u2 = buildSearchUrl({
      query: "analista de datos",
      location: "Bogotá",
      jobage: 7,
      page: 2,
      format: "json",
    });
    expect(u2).toContain("q=analista+de+datos");
    expect(u2).toContain("l=Bogot%C3%A1");
    expect(u2).toContain("fecha=7");
    expect(u2).toContain("pag=2");
  });

  test("runSearch --limit 0 emits zero results cleanly", async () => {
    let captured = "";
    const origWrite = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      captured += chunk;
      return true;
    }) as typeof process.stdout.write;

    try {
      const code = await runSearch({ query: "ingeniero", page: 1, limit: 0, format: "json" });
      expect(code).toBe(0);
      const data = JSON.parse(captured);
      expect(data.meta.count).toBe(0);
      expect(data.results.length).toBe(0);
    } finally {
      process.stdout.write = origWrite;
    }
  });
});
