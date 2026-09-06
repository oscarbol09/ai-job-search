#!/usr/bin/env python3
"""
Calculador y Normalizador de Compensación Laboral para Colombia.

Permite desglosar y comparar equitativamente ofertas en Colombia bajo los tres esquemas
habituales de contratación:
1. Contrato laboral dependiente (término indefinido / fijo con prestaciones de ley)
2. Contrato de prestación de servicios (honorarios como contratista independiente / PILA)
3. Ofertas remotas en USD (startups extranjeras / Torre / Freehire)

Uso CLI:
    python tools/compensation/colombia.py --laboral 8000000
    python tools/compensation/colombia.py --servicios 10000000
    python tools/compensation/colombia.py --usd 2500 --trm 4100
    python tools/compensation/colombia.py --compare --laboral 6500000 --servicios 8500000 --usd 2000
"""

import sys
import json
import argparse
from typing import Dict, Any, List

# Constantes laborales Colombia (referencia 2026 proyectada)
SMMLV_2026 = 1423500.0          # Salario Mínimo Mensual Legal Vigente
AUX_TRANSPORTE_2026 = 200000.0   # Auxilio de transporte legal (aplica si <= 2 SMMLV)
TOPE_SMMLV_IBC = 25              # Tope máximo legal de cotización IBC (25 SMMLV)
TRM_DEFAULT = 4150.0             # Tasa Representativa del Mercado promedio por defecto

# Tasas contrato laboral (aportes del trabajador)
TASA_SALUD_EMPLEADO = 0.04
TASA_PENSION_EMPLEADO = 0.04

# Tasas prestaciones sociales (a cargo del empleador en contrato laboral)
TASA_PRIMA = 0.0833333333        # 1 mes de salario por año
TASA_CESANTIAS = 0.0833333333    # 1 mes de salario por año
TASA_INTERESES_CESANTIAS = 0.01  # 12% anual sobre cesantías (1% mensual)
TASA_VACACIONES = 0.0416666667   # 15 días hábiles por año (~4.17% mensual)

# Tasas trabajador independiente / prestación de servicios (PILA)
FACTOR_IBC_INDEPENDIENTE = 0.40  # Base mínima de cotización: 40% del valor mensual
TASA_SALUD_INDEPENDIENTE = 0.125 # 12.5% sobre IBC
TASA_PENSION_INDEPENDIENTE = 0.16 # 16.0% sobre IBC
TASA_ARL_RIESGO_I = 0.00522      # Riesgo clase I (actividades de oficina / software)


def calculate_laboral(salario_bruto: float) -> Dict[str, Any]:
    """Calcula ingresos netos, deducciones y prestaciones de un contrato laboral."""
    salario_bruto = float(salario_bruto)
    recibe_auxilio = salario_bruto <= (2.0 * SMMLV_2026)
    aux_transporte = AUX_TRANSPORTE_2026 if recibe_auxilio else 0.0

    # Fondo de solidaridad pensional (aplica si salario >= 4 SMMLV)
    tasa_fsp = 0.0
    if salario_bruto >= (4.0 * SMMLV_2026):
        tasa_fsp = 0.01  # Base 1% entre 4 y 16 SMMLV

    aporte_salud = salario_bruto * TASA_SALUD_EMPLEADO
    aporte_pension = salario_bruto * TASA_PENSION_EMPLEADO
    aporte_fsp = salario_bruto * tasa_fsp

    total_deducciones = aporte_salud + aporte_pension + aporte_fsp
    neto_ordinario_mensual = salario_bruto + aux_transporte - total_deducciones

    # Prestaciones sociales legales diferidas (acumuladas equivalentes por mes)
    base_prestaciones = salario_bruto + aux_transporte
    prima_mes = base_prestaciones * TASA_PRIMA
    cesantias_mes = base_prestaciones * TASA_CESANTIAS
    intereses_cesantias_mes = cesantias_mes * 0.12
    vacaciones_mes = salario_bruto * TASA_VACACIONES  # Vacaciones no incluyen auxilio de transporte

    total_prestaciones_mes = prima_mes + cesantias_mes + intereses_cesantias_mes + vacaciones_mes
    ingreso_mensual_integral_equivalente = neto_ordinario_mensual + total_prestaciones_mes
    ingreso_anual_consolidado = (neto_ordinario_mensual * 12) + (total_prestaciones_mes * 12)

    return {
        "tipo_contrato": "Laboral (Término Indefinido / Fijo)",
        "salario_bruto": salario_bruto,
        "auxilio_transporte": aux_transporte,
        "deducciones": {
            "salud": aporte_salud,
            "pension": aporte_pension,
            "fsp": aporte_fsp,
            "total": total_deducciones,
        },
        "neto_ordinario_mensual": neto_ordinario_mensual,
        "prestaciones_mes_equivalente": {
            "prima": prima_mes,
            "cesantias": cesantias_mes,
            "intereses_cesantias": intereses_cesantias_mes,
            "vacaciones": vacaciones_mes,
            "total": total_prestaciones_mes,
        },
        "ingreso_mensual_integral_equivalente": ingreso_mensual_integral_equivalente,
        "ingreso_anual_consolidado": ingreso_anual_consolidado,
    }


