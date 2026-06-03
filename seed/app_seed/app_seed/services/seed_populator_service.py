"""Caso de uso `populate`: valida o modelo e faz upsert do bundle no CDF.

Depende apenas do `CdfGateway` (Protocol) — não conhece o cognite-sdk. Em modo dry-run
NÃO escreve nada (apenas chamadas read-only de validação + plano).

Ordem de escrita: garante o space → upsert dos nodes (cria direct relations alvo) →
upsert das edges (endpoints já existem). Idempotente: re-rodar não duplica.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from app_seed.config.model_ids import ViewRef
from app_seed.data.cdf_gateway import CdfGateway, UpsertResult
from app_seed.models.seed_bundle import SeedBundle


@dataclass
class PopulateReport:
    """Resultado da operação de populate (ou do plano, em dry-run)."""

    dry_run: bool
    instance_space: str
    node_count: int
    edge_count: int
    nodes_by_view: dict[str, int] = field(default_factory=dict)
    edges_by_type: dict[str, int] = field(default_factory=dict)
    missing_views: list[ViewRef] = field(default_factory=list)
    space_existed: bool | None = None
    space_created: bool = False
    node_result: UpsertResult | None = None
    edge_result: UpsertResult | None = None

    @property
    def ok(self) -> bool:
        return not self.missing_views


class SeedPopulatorService:
    """Valida e popula o seed no CDF via gateway injetado."""

    def __init__(self, gateway: CdfGateway) -> None:
        self._gateway = gateway

    def populate(
        self,
        bundle: SeedBundle,
        *,
        instance_space: str,
        required_views: tuple[ViewRef, ...],
        apply: bool,
    ) -> PopulateReport:
        report = PopulateReport(
            dry_run=not apply,
            instance_space=instance_space,
            node_count=len(bundle.nodes),
            edge_count=len(bundle.edges),
            nodes_by_view=_count_nodes_by_view(bundle),
            edges_by_type=_count_edges_by_type(bundle),
        )

        # 1) Validação read-only do modelo: aborta cedo se faltar view.
        report.missing_views = self._gateway.find_missing_views(required_views)
        if report.missing_views:
            return report

        report.space_existed = self._gateway.space_exists(instance_space)

        if not apply:
            return report  # dry-run: nenhuma escrita.

        # 2) Escrita idempotente.
        self._gateway.ensure_space(instance_space)
        report.space_created = report.space_existed is False
        report.node_result = self._gateway.upsert_nodes(bundle.nodes)
        report.edge_result = self._gateway.upsert_edges(bundle.edges)
        return report


def _count_nodes_by_view(bundle: SeedBundle) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for node in bundle.nodes:
        counter[f"{node.view.space}:{node.view.external_id}/{node.view.version}"] += 1
    return dict(counter)


def _count_edges_by_type(bundle: SeedBundle) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for edge in bundle.edges:
        counter[f"{edge.edge_type.space}:{edge.edge_type.external_id}"] += 1
    return dict(counter)
