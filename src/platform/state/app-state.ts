/**
 * Forma do estado HOST-SYNCED (FR-011) + (de)serialização PURA e validada.
 *
 * Este é o único estado que decide "o que o usuário vê" (visão ativa, filtros, ordenação,
 * busca, ronda selecionada/detalhe). Ele vive na store compartilhada (`AppStateProvider`)
 * e é espelhado na URL pelo host — nunca em `useState`/`useRef` espalhados (CLAUDE.md §2).
 *
 * `parseAppState` é TOLERANTE: estado vindo de um link compartilhado antigo ou corrompido
 * nunca quebra a tela — cada campo inválido cai no default (forward-compatible). Sem `as`
 * (CLAUDE.md §7): a validação usa type guards.
 */

import type { ChartResult, ChartScale, ChartSelection } from '../../domain/chart-types';
import { CHART_RESULTS, CHART_SCALES, DEFAULT_CHART_SCALE } from '../../domain/chart-types';
import type { Filters, Period, Priority, Sort, SortDir, SortKey, StatusBucket } from '../../domain/types';
import { EMPTY_FILTERS, PERIODS, PRIORITIES, SORT_DIRS, SORT_KEYS, STATUS_BUCKETS } from '../../domain/types';

/** Visão ativa do app. */
export type ActiveView = 'dashboard' | 'list';
export const ACTIVE_VIEWS: readonly ActiveView[] = ['dashboard', 'list'];

export interface AppState {
  activeView: ActiveView;
  filters: Filters;
  sort: Sort;
  search: string;
  selectedChecklistId: string | null;
  detailOpen: boolean;
  /** Escala visual do gráfico temporal do dashboard (FR-005). */
  chartScale: ChartScale;
  /** Seleção do gráfico (cross-filter); `null` = sem recorte por gráfico (FR-008/011). */
  chartSelection: ChartSelection | null;
}

/** Estado inicial quando não há nada na URL (primeira abertura). */
export const DEFAULT_STATE: AppState = {
  activeView: 'dashboard',
  filters: EMPTY_FILTERS,
  sort: { key: 'prazo', dir: 'asc' },
  search: '',
  selectedChecklistId: null,
  detailOpen: false,
  chartScale: DEFAULT_CHART_SCALE,
  chartSelection: null,
};

// --- Type guards (puros, sem `as`) ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.some((candidate) => candidate === value);
}

function stringArrayWithin<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => oneOf(item, allowed));
}

function plainStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parseFilters(value: unknown): Filters {
  if (!isRecord(value)) return EMPTY_FILTERS;
  const status: StatusBucket[] = stringArrayWithin(value.status, STATUS_BUCKETS);
  const priority: Priority[] = stringArrayWithin(value.priority, PRIORITIES);
  const period: Period = oneOf(value.period, PERIODS) ? value.period : EMPTY_FILTERS.period;
  return {
    status,
    onlyOverdue: typeof value.onlyOverdue === 'boolean' ? value.onlyOverdue : false,
    priority,
    area: plainStringArray(value.area),
    period,
  };
}

function parseSort(value: unknown): Sort {
  if (!isRecord(value)) return DEFAULT_STATE.sort;
  const key: SortKey = oneOf(value.key, SORT_KEYS) ? value.key : DEFAULT_STATE.sort.key;
  const dir: SortDir = oneOf(value.dir, SORT_DIRS) ? value.dir : DEFAULT_STATE.sort.dir;
  return { key, dir };
}

function parseChartScale(value: unknown): ChartScale {
  return oneOf(value, CHART_SCALES) ? value : DEFAULT_CHART_SCALE;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Seleção tolerante: qualquer campo ausente/ inválido → `null` (sem recorte). Um link
 * antigo sem `chartSelection`, ou com lixo, nunca quebra a tela — apenas não aplica recorte.
 */
function parseChartSelection(value: unknown): ChartSelection | null {
  if (!isRecord(value)) return null;
  const scale: ChartScale = parseChartScale(value.scale);
  if (!isFiniteNumber(value.binStart) || !isFiniteNumber(value.binEnd) || value.binEnd <= value.binStart) {
    return null;
  }
  const result: ChartResult | null = oneOf(value.result, CHART_RESULTS) ? value.result : null;
  if (result === null) return null;
  const binLabel = typeof value.binLabel === 'string' ? value.binLabel : '';
  return { scale, binStart: value.binStart, binEnd: value.binEnd, result, binLabel };
}

/**
 * Reconstrói um `AppState` válido a partir da string do host (ou `undefined`).
 * Qualquer parte ausente/ inválida assume o default — a tela nunca quebra por estado ruim.
 */
export function parseAppState(raw: string | undefined): AppState {
  if (raw === undefined || raw === '') return DEFAULT_STATE;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_STATE;
  }
  if (!isRecord(parsed)) return DEFAULT_STATE;

  return {
    activeView: oneOf(parsed.activeView, ACTIVE_VIEWS) ? parsed.activeView : DEFAULT_STATE.activeView,
    filters: parseFilters(parsed.filters),
    sort: parseSort(parsed.sort),
    search: typeof parsed.search === 'string' ? parsed.search : '',
    selectedChecklistId: typeof parsed.selectedChecklistId === 'string' ? parsed.selectedChecklistId : null,
    detailOpen: typeof parsed.detailOpen === 'boolean' ? parsed.detailOpen : false,
    chartScale: parseChartScale(parsed.chartScale),
    chartSelection: parseChartSelection(parsed.chartSelection),
  };
}

/** Serializa o estado para a string que o host grava na URL. */
export function serializeAppState(state: AppState): string {
  return JSON.stringify(state);
}
