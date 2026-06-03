/** @typedef {{ space: string; externalId: string }} InstanceRef */

export const INSTANCE_SPACE = 'cognite-flows-grupo-3';
export const VIEW_SPACE = 'APMAppData';
/** View space for CDF_User schema (instances live in INSTANCE_SPACE). */
export const CDF_USER_VIEW_SPACE = 'cognite_app_data';
export const EXTERNAL_ID_SUFFIX = '_group_3';
export const SPREADSHEET_NAME = 'Route 1 - Dig IV Diff';

const FLOOR_PATTERN = /^(?:\d+(?:\.\d+)?(?:st|nd|rd|th)|Ground) Floor$/i;
export const CHECKBOX_ROW_PATTERN = /^;\?\s*;/;

/**
 * @param {string} externalId
 */
export function withGroupSuffix(externalId) {
  return externalId.endsWith(EXTERNAL_ID_SUFFIX)
    ? externalId
    : `${externalId}${EXTERNAL_ID_SUFFIX}`;
}

/**
 * @param {number} seed
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function splitCsvLine(line) {
  return line.split(';').map((cell) => cell.trim());
}

/**
 * @param {() => number} rng
 * @param {Date} from
 * @param {Date} to
 */
export function randomIsoBetween(rng, from, to) {
  const start = from.getTime();
  const end = to.getTime();
  if (end <= start) {
    return new Date(start).toISOString();
  }
  const t = start + Math.floor(rng() * (end - start));
  return new Date(t).toISOString();
}

/**
 * @param {() => number} rng
 */
export function buildSourceTimestamps(rng) {
  const now = new Date('2026-06-02T12:00:00Z');
  const createdFrom = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const sourceCreatedTime = randomIsoBetween(rng, createdFrom, now);
  const createdMs = new Date(sourceCreatedTime).getTime();
  const updatedTo = new Date(createdMs + 5 * 24 * 60 * 60 * 1000);
  const updatedCap = updatedTo.getTime() > now.getTime() ? now : updatedTo;
  const sourceUpdatedTime = randomIsoBetween(
    rng,
    new Date(createdMs + 30 * 60 * 1000),
    updatedCap
  );
  return { sourceCreatedTime, sourceUpdatedTime };
}

/**
 * @param {() => number} rng
 */
export function buildRandomSourceId(rng, prefix) {
  const suffix = String(Math.floor(rng() * 900000) + 100000);
  return `${prefix}-${suffix}`;
}

/**
 * @param {() => number} rng
 * @param {{ name: string }[]} operators
 * @param {number} maxCount
 */
export function pickAssignedToFromUsers(rng, operators, maxCount = 3) {
  const count = 1 + Math.floor(rng() * Math.min(maxCount, operators.length));
  const shuffled = [...operators].sort(() => rng() - 0.5);
  return shuffled.slice(0, count).map((u) => u.name);
}

/**
 * @param {() => number} rng
 * @param {{ name: string }[]} operators
 */
export function pickUpdatedByUser(rng, operators) {
  const user = operators[Math.floor(rng() * operators.length)] ?? operators[0];
  return { space: INSTANCE_SPACE, externalId: user.externalId };
}

/**
 * Column E (index 5); falls back to D (index 4) when E is empty.
 * @param {string[]} cells
 */
export function extractMeasurementSpec(cells) {
  const colD = cells[4] ?? '';
  const colE = cells[5] ?? '';
  const value = colE || colD;
  if (!value) {
    return null;
  }
  return {
    key: `${colD}|${colE}`.replace(/\|$/, ''),
    colD,
    colE,
    display: value,
  };
}

/**
 * @param {string} key
 */
export function measurementExternalIdFromKey(key) {
  return withGroupSuffix(`measurement-${slugify(key)}`);
}

/**
 * @param {() => number} rng
 * @param {string | null} sourceCreatedTime
 * @param {string | null} sourceUpdatedTime
 */
export function buildChecklistItemTimes(rng, sourceCreatedTime, sourceUpdatedTime) {
  const now = new Date('2026-06-02T12:00:00Z');
  const base = sourceCreatedTime ? new Date(sourceCreatedTime) : now;

  const hasStart = rng() > 0.35;
  let startTime = null;
  let endTime = null;

  if (hasStart) {
    startTime = randomIsoBetween(rng, base, now);
    const hasEnd = rng() > 0.55;
    if (hasEnd) {
      const startMs = new Date(startTime).getTime();
      endTime = randomIsoBetween(rng, new Date(startMs + 60 * 60 * 1000), now);
    }
  }

  let status = 'Pending';
  if (endTime) {
    status = 'Completed';
  } else if (startTime) {
    status = 'Ongoing';
  }

  return { startTime, endTime, status };
}

