"""Testes de (de)serialização do SeedBundle."""

from __future__ import annotations

from app_seed.config.model_ids import (
    EDGE_REFERENCE_CHECKLIST_ITEMS,
    VIEW_CHECKLIST,
)
from app_seed.domain.instances import EdgeInstance, NodeInstance
from app_seed.domain.refs import InstanceRef
from app_seed.models.seed_bundle import SeedBundle


def _sample_bundle() -> SeedBundle:
    node = NodeInstance(
        external_id="eq-x_group_3",
        space="cognite-flows-grupo-3",
        view=VIEW_CHECKLIST,
        properties={"title": "X", "status": "To Do"},
    )
    edge = EdgeInstance(
        external_id="rci-x_group_3",
        space="cognite-flows-grupo-3",
        edge_type=EDGE_REFERENCE_CHECKLIST_ITEMS,
        start_node=InstanceRef("cognite-flows-grupo-3", "eq-x_group_3"),
        end_node=InstanceRef("cognite-flows-grupo-3", "item-x_group_3"),
    )
    return SeedBundle(nodes=[node], edges=[edge], meta={"k": "v"})


def test_node_bundle_dict_shape():
    bundle = _sample_bundle()
    raw = bundle.to_dict()
    node = raw["nodes"][0]
    assert node["instanceType"] == "node"
    src = node["sources"][0]["source"]
    assert (src["space"], src["externalId"], src["version"]) == ("cdf_apm", "Checklist", "v7")


def test_edge_bundle_dict_shape():
    raw = _sample_bundle().to_dict()
    edge = raw["edges"][0]
    assert edge["instanceType"] == "edge"
    assert edge["type"] == {"space": "cdf_apm", "externalId": "referenceChecklistItems"}
    assert edge["startNode"]["externalId"] == "eq-x_group_3"


def test_round_trip_preserves_data():
    original = _sample_bundle()
    restored = SeedBundle.from_dict(original.to_dict())
    assert restored.to_dict() == original.to_dict()
    assert restored.nodes[0].view.as_tuple() == ("cdf_apm", "Checklist", "v7")
    assert restored.edges[0].end_node.external_id == "item-x_group_3"
