/**
 * Dashboard consolidado das rondas de chão de fábrica.
 *
 * Compõe (só renderiza — lógica no `useDashboardViewModel`):
 *  - KPIs das RONDAS (abertos / atrasados / SLA) e distribuições por status, prioridade e área;
 *  - KPIs das TAREFAS (itens) das rondas;
 *  - os indicadores OK/Not Ok dos itens (que refletem a seleção);
 *  - o gráfico instantâneo OK vs Not Ok (FR-002);
 *  - o gráfico ao longo do tempo com seletor de escala 7d/30d/12m e clique para filtrar (FR-004/005/008);
 *  - o painel de drill-down dos assets da seleção (FR-010).
 *
 * Tudo respeita os filtros vigentes e a seleção de gráfico (cross-filter, FR-008/012).
 * Aura-first + tokens da marca (FR-015). Estados de carregando/erro/vazio sem travar a tela (FR-016).
 */

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loader,
  Progress,
} from '@cognite/aura/components';
import { IconAlertTriangle, IconChartBar, IconClipboardList } from '@tabler/icons-react';

import type { ChecklistKpis, Priority, StatusBucket } from '../../domain';
import {
  CHECKLIST_STATUS_PRESENTATION,
  ITEM_STATUS_PRESENTATION,
  PRIORITY_PRESENTATION,
  isItemStatusBucket,
  type StatusBadgeVariant,
} from '../presentation/badge-presentations';

import { AssetDrilldownPanel } from './asset-drilldown-panel';
import { ChartScaleSelector } from './chart-scale-selector';
import { CHART_COLORS, resultLabel } from './chart-style';
import { KpiCard } from './kpi-card';
import { OkNotOkChart } from './ok-notok-chart';
import { OkNotOkTimelineChart } from './ok-notok-timeline-chart';
import { useDashboardViewModel } from './use-dashboard-view-model';

type DistributionVariant = StatusBadgeVariant | 'nordic';

interface DistributionEntry {
  label: string;
  count: number;
  variant: DistributionVariant;
}

function hasAnyChecklist(kpis: ChecklistKpis): boolean {
  const statusTotal = Object.values(kpis.byStatus).reduce((sum, n) => sum + n, 0);
  return statusTotal > 0 || kpis.openCount > 0 || kpis.overdueCount > 0;
}

