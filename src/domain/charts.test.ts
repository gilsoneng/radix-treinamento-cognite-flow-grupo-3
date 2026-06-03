import { describe, expect, it } from 'vitest';

import type { AssetSummary, Checklist, ChecklistItem } from '../types/apm';

import type { ChartSelection } from './chart-types';
import {
  assetDrillRows,
  buildChartData,
  buildTimeBins,
  classifyChartResult,
  computeInstantCounts,
  computeTimeSeries,
  defaultItemTimestamp,
  filterChecklistsByChartSelection,
  flattenItems,
  itemMatchesSelection,
  itemsForSelection,
} from './charts';

// 2026-05-15 12:00 UTC = 2026-05-15 09:00 em America/Sao_Paulo (UTC-3, sem DST).
const NOW = Date.UTC(2026, 4, 15, 12, 0, 0);
const ZONE = 'America/Sao_Paulo';

describe('classifyChartResult', () => {
  it('mapeia status crus para ok / not_ok / outros', () => {
    expect(classifyChartResult(makeItem({ status: 'OK' }), NOW)).toBe('ok');
    expect(classifyChartResult(makeItem({ status: 'Completed' }), NOW)).toBe('ok');
    expect(classifyChartResult(makeItem({ status: 'Not OK' }), NOW)).toBe('not_ok');
    expect(classifyChartResult(makeItem({ status: 'failed' }), NOW)).toBe('not_ok');
    expect(classifyChartResult(makeItem({ status: 'Blocked' }), NOW)).toBe('outros');
    expect(classifyChartResult(makeItem({ status: 'To Do' }), NOW)).toBe('outros');
  });
});

describe('defaultItemTimestamp', () => {
  it('usa endTime quando parseável', () => {
    const ts = defaultItemTimestamp(makeItem({ endTime: '2026-05-10T00:00:00.000Z' }));
    expect(ts).toBe(Date.parse('2026-05-10T00:00:00.000Z'));
  });

  it('cai para lastUpdatedTime quando endTime é nulo/inválido', () => {
    expect(defaultItemTimestamp(makeItem({ endTime: null, lastUpdatedTime: 123 }))).toBe(123);
    expect(defaultItemTimestamp(makeItem({ endTime: 'lixo', lastUpdatedTime: 456 }))).toBe(456);
  });
});

describe('buildTimeBins', () => {
  it('gera 7 / 30 / 12 bins conforme a escala', () => {
    expect(buildTimeBins('7d', NOW, ZONE)).toHaveLength(7);
    expect(buildTimeBins('30d', NOW, ZONE)).toHaveLength(30);
    expect(buildTimeBins('12m', NOW, ZONE)).toHaveLength(12);
  });

  it('produz bins contíguos e crescentes', () => {
    const bins = buildTimeBins('7d', NOW, ZONE);
    for (let i = 0; i < bins.length - 1; i += 1) {
      expect(bins[i].end).toBe(bins[i + 1].start);
      expect(bins[i].start).toBeLessThan(bins[i].end);
    }
  });

  it('o último bin (diário e mensal) contém `now`', () => {
    for (const scale of ['7d', '30d', '12m'] as const) {
      const bins = buildTimeBins(scale, NOW, ZONE);
      const last = bins[bins.length - 1];
      expect(NOW).toBeGreaterThanOrEqual(last.start);
      expect(NOW).toBeLessThan(last.end);
    }
  });

  it('o bin diário começa à meia-noite civil da planta (UTC-3)', () => {
    const bins = buildTimeBins('7d', NOW, ZONE);
    const last = bins[bins.length - 1];
    // Meia-noite de 2026-05-15 em São Paulo = 2026-05-15T03:00:00Z.
    expect(last.start).toBe(Date.UTC(2026, 4, 15, 3, 0, 0));
  });
});

