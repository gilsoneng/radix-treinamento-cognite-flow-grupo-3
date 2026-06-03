/**
 * Dashboard de gráficos OK/Not Ok (spec `specs/feature-graficos-ok-notok-drilldown.md`).
 *
 * Compõe (só renderiza — lógica no `useDashboardViewModel`):
 *  - KPIs consolidados dos ITENS (total / OK / Not Ok / outros), que refletem a seleção;
 *  - o gráfico instantâneo OK vs Not Ok (FR-002);
 *  - o gráfico ao longo do tempo com seletor de escala 7d/30d/12m e clique para filtrar (FR-004/005/008);
 *  - o painel de drill-down dos assets da seleção (FR-010).
 *
 * Aura-first + tokens da marca (FR-015). Estados de carregando/erro/vazio sem travar a tela (FR-016).
 */

import { Alert, AlertDescription, AlertTitle, Card, CardContent, CardHeader, CardTitle, Loader } from '@cognite/aura/components';
import { IconAlertTriangle, IconChartBar } from '@tabler/icons-react';

import { AssetDrilldownPanel } from './asset-drilldown-panel';
import { ChartScaleSelector } from './chart-scale-selector';
import { CHART_COLORS, resultLabel } from './chart-style';
import { OkNotOkChart } from './ok-notok-chart';
import { OkNotOkTimelineChart } from './ok-notok-timeline-chart';
import { useDashboardViewModel } from './use-dashboard-view-model';

export function Dashboard() {
  const { isLoading, isError, isEmpty, chart, scale, selection, setScale, selectBin, clearSelection } =
    useDashboardViewModel();

  if (isLoading) {
    return (
      <Card aria-busy="true" aria-live="polite">
        <CardContent>
          <div className="inline-flex items-center gap-3 text-muted-foreground">
            <Loader size={20} />
            <span>Carregando indicadores…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" role="alert">
        <IconAlertTriangle aria-hidden className="size-4" />
        <AlertTitle>Erro ao carregar os indicadores</AlertTitle>
        <AlertDescription>Não foi possível montar os gráficos. Tente atualizar.</AlertDescription>
      </Alert>
    );
  }

  const { instant, timeSeries, drillAssets } = chart;

  return (
    <div className="flex flex-col gap-4">
      {selection ? (
        <p className="text-sm text-muted-foreground" role="status">
          Indicadores e tabela refletem a seleção: <span className="font-medium text-foreground">{resultLabel(selection.result)}</span> em{' '}
          <span className="font-medium text-foreground">{selection.binLabel}</span>.
        </p>
      ) : null}

      <section aria-label="Indicadores de itens" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Itens (total)" value={instant.total} />
        <StatTile label="OK" value={instant.ok} swatch={CHART_COLORS.ok} />
        <StatTile label="Not Ok" value={instant.notOk} swatch={CHART_COLORS.not_ok} />
        <StatTile label="Outros" value={instant.outros} swatch={CHART_COLORS.outros} />
      </section>

      {isEmpty ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <IconChartBar aria-hidden className="size-8" />
              <p className="text-base font-medium text-foreground">Nenhum item no recorte atual</p>
              <p className="text-sm">Ajuste os filtros para ver os indicadores e gráficos.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle as="h2">OK vs Not Ok</CardTitle>
            </CardHeader>
            <CardContent>
              <OkNotOkChart counts={instant} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle as="h2">OK/Not Ok ao longo do tempo</CardTitle>
              <ChartScaleSelector scale={scale} onChange={setScale} />
            </CardHeader>
            <CardContent>
              <OkNotOkTimelineChart series={timeSeries} selection={selection} onSelect={selectBin} />
            </CardContent>
          </Card>
        </div>
      )}

      {selection ? <AssetDrilldownPanel selection={selection} assets={drillAssets} onClear={clearSelection} /> : null}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  swatch?: string;
}

function StatTile({ label, value, swatch }: StatTileProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {swatch ? <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: swatch }} aria-hidden /> : null}
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
