"""Settings da aplicação, derivadas de ambiente (.env) com defaults seguros.

Segue Dependency Inversion: os serviços recebem `AppSettings` injetado; nada lê
`os.environ` diretamente fora daqui.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from dotenv import dotenv_values

# Raiz do repo = .../radix-treinamento-cognite-flow-grupo-3
_REPO_ROOT = Path(__file__).resolve().parents[4]
# Pasta de dados do seed: seed/app_seed/data/
_DATA_DIR = Path(__file__).resolve().parents[2] / "data"

DEFAULT_INSTANCE_SPACE = "cognite-flows-grupo-3"
DEFAULT_EXTERNAL_ID_SUFFIX = "_group_3"
DEFAULT_SEED_FILENAME = "apm-app-data-route-1-seed.json"
DEFAULT_CSV_FILENAME = "A Line OEC Routes 1(Route 1 - Dig IV Diff).csv"
DEFAULT_SPREADSHEET_NAME = "Route 1 - Dig IV Diff"


@dataclass(frozen=True)
class CdfCredentials:
    """Credenciais OAuth client_credentials para o CDF."""

    cluster: str
    project: str
    tenant_id: str
    client_id: str
    client_secret: str

    @property
    def base_url(self) -> str:
        return f"https://{self.cluster}.cognitedata.com"

    @property
    def token_url(self) -> str:
        return f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"

    @property
    def scopes(self) -> list[str]:
        return [f"{self.base_url}/.default"]


@dataclass(frozen=True)
class AppSettings:
    """Configuração completa da aplicação de seed."""

    instance_space: str
    external_id_suffix: str
    data_dir: Path
    csv_path: Path
    seed_json_path: Path
    credentials: CdfCredentials | None

    @staticmethod
    def load(
        *,
        env_path: Path | None = None,
        instance_space: str = DEFAULT_INSTANCE_SPACE,
        data_dir: Path | None = None,
        csv_path: Path | None = None,
        seed_filename: str = DEFAULT_SEED_FILENAME,
    ) -> "AppSettings":
        """Carrega settings de um .env (default: .env na raiz do repo).

        Credenciais são opcionais: a geração de JSON e o dry-run não exigem CDF.
        """
        resolved_data_dir = (data_dir or _DATA_DIR).resolve()
        resolved_csv = (
            csv_path
            or (_REPO_ROOT / "references" / DEFAULT_CSV_FILENAME)
        ).resolve()
        seed_json_path = (resolved_data_dir / seed_filename).resolve()

        credentials = _load_credentials(env_path or (_REPO_ROOT / ".env"))

        return AppSettings(
            instance_space=instance_space,
            external_id_suffix=DEFAULT_EXTERNAL_ID_SUFFIX,
            data_dir=resolved_data_dir,
            csv_path=resolved_csv,
            seed_json_path=seed_json_path,
            credentials=credentials,
        )


def _load_credentials(env_path: Path) -> CdfCredentials | None:
    if not env_path.exists():
        return None
    env = dotenv_values(env_path)
    required = (
        "CDF_CLUSTER",
        "CDF_PROJECT",
        "IDP_TENANT_ID",
        "IDP_CLIENT_ID",
        "IDP_CLIENT_SECRET",
    )
    if any(not env.get(key) for key in required):
        return None
    return CdfCredentials(
        cluster=str(env["CDF_CLUSTER"]),
        project=str(env["CDF_PROJECT"]),
        tenant_id=str(env["IDP_TENANT_ID"]),
        client_id=str(env["IDP_CLIENT_ID"]),
        client_secret=str(env["IDP_CLIENT_SECRET"]),
    )
