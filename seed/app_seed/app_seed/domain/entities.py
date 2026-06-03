"""Entidades de domínio que representam o conteúdo do CSV da rota OEC.

Estas entidades são agnósticas ao CDF: descrevem a rota, andares, equipamentos,
checagens e especificações de medição como extraídos da planilha. O mapeamento
para o data model cdf_apm acontece em `services/seed_builder_service.py`.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class MeasurementSpec:
    """Especificação de medição de uma checagem (colunas D/E do CSV).

    `key` deduplica medições idênticas em todo o seed (catálogo compartilhado).
    `column_d`/`column_e` preservam os valores crus para o mapeamento rico.
    `display` é o rótulo legível (colE se houver, senão colD).
    """

    key: str
    column_d: str
    column_e: str
    display: str


@dataclass(frozen=True)
class Check:
    """Uma linha de checagem (checkbox `;? ;`) do CSV → futura ChecklistItem."""

    title: str
    csv_line: int
    global_order: int
    order_in_equipment: int
    floor_name: str
    equipment_name: str
    measurement: MeasurementSpec | None


@dataclass
class Equipment:
    """Um equipamento (linha `Task Complete`) → futuro Asset."""

    name: str
    order: int
    floor_name: str
    asset_tag: str | None
    checks: list[Check] = field(default_factory=list)


@dataclass
class Floor:
    """Um andar do CSV → futura Checklist."""

    name: str
    equipments: list[Equipment] = field(default_factory=list)
    exceptions: list[str] = field(default_factory=list)


@dataclass
class Route:
    """A rota OEC completa parseada do CSV."""

    title: str
    spreadsheet_name: str
    source_file: str
    floors: list[Floor] = field(default_factory=list)

    def all_equipments(self) -> list[Equipment]:
        return [eq for fl in self.floors for eq in fl.equipments]

    def all_checks(self) -> list[Check]:
        return [c for eq in self.all_equipments() for c in eq.checks]

    def distinct_measurements(self) -> list[MeasurementSpec]:
        seen: dict[str, MeasurementSpec] = {}
        for check in self.all_checks():
            if check.measurement and check.measurement.key not in seen:
                seen[check.measurement.key] = check.measurement
        return list(seen.values())


@dataclass(frozen=True)
class User:
    """Usuário sintético (supervisor/operador) → CDF_User."""

    external_id: str
    name: str
    email: str
    role: str  # "supervisor" | "operator"
