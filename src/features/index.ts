/**
 * Superfície pública da frente DEV 4 (lista + detalhe) para o shell de DEV 1.
 *
 * Os componentes usam por padrão os contratos reais publicados em `src/platform` (DEV 1)
 * e `src/domain` (DEV 2). `FeatureDepsProvider` segue exportado para testes e overrides.
 */

export { ChecklistTable } from './checklist-list';
export { ChecklistDetailDrawer } from './checklist-detail';
export { Dashboard } from './dashboard';
export { FeatureDepsProvider } from './feature-deps-provider';
export { DEFAULT_FEATURE_DEPS, useFeatureDeps } from './feature-deps';
export type { FeatureDeps } from './feature-deps';
export type {
  ActiveView,
  AppState,
  AppStateApi,
  ChecklistDataSource,
  Filters,
  Period,
  Priority,
  SortDir,
  SortKey,
  SortState,
  StatusBucket,
} from './contracts';
export { DEFAULT_STATE } from './contracts';