describe('computeTimeSeries', () => {
  it('distribui OK/Not Ok nos bins certos e ignora "outros" e itens fora da janela', () => {
    const items = [
      makeItem({ status: 'OK', endTime: '2026-05-15T10:00:00.000Z' }), // hoje
      makeItem({ status: 'OK', endTime: '2026-05-14T10:00:00.000Z' }), // ontem
      makeItem({ status: 'Not OK', endTime: '2026-05-15T11:00:00.000Z' }), // hoje
      makeItem({ status: 'To Do', endTime: '2026-05-15T11:00:00.000Z' }), // outros → ignorado
      makeItem({ status: 'OK', endTime: '2025-01-01T00:00:00.000Z' }), // fora da janela 7d
    ];

    const series = computeTimeSeries(items, '7d', NOW, defaultItemTimestamp, ZONE);

    const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(total(series.ok)).toBe(2);
    expect(total(series.notOk)).toBe(1);
    // O bin de hoje (último) tem 1 OK e 1 Not Ok.
    expect(series.ok[series.ok.length - 1]).toBe(1);
    expect(series.notOk[series.notOk.length - 1]).toBe(1);
  });
});

describe('computeInstantCounts', () => {
  it('conta ok / not_ok / outros e total', () => {
    const items = [
      makeItem({ status: 'OK' }),
      makeItem({ status: 'completed' }),
      makeItem({ status: 'Not OK' }),
      makeItem({ status: 'Blocked' }),
      makeItem({ status: 'To Do' }),
    ];
    expect(computeInstantCounts(items, NOW)).toEqual({ ok: 2, notOk: 1, outros: 2, total: 5 });
  });
});

describe('seleção e drill-down', () => {
  const selection: ChartSelection = {
    scale: '7d',
    binStart: Date.UTC(2026, 4, 15, 3, 0, 0), // meia-noite de 15/05 BRT
    binEnd: Date.UTC(2026, 4, 16, 3, 0, 0),
    result: 'not_ok',
    binLabel: '15/05',
  };

  it('itemMatchesSelection casa série + intervalo do bin', () => {
    const match = makeItem({ status: 'Not OK', endTime: '2026-05-15T12:00:00.000Z' });
    const wrongResult = makeItem({ status: 'OK', endTime: '2026-05-15T12:00:00.000Z' });
    const wrongBin = makeItem({ status: 'Not OK', endTime: '2026-05-14T12:00:00.000Z' });

    expect(itemMatchesSelection(match, selection, NOW)).toBe(true);
    expect(itemMatchesSelection(wrongResult, selection, NOW)).toBe(false);
    expect(itemMatchesSelection(wrongBin, selection, NOW)).toBe(false);
  });

  it('itemsForSelection e filterChecklistsByChartSelection recortam pela seleção', () => {
    const inSel = makeItem({ externalId: 'i1', status: 'Not OK', endTime: '2026-05-15T12:00:00.000Z' });
    const outSel = makeItem({ externalId: 'i2', status: 'OK', endTime: '2026-05-15T12:00:00.000Z' });
    const cA = makeChecklist({ externalId: 'A', items: [inSel] });
    const cB = makeChecklist({ externalId: 'B', items: [outSel] });

    expect(itemsForSelection([inSel, outSel], selection, NOW).map((i) => i.externalId)).toEqual(['i1']);
    expect(filterChecklistsByChartSelection([cA, cB], selection, NOW).map((c) => c.externalId)).toEqual(['A']);
  });

  it('assetDrillRows agrupa assets distintos com contagem, ordenado por contagem', () => {
    const items = [
      makeItem({ asset: makeAsset({ externalId: 'a1', title: 'Bomba' }) }),
      makeItem({ asset: makeAsset({ externalId: 'a1', title: 'Bomba' }) }),
      makeItem({ asset: makeAsset({ externalId: 'a2', title: 'Compressor' }) }),
      makeItem({ asset: null }),
    ];
    const rows = assetDrillRows(items);
    // Maior contagem primeiro; empates por título ('(' < 'C' em pt-BR).
    expect(rows[0]).toEqual({ externalId: 'a1', title: 'Bomba', count: 2 });
    expect(rows.map((r) => r.externalId)).toEqual(['a1', '(sem ativo)', 'a2']);
  });
});

