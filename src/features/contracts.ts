/**
 * Compatibility barrel for the shared contracts published by DEV 1 and DEV 2.
 *
 * DEV 4 no longer owns or duplicates these types. Keep this file only as a stable import
 * point for the checklist feature and tests; the source of truth is `src/platform` for
 * host-synced state/data and `src/domain` for product semantics.
 */

export { DEFAULT_STATE } from '../platform/state/app-state';
export type {
  ActiveView,
  AppState,
} from '../platform/state/app-state';
export type { AppStateContextValue as AppStateApi } from '../platform/state/app-state-context';
export type { ChecklistDataSource } from '../platform/data/checklist-data-context';
export type {
  Filters,
  Period,
  Priority,
  Sort as SortState,
  SortDir,
  SortKey,
  StatusBucket,
} from '../domain';
