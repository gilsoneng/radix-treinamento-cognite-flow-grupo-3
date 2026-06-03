import {
  Button,
  buttonVariants,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cognite/aura/components';
import { IconAlertTriangle, IconFilter } from '@tabler/icons-react';

import type { Period } from '../_contracts';

import { SearchBox } from './search-box';
import { SortControl } from './sort-control';
import { useFiltersViewModel } from './use-filters-view-model';

function filterCountLabel(selected: number): string {
  return selected > 0 ? ` (${selected})` : '';
}

function isPeriod(value: string): value is Period {
  return value === '7d' || value === '30d' || value === '90d' || value === 'all';
}

export function FiltersBar() {
  const vm = useFiltersViewModel();
  const { filters } = vm;

  return (
    <section aria-label="Filtros e busca" className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: 'outline' })}>
            <IconFilter aria-hidden className="size-4" />
            Status{filterCountLabel(filters.status.length)}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {vm.statusOptions.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={filters.status.includes(opt.value)}
                onCheckedChange={() => vm.toggleStatusFilter(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant={filters.onlyOverdue ? 'destructive' : 'outline'}
          onClick={() => vm.toggleOnlyOverdue()}
          aria-pressed={filters.onlyOverdue}
        >
          <IconAlertTriangle aria-hidden className="size-4" />
          Somente atrasados
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: 'outline' })}>
            Prioridade{filterCountLabel(filters.priority.length)}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {vm.priorityOptions.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={filters.priority.includes(opt.value)}
                onCheckedChange={() => vm.togglePriorityFilter(opt.value)}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: 'outline' })}>
            Área{filterCountLabel(filters.area.length)}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Área / ativo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {vm.availableAreas.length === 0 ? (
              <DropdownMenuLabel>Nenhuma área disponível</DropdownMenuLabel>
            ) : (
              vm.availableAreas.map((area) => (
                <DropdownMenuCheckboxItem
                  key={area}
                  checked={filters.area.includes(area)}
                  onCheckedChange={() => vm.toggleAreaFilter(area)}
                >
                  {area}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex min-w-[12rem] flex-col gap-1">
          <Label htmlFor="filter-period">Período</Label>
          <Select
            value={filters.period}
            onValueChange={(v) => {
              if (isPeriod(v)) {
                vm.setPeriod(v);
              }
            }}
          >
            <SelectTrigger id="filter-period">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {vm.periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SearchBox key={vm.search} value={vm.search} onCommit={vm.setSearch} />
        <SortControl sort={vm.sort} onSortChange={vm.setSort} />
      </div>
    </section>
  );
}
