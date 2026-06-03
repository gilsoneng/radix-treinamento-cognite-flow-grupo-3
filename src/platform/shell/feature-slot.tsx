/**
 * Slots onde DEV 3 (Dashboard) e DEV 4 (Lista + Detalhe) plugam suas telas.
 *
 * O `DashboardSlot` monta a feature `<DashboardFeature/>` (barra de filtros + KPIs + gráficos
 * OK/Not Ok + drill-down). O `ChecklistListSlot` monta a tabela + o drawer de detalhe. Ambas as
 * features obtêm seus contratos via `FeatureDepsContext` (default = implementações reais), então
 * o shell não precisa injetar nada em produção (Open/Closed).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components';

import { ChecklistDetailDrawer, ChecklistTable } from '../../features';
import { DashboardFeature } from '../../features/dashboard/dashboard-feature';

export interface FeatureSlotProps {
  /** Total de rondas carregadas (após a plataforma buscar do CDF). */
  checklistCount: number;
}

export function DashboardSlot() {
  return <DashboardFeature />;
}

export function ChecklistListSlot({ checklistCount }: FeatureSlotProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Lista de Checklists</CardTitle>
        <CardDescription>{checklistCount} rondas carregadas do CDF.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChecklistTable />
        <ChecklistDetailDrawer />
      </CardContent>
    </Card>
  );
}
