"""Factory de nodes Checklist (cdf_apm.Checklist:v7) e ChecklistItem (cdf_apm.ChecklistItem:v7).

NÃO grava `checklistItems`/`measurements`/`exception` como propriedade — essas relações
são edges (ver EdgeFactory).
"""

from __future__ import annotations

from app_seed.config.model_ids import VIEW_CHECKLIST, VIEW_CHECKLIST_ITEM
from app_seed.domain.constants import CHECKLIST_TYPE_OEC, VISIBILITY_PUBLIC
from app_seed.domain.entities import Check, Floor
from app_seed.domain.instances import NodeInstance
from app_seed.domain.naming import Namer
from app_seed.domain.refs import InstanceRef, JsonObject
from app_seed.services.calibration_service import TimingProfile


class ChecklistFactory:
    """Constrói nodes de Checklist e de ChecklistItem."""

    def __init__(self, instance_space: str, namer: Namer, spreadsheet_name: str) -> None:
        self._space = instance_space
        self._namer = namer
        self._spreadsheet_name = spreadsheet_name

    def build_checklist(
        self,
        *,
        floor: Floor,
        checklist_id: str,
        title: str,
        asset_names: list[str],
        profile: TimingProfile,
        created_by: InstanceRef,
        updated_by: InstanceRef,
        assigned_to: list[str],
        root_ref: InstanceRef,
        created_iso: str,
        updated_iso: str,
    ) -> NodeInstance:
        properties: JsonObject = {
            "sourceId": f"SRC-{floor.name}",
            "source": floor.name,
            "sourceCreatedTime": created_iso,
            "sourceUpdatedTime": updated_iso,
            "title": title,
            "description": title,
            "labels": [floor.name, *asset_names],
            "visibility": VISIBILITY_PUBLIC,
            "createdBy": created_by.as_dict(),
            "updatedBy": updated_by.as_dict(),
            "isArchived": False,
            "type": CHECKLIST_TYPE_OEC,
            "status": profile.status,
            "rootLocation": root_ref.as_dict(),
            "assignedTo": assigned_to,
            "solutionTags": [],
        }
        _apply_window(properties, profile)
        return NodeInstance(checklist_id, self._space, VIEW_CHECKLIST, properties)

    def build_item(
        self,
        *,
        check: Check,
        item_id: str,
        checklist_title: str,
        asset_ref: InstanceRef,
        created_by: InstanceRef,
        updated_by: InstanceRef,
        profile: TimingProfile,
        created_iso: str,
        updated_iso: str,
    ) -> NodeInstance:
        properties: JsonObject = {
            "sourceId": f"LIN-{check.csv_line}",
            "source": f"{check.equipment_name} | {check.floor_name} | {self._spreadsheet_name}",
            "sourceCreatedTime": created_iso,
            "sourceUpdatedTime": updated_iso,
            "title": check.title,
            "description": f"{check.title} of {check.equipment_name} for {check.floor_name}",
            "labels": [checklist_title],
            "visibility": VISIBILITY_PUBLIC,
            "createdBy": created_by.as_dict(),
            "updatedBy": updated_by.as_dict(),
            "isArchived": False,
            "order": check.global_order,
            "status": profile.status,
            "note": "",
            "asset": asset_ref.as_dict(),
        }
        _apply_window(properties, profile)
        return NodeInstance(item_id, self._space, VIEW_CHECKLIST_ITEM, properties)


def _apply_window(properties: JsonObject, profile: TimingProfile) -> None:
    if profile.start_time is not None:
        properties["startTime"] = profile.start_time
    if profile.end_time is not None:
        properties["endTime"] = profile.end_time
