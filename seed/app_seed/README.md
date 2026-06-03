# app_seed — Seed OEC (Route 1) → CDF `cdf_apm.ApmAppData:v13`

Aplicação Python que **gera** um JSON de seed a partir do CSV da rota OEC e **popula**
o CDF (data model `cdf_apm.ApmAppData:v13`) com Checklists, ChecklistItems, Assets,
MeasurementReadings, CDF_Users e as **edges** que os conectam.

> **Por que regenerar o JSON?** O JSON original (`references/apm-app-data-route-1-seed.json`)
> reproduzia o CSV com fidelidade perfeita de conteúdo (8 andares / 35 equipamentos /
> 193 checagens / 4 medições), porém modelava um data model **`APMAppData` v13 fictício**
> (relações por propriedade, views `@13`, `CDF_User` em `cognite_app_data`, Asset com `name`)
> que **não existe** no projeto `radix-dev`. A introspecção ao vivo confirmou o modelo real:
> `cdf_apm.ApmAppData:v13` com views `Checklist@v7`, `ChecklistItem@v7`,
> `MeasurementReading@v4`, `cdf_core.Asset@v2` (campo `title`),
> `cdf_apps_shared.CDF_User@v1` (e-mail obrigatório), e relações via **edges**
> (`referenceChecklistItems`, `referenceMeasurements`). Este app gera o JSON já na forma correta.

## Arquitetura (clean architecture)

```
seed/app_seed/
├── data/                              # JSON de seed (artefato gerado)
│   └── apm-app-data-route-1-seed.json
├── app_seed/                          # pacote Python
│   ├── config/    model_ids.py (views/edges reais) · settings.py (env/paths)
│   ├── domain/    entities.py · instances.py (Node/EdgeInstance) · refs.py (Instance/View/EdgeTypeRef, JsonValue)
│   │              naming.py · timestamps.py · constants.py
│   ├── models/    seed_bundle.py (DTO serializável, round-trip JSON)
│   ├── data/      csv_route_reader.py · json_seed_repository.py · cdf_gateway.py (porta) · cognite_cdf_gateway.py
│   ├── services/  measurement_mapper · calibration_service · seed_metadata
│   │   ├── seed_builder_service.py    (orquestrador)
│   │   ├── seed_populator_service.py  (valida + upsert)
│   │   └── factories/ user · asset · measurement · checklist · edge  (1 tipo de instância cada)
│   ├── injectors/ container.py (composition root / DI)
│   └── cli.py     (generate · populate)
└── tests/                             # pytest (44 casos)
```

Princípios aplicados: **SRP** (`SeedBuilderService` apenas orquestra; cada factory constrói um
tipo de node/edge), **Dependency Inversion** (o populator depende do `CdfGateway` Protocol, não
do cognite-sdk), **DRY** (ids do modelo, política de nomes e formatação de timestamp centralizados),
**KISS** e **Clean Code**. A regra de dependência é respeitada: `config`/`data`/`services` dependem
de `domain`, nunca o contrário. O único módulo que conhece o cognite-sdk é `cognite_cdf_gateway.py`.

## Instalação

```bash
cd seed/app_seed
python3 -m pip install -e .       # instala cognite-sdk + python-dotenv
# ou apenas: pip install "cognite-sdk>=7,<8" python-dotenv
```

As credenciais são lidas do `.env` na raiz do repo (`CDF_CLUSTER`, `CDF_PROJECT`,
`IDP_TENANT_ID`, `IDP_CLIENT_ID`, `IDP_CLIENT_SECRET`).

## Uso

```bash
# 1) (Re)gerar o JSON a partir do CSV — não precisa de CDF
python -m app_seed generate

# 2) Validar contra o CDF e ver o plano — DRY-RUN, não escreve nada
python -m app_seed populate

# 3) Escrever no CDF (idempotente; cria o space se faltar)
python -m app_seed populate --apply
```

Opções úteis: `--space <nome>` (override do space), `--env <caminho>`, `--csv`, `--out`, `--in`.

O comando `populate` **sempre valida** se as views exigidas existem antes de escrever e
**aborta** se alguma faltar (nada é gravado). Sem `--apply`, apenas mostra o plano.

## Decisões de modelagem

| Tema | Decisão |
|------|---------|
| Data model | `cdf_apm.ApmAppData:v13` (real, verificado ao vivo) |
| Relações | **edges** `cdf_apm:referenceChecklistItems` (Checklist→Item) e `referenceMeasurements` (Item→Measurement) |
| Space de instâncias | `cognite-flows-grupo-3` (criado pelo app se não existir) |
| externalIds | esquema `…_group_3` (mesmo do JSON validado); edges: `rci-…` / `rms-…` |
| Measurement (rico) | enums → `type=checkbox`+`options`; numéricos → `type=numerical` + `min`/`max` (ex.: °F com `max=170`) |
| rootLocation | 1 Asset raiz da rota (`asset-route-root_group_3`); cada Checklist aponta para ele |
| Calibragem | status/prazos distribuídos pelos baldes **Atrasado / Aberto / Em andamento / Concluído** (2 Checklists cada), determinístico (data de referência 2026-06-03) |

`Atrasado` é **derivado** pelo app (endTime vencido + não concluído), por isso é gravado como
`status=Ongoing` com `endTime` no passado.

## Estatísticas do seed gerado

`245 nodes` (8 Checklist + 193 ChecklistItem + 36 Asset + 4 MeasurementReading + 4 CDF_User)
e `385 edges` (193 `referenceChecklistItems` + 192 `referenceMeasurements`; 1 item — "No. of
Open Nozzles" — não tem medição).

## Testes

```bash
cd seed/app_seed
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python3 -m pytest -q
```

Cobrem: parser do CSV, mapeamento de medições, calibragem, naming, (de)serialização do
bundle, invariantes do builder (contagens, edges vs propriedades, integridade referencial,
views corretas, determinismo) e o populator com um gateway falso (dry-run não escreve;
`--apply` grava; views ausentes abortam).
