"""Política de nomes (externalIds) do seed — esquema `_group_3`.

Mantém a convenção já validada no JSON original (nodes) e adiciona ids estáveis para
o root Asset e para as edges. Centralizar a política aqui garante idempotência
(re-rodar gera os mesmos externalIds) e evita strings mágicas espalhadas (DRY).
"""

from __future__ import annotations

import re

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_TRIM = re.compile(r"^-+|-+$")


def slugify(value: str) -> str:
    """Igual ao slugify do gerador original (lower, não-alnum→'-', trim)."""
    return _TRIM.sub("", _NON_ALNUM.sub("-", value.lower()))


class Namer:
    """Constrói externalIds determinísticos a partir de um sufixo de grupo."""

    def __init__(self, suffix: str) -> None:
        self._suffix = suffix

    def with_suffix(self, base: str) -> str:
        return base if base.endswith(self._suffix) else f"{base}{self._suffix}"

    # ---- nodes ----
    def checklist_base(self, floor_name: str) -> str:
        return f"eq-{slugify(floor_name)}"

    def checklist_id(self, floor_name: str) -> str:
        return self.with_suffix(self.checklist_base(floor_name))

    def asset_id(self, floor_name: str, equipment_name: str, order: int) -> str:
        return self.with_suffix(
            f"asset-{slugify(floor_name)}-{slugify(equipment_name)}-{order}"
        )

    def root_asset_id(self) -> str:
        return self.with_suffix("asset-route-root")

    def item_base(
        self, floor_name: str, equipment_name: str, equipment_order: int, order_in_equipment: int
    ) -> str:
        return (
            f"eq-{slugify(floor_name)}-{slugify(equipment_name)}"
            f"-{equipment_order}-check-{order_in_equipment}"
        )

    def item_id(
        self, floor_name: str, equipment_name: str, equipment_order: int, order_in_equipment: int
    ) -> str:
        return self.with_suffix(
            self.item_base(floor_name, equipment_name, equipment_order, order_in_equipment)
        )

    def measurement_id(self, measurement_key: str) -> str:
        return self.with_suffix(f"measurement-{slugify(measurement_key)}")

    def user_id(self, role_slug: str) -> str:
        return self.with_suffix(f"cdf-user-{role_slug}-seed")

    # ---- edges (um por item) ----
    def edge_checklist_item_id(self, item_base: str) -> str:
        return self.with_suffix(f"rci-{item_base}")

    def edge_measurement_id(self, item_base: str) -> str:
        return self.with_suffix(f"rms-{item_base}")
