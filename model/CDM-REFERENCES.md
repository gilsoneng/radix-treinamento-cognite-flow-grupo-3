# Referências — modelo do treinamento Cognite Flows

## Modelo principal do workshop (obrigatório)

| Campo | Valor |
|-------|--------|
| **Space** | `cdf_apm` |
| **Data model** | `ApmAppData` |
| **Tag** | System (gerenciado pela Cognite; presente por padrão no projeto) |

Documentação relacionada:

- [Configure data models for InField](https://docs.cognite.com/cdf/infield/guides/config_idm) — menciona `ApmAppData` e fluxos checklist/observations
- [Data model examples (APM)](https://docs.cognite.com/cdf/deploy/cdf_toolkit/references/packages/data_model_examples) — pacote `cdf_apm_simple_data_model` (tutorial; não substitui `ApmAppData` de produção)

**Importante:** as **versões das views** (`v7`, `v8`, …) podem variar por projeto. Antes de seed ou queries, confirme em **CDF → Data management → Data models → ApmAppData**.

---

## Views em `cdf_apm` (ApmAppData)

Usadas no ecossistema APM / InField (referência: Cognite Toolkit — migração InField):

| View | Versão ref. | Papel |
|------|-------------|--------|
| `Template` | v8 / v9 | Catálogo de formulários de inspeção |
| `TemplateItem` | v7 | Linhas do template |
| `Schedule` | v4 | Agendamento ligado ao template |
| `Checklist` | v7 | Inspeção executada |
| `ChecklistItem` | v7 | Linhas da inspeção (pass/fail, medições) |
| `MeasurementReading` | v4 | Leitura pontual ligada ao item |
| `Observation` | v5 | Observação / alerta de campo |
| `Activity` | v2 | Atividade APM (opcional no app) |
| `Action` | v1 | Ações condicionais (template logic) |
| `Condition` | v1 | Condições |
| `ConditionalAction` | v1 | Ação condicional |

### Edge types (`cdf_apm`)

| Edge externalId | Ligação (negócio) |
|-----------------|-------------------|
| `referenceTemplateItems` | Template → TemplateItem |
| `referenceSchedules` | TemplateItem ↔ Schedule |
| `referenceChecklistItems` | Checklist → ChecklistItem |
| `referenceMeasurements` | ChecklistItem ← MeasurementReading |
| `referenceObservations` | ChecklistItem → Observation |

### Relações para assets (hierarquia)

Propriedades típicas (direct relation para asset clássico / FDM):

| View | Propriedade | Uso |
|------|-------------|-----|
| `Checklist` | `rootLocation` | Planta / functional location raiz |
| `ChecklistItem` | `asset` | Equipamento da linha |
| `Template` | `rootLocation` | Escopo do template |
| `TemplateItem` | `asset` | Asset da linha do template |
| `Observation` | `asset`, `rootLocation` | Contexto da observação |
| `Activity` | `asset` | Atividade no asset |

No workshop, assets costumam espelhar **`cdf_cdm.CogniteAsset`** (ou instâncias no space de source do cliente).

---

## O que NÃO é o modelo do treinamento

| Abordagem | Situação |
|-----------|----------|
| Views `FlowTraining*` custom em `sp_flow_training` | **Incorreto** para este treinamento — checklist já existe em `cdf_apm` |
| Inventar `Site` / `Equipment` paralelos | Usar asset / rootLocation do APM + CDM |
| Ignorar `ApmAppData` e modelar só `cdf_cdm` | Insuficiente para app de checklist |

---

## Modelos auxiliares (contexto, não substituem ApmAppData)

| Space | Modelo | Uso no treinamento |
|-------|--------|-------------------|
| `cdf_cdm` | Cognite Core | `CogniteAsset`, `CogniteTimeSeries`, `CogniteFile` — trends, hierarquia, documentos |
| `cdf_idm` | Process Industries | Opcional: `CogniteMaintenanceOrder`, `CogniteNotification` se o tenant expuser work orders SAP |
| `APM_Config` | Config node | Configuração InField/APM (não é seed de domínio) |

---

## Erro do rascunho anterior

1. Não leu **`cdf_apm` / `ApmAppData`**.
2. Criou entidades custom duplicando `Checklist`, `Template`, `Measurement`, `Alert`.
3. Tratou o workshop como greenfield CDM em vez de **estender/consome o APM existente**.

O DBML atualizado reflete **`ApmAppData`** + ligação a **`CogniteAsset`**.
