/**
 * Generates 7th Floor example seed JSON.
 * Run: node scripts/generate-7th-floor-example.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRouteSeedPayload } from './lib/build-route-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const csvPath = join(
  repoRoot,
  'references',
  'A Line OEC Routes 1(Route 1 - Dig IV Diff).csv'
);
const outPath = join(repoRoot, 'references', 'apm-app-data-7th-floor-example.json');

const FLOOR = '7th Floor';
const content = readFileSync(csvPath, 'utf8');
const payload = buildRouteSeedPayload(content, { floorFilter: FLOOR });

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(JSON.stringify(payload.meta.stats, null, 2));
