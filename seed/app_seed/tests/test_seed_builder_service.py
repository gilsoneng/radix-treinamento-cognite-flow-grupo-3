"""Testes de invariantes do builder (mapeamento domínio → cdf_apm)."""

from __future__ import annotations

import pytest

from app_seed.domain.naming import Namer
from app_seed.models.seed_bundle import SeedBundle
from app_seed.services.calibration_service import CalibrationService
from app_seed.services.measurement_mapper import MeasurementMapper
from app_seed.services.seed_builder_service import SeedBuilderService

SPACE = "cognite-flows-grupo-3"


def _builder() -> SeedBuilderService:
    return SeedBuilderService(
        instance_space=SPACE,
        namer=Namer("_group_3"),
        measurement_mapper=MeasurementMapper(spreadsheet_name="Route 1 - Dig IV Diff"),
        calibration=CalibrationService(),
        spreadsheet_name="Route 1 - Dig IV Diff",
    )


@pytest.fixture(scope="module")
def bundle(route) -> SeedBundle:
    return _builder().build(route)


def _nodes_of(bundle: SeedBundle, view_external_id: str):
    return [n for n in bundle.nodes if n.view.external_id == view_external_id]


def test_node_counts(bundle):
    assert len(_nodes_of(bundle, "Checklist")) == 8
    assert len(_nodes_of(bundle, "ChecklistItem")) == 193
    assert len(_nodes_of(bundle, "Asset")) == 36  # 35 equipamentos + 1 root
    assert len(_nodes_of(bundle, "MeasurementReading")) == 4
    assert len(_nodes_of(bundle, "CDF_User")) == 4
    assert len(bundle.nodes) == 245


def test_edge_counts(bundle):
    rci = [e for e in bundle.edges if e.edge_type.external_id == "referenceChecklistItems"]
    rms = [e for e in bundle.edges if e.edge_type.external_id == "referenceMeasurements"]
    assert len(rci) == 193  # uma por item
    assert len(rms) == 192  # itens com medição (1 item sem medição)
    assert len(bundle.edges) == 385


def test_relations_are_edges_not_properties(bundle):
    # Checklist NÃO deve carregar checklistItems como propriedade (é edge)
    for cl in _nodes_of(bundle, "Checklist"):
        assert "checklistItems" not in cl.properties
    # ChecklistItem NÃO deve carregar measurements nem exception como propriedade
    for it in _nodes_of(bundle, "ChecklistItem"):
        assert "measurements" not in it.properties
        assert "exception" not in it.properties


def test_asset_uses_title_not_name(bundle):
    for asset in _nodes_of(bundle, "Asset"):
        assert "title" in asset.properties
        assert "name" not in asset.properties


def test_cdf_user_has_required_email(bundle):
    for user in _nodes_of(bundle, "CDF_User"):
        assert user.properties.get("email")  # email é obrigatório na view


def test_external_ids_unique(bundle):
    node_ids = [n.external_id for n in bundle.nodes]
    edge_ids = [e.external_id for e in bundle.edges]
    assert len(node_ids) == len(set(node_ids))
    assert len(edge_ids) == len(set(edge_ids))


def test_referential_integrity(bundle):
    node_ids = {n.external_id for n in bundle.nodes}
    # endpoints das edges existem
    for edge in bundle.edges:
        assert edge.start_node.external_id in node_ids
        assert edge.end_node.external_id in node_ids
    # direct relations dos itens/checklists apontam para nodes existentes
    for it in _nodes_of(bundle, "ChecklistItem"):
        assert it.properties["asset"]["externalId"] in node_ids
        assert it.properties["createdBy"]["externalId"] in node_ids
    for cl in _nodes_of(bundle, "Checklist"):
        assert cl.properties["rootLocation"]["externalId"] in node_ids


def test_views_target_real_model(bundle):
    expected = {
        "Checklist": ("cdf_apm", "v7"),
        "ChecklistItem": ("cdf_apm", "v7"),
        "MeasurementReading": ("cdf_apm", "v4"),
        "Asset": ("cdf_core", "v2"),
        "CDF_User": ("cdf_apps_shared", "v1"),
    }
    for node in bundle.nodes:
        space, version = expected[node.view.external_id]
        assert node.view.space == space
        assert node.view.version == version


def test_node_order_is_dependency_safe(bundle):
    # users e assets antes de checklists/items (direct relations já existem)
    views_in_order = [n.view.external_id for n in bundle.nodes]
    last_user = max(i for i, v in enumerate(views_in_order) if v == "CDF_User")
    first_checklist = min(i for i, v in enumerate(views_in_order) if v == "Checklist")
    first_item = min(i for i, v in enumerate(views_in_order) if v == "ChecklistItem")
    assert last_user < first_checklist
    assert first_checklist < first_item


def test_determinism(route):
    assert _builder().build(route).to_dict() == _builder().build(route).to_dict()
