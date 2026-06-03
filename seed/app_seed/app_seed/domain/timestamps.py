"""Formatação de timestamps ISO 8601 aceita pelo DMS (campos do tipo timestamp).

Centraliza a política de formatação (DRY) usada pela calibragem e pelo builder.
"""

from __future__ import annotations

from datetime import datetime, timedelta

_ISO_FORMAT = "%Y-%m-%dT%H:%M:%S.000Z"


def to_iso(moment: datetime) -> str:
    """Formata um datetime (UTC) no padrão ISO aceito pelo DMS."""
    return moment.strftime(_ISO_FORMAT)


def iso_days_before(reference: datetime, days: float) -> str:
    """ISO de `reference - days` (offset determinístico a partir de uma data base)."""
    return to_iso(reference - timedelta(days=days))
