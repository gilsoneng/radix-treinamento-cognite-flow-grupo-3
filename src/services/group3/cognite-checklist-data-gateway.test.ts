import type { CogniteClient } from '@cognite/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeSdkEdge, makeSdkNode } from './__fixtures__/seed';
import type { InstancesListRequest, InstancesListResponse } from './cdf-instance-types';
import { CogniteChecklistDataGateway } from './cognite-checklist-data-gateway';
import type { InstancesClient } from './cognite-checklist-data-gateway';
import { EDGE_REFERENCE_CHECKLIST_ITEMS, INSTANCE_SPACE, VIEW_CHECKLIST } from './model-ids';


type ListFn = CogniteClient['instances']['list'];

function makeClient(list: ListFn): InstancesClient {
  return { instances: { list } };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(CogniteChecklistDataGateway.name, () => {
  it('monta a request de nodes com a view em sources e o filtro de space', async () => {
    // Arrange
    let captured: InstancesListRequest | undefined;
    const list = vi.fn<ListFn>(async (request) => {
      captured = request;
      return { items: [] };
    });

    // Act
    await new CogniteChecklistDataGateway(makeClient(list)).listChecklistNodes();

    // Assert
    expect(captured?.instanceType).toBe('node');
    expect(captured?.sources).toEqual([{ source: VIEW_CHECKLIST }]);
    expect(captured?.filter).toEqual({ equals: { property: ['node', 'space'], value: INSTANCE_SPACE } });
    expect(captured?.limit).toBe(1000);
  });

  it('monta a request de edges com filtro de space + edge type', async () => {
    let captured: InstancesListRequest | undefined;
    const list = vi.fn<ListFn>(async (request) => {
      captured = request;
      return { items: [] };
    });

    await new CogniteChecklistDataGateway(makeClient(list)).listEdges(EDGE_REFERENCE_CHECKLIST_ITEMS);

    expect(captured?.instanceType).toBe('edge');
    expect(captured?.filter).toEqual({
      and: [
        { equals: { property: ['edge', 'space'], value: INSTANCE_SPACE } },
        { equals: { property: ['edge', 'type'], value: { space: 'cdf_apm', externalId: 'referenceChecklistItems' } } },
      ],
    });
  });

  it('pagina enquanto houver nextCursor, repassando o cursor da página anterior', async () => {
    // Arrange
    const page1: InstancesListResponse = {
      items: [makeSdkNode(VIEW_CHECKLIST, 'c1', {})],
      nextCursor: 'CURSOR_1',
    };
    const page2: InstancesListResponse = { items: [makeSdkNode(VIEW_CHECKLIST, 'c2', {})] };
    const list = vi.fn<ListFn>().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    // Act
    const nodes = await new CogniteChecklistDataGateway(makeClient(list)).listChecklistNodes();

    // Assert
    expect(nodes.map((n) => n.externalId)).toEqual(['c1', 'c2']);
    expect(list).toHaveBeenCalledTimes(2);
    expect(list.mock.calls[0]?.[0].cursor).toBeUndefined();
    expect(list.mock.calls[1]?.[0].cursor).toBe('CURSOR_1');
  });

  it('retorna apenas edges (descarta itens que não sejam edge)', async () => {
    const edge = makeSdkEdge(EDGE_REFERENCE_CHECKLIST_ITEMS, 'rci-1', 'checklist-a', 'item-1');
    const node = makeSdkNode(VIEW_CHECKLIST, 'checklist-a', {});
    const list = vi.fn<ListFn>(async () => ({ items: [edge, node] }));

    const edges = await new CogniteChecklistDataGateway(makeClient(list)).listEdges(EDGE_REFERENCE_CHECKLIST_ITEMS);

    expect(edges).toHaveLength(1);
    expect(edges[0]?.instanceType).toBe('edge');
  });

  it('loga com contexto e re-lança quando o SDK falha', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const list = vi.fn<ListFn>(async () => {
      throw new Error('cdf indisponível');
    });

    await expect(new CogniteChecklistDataGateway(makeClient(list)).listChecklistNodes()).rejects.toThrow(
      'cdf indisponível'
    );
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('cada listagem de node delega para instances.list (uma chamada por view)', async () => {
    const list = vi.fn<ListFn>(async () => ({ items: [] }));
    const gateway = new CogniteChecklistDataGateway(makeClient(list));

    await Promise.all([
      gateway.listChecklistItemNodes(),
      gateway.listMeasurementReadingNodes(),
      gateway.listAssetNodes(),
      gateway.listCdfUserNodes(),
    ]);

    expect(list).toHaveBeenCalledTimes(4);
  });

  it('listEdges também loga e re-lança quando o SDK falha', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const list = vi.fn<ListFn>(async () => {
      throw new Error('edge boom');
    });

    await expect(
      new CogniteChecklistDataGateway(makeClient(list)).listEdges(EDGE_REFERENCE_CHECKLIST_ITEMS)
    ).rejects.toThrow('edge boom');
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
