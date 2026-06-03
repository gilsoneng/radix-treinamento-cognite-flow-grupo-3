"""Composition root: cria e conecta os serviços a partir das `AppSettings`.

Concentra todo o `new`/wiring num único lugar (Dependency Inversion + Single
Responsibility). O gateway do CDF é construído sob demanda (`make_populator`) porque
`generate` não precisa de credenciais. Para testes, injete `gateway_factory`.
"""

from __future__ import annotations

from collections.abc import Callable

from app_seed.config.model_ids import ALL_VIEWS
from app_seed.config.settings import AppSettings, DEFAULT_SPREADSHEET_NAME
from app_seed.data.cdf_gateway import CdfGateway
from app_seed.data.cognite_cdf_gateway import CogniteCdfGateway
from app_seed.data.csv_route_reader import CsvRouteReader
from app_seed.data.json_seed_repository import JsonSeedRepository
from app_seed.domain.naming import Namer
from app_seed.services.calibration_service import CalibrationService
from app_seed.services.measurement_mapper import MeasurementMapper
from app_seed.services.seed_builder_service import SeedBuilderService
from app_seed.services.seed_populator_service import SeedPopulatorService

GatewayFactory = Callable[[], CdfGateway]


class Container:
    """Fábrica central de dependências da aplicação."""

    def __init__(
        self,
        settings: AppSettings,
        *,
        spreadsheet_name: str = DEFAULT_SPREADSHEET_NAME,
        gateway_factory: GatewayFactory | None = None,
    ) -> None:
        self._settings = settings
        self._spreadsheet_name = spreadsheet_name
        self._gateway_factory = gateway_factory

    @property
    def settings(self) -> AppSettings:
        return self._settings

    # ----------------------------- generate -----------------------------
    def csv_reader(self) -> CsvRouteReader:
        return CsvRouteReader(spreadsheet_name=self._spreadsheet_name)

    def json_repository(self) -> JsonSeedRepository:
        return JsonSeedRepository()

    def seed_builder(self) -> SeedBuilderService:
        return SeedBuilderService(
            instance_space=self._settings.instance_space,
            namer=Namer(self._settings.external_id_suffix),
            measurement_mapper=MeasurementMapper(spreadsheet_name=self._spreadsheet_name),
            calibration=CalibrationService(),
            spreadsheet_name=self._spreadsheet_name,
        )

    # ----------------------------- populate -----------------------------
    def gateway(self) -> CdfGateway:
        """Constrói o gateway do CDF. Levanta RuntimeError se faltar credencial.

        Construção lazy (sob demanda) — `generate` não chama este método, então roda
        sem `.env`; só `populate` o exige.
        """
        if self._gateway_factory is not None:
            return self._gateway_factory()
        credentials = self._settings.credentials
        if credentials is None:
            raise RuntimeError(
                "Credenciais do CDF ausentes. Defina CDF_CLUSTER/CDF_PROJECT/"
                "IDP_TENANT_ID/IDP_CLIENT_ID/IDP_CLIENT_SECRET no .env."
            )
        return CogniteCdfGateway.from_credentials(credentials)

    def seed_populator(self) -> SeedPopulatorService:
        return SeedPopulatorService(self.gateway())

    @staticmethod
    def required_views() -> tuple:
        return ALL_VIEWS
