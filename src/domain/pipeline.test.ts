import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { buildChecklistView } from './pipeline';
import { DEFAULT_FILTERS } from './types';

describe(buildChecklistView.name, () => {
  it('should align rows and KPIs on same filtered set', () => {
    const all = buildDomainFixtureChecklists();
    const now = Date.parse('2020-01-01T00:00:00.000Z');
    const view = buildChecklistView(
      all,
      { ...DEFAULT_FILTERS, period: 'all' },
      '7th',
      { key: 'prazo', dir: 'asc' },
      now
    );
    expect(view.rows.length).toBeGreaterThan(0);
    expect(view.checklistKpis.openCount).toBeLessThanOrEqual(view.rows.length);
    expect(view.itemKpis.totalItems).toBe(
      view.rows.reduce((sum, c) => sum + c.items.length, 0)
    );
  });
});
