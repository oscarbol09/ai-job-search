import { describe, test, expect } from "bun:test";
import {
  parseJobCards,
  parseJobDetail,
  relativeDateToISO,
  decodeHtmlEntities,
  normalizeDetailUrl,
  idFromUrl,
} from "../src/helpers";
import { SAMPLE_SEARCH_HTML, SAMPLE_DETAIL_HTML } from "./helpers";

describe("Elempleo parsing helpers", () => {
  test("decodeHtmlEntities decodes common named and numeric Spanish entities", () => {
    expect(decodeHtmlEntities("Bogot&#225;")).toBe("Bogotá");
    expect(decodeHtmlEntities("Medell&#237;n")).toBe("Medellín");
    expect(decodeHtmlEntities("Tecnol&#243;gico")).toBe("Tecnológico");
    expect(decodeHtmlEntities("&Aacute;rea de TI &amp; Redes")).toBe("Área de TI & Redes");
    expect(decodeHtmlEntities("Compa&#241;&#237;a &quot;L&iacute;der&quot;")).toBe('Compañía "Líder"');
  });

  describe("relativeDateToISO", () => {
    const fixedNow = new Date("2026-09-05T12:00:00Z");

    test("Hoy -> today", () => {
      expect(relativeDateToISO("Hoy", fixedNow)).toBe("2026-09-05");
      expect(relativeDateToISO("hoy", fixedNow)).toBe("2026-09-05");
    });

    test("Ayer -> yesterday", () => {
      expect(relativeDateToISO("Ayer", fixedNow)).toBe("2026-09-04");
    });

    test("Hace N días", () => {
      expect(relativeDateToISO("Hace 3 días", fixedNow)).toBe("2026-09-02");
      expect(relativeDateToISO("Hace 1 día", fixedNow)).toBe("2026-09-04");
      expect(relativeDateToISO("Hace 5 d&#237;as", fixedNow)).toBe("2026-08-31");
    });

    test("Hace N semanas", () => {
      expect(relativeDateToISO("Hace 1 semana", fixedNow)).toBe("2026-08-29");
      expect(relativeDateToISO("Hace 2 semanas", fixedNow)).toBe("2026-08-22");
    });

    test("Hace N meses (30 days)", () => {
      expect(relativeDateToISO("Hace 1 mes", fixedNow)).toBe("2026-08-06");
    });

    test("Hace N años (365 days)", () => {
      expect(relativeDateToISO("Hace 1 año", fixedNow)).toBe("2025-09-05");
    });

    test("sub-day units resolve to today", () => {
      expect(relativeDateToISO("Hace 2 horas", fixedNow)).toBe("2026-09-05");
      expect(relativeDateToISO("Hace 30 minutos", fixedNow)).toBe("2026-09-05");
    });

    test("ISO dates pass through and pad single-digit months/days", () => {
      expect(relativeDateToISO("2026-9-5", fixedNow)).toBe("2026-09-05");
      expect(relativeDateToISO("2026-09-05", fixedNow)).toBe("2026-09-05");
    });

    test("null, empty or unparseable input returns null", () => {
      expect(relativeDateToISO(null)).toBeNull();
      expect(relativeDateToISO("")).toBeNull();
      expect(relativeDateToISO("Inmediato")).toBeNull();
    });
  });

  describe("parseJobCards", () => {
    test("parses job cards from search result HTML", () => {
      const cards = parseJobCards(SAMPLE_SEARCH_HTML);
      expect(cards.length).toBe(2);

      const c1 = cards[0];
      expect(c1.id).toBe("1886762593");
      expect(c1.title).toBe("Desarrollador Python Senior");
      expect(c1.company).toBe("Tech Solutions SAS");
      expect(c1.location).toBe("Bogotá");
      expect(c1.salary).toBe("$8 a $10 millones");
      expect(c1.url).toBe("https://www.elempleo.com/co/ofertas-trabajo/desarrollador-python-senior-1886762593");
      expect(c1.date).toBe(new Date().toISOString().slice(0, 10));

      const c2 = cards[1];
      expect(c2.id).toBe("1886762594");
      expect(c2.title).toBe("Analista de Datos BI");
      expect(c2.company).toBe("Financiera Andina");
      expect(c2.location).toBe("Medellín");
      expect(c2.salary).toBe("$4,5 a $6 millones");
    });
  });

  describe("parseJobDetail", () => {
    test("extracts fields from schema.org JobPosting JSON-LD", () => {
      const url = "https://www.elempleo.com/co/ofertas-trabajo/desarrollador-python-senior-1886762593";
      const detail = parseJobDetail(SAMPLE_DETAIL_HTML, url);

      expect(detail.id).toBe("1886762593");
      expect(detail.title).toBe("Desarrollador Python Senior");
      expect(detail.company).toBe("Tech Solutions SAS");
      expect(detail.location).toBe("Cundinamarca, Bogotá");
      expect(detail.date).toBe("2026-09-05");
      expect(detail.deadline).toBe("2026-10-05");
      expect(detail.employmentType).toBe("FULL_TIME");
      expect(detail.description).toContain("Django, FastAPI y AWS");
      expect(detail.salary).toContain("COP");
      expect(detail.url).toBe(url);
    });

    test("falls back cleanly when JSON-LD is absent", () => {
      const fallbackHtml = `
        <html>
          <body>
            <h1>Ingeniero DevOps</h1>
            <div class="description-block">Experiencia con Kubernetes y Terraform.</div>
            <span class="js-offer-company">Cloud SAS</span>
            <span class="js-offer-city">Cali</span>
            <div class="text-blue-petrol-dark">$7 a $9 millones</div>
          </body>
        </html>
      `;
      const url = "https://www.elempleo.com/co/ofertas-trabajo/ingeniero-devops-1886762595";
      const detail = parseJobDetail(fallbackHtml, url);

      expect(detail.id).toBe("1886762595");
      expect(detail.title).toBe("Ingeniero DevOps");
      expect(detail.company).toBe("Cloud SAS");
      expect(detail.location).toBe("Cali");
      expect(detail.description).toBe("Experiencia con Kubernetes y Terraform.");
      expect(detail.salary).toBe("$7 a $9 millones");
    });
  });

  describe("URL and ID utilities", () => {
    test("idFromUrl extracts 10-digit ID", () => {
      expect(idFromUrl("https://www.elempleo.com/co/ofertas-trabajo/desarrollador-1886762593")).toBe("1886762593");
      expect(idFromUrl("/co/ofertas-trabajo/desarrollador-1886762593?param=1")).toBe("1886762593");
      expect(idFromUrl("https://www.elempleo.com/co/ofertas-trabajo/slug-without-id")).toBeNull();
    });

    test("normalizeDetailUrl normalizes relative paths and rejects bare id without slug", () => {
      expect(normalizeDetailUrl("/co/ofertas-trabajo/slug-1886762593#frag")).toBe(
        "https://www.elempleo.com/co/ofertas-trabajo/slug-1886762593"
      );
      expect(() => normalizeDetailUrl("1886762593")).toThrow(/slug/);
    });
  });
});
