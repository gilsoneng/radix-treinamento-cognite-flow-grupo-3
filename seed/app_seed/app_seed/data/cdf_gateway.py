"""Interface (porta) do gateway de escrita/validação no CDF.

Define o contrato NARROW de que o `SeedPopulatorService` depende — seguindo Dependency
Inversion, o serviço não conhece o cognite-sdk, apenas este `Protocol`. Isso torna o
populator testável com um fake gateway.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from app_seed.config.model_ids import ViewRef
from app_seed.domain.instances import EdgeInstance, NodeInstance


@dataclass(frozen=True)
class UpsertResult:
    """Resultado de um upsert de instâncias.

    O DMS reporta apenas `was_modified` por instância; classificamos em `written`
    (criada ou alterada) e `unchanged` (idempotente — já estava igual).
    """

    written: int
    unchanged: int

    @property
    def total(self) -> int:
        return self.written + self.unchanged


@runtime_checkable
class CdfGateway(Protocol):
    """Operações mínimas necessárias para validar e popular o seed."""

    def find_missing_views(self, views: tuple[ViewRef, ...]) -> list[ViewRef]:
        """Retorna as views que NÃO existem no projeto (lista vazia = todas existem)."""
        ...

    def space_exists(self, space: str) -> bool:
        """Indica se o space de instâncias já existe."""
        ...

    def ensure_space(self, space: str) -> None:
        """Cria o space (idempotente) caso não exista."""
        ...

    def upsert_nodes(self, nodes: list[NodeInstance]) -> UpsertResult:
        """Faz upsert dos nodes; cria direct relations alvo automaticamente."""
        ...

    def upsert_edges(self, edges: list[EdgeInstance]) -> UpsertResult:
        """Faz upsert das edges (os endpoints já devem existir)."""
        ...
