/**
 * API pública da PLATAFORMA (DEV 1) — o que DEV 3 e DEV 4 importam.
 *
 * Mantém um único ponto de entrada estável: os ViewModels dependem destes contratos, não
 * dos caminhos internos. Trocar a implementação interna não quebra os consumidores.
 */

// Host
export { HostAppApiProvider } from './host/host-app-api-provider';
export { useHostAppApi } from './host/use-host-app-api';
export type { HostAppApiContextValue } from './host/host-app-api-context';

// Estado host-synced
export { AppStateProvider } from './state/app-state-provider';
export { useAppState } from './state/use-app-state';
export { DEFAULT_STATE, parseAppState, serializeAppState } from './state/app-state';
export type { ActiveView, AppState } from './state/app-state';
export type { AppStateContextValue } from './state/app-state-context';

// Dados (auto-refresh)
export { useChecklistData } from './data/use-checklist-data';
export {
  ChecklistDataContext,
  defaultChecklistDataDeps,
  REFRESH_INTERVAL_MS,
  CHECKLISTS_QUERY_KEY,
} from './data/checklist-data-context';
export type { ChecklistDataDeps, ChecklistDataSource } from './data/checklist-data-context';

// Shell
export { AppShell } from './shell/app-shell';
