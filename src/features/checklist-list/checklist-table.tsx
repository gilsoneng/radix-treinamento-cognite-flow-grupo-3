/**
 * Tabela de rondas (FR-003/004/005/010). Aura não tem componente de tabela; usamos `<table>`
 * nativo (semântico/acessível) estilizado com tokens da marca. Cabeçalhos de Status e Prazo
 * são ordenáveis (com `aria-sort`); o título abre o detalhe; linhas atrasadas têm destaque
 * visual COM badge de texto+ícone — nunca só cor.
 */

import type { ReactNode } from 'react';

import type { SortKey } from '../../domain';
import { PriorityBadge, StatusBadge } from '../shared/badges';

import { useChecklistListViewModel } from './use-checklist-list-view-model';
import type { ChecklistRowView } from './use-checklist-list-view-model';

function SortableHeader({
  label,
  columnKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  columnKey: SortKey;
  activeKey: SortKey;
  dir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === columnKey;
  const ariaSort = isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className="px-3 py-2 text-left font-medium">
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <span aria-hidden className="text-xs">
          {isActive ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 align-middle">{children}</td>;
}

function ChecklistTableRow({ row, onSelect }: { row: ChecklistRowView; onSelect: (id: string) => void }) {
  return (
    <tr
      className={`border-t ${row.isOverdue ? 'bg-[var(--warning-muted-background)]' : 'hover:bg-muted/50'} ${
        row.isSelected ? 'bg-[var(--decorative-nordic-background)]' : ''
      }`}
    >
      <Cell>
        <button
          type="button"
          onClick={() => onSelect(row.externalId)}
          className="text-left font-medium text-[var(--link-foreground)] hover:underline"
        >
          {row.title}
        </button>
      </Cell>
      <Cell>{row.assignedToLabel}</Cell>
      <Cell>
        <StatusBadge bucket={row.statusBucket} />
      </Cell>
      <Cell>{row.deadlineLabel}</Cell>
      <Cell>
        <PriorityBadge priority={row.priority} />
      </Cell>
      <Cell>{row.area}</Cell>
    </tr>
  );
}

export function ChecklistTable() {
  const { rows, sort, toggleSort, selectChecklist } = useChecklistListViewModel();

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Lista de rondas (Checklists)</caption>
        <thead className="text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Título
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Responsável
            </th>
            <SortableHeader label="Status" columnKey="status" activeKey={sort.key} dir={sort.dir} onSort={toggleSort} />
            <SortableHeader label="Prazo" columnKey="prazo" activeKey={sort.key} dir={sort.dir} onSort={toggleSort} />
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Prioridade
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Área
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                Nenhuma ronda corresponde aos filtros atuais.
              </td>
            </tr>
          ) : (
            rows.map((row) => <ChecklistTableRow key={row.externalId} row={row} onSelect={selectChecklist} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
