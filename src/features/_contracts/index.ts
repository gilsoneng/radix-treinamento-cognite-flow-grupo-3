/**
 * Barrel for DEV 3 contract stubs.
 * TODO(DEV1/DEV2): re-export from src/platform and src/domain instead.
 */

export type {
  StatusBucket,
  Priority,
  SortKey,
  SortDir,
  Period,
  Filters,
  Kpis,
} from './domain';

export {
  applyFilters,
  applySearch,
  computeKpis,
  sortChecklists,
} from './domain';

export type {
  ActiveView,
  AppState,
  ChecklistDataSource,
  AppStateActions,
} from './platform';

export { DEFAULT_STATE, useAppState, useChecklistData } from './platform';
