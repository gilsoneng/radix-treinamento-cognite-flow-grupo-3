"""Testes do populator com um gateway falso (sem CDF real)."""

from __future__ import annotations

from app_seed.config.model_ids import ALL_VIEWS, VIEW_CHECKLIST, ViewRef
from app_seed.data.cdf_gateway import UpsertResult
from app_seed.domain.instances import NodeInstance, EdgeInstance
from app_seed.domain.refs import InstanceRef
from app_seed.config.model_ids import EDGE_REFERENCE_CHECKLIST_ITEMS
from app_seed.models.seed_bundle import SeedBundle
from app_seed.services.seed_populator_service import SeedPopulatorService

SPACE = "cognite-flows-grupo-3"


class FakeGateway:
    """Implementação de teste do CdfGateway que registra as chamadas."""

    def __init__(self, *, missing: list[ViewRef] | None = None, space_exists: bool = False) -> None:
        self._missing = missing or []
        self._space_exists = space_exists
        self.ensure_space_called = False
        self.nodes_upserted = 0
        self.edges_upserted = 0

    def find_missing_views(self, views):
        return list(self._missing)

    def space_exists(self, space: str) -> bool:
        return self._space_exists

    def ensure_space(self, space: str) -> None:
        self.ensure_space_called = True
        self._space_exists = True

    def upsert_nodes(self, nodes):
        self.nodes_upserted += len(nodes)
        return UpsertResult(written=len(nodes), unchanged=0)

    def upsert_edges(self, edges):
        self.edges_upserted += len(edges)
        return UpsertResult(written=len(edges), unchanged=0)


def _bundle() -> SeedBundle:
    node = NodeInstance("eq-x_group_3", SPACE, VIEW_CHECKLIST, {"title": "X"})
    edge = EdgeInstance(
        "rci-x_group_3", SPACE, EDGE_REFERENCE_CHECKLIST_ITEMS,
        InstanceRef(SPACE, "eq-x_group_3"), InstanceRef(SPACE, "it-x_group_3"),
    )
    return SeedBundle(nodes=[node], edges=[edge])


def test_dry_run_does_not_write():
    gateway = FakeGateway()
    report = SeedPopulatorService(gateway).populate(
        _bundle(), instance_space=SPACE, required_views=ALL_VIEWS, apply=False
    )
    assert report.dry_run is True
    assert report.ok is True
    assert gateway.ensure_space_called is False
    assert gateway.nodes_upserted == 0
    assert gateway.edges_upserted == 0


def test_apply_writes_space_nodes_edges():
    gateway = FakeGateway(space_exists=False)
    report = SeedPopulatorService(gateway).populate(
        _bundle(), instance_space=SPACE, required_views=ALL_VIEWS, apply=True
    )
    assert gateway.ensure_space_called is True
    assert report.space_created is True
    assert gateway.nodes_upserted == 1
    assert gateway.edges_upserted == 1
    assert report.node_result and report.node_result.written == 1
    assert report.edge_result and report.edge_result.written == 1


def test_missing_views_aborts_without_writing():
    gateway = FakeGateway(missing=[ViewRef("cdf_apm", "Checklist", "v7")])
    report = SeedPopulatorService(gateway).populate(
        _bundle(), instance_space=SPACE, required_views=ALL_VIEWS, apply=True
    )
    assert report.ok is False
    assert report.missing_views
    assert gateway.ensure_space_called is False
    assert gateway.nodes_upserted == 0


def test_fake_gateway_satisfies_protocol():
    # garante que o fake é estruturalmente compatível com o Protocol usado pelo serviço
    from app_seed.data.cdf_gateway import CdfGateway

    assert isinstance(FakeGateway(), CdfGateway)


class StatefulFakeGateway:
    """Gateway falso que persiste estado: 1ª escrita = written; reescrita igual = unchanged."""

    def __init__(self) -> None:
        self._store: dict[str, object] = {}
        self.space_created = False

    def find_missing_views(self, views):
        return []

    def space_exists(self, space: str) -> bool:
        return self.space_created

    def ensure_space(self, space: str) -> None:
        self.space_created = True

    def _apply(self, instances) -> UpsertResult:
        written = unchanged = 0
        for inst in instances:
            snapshot = repr(inst)
            if self._store.get(inst.external_id) == snapshot:
                unchanged += 1
            else:
                self._store[inst.external_id] = snapshot
                written += 1
        return UpsertResult(written=written, unchanged=unchanged)

    def upsert_nodes(self, nodes):
        return self._apply(nodes)

    def upsert_edges(self, edges):
        return self._apply(edges)


def test_apply_twice_is_idempotent():
    gateway = StatefulFakeGateway()
    service = SeedPopulatorService(gateway)
    bundle = _bundle()

    first = service.populate(bundle, instance_space=SPACE, required_views=ALL_VIEWS, apply=True)
    second = service.populate(bundle, instance_space=SPACE, required_views=ALL_VIEWS, apply=True)

    assert first.node_result and first.node_result.written == 1
    assert first.edge_result and first.edge_result.written == 1
    # 2ª execução: nada muda → tudo unchanged (idempotência ponta-a-ponta)
    assert second.node_result and second.node_result.written == 0
    assert second.node_result.unchanged == 1
    assert second.edge_result and second.edge_result.written == 0
    assert second.edge_result.unchanged == 1
