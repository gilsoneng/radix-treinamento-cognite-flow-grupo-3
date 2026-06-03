"""Construção do bloco `meta` do SeedBundle (descrição + estatísticas)."""

from __future__ import annotations

from dataclasses import dataclass

from app_seed.domain.entities import Route
from app_seed.domain.timestamps import to_iso
from app_seed.services.calibration_service import NOW


@dataclass(frozen=True)
class SeedCounts:
    """Contagens das instâncias do seed (para `meta.stats`)."""

    checklists: int
    items: int
    assets: int
    measurements: int
    users: int
    edges: int

    @property
    def nodes(self) -> int:
        return self.checklists + self.items + self.assets + self.measurements + self.users


class MetadataBuilder:
    """Monta o dicionário `meta` do bundle a partir da rota e das contagens."""

    def build(self, route: Route, instance_space: str, counts: SeedCounts) -> dict[str, object]:
        return {
            "generator": "app_seed",
            "sourceFile": route.source_file,
            "spreadsheetName": route.spreadsheet_name,
            "routeTitle": route.title,
            "instanceSpace": instance_space,
            "referenceDate": to_iso(NOW),
            "dataModel": {"space": "cdf_apm", "externalId": "ApmAppData", "version": "v13"},
            "views": {
                "checklist": "cdf_apm:Checklist/v7",
                "checklistItem": "cdf_apm:ChecklistItem/v7",
                "measurementReading": "cdf_apm:MeasurementReading/v4",
                "asset": "cdf_core:Asset/v2",
                "cdfUser": "cdf_apps_shared:CDF_User/v1",
            },
            "edgeTypes": {
                "checklistItems": "cdf_apm:referenceChecklistItems",
                "measurements": "cdf_apm:referenceMeasurements",
            },
            "stats": {
                "floorsChecklists": counts.checklists,
                "assets": counts.assets,
                "checklistItems": counts.items,
                "measurements": counts.measurements,
                "cdfUsers": counts.users,
                "nodes": counts.nodes,
                "edges": counts.edges,
            },
        }
