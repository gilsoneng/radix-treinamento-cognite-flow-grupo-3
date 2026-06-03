/**
 * Entidades de domínio APM (puras, sem dependência do SDK do CDF).
 *
 * Representam a forma NORMALIZADA entregue pelo service ao hook/UI: relações já
 * resolvidas (Checklist com `items[]`, ChecklistItem com `measurements[]`, refs
 * `asset`/`rootLocation`/`createdBy`/`updatedBy` materializadas).
 *
 * Núcleo da clean architecture: nenhuma outra camada de domínio depende de
 * `@cognite/sdk`; o mapeamento das instâncias DMS → estas entidades vive no mapper.
 *
 * Os campos `status`/`type`/`visibility` são mantidos como `string` (valor cru da
 * view) — a semântica de produto (ex.: classificar "Atrasado", bucketizar KPIs) é
 * responsabilidade do dashboard, não deste service.
 */

/** Referência imutável (space, externalId) a um node/edge do DMS. */
export interface InstanceRef {
  space: string;
  externalId: string;
}

/** Opção de uma medição do tipo `checkbox` (ex.: `{ label: 'OK', value: 'OK' }`). */
export interface MeasurementOption {
  label: string;
  value: string;
}

/** Usuário (`cdf_apps_shared:CDF_User/v1`). */
export interface CdfUser {
  externalId: string;
  name: string | null;
  email: string | null;
  createdTime: number;
  lastUpdatedTime: number;
}

/** Ativo (`cdf_core:Asset/v2`) — forma resumida usada como alvo de relações. */
export interface AssetSummary {
  externalId: string;
  title: string | null;
  description: string | null;
  labels: string[];
  source: string | null;
  sourceId: string | null;
  parent: InstanceRef | null;
  root: InstanceRef | null;
  createdTime: number;
  lastUpdatedTime: number;
}

/** Medição (`cdf_apm:MeasurementReading/v4`). */
export interface MeasurementReading {
  externalId: string;
  title: string | null;
  type: string | null;
  description: string | null;
  labels: string[];
  options: MeasurementOption[] | null;
  min: number | null;
  max: number | null;
  visibility: string | null;
  isArchived: boolean | null;
  createdTime: number;
  lastUpdatedTime: number;
}

/** Tarefa de uma ronda (`cdf_apm:ChecklistItem/v7`). */
export interface ChecklistItem {
  externalId: string;
  title: string | null;
  description: string | null;
  status: string | null;
  order: number | null;
  note: string | null;
  labels: string[];
  visibility: string | null;
  isArchived: boolean | null;
  startTime: string | null;
  endTime: string | null;
  sourceId: string | null;
  source: string | null;
  /** Resolvido a partir da direct relation `asset`. */
  asset: AssetSummary | null;
  createdBy: CdfUser | null;
  updatedBy: CdfUser | null;
  /** Resolvidas via edges `cdf_apm:referenceMeasurements`. */
  measurements: MeasurementReading[];
  createdTime: number;
  lastUpdatedTime: number;
}

/** Ronda / operator round (`cdf_apm:Checklist/v7`). */
export interface Checklist {
  externalId: string;
  title: string | null;
  description: string | null;
  status: string | null;
  type: string | null;
  /** Nomes dos responsáveis (a view guarda nomes, não refs). */
  assignedTo: string[];
  labels: string[];
  visibility: string | null;
  isArchived: boolean | null;
  startTime: string | null;
  endTime: string | null;
  sourceId: string | null;
  source: string | null;
  /** Resolvido a partir da direct relation `rootLocation`. */
  rootLocation: AssetSummary | null;
  createdBy: CdfUser | null;
  updatedBy: CdfUser | null;
  /** Resolvidas via edges `cdf_apm:referenceChecklistItems`. */
  items: ChecklistItem[];
  createdTime: number;
  lastUpdatedTime: number;
}
