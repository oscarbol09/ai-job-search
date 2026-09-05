# 🇨🇴 Adaptación para Colombia y Latinoamérica — `ai-job-search`

Esta rama/adaptación de [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) incorpora soporte nativo para los dos portales de empleo más importantes de Colombia y Latinoamérica: **Computrabajo** y **El Empleo**, permitiendo orquestar la búsqueda, filtrado, evaluación de vacantes y preparación de postulaciones de forma completamente automatizada con agentes de IA (Claude Code, Google Antigravity, Codex, etc.).

---

## 🚀 Portales Nativos Soportados

| Portal | Skill | Cobertura / Enfoque | Comando Base |
| :--- | :--- | :--- | :--- |
| **Computrabajo Colombia** | `computrabajo-search` | El portal de mayor volumen en Colombia y la región. Vacantes de tecnología, ingeniería, operaciones, servicios y cargos operativos. | `bun run .agents/skills/computrabajo-search/cli/src/cli.ts` |
| **El Empleo Colombia** | `elempleo-search` | Plataforma líder en cargos corporativos, banca, multinacionales, gerencia, ingeniería y consultoría. | `bun run .agents/skills/elempleo-search/cli/src/cli.ts` |
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

---

## 🎯 Integración en el Flujo de Trabajo (/scrape, /rank, /apply)

1. **Búsqueda automática:** Al invocar el skill correspondiente o ejecutar `/scrape`, el agente consulta los portales de Colombia y normaliza los resultados bajo el contrato unificado:
   - `id`: Identificador único de la vacante.
   - `title`: Título del puesto.
   - `company`: Nombre de la empresa empleadora.
   - `location`: Ciudad o departamento (ej. *Bogotá, Medellín, Cali, Remoto*).
   - `salary`: Rango salarial en pesos colombianos (COP).
   - `date`: Fecha de publicación en formato ISO `YYYY-MM-DD`.
   - `deadline`: Fecha límite de postulación si la empresa la especifica.
   - `url`: Enlace directo a la oferta.
2. **Evaluación de calce (/rank):** El agente compara la descripción y requisitos extraídos contra tu perfil en `01-candidate-profile.md` y clasifica las ofertas según relevancia.
3. **Postulación a la medida (/apply):** Se redacta el CV y la carta de presentación adaptados a la vacante específica.

---

## ⚠️ Uso Personal y Ético

Ambos portales operan mediante sus páginas públicas sin necesidad de registrar credenciales:
- El uso de estos scrapers es para **fines exclusivamente personales** de búsqueda de empleo.
- No realices búsquedas masivas automatizadas en bucle; mantén un volumen bajo y responsable.
- Los CLIs respetan las restricciones de `robots.txt` y aplican esperas exponenciales (*backoff*) ante límites de tasa (429/5xx).
