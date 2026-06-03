import {
  exportAsset,
  exportCdfUser,
  exportChecklist,
  exportChecklistItem,
  exportException,
  exportMeasurement,
} from './apm-view-properties.mjs';
import {
  buildAssetCdfInstance,
  buildAssetRecord,
  buildChecklistCdfInstance,
  buildChecklistItemCdfInstance,
  buildChecklistItemRecord,
  buildCdfUserInstances,
  buildCdfUsers,
  buildExceptionCdfInstance,
  buildFloorChecklistRecord,
  buildMeasurementCdfInstance,
  buildRandomSourceId,
  buildSourceTimestamps,
  createRng,
  CDF_USER_VIEW_SPACE,
  INSTANCE_SPACE,
  parseCsvFloorSection,
  pickUpdatedByUser,
  registerMeasurement,
  slugify,
  SPREADSHEET_NAME,
  VIEW_SPACE,
  withGroupSuffix,
} from './oec-seed-helpers.mjs';

/**
 * @param {string} floorSlug
 */
function floorChecklistExternalId(floorSlug) {
  return withGroupSuffix(`eq-${floorSlug}`);
}

/**
 * @param {object} floor
 * @param {ReturnType<typeof parseCsvFloorSection>} parsed
 * @param {() => number} rng
 * @param {ReturnType<typeof buildCdfUsers>} cdfUsers
 * @param {Map<string, object>} globalMeasurementCatalog
 */
function buildFloorBundle(floor, parsed, rng, cdfUsers, globalMeasurementCatalog) {
  const supervisor = cdfUsers.find((u) => u.role === 'supervisor');
  const operators = cdfUsers.filter((u) => u.role === 'operator');
  if (!supervisor) {
    throw new Error('Supervisor user missing');
  }

  const createdBy = { space: INSTANCE_SPACE, externalId: supervisor.externalId };
  const floorSlug = slugify(floor.name);
  const checklistExternalId = floorChecklistExternalId(floorSlug);
  const floorCode = floorSlug.replace(/-floor$/i, '').toUpperCase().replace(/-/g, '');
  const checklistSourceId = buildRandomSourceId(rng, `SRC-${floorCode}`);
  const { sourceCreatedTime, sourceUpdatedTime } = buildSourceTimestamps(rng);
  const checklistTitle = `${parsed.routeTitle} — ${floor.name}`;

  let exceptionRef = null;
  /** @type {object | null} */
  let exceptionRecord = null;
  if (floor.exceptions.length > 0) {
    const exceptionExternalId = withGroupSuffix(`exception-${floorSlug}`);
    exceptionRef = { space: INSTANCE_SPACE, externalId: exceptionExternalId };
    exceptionRecord = {
      externalId: exceptionExternalId,
      space: INSTANCE_SPACE,
      title: `Exceptions — ${floor.name}`,
      description: floor.exceptions.join('\n'),
      source: `${floor.name} | ${SPREADSHEET_NAME}`,
    };
  }

  /** @type {object[]} */
  const assets = [];
  /** @type {object[]} */
  const checklistItems = [];
  /** @type {{ space: string; externalId: string }[]} */
  const checklistItemRefs = [];

  for (const group of floor.equipmentGroups) {
    const asset = buildAssetRecord({
      equipment: group.equipment,
      floorName: floor.name,
      externalId: group.externalId,
    });
    assets.push(asset);

    const assetRef = { space: INSTANCE_SPACE, externalId: asset.externalId };

    for (const check of group.checks) {
      const measurementRefs = [];
      const measurementRef = registerMeasurement(globalMeasurementCatalog, check.measurementSpec);
      if (measurementRef) {
        measurementRefs.push(measurementRef);
      }

      const item = buildChecklistItemRecord({
        check,
        equipment: group.equipment,
        floorName: floor.name,
        checklistTitle,
        checklistExternalId,
        assetRef,
        measurementRefs,
        exceptionRef,
        sourceCreatedTime,
        sourceUpdatedTime,
        createdBy,
        updatedBy: pickUpdatedByUser(rng, operators),
        rng,
        globalOrder: check.order,
      });

      checklistItems.push(item);
      checklistItemRefs.push({
        space: INSTANCE_SPACE,
        externalId: item.externalId,
      });
    }
  }

  const checklist = buildFloorChecklistRecord({
    routeTitle: parsed.routeTitle,
    floorName: floor.name,
    externalId: checklistExternalId,
    sourceId: checklistSourceId,
    assetNames: assets.map((a) => a.name),
    checklistItemRefs,
    rng,
    createdBy,
    updatedBy: pickUpdatedByUser(rng, operators),
    operators,
    sourceCreatedTime,
    sourceUpdatedTime,
  });

  return {
    floor: floor.name,
    checklist: exportChecklist(checklist),
    assets: assets.map(exportAsset),
    checklistItems: checklistItems.map(exportChecklistItem),
    exception: exceptionRecord ? exportException(exceptionRecord) : null,
    _instances: {
      assets,
      checklist,
      checklistItems,
      exceptionRecord,
    },
  };
}

