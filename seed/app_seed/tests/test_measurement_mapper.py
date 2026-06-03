"""Testes do mapeamento rico de medições."""

from __future__ import annotations

from app_seed.domain.entities import MeasurementSpec
from app_seed.services.measurement_mapper import MeasurementMapper

mapper = MeasurementMapper(spreadsheet_name="Demo")


def _spec(col_d: str, col_e: str = "") -> MeasurementSpec:
    display = col_e or col_d
    key = f"{col_d}|{col_e}".rstrip("|")
    return MeasurementSpec(key=key, column_d=col_d, column_e=col_e, display=display)


def test_ok_not_ok_is_checkbox_with_options():
    props = mapper.to_properties(_spec("OK / Not OK"))
    assert props["type"] == "checkbox"
    # `options` deve ser array de objetos JSON (exigência da view MeasurementReading)
    assert props["options"] == [
        {"label": "OK", "value": "OK"},
        {"label": "Not OK", "value": "Not OK"},
    ]
    assert "min" not in props and "max" not in props


def test_yes_no_is_checkbox():
    props = mapper.to_properties(_spec("Yes / No"))
    assert props["type"] == "checkbox"
    assert props["options"] == [
        {"label": "Yes", "value": "Yes"},
        {"label": "No", "value": "No"},
    ]


def test_temperature_limit_maps_to_max():
    props = mapper.to_properties(_spec("?F", ">170"))
    assert props["type"] == "numerical"
    assert props["max"] == 170.0
    assert props["title"] == "Temperature (°F)"


def test_ips_is_numeric_without_limit():
    props = mapper.to_properties(_spec("ips"))
    assert props["type"] == "numerical"
    assert "min" not in props and "max" not in props
    assert props["title"] == "Vibration (ips)"


def test_less_than_limit_maps_to_min():
    props = mapper.to_properties(_spec("mm", "<5"))
    assert props["min"] == 5.0
    assert "max" not in props
