/**
 * Gráfico de OK/Not Ok AO LONGO DO TEMPO (FR-004/005/006/008).
 *
 * Barras agrupadas (OK + Not Ok) por bin temporal. Clicar (ou Enter/Espaço) numa barra
 * emite a seleção (x = bin, y = série) → cross-filter da tela (FR-008). A barra selecionada
 * é realçada com contorno + `aria-pressed` (não só cor, FR-014). Cada barra é um elemento
 * focável com rótulo textual e `<title>`.
 *
 * Aura 0.1.7 não tem primitivo de gráfico; renderizamos SVG com tokens da marca (FR-017).
 */

import type { KeyboardEvent } from 'react';

import type { ChartResult, ChartSelection, ChartTimeSeries, TimeBin } from '../../domain';

import { CHART_COLORS, resultLabel } from './chart-style';

export interface OkNotOkTimelineChartProps {
  series: ChartTimeSeries;
  selection: ChartSelection | null;
  onSelect(bin: TimeBin, result: ChartResult): void;
}

// Geometria do SVG (coordenadas internas; escala para 100% da largura via CSS).
const TOP = 8;
const PLOT_HEIGHT = 130;
const LABEL_BAND = 28;
const PAD_X = 4;
const BAR_WIDTH = 9;
const BAR_GAP = 2;
const GROUP_GAP = 10;
const GROUP_WIDTH = BAR_WIDTH * 2 + BAR_GAP;
const STEP = GROUP_WIDTH + GROUP_GAP;
const BASELINE = TOP + PLOT_HEIGHT;

const RESULTS: ChartResult[] = ['ok', 'not_ok'];

export function OkNotOkTimelineChart({ series, selection, onSelect }: OkNotOkTimelineChartProps) {
  const { bins, ok, notOk } = series;
  const maxValue = Math.max(1, ...ok, ...notOk);
  const totalPlotted = ok.reduce((a, b) => a + b, 0) + notOk.reduce((a, b) => a + b, 0);
  const width = PAD_X * 2 + bins.length * STEP;
  const height = BASELINE + LABEL_BAND;
  const labelEvery = bins.length <= 12 ? 1 : bins.length <= 14 ? 2 : 5;

  const valueFor = (result: ChartResult, index: number): number => (result === 'ok' ? ok[index] : notOk[index]);

  const isSelected = (bin: TimeBin, result: ChartResult): boolean =>
    selection !== null && selection.result === result && selection.binStart === bin.start;

  return (
    <div>
      <Legend />
      <svg
        role="group"
        aria-label="Itens OK e Not Ok ao longo do tempo. Clique numa barra para filtrar a tela."
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: 'auto' }}
      >
        <line x1={PAD_X} y1={BASELINE} x2={width - PAD_X} y2={BASELINE} stroke="var(--chart-gridlines)" strokeWidth={1} />

        {totalPlotted === 0 ? (
          <text x={width / 2} y={TOP + PLOT_HEIGHT / 2} textAnchor="middle" className="fill-muted-foreground" fontSize={12}>
            Sem itens OK/Not Ok no período
          </text>
        ) : null}

        {bins.map((bin, index) => {
          const groupX = PAD_X + index * STEP;
          const showLabel = index % labelEvery === 0 || index === bins.length - 1;
          return (
            <g key={bin.key}>
              {RESULTS.map((result, r) => {
                const value = valueFor(result, index);
                const barX = groupX + r * (BAR_WIDTH + BAR_GAP);
                if (value === 0) {
                  return null;
                }
                const h = Math.max(2, Math.round((value / maxValue) * PLOT_HEIGHT));
                const selected = isSelected(bin, result);
                const label = `${resultLabel(result)} em ${bin.label}: ${value} ${value === 1 ? 'item' : 'itens'}. Clique para filtrar a tela.`;
                const handleKey = (event: KeyboardEvent<SVGRectElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(bin, result);
                  }
                };
                return (
                  <rect
                    key={result}
                    role="button"
                    tabIndex={0}
                    aria-label={label}
                    aria-pressed={selected}
                    x={barX}
                    y={BASELINE - h}
                    width={BAR_WIDTH}
                    height={h}
                    rx={1.5}
                    fill={CHART_COLORS[result]}
                    stroke={selected ? 'var(--foreground)' : 'transparent'}
                    strokeWidth={selected ? 2 : 0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelect(bin, result)}
                    onKeyDown={handleKey}
                  >
                    <title>{label}</title>
                  </rect>
                );
              })}
              {showLabel ? (
                <text
                  x={groupX + GROUP_WIDTH / 2}
                  y={BASELINE + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={10}
                >
                  {bin.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend() {
  return (
    <ul className="mb-2 flex items-center gap-4 text-xs text-muted-foreground" aria-hidden>
      {RESULTS.map((result) => (
        <li key={result} className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[result] }} />
          {resultLabel(result)}
        </li>
      ))}
    </ul>
  );
}
