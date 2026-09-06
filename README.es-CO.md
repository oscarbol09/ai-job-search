# 🇨🇴 Adaptación para Colombia y Latinoamérica — `ai-job-search`

Esta rama/adaptación de [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) incorpora soporte nativo para el ecosistema completo de empleo en Colombia y Latinoamérica: **Computrabajo**, **El Empleo**, **Torre**, **Servicio Público de Empleo (SPE)** y **Ticjob Colombia**, permitiendo orquestar la búsqueda, filtrado, evaluación de vacantes y preparación de postulaciones de forma completamente automatizada con agentes de IA (Claude Code, Google Antigravity, Codex, etc.).

---

## 🚀 Portales Nativos Soportados

| Portal | Skill | Cobertura / Enfoque | Comando Base |
| :--- | :--- | :--- | :--- |
| **Computrabajo Colombia** | `computrabajo-search` | El portal de mayor volumen en Colombia y la región. Vacantes operativas, técnicas, comerciales, administrativas y de ingeniería. | `bun run .agents/skills/computrabajo-search/cli/src/cli.ts` |
| **El Empleo Colombia** | `elempleo-search` | Plataforma líder en cargos corporativos, banca, multinacionales, gerencia, ingeniería y consultoría. | `bun run .agents/skills/elempleo-search/cli/src/cli.ts` |
| **Torre** | `torre-search` | Plataforma líder de talento tecnológico y remoto fundada en Colombia (Alexander Torrenegra). Roles en software, producto, data, AI y trabajo remoto en USD/COP con API pública abierta. | `bun run .agents/skills/torre-search/cli/src/cli.ts` |
| **Servicio Público de Empleo** | `spe-search` | Red nacional oficial del Ministerio del Trabajo de Colombia (`buscadordeempleo.gov.co`). Más de 200,000 vacantes centralizadas de Cajas de Compensación (Compensar, Colsubsidio, Comfama), SENA, alcaldías y agencias oficiales. | `bun run .agents/skills/spe-search/cli/src/cli.ts` |
| **Ticjob Colombia** | `ticjob-search` | Portal vertical especializado en tecnología, desarrollo de software, DevOps, infraestructura y consultoría TI. | `bun run .agents/skills/ticjob-search/cli/src/cli.ts` |
| **LinkedIn Global** | `linkedin-search` | Vacantes remotas, multinacionales y startups en Colombia y el mundo. | *(Incluido en upstream)* |
| **Freehire** | `freehire-search` | Agregador técnico global multi-ATS (Greenhouse, Lever, Workday, etc.). | *(Incluido en upstream)* |

---

## 📋 Requisitos Previos

