# Elempleo Colombia URL Reference

Public HTML pages used by this skill for Colombia (`www.elempleo.com/co`).

> **Personal use only** — automated access is against Elempleo's Terms of Service;
> keep volume low.

## Search

```
GET https://www.elempleo.com/co/ofertas-empleo?q=<query>&l=<location>&fecha=<jobage>&pag=<page>
```

Query parameters:

| Param | Meaning | Example |
|-------|---------|---------|
| `q` | Free-text keyword search | `desarrollador+python` |
| `l` | City or region filter | `Bogota`, `Medellin`, `Cali` |
| `fecha` | Max age in days (`1`, `7`, `14`, `30`) | `7` |
| `pag` | 1-indexed page number | `1`, `2` |

Returns HTML with job cards inside `<div class="col-md-12 result-item ...">`.
Each card embeds:
- `data-ga4-offerdata`: Structured JSON containing `id`, `title`, `company`, `location`, `salary`
- `data-url`: Relative URL path, e.g. `/co/ofertas-trabajo/<slug>-<id>`
- `<span class="... js-offer-date ...">`: Relative date text ("Hoy", "Ayer", "Hace N días", etc.)

## Detail

```
GET https://www.elempleo.com/co/ofertas-trabajo/<slug>-<NUMERIC_ID>
```

Example:
```
GET https://www.elempleo.com/co/ofertas-trabajo/desarrollador-fullstack-1886754321
```

Returns single posting HTML with embedded JSON-LD (`<script type="application/ld+json">` of `@type: "JobPosting"`) containing:
- `title`: Job title
- `description`: Plain text job description and responsibilities
- `datePosted`: Posting date (ISO or `YYYY-M-D`)
- `validThrough`: Expiration / deadline date
- `hiringOrganization.name`: Employer name
- `jobLocation.address`: City and region
- `baseSalary`: Currency (COP) and salary range
- `employmentType`: Contract modality
