"""Mapeamento RICO de `MeasurementSpec` (CSV) → propriedades de `MeasurementReading:v4`.

A view MeasurementReading NÃO tem name/unit/limit; tem title/type/min/max/options/...
Por isso traduzimos a semântica das checagens do CSV:

  - "OK / Not OK"  → type="checkbox", options=["OK", "Not OK"]
  - "Yes / No"     → type="checkbox", options=["Yes", "No"]
  - "ips"          → type="numerical" (vibração, sem limite informado)
  - "?F" + ">170"  → type="numerical", max=170.0 (limite de alarme em °F)

O '?' antes de F no CSV é o símbolo de grau perdido na codificação → normalizamos p/ "°".
"""

from __future__ import annotations

import re

from app_seed.domain.entities import MeasurementSpec

_LIMIT_RE = re.compile(r"^\s*(<=|>=|<|>|=)?\s*([+-]?\d+(?:\.\d+)?)\s*$")
_UNIT_TITLES = {
    "°F": "Temperature (°F)",
    "ips": "Vibration (ips)",
    "mm": "Displacement (mm)",
}


def _normalize_unit(column_d: str) -> str | None:
    raw = column_d.strip()
    if not raw:
        return None
    # "?F" / "ºF" → "°F"; o '?' é o grau perdido na exportação do CSV.
    if re.fullmatch(r"[?ºo°]\s*F", raw, flags=re.IGNORECASE):
        return "°F"
    low = raw.lower()
    if low == "ips":
        return "ips"
    if low == "mm":
        return "mm"
    return None


def _parse_limit(column_e: str) -> tuple[float | None, float | None]:
    """Converte ">170"/"<5"/"=10" em (min, max). ">x" → max=x; "<x" → min=x."""
    match = _LIMIT_RE.match(column_e or "")
    if not match:
        return (None, None)
    comparator, number = match.group(1) or "", float(match.group(2))
    if comparator in (">", ">="):
        return (None, number)  # alarme acima de `number` ⇒ máximo aceitável = number
    if comparator in ("<", "<="):
        return (number, None)  # alarme abaixo de `number` ⇒ mínimo aceitável = number
    return (number, number)  # "=x"


class MeasurementMapper:
    """Traduz uma especificação de medição nas propriedades do MeasurementReading."""

    def __init__(self, *, spreadsheet_name: str) -> None:
        self._spreadsheet_name = spreadsheet_name

    def to_properties(self, spec: MeasurementSpec) -> dict[str, object]:
        unit = _normalize_unit(spec.column_d)
        min_value, max_value = _parse_limit(spec.column_e)
        is_numeric = unit is not None or min_value is not None or max_value is not None

        if is_numeric:
            return self._numeric_properties(spec, unit, min_value, max_value)
        return self._enum_properties(spec)

    # ------------------------------------------------------------------
    def _numeric_properties(
        self,
        spec: MeasurementSpec,
        unit: str | None,
        min_value: float | None,
        max_value: float | None,
    ) -> dict[str, object]:
        title = _UNIT_TITLES.get(unit or "", spec.display or "Numeric reading")
        limit_text = spec.column_e.strip()
        description = f"Leitura numérica ({unit or 's/ unidade'})"
        if limit_text:
            description += f"; limite '{limit_text}'"
        props: dict[str, object] = {
            "title": title,
            "type": "numerical",
            "description": description,
            "labels": ["OEC", self._spreadsheet_name],
        }
        if min_value is not None:
            props["min"] = min_value
        if max_value is not None:
            props["max"] = max_value
        return props

    def _enum_properties(self, spec: MeasurementSpec) -> dict[str, object]:
        raw = spec.column_d or spec.display
        labels = [part.strip() for part in raw.split("/") if part.strip()] or [raw]
        return {
            "title": spec.display,
            "type": "checkbox",
            "description": f"Checagem categórica: {' / '.join(labels)}",
            "labels": ["OEC", self._spreadsheet_name],
            # A view exige `options` como array de OBJETOS JSON (não strings).
            "options": [{"label": label, "value": label} for label in labels],
        }
