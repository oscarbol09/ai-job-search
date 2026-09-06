# Estrategia y Consultas de Búsqueda — Colombia y LATAM

Este documento define la estrategia de búsqueda estructurada por prioridades y funciones técnicas para el ecosistema laboral de Colombia, integrando tanto los 5 portales nativos instalados bajo `.agents/skills/` como las consultas de respaldo (fallback) vía WebSearch.

---

## 🚀 Portales Nativos Instalados (Prioridad en `/scrape`)

El comando `/scrape` detecta y ejecuta automáticamente los siguientes portales de Colombia:
1. **`computrabajo-search`**: El portal con mayor volumen de vacantes transversales, operativas y técnicas en Colombia.
2. **`elempleo-search`**: Plataforma corporativa líder en cargos de banca, consultoría, gerencia y multinacionales.
3. **`torre-search`**: Plataforma especializada en roles de software, producto, data y trabajo remoto en USD y COP.
4. **`spe-search`**: Buscador oficial del Servicio Público de Empleo (Ministerio de Trabajo / SENA / Cajas de Compensación: Compensar, Colsubsidio, Comfama).
5. **`ticjob-search`**: Bolsa vertical de vacantes en tecnologías de la información y telecomunicaciones.
6. **`linkedin-search`**: Búsquedas en LinkedIn Colombia y roles remotos globales.
7. **`freehire-search`**: Agregador técnico multi-ATS (Greenhouse, Lever, Workday).

---

## 🎯 Categorías de Consulta por Prioridad

### Prioridad 1: Desarrollo de Software & Ingeniería de Datos (Core)
Roles centrales de ingeniería de software, arquitectura de aplicaciones y analítica avanzada.

```
# Variantes de cargo
"Desarrollador Full Stack"
"Ingeniero de Software"
"Backend Developer"
"Frontend Developer"
"Data Engineer"

# Ciudades clave
Bogotá OR Medellín OR Cali OR Remoto
```

### Prioridad 2: Arquitectura Cloud, DevOps & Ciberseguridad
Infraestructura moderna, automatización y seguridad de la información.

```
# Variantes de cargo
"DevOps Engineer"
"Cloud Architect"
"Ingeniero Cloud"
"Analista de Seguridad de la Información"
"Site Reliability Engineer"

# Cobertura geográfica
Colombia OR Remoto
```

### Prioridad 3: Inteligencia Artificial, Machine Learning & Analítica de Negocio
Extracción de valor de datos, modelos predictivos y automatización inteligente.

```
# Variantes de cargo
"Científico de Datos"
"Data Scientist"
"Machine Learning Engineer"
"Analista de Inteligencia de Negocios"
"BI Developer"
```

### Prioridad 4: Gestión Técnica, Producto & Consultoría TI
Liderazgo de proyectos tecnológicos, consultoría empresarial y gestión de producto.

```
# Variantes de cargo
"Tech Lead"
"Líder Técnico"
"Product Manager"
"Scrum Master"
"Consultor TI"
```

---

## 📍 Filtros Geográficos y Movilidad en Colombia

- **Polos de desarrollo tecnológico principales:**
  - **Bogotá D.C. / Sabana:** Centro financiero y corporativo nacional.
  - **Medellín / Valle de Aburrá:** Hub de innovación tecnológica y startups.
  - **Cali / Valle del Cauca:** Centros de servicios compartidos e industria.
  - **Barranquilla / Costa Caribe:** Creciente polo logístico y de desarrollo.
  - **Eje Cafetero (Manizales, Pereira, Armenia):** Ecosistema de software y outsourcing.
- **Modalidad Remota:** "Remoto", "Teletrabajo", "Trabajo en casa" (Ley 2088 y Ley 1221).

---

## 💵 Evaluación Salarial y Esquemas de Contratación

Al clasificar ofertas con `/rank`, utiliza el calculador de compensación de Colombia:
```bash
python tools/compensation/colombia.py --compare --laboral <VALOR> --servicios <VALOR> --usd <VALOR>
```
- **Contrato a Término Indefinido:** Evaluar salario integral equivalente sumando prestaciones sociales de ley (prima, cesantías, intereses y vacaciones = ~21.8% adicional sobre el neto ordinario).
- **Prestación de Servicios:** Deducir el 29% aproximado sobre el IBC (40% de los honorarios brutos) por concepto de PILA (salud 12.5%, pensión 16%, ARL).
- **Ofertas en USD:** Convertir a TRM proyectada y evaluar bajo régimen independiente.