def calculate_servicios(honorarios_brutos: float, clase_riesgo_arl: float = TASA_ARL_RIESGO_I) -> Dict[str, Any]:
    """Calcula ingresos netos y aportes a PILA de un contrato por prestación de servicios."""
    honorarios_brutos = float(honorarios_brutos)

    # Cálculo del Ingreso Base de Cotización (IBC)
    ibc_calculado = honorarios_brutos * FACTOR_IBC_INDEPENDIENTE
    # El IBC no puede ser inferior a 1 SMMLV ni superior a 25 SMMLV
    ibc = max(SMMLV_2026, min(ibc_calculado, SMMLV_2026 * TOPE_SMMLV_IBC))

    aporte_salud = ibc * TASA_SALUD_INDEPENDIENTE
    aporte_pension = ibc * TASA_PENSION_INDEPENDIENTE
    aporte_arl = ibc * clase_riesgo_arl

    # Fondo de solidaridad pensional sobre IBC si IBC >= 4 SMMLV
    tasa_fsp = 0.01 if ibc >= (4.0 * SMMLV_2026) else 0.0
    aporte_fsp = ibc * tasa_fsp

    total_pila = aporte_salud + aporte_pension + aporte_arl + aporte_fsp
    neto_disponible_mensual = honorarios_brutos - total_pila
    ingreso_anual_consolidado = neto_disponible_mensual * 12

    return {
        "tipo_contrato": "Prestación de Servicios (Honorarios)",
        "honorarios_brutos": honorarios_brutos,
        "ibc": ibc,
        "aportes_pila": {
            "salud": aporte_salud,
            "pension": aporte_pension,
            "arl": aporte_arl,
            "fsp": aporte_fsp,
            "total": total_pila,
        },
        "neto_disponible_mensual": neto_disponible_mensual,
        "prestaciones_legales": 0.0,
        "ingreso_mensual_integral_equivalente": neto_disponible_mensual,
        "ingreso_anual_consolidado": ingreso_anual_consolidado,
    }


def calculate_usd(monto_usd: float, trm: float = TRM_DEFAULT) -> Dict[str, Any]:
    """Calcula el equivalente en COP de una oferta en USD como trabajador independiente."""
    monto_usd = float(monto_usd)
    trm = float(trm)
    cop_bruto = monto_usd * trm

    # Cotiza en Colombia bajo esquema independiente sobre los ingresos percibidos
    servicios_data = calculate_servicios(cop_bruto)
    neto_cop = servicios_data["neto_disponible_mensual"]
    neto_usd = neto_cop / trm

    return {
        "tipo_contrato": f"Remoto Internacional (USD @ TRM ${trm:,.0f})",
        "monto_usd": monto_usd,
        "trm": trm,
        "bruto_cop": cop_bruto,
        "ibc_cop": servicios_data["ibc"],
        "aportes_pila_cop": servicios_data["aportes_pila"]["total"],
        "neto_disponible_mensual_cop": neto_cop,
        "neto_disponible_mensual_usd": neto_usd,
        "ingreso_mensual_integral_equivalente": neto_cop,
        "ingreso_anual_consolidado_cop": neto_cop * 12,
    }


