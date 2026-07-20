/**
 * Force re-run of specific contaminated adversarial indexes.
 * Usage: npx tsx scripts/audit-adversarial-e2e-rerun-indexes.mts 6,23,30,40,52
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.aidev-audit-reports');
const mainLedger = join(REPORT_DIR, 'adversarial-e2e-generation-audit-v1-ledger.jsonl');
const repairLedger = join(REPORT_DIR, 'adversarial-e2e-generation-audit-v1-repair-ledger.jsonl');

const indexes = (process.argv[2] ?? '')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value));

if (indexes.length === 0) {
  console.error('Provide indexes, e.g. 6,23,30');
  process.exit(1);
}

interface Row {
  index: number;
  id: string;
  succeeded: boolean;
  [key: string]: unknown;
}

const prior = readFileSync(mainLedger, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Row);

writeFileSync(repairLedger, '', 'utf8');
for (const index of indexes) {
  console.log(`\n=== Re-running index ${index} ===`);
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsx', 'scripts/audit-adversarial-e2e-generation-v1.mts', String(index), '1'],
    {
      cwd: ROOT,
      env: { ...process.env, AUDIT_LEDGER: repairLedger, AUDIT_SKIP_CONTAMINATION: '1' },
      encoding: 'utf8',
      shell: true,
    },
  );
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
}

const repairs = existsSync(repairLedger)
  ? readFileSync(repairLedger, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Row)
  : [];

const byIndex = new Map<number, Row>();
for (const row of prior) byIndex.set(row.index, row);
for (const row of repairs) byIndex.set(row.index, row);
const merged = [...byIndex.values()].sort((a, b) => a.index - b.index);
writeFileSync(mainLedger, `${merged.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
console.log(
  JSON.stringify(
    {
      repaired: repairs.map((row) => ({ index: row.index, id: row.id, succeeded: row.succeeded })),
      successTotal: merged.filter((row) => row.succeeded).length,
      total: merged.length,
    },
    null,
    2,
  ),
);
process.exit(merged.every((row) => row.succeeded) ? 0 : 1);
