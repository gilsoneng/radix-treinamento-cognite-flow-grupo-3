"""Factory de nodes Asset (cdf_core.Asset:v2 — usa `title`, não `name`)."""

from __future__ import annotations

from app_seed.config.model_ids import VIEW_ASSET
from app_seed.domain.constants import LABEL_OEC
from app_seed.domain.entities import Equipment, Floor, Route
from app_seed.domain.instances import NodeInstance
from app_seed.domain.naming import Namer
from app_seed.domain.refs import InstanceRef


class AssetFactory:
    """Constrói o Asset raiz da rota e os Assets de equipamento."""

    def __init__(self, instance_space: str, namer: Namer, spreadsheet_name: str) -> None:
        self._space = instance_space
        self._namer = namer
        self._spreadsheet_name = spreadsheet_name

    def build_root(self, route: Route) -> NodeInstance:
        return NodeInstance(
            external_id=self._namer.root_asset_id(),
            space=self._space,
            view=VIEW_ASSET,
            properties={
                "title": route.title,
                "description": f"Root location da rota: {route.title}",
                "labels": [LABEL_OEC, route.spreadsheet_name, "Route Root"],
                "source": route.source_file,
            },
        )

    def build_equipment(
        self, floor: Floor, equipment: Equipment, root_ref: InstanceRef
    ) -> NodeInstance:
        properties: dict[str, object] = {
            "title": equipment.name,
            "description": f"{equipment.name} on {floor.name}",
            "labels": [floor.name, self._space, LABEL_OEC],
            "source": self._spreadsheet_name,
            "parent": root_ref.as_dict(),
            "root": root_ref.as_dict(),
        }
        if equipment.asset_tag:
            properties["sourceId"] = equipment.asset_tag
        return NodeInstance(
            external_id=self._namer.asset_id(floor.name, equipment.name, equipment.order),
            space=self._space,
            view=VIEW_ASSET,
            properties=properties,
        )
