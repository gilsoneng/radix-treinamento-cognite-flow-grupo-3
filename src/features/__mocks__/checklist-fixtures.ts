/**
 * Fixtures e mocks dos contratos (§6) para os testes da frente DEV 4.
 *
 * Fornece factories do domínio normalizado (`Checklist`/`ChecklistItem`/...) e um
 * `makeFeatureDeps` com implementações default simples (passthrough) que os testes
 * sobrescrevem por caso. Mantido fora da cobertura (vitest.config `__mocks__`) por ser
 * código exclusivo de teste.
 */

import { vi } from 'vitest';

import type { ChecklistViewResult } from '../../domain';
import type { AssetSummary, Checklist, ChecklistItem, MeasurementReading } from '../../types/apm';
import type { AppState, AppStateApi, ChecklistDataSource, StatusBucket } from '../contracts';
import { DEFAULT_STATE } from '../contracts';
import type { FeatureDeps } from '../feature-deps';

/** Instante de referência determinístico usado como `now` nos testes (epoch ms). */
export const NOW = Date.UTC(2026, 4, 15, 12, 0, 0);

export function makeAsset(overrides: Partial<AssetSummary> = {}): AssetSummary {
  return {
    externalId: 'asset-equip',
    title: 'Diffuser Scraper',
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

export function makeMeasurement(overrides: Partial<MeasurementReading> = {}): MeasurementReading {
  return {
    externalId: 'm-checkbox',
    title: 'OK / Not OK',
    type: 'checkbox',
    description: null,
    labels: [],
    options: [
      { label: 'OK', value: 'OK' },
      { label: 'Not OK', value: 'Not OK' },
    ],
    min: null,
    max: null,
    visibility: 'PUBLIC',
    isArchived: false,
    createdTime: NOW,
    lastUpdatedTime: NOW,
    ...overrides,
  };
}

export function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    externalId: 'item-1',
    title: 'General Condition',
    description: null,
    status: 'OK',
    order: 1,
    note: null,
    labels: [],
    visibility: 'PUBLIC',
    isArchived: false,
    startTime: null,
    endTime: null,
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

export function makeChecklist(overrides: Partial<Checklist> = {}): Checklist {
  return {
    externalId: 'checklist-a',
    title: '7th Floor',
    description: null,
    status: 'Ongoing',
    type: 'OEC Route',
    assignedTo: ['Alex Morgan'],
    labels: [],
    visibility: 'PUBLIC',
    isArchived: false,
    startTime: '2026-05-01T12:00:00.000Z',
    endTime: '2026-05-20T12:00:00.000Z',
    sourceId: null,
    source: null,
    rootLocation: makeAsset({ externalId: 'asset-root', title: 'Route Root' }),
    createdBy: null,
    updatedBy: null,
    items: [],
    createdTime: NOW,
    lastUpdatedTime: NOW,
    ...overrides,
  };
}

const RAW_STATUS_TO_BUCKET: Record<string, StatusBucket> = {
  Completed: 'concluido',
  Ongoing: 'em_andamento',
  'To Do': 'aberto',
};

/** Classificação default simples (mapeia o status cru); testes sobrescrevem quando preciso. */
function defaultClassify(checklist: Checklist): StatusBucket {
  return checklist.status ? (RAW_STATUS_TO_BUCKET[checklist.status] ?? 'aberto') : 'aberto';
}

export function makeAppStateApi(state: Partial<AppState> = {}, overrides: Partial<AppStateApi> = {}): AppStateApi {
  return {
    state: { ...DEFAULT_STATE, ...state },
    setActiveView: vi.fn(),
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setSearch: vi.fn(),
    selectChecklist: vi.fn(),
    closeDetail: vi.fn(),
    setChartScale: vi.fn(),
    selectChartBin: vi.fn(),
    clearChartSelection: vi.fn(),
    ...overrides,
  };
}

export function makeDataSource(overrides: Partial<ChecklistDataSource> = {}): ChecklistDataSource {
  return {
    checklists: [],
    isLoading: false,
    isRefreshing: false,
    isError: false,
    error: null,
    lastUpdatedAt: NOW,
    refresh: vi.fn(),
    ...overrides,
  };
}

export function makeFeatureDeps(overrides: Partial<FeatureDeps> = {}): FeatureDeps {
  return {
    useChecklistData: () => makeDataSource(),
    useAppState: () => makeAppStateApi(),
    buildChecklistView: (checklists, _filters, _search, _sort, _now): ChecklistViewResult => ({
      rows: checklists,
      checklistKpis: {
        openCount: 0,
        overdueCount: 0,
        slaOnTimePercent: 100,
        byStatus: { aberto: 0, em_andamento: 0, atrasado: 0, concluido: 0 },
        byPriority: { alta: 0, media: 0, baixa: 0 },
        byArea: [],
      },
      itemKpis: { totalItems: 0, openItems: 0, overdueItems: 0, byItemStatus: {} },
    }),
    buildChartData: (_all, _filters, _search, scale, selection) => ({
      scale,
      timeSeries: { scale, bins: [], ok: [], notOk: [] },
      instant: { ok: 0, notOk: 0, outros: 0, total: 0 },
      drillAssets: [],
      totalFilteredItems: 0,
      hasSelection: selection !== null,
    }),
    filterChecklistsByChartSelection: (checklists) => checklists,
    classifyStatus: (checklist) => defaultClassify(checklist),
    isOverdue: () => false,
    derivePriority: () => 'media',
    deriveArea: (checklist) => checklist.rootLocation?.title ?? null,
    classifyItemStatus: () => 'pendente',
    now: () => NOW,
    ...overrides,
  };
}