describe('buildChartData', () => {
  it('série temporal sobre todos os filtrados; instantâneo e drill sobre a seleção', () => {
    const okToday = makeItem({ externalId: 'ok1', status: 'OK', endTime: '2026-05-15T12:00:00.000Z' });
    const notOkToday = makeItem({
      externalId: 'no1',
      status: 'Not OK',
      endTime: '2026-05-15T12:00:00.000Z',
      asset: makeAsset({ externalId: 'a9', title: 'Válvula' }),
    });
    const checklist = makeChecklist({ items: [okToday, notOkToday] });
    const selection: ChartSelection = {
      scale: '7d',
      binStart: Date.UTC(2026, 4, 15, 3, 0, 0),
      binEnd: Date.UTC(2026, 4, 16, 3, 0, 0),
      result: 'not_ok',
      binLabel: '15/05',
    };

    const result = buildChartData(
      [checklist],
      { status: [], onlyOverdue: false, priority: [], area: [], period: 'all' },
      '',
      '7d',
      selection,
      NOW,
      defaultItemTimestamp,
      ZONE
    );

    // Série temporal vê os dois itens (seleção não a encolhe).
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(sum(result.timeSeries.ok)).toBe(1);
    expect(sum(result.timeSeries.notOk)).toBe(1);
    // Instantâneo reflete só a seleção (1 Not Ok).
    expect(result.instant).toEqual({ ok: 0, notOk: 1, outros: 0, total: 1 });
    // Drill lista o asset do item selecionado.
    expect(result.drillAssets).toEqual([{ externalId: 'a9', title: 'Válvula', count: 1 }]);
    expect(result.hasSelection).toBe(true);
    expect(result.totalFilteredItems).toBe(2);
  });

  it('sem seleção: instantâneo sobre todos os filtrados e drill vazio', () => {
    const checklist = makeChecklist({
      items: [makeItem({ status: 'OK' }), makeItem({ status: 'Not OK' }), makeItem({ status: 'To Do' })],
    });

    const result = buildChartData(
      [checklist],
      { status: [], onlyOverdue: false, priority: [], area: [], period: 'all' },
      '',
      '30d',
      null,
      NOW,
      defaultItemTimestamp,
      ZONE
    );

    expect(result.instant).toEqual({ ok: 1, notOk: 1, outros: 1, total: 3 });
    expect(result.drillAssets).toEqual([]);
    expect(result.hasSelection).toBe(false);
  });
});

describe('flattenItems', () => {
  it('achata os itens de várias rondas', () => {
    const c1 = makeChecklist({ items: [makeItem({ externalId: 'x' })] });
    const c2 = makeChecklist({ items: [makeItem({ externalId: 'y' }), makeItem({ externalId: 'z' })] });
    expect(flattenItems([c1, c2]).map((i) => i.externalId)).toEqual(['x', 'y', 'z']);
  });
});

// --- helpers (no fim do arquivo) ---

function makeAsset(overrides: Partial<AssetSummary> = {}): AssetSummary {
  return {
    externalId: 'asset-1',
    title: 'Ativo',
    description: null,
    labels: [],
    source: null,
    sourceId: null,
    parent: null,
    root: null,
    createdTime: NOW,
    lastUpdatedTime: NOW,
    ...overrides,
  };
}

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    externalId: 'item-1',
    title: 'Check',
    description: null,
    status: 'OK',
    order: 1,
    note: null,
    labels: [],
    visibility: 'PUBLIC',
    isArchived: false,
    startTime: null,
    endTime: '2026-05-15T10:00:00.000Z',
    sourceId: null,
    source: null,
    asset: makeAsset(),
    createdBy: null,
    updatedBy: null,
    measurements: [],
    createdTime: NOW,
    lastUpdatedTime: NOW,
    ...overrides,
  };
}

function makeChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    externalId: 'checklist-1',
    title: 'Ronda',
    description: null,
    status: 'Ongoing',
    type: 'OEC Route',
    assignedTo: [],
    labels: [],
    visibility: 'PUBLIC',
    isArchived: false,
    startTime: null,
    endTime: null,
    sourceId: null,
    source: null,
    rootLocation: null,
    createdBy: null,
    updatedBy: null,
    items: [],
    createdTime: NOW,
    lastUpdatedTime: NOW,
    ...overrides,
  };
}
