# DMBL — Treinamento Cognite Flows (`cdf_apm` / `ApmAppData`)

**Space:** `cdf_apm`  
**Data model:** `ApmAppData`  
**Diagrama:** `workshop-data-model.dbml`  
**Referência:** `CDM-REFERENCES.md`

---

## Resposta direta: o modelo anterior estava errado para este treinamento

Não considerávamos `cdf_apm` / `ApmAppData`. O rascunho com `FlowTraining*` e foco só em `cdf_cdm` **não reflete** o modelo que vocês usam no workshop.

---

## Business entities (ApmAppData)

| Negócio | View `cdf_apm` | Papel no app |
|---------|----------------|--------------|
| Template de inspeção | `Template` | Catálogo de formulários |
| Linha do template | `TemplateItem` | Perguntas / passos do formulário |
| Agendamento | `Schedule` | Quando rodar template |
| Checklist (run) | `Checklist` | Inspeção executada |
| Linha do checklist | `ChecklistItem` | Pass/fail, medição |
| Leitura | `MeasurementReading` | Valor medido no item |
| Observação / alerta | `Observation` | Exceção, prioridade, status |
| Functional location | `CogniteAsset` (`cdf_cdm`) | Via `rootLocation` / `asset` |
| Trends (opcional) | `CogniteTimeSeries` | Gráficos — datapoints |

---

## Relationships (resumo)

| De | Para | Mecanismo |
|----|------|-----------|
| Template | TemplateItem | edge `referenceTemplateItems` |
| TemplateItem | Schedule | edge `referenceSchedules` |
| Checklist | ChecklistItem | edge `referenceChecklistItems` |
| ChecklistItem | MeasurementReading | edge `referenceMeasurements` |
| ChecklistItem | Observation | edge `referenceObservations` |
| Checklist, Item, Template, Observation | Asset | `rootLocation` / `asset` |

---

## Model delta

### As-is (cenário típico do tenant de treinamento)

- `ApmAppData` já publicado em `cdf_apm`.
- Assets em `cdf_cdm` (ou space de source espelhado).
- App Flows scaffold sem queries APM ainda.

### To-be (app + seed — sem recriar o DM)

| Change ID | Tipo | Descrição |
|-----------|------|-----------|
| DM-001 | REUSE | Consultar views em `ApmAppData` (não criar DM paralelo) |
| DM-002 | REUSE | Seed/read `Template`, `TemplateItem`, `Checklist`, `ChecklistItem` |
| DM-003 | REUSE | `MeasurementReading`, `Observation` para cenários de alerta |
| DM-004 | REUSE | `CogniteAsset` + `asset` / `rootLocation` |
| DM-005 | REUSE | `CogniteTimeSeries` para trends (se a UI precisar) |
| DM-006 | EXTEND | Só se necessário: propriedades extras via view que **implements** APM/CDM — não duplicar containers |

---

## Reference entities (seed)

| Entidade | Space | Seed workshop? |
|----------|-------|----------------|
| CogniteAsset (hierarquia mínima) | `cdf_cdm` ou source | Sim |
| Template | `cdf_apm` | Sim |
| TemplateItem + edges | `cdf_apm` | Sim |
| Checklist + items + edges | `cdf_apm` | Sim |
| MeasurementReading | `cdf_apm` | Sim (cenários KPI) |
| Observation | `cdf_apm` | Sim (warning/critical) |
| CogniteTimeSeries + points | `cdf_cdm` | Opcional |

**Bloqueio:** ChecklistItem sem `asset` ou checklist sem `rootLocation` quebra filtros do app.

---

## Seed implications (CSV)

| CSV sugerido | View |
|--------------|------|
| `nodes-CogniteAsset.csv` | `cdf_cdm.CogniteAsset` |
| `nodes-Template.csv` | `cdf_apm.Template` |
| `nodes-TemplateItem.csv` | `cdf_apm.TemplateItem` |
| `edges-referenceTemplateItems.csv` | edge |
| `nodes-Checklist.csv` | `cdf_apm.Checklist` |
| `nodes-ChecklistItem.csv` | `cdf_apm.ChecklistItem` |
| `edges-referenceChecklistItems.csv` | edge |
| `nodes-MeasurementReading.csv` | `cdf_apm.MeasurementReading` |
| `edges-referenceMeasurements.csv` | edge |
| `nodes-Observation.csv` | `cdf_apm.Observation` |
| `edges-referenceObservations.csv` | edge |

Confirmar nomes de propriedades no **schema publicado** do projeto antes de mapear colunas.

---

## Approval

```text
DMBL reviewed by:
Date:
ApmAppData (cdf_apm) confirmed in CDF: pending
Approved for seed design: pending
```
