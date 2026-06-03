import { Alert, AlertDescription, Badge, Loader, Progress } from '@cognite/aura/components';
import { IconAlertTriangle, IconClipboardList } from '@tabler/icons-react';

import type { ChecklistKpis, Priority, StatusBucket } from '../../domain';

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

function hasAnyChecklist(kpis: ChecklistKpis): boolean {
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
      <h3 id={`dist-${title}`} className="text-sm text-muted-foreground">
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
  const { isLoading, isError, checklistKpis, itemKpis } = useDashboardViewModel();

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

  if (checklistKpis === null || !hasAnyChecklist(checklistKpis)) {
    return (
      <Alert variant="secondary">
        <AlertDescription>Nenhuma ronda no recorte atual. Ajuste os filtros ou aguarde novos dados.</AlertDescription>
      </Alert>
    );
  }

  return (
    <section aria-label="Dashboard de KPIs" className="flex flex-col gap-8">
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
            entries={(Object.keys(STATUS_LABELS) as StatusBucket[]).map((key) => ({
              label: STATUS_LABELS[key],
              count: checklistKpis.byStatus[key],
            }))}
          />
          <DistributionBadges
            title="Por prioridade"
            entries={(Object.keys(PRIORITY_LABELS) as Priority[]).map((key) => ({
              label: PRIORITY_LABELS[key],
              count: checklistKpis.byPriority[key],
            }))}
          />
          <DistributionBadges
            title="Por área"
            entries={checklistKpis.byArea.map((a) => ({ label: a.area, count: a.count }))}
          />
        </div>
      </div>

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
              entries={Object.entries(itemKpis.byItemStatus).map(([label, count]) => ({ label, count }))}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
