"""Identificadores do data model real `cdf_apm.ApmAppData:v13`.

Fonte da verdade verificada AO VIVO no projeto `radix-dev` (cluster az-eastus-1) via
Data Modeling API — NÃO pela SPEC e NÃO pelo JSON original (ambos descreviam um modelo
`APMAppData` v13 fictício, com relações por propriedade, que não existe no projeto).

Fatos confirmados:
  - Data model: cdf_apm.ApmAppData:v13
  - Views: Checklist@v7, ChecklistItem@v7, MeasurementReading@v4 (NÃO v13)
  - Asset é cdf_core.Asset@v2 (campo `title`, NÃO `name`)
  - CDF_User é cdf_apps_shared.CDF_User@v1 (campo `email` é OBRIGATÓRIO)
  - Checklist→ChecklistItem é a EDGE cdf_apm:referenceChecklistItems (outwards)
  - ChecklistItem→MeasurementReading é a EDGE cdf_apm:referenceMeasurements (outwards)
  - rootLocation/asset/createdBy/updatedBy são direct relations
  - MeasurementReading NÃO tem name/unit/limit; tem title/type/min/max/options/...
  - Não existe campo `exception` em nenhuma view do modelo.

Os value objects `ViewRef`/`EdgeTypeRef` vivem no domínio (`domain.refs`); aqui só as constantes.
Centralizar (DRY) mantém qualquer mudança de versão do modelo em um único lugar.
"""

from __future__ import annotations

from app_seed.domain.refs import EdgeTypeRef, ViewRef

# --- Spaces do schema (globais, geridos pela Cognite) ---
SPACE_CDF_APM = "cdf_apm"
SPACE_CDF_CORE = "cdf_core"
SPACE_CDF_APPS_SHARED = "cdf_apps_shared"

# --- Views (versões verificadas ao vivo) ---
VIEW_CHECKLIST = ViewRef(SPACE_CDF_APM, "Checklist", "v7")
VIEW_CHECKLIST_ITEM = ViewRef(SPACE_CDF_APM, "ChecklistItem", "v7")
VIEW_MEASUREMENT_READING = ViewRef(SPACE_CDF_APM, "MeasurementReading", "v4")
VIEW_ASSET = ViewRef(SPACE_CDF_CORE, "Asset", "v2")
VIEW_CDF_USER = ViewRef(SPACE_CDF_APPS_SHARED, "CDF_User", "v1")

ALL_VIEWS: tuple[ViewRef, ...] = (
    VIEW_CHECKLIST,
    VIEW_CHECKLIST_ITEM,
    VIEW_MEASUREMENT_READING,
    VIEW_ASSET,
    VIEW_CDF_USER,
)

# --- Edge types (connection definitions, direção outwards) ---
EDGE_REFERENCE_CHECKLIST_ITEMS = EdgeTypeRef(SPACE_CDF_APM, "referenceChecklistItems")
EDGE_REFERENCE_MEASUREMENTS = EdgeTypeRef(SPACE_CDF_APM, "referenceMeasurements")

# --- Data model (para introspecção/validação) ---
DATA_MODEL = ViewRef(SPACE_CDF_APM, "ApmAppData", "v13")

__all__ = [
    "ViewRef",
    "EdgeTypeRef",
    "SPACE_CDF_APM",
    "SPACE_CDF_CORE",
    "SPACE_CDF_APPS_SHARED",
    "VIEW_CHECKLIST",
    "VIEW_CHECKLIST_ITEM",
    "VIEW_MEASUREMENT_READING",
    "VIEW_ASSET",
    "VIEW_CDF_USER",
    "ALL_VIEWS",
    "EDGE_REFERENCE_CHECKLIST_ITEMS",
    "EDGE_REFERENCE_MEASUREMENTS",
    "DATA_MODEL",
]
