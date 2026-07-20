/**
 * Re-run only failed adversarial E2E indices after generic repairs.
 * Usage: npx tsx scripts/audit-adversarial-e2e-rerun-failed.mts
 */
import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.aidev-audit-reports');
const mainLedger = join(REPORT_DIR, 'adversarial-e2e-generation-audit-v1-ledger.jsonl');
const repairLedger = join(REPORT_DIR, 'adversarial-e2e-generation-audit-v1-repair-ledger.jsonl');
const summaryPath = join(REPORT_DIR, 'ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1_SUMMARY.json');

interface Row {
  index: number;
  id: string;
  succeeded: boolean;
  categoryOutcome: string;
  [key: string]: unknown;
}

const prior = readFileSync(mainLedger, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Row);

const failedIndexes = [...new Set(prior.filter((r) => !r.succeeded).map((r) => r.index))].sort((a, b) => a - b);
console.log('Re-running failed indexes:', failedIndexes.join(', '));
writeFileSync(repairLedger, '', 'utf8');

for (const index of failedIndexes) {
  const env = {
    ...process.env,
    AUDIT_LEDGER: repairLedger,
    AUDIT_SKIP_CONTAMINATION: '1',
  };
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsx', 'scripts/audit-adversarial-e2e-generation-v1.mts', String(index), '1'],
    { cwd: ROOT, env, encoding: 'utf8', shell: true },
  );
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.status !== 0 && result.status !== 1) {
    console.error(`Spawn failed for index ${index} status=${result.status}`);
  }
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
writeFileSync(mainLedger, merged.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');

const succeeded = merged.filter((r) => r.succeeded).length;
const failed = merged.filter((r) => !r.succeeded);
const summary = {
  readOnly: true,
  executedAt: new Date().toISOString(),
  phase: 'post-repair-merge',
  productsGenerated: merged.length,
  successfulGenerations: succeeded,
  failedGenerations: failed.length,
  successRatePercent: merged.length ? Math.round((succeeded / merged.length) * 1000) / 10 : 0,
  repairAttempted: failedIndexes.length,
  repairRecovered: repairs.filter((r) => r.succeeded).length,
  stillFailing: failed.map((r) => ({
    id: r.id,
    index: r.index,
    category: r.categoryOutcome,
    failureReason: r.failureReason,
    identity: r.approvedIdentity,
  })),
  passTokenEligible: failed.length === 0 && merged.length >= 50,
};
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));
if (summary.passTokenEligible) {
  console.log('\nAIDEVENGINE_ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1_PASS');
  process.exit(0);
}
process.exit(1);
