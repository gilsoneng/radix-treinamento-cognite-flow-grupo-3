/**
 * Lógica PURA dos gráficos de OK/Not Ok (spec
 * `specs/feature-graficos-ok-notok-drilldown.md`). Sem React, sem SDK — `now` injetado.
 *
 * Responsabilidades:
 *  - Classificar cada `ChecklistItem` na série do gráfico (`ok` / `not_ok` / `outros`),
 *    reaproveitando `classifyItemStatus` (não dependemos de constantes privadas).
 *  - Bucketizar itens em bins temporais por escala (7d/30d → dias; 12m → meses), no fuso
 *    civil da planta (`America/Sao_Paulo`, alinhado a `deadline.ts`).
 *  - Agregar contagens instantâneas (OK / Not Ok / outros).
 *  - Resolver a seleção (cross-filter) e o drill-down de assets (`item.asset`).
 *  - `buildChartData`: orquestrador único consumido pelo ViewModel do dashboard, espelhando
 *    o mesmo recorte (filtros + busca) usado pela lista.
 *
 * Decisões registradas como Clarifications na spec:
 *  - Eixo temporal ancorado em `endTime` (prazo/conclusão planejada) com fallback para
 *    `lastUpdatedTime` quando ausente — trocável via `itemTimestamp` injetado (Clarification #1).
 *  - "Not Ok" = bucket `not_ok`; `blocked`/`pendente`/`em_andamento`/`concluido` caem em
 *    "outros" (Clarification #2).
 */

import type { Checklist, ChecklistItem } from '../types/apm';

import type { ChartResult, ChartScale, ChartSelection } from './chart-types';
import { PLANT_TIME_ZONE } from './deadline';
import { applyFilters } from './filters';
import { classifyItemStatus } from './item-status';
import { applySearch } from './search';
import type { Filters } from './types';

// ---------------------------------------------------------------------------
// Classificação de resultado (série do gráfico)
// ---------------------------------------------------------------------------

/** Bucket do gráfico: as duas séries + "outros" (não plotado como série). */
export type ChartResultBucket = ChartResult | 'outros';

/** Mapeia o status do item para a série do gráfico via `classifyItemStatus` (FR-002/003). */
export function classifyChartResult(item: ChecklistItem, now: number): ChartResultBucket {
  const bucket = classifyItemStatus(item, now);
  if (bucket === 'ok') return 'ok';
  if (bucket === 'not_ok') return 'not_ok';
  return 'outros';
}

// ---------------------------------------------------------------------------
// Timestamp-âncora do item (eixo temporal, FR-007 / Clarification #1)
// ---------------------------------------------------------------------------

export type ItemTimestamp = (item: ChecklistItem) => number | null;

/** `endTime` (ISO) quando parseável; senão `lastUpdatedTime` (epoch ms). */
export const defaultItemTimestamp: ItemTimestamp = (item) => {
  if (item.endTime !== null && item.endTime !== '') {
    const parsed = Date.parse(item.endTime);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Number.isFinite(item.lastUpdatedTime) ? item.lastUpdatedTime : null;
};

// ---------------------------------------------------------------------------
// Fronteiras de dia/mês civil no fuso da planta
// ---------------------------------------------------------------------------

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(epoch: number, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epoch));

  const value = (type: string): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number(found.value) : 0;
  };

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

/** Primeiro ms do dia civil que contém `epoch`, no fuso informado. */
function startOfCivilDay(epoch: number, timeZone: string): number {
  const parts = zonedParts(epoch, timeZone);
  const msOfSecond = ((epoch % 1000) + 1000) % 1000;
  const msIntoDay = ((parts.hour * 60 + parts.minute) * 60 + parts.second) * 1000 + msOfSecond;
  return epoch - msIntoDay;
}

/** Início do próximo dia civil (+26h cruza com folga; normaliza ao início do dia). */
function startOfNextCivilDay(dayStart: number, timeZone: string): number {
  return startOfCivilDay(dayStart + 26 * 3_600_000, timeZone);
}

/** Primeiro ms do 1º dia do mês civil que contém `epoch`. */
function startOfCivilMonth(epoch: number, timeZone: string): number {
  let cursor = startOfCivilDay(epoch, timeZone);
  while (zonedParts(cursor, timeZone).day > 1) {
    cursor = startOfCivilDay(cursor - 1, timeZone);
  }
  return cursor;
}

/** Início do próximo mês civil (+32 dias garante o mês seguinte; normaliza ao 1º dia). */
function startOfNextCivilMonth(monthStart: number, timeZone: string): number {
  return startOfCivilMonth(monthStart + 32 * 86_400_000, timeZone);
}

