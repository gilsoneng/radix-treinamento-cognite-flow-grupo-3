import { describe, expect, it } from 'vitest';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { derivePriority } from './priority';

describe(derivePriority.name, () => {
  it('should return alta for overdue checklist', () => {
    const [first] = buildDomainFixtureChecklists();
    const overdue = {
      ...first,
      status: 'To Do',
      endTime: '2020-01-01T12:00:00.000Z',
      labels: [],
      rootLocation: first.rootLocation
        ? { ...first.rootLocation, labels: [] }
        : null,
    };
    const now = Date.parse('2030-01-01T00:00:00.000Z');
    expect(derivePriority(overdue, now)).toBe('alta');
  });

  it('should return media when OEC label present and not overdue', () => {
    const [first] = buildDomainFixtureChecklists();
    const now = Date.parse('2020-01-01T00:00:00.000Z');
    expect(derivePriority(first, now)).toBe('media');
  });

  it('should return baixa without critical labels and not overdue', () => {
    const [, second] = buildDomainFixtureChecklists();
    const now = Date.parse('2020-01-01T00:00:00.000Z');
    expect(derivePriority(second, now)).toBe('baixa');
  });
});