/**
 * @param {object} params
 */
export function buildFloorChecklistRecord(params) {
  const {
    routeTitle,
    floorName,
    externalId,
    sourceId,
    assetNames,
    checklistItemRefs,
    rng,
    createdBy,
    updatedBy,
    operators,
    sourceCreatedTime: providedCreated,
    sourceUpdatedTime: providedUpdated,
  } = params;

  const title = `${routeTitle} — ${floorName}`;
  const timestamps =
    providedCreated && providedUpdated
      ? { sourceCreatedTime: providedCreated, sourceUpdatedTime: providedUpdated }
      : buildSourceTimestamps(rng);
  const { sourceCreatedTime, sourceUpdatedTime } = timestamps;
  const now = new Date('2026-06-02T12:00:00Z');

  const hasStartTime = rng() > 0.4;
  let startTime = null;
  if (hasStartTime) {
    const startFrom = new Date(new Date(sourceCreatedTime).getTime() + 60 * 60 * 1000);
    startTime = randomIsoBetween(rng, startFrom, now);
  }

  return {
    externalId,
    space: INSTANCE_SPACE,
    sourceId,
    source: floorName,
    sourceCreatedTime,
    sourceUpdatedTime,
    title,
    description: title,
    labels: [floorName, ...assetNames],
    startTime,
    endTime: null,
    createdBy,
    updatedBy,
    isArchived: false,
    status: hasStartTime ? 'Ongoing' : 'To Do',
    rootLocation: '',
    assignedTo: pickAssignedToFromUsers(rng, operators),
    solutionTags: [],
    checklistItems: checklistItemRefs,
  };
}

/**
 * @param {object} params
 */
export function buildAssetRecord(params) {
  const { equipment, floorName, externalId } = params;
  return {
    externalId,
    space: INSTANCE_SPACE,
    name: equipment,
    description: `${equipment} on ${floorName}`,
    labels: [floorName, SPREADSHEET_NAME],
  };
}

/**
 * @param {object} params
 */
export function buildChecklistItemRecord(params) {
  const {
    check,
    equipment,
    floorName,
    checklistTitle,
    checklistExternalId,
    assetRef,
    measurementRefs,
    exceptionRef,
    sourceCreatedTime,
    sourceUpdatedTime,
    createdBy,
    updatedBy,
    rng,
    globalOrder,
  } = params;

  const { startTime, endTime, status } = buildChecklistItemTimes(
    rng,
    sourceCreatedTime,
    sourceUpdatedTime
  );

  const description = `${check.title} of ${equipment} for ${floorName}`;
  const source = `${equipment} | ${floorName} | ${SPREADSHEET_NAME}`;

  return {
    externalId: check.externalId,
    space: INSTANCE_SPACE,
    sourceId: `LIN-${check.csvLineNumber}`,
    source,
    sourceCreatedTime,
    sourceUpdatedTime,
    title: check.title,
    description,
    labels: [checklistTitle],
    startTime,
    endTime,
    visibility: 'public',
    createdBy,
    updatedBy,
    isArchived: false,
    status,
    order: globalOrder,
    asset: assetRef,
    note: '',
    files: [],
    measurements: measurementRefs,
    exception: exceptionRef,
    checklistExternalId,
  };
}

/**
 * @param {string} content
 * @param {{ floorFilter?: string | null }} [options]
 */