- [Bun](https://bun.sh/) (v1.1 o superior) para ejecutar los CLIs de búsqueda.
- [Python 3.10+](https://www.python.org/) para las herramientas del framework.
- Un agente compatible: [Claude Code](https://claude.ai/code) o [Google Antigravity](https://antigravity.google/).

---

## 💻 Guía Rápida de Comandos

### 1. Computrabajo Colombia (`computrabajo-search`)
```bash
bun run .agents/skills/computrabajo-search/cli/src/cli.ts search -q "desarrollador python" --format table
bun run .agents/skills/computrabajo-search/cli/src/cli.ts detail "<URL_DE_COMPUTRABAJO>" --format plain
```

### 2. El Empleo Colombia (`elempleo-search`)
```bash
bun run .agents/skills/elempleo-search/cli/src/cli.ts search -q "ingeniero software" --location "Bogotá" --format table
bun run .agents/skills/elempleo-search/cli/src/cli.ts detail "<URL_DE_ELEMPLEO>" --format plain
```

### 3. Torre (`torre-search`)
```bash
bun run .agents/skills/torre-search/cli/src/cli.ts search -q "fullstack" --location "Colombia" --remote --format table
bun run .agents/skills/torre-search/cli/src/cli.ts detail "Yd6mq4kw" --format plain
```

### 4. Servicio Público de Empleo Colombia (`spe-search`)
```bash
bun run .agents/skills/spe-search/cli/src/cli.ts search -q "desarrollador" --department "ANTIOQUIA" --format table
bun run .agents/skills/spe-search/cli/src/cli.ts detail "1886761088" --format plain
```

### 5. Ticjob Colombia (`ticjob-search`)
```bash
bun run .agents/skills/ticjob-search/cli/src/cli.ts search -q "python" --format table
bun run .agents/skills/ticjob-search/cli/src/cli.ts detail "<URL_O_ID_TICJOB>" --format plain
```

---

### 6. Calculador de Compensación Laboral Colombia (`tools/compensation/colombia.py`)
Compara y normaliza equitativamente ofertas en Colombia bajo esquemas de contrato laboral dependiente, prestación de servicios (honorarios / PILA) y ofertas remotas en USD:
```bash
# Calcular oferta laboral con prestaciones de ley (prima, cesantías, intereses, vacaciones)
python tools/compensation/colombia.py --laboral 8000000

# Calcular oferta por prestación de servicios (PILA: salud 12.5%, pensión 16%, ARL)
python tools/compensation/colombia.py --servicios 10000000

# Calcular oferta remota en USD convertida a TRM de mercado
python tools/compensation/colombia.py --usd 2500 --trm 4150

# Tabla comparativa automática entre múltiples esquemas
python tools/compensation/colombia.py --compare --laboral 7000000 --servicios 9000000 --usd 2200
```

---

## 🎯 Integración en el Flujo de Trabajo (/scrape, /rank, /apply)

1. **Búsqueda unificada:** Al ejecutar `/scrape` o invocar un skill individual, el agente consulta los portales de Colombia y normaliza los resultados bajo el contrato unificado:
   - `id`: Identificador único de la vacante.
   - `title`: Título del puesto.
   - `company`: Nombre de la empresa o entidad empleadora / prestador oficial.
   - `location`: Municipio, ciudad, departamento o modalidad (*Remoto, Bogotá, Medellín*).
   - `salary`: Rango salarial (en COP o USD).
   - `date`: Fecha de publicación en formato ISO `YYYY-MM-DD`.
   - `deadline`: Fecha límite de postulación si está disponible.
   - `url`: Enlace directo a la oferta oficial.
2. **Estrategia preconfigurada para Colombia:** Consulta [search-queries.es-CO.md](file:///.claude/skills/job-scraper/search-queries.es-CO.md) para ver la plantilla adaptada a las principales regiones (Bogotá, Medellín, Cali, Barranquilla, Eje Cafetero y Remoto nacional) y roles de software, data, cloud y producto.
3. **Evaluación de calce (/rank):** El agente compara la descripción y requisitos extraídos contra tu perfil en `01-candidate-profile.md` y clasifica las ofertas según relevancia, normalizando las compensaciones financieras mediante `tools/compensation/colombia.py`.
4. **Postulación a la medida (/apply):** Se redacta el CV y la carta de presentación adaptados a la vacante específica.

---

## 📌 Estado de Magneto 365

Durante el análisis del ecosistema nacional se evaluó además **Magneto 365 (`magneto365.com/co`)**. Sus búsquedas se ejecutan bajo una Single Page Application (Next.js App Router) con protección perimetral Cloudflare (HTTP 503 en solicitudes automáticas de API). Queda contemplado para una integración posterior mediante navegadores headless.

---

## ⚠️ Uso Personal y Ético

Todos los portales operan sin requerir registro de credenciales privadas:
- El uso de estos clientes y scrapers es para **fines exclusivamente personales** de búsqueda de empleo.
- No realices búsquedas masivas automatizadas en bucle; mantén un volumen bajo y responsable.
- Los CLIs respetan las restricciones de `robots.txt` y aplican esperas exponenciales (*backoff*) ante límites de tasa (429/5xx).
