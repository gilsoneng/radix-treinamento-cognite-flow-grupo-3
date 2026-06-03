"""Factory de nodes MeasurementReading (catálogo deduplicado)."""

from __future__ import annotations

from dataclasses import dataclass

from app_seed.config.model_ids import VIEW_MEASUREMENT_READING
from app_seed.domain.constants import VISIBILITY_PUBLIC
from app_seed.domain.entities import Route
from app_seed.domain.instances import NodeInstance
from app_seed.domain.naming import Namer
from app_seed.domain.refs import InstanceRef
from app_seed.services.measurement_mapper import MeasurementMapper


@dataclass(frozen=True)
class MeasurementCatalog:
    """Nodes de medição + referências por chave de especificação."""

    nodes: list[NodeInstance]
    refs: dict[str, InstanceRef]


class MeasurementFactory:
    """Constrói o catálogo (deduplicado) de MeasurementReadings da rota."""

    def __init__(self, instance_space: str, namer: Namer, mapper: MeasurementMapper) -> None:
        self._space = instance_space
        self._namer = namer
        self._mapper = mapper

    def build_catalog(self, route: Route, created_by: InstanceRef) -> MeasurementCatalog:
        nodes: list[NodeInstance] = []
        refs: dict[str, InstanceRef] = {}
        for spec in route.distinct_measurements():
            measurement_id = self._namer.measurement_id(spec.key)
            properties = self._mapper.to_properties(spec)
            properties.update(
                {
                    "visibility": VISIBILITY_PUBLIC,
                    "isArchived": False,
                    "createdBy": created_by.as_dict(),
                    "updatedBy": created_by.as_dict(),
                }
            )
            nodes.append(
                NodeInstance(measurement_id, self._space, VIEW_MEASUREMENT_READING, properties)
            )
            refs[spec.key] = InstanceRef(self._space, measurement_id)
        return MeasurementCatalog(nodes=nodes, refs=refs)
