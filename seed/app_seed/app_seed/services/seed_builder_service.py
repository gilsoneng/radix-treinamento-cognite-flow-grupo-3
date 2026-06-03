"""Orquestra a construção do `SeedBundle` (caso de uso `generate`).

Responsabilidade ÚNICA: orquestrar — percorre a `Route` e delega a criação de cada tipo
de instância às factories especialistas (users, assets, measurements, checklist/item, edges)
e a montagem dos metadados ao `MetadataBuilder`. O mapeamento domínio → cdf_apm vive nas factories.

A ordem de emissão dos nodes (users → assets → measurements → checklists → items) garante
que direct relations e endpoints de edges já existam no momento do upsert.
"""

from __future__ import annotations

from app_seed.domain.entities import Route
from app_seed.domain.naming import Namer
from app_seed.domain.refs import InstanceRef
from app_seed.domain.timestamps import iso_days_before
from app_seed.models.seed_bundle import SeedBundle
from app_seed.services.calibration_service import NOW, CalibrationService
from app_seed.services.factories.asset_factory import AssetFactory
from app_seed.services.factories.checklist_factory import ChecklistFactory
from app_seed.services.factories.edge_factory import EdgeFactory
from app_seed.services.factories.measurement_factory import MeasurementFactory
from app_seed.services.factories.user_factory import UserFactory
from app_seed.services.measurement_mapper import MeasurementMapper
from app_seed.services.seed_metadata import MetadataBuilder, SeedCounts


class SeedBuilderService:
    """Constrói o bundle de seed (nodes + edges) a partir de uma `Route`."""

    def __init__(
        self,
        *,
        instance_space: str,
        namer: Namer,
        measurement_mapper: MeasurementMapper,
        calibration: CalibrationService,
        spreadsheet_name: str,
    ) -> None:
        self._space = instance_space
        self._calibration = calibration
        self._users = UserFactory(instance_space, namer)
        self._assets = AssetFactory(instance_space, namer, spreadsheet_name)
        self._measurements = MeasurementFactory(instance_space, namer, measurement_mapper)
        self._checklists = ChecklistFactory(instance_space, namer, spreadsheet_name)
        self._edges = EdgeFactory(instance_space, namer)
        self._metadata = MetadataBuilder()
        self._namer = namer

    def build(self, route: Route) -> SeedBundle:
        users = self._users.build()
        root_asset = self._assets.build_root(route)
        root_ref = InstanceRef(self._space, root_asset.external_id)
        catalog = self._measurements.build_catalog(route, users.supervisor_ref)

        assets = [root_asset]
        checklists = []
        items = []
        edges = []

        for floor_index, floor in enumerate(route.floors):
            profile = self._calibration.checklist_profile(floor_index)
            checklist_id = self._namer.checklist_id(floor.name)
            checklist_ref = InstanceRef(self._space, checklist_id)
            title = f"{route.title} — {floor.name}"
            updated_by = users.operator_refs[floor_index % len(users.operator_refs)]
            created_iso = iso_days_before(NOW, 40 - floor_index)
            updated_iso = iso_days_before(NOW, 8 - min(floor_index, 7))

            asset_names: list[str] = []
            item_total = sum(len(eq.checks) for eq in floor.equipments)
            item_index = 0

            for equipment in floor.equipments:
                asset_node = self._assets.build_equipment(floor, equipment, root_ref)
                assets.append(asset_node)
                asset_ref = InstanceRef(self._space, asset_node.external_id)
                asset_names.append(equipment.name)

                for check in equipment.checks:
                    item_profile = self._calibration.item_profile(profile, item_index, item_total)
                    item_index += 1
                    item_base = self._namer.item_base(
                        floor.name, equipment.name, equipment.order, check.order_in_equipment
                    )
                    item_id = self._namer.with_suffix(item_base)
                    item_ref = InstanceRef(self._space, item_id)

                    items.append(
                        self._checklists.build_item(
                            check=check,
                            item_id=item_id,
                            checklist_title=title,
                            asset_ref=asset_ref,
                            created_by=users.supervisor_ref,
                            updated_by=updated_by,
                            profile=item_profile,
                            created_iso=created_iso,
                            updated_iso=updated_iso,
                        )
                    )
                    edges.append(
                        self._edges.checklist_item_edge(item_base, checklist_ref, item_ref)
                    )
                    if check.measurement is not None:
                        edges.append(
                            self._edges.measurement_edge(
                                item_base, item_ref, catalog.refs[check.measurement.key]
                            )
                        )

            checklists.append(
                self._checklists.build_checklist(
                    floor=floor,
                    checklist_id=checklist_id,
                    title=title,
                    asset_names=asset_names,
                    profile=profile,
                    created_by=users.supervisor_ref,
                    updated_by=updated_by,
                    assigned_to=_assigned_to(users.operator_names, floor_index),
                    root_ref=root_ref,
                    created_iso=created_iso,
                    updated_iso=updated_iso,
                )
            )

        nodes = [*users.nodes, *assets, *catalog.nodes, *checklists, *items]
        counts = SeedCounts(
            checklists=len(checklists),
            items=len(items),
            assets=len(assets),
            measurements=len(catalog.nodes),
            users=len(users.nodes),
            edges=len(edges),
        )
        meta = self._metadata.build(route, self._space, counts)
        return SeedBundle(nodes=nodes, edges=edges, meta=meta)


def _assigned_to(operator_names: list[str], floor_index: int) -> list[str]:
    if not operator_names:
        return []
    first = operator_names[floor_index % len(operator_names)]
    second = operator_names[(floor_index + 1) % len(operator_names)]
    return [first] if first == second else [first, second]
