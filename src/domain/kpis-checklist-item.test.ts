import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { computeChecklistItemKpis } from './kpis-checklist-item';

describe(computeChecklistItemKpis.name, () => {
  it('should aggregate items across checklists', () => {
    const all = buildDomainFixtureChecklists();
    const now = Date.parse('2020-01-01T00:00:00.000Z');
    const kpis = computeChecklistItemKpis(all, now);
    expect(kpis.totalItems).toBe(3);
    expect(kpis.totalItems).toBe(
      Object.values(kpis.byItemStatus).reduce((sum, n) => sum + n, 0)
    );
  });

  it('should count fewer items when one checklist is excluded', () => {
    const all = buildDomainFixtureChecklists();
    const now = Date.parse('2020-01-01T00:00:00.000Z');
    const one = [all[0]];
    const kpis = computeChecklistItemKpis(one, now);
    expect(kpis.totalItems).toBe(2);
  });
});
