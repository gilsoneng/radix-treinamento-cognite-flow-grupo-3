/**
 * Superfície pública da feature Dashboard (KPIs + gráficos OK/Not Ok). O shell de DEV 1 monta
 * `<DashboardFeature/>` (filtros + dashboard) no `DashboardSlot`.
 */

export { Dashboard } from './dashboard';
export { DashboardFeature } from './dashboard-feature';
export { KpiCard } from './kpi-card';
export { useDashboardViewModel } from './use-dashboard-view-model';
export type { DashboardViewModel } from './use-dashboard-view-model';