// ---------------------------------------------------------------------------
// Bins temporais por escala (FR-005/006)
// ---------------------------------------------------------------------------

export interface TimeBin {
  /** Chave estável para React (não usar índice). */
  key: string;
  /** Rótulo legível (pt-BR): "12/05" (diário) ou "mai/26" (mensal). */
  label: string;
  /** Início do bin (epoch ms, inclusivo). */
  start: number;
  /** Fim do bin (epoch ms, exclusivo). */
  end: number;
}

function dailyLabel(start: number, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone, day: '2-digit', month: '2-digit' }).format(new Date(start));
}

function monthlyLabel(start: number, timeZone: string): string {
  const raw = new Intl.DateTimeFormat('pt-BR', { timeZone, month: 'short', year: '2-digit' }).format(new Date(start));
  // Normaliza "mai. de 26" / "mai./26" → "mai/26".
  return raw.replace(/\.\s*(de\s*)?/i, '/').replace(/\s+/g, '');
}

/**
 * Gera os bins terminando no bin que contém `now`:
 *  - `7d` → 7 bins diários; `30d` → 30 bins diários; `12m` → 12 bins mensais.
 * Bins são contíguos: `bins[i].end === bins[i+1].start`.
 */
export function buildTimeBins(scale: ChartScale, now: number, timeZone: string = PLANT_TIME_ZONE): TimeBin[] {
  if (scale === '12m') {
    const starts: number[] = [];
    let monthStart = startOfCivilMonth(now, timeZone);
    for (let i = 0; i < 12; i += 1) {
      starts.unshift(monthStart);
      monthStart = startOfCivilMonth(monthStart - 1, timeZone);
    }
    return starts.map((start) => ({
      key: `m-${start}`,
      label: monthlyLabel(start, timeZone),
      start,
      end: startOfNextCivilMonth(start, timeZone),
    }));
  }

  const days = scale === '7d' ? 7 : 30;
  const starts: number[] = [];
  let dayStart = startOfCivilDay(now, timeZone);
  for (let i = 0; i < days; i += 1) {
    starts.unshift(dayStart);
    dayStart = startOfCivilDay(dayStart - 1, timeZone);
  }
  return starts.map((start) => ({
    key: `d-${start}`,
    label: dailyLabel(start, timeZone),
    start,
    end: startOfNextCivilDay(start, timeZone),
  }));
}

function findBinIndex(bins: TimeBin[], timestamp: number): number {
  return bins.findIndex((bin) => timestamp >= bin.start && timestamp < bin.end);
}

// ---------------------------------------------------------------------------
// Séries temporais (FR-004)
// ---------------------------------------------------------------------------

export interface ChartTimeSeries {
  scale: ChartScale;
  bins: TimeBin[];
  /** Contagem de itens OK por bin (mesmo índice de `bins`). */
  ok: number[];
  /** Contagem de itens Not Ok por bin. */
  notOk: number[];
}

/**
 * Distribui os itens (OK / Not Ok) nos bins da escala. Itens "outros" não entram em
 * nenhuma série; itens fora da janela visível são descartados.
 */
export function computeTimeSeries(
  items: ChecklistItem[],
  scale: ChartScale,
  now: number,
  itemTimestamp: ItemTimestamp = defaultItemTimestamp,
  timeZone: string = PLANT_TIME_ZONE
): ChartTimeSeries {
  const bins = buildTimeBins(scale, now, timeZone);
  const ok = bins.map(() => 0);
  const notOk = bins.map(() => 0);

  for (const item of items) {
    const result = classifyChartResult(item, now);
    if (result === 'outros') {
      continue;
    }
    const timestamp = itemTimestamp(item);
    if (timestamp === null) {
      continue;
    }
    const index = findBinIndex(bins, timestamp);
    if (index === -1) {
      continue;
    }
    if (result === 'ok') {
      ok[index] += 1;
    } else {
      notOk[index] += 1;
    }
  }

  return { scale, bins, ok, notOk };
}

// ---------------------------------------------------------------------------
// Contagens instantâneas (FR-002)
// ---------------------------------------------------------------------------

export interface InstantCounts {
  ok: number;
  notOk: number;
  outros: number;
  total: number;
}

