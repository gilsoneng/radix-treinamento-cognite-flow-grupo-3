/**
 * Área de conteúdo do shell: decide entre carregando / erro / vazio / conteúdo (FR-012).
 * Componente PURO de apresentação (recebe flags por props); o wiring com os hooks fica no
 * `AppShell`. Mantém a regra de acessibilidade: estados sempre com texto + ícone, não só cor.
 */

import { Alert, AlertDescription, AlertTitle, Card, CardContent, Loader } from '@cognite/aura/components';
import { IconAlertTriangle, IconInbox } from '@tabler/icons-react';

import type { ActiveView } from '../state/app-state';


import { ChecklistListSlot, DashboardSlot } from './feature-slot';
import { toErrorMessage } from './to-error-message';

export interface ShellContentProps {
  activeView: ActiveView;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  checklistCount: number;
}

export function ShellContent({ activeView, isLoading, isError, error, checklistCount }: ShellContentProps) {
  if (isLoading) {
    return (
      <Card aria-busy="true" aria-live="polite">
        <CardContent>
          <div className="inline-flex items-center gap-3 text-muted-foreground">
            <Loader size={20} />
            <span>Carregando rondas do CDF…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" role="alert">
        <IconAlertTriangle aria-hidden className="size-4" />
        <AlertTitle>Erro ao carregar as rondas</AlertTitle>
        <AlertDescription>{toErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  if (checklistCount === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <IconInbox aria-hidden className="size-8" />
            <p className="text-base font-medium text-foreground">Nenhuma ronda no período</p>
            <p className="text-sm">Ajuste os filtros de período ou aguarde a próxima atualização.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return activeView === 'dashboard' ? <DashboardSlot /> : <ChecklistListSlot checklistCount={checklistCount} />;
}
