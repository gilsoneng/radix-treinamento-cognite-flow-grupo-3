/**
 * Adapter concreto da porta `ChecklistDataGateway` usando o `@cognite/sdk` (DMS v3).
 *
 * Único arquivo da feature acoplado a `client.instances.*`. Estratégia READ-ONLY:
 *  - nodes: `instances.list` por view (projeção via `sources`) filtrando pelo space;
 *  - edges: `instances.list` filtrando por space + edge `type`;
 *  - paginação por `nextCursor` (nunca "fetch-all" sem checar o cursor).
 *
 * O SDK v10 já reexecuta 429/5xx com backoff internamente — não reimplementamos retry.
 * Em erro, logamos com contexto (sem expor token) e RE-LANÇAMOS, deixando o estado de
 * erro para a camada superior (hook).
 */

import type { CogniteClient, EdgeDefinition, NodeDefinition, ViewReference } from '@cognite/sdk';

import type { InstancesListRequest, InstancesListResponse } from './cdf-instance-types';
import { isEdgeDefinition, isNodeDefinition } from './cdf-instance-types';
import type { ChecklistDataGateway } from './checklist-data-gateway';
import type { EdgeTypeRef } from './model-ids';
import {
  INSTANCE_SPACE,
  VIEW_ASSET,
  VIEW_CDF_USER,
  VIEW_CHECKLIST,
  VIEW_CHECKLIST_ITEM,
  VIEW_MEASUREMENT_READING,
} from './model-ids';

const PAGE_LIMIT = 1000;

/**
 * Fatia mínima do `CogniteClient` consumida por este gateway (interface narrow, §3).
 * O `CogniteClient` completo a satisfaz estruturalmente; um mock só precisa de `instances.list`.
 */
export interface InstancesClient {
  instances: { list: CogniteClient['instances']['list'] };
}

export class CogniteChecklistDataGateway implements ChecklistDataGateway {
  private readonly client: InstancesClient;

  constructor(client: InstancesClient) {
    this.client = client;
  }

  listChecklistNodes(): Promise<NodeDefinition[]> {
    return this.listNodes(VIEW_CHECKLIST);
  }

  listChecklistItemNodes(): Promise<NodeDefinition[]> {
    return this.listNodes(VIEW_CHECKLIST_ITEM);
  }

  listMeasurementReadingNodes(): Promise<NodeDefinition[]> {
    return this.listNodes(VIEW_MEASUREMENT_READING);
  }

  listAssetNodes(): Promise<NodeDefinition[]> {
    return this.listNodes(VIEW_ASSET);
  }

  listCdfUserNodes(): Promise<NodeDefinition[]> {
    return this.listNodes(VIEW_CDF_USER);
  }

  async listEdges(edgeType: EdgeTypeRef): Promise<EdgeDefinition[]> {
    try {
      const items = await this.paginate((cursor) => {
        const request: InstancesListRequest = {
          instanceType: 'edge',
          filter: {
            and: [
              { equals: { property: ['edge', 'space'], value: INSTANCE_SPACE } },
              { equals: { property: ['edge', 'type'], value: { space: edgeType.space, externalId: edgeType.externalId } } },
            ],
          },
          limit: PAGE_LIMIT,
          cursor,
        };
        return this.client.instances.list(request);
      });
      return items.filter(isEdgeDefinition);
    } catch (error) {
      console.error(`Falha ao listar edges '${edgeType.externalId}' no space ${INSTANCE_SPACE}:`, error);
      throw error;
    }
  }

  private async listNodes(view: ViewReference): Promise<NodeDefinition[]> {
    try {
      const items = await this.paginate((cursor) => {
        const request: InstancesListRequest = {
          instanceType: 'node',
          sources: [{ source: view }],
          filter: { equals: { property: ['node', 'space'], value: INSTANCE_SPACE } },
          limit: PAGE_LIMIT,
          cursor,
        };
        return this.client.instances.list(request);
      });
      return items.filter(isNodeDefinition);
    } catch (error) {
      console.error(`Falha ao listar nodes da view ${view.externalId}/${view.version} no space ${INSTANCE_SPACE}:`, error);
      throw error;
    }
  }

  /** Itera as páginas enquanto houver `nextCursor`, acumulando os itens. */
  private async paginate(
    fetchPage: (cursor: string | undefined) => Promise<InstancesListResponse>
  ): Promise<InstancesListResponse['items']> {
    const all: InstancesListResponse['items'] = [];
    let cursor: string | undefined;
    do {
      const page = await fetchPage(cursor);
      all.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return all;
  }
}
