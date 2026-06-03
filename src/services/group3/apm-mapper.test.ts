import { describe, expect, it } from 'vitest';

import { SEED_TIME, buildSampleGraph, loadSeedRawGraph } from './__fixtures__/seed';
import { mapAssets, mapChecklistItems, mapChecklists, mapMeasurementReadings, mapUsers } from './apm-mapper';
import { INSTANCE_SPACE } from './model-ids';


describe('apm-mapper — grafo controlado', () => {
  it('mapUsers extrai name/email e os timestamps do node', () => {
    // Arrange / Act
    const users = mapUsers(buildSampleGraph().users);

    // Assert
    expect(users).toHaveLength(2);
    expect(users.find((u) => u.externalId === 'user-supervisor')).toEqual({
      externalId: 'user-supervisor',
      name: 'Pat Supervisor',
      email: 'pat.supervisor@plant.test',
      createdTime: SEED_TIME,
      lastUpdatedTime: SEED_TIME,
    });
  });

  it('mapAssets resolve refs parent/root e mantém null no asset raiz', () => {
    const assets = mapAssets(buildSampleGraph().assets);

    const equip = assets.find((a) => a.externalId === 'asset-equip');
    expect(equip?.title).toBe('Diffuser Scraper');
    expect(equip?.sourceId).toBe('301112080');
    expect(equip?.parent).toEqual({ space: INSTANCE_SPACE, externalId: 'asset-root' });
    expect(equip?.root).toEqual({ space: INSTANCE_SPACE, externalId: 'asset-root' });

    const root = assets.find((a) => a.externalId === 'asset-root');
    expect(root?.parent).toBeNull();
    expect(root?.root).toBeNull();
  });

  it('mapMeasurementReadings trata checkbox (options) e numérica (max)', () => {
    const readings = mapMeasurementReadings(buildSampleGraph().measurements);

    const checkbox = readings.find((m) => m.externalId === 'm-checkbox');
    expect(checkbox?.type).toBe('checkbox');
    expect(checkbox?.options).toEqual([
      { label: 'OK', value: 'OK' },
      { label: 'Not OK', value: 'Not OK' },
    ]);
    expect(checkbox?.max).toBeNull();

    const numerical = readings.find((m) => m.externalId === 'm-numerical');
    expect(numerical?.max).toBe(170);
    expect(numerical?.options).toBeNull();
  });

  it('mapChecklistItems aninha medições via edges e resolve asset/usuários', () => {
    const items = mapChecklistItems(buildSampleGraph());

    expect(items).toHaveLength(3);

    const item1 = items.find((i) => i.externalId === 'item-1');
    expect(item1?.asset?.externalId).toBe('asset-equip');
    expect(item1?.createdBy?.name).toBe('Pat Supervisor');
    expect(item1?.updatedBy?.externalId).toBe('user-operator');
    expect(item1?.measurements.map((m) => m.externalId)).toEqual(['m-checkbox']);

    // item-3 não tem edge de medição nem asset → coleções/refs vazias.
    const item3 = items.find((i) => i.externalId === 'item-3');
    expect(item3?.measurements).toEqual([]);
    expect(item3?.asset).toBeNull();
    expect(item3?.createdBy).toBeNull();
  });

  it('mapChecklists aninha itens via edges e resolve rootLocation/assignedTo', () => {
    const checklists = mapChecklists(buildSampleGraph());

    expect(checklists).toHaveLength(2);

    const a = checklists.find((c) => c.externalId === 'checklist-a');
    expect(a?.assignedTo).toEqual(['Alex Morgan', 'Jordan Lee']);
    expect(a?.rootLocation?.externalId).toBe('asset-root');
    expect(a?.items.map((i) => i.externalId)).toEqual(['item-1', 'item-2']);
    expect(a?.items[0]?.measurements).toHaveLength(1);

    const b = checklists.find((c) => c.externalId === 'checklist-b');
    expect(b?.items.map((i) => i.externalId)).toEqual(['item-3']);
    expect(b?.rootLocation).toBeNull();
  });
});

describe('apm-mapper — seed real (cognite-flows-grupo-3)', () => {
  const graph = loadSeedRawGraph();

  it('carrega as contagens de produção (245 nodes / 385 edges)', () => {
    expect(graph.checklists).toHaveLength(8);
    expect(graph.checklistItems).toHaveLength(193);
    expect(graph.measurements).toHaveLength(4);
    expect(graph.assets).toHaveLength(36);
    expect(graph.users).toHaveLength(4);
    expect(graph.checklistItemEdges).toHaveLength(193);
    expect(graph.measurementEdges).toHaveLength(192);
  });

  it('mapeia 8 rondas cujos itens somam 193 e cujas medições somam 192', () => {
    const checklists = mapChecklists(graph);

    expect(checklists).toHaveLength(8);

    const totalItems = checklists.reduce((acc, c) => acc + c.items.length, 0);
    expect(totalItems).toBe(193);

    const totalMeasurements = checklists.reduce(
      (acc, c) => acc + c.items.reduce((inner, item) => inner + item.measurements.length, 0),
      0
    );
    expect(totalMeasurements).toBe(192);
  });

  it('toda ronda tem status string e rootLocation resolvido para o asset raiz', () => {
    const checklists = mapChecklists(graph);

    for (const checklist of checklists) {
      expect(typeof checklist.status).toBe('string');
      expect(checklist.rootLocation?.externalId).toBe('asset-route-root_group_3');
    }
  });
});
