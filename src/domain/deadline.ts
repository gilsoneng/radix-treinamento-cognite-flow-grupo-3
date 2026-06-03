/**
 * Prazo da ronda = `Checklist.endTime`. Ainda no prazo no instante exato de `endTime`;
 * atrasado somente após o último ms do dia civil em `America/Sao_Paulo`.
 */

/** Fuso da planta (pt-BR) até haver configuração no app. */
export const PLANT_TIME_ZONE = 'America/Sao_Paulo';

function getYmdInZone(epochMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epochMs));
}

/** Último ms do dia civil de `instant` no fuso informado. */
function endOfCivilDayForInstant(instant: number, timeZone: string): number {
  const ymd = getYmdInZone(instant, timeZone);
  let lo = instant;
  let hi = instant + 4 * 86_400_000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (getYmdInZone(mid, timeZone) === ymd) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo - 1;
}

/**
 * Epoch ms do fim do dia civil do `endTime` (ISO) na planta.
 * Retorna `NaN` se `endTime` não for parseável.
 */
export function parseDeadlineEndOfDay(endTime: string): number {
  const instant = Date.parse(endTime);
  if (Number.isNaN(instant)) {
    return Number.NaN;
  }
  return endOfCivilDayForInstant(instant, PLANT_TIME_ZONE);
}

/** `true` quando `now` é estritamente depois do fim do dia civil do prazo. */
export function isPastDeadline(endTime: string | null, now: number): boolean {
  if (endTime === null || endTime === '') {
    return false;
  }
  const deadlineEnd = parseDeadlineEndOfDay(endTime);
  if (Number.isNaN(deadlineEnd)) {
    return false;
  }
  return now > deadlineEnd;
}

export function getPlantTimeZone(): string {
  return PLANT_TIME_ZONE;
}
