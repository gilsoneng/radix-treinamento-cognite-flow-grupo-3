"""Testes do repositório JSON (save/load)."""

from __future__ import annotations

from pathlib import Path

from app_seed.config.model_ids import VIEW_CHECKLIST
from app_seed.data.json_seed_repository import JsonSeedRepository
from app_seed.domain.instances import NodeInstance
from app_seed.models.seed_bundle import SeedBundle


def test_save_then_load_round_trips(tmp_path: Path):
    bundle = SeedBundle(
        nodes=[NodeInstance("eq-x_group_3", "s", VIEW_CHECKLIST, {"title": "X"})],
        edges=[],
        meta={"k": "v"},
    )
    repo = JsonSeedRepository()
    out = tmp_path / "nested" / "seed.json"

    repo.save(bundle, out)
    assert out.exists()  # cria diretórios intermediários

    loaded = repo.load(out)
    assert loaded.to_dict() == bundle.to_dict()
    assert loaded.meta == {"k": "v"}
