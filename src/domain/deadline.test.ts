import { describe, expect, it } from 'vitest';

import { isPastDeadline, parseDeadlineEndOfDay, PLANT_TIME_ZONE } from './deadline';

describe(parseDeadlineEndOfDay.name, () => {
  it('should return end of civil day in plant timezone for ISO endTime', () => {
    const end = parseDeadlineEndOfDay('2026-05-01T12:00:00.000Z');
    expect(Number.isNaN(end)).toBe(false);
    expect(isPastDeadline('2026-05-01T12:00:00.000Z', end)).toBe(false);
    expect(isPastDeadline('2026-05-01T12:00:00.000Z', end + 1)).toBe(true);
  });

  it('should treat exact endTime instant as still on time', () => {
    const instant = Date.parse('2026-05-01T15:30:00.000Z');
    expect(isPastDeadline('2026-05-01T15:30:00.000Z', instant)).toBe(false);
  });

  it('should return false for null endTime', () => {
    expect(isPastDeadline(null, Date.now())).toBe(false);
  });

  it('should use America/Sao_Paulo', () => {
    expect(PLANT_TIME_ZONE).toBe('America/Sao_Paulo');
  });
});
