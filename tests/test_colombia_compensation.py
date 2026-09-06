import unittest
from tools.compensation.colombia import (
    calculate_laboral,
    calculate_servicios,
    calculate_usd,
    compare_offers,
    SMMLV_2026,
    AUX_TRANSPORTE_2026,
)

class TestColombiaCompensation(unittest.TestCase):
    def test_laboral_without_transport_allowance(self):
        salario = 8000000.0  # > 2 SMMLV -> no aux transporte, >= 4 SMMLV -> 1% FSP
        res = calculate_laboral(salario)
        self.assertEqual(res["auxilio_transporte"], 0.0)
        # 4% salud (320,000) + 4% pension (320,000) + 1% fsp (80,000) = 720,000
        self.assertEqual(res["deducciones"]["total"], 720000.0)
        self.assertEqual(res["neto_ordinario_mensual"], 7280000.0)
        self.assertGreater(res["ingreso_mensual_integral_equivalente"], 7280000.0)

    def test_laboral_with_transport_allowance(self):
        salario = 2000000.0  # <= 2 SMMLV -> recibe aux transporte, < 4 SMMLV -> 0% FSP
        res = calculate_laboral(salario)
        self.assertEqual(res["auxilio_transporte"], AUX_TRANSPORTE_2026)
        self.assertEqual(res["deducciones"]["fsp"], 0.0)
        # 8% sobre salario ordinario = 160,000
        self.assertEqual(res["deducciones"]["total"], 160000.0)
        self.assertEqual(res["neto_ordinario_mensual"], 2000000.0 + AUX_TRANSPORTE_2026 - 160000.0)

    def test_servicios_ibc_and_pila(self):
        honorarios = 10000000.0
        res = calculate_servicios(honorarios)
        # IBC = 40% = 4,000,000 (between 1 and 25 SMMLV)
        self.assertEqual(res["ibc"], 4000000.0)
        self.assertAlmostEqual(res["aportes_pila"]["salud"], 4000000.0 * 0.125)
        self.assertAlmostEqual(res["aportes_pila"]["pension"], 4000000.0 * 0.16)
        self.assertEqual(res["prestaciones_legales"], 0.0)
        self.assertLess(res["neto_disponible_mensual"], honorarios)

    def test_servicios_minimum_ibc(self):
        honorarios = 1500000.0  # 40% is 600k, below SMMLV
        res = calculate_servicios(honorarios)
        self.assertEqual(res["ibc"], SMMLV_2026)

    def test_usd_conversion_and_pila(self):
        usd = 2000.0
        trm = 4000.0
        res = calculate_usd(usd, trm=trm)
        self.assertEqual(res["bruto_cop"], 8000000.0)
        self.assertGreater(res["neto_disponible_mensual_cop"], 6000000.0)
        self.assertAlmostEqual(res["neto_disponible_mensual_usd"], res["neto_disponible_mensual_cop"] / trm)

    def test_compare_offers_table(self):
        offers = [
            calculate_laboral(5000000),
            calculate_servicios(6500000),
        ]
        table = compare_offers(offers)
        self.assertIn("Laboral", table)
        self.assertIn("Prestaci", table)
        self.assertIn("$5,000,000", table)