function DistributionBadges({ title, entries }: { title: string; entries: DistributionEntry[] }) {
  const nonZero = entries.filter((e) => e.count > 0);
  if (nonZero.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={`dist-${title}`} className="flex flex-col gap-2">
      <h3 id={`dist-${title}`} className="text-sm text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {nonZero.map((e) => (
          <li key={e.label}>
            <Badge variant={e.variant} background>
              {e.label}: {e.count}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
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

export function Dashboard() {
  const { isLoading, isError, isEmpty, checklistKpis, itemKpis, chart, scale, selection, setScale, selectBin, clearSelection } =
    useDashboardViewModel();

  if (isLoading) {
    return (
      <Card aria-busy="true" aria-live="polite">
        <CardContent>
          <div className="inline-flex items-center gap-3 text-muted-foreground" aria-label="Carregando indicadores">
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
        <AlertDescription>Não foi possível montar os indicadores e gráficos. Tente atualizar.</AlertDescription>
      </Alert>
    );
  }

  const { instant, timeSeries, drillAssets } = chart;

  return (
    <section aria-label="Dashboard de KPIs" className="flex flex-col gap-8">
      {selection ? (
        <p className="text-sm text-muted-foreground" role="status">
          Indicadores e tabela refletem a seleção: <span className="font-medium text-foreground">{resultLabel(selection.result)}</span> em{' '}
          <span className="font-medium text-foreground">{selection.binLabel}</span>.
        </p>
      ) : null}

      {checklistKpis !== null && hasAnyChecklist(checklistKpis) ? (
        <div>
          <h2 className="mb-4 text-lg">Rondas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard title="Abertos" value={checklistKpis.openCount} description="Rondas em aberto ou em andamento" />
            <KpiCard
              title="Atrasados"
              value={checklistKpis.overdueCount}
              variant="overdue"
              emphasisLabel="Requer atenção"
              icon={<IconAlertTriangle aria-hidden className="size-4" />}
              description="Prazo vencido e não concluídas"
            />
            <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
              <h3>% no prazo (SLA)</h3>
              <p className="text-3xl tabular-nums">{checklistKpis.slaOnTimePercent}%</p>
              <Progress
                value={checklistKpis.slaOnTimePercent}
                aria-label={`SLA ${checklistKpis.slaOnTimePercent}% no prazo`}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <DistributionBadges
              title="Por status"
              entries={(Object.keys(CHECKLIST_STATUS_PRESENTATION) as StatusBucket[]).map((key) => ({
                label: CHECKLIST_STATUS_PRESENTATION[key].label,
                count: checklistKpis.byStatus[key],
                variant: CHECKLIST_STATUS_PRESENTATION[key].variant,
              }))}
            />
            <DistributionBadges
              title="Por prioridade"
              entries={(Object.keys(PRIORITY_PRESENTATION) as Priority[]).map((key) => ({
                label: PRIORITY_PRESENTATION[key].label,
                count: checklistKpis.byPriority[key],
                variant: PRIORITY_PRESENTATION[key].variant,
              }))}
            />
            <DistributionBadges
              title="Por área"
              entries={checklistKpis.byArea.map((a) => ({ label: a.area, count: a.count, variant: 'nordic' as const }))}
            />
          </div>
        </div>
      ) : (
        <Alert variant="secondary">
          <AlertDescription>Nenhuma ronda no recorte atual. Ajuste os filtros ou aguarde novos dados.</AlertDescription>
        </Alert>
      )}

      {itemKpis !== null && itemKpis.totalItems > 0 ? (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg">
            <IconClipboardList aria-hidden className="size-5" />
            Tarefas das rondas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total de tarefas" value={itemKpis.totalItems} />
            <KpiCard title="Tarefas abertas" value={itemKpis.openItems} />
            <KpiCard
              title="Tarefas atrasadas"
              value={itemKpis.overdueItems}
              variant="overdue"
              emphasisLabel="Atenção"
              icon={<IconAlertTriangle aria-hidden className="size-4" />}
            />
          </div>
          <div className="mt-4">
            <DistributionBadges
              title="Por status da tarefa"
              entries={Object.entries(itemKpis.byItemStatus).map(([key, count]) => {
                const presentation = isItemStatusBucket(key) ? ITEM_STATUS_PRESENTATION[key] : null;
                return {
                  label: presentation?.label ?? key,
                  count,
                  variant: presentation?.variant ?? 'gray',
                };
              })}
            />
          </div>
        </div>
      ) : null}

      <section aria-label="Qualidade das rondas (OK/Not Ok)" className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg">
          <IconChartBar aria-hidden className="size-5" />
          Qualidade (OK / Not Ok)
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Itens (total)" value={instant.total} />
          <StatTile label="OK" value={instant.ok} swatch={CHART_COLORS.ok} />
          <StatTile label="Not Ok" value={instant.notOk} swatch={CHART_COLORS.not_ok} />
          <StatTile label="Outros" value={instant.outros} swatch={CHART_COLORS.outros} />
        </div>

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
                <CardTitle as="h3">OK vs Not Ok</CardTitle>
              </CardHeader>
              <CardContent>
                <OkNotOkChart counts={instant} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle as="h3">OK/Not Ok ao longo do tempo</CardTitle>
                <ChartScaleSelector scale={scale} onChange={setScale} />
              </CardHeader>
              <CardContent>
                <OkNotOkTimelineChart series={timeSeries} selection={selection} onSelect={selectBin} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {selection ? <AssetDrilldownPanel selection={selection} assets={drillAssets} onClear={clearSelection} /> : null}
    </section>
  );
}
