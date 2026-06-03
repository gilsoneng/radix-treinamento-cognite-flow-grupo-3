import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { applyFilters } from './filters';
import { computeChecklistKpis } from './kpis-checklist';
import { DEFAULT_FILTERS } from './types';

describe(computeChecklistKpis.name, () => {
  const all = buildDomainFixtureChecklists();
  const now = Date.parse('2020-01-01T00:00:00.000Z');

  it('should count open and status buckets from fixture list', () => {
    const kpis = computeChecklistKpis(all, now);
    expect(kpis.openCount).toBeGreaterThan(0);
    expect(kpis.byStatus.concluido).toBe(1);
    expect(kpis.byStatus.aberto).toBe(1);
  });

  it('should reflect only filtered subset', () => {
    const filtered = applyFilters(all, { ...DEFAULT_FILTERS, area: ['Route Root'] }, now);
    const kpisAll = computeChecklistKpis(all, now);
    const kpisFiltered = computeChecklistKpis(filtered, now);
    expect(filtered.length).toBeLessThan(all.length);
    expect(kpisFiltered.byArea.length).toBeLessThanOrEqual(kpisAll.byArea.length);
    expect(kpisFiltered.openCount).toBeLessThanOrEqual(kpisAll.openCount);
  });
});
