"""Value objects de referência (puros) usados em todo o domínio.

- `InstanceRef`  — referência (space, externalId) a um node/edge (direct relations e endpoints).
- `ViewRef`      — referência imutável a uma view do data model.
- `EdgeTypeRef`  — referência ao `type` de uma edge (direct relation reference).
- `JsonValue`    — alias para valores primitivos JSON (propriedades de instâncias).

Ficam no domínio (e não em config) para que `config` e `data` dependam do domínio,
nunca o contrário (regra de dependência da clean architecture).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Union

# Valor primitivo JSON aceito como propriedade de uma instância no DMS (recursivo).
JsonValue = Union[
    str, int, float, bool, None, list["JsonValue"], dict[str, "JsonValue"]
]
# Mapa de propriedades de uma instância (view properties).
JsonObject = dict[str, "JsonValue"]


@dataclass(frozen=True)
class InstanceRef:
    """Referência imutável (space, externalId) a um node ou edge."""

    space: str
    external_id: str

    def as_dict(self) -> dict[str, str]:
        return {"space": self.space, "externalId": self.external_id}


@dataclass(frozen=True)
class ViewRef:
    """Referência imutável a uma view do data model."""

    space: str
    external_id: str
    version: str

    def as_source(self) -> dict[str, str]:
        """Forma usada no campo `sources[].source` de um node."""
        return {
            "type": "view",
            "space": self.space,
            "externalId": self.external_id,
            "version": self.version,
        }

    def as_tuple(self) -> tuple[str, str, str]:
        return (self.space, self.external_id, self.version)


@dataclass(frozen=True)
class EdgeTypeRef:
    """Referência imutável ao `type` de uma edge (direct relation reference)."""

    space: str
    external_id: str

    def as_dict(self) -> dict[str, str]:
        return {"space": self.space, "externalId": self.external_id}
