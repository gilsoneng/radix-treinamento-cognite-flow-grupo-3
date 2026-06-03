/**
 * Porta (interface) do gateway de LEITURA do CDF — contrato narrow do qual o service
 * depende (Dependency Inversion). Devolve instâncias DMS "cruas" tipadas pelo SDK; a
 * normalização para o domínio é responsabilidade do mapper, não do gateway (SRP).
 *
 * O único arquivo que conhece `client.instances.*` é o adapter concreto que implementa
 * esta porta (`cognite-checklist-data-gateway.ts`). Assim o service é testável com um
 * fake gateway, sem tocar no SDK.
 */

import type { EdgeDefinition, NodeDefinition } from '@cognite/sdk';

import type { EdgeTypeRef } from './model-ids';

export interface ChecklistDataGateway {
  /** Nodes da view `cdf_apm:Checklist/v7` no instance space. */
  listChecklistNodes(): Promise<NodeDefinition[]>;
  /** Nodes da view `cdf_apm:ChecklistItem/v7`. */
  listChecklistItemNodes(): Promise<NodeDefinition[]>;
  /** Nodes da view `cdf_apm:MeasurementReading/v4`. */
  listMeasurementReadingNodes(): Promise<NodeDefinition[]>;
  /** Nodes da view `cdf_core:Asset/v2`. */
  listAssetNodes(): Promise<NodeDefinition[]>;
  /** Nodes da view `cdf_apps_shared:CDF_User/v1`. */
  listCdfUserNodes(): Promise<NodeDefinition[]>;
  /** Edges de um tipo (ex.: `referenceChecklistItems`) no instance space. */
  listEdges(edgeType: EdgeTypeRef): Promise<EdgeDefinition[]>;
}
