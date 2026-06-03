"""app_seed — gera e popula o seed OEC (Route 1) no data model cdf_apm.ApmAppData:v13.

Camadas (clean architecture):
    domain/     entidades e value objects puros (sem dependência de IO/SDK)
    models/     DTOs de serialização do bundle de seed (forma do JSON)
    data/        gateways/repositórios de IO (CSV, JSON, CDF)
    services/   casos de uso (parsing, mapeamento, calibragem, build, populate)
    injectors/  composition root (wiring de dependências)
    config/     settings e identificadores do data model
"""

__version__ = "1.0.0"
