import { Alert, AlertDescription, Badge, Loader, Progress } from '@cognite/aura/components';
import { IconAlertTriangle } from '@tabler/icons-react';

import type { Kpis, Priority, StatusBucket } from '../_contracts';

import { KpiCard } from './kpi-card';
import { useDashboardViewModel } from './use-dashboard-view-model';

const STATUS_LABELS: Record<StatusBucket, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  atrasado: 'Atrasado',
  concluido: 'Concluído',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

function hasAnyChecklist(kpis: Kpis): boolean {
  const statusTotal = Object.values(kpis.byStatus).reduce((sum, n) => sum + n, 0);
  return statusTotal > 0 || kpis.openCount > 0 || kpis.overdueCount > 0;
}

function DistributionBadges({
  title,
  entries,
}: {
  title: string;
  entries: { label: string; count: number }[];
}) {
  const nonZero = entries.filter((e) => e.count > 0);
  if (nonZero.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={`dist-${title}`} className="flex flex-col gap-2">
      <h3 id={`dist-${title}`} className="text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {nonZero.map((e) => (
          <li key={e.label}>
            <Badge variant="nordic" background>
              {e.label}: {e.count}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Dashboard() {
  const { isLoading, isError, kpis } = useDashboardViewModel();

  if (isLoading) {
    return (
      <section
        className="flex items-center justify-center gap-3 p-8 text-muted-foreground"
        aria-label="Carregando indicadores"
        aria-live="polite"
      >
        <Loader size={24} />
        <span>Carregando indicadores...</span>
      </section>
    );
  }

  if (isError) {
    return (
      <Alert>
        <AlertDescription>Não foi possível carregar os indicadores. Tente atualizar novamente.</AlertDescription>
      </Alert>
    );
  }

  if (kpis === null || !hasAnyChecklist(kpis)) {
    return (
      <Alert variant="secondary">
        <AlertDescription>Nenhuma ronda no período selecionado. Ajuste os filtros ou aguarde novos dados.</AlertDescription>
      </Alert>
    );
  }

  return (
    <section aria-label="Dashboard de KPIs" className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Abertos" value={kpis.openCount} description="Rondas em aberto ou em andamento" />
        <KpiCard
          title="Atrasados"
          value={kpis.overdueCount}
          variant="overdue"
          emphasisLabel="Requer atenção"
          icon={<IconAlertTriangle aria-hidden className="size-4" />}
          description="Prazo vencido e não concluídas"
        />
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="text-base font-medium">% no prazo (SLA)</h3>
          <p className="text-3xl font-semibold tabular-nums">{kpis.slaOnTimePercent}%</p>
          <Progress value={kpis.slaOnTimePercent} aria-label={`SLA ${kpis.slaOnTimePercent}% no prazo`} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <DistributionBadges
          title="Por status"
          entries={(Object.keys(STATUS_LABELS) as StatusBucket[]).map((key) => ({
            label: STATUS_LABELS[key],
            count: kpis.byStatus[key],
          }))}
        />
        <DistributionBadges
          title="Por prioridade"
          entries={(Object.keys(PRIORITY_LABELS) as Priority[]).map((key) => ({
            label: PRIORITY_LABELS[key],
            count: kpis.byPriority[key],
          }))}
        />
        <DistributionBadges
          title="Por área"
          entries={kpis.byArea.map((a) => ({ label: a.area, count: a.count }))}
        />
      </div>
    </section>
  );
}
