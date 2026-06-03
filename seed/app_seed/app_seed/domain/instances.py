"""Representação canônica e agnóstica ao SDK de instâncias de seed.

`NodeInstance` e `EdgeInstance` são o formato único produzido pelo builder, persistido
no JSON e consumido pelo gateway (que os converte para os tipos do cognite-sdk). Manter
um único formato evita divergência entre "o que vai no JSON" e "o que vai no CDF" (DRY).
"""

from __future__ import annotations

from dataclasses import dataclass

from app_seed.domain.refs import EdgeTypeRef, InstanceRef, JsonObject, ViewRef


@dataclass(frozen=True)
class NodeInstance:
    """Um node DMS: alvo de uma view, com as propriedades já no formato do CDF."""

    external_id: str
    space: str
    view: ViewRef
    properties: JsonObject

    def to_bundle_dict(self) -> dict[str, object]:
        return {
            "instanceType": "node",
            "space": self.space,
            "externalId": self.external_id,
            "sources": [
                {
                    "source": self.view.as_source(),
                    "properties": self.properties,
                }
            ],
        }


@dataclass(frozen=True)
class EdgeInstance:
    """Uma edge DMS conectando dois nodes via um edge type (connection)."""

    external_id: str
    space: str
    edge_type: EdgeTypeRef
    start_node: InstanceRef
    end_node: InstanceRef

    def to_bundle_dict(self) -> dict[str, object]:
        return {
            "instanceType": "edge",
            "space": self.space,
            "externalId": self.external_id,
            "type": self.edge_type.as_dict(),
            "startNode": self.start_node.as_dict(),
            "endNode": self.end_node.as_dict(),
        }
