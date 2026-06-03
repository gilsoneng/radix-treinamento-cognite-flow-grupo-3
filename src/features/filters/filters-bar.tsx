/**
 * Barra de filtros/busca/ordenação (FR-006/010/014). Só renderiza; a lógica está no
 * `useFiltersViewModel`. Filtros são host-synced → refletem em KPIs (DEV 3) e lista (DEV 4).
 *
 * Aura primeiro (Button, Input); para os seletores de escolha única usamos `SelectField`
 * (nativo, estilizado com tokens da marca). Multi-seleção (status/prioridade) e "só
 * atrasados" são chips Aura com `aria-pressed` — estado nunca comunicado só por cor.
 */

import { Button, Input } from '@cognite/aura/components';
import { IconAlertTriangle, IconArrowsSort, IconFilterOff, IconSearch } from '@tabler/icons-react';

import type { SortKey } from '../../domain';
import { asMember } from '../shared/as-member';
import {
  PERIOD_LABELS,
  PERIOD_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
} from '../shared/labels';
import { SelectField } from '../shared/select-field';

import { useFiltersViewModel } from './use-filters-view-model';

const SORT_KEY_OPTIONS = [
  { value: 'prazo', label: 'Prazo' },
  { value: 'status', label: 'Status' },
];

export function FiltersBar() {
  const vm = useFiltersViewModel();

  return (
    <section aria-label="Filtros" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        {STATUS_ORDER.map((bucket) => {
          const active = vm.filters.status.includes(bucket);
          return (
            <Button
              key={bucket}
              variant={active ? 'default' : 'outline'}
              size="sm"
              aria-pressed={active}
              onClick={() => vm.toggleStatus(bucket)}
            >
              {STATUS_LABELS[bucket]}
            </Button>
          );
        })}
        <Button
          variant={vm.filters.onlyOverdue ? 'default' : 'outline'}
          size="sm"
          aria-pressed={vm.filters.onlyOverdue}
          onClick={vm.toggleOnlyOverdue}
        >
          <IconAlertTriangle aria-hidden className="size-4" />
          Somente atrasados
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Prioridade:</span>
        {PRIORITY_ORDER.map((priority) => {
          const active = vm.filters.priority.includes(priority);
          return (
            <Button
              key={priority}
              variant={active ? 'default' : 'outline'}
              size="sm"
              aria-pressed={active}
              onClick={() => vm.togglePriority(priority)}
            >
              {PRIORITY_LABELS[priority]}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <SelectField
          label="Período"
          value={vm.filters.period}
          options={PERIOD_ORDER.map((period) => ({ value: period, label: PERIOD_LABELS[period] }))}
          onChange={(value) => {
            const period = asMember(value, PERIOD_ORDER);
            if (period !== null) vm.setPeriod(period);
          }}
        />

        <SelectField
          label="Área"
          value={vm.filters.area[0] ?? ''}
          options={[{ value: '', label: 'Todas as áreas' }, ...vm.availableAreas.map((a) => ({ value: a, label: a }))]}
          onChange={(value) => vm.setArea(value === '' ? null : value)}
        />

        <div className="flex items-end gap-2">
          <SelectField
            label="Ordenar por"
            value={vm.sort.key}
            options={SORT_KEY_OPTIONS}
            icon={<IconArrowsSort aria-hidden className="size-4" />}
            onChange={(value) => {
              const key = asMember<SortKey>(value, ['prazo', 'status']);
              if (key !== null) vm.setSort({ key, dir: vm.sort.dir });
            }}
          />
          <Button
            variant="outline"
            size="sm"
            aria-label={vm.sort.dir === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
            onClick={() => vm.setSort({ key: vm.sort.key, dir: vm.sort.dir === 'asc' ? 'desc' : 'asc' })}
          >
            {vm.sort.dir === 'asc' ? 'Crescente ↑' : 'Decrescente ↓'}
          </Button>
        </div>

        <label className="inline-flex flex-1 items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <IconSearch aria-hidden className="size-4" />
            Busca
          </span>
          <Input
            aria-label="Buscar por título, ativo ou responsável"
            placeholder="Buscar ronda, ativo, responsável…"
            value={vm.search}
            onChange={(event) => vm.setSearch(event.target.value)}
            className="min-w-48 flex-1"
          />
        </label>

        {vm.activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={vm.clearFilters}>
            <IconFilterOff aria-hidden className="size-4" />
            Limpar ({vm.activeFilterCount})
          </Button>
        )}
      </div>
    </section>
  );
}
