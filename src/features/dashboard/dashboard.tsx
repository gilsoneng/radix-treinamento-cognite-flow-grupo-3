/**
 * Visão "Dashboard": barra de filtros + KPIs de topo + distribuições (FR-002).
 * Só renderiza a partir do `useDashboardViewModel`. Estados carregando/erro/vazio-bruto são
 * do shell (DEV 1); aqui tratamos só o "vazio por filtro" (nenhuma ronda casou o recorte).
 */

import { IconAlertTriangle, IconCircleCheck, IconClipboardList, IconListCheck } from '@tabler/icons-react';

import { FiltersBar } from '../filters/filters-bar';
import { PRIORITY_LABELS, PRIORITY_ORDER, STATUS_LABELS, STATUS_ORDER } from '../shared/labels';

import { DistributionList } from './distribution-list';
import { KpiCard } from './kpi-card';
import { useDashboardViewModel } from './use-dashboard-view-model';

export function DashboardView() {
  const { checklistKpis, itemKpis, rowCount } = useDashboardViewModel();

  return (
    <div className="flex flex-col gap-4">
      <FiltersBar />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Rondas abertas"
          value={checklistKpis.openCount}
          icon={<IconClipboardList aria-hidden className="size-4" />}
        />
        <KpiCard
          label="Rondas atrasadas"
          value={checklistKpis.overdueCount}
          accent="danger"
          icon={<IconAlertTriangle aria-hidden className="size-4" />}
        />
        <KpiCard
          label="No prazo (SLA)"
          value={`${checklistKpis.slaOnTimePercent}%`}
          accent="success"
          icon={<IconCircleCheck aria-hidden className="size-4" />}
        />
        <KpiCard
          label="Tarefas abertas"
          value={itemKpis.openItems}
          hint={`de ${itemKpis.totalItems} tarefas`}
          accent="info"
          icon={<IconListCheck aria-hidden className="size-4" />}
        />
      </div>

      {rowCount === 0 ? (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Nenhuma ronda corresponde aos filtros atuais. Ajuste os filtros acima.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DistributionList
            title="Por status"
            entries={STATUS_ORDER.map((bucket) => ({ label: STATUS_LABELS[bucket], count: checklistKpis.byStatus[bucket] }))}
          />
          <DistributionList
            title="Por prioridade"
            entries={PRIORITY_ORDER.map((priority) => ({ label: PRIORITY_LABELS[priority], count: checklistKpis.byPriority[priority] }))}
          />
          <DistributionList
            title="Por área"
            entries={checklistKpis.byArea.map((entry) => ({ label: entry.area, count: entry.count }))}
          />
        </div>
      )}
    </div>
  );
}
