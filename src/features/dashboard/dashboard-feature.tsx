/**
 * Composição raiz da visão Dashboard (DEV 3): filtros + KPIs.
 * Montada pelo shell em `shell-content.tsx`.
 */

import { FiltersBar } from '../filters/filters-bar';

import { Dashboard } from './dashboard';

export function DashboardFeature() {
  return (
    <div className="flex flex-col gap-6">
      <FiltersBar />
      <Dashboard />
    </div>
  );
}