def compare_offers(offers: List[Dict[str, Any]]) -> str:
    """Genera una tabla comparativa en texto plano con el análisis de cada oferta."""
    if not offers:
        return "No hay ofertas para comparar."

    headers = [
        "OFERTA / ESQUEMA",
        "BRUTO MENSUAL",
        "DEDUCCIONES/PILA",
        "NETO ORDINARIO",
        "PRESTACIONES/MES",
        "INTEGRAL EQUIV.",
    ]
    rows = []
    for o in offers:
        tipo = o.get("tipo_contrato", "Oferta")
        bruto = o.get("salario_bruto") or o.get("honorarios_brutos") or o.get("bruto_cop", 0.0)
        deducciones = (
            o.get("deducciones", {}).get("total")
            or o.get("aportes_pila", {}).get("total")
            or o.get("aportes_pila_cop", 0.0)
        )
        neto = o.get("neto_ordinario_mensual") or o.get("neto_disponible_mensual") or o.get("neto_disponible_mensual_cop", 0.0)
        prestaciones = o.get("prestaciones_mes_equivalente", {}).get("total", 0.0)
        integral = o.get("ingreso_mensual_integral_equivalente", neto)

        rows.append([
            tipo[:32],
            f"${bruto:,.0f}",
            f"${deducciones:,.0f}",
            f"${neto:,.0f}",
            f"${prestaciones:,.0f}",
            f"${integral:,.0f}",
        ])

    col_widths = [max(len(row[i]) for row in [headers] + rows) + 2 for i in range(len(headers))]

    header_line = "".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    separator = "-" * len(header_line)
    body = "\n".join("".join(c.ljust(col_widths[i]) for i, c in enumerate(row)) for row in rows)

    return f"{header_line}\n{separator}\n{body}"


def main():
    parser = argparse.ArgumentParser(description="Calculador de Compensación y Salarios de Colombia")
    parser.add_argument("--laboral", type=float, help="Calcular oferta por contrato laboral (COP)")
    parser.add_argument("--servicios", type=float, help="Calcular oferta por prestación de servicios (COP)")
    parser.add_argument("--usd", type=float, help="Calcular oferta en USD")
    parser.add_argument("--trm", type=float, default=TRM_DEFAULT, help=f"TRM para conversión USD (default: ${TRM_DEFAULT:,.0f})")
    parser.add_argument("--compare", action="store_true", help="Comparar todas las opciones provistas")
    parser.add_argument("--json", action="store_true", help="Salida en formato JSON")

    args = parser.parse_args()

    results = []
    if args.laboral is not None:
        results.append(calculate_laboral(args.laboral))
    if args.servicios is not None:
        results.append(calculate_servicios(args.servicios))
    if args.usd is not None:
        results.append(calculate_usd(args.usd, args.trm))

    if not results:
        parser.print_help()
        sys.exit(0)

    if args.json:
        print(json.dumps(results if len(results) > 1 else results[0], indent=2, ensure_ascii=False))
        return

    if args.compare or len(results) > 1:
        print("\n=== COMPARATIVA FINANCIERA DE OFERTAS (COLOMBIA) ===")
        print(compare_offers(results))
        print("\n* Nota: 'INTEGRAL EQUIV.' incluye salario neto ordinario más el prorrateo mensual de prima, cesantías y vacaciones.\n")
    else:
        r = results[0]
        print(f"\n=== RESUMEN DE COMPENSACIÓN: {r['tipo_contrato']} ===")
        for k, v in r.items():
            if isinstance(v, dict):
                print(f"  {k}:")
                for sub_k, sub_v in v.items():
                    print(f"    - {sub_k}: ${sub_v:,.0f}" if isinstance(sub_v, (int, float)) else f"    - {sub_k}: {sub_v}")
            elif isinstance(v, (int, float)):
                print(f"  {k}: ${v:,.0f}")
            else:
                print(f"  {k}: {v}")
        print()


if __name__ == "__main__":
    main()
