import { describe, expect, it } from 'vitest';

import type { Checklist } from '../types/apm';

import { buildDomainFixtureChecklists } from './__fixtures__/checklists';
import { parseDeadlineEndOfDay } from './deadline';
import { slaOnTimePercent } from './sla';

function makeChecklist(overrides: Partial<Checklist>): Checklist {
  return { ...buildDomainFixtureChecklists()[0], ...overrides };
}

describe(slaOnTimePercent.name, () => {
  it('should return 100 when no concluded checklists', () => {
    const openOnly = [makeChecklist({ status: 'To Do' })];
    expect(slaOnTimePercent(openOnly)).toBe(100);
  });

  it('should return 100 when all concluded on time', () => {
    const endTime = '2026-05-01T12:00:00.000Z';
    const onTime = makeChecklist({
      status: 'Completed',
      endTime,
      lastUpdatedTime: parseDeadlineEndOfDay(endTime) - 1000,
    });
    expect(slaOnTimePercent([onTime])).toBe(100);
  });

  it('should return 0 when all concluded late', () => {
    const endTime = '2020-01-01T12:00:00.000Z';
    const late = makeChecklist({
      status: 'Completed',
      endTime,
      lastUpdatedTime: parseDeadlineEndOfDay(endTime) + 10_000,
    });
    expect(slaOnTimePercent([late])).toBe(0);
  });

  it('should return 50 for mixed on-time and late', () => {
    const endTime = '2020-01-01T12:00:00.000Z';
    const deadlineEnd = parseDeadlineEndOfDay(endTime);
    const onTime = makeChecklist({
      externalId: 'a',
      status: 'Completed',
      endTime,
      lastUpdatedTime: deadlineEnd - 1,
    });
    const late = makeChecklist({
      externalId: 'b',
      status: 'Completed',
      endTime,
      lastUpdatedTime: deadlineEnd + 1,
    });
    expect(slaOnTimePercent([onTime, late])).toBe(50);
  });
});
