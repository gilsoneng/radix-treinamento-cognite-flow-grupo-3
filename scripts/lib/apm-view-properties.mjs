/**
 * Allowed APMAppData v13 view properties for seed JSON / instances.upsert.
 * Dev-only fields (equipment, measurementSpec, etc.) are stripped on export.
 */

/** @type {readonly string[]} */
export const CHECKLIST_PROPERTIES = [
  'sourceId',
  'source',
  'sourceCreatedTime',
  'sourceUpdatedTime',
  'title',
  'description',
  'labels',
  'startTime',
  'endTime',
  'createdBy',
  'updatedBy',
  'isArchived',
  'status',
  'rootLocation',
  'assignedTo',
  'solutionTags',
  'checklistItems',
];

/** @type {readonly string[]} */
export const CHECKLIST_ITEM_PROPERTIES = [
  'sourceId',
  'source',
  'sourceCreatedTime',
  'sourceUpdatedTime',
  'title',
  'description',
  'labels',
  'startTime',
  'endTime',
  'visibility',
  'createdBy',
  'updatedBy',
  'isArchived',
  'status',
  'order',
  'asset',
  'note',
  'files',
  'measurements',
  'exception',
];

/** @type {readonly string[]} */
export const ASSET_PROPERTIES = ['name', 'description', 'labels'];

/** @type {readonly string[]} */
export const MEASUREMENT_PROPERTIES = ['name', 'unit', 'limit'];

/** @type {readonly string[]} */
export const EXCEPTION_PROPERTIES = ['title', 'description', 'source'];

/** @type {readonly string[]} */
export const CDF_USER_PROPERTIES = ['name', 'email'];

/**
 * @param {readonly string[]} allowed
 * @param {Record<string, unknown>} obj
 */
export function pickProperties(allowed, obj) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of allowed) {
    if (key in obj && obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
}

/**
 * @param {object} checklist
 */
export function exportChecklist(checklist) {
  return {
    externalId: checklist.externalId,
    space: checklist.space,
    ...pickProperties(CHECKLIST_PROPERTIES, checklist),
  };
}

/**
 * @param {object} item
 */
export function exportChecklistItem(item) {
  return {
    externalId: item.externalId,
    space: item.space,
    ...pickProperties(CHECKLIST_ITEM_PROPERTIES, item),
  };
}

/**
 * @param {object} asset
 */
export function exportAsset(asset) {
  return {
    externalId: asset.externalId,
    space: asset.space,
    ...pickProperties(ASSET_PROPERTIES, asset),
  };
}

/**
 * @param {object} measurement
 */
export function exportMeasurement(measurement) {
  return {
    externalId: measurement.externalId,
    space: measurement.space,
    ...pickProperties(MEASUREMENT_PROPERTIES, measurement),
  };
}

/**
 * @param {object} exception
 */
export function exportException(exception) {
  return {
    externalId: exception.externalId,
    space: exception.space,
    ...pickProperties(EXCEPTION_PROPERTIES, exception),
  };
}

/**
 * @param {object} user
 */
export function exportCdfUser(user) {
  return {
    externalId: user.externalId,
    space: user.space,
    ...pickProperties(CDF_USER_PROPERTIES, user),
  };
}