/**
 * @param {object} bundle
 */
function stripInternal(bundle) {
  const { _instances, ...rest } = bundle;
  return rest;
}

/**
 * @param {string} csvContent
 * @param {{ floorFilter?: string | null }} [options]
 */
export function buildRouteSeedPayload(csvContent, options = {}) {
  const { floorFilter = null } = options;
  const parsed = parseCsvFloorSection(csvContent, { floorFilter });
  const rng = createRng(20260602);
  const cdfUsers = buildCdfUsers();

  /** @type {Map<string, object>} */
  const globalMeasurementCatalog = new Map();

  const floorBundles = parsed.floors.map((floor) =>
    buildFloorBundle(floor, parsed, rng, cdfUsers, globalMeasurementCatalog)
  );

  const measurements = [...globalMeasurementCatalog.values()].map(exportMeasurement);

  /** @type {object[]} */
  const instances = [...buildCdfUserInstances(cdfUsers)];

  for (const bundle of floorBundles) {
    const { assets, checklist, checklistItems, exceptionRecord } = bundle._instances;
    instances.push(
      ...assets.map((a) => buildAssetCdfInstance(a)),
      ...(exceptionRecord ? [buildExceptionCdfInstance(exceptionRecord)] : []),
      buildChecklistCdfInstance(checklist),
      ...checklistItems.map((i) => buildChecklistItemCdfInstance(i))
    );
  }

  for (const m of measurements) {
    const raw = globalMeasurementCatalog.get(m.externalId);
    if (raw) {
      instances.push(buildMeasurementCdfInstance(raw));
    }
  }

  const floors = floorBundles.map(stripInternal);
  const checklists = floors.map((f) => f.checklist);
  const checklistItems = floors.flatMap((f) => f.checklistItems);
  const assets = floors.flatMap((f) => f.assets);
  const totalItems = checklistItems.length;
  const totalAssets = assets.length;

  const meta = {
    sourceFile: 'A Line OEC Routes 1(Route 1 - Dig IV Diff).csv',
    scope: floorFilter
      ? `${floorFilter} only`
      : 'All floors — 1 Checklist per floor, Assets per equipment, checkbox rows = ChecklistItems',
    generatedAt: new Date().toISOString(),
    parserVersion: '4.1.0-apm-views',
    instanceSpace: INSTANCE_SPACE,
    viewSpace: VIEW_SPACE,
    cdfUserViewSpace: CDF_USER_VIEW_SPACE,
    externalIdSuffix: '_group_3',
    spreadsheetName: SPREADSHEET_NAME,
    dataModel: {
      space: VIEW_SPACE,
      externalId: 'APMAppData',
      version: '13',
    },
    routeTitle: parsed.routeTitle,
    stats: {
      floors: floors.length,
      checklists: floors.length,
      assets: totalAssets,
      checklistItems: totalItems,
      measurements: measurements.length,
      exceptions: floors.filter((f) => f.exception).length,
      cdfUserInstances: cdfUsers.length,
      cdfInstances: instances.length,
    },
  };

  return {
    meta,
    cdfUsers: cdfUsers.map(exportCdfUser),
    checklists,
    ...(checklists.length === 1 ? { checklist: checklists[0] } : {}),
    checklistItems,
    floors,
    assets,
    measurements,
    cdf: {
      description:
        'instances.upsert — all instance nodes in cognite-flows-grupo-3',
      instances,
    },
  };
}
