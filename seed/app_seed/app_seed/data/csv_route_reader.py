"""Leitura e parsing do CSV da rota OEC → entidade `Route`.

A função `parse_route` é pura (recebe texto, devolve `Route`) e portanto testável sem
arquivos. `CsvRouteReader` adiciona a leitura de arquivo (IO).

Regras de parsing (validadas contra o CSV de referência — 8 andares / 35 equipamentos /
193 checagens / 4 medições distintas):
  - Andar: primeira célula casa `^(?:\\d+(\\.\\d+)?(st|nd|rd|th)|Ground) Floor$`.
  - Equipamento: coluna B == "Task Complete" e coluna C preenchida (nome do equipamento);
    a tag/WO é a primeira das colunas E..G que for puramente numérica.
  - Checagem: linha começa com `;? ;` (checkbox), com equipamento corrente e coluna C
    preenchida (título da checagem).
  - Medição: colunas D/E; valor exibido = E se houver, senão D; `key` = "D|E" deduplica.
  - Bloco "Exceptions:" é ignorado até a próxima linha em branco/andar.
"""

from __future__ import annotations

import re
from pathlib import Path

from app_seed.domain.entities import (
    Check,
    Equipment,
    Floor,
    MeasurementSpec,
    Route,
)

_FLOOR_RE = re.compile(r"^(?:\d+(?:\.\d+)?(?:st|nd|rd|th)|Ground) Floor$", re.IGNORECASE)
_CHECKBOX_RE = re.compile(r"^;\?\s*;")
_NUMERIC_RE = re.compile(r"^\d+$")


def _cells(line: str) -> list[str]:
    return [cell.strip() for cell in line.split(";")]


def _measurement_from_cells(cells: list[str]) -> MeasurementSpec | None:
    col_d = cells[4] if len(cells) > 4 else ""
    col_e = cells[5] if len(cells) > 5 else ""
    display = col_e or col_d
    if not display:
        return None
    key = f"{col_d}|{col_e}".rstrip("|")
    return MeasurementSpec(key=key, column_d=col_d, column_e=col_e, display=display)


def parse_route(content: str, *, source_file: str, spreadsheet_name: str) -> Route:
    """Parseia o conteúdo do CSV em uma `Route` (função pura)."""
    lines = content.split("\n")
    route_title = (lines[1].split(";")[0].strip() if len(lines) > 1 else "") or "Route"

    route = Route(
        title=route_title,
        spreadsheet_name=spreadsheet_name,
        source_file=source_file,
    )

    current_floor: Floor | None = None
    current_equipment: Equipment | None = None
    equipment_order = 0
    order_in_equipment = 0
    global_order = 0
    in_exceptions = False
    exception_lines: list[str] = []

    for index, line in enumerate(lines):
        line_number = index + 1
        first_cell = (line.split(";")[0] if line else "").strip()

        if _FLOOR_RE.match(first_cell):
            if current_floor is not None and exception_lines:
                current_floor.exceptions = list(exception_lines)
            exception_lines = []
            in_exceptions = False
            current_floor = Floor(name=first_cell)
            route.floors.append(current_floor)
            current_equipment = None
            equipment_order = 0
            order_in_equipment = 0
            continue

        if current_floor is None:
            continue

        cells = _cells(line)
        # O rótulo "Exceptions:" aparece na coluna A ou B conforme a linha do CSV.
        label = (cells[0] or (cells[1] if len(cells) > 1 else "")).strip()
        if label.lower().startswith("exceptions"):
            in_exceptions = True
            current_equipment = None
            continue

        if in_exceptions:
            if all(c == "" for c in cells):
                in_exceptions = False
                if exception_lines:
                    current_floor.exceptions = list(exception_lines)
                    exception_lines = []
            else:
                text = " ".join(c for c in cells if c).strip()
                if text:
                    exception_lines.append(text)
            continue

        col_b = cells[1] if len(cells) > 1 else ""
        col_c = cells[2] if len(cells) > 2 else ""

        if col_b == "Task Complete" and col_c:
            equipment_order += 1
            order_in_equipment = 0
            asset_tag = next(
                (c for c in cells[4:7] if c and _NUMERIC_RE.match(c)), None
            )
            current_equipment = Equipment(
                name=col_c,
                order=equipment_order,
                floor_name=current_floor.name,
                asset_tag=asset_tag,
            )
            current_floor.equipments.append(current_equipment)
            continue

        if _CHECKBOX_RE.match(line) and current_equipment is not None and col_c:
            order_in_equipment += 1
            global_order += 1
            current_equipment.checks.append(
                Check(
                    title=col_c,
                    csv_line=line_number,
                    global_order=global_order,
                    order_in_equipment=order_in_equipment,
                    floor_name=current_floor.name,
                    equipment_name=current_equipment.name,
                    measurement=_measurement_from_cells(cells),
                )
            )

    if current_floor is not None and exception_lines:
        current_floor.exceptions = list(exception_lines)

    return route


class CsvRouteReader:
    """Lê o CSV da rota de um arquivo e devolve a entidade `Route`."""

    def __init__(self, *, spreadsheet_name: str) -> None:
        self._spreadsheet_name = spreadsheet_name

    def read(self, csv_path: Path) -> Route:
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV não encontrado: {csv_path}")
        content = csv_path.read_text(encoding="utf-8", errors="replace")
        return parse_route(
            content,
            source_file=csv_path.name,
            spreadsheet_name=self._spreadsheet_name,
        )
