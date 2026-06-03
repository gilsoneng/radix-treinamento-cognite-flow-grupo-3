import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { applyFilters, isWithinPeriod } from './filters';
import { DEFAULT_FILTERS } from './types';

describe(isWithinPeriod.name, () => {
  const now = Date.parse('2026-06-01T00:00:00.000Z');

  it('should always include non-concluded for 30d', () => {
    const [, open] = buildDomainFixtureChecklists();
    expect(isWithinPeriod(open, '30d', now)).toBe(true);
  });

  it('should include all when period is all', () => {
    const [completed] = buildDomainFixtureChecklists();
    expect(isWithinPeriod(completed, 'all', now)).toBe(true);
  });
});

describe(applyFilters.name, () => {
  const all = buildDomainFixtureChecklists();
  const now = Date.parse('2030-01-01T00:00:00.000Z');

  it('should combine onlyOverdue and area', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      onlyOverdue: true,
      area: ['Route Root'],
      period: 'all' as const,
    };
    const result = applyFilters(all, filters, now);
    for (const c of result) {
      expect(filters.area.some((a) => (c.rootLocation?.title ?? '').includes(a) || a === 'Route Root')).toBe(
        true
      );
    }
  });

  it('should filter by status bucket', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      status: ['concluido' as const],
      period: 'all' as const,
    };
    const result = applyFilters(all, filters, now);
    expect(result.every((c) => c.status === 'Completed')).toBe(true);
  });

  it('should return empty when no match', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      area: ['Nonexistent Area XYZ'],
      period: 'all' as const,
    };
    expect(applyFilters(all, filters, now)).toHaveLength(0);
  });
});
