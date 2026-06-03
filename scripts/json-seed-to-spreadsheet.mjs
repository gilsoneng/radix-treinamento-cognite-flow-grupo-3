/**
 * Exports apm-app-data-route-1-seed.json to a multi-sheet Excel workbook.
 * Run: node scripts/json-seed-to-spreadsheet.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const jsonPath = join(repoRoot, 'references', 'apm-app-data-route-1-seed.json');
const xlsxPath = join(repoRoot, 'references', 'apm-app-data-route-1-seed.xlsx');

/**
 * @param {unknown} value
 */
function serializeCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

/**
 * @param {Record<string, unknown>} row
 */
function flattenRow(row) {
  /** @type {Record<string, string | number | boolean>} */
  const flat = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      flat[key] = '';
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        flat[key] = '';
        continue;
      }
      if (typeof value[0] === 'object' && value[0] !== null) {
        flat[`${key}_refs`] = value
          .map((v) => {
            if (typeof v === 'object' && v !== null && 'externalId' in v) {
              return String(v.externalId);
            }
            return serializeCell(v);
          })
          .join('; ');
      } else {
        flat[key] = value.map(String).join('; ');
      }
      continue;
    }

    if (typeof value === 'object') {
      if ('space' in value && 'externalId' in value) {
        flat[`${key}_space`] = String(value.space);
        flat[`${key}_externalId`] = String(value.externalId);
      } else {
        flat[key] = JSON.stringify(value);
      }
      continue;
    }

    flat[key] = value;
  }

  return flat;
}

/**
 * @param {object[]} rows
 */
function rowsToSheet(rows) {
  if (rows.length === 0) {
    return XLSX.utils.aoa_to_sheet([['(empty)']]);
  }
  const flatRows = rows.map((row) => flattenRow(row));
  return XLSX.utils.json_to_sheet(flatRows);
}

/**
 * @param {object} payload
 */
function buildChecklistItemRows(payload) {
  /** @type {Map<string, string>} */
  const titleToChecklistId = new Map();
  for (const checklist of payload.checklists) {
    titleToChecklistId.set(checklist.title, checklist.externalId);
  }

  return payload.checklistItems.map((item) => {
    const checklistTitle = Array.isArray(item.labels) ? item.labels[0] : '';
    const floorFromSource =
      typeof item.source === 'string'
        ? item.source.split('|').map((s) => s.trim())[1] ?? ''
        : '';

    return {
      ...item,
      floor: floorFromSource,
      checklistExternalId: titleToChecklistId.get(checklistTitle) ?? '',
      equipmentFromSource:
        typeof item.source === 'string' ? item.source.split('|')[0]?.trim() : '',
    };
  });
}

/**
 * @param {object} payload
 */
function buildFloorsSummary(payload) {
  return payload.floors.map((f) => ({
    floor: f.floor,
    checklistExternalId: f.checklist.externalId,
    checklistTitle: f.checklist.title,
    checklistStatus: f.checklist.status,
    assetCount: f.assets.length,
    checklistItemCount: f.checklistItems.length,
    hasException: f.exception !== null,
  }));
}

/**
 * @param {object} meta
 */
function metaToRows(meta) {
  const rows = [
    { field: 'sourceFile', value: meta.sourceFile },
    { field: 'scope', value: meta.scope },
    { field: 'generatedAt', value: meta.generatedAt },
    { field: 'parserVersion', value: meta.parserVersion },
    { field: 'instanceSpace', value: meta.instanceSpace },
    { field: 'routeTitle', value: meta.routeTitle },
  ];
  for (const [key, value] of Object.entries(meta.stats ?? {})) {
    rows.push({ field: `stats.${key}`, value: String(value) });
  }
  return rows;
}

function main() {
  const payload = JSON.parse(readFileSync(jsonPath, 'utf8'));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(metaToRows(payload.meta)),
    'Meta'
  );
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(payload.checklists), 'Checklists');
  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(buildChecklistItemRows(payload)),
    'ChecklistItems'
  );
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(payload.assets), 'Assets');
  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(payload.measurements),
    'Measurements'
  );
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(payload.cdfUsers), 'CDF_Users');
  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(buildFloorsSummary(payload)),
    'Floors_Summary'
  );

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  writeFileSync(xlsxPath, buffer);

  console.log(`Wrote ${xlsxPath}`);
  console.log(
    `Sheets: Meta, Checklists (${payload.checklists.length}), ChecklistItems (${payload.checklistItems.length}), Assets (${payload.assets.length}), Measurements (${payload.measurements.length}), CDF_Users (${payload.cdfUsers.length}), Floors_Summary (${payload.floors.length})`
  );
}

main();
