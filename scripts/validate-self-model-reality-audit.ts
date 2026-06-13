/**
 * Phase 25.39 — Self Model Reality Audit validation (read-only).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SELF_MODEL_REALITY_AUDIT_PASS_TOKEN,
  architectureSufficiencyAssessment,
  runSelfModelRealityAudit,
} from './lib/self-model-reality-audit-tracer.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

assert('audit report exists', existsSync(join(ROOT, 'architecture/SELF_MODEL_REALITY_AUDIT.md')), 'architecture/SELF_MODEL_REALITY_AUDIT.md');
assert('audit tracer exists', existsSync(join(ROOT, 'scripts/lib/self-model-reality-audit-tracer.ts')), 'tracer module');

const auditResults = runSelfModelRealityAudit();
assert('all audit scenarios execute', auditResults.length === 3, `ran ${auditResults.length}/3`);

for (const scenario of auditResults) {
  assert(
    `${scenario.id}: pipeline tracing`,
    scenario.stages.length >= 10,
    `${scenario.stages.length} stages traced`,
  );
  assert(
    `${scenario.id}: first failure location`,
    scenario.firstFailureLocation.includes('src/'),
    scenario.firstFailureLocation,
  );
  assert(
    `${scenario.id}: root cause classified`,
    scenario.rootCause.length > 40,
    scenario.firstFailureClass,
  );
  assert(
    `${scenario.id}: smallest fix produced`,
    scenario.smallestFix.length > 30,
    scenario.smallestFix.slice(0, 80),
  );
  assert(
    `${scenario.id}: failure classes`,
    scenario.failureClasses.length > 0,
    scenario.failureClasses.join(', '),
  );
}

const sufficiency = architectureSufficiencyAssessment();
assert(
  'architecture sufficiency assessment',
  sufficiency.verdict === 'TARGETED_FIXES_SUFFICIENT',
  sufficiency.summary.slice(0, 120),
);

assert(
  'scenario-a identifies intent drift',
  auditResults.find((s) => s.id === 'scenario-a')?.failureClasses.includes('MULTIPLE_SOURCE_CONFLICT') === true,
  auditResults.find((s) => s.id === 'scenario-a')?.failureClasses.join(', ') ?? 'missing',
);

assert(
  'scenario-b identifies planner failure',
  auditResults.find((s) => s.id === 'scenario-b')?.firstFailureClass === 'RESPONSE_PLANNER_FAILURE',
  auditResults.find((s) => s.id === 'scenario-b')?.firstFailureClass ?? 'missing',
);

assert(
  'scenario-c identifies project override',
  auditResults.find((s) => s.id === 'scenario-c')?.projectContextDominates === true,
  String(auditResults.find((s) => s.id === 'scenario-c')?.projectContextDominates),
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Self Model Reality Audit Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

console.log('\n--- Live Trace Summary ---');
for (const s of auditResults) {
  console.log(`\n${s.id}: "${s.prompt}"`);
  console.log(`  First failure: ${s.firstFailureClass} @ ${s.firstFailureLocation}`);
  console.log(`  Classes: ${s.failureClasses.join(', ')}`);
  console.log(`  Final preview: ${s.finalAnswerPreview.slice(0, 100)}…`);
}

if (failed.length === 0) {
  console.log(`\n${SELF_MODEL_REALITY_AUDIT_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} check(s) failed.`);
process.exit(1);
