/**
 * Tabela de Checklists (FR-001/003/010).
 *
 * Componente de apresentação: lê o `useChecklistListViewModel` e renderiza loading/erro/
 * vazio + a tabela. Aura 0.1.7 não expõe um primitivo Table, então usamos `<table>`
 * semântica estilizada com tokens do tema (sem hex cru). Cabeçalhos de Status e Prazo são
 * ordenáveis (escrevem em `setSort`, host-synced).
 */

import { Alert, AlertDescription, Loader } from '@cognite/aura/components';
import { IconArrowDown, IconArrowUp, IconClipboardList } from '@tabler/icons-react';

import type { SortKey, SortState } from '../contracts';

import { ChecklistRow } from './checklist-row';
import { useChecklistListViewModel } from './use-checklist-list-view-model';

export function ChecklistTable() {
  const { rows, isLoading, isError, isEmpty, sort, selectedId, toggleSort, selectRow } = useChecklistListViewModel();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-6 text-muted-foreground" aria-live="polite">
        <Loader size={20} />
        <span>Carregando rondas...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Alert variant="error">
          <AlertDescription>Não foi possível carregar as rondas. Tente atualizar.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
        <IconClipboardList aria-hidden className="size-8" />
        <p className="font-medium text-foreground">Nenhuma ronda no período</p>
        <p className="text-sm">Ajuste os filtros ou o período para ver mais rondas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">
              Título
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Responsável
            </th>
            <SortableHeader label="Status" column="status" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="Prazo" column="prazo" sort={sort} onToggle={toggleSort} />
            <th scope="col" className="px-3 py-2 font-medium">
              Prioridade
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Ativo/Área
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ChecklistRow key={row.id} row={row} selected={row.id === selectedId} onSelect={selectRow} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  column: SortKey;
  sort: SortState;
  onToggle(key: SortKey): void;
}

function SortableHeader({ label, column, sort, onToggle }: SortableHeaderProps) {
  const active = sort.key === column;
  const ariaSort = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={() => onToggle(column)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {active ? (
          sort.dir === 'asc' ? (
            <IconArrowUp aria-hidden className="size-3.5" />
          ) : (
            <IconArrowDown aria-hidden className="size-3.5" />
          )
        ) : null}
      </button>
    </th>
  );
}
