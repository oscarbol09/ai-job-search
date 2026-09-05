# 🇨🇴 Adaptación para Colombia y Latinoamérica — `ai-job-search`

Esta rama/adaptación de [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) incorpora soporte nativo para los portales de empleo clave de Colombia y Latinoamérica: **Computrabajo**, **El Empleo** y **Torre**, permitiendo orquestar la búsqueda, filtrado, evaluación de vacantes y preparación de postulaciones de forma completamente automatizada con agentes de IA (Claude Code, Google Antigravity, Codex, etc.).

---

## 🚀 Portales Nativos Soportados

| Portal | Skill | Cobertura / Enfoque | Comando Base |
| :--- | :--- | :--- | :--- |
| **Computrabajo Colombia** | `computrabajo-search` | El portal de mayor volumen en Colombia y la región. Vacantes operativas, técnicas, comerciales, administrativas y de ingeniería. | `bun run .agents/skills/computrabajo-search/cli/src/cli.ts` |
| **El Empleo Colombia** | `elempleo-search` | Plataforma líder en cargos corporativos, banca, multinacionales, gerencia, ingeniería y consultoría. | `bun run .agents/skills/elempleo-search/cli/src/cli.ts` |
| **Torre** | `torre-search` | Plataforma líder de talento tecnológico y remoto fundada en Colombia (Alexander Torrenegra). Roles en software, producto, data, AI y trabajo remoto en USD/COP con API pública abierta. | `bun run .agents/skills/torre-search/cli/src/cli.ts` |
| **LinkedIn Global** | `linkedin-search` | Vacantes remotas, multinacionales y startups en Colombia y el mundo. | *(Incluido en upstream)* |
| **Freehire** | `freehire-search` | Agregador técnico global multi-ATS (Greenhouse, Lever, Workday, etc.). | *(Incluido en upstream)* |

---

## 📋 Requisitos Previos

- [Bun](https://bun.sh/) (v1.1 o superior) para ejecutar los CLIs de búsqueda.
- [Python 3.10+](https://www.python.org/) para las herramientas del framework.
- Un agente compatible: [Claude Code](https://claude.ai/code) o [Google Antigravity](https://antigravity.google/).

---

## 💻 Uso Rápido de los Portales

### 1. Computrabajo Colombia (`computrabajo-search`)

```bash
# Búsqueda por palabra clave en Colombia
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador python" --format table

# Limitar resultados
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "analista de datos" -n 5

# Ver el detalle completo de una vacante
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail "<URL_DE_COMPUTRABAJO>" --format plain
```

### 2. El Empleo Colombia (`elempleo-search`)

```bash
# Búsqueda por palabra clave y ciudad
bun run .agents/skills/elempleo-search/cli/src/cli.ts search -q "ingeniero software" --location "Bogotá" --format table

# Filtrar por publicaciones recientes (últimos 7 días)
bun run .agents/skills/elempleo-search/cli/src/cli.ts search -q "backend" --jobage 7 --format table

# Ver detalle completo con salario en COP y fecha límite
bun run .agents/skills/elempleo-search/cli/src/cli.ts detail "<URL_DE_ELEMPLEO>" --format plain
```

### 3. Torre (`torre-search`)

```bash
# Búsqueda de roles de software / tech
bun run .agents/skills/torre-search/cli/src/cli.ts search -q "python" -n 5 --format table

# Filtrar roles en Colombia o remotos
bun run .agents/skills/torre-search/cli/src/cli.ts search -q "react" --location "Colombia" --remote --format table

# Ver detalle de la oportunidad por ID o URL completa
bun run .agents/skills/torre-search/cli/src/cli.ts detail "Yd6mq4kw" --format plain
bun run .agents/skills/torre-search/cli/src/cli.ts detail "https://torre.ai/post/Yd6mq4kw" --format json
```

---

## 🎯 Integración en el Flujo de Trabajo (/scrape, /rank, /apply)

1. **Búsqueda automática:** Al invocar el skill correspondiente o ejecutar `/scrape`, el agente consulta los portales de Colombia y normaliza los resultados bajo el contrato unificado:
   - `id`: Identificador único de la vacante.
   - `title`: Título del puesto.
   - `company`: Nombre de la empresa empleadora.
   - `location`: Ciudad, país o modalidad (*Bogotá, Medellín, Colombia, Remoto*).
   - `salary`: Rango salarial y periodicidad (en COP o USD).
   - `date`: Fecha de publicación en formato ISO `YYYY-MM-DD`.
   - `deadline`: Fecha límite de postulación si la empresa la especifica.
   - `url`: Enlace directo a la oferta.
2. **Evaluación de calce (/rank):** El agente compara la descripción y requisitos extraídos contra tu perfil en `01-candidate-profile.md` y clasifica las ofertas según relevancia.
3. **Postulación a la medida (/apply):** Se redacta el CV y la carta de presentación adaptados a la vacante específica.

---

## 📌 Estado de Otros Portales Evaluados

Durante la investigación de ecosistemas de empleo en Colombia, se analizaron además las siguientes plataformas:
- **Magneto 365 (`magneto365.com/co`)**: Portal corporativo de alto valor (empleador de Bancolombia, Sura, Nutresa). Actualmente su buscador funciona como Single Page Application bajo Next.js con protecciones Cloudflare (HTTP 503 en peticiones automáticas de API). Queda documentado para evaluar emulaciones avanzadas con navegador headless.
- **Ticjob Colombia (`ticjob.co`)**: Portal de nicho TI. Presenta un volumen de ofertas activas muy reducido frente a Torre, El Empleo y Computrabajo.
- **Servicio Público de Empleo (`serviciodeempleo.gov.co`)**: Los entornos estándar de ejecución (Node/Bun/Python) fallan al validar los certificados SSL de los servidores gubernamentales debido a la falta de certificados intermedios de la CA del estado en los bundles de certificados públicos (`CERTIFICATE_VERIFY_FAILED`).

---

## ⚠️ Uso Personal y Ético

Todos los portales operan sin requerir registro de credenciales privadas:
- El uso de estos clientes y scrapers es para **fines exclusivamente personales** de búsqueda de empleo.
- No realices búsquedas masivas automatizadas en bucle; mantén un volumen bajo y responsable.
- Los CLIs respetan las restricciones de `robots.txt` y aplican esperas exponenciales (*backoff*) ante límites de tasa (429/5xx).
