"""Factory de edges (referenceChecklistItems e referenceMeasurements)."""

from __future__ import annotations

from app_seed.config.model_ids import (
    EDGE_REFERENCE_CHECKLIST_ITEMS,
    EDGE_REFERENCE_MEASUREMENTS,
)
from app_seed.domain.instances import EdgeInstance
from app_seed.domain.naming import Namer
from app_seed.domain.refs import InstanceRef


class EdgeFactory:
    """Constrói as edges que conectam Checklist→Item e Item→Measurement."""

    def __init__(self, instance_space: str, namer: Namer) -> None:
        self._space = instance_space
        self._namer = namer

    def checklist_item_edge(
        self, item_base: str, checklist_ref: InstanceRef, item_ref: InstanceRef
    ) -> EdgeInstance:
        return EdgeInstance(
            external_id=self._namer.edge_checklist_item_id(item_base),
            space=self._space,
            edge_type=EDGE_REFERENCE_CHECKLIST_ITEMS,
            start_node=checklist_ref,
            end_node=item_ref,
        )

    def measurement_edge(
        self, item_base: str, item_ref: InstanceRef, measurement_ref: InstanceRef
    ) -> EdgeInstance:
        return EdgeInstance(
            external_id=self._namer.edge_measurement_id(item_base),
            space=self._space,
            edge_type=EDGE_REFERENCE_MEASUREMENTS,
            start_node=item_ref,
            end_node=measurement_ref,
        )
