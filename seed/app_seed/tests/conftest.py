"""Fixtures compartilhadas dos testes."""

from __future__ import annotations

from pathlib import Path

import pytest

from app_seed.data.csv_route_reader import CsvRouteReader
from app_seed.domain.entities import Route

_REPO_ROOT = Path(__file__).resolve().parents[3]
_CSV = _REPO_ROOT / "references" / "A Line OEC Routes 1(Route 1 - Dig IV Diff).csv"

SPREADSHEET_NAME = "Route 1 - Dig IV Diff"


@pytest.fixture(scope="session")
def csv_path() -> Path:
    return _CSV


@pytest.fixture(scope="session")
def route(csv_path: Path) -> Route:
    if not csv_path.exists():
        pytest.skip(f"CSV de referência ausente: {csv_path}")
    return CsvRouteReader(spreadsheet_name=SPREADSHEET_NAME).read(csv_path)