export function parseCsvFloorSection(content, options = {}) {
  const { floorFilter = null } = options;
  const lines = content.split(/\r?\n/);
  const routeTitle = (lines[1] ?? '').split(';')[0]?.trim() || 'Route';

  let currentFloor = null;
  let currentEquipment = null;
  let equipmentOrder = 0;
  let perEquipmentItemOrder = 0;
  let globalItemOrder = 0;
  let inExceptions = false;
  /** @type {string[]} */
  const exceptionLines = [];
  /** @type {{ name: string; equipmentGroups: object[]; exceptions: string[] }[]} */
  const floors = [];

  const ensureFloor = (name) => {
    let floor = floors.find((f) => f.name === name);
    if (!floor) {
      floor = { name, equipmentGroups: [], exceptions: [] };
      floors.push(floor);
    }
    currentFloor = floor;
    return floor;
  };

  const isBlankLine = (line) => {
    const cells = splitCsvLine(line);
    return cells.every((c) => c === '');
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex] ?? '';
    const lineNumber = lineIndex + 1;
    const firstCell = line.split(';')[0]?.trim() ?? '';

    if (FLOOR_PATTERN.test(firstCell)) {
      inExceptions = false;
      if (floorFilter && firstCell.toLowerCase() !== floorFilter.toLowerCase()) {
        currentFloor = null;
        currentEquipment = null;
        continue;
      }
      currentFloor = ensureFloor(firstCell);
      currentEquipment = null;
      equipmentOrder = 0;
      perEquipmentItemOrder = 0;
      continue;
    }

    if (!currentFloor) {
      continue;
    }

    if (firstCell.toLowerCase().startsWith('exceptions')) {
      inExceptions = true;
      currentEquipment = null;
      const inline = splitCsvLine(line).slice(1).join(' ').trim();
      if (inline && !/^:?$/i.test(inline)) {
        exceptionLines.push(inline);
      }
      continue;
    }

    if (inExceptions) {
      if (isBlankLine(line) || FLOOR_PATTERN.test(firstCell)) {
        inExceptions = false;
        if (exceptionLines.length > 0) {
          currentFloor.exceptions = [...exceptionLines];
        }
        if (FLOOR_PATTERN.test(firstCell)) {
          lineIndex -= 1;
        }
        continue;
      }
      const text = splitCsvLine(line).filter(Boolean).join(' ').trim();
      if (text) {
        exceptionLines.push(text);
      }
      continue;
    }

    const cells = splitCsvLine(line);
    const col1 = cells[1] ?? '';
    const col2 = cells[2] ?? '';

    if (col1 === 'Task Complete' && col2) {
      equipmentOrder += 1;
      perEquipmentItemOrder = 0;
      const assetTag =
        [cells[4], cells[5], cells[6]].find((c) => c && /^\d+$/.test(c)) ?? null;
      const floorSlug = slugify(currentFloor.name);
      const baseExternalId = `asset-${floorSlug}-${slugify(col2)}-${equipmentOrder}`;
      currentEquipment = {
        externalId: withGroupSuffix(baseExternalId),
        floor: currentFloor.name,
        floorSlug,
        equipment: col2,
        assetTag,
        order: equipmentOrder,
        checks: [],
      };
      currentFloor.equipmentGroups.push(currentEquipment);
      continue;
    }

    if (CHECKBOX_ROW_PATTERN.test(line) && currentEquipment && col2) {
      perEquipmentItemOrder += 1;
      globalItemOrder += 1;
      const measurementSpec = extractMeasurementSpec(cells);
      const floorSlug = slugify(currentFloor.name);
      const baseItemId = `eq-${floorSlug}-${slugify(currentEquipment.equipment)}-${currentEquipment.order}-check-${perEquipmentItemOrder}`;

      currentEquipment.checks.push({
        externalId: withGroupSuffix(baseItemId),
        order: globalItemOrder,
        perEquipmentOrder: perEquipmentItemOrder,
        title: col2,
        csvLineNumber: lineNumber,
        measurementSpec,
        assetExternalId: currentEquipment.assetTag,
        area: currentFloor.name,
      });
    }
  }

  if (currentFloor && exceptionLines.length > 0) {
    currentFloor.exceptions = [...exceptionLines];
  }

  return { routeTitle, spreadsheetName: SPREADSHEET_NAME, floors };
}

export function buildCdfUsers() {
  return [
    {
      externalId: withGroupSuffix('cdf-user-supervisor-seed'),
      name: 'Pat Supervisor',
      email: 'pat.supervisor@plant.test',
      role: 'supervisor',
      space: INSTANCE_SPACE,
    },
    {
      externalId: withGroupSuffix('cdf-user-operator-1-seed'),
      name: 'Alex Morgan',
      email: 'alex.morgan@plant.test',
      role: 'operator',
      space: INSTANCE_SPACE,
    },
    {
      externalId: withGroupSuffix('cdf-user-operator-2-seed'),
      name: 'Jordan Lee',
      email: 'jordan.lee@plant.test',
      role: 'operator',
      space: INSTANCE_SPACE,
    },
    {
      externalId: withGroupSuffix('cdf-user-operator-3-seed'),
      name: 'Sam Rivera',
      email: 'sam.rivera@plant.test',
      role: 'operator',
      space: INSTANCE_SPACE,
    },
  ];
}

/**
 * @param {ReturnType<typeof buildCdfUsers>} users
 */
export function buildCdfUserInstances(users) {
  return users.map((user) => ({
    instanceType: 'node',
    space: INSTANCE_SPACE,
    externalId: user.externalId,
    sources: [
      {
        source: {
          type: 'view',
          space: CDF_USER_VIEW_SPACE,
          externalId: 'CDF_User',
          version: 'v1',
        },
        properties: {
          name: user.name,
          email: user.email,
        },
      },
    ],
  }));
}

