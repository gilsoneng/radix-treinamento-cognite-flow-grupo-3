/**
 * Detalhe da ronda selecionada (FR-007/011).
 *
 * Aura 0.1.7 não expõe um primitivo Drawer, então usamos `Dialog` como surface lateral de
 * detalhe (desktop-first). Abre/fecha a partir do estado host-synced (`detailOpen` +
 * `selectedChecklistId`): abrir um link compartilhado reabre o mesmo detalhe. Lista os
 * ChecklistItems já aninhados pelo service, com status, ativo e medições.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@cognite/aura/components';

import { ChecklistItemRow } from './checklist-item-row';
import { useChecklistDetailViewModel } from './use-checklist-detail-view-model';

export function ChecklistDetailDrawer() {
  const { checklist, itemStatusById, isOpen, close } = useChecklistDetailViewModel();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) close();
      }}
    >
      <DialogContent closeButtonLabel="Fechar detalhe">
        {checklist ? (
          <>
            <DialogHeader>
              <DialogTitle>{checklist.title ?? '(sem título)'}</DialogTitle>
              <DialogDescription>
                {checklist.items.length === 1 ? '1 tarefa' : `${checklist.items.length} tarefas`}
              </DialogDescription>
            </DialogHeader>
            {checklist.items.length > 0 ? (
              <ul className="max-h-[60vh] overflow-y-auto">
                {checklist.items.map((item) => (
                  <ChecklistItemRow key={item.externalId} item={item} status={itemStatusById[item.externalId] ?? 'pendente'} />
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">Esta ronda não tem tarefas.</p>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
