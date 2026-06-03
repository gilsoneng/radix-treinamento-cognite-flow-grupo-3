/**
 * Drawer de detalhe da ronda (FR-007). Aura não tem Drawer/Sheet; montamos um painel lateral
 * acessível com markup padrão + tokens da marca: `role="dialog"`, `aria-modal`, fecha no Esc
 * e no clique do overlay, e move o foco para o painel ao abrir. Abre/seleção são host-synced
 * (reabrem via reload/link — FR-011). Só renderiza quando aberto.
 */

import { Button } from '@cognite/aura/components';
import { IconX } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';

import { StatusBadge } from '../shared/badges';

import { ChecklistItemRow } from './checklist-item-row';
import { useChecklistDetailViewModel } from './use-checklist-detail-view-model';

export function ChecklistDetailDrawer() {
  const { isOpen, title, statusBucket, assignedToLabel, area, itemRows, close } = useChecklistDetailViewModel();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" aria-hidden onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checklist-detail-title"
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <h2 id="checklist-detail-title" className="truncate text-lg font-semibold text-foreground">
              {title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {statusBucket !== null && <StatusBadge bucket={statusBucket} />}
              <span>Área: {area}</span>
              <span>· Responsável: {assignedToLabel}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Fechar detalhe" onClick={close}>
            <IconX aria-hidden className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Tarefas ({itemRows.length})
          </h3>
          {itemRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esta ronda não tem tarefas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {itemRows.map((row) => (
                <ChecklistItemRow key={row.externalId} row={row} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
