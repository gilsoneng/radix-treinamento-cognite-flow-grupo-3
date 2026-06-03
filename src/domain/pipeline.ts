import type { Checklist } from '../types/apm';

import { applyFilters } from './filters';
import { computeChecklistKpis } from './kpis-checklist';
import { computeChecklistItemKpis } from './kpis-checklist-item';
import { applySearch } from './search';
import { sortChecklists } from './sort';
import type { ChecklistItemKpis, ChecklistKpis, Filters, SortDir, SortKey } from './types';

export interface ChecklistViewResult {
  rows: Checklist[];
  checklistKpis: ChecklistKpis;
  itemKpis: ChecklistItemKpis;
}

/**
 * Pipeline único: período/filtros → busca → ordenação → KPIs (lista e itens).
 * Garante que DEV 3 e DEV 4 usam o mesmo recorte (FR-006).
 */
export function buildChecklistView(
  all: Checklist[],
  filters: Filters,
  search: string,
  sort: { key: SortKey; dir: SortDir },
  now: number
): ChecklistViewResult {
  const filtered = applyFilters(all, filters, now);
  const searched = applySearch(filtered, search);
  const rows = sortChecklists(searched, sort, now);
  return {
    rows,
    checklistKpis: computeChecklistKpis(rows, now),
    itemKpis: computeChecklistItemKpis(rows, now),
  };
}