export function computeInstantCounts(items: ChecklistItem[], now: number): InstantCounts {
  let ok = 0;
  let notOk = 0;
  let outros = 0;
  for (const item of items) {
    const result = classifyChartResult(item, now);
    if (result === 'ok') {
      ok += 1;
    } else if (result === 'not_ok') {
      notOk += 1;
    } else {
      outros += 1;
    }
  }
  return { ok, notOk, outros, total: items.length };
}

// ---------------------------------------------------------------------------
// Seleção / cross-filter (FR-008/012) e drill-down de assets (FR-010)
// ---------------------------------------------------------------------------

export function flattenItems(checklists: Checklist[]): ChecklistItem[] {
  return checklists.flatMap((checklist) => checklist.items);
}

/** `true` quando o item pertence à série e ao intervalo do bin da seleção. */
export function itemMatchesSelection(
  item: ChecklistItem,
  selection: ChartSelection,
  now: number,
  itemTimestamp: ItemTimestamp = defaultItemTimestamp
): boolean {
  if (classifyChartResult(item, now) !== selection.result) {
    return false;
  }
  const timestamp = itemTimestamp(item);
  if (timestamp === null) {
    return false;
  }
  return timestamp >= selection.binStart && timestamp < selection.binEnd;
}

export function itemsForSelection(
  items: ChecklistItem[],
  selection: ChartSelection,
  now: number,
  itemTimestamp: ItemTimestamp = defaultItemTimestamp
): ChecklistItem[] {
  return items.filter((item) => itemMatchesSelection(item, selection, now, itemTimestamp));
}

/** Rondas com ≥1 item na seleção — usado para recortar a tabela (FR-008). */
export function filterChecklistsByChartSelection(
  checklists: Checklist[],
  selection: ChartSelection,
  now: number,
  itemTimestamp: ItemTimestamp = defaultItemTimestamp
): Checklist[] {
  return checklists.filter((checklist) =>
    checklist.items.some((item) => itemMatchesSelection(item, selection, now, itemTimestamp))
  );
}

export interface AssetDrillRow {
  externalId: string;
  title: string;
  count: number;
}

/** Assets distintos dos itens, com contagem; ordenado por contagem desc, depois título. */
export function assetDrillRows(items: ChecklistItem[]): AssetDrillRow[] {
  const byId = new Map<string, AssetDrillRow>();
  for (const item of items) {
    const asset = item.asset;
    const externalId = asset?.externalId ?? '(sem ativo)';
    const title = asset?.title ?? asset?.externalId ?? '(sem ativo)';
    const existing = byId.get(externalId);
    if (existing) {
      existing.count += 1;
    } else {
      byId.set(externalId, { externalId, title, count: 1 });
    }
  }
  return [...byId.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'pt-BR'));
}

// ---------------------------------------------------------------------------
// Orquestrador único do dashboard (espelha o recorte da lista)
// ---------------------------------------------------------------------------

export interface ChartViewResult {
  scale: ChartScale;
  /** Série temporal sobre TODOS os itens filtrados (seleção NÃO aplicada, para re-selecionar). */
  timeSeries: ChartTimeSeries;
  /** Contagens instantâneas sobre os itens efetivos (seleção aplicada quando houver). */
  instant: InstantCounts;
  /** Drill-down de assets da seleção; `[]` quando não há seleção. */
  drillAssets: AssetDrillRow[];
  /** Total de itens no recorte de filtros (antes da seleção). */
  totalFilteredItems: number;
  hasSelection: boolean;
}

/**
 * Aplica o MESMO recorte da lista (`applyFilters` → `applySearch`) e deriva os dados dos
 * gráficos: série temporal (sobre todos os itens filtrados), contagens instantâneas e
 * drill-down (sobre os itens da seleção, quando houver).
 */
export function buildChartData(
  all: Checklist[],
  filters: Filters,
  search: string,
  scale: ChartScale,
  selection: ChartSelection | null,
  now: number,
  itemTimestamp: ItemTimestamp = defaultItemTimestamp,
  timeZone: string = PLANT_TIME_ZONE
): ChartViewResult {
  const filtered = applySearch(applyFilters(all, filters, now), search);
  const allItems = flattenItems(filtered);
  const timeSeries = computeTimeSeries(allItems, scale, now, itemTimestamp, timeZone);
  const effectiveItems = selection ? itemsForSelection(allItems, selection, now, itemTimestamp) : allItems;
  const instant = computeInstantCounts(effectiveItems, now);
  const drillAssets = selection ? assetDrillRows(effectiveItems) : [];

  return {
    scale,
    timeSeries,
    instant,
    drillAssets,
    totalFilteredItems: allItems.length,
    hasSelection: selection !== null,
  };
}
