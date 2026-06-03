import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { sortChecklists } from './sort';

describe(sortChecklists.name, () => {
  const all = buildDomainFixtureChecklists();
  const now = Date.parse('2020-01-01T00:00:00.000Z');

  it('should sort by prazo ascending with nulls last', () => {
    const sorted = sortChecklists(all, { key: 'prazo', dir: 'asc' }, now);
    const withEnd = sorted.filter((c) => c.endTime !== null);
    expect(withEnd.length).toBeGreaterThan(0);
  });

  it('should sort by status descending', () => {
    const sorted = sortChecklists(all, { key: 'status', dir: 'desc' }, now);
    expect(sorted[0].status).toBe('Completed');
  });

  it('should be stable for equal keys', () => {
    const copy = [...all];
    const sorted = sortChecklists(copy, { key: 'status', dir: 'asc' }, now);
    const sortedAgain = sortChecklists(copy, { key: 'status', dir: 'asc' }, now);
    expect(sorted.map((c) => c.externalId)).toEqual(sortedAgain.map((c) => c.externalId));
  });
});
