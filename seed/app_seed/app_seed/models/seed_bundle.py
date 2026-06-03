"""SeedBundle: DTO serializável que representa o seed completo (nodes + edges).

Formato do JSON em `data/`:

    {
      "meta":  { ...descrição + stats... },
      "nodes": [ { instanceType:"node", space, externalId, sources:[...] }, ... ],
      "edges": [ { instanceType:"edge", space, externalId, type, startNode, endNode }, ... ]
    }

É round-trippable: `from_dict(to_dict(bundle))` reconstrói os mesmos NodeInstance/EdgeInstance,
para que `populate` apenas LEIA o JSON (não reprocesse o CSV).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app_seed.domain.instances import EdgeInstance, NodeInstance
from app_seed.domain.refs import EdgeTypeRef, InstanceRef, ViewRef


@dataclass
class SeedBundle:
    """Conjunto de nodes e edges de um seed, mais metadados descritivos."""

    nodes: list[NodeInstance] = field(default_factory=list)
    edges: list[EdgeInstance] = field(default_factory=list)
    meta: dict[str, object] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return {
            "meta": self.meta,
            "nodes": [n.to_bundle_dict() for n in self.nodes],
            "edges": [e.to_bundle_dict() for e in self.edges],
        }

    @staticmethod
    def from_dict(payload: dict[str, object]) -> "SeedBundle":
        meta = _as_dict(payload.get("meta", {}))
        nodes = [_node_from_dict(n) for n in _as_list(payload.get("nodes", []))]
        edges = [_edge_from_dict(e) for e in _as_list(payload.get("edges", []))]
        return SeedBundle(nodes=nodes, edges=edges, meta=meta)


# ----------------- helpers de (de)serialização -----------------


def _as_dict(value: object) -> dict[str, object]:
    if not isinstance(value, dict):
        raise ValueError(f"Esperado objeto JSON, recebido {type(value).__name__}")
    return value


def _as_list(value: object) -> list[object]:
    if not isinstance(value, list):
        raise ValueError(f"Esperado array JSON, recebido {type(value).__name__}")
    return value


def _node_from_dict(raw: object) -> NodeInstance:
    data = _as_dict(raw)
    sources = _as_list(data["sources"])
    if not sources:
        raise ValueError(f"Node {data.get('externalId')} sem `sources`")
    source0 = _as_dict(sources[0])
    src = _as_dict(source0["source"])
    return NodeInstance(
        external_id=str(data["externalId"]),
        space=str(data["space"]),
        view=ViewRef(
            space=str(src["space"]),
            external_id=str(src["externalId"]),
            version=str(src["version"]),
        ),
        properties=_as_dict(source0.get("properties", {})),
    )


def _edge_from_dict(raw: object) -> EdgeInstance:
    data = _as_dict(raw)
    edge_type = _as_dict(data["type"])
    start = _as_dict(data["startNode"])
    end = _as_dict(data["endNode"])
    return EdgeInstance(
        external_id=str(data["externalId"]),
        space=str(data["space"]),
        edge_type=EdgeTypeRef(
            space=str(edge_type["space"]),
            external_id=str(edge_type["externalId"]),
        ),
        start_node=InstanceRef(str(start["space"]), str(start["externalId"])),
        end_node=InstanceRef(str(end["space"]), str(end["externalId"])),
    )