/**
 * @param {object} asset
 */
export function buildAssetCdfInstance(asset) {
  return {
    instanceType: 'node',
    space: INSTANCE_SPACE,
    externalId: asset.externalId,
    sources: [
      {
        source: {
          type: 'view',
          space: VIEW_SPACE,
          externalId: 'Asset',
          version: '13',
        },
        properties: {
          name: asset.name,
          description: asset.description,
          labels: asset.labels,
        },
      },
    ],
  };
}

/**
 * @param {object} measurement
 */
export function buildMeasurementCdfInstance(measurement) {
  return {
    instanceType: 'node',
    space: INSTANCE_SPACE,
    externalId: measurement.externalId,
    sources: [
      {
        source: {
          type: 'view',
          space: VIEW_SPACE,
          externalId: 'Measurement',
          version: '13',
        },
        properties: {
          name: measurement.name,
          unit: measurement.unit,
          limit: measurement.limit,
        },
      },
    ],
  };
}

/**
 * @param {object} exception
 */
export function buildExceptionCdfInstance(exception) {
  return {
    instanceType: 'node',
    space: INSTANCE_SPACE,
    externalId: exception.externalId,
    sources: [
      {
        source: {
          type: 'view',
          space: VIEW_SPACE,
          externalId: 'Exception',
          version: '13',
        },
        properties: {
          title: exception.title,
          description: exception.description,
          source: exception.source,
        },
      },
    ],
  };
}

/**
 * @param {object} checklist
 */
export function buildChecklistCdfInstance(checklist) {
  return {
    instanceType: 'node',
    space: INSTANCE_SPACE,
    externalId: checklist.externalId,
    sources: [
      {
        source: {
          type: 'view',
          space: VIEW_SPACE,
          externalId: 'Checklist',
          version: '13',
        },
        properties: {
          sourceId: checklist.sourceId,
          source: checklist.source,
          sourceCreatedTime: checklist.sourceCreatedTime,
          sourceUpdatedTime: checklist.sourceUpdatedTime,
          title: checklist.title,
          description: checklist.description,
          labels: checklist.labels,
          startTime: checklist.startTime,
          endTime: checklist.endTime,
          createdBy: checklist.createdBy,
          updatedBy: checklist.updatedBy,
          isArchived: checklist.isArchived,
          status: checklist.status,
          rootLocation: checklist.rootLocation,
          assignedTo: checklist.assignedTo,
          solutionTags: checklist.solutionTags,
          checklistItems: checklist.checklistItems,
        },
      },
    ],
  };
}

/**
 * @param {object} item
 */
export function buildChecklistItemCdfInstance(item) {
  const properties = {
    sourceId: item.sourceId,
    source: item.source,
    sourceCreatedTime: item.sourceCreatedTime,
    sourceUpdatedTime: item.sourceUpdatedTime,
    title: item.title,
    description: item.description,
    labels: item.labels,
    startTime: item.startTime,
    endTime: item.endTime,
    visibility: item.visibility,
    createdBy: item.createdBy,
    updatedBy: item.updatedBy,
    isArchived: item.isArchived,
    status: item.status,
    order: item.order,
    asset: item.asset,
    note: item.note,
    files: item.files,
    measurements: item.measurements,
  };

  if (item.exception) {
    properties.exception = item.exception;
  }

  return {
    instanceType: 'node',
    space: INSTANCE_SPACE,
    externalId: item.externalId,
    sources: [
      {
        source: {
          type: 'view',
          space: VIEW_SPACE,
          externalId: 'ChecklistItem',
          version: '13',
        },
        properties,
      },
    ],
    _relations: {
      checklist: {
        space: INSTANCE_SPACE,
        externalId: item.checklistExternalId,
      },
      ...(item.exception ? { exception: item.exception } : {}),
    },
  };
}

/**
 * @param {Map<string, object>} measurementCatalog
 * @param {ReturnType<typeof extractMeasurementSpec>} spec
 */
export function registerMeasurement(measurementCatalog, spec) {
  if (!spec) {
    return null;
  }
  const externalId = measurementExternalIdFromKey(spec.key);
  if (!measurementCatalog.has(externalId)) {
    const unit = spec.colD && /F|ips/i.test(spec.colD) ? spec.colD.replace('?', '') : null;
    measurementCatalog.set(externalId, {
      externalId,
      space: INSTANCE_SPACE,
      name: spec.display,
      display: spec.display,
      unit,
      limit: spec.colE || null,
      key: spec.key,
    });
  }
  return { space: INSTANCE_SPACE, externalId };
}
