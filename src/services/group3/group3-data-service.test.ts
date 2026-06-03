import type { CogniteClient } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { buildSampleGraph } from './__fixtures__/seed';
import type { ChecklistDataGateway } from './checklist-data-gateway';
import { ApmGroup3DataService } from './group3-data-service';
import { createGroup3DataService } from './index';


type ListFn = CogniteClient['instances']['list'];

function makeGateway(graph = buildSampleGraph()): ChecklistDataGateway {
  return {
    listChecklistNodes: vi.fn(async () => graph.checklists),
    listChecklistItemNodes: vi.fn(async () => graph.checklistItems),
    listMeasurementReadingNodes: vi.fn(async () => graph.measurements),
    listAssetNodes: vi.fn(async () => graph.assets),
    listCdfUserNodes: vi.fn(async () => graph.users),
    listEdges: vi.fn(async (edgeType) =>
      edgeType.externalId === 'referenceChecklistItems' ? graph.checklistItemEdges : graph.measurementEdges
    ),
  };
}

describe(ApmGroup3DataService.name, () => {
  it('getChecklists devolve rondas normalizadas com itens e medições aninhados', async () => {
    // Arrange
    const service = new ApmGroup3DataService(makeGateway());

    // Act
    const checklists = await service.getChecklists();

    // Assert
    expect(checklists).toHaveLength(2);
    const a = checklists.find((c) => c.externalId === 'checklist-a');
    expect(a?.items.map((i) => i.externalId)).toEqual(['item-1', 'item-2']);
    expect(a?.items[0]?.measurements.map((m) => m.externalId)).toEqual(['m-checkbox']);
    expect(a?.rootLocation?.externalId).toBe('asset-root');
  });

  it('getChecklistItems devolve itens com medições e asset resolvidos', async () => {
    const service = new ApmGroup3DataService(makeGateway());

    const items = await service.getChecklistItems();

    expect(items).toHaveLength(3);
    expect(items.find((i) => i.externalId === 'item-1')?.asset?.externalId).toBe('asset-equip');
    expect(items.find((i) => i.externalId === 'item-3')?.measurements).toEqual([]);
  });

  it('getMeasurementReadings / getAssets / getUsers devolvem os leaves mapeados', async () => {
    const service = new ApmGroup3DataService(makeGateway());

    expect(await service.getMeasurementReadings()).toHaveLength(2);
    expect(await service.getAssets()).toHaveLength(2);
    expect((await service.getUsers()).map((u) => u.externalId)).toContain('user-supervisor');
  });

  it('devolve listas vazias quando o space não tem instâncias', async () => {
    const empty: ChecklistDataGateway = {
      listChecklistNodes: vi.fn(async () => []),
      listChecklistItemNodes: vi.fn(async () => []),
      listMeasurementReadingNodes: vi.fn(async () => []),
      listAssetNodes: vi.fn(async () => []),
      listCdfUserNodes: vi.fn(async () => []),
      listEdges: vi.fn(async () => []),
    };
    const service = new ApmGroup3DataService(empty);

    expect(await service.getChecklists()).toEqual([]);
    expect(await service.getUsers()).toEqual([]);
  });

  it('propaga o erro quando o gateway falha', async () => {
    const gateway = makeGateway();
    vi.mocked(gateway.listChecklistNodes).mockRejectedValueOnce(new Error('cdf down'));
    const service = new ApmGroup3DataService(gateway);

    await expect(service.getChecklists()).rejects.toThrow('cdf down');
  });
});

describe(createGroup3DataService.name, () => {
  it('compõe um service com as 5 operações a partir de um client', () => {
    const service = createGroup3DataService({ instances: { list: vi.fn<ListFn>() } });

    expect(typeof service.getChecklists).toBe('function');
    expect(typeof service.getChecklistItems).toBe('function');
    expect(typeof service.getMeasurementReadings).toBe('function');
    expect(typeof service.getAssets).toBe('function');
    expect(typeof service.getUsers).toBe('function');
  });
});
