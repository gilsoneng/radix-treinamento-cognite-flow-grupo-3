/**
 * Identificadores do data model real `cdf_apm.ApmAppData:v13` e do instance space
 * do grupo-3 — centralizados (DRY). Espelha `seed/app_seed/app_seed/config/model_ids.py`.
 *
 * Fatos verificados ao vivo em `radix-dev` (cluster az-eastus-1) e no seed aplicado:
 *  - Instâncias gravadas no space `cognite-flows-grupo-3`.
 *  - Views: Checklist@v7, ChecklistItem@v7, MeasurementReading@v4 (NÃO v13),
 *    Asset = cdf_core.Asset@v2, CDF_User = cdf_apps_shared.CDF_User@v1.
 *  - Checklist→ChecklistItem é a edge `cdf_apm:referenceChecklistItems` (outwards).
 *  - ChecklistItem→MeasurementReading é a edge `cdf_apm:referenceMeasurements` (outwards).
 */

import type { ViewReference } from '@cognite/sdk';

/** Space onde vivem as INSTÂNCIAS (nodes/edges) lidas por este service. */
export const INSTANCE_SPACE = 'cognite-flows-grupo-3' as const;

/** Referência ao `type` de uma edge (direct relation reference, sem versão). */
export interface EdgeTypeRef {
  space: string;
  externalId: string;
}

// --- Views (versões verificadas) ---
export const VIEW_CHECKLIST = {
  type: 'view',
  space: 'cdf_apm',
  externalId: 'Checklist',
  version: 'v7',
} as const satisfies ViewReference;

export const VIEW_CHECKLIST_ITEM = {
  type: 'view',
  space: 'cdf_apm',
  externalId: 'ChecklistItem',
  version: 'v7',
} as const satisfies ViewReference;

export const VIEW_MEASUREMENT_READING = {
  type: 'view',
  space: 'cdf_apm',
  externalId: 'MeasurementReading',
  version: 'v4',
} as const satisfies ViewReference;

export const VIEW_ASSET = {
  type: 'view',
  space: 'cdf_core',
  externalId: 'Asset',
  version: 'v2',
} as const satisfies ViewReference;

export const VIEW_CDF_USER = {
  type: 'view',
  space: 'cdf_apps_shared',
  externalId: 'CDF_User',
  version: 'v1',
} as const satisfies ViewReference;

// --- Edge types (direção outwards) ---
export const EDGE_REFERENCE_CHECKLIST_ITEMS = {
  space: 'cdf_apm',
  externalId: 'referenceChecklistItems',
} as const satisfies EdgeTypeRef;

export const EDGE_REFERENCE_MEASUREMENTS = {
  space: 'cdf_apm',
  externalId: 'referenceMeasurements',
} as const satisfies EdgeTypeRef;

/**
 * Chave da view no mapa `properties` retornado pelo DMS:
 * `node.properties[view.space][`${externalId}/${version}`]`.
 */
export function viewPropertyKey(view: ViewReference): string {
  return `${view.externalId}/${view.version}`;
}
