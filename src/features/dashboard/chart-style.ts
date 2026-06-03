/**
 * Cores e rótulos compartilhados pelos gráficos (instantâneo + temporal + drill-down).
 *
 * Cores vêm dos tokens de gráfico da marca (`brand-theme.css`, derivados de `specs/design.md`)
 * — nunca hex cru em componente. OK → verde IP; Not Ok → âmbar; outros → neutro. A distinção
 * NUNCA depende só de cor: todo uso vem pareado com texto/rótulo (acessibilidade, FR-014).
 */

import type { ChartResult } from '../../domain';

export const CHART_COLORS = {
  ok: 'var(--chart-nordic-solid)',
  not_ok: 'var(--chart-orange-solid)',
  outros: 'var(--mountain-400)',
} as const;

/** Cor de trilho/fundo das barras (cinza claro do tema). */
export const CHART_TRACK = 'var(--accent-background-strong)';

/** Rótulo legível de uma série clicável. */
export function resultLabel(result: ChartResult): string {
  return result === 'ok' ? 'OK' : 'Not Ok';
}
