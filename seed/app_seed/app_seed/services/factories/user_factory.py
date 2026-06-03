"""Factory de nodes CDF_User (cdf_apps_shared.CDF_User:v1)."""

from __future__ import annotations

from dataclasses import dataclass

from app_seed.config.model_ids import VIEW_CDF_USER
from app_seed.domain.entities import User
from app_seed.domain.instances import NodeInstance
from app_seed.domain.naming import Namer
from app_seed.domain.refs import InstanceRef

# Usuários sintéticos (mesmos nomes/e-mails do seed validado). email é OBRIGATÓRIO na view.
_USER_SEEDS = (
    ("supervisor", "Pat Supervisor", "pat.supervisor@plant.test", "supervisor"),
    ("operator-1", "Alex Morgan", "alex.morgan@plant.test", "operator"),
    ("operator-2", "Jordan Lee", "jordan.lee@plant.test", "operator"),
    ("operator-3", "Sam Rivera", "sam.rivera@plant.test", "operator"),
)


@dataclass(frozen=True)
class UsersBundle:
    """Nodes de usuários + referências já resolvidas para uso pelo orquestrador."""

    nodes: list[NodeInstance]
    supervisor_ref: InstanceRef
    operator_refs: list[InstanceRef]
    operator_names: list[str]


class UserFactory:
    """Constrói os nodes de usuários e expõe suas referências."""

    def __init__(self, instance_space: str, namer: Namer) -> None:
        self._space = instance_space
        self._namer = namer

    def build(self) -> UsersBundle:
        users = [
            User(
                external_id=self._namer.user_id(role_slug),
                name=name,
                email=email,
                role=role,
            )
            for role_slug, name, email, role in _USER_SEEDS
        ]
        nodes = [self._node(u) for u in users]
        supervisor = next(u for u in users if u.role == "supervisor")
        operators = [u for u in users if u.role == "operator"]
        return UsersBundle(
            nodes=nodes,
            supervisor_ref=InstanceRef(self._space, supervisor.external_id),
            operator_refs=[InstanceRef(self._space, o.external_id) for o in operators],
            operator_names=[o.name for o in operators],
        )

    def _node(self, user: User) -> NodeInstance:
        return NodeInstance(
            external_id=user.external_id,
            space=self._space,
            view=VIEW_CDF_USER,
            properties={"name": user.name, "email": user.email},
        )
