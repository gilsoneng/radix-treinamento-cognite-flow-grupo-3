"""Testes do parser de CSV (camada data)."""

from __future__ import annotations

from app_seed.data.csv_route_reader import parse_route

_MINI_CSV = "\n".join(
    [
        "Header line;;;",
        "Route One - Demo;;;",
        ";;;",
        "7th Floor;;;",
        ";Task Complete;Diffuser Scraper;;;301112080;;;WO#:",
        ";? ;General Condition;;OK / Not OK;;",
        ";? ;Motor Temp;;?F;>170;;",
        ";? ;IB Vibrations;;ips;;",
        ";;;",
        ";Exceptions:;;;",
        "alguma exceção;;;",
        ";;;",
        "Ground Floor;;;",
        ";Task Complete;Kamyr Digester OD;;;291158080;;;WO#:",
        ";? ;Motor;;OK / Not OK;;",
        ";? ;Seal Water;;Yes / No;;",
    ]
)


def test_route_title_from_second_line():
    route = parse_route(_MINI_CSV, source_file="x.csv", spreadsheet_name="Demo")
    assert route.title == "Route One - Demo"


def test_counts_and_structure():
    route = parse_route(_MINI_CSV, source_file="x.csv", spreadsheet_name="Demo")
    assert [f.name for f in route.floors] == ["7th Floor", "Ground Floor"]
    assert len(route.all_equipments()) == 2
    assert len(route.all_checks()) == 5  # 3 + 2


def test_global_order_is_monotonic_across_floors():
    route = parse_route(_MINI_CSV, source_file="x.csv", spreadsheet_name="Demo")
    orders = [c.global_order for c in route.all_checks()]
    assert orders == [1, 2, 3, 4, 5]


def test_asset_tag_extracted_from_numeric_column():
    route = parse_route(_MINI_CSV, source_file="x.csv", spreadsheet_name="Demo")
    assert route.floors[0].equipments[0].asset_tag == "301112080"


def test_measurement_specs_distinct():
    route = parse_route(_MINI_CSV, source_file="x.csv", spreadsheet_name="Demo")
    keys = sorted(m.key for m in route.distinct_measurements())
    assert keys == ["?F|>170", "OK / Not OK", "Yes / No", "ips"]


def test_exceptions_are_not_checklist_items():
    route = parse_route(_MINI_CSV, source_file="x.csv", spreadsheet_name="Demo")
    assert route.floors[0].exceptions == ["alguma exceção"]
    # a linha de exceção não vira checagem
    assert all("exceção" not in c.title for c in route.all_checks())


# --- integração com o CSV de referência real ---


def test_reference_csv_counts(route):
    assert len(route.floors) == 8
    assert len(route.all_equipments()) == 35
    assert len(route.all_checks()) == 193
    assert len(route.distinct_measurements()) == 4
