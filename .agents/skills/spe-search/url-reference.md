# Servicio Público de Empleo (SPE) API Reference

This document records the endpoint contracts and schema definitions used by the `spe-search` CLI.

## Endpoints

### 1. Search Endpoint (Public REST API)
- **Method:** `GET`
- **URL:** `https://www.buscadordeempleo.gov.co/backbue/v1/vacantes/resultados?page={page}&BUSQUEDA={query}`
- **Headers:**
  - `Accept: application/json`
  - `User-Agent: Mozilla/5.0 (compatible; spe-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)`
- **Response Structure:**
  - `resultados`: Array of job objects (`CODIGO_VACANTE`, `TITULO_VACANTE`, `DESCRIPCION_VACANTE`, `RANGO_SALARIAL`, `DEPARTAMENTO`, `MUNICIPIO`, `TIPO_CONTRATO`, `FECHA_PUBLICACION`, `FECHA_VENCIMIENTO`, `DETALLES_PRESTADOR`).
  - `total`: Total matching vacancies.
  - `totalPages`: Number of available pages.
  - `currentPage`: Current page number.

## TLS Intermediate Certificate Notice
Government `.gov.co` servers occasionally omit intermediate CA certificates from their SSL handshakes.
The CLI configures an explicit TLS tolerance (`NODE_TLS_REJECT_UNAUTHORIZED = '0'`) to ensure high availability across standard Node and Bun runtimes without requiring root certificate manual injection.
