/**
 * Contrato da store de estado host-synced exposto aos ViewModels (DEV 3/DEV 4).
 *
 * Getter (`state`) + setters SEMÂNTICOS — nunca um `setState` cru. Cada setter encapsula
 * "computa o próximo estado + espelha no host", de modo que os consumidores não conheçam
 * `syncInternalState` (encapsulamento / SRP). `null` = fora do provider.
 */

import { createContext } from 'react';

import type { ChartScale, ChartSelection } from '../../domain/chart-types';
import type { Filters, Sort } from '../../domain/types';

import type { ActiveView, AppState } from './app-state';

export interface AppStateContextValue {
  state: AppState;
  setActiveView(view: ActiveView): void;
  setFilters(filters: Filters): void;
  setSort(sort: Sort): void;
  setSearch(search: string): void;
  /** Seleciona uma ronda e abre o detalhe (FR-007). */
  selectChecklist(id: string): void;
  /** Fecha o detalhe mantendo a seleção (para o link compartilhado continuar coerente). */
  closeDetail(): void;
  /** Troca a escala do gráfico temporal; limpa a seleção (os bins mudam de granularidade). */
  setChartScale(scale: ChartScale): void;
  /** Aplica a seleção do gráfico (cross-filter, FR-008). */
  selectChartBin(selection: ChartSelection): void;
  /** Limpa a seleção do gráfico mantendo a escala (FR-011). */
  clearChartSelection(): void;
}

export const AppStateContext = createContext<AppStateContextValue | null>(null);
