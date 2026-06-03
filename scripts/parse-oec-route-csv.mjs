/**
 * Parses the OEC route CSV into APMAppData-oriented seed JSON.
 * Run: node scripts/parse-oec-route-csv.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const csvPath = join(
  repoRoot,
  'references',
  'A Line OEC Routes 1(Route 1 - Dig IV Diff).csv'
);
const outPath = join(repoRoot, 'references', 'apm-app-data-route-1-seed.json');

const FLOOR_PATTERN = /^(?:\d+(?:\.\d+)?(?:st|nd|rd|th)|Ground) Floor$/i;
const CHECKBOX_ROW_PATTERN = /^;\?\s*;/;

function splitCsvLine(line) {
  return line.split(';').map((cell) => cell.trim());
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseResponseType(cells) {
  const unitOrLabel = cells[4] ?? '';
  const threshold = cells[5] ?? '';

  if (/OK\s*\/\s*Not OK/i.test(unitOrLabel)) {
    return { kind: 'ok_not_ok', label: 'OK / Not OK' };
  }
  if (/Yes\s*\/\s*No/i.test(unitOrLabel)) {
    return { kind: 'yes_no', label: 'Yes / No' };
  }
  if (/\?F|°F|\bF\b/i.test(unitOrLabel)) {
    return {
      kind: 'temperature',
      unit: 'F',
      label: unitOrLabel,
      threshold: threshold || null,
    };
  }
  if (/ips/i.test(unitOrLabel)) {
    return { kind: 'vibration', unit: 'ips', label: 'ips' };
  }
  if (unitOrLabel) {
    return { kind: 'text', label: unitOrLabel, threshold: threshold || null };
  }
  return { kind: 'unknown', label: null };
}

function parseDateFromHeader(lines) {
  for (const line of lines.slice(0, 10)) {
    const match = line.match(/Date:;\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (match) {
      const [day, month, year] = match[1].split('/');
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/);
  const routeTitle = (lines[1] ?? '').split(';')[0]?.trim() || 'Route';
  const routeDescription = (lines[0] ?? '').split(';')[0]?.trim() || '';
  const nightNotes = (lines[2] ?? '').split(';')[0]?.trim() || '';
  const startDate = parseDateFromHeader(lines);

  let currentFloor = null;
  let currentEquipment = null;
  let equipmentOrder = 0;
  let itemOrder = 0;
  const floors = [];

  const ensureFloor = (name) => {
    let floor = floors.find((f) => f.name === name);
    if (!floor) {
      floor = {
        name,
        externalId: `checklist-route-one-${slugify(name)}`,
        equipmentGroups: [],
      };
      floors.push(floor);
    }
    currentFloor = floor;
    return floor;
  };

  for (const line of lines) {
    const firstCell = line.split(';')[0]?.trim() ?? '';
    if (FLOOR_PATTERN.test(firstCell)) {
      currentFloor = ensureFloor(firstCell);
      currentEquipment = null;
      equipmentOrder = 0;
      itemOrder = 0;
      continue;
    }

    if (!currentFloor) {
      continue;
    }

    const cells = splitCsvLine(line);
    const col1 = cells[1] ?? '';
    const col2 = cells[2] ?? '';

    if (col1 === 'Task Complete' && col2) {
      equipmentOrder += 1;
      itemOrder = 0;
      const assetTag =
        [cells[4], cells[5], cells[6]].find((c) => c && /^\d+$/.test(c)) ?? null;
      const equipmentExternalId = `eq-${slugify(currentFloor.name)}-${slugify(col2)}-${equipmentOrder}`;
      currentEquipment = {
        externalId: equipmentExternalId,
        floor: currentFloor.name,
        equipment: col2,
        assetTag,
        order: equipmentOrder,
        checks: [],
      };
      currentFloor.equipmentGroups.push(currentEquipment);
      continue;
    }

    if (CHECKBOX_ROW_PATTERN.test(line) && currentEquipment && col2) {
      itemOrder += 1;
      const responseType = parseResponseType(cells);
      const check = {
        externalId: `${currentEquipment.externalId}-check-${itemOrder}`,
        order: itemOrder,
        title: col2,
        status: 'pending',
        responseType,
        assetExternalId: currentEquipment.assetTag,
        area: currentFloor.name,
      };
      if (responseType.kind === 'temperature' && cells[5]) {
        check.threshold = cells[5];
        check.measurement = {
          unit: 'F',
          limit: cells[5],
          value: null,
        };
      }
      currentEquipment.checks.push(check);
    }
  }

  const checklistItems = [];
  let globalOrder = 0;

  for (const floor of floors) {
    for (const group of floor.equipmentGroups) {
      for (const check of group.checks) {
        globalOrder += 1;
        checklistItems.push({
          ...check,
          order: globalOrder,
          equipment: group.equipment,
          equipmentExternalId: group.externalId,
          checklistExternalId: floor.externalId,
        });
      }
    }
  }

  return {
    routeTitle,
    routeDescription,
    nightNotes,
    startDate,
    floors,
    checklistItems,
  };
}

function toViewReference(viewExternalId) {
  return {
    type: 'view',
    space: 'APMAppData',
    externalId: viewExternalId,
    version: '13',
  };
}

function buildChecklistInstance(floor, meta) {
  return {
    instanceType: 'node',
    space: 'APMAppData',
    externalId: floor.externalId,
    sources: [
      {
        source: toViewReference('Checklist'),
        properties: {
          title: `${meta.routeTitle} — ${floor.name}`,
          description: [meta.routeDescription, meta.nightNotes].filter(Boolean).join(' — '),
          templateExternalId: meta.templateExternalId,
          rootLocation: meta.rootLocation,
          assignedTo: null,
          startTime: meta.startDate ? `${meta.startDate}T00:00:00Z` : null,
          endTime: null,
          status: 'open',
        },
      },
    ],
  };
}

function buildChecklistItemInstance(item, meta) {
  const properties = {
    title: item.title,
    order: item.order,
    status: item.status,
    assetExternalId: item.assetExternalId,
  };

  if (item.measurement) {
    properties.measurement = item.measurement;
  }

  return {
    instanceType: 'node',
    space: 'APMAppData',
    externalId: item.externalId,
    sources: [
      {
        source: toViewReference('ChecklistItem'),
        properties,
      },
    ],
    _relations: {
      checklist: {
        space: 'APMAppData',
        externalId: item.checklistExternalId,
      },
    },
    _csvMetadata: {
      area: item.area,
      equipment: item.equipment,
      equipmentExternalId: item.equipmentExternalId,
      responseType: item.responseType,
      threshold: item.threshold ?? null,
    },
  };
}

function main() {
  const content = readFileSync(csvPath, 'utf8');
  const parsed = parseCsv(content);

  const templateExternalId = 'template-route-one-iv-kamyr-digester-diffuser';
  const rootLocation = 'A Line';
  const meta = {
    sourceFile: 'A Line OEC Routes 1(Route 1 - Dig IV Diff).csv',
    generatedAt: new Date().toISOString(),
    parserVersion: '2.0.0',
    dataModel: {
      space: 'APMAppData',
      externalId: 'APMAppData',
      version: '13',
    },
    interpretation: {
      checklistPerSheet:
        'CSV export has one physical sheet; each floor section (7th Floor, 6th Floor, …) is mapped to one Checklist (logical “planilha”).',
      checklistItemPerRow:
        'Each row starting with ";? ;" is one ChecklistItem (checkbox task).',
    },
    routeTitle: parsed.routeTitle,
    routeDescription: parsed.routeDescription,
    templateExternalId,
    rootLocation,
    startDate: parsed.startDate,
    stats: {
      checklists: parsed.floors.length,
      equipmentGroups: parsed.floors.reduce((n, f) => n + f.equipmentGroups.length, 0),
      checklistItems: parsed.checklistItems.length,
      distinctAssetTags: [
        ...new Set(
          parsed.checklistItems
            .map((i) => i.assetExternalId)
            .filter((id) => id !== null && id !== undefined)
        ),
      ],
    },
    schemaNotes: {
      confirmedInRepo: ['title', 'description', 'status', 'assignedTo', 'startTime/endTime', 'rootLocation', 'templateExternalId', 'order', 'assetExternalId'],
      needsProjectConfirmation: [
        'Exact Checklist status enum values (open / in_progress / completed / …)',
        'Exact ChecklistItem status enum (pending / OK / Not OK / Blocked)',
        'Property name for checklist→item edge (e.g. checklist vs parentChecklist)',
        'Whether endTime or dueDate is the SLA deadline field',
        'Whether priority exists on Checklist or must be derived',
        'Measurement as embedded object vs separate Measurement instances',
        'instance space: APMAppData vs yourRootLocation_app_data',
      ],
    },
  };

  const checklists = parsed.floors.map((floor) => ({
    externalId: floor.externalId,
    title: `${parsed.routeTitle} — ${floor.name}`,
    description: [parsed.routeDescription, parsed.nightNotes].filter(Boolean).join(' — '),
    templateExternalId,
    rootLocation,
    assignedTo: null,
    startTime: parsed.startDate ? `${parsed.startDate}T00:00:00Z` : null,
    endTime: null,
    status: 'open',
    priority: null,
    floor: floor.name,
  }));

  const instances = [
    ...parsed.floors.map((floor) => buildChecklistInstance(floor, meta)),
    ...parsed.checklistItems.map((item) => buildChecklistItemInstance(item, meta)),
  ];

  const payload = {
    meta,
    template: {
      externalId: templateExternalId,
      title: parsed.routeTitle,
      description: parsed.routeDescription,
      rootLocation,
    },
    checklists,
    checklistItems: parsed.checklistItems,
    floors: parsed.floors,
    cdf: {
      description:
        'Shape for instances.upsert — verify property names and edge types against APMAppData v13 in your project before writing.',
      instances,
    },
  };

  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(
    `Checklists: ${meta.stats.checklists}, Items: ${meta.stats.checklistItems}, Instances: ${instances.length}`
  );
}

main();
