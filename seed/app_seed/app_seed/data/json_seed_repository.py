"""Persistência do `SeedBundle` em arquivo JSON (camada de dados)."""

from __future__ import annotations

import json
from pathlib import Path

from app_seed.models.seed_bundle import SeedBundle


class JsonSeedRepository:
    """Lê e grava um `SeedBundle` como JSON formatado em `data/`."""

    def save(self, bundle: SeedBundle, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(bundle.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def load(self, path: Path) -> SeedBundle:
        if not path.exists():
            raise FileNotFoundError(f"JSON de seed não encontrado: {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("JSON de seed inválido: raiz deve ser um objeto")
        return SeedBundle.from_dict(payload)
