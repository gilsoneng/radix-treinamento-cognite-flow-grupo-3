import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { applySearch } from './search';

describe(applySearch.name, () => {
  const all = buildDomainFixtureChecklists();

  it('should return all for empty query', () => {
    expect(applySearch(all, '')).toHaveLength(all.length);
    expect(applySearch(all, '   ')).toHaveLength(all.length);
  });

  it('should match title case-insensitively', () => {
    expect(applySearch(all, 'ground')).toHaveLength(1);
    expect(applySearch(all, '7TH')).toHaveLength(1);
  });

  it('should match asset area text', () => {
    const result = applySearch(all, 'diffuser');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
