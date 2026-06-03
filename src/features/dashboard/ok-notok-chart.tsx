/**
 * Gráfico INSTANTÂNEO de OK vs Not Ok (FR-002/003).
 *
 * Barras horizontais (OK, Not Ok, Outros) com rótulo textual + valor numérico — leitura
 * não depende só de cor (FR-014). "Outros" agrupa os baldes `blocked`/`pendente`/
 * `em_andamento`/`concluido` (Clarification #2), contável e nunca omitido em silêncio.
 *
 * Aura 0.1.7 não tem primitivo de gráfico; usamos markup com tokens da marca (FR-017).
 */

import type { InstantCounts } from '../../domain';

import { CHART_COLORS, CHART_TRACK } from './chart-style';

export interface OkNotOkChartProps {
  counts: InstantCounts;
}

const SERIES: { key: keyof typeof CHART_COLORS; label: string; pick(c: InstantCounts): number }[] = [
  { key: 'ok', label: 'OK', pick: (c) => c.ok },
  { key: 'not_ok', label: 'Not Ok', pick: (c) => c.notOk },
  { key: 'outros', label: 'Outros', pick: (c) => c.outros },
];

export function OkNotOkChart({ counts }: OkNotOkChartProps) {
  const max = Math.max(counts.ok, counts.notOk, counts.outros, 1);

  return (
    <div
      role="img"
      aria-label={`Itens por resultado: ${counts.ok} OK, ${counts.notOk} Not Ok, ${counts.outros} outros (total ${counts.total}).`}
    >
      <ul className="flex flex-col gap-2">
        {SERIES.map(({ key, label, pick }) => {
          const value = pick(counts);
          const pct = Math.round((value / max) * 100);
          return (
            <li key={key} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm text-muted-foreground">{label}</span>
              <span
                className="relative h-5 flex-1 overflow-hidden rounded"
                style={{ backgroundColor: CHART_TRACK }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded"
                  style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[key] }}
                  aria-hidden
                />
              </span>
              <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">{value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
