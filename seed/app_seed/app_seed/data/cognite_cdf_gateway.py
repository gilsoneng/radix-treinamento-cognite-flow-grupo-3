"""Implementação concreta do `CdfGateway` usando o cognite-sdk (DMS v3 / instances API).

Único ponto do app que conhece o cognite-sdk. Converte nosso formato canônico
(`NodeInstance`/`EdgeInstance`) para `NodeApply`/`EdgeApply` e executa em lotes.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import TypeVar

from cognite.client import ClientConfig, CogniteClient
from cognite.client.credentials import OAuthClientCredentials
from cognite.client.data_classes.data_modeling import (
    DirectRelationReference,
    EdgeApply,
    NodeApply,
    NodeOrEdgeData,
    SpaceApply,
    ViewId,
)
from cognite.client.data_classes.data_modeling.instances import (
    EdgeApplyResult,
    NodeApplyResult,
)

from app_seed.config.settings import CdfCredentials
from app_seed.data.cdf_gateway import UpsertResult
from app_seed.domain.instances import EdgeInstance, NodeInstance
from app_seed.domain.refs import ViewRef

_BATCH_SIZE = 1000

T = TypeVar("T")


def _chunked(items: Sequence[T], size: int) -> Iterable[Sequence[T]]:
    for start in range(0, len(items), size):
        yield items[start:start + size]


class CogniteCdfGateway:
    """Gateway de escrita/validação no CDF via cognite-sdk."""

    def __init__(self, client: CogniteClient) -> None:
        self._client = client

    # -- Factory a partir das credenciais (composição na injectors/container) --
    @classmethod
    def from_credentials(
        cls, credentials: CdfCredentials, *, client_name: str = "app-seed"
    ) -> "CogniteCdfGateway":
        oauth = OAuthClientCredentials(
            token_url=credentials.token_url,
            client_id=credentials.client_id,
            client_secret=credentials.client_secret,
            scopes=credentials.scopes,
        )
        config = ClientConfig(
            client_name=client_name,
            project=credentials.project,
            base_url=credentials.base_url,
            credentials=oauth,
        )
        return cls(CogniteClient(config))

    # ----------------------------- validação -----------------------------
    def find_missing_views(self, views: tuple[ViewRef, ...]) -> list[ViewRef]:
        ids = [v.as_tuple() for v in views]
        found = self._client.data_modeling.views.retrieve(ids)
        present = {(v.space, v.external_id, v.version) for v in found}
        return [v for v in views if v.as_tuple() not in present]

    def space_exists(self, space: str) -> bool:
        return self._client.data_modeling.spaces.retrieve(space) is not None

    def ensure_space(self, space: str) -> None:
        self._client.data_modeling.spaces.apply(
            SpaceApply(
                space=space,
                name=space,
                description="Seed OEC Route 1 (app_seed) — instâncias cdf_apm.ApmAppData:v13",
            )
        )

    # ------------------------------ upserts ------------------------------
    def upsert_nodes(self, nodes: list[NodeInstance]) -> UpsertResult:
        written = unchanged = 0
        for batch in _chunked(nodes, _BATCH_SIZE):
            applies = [self._to_node_apply(n) for n in batch]
            result = self._client.data_modeling.instances.apply(
                nodes=applies,
                auto_create_direct_relations=True,
                replace=False,
            )
            w, u = _tally(result.nodes)
            written += w
            unchanged += u
        return UpsertResult(written=written, unchanged=unchanged)

    def upsert_edges(self, edges: list[EdgeInstance]) -> UpsertResult:
        written = unchanged = 0
        for batch in _chunked(edges, _BATCH_SIZE):
            applies = [self._to_edge_apply(e) for e in batch]
            result = self._client.data_modeling.instances.apply(
                edges=applies,
                auto_create_start_nodes=False,
                auto_create_end_nodes=False,
                replace=False,
            )
            w, u = _tally(result.edges)
            written += w
            unchanged += u
        return UpsertResult(written=written, unchanged=unchanged)

    # ----------------------------- conversão -----------------------------
    @staticmethod
    def _to_node_apply(node: NodeInstance) -> NodeApply:
        view = node.view
        return NodeApply(
            space=node.space,
            external_id=node.external_id,
            sources=[
                NodeOrEdgeData(
                    source=ViewId(view.space, view.external_id, view.version),
                    properties=node.properties,
                )
            ],
        )

    @staticmethod
    def _to_edge_apply(edge: EdgeInstance) -> EdgeApply:
        return EdgeApply(
            space=edge.space,
            external_id=edge.external_id,
            type=DirectRelationReference(edge.edge_type.space, edge.edge_type.external_id),
            start_node=DirectRelationReference(
                edge.start_node.space, edge.start_node.external_id
            ),
            end_node=DirectRelationReference(
                edge.end_node.space, edge.end_node.external_id
            ),
        )


def _tally(results: Iterable[NodeApplyResult | EdgeApplyResult]) -> tuple[int, int]:
    """Classifica os resultados do apply em (escritos, inalterados) via `was_modified`."""
    written = unchanged = 0
    for item in results:
        if item.was_modified:
            written += 1
        else:
            unchanged += 1
    return written, unchanged
