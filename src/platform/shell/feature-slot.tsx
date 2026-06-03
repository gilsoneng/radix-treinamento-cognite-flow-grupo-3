/**
 * Slots onde DEV 3 (Dashboard/KPIs) e DEV 4 (Lista + Detalhe) plugam suas telas.
 *
 * Por enquanto são placeholders que comprovam que a PLATAFORMA está ligada de ponta a
 * ponta: recebem a contagem real de rondas vinda do CDF (via `useChecklistData`). Quando
 * DEV 3/DEV 4 entregarem `<Dashboard/>` e `<ChecklistTable/>`, o shell troca estes slots
 * pelos componentes reais — sem mexer no resto da plataforma (Open/Closed).
 */

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cognite/aura/components';

export interface FeatureSlotProps {
  /** Total de rondas carregadas (após a plataforma buscar do CDF). */
  checklistCount: number;
}

export function DashboardSlot({ checklistCount }: FeatureSlotProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Dashboard de KPIs</CardTitle>
        <CardDescription>Área reservada para a DEV 3 (cards de KPI + barra de filtros/ordenação/busca).</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="nordic" background>
          {checklistCount} rondas carregadas do CDF
        </Badge>
      </CardContent>
    </Card>
  );
}

export function ChecklistListSlot({ checklistCount }: FeatureSlotProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Lista de Checklists</CardTitle>
        <CardDescription>Área reservada para a DEV 4 (tabela de rondas + drawer de detalhe).</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="nordic" background>
          {checklistCount} rondas prontas para listar
        </Badge>
      </CardContent>
    </Card>
  );
}
