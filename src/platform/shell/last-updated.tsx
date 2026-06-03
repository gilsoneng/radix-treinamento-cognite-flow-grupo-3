/**
 * Indicador "última atualização" + botão de refresh manual (FR-008).
 * Componente PURO de apresentação: recebe tudo por props (o estado vem do `useChecklistData`
 * no shell). A formatação do horário vive em `format-last-updated.ts` (testável sem render).
 */

import { Button } from '@cognite/aura/components';
import { IconClock, IconRefresh } from '@tabler/icons-react';

import { formatLastUpdatedLabel } from './format-last-updated';

export interface LastUpdatedProps {
  lastUpdatedAt: number | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function LastUpdated({ lastUpdatedAt, isRefreshing, onRefresh }: LastUpdatedProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
        <IconClock aria-hidden className="size-4" />
        {formatLastUpdatedLabel(lastUpdatedAt)}
      </span>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
        <IconRefresh aria-hidden className={isRefreshing ? 'size-4 animate-spin' : 'size-4'} />
        {isRefreshing ? 'Atualizando…' : 'Atualizar'}
      </Button>
    </div>
  );
}
