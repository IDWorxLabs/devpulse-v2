/**
 * Phase 26.63 — Report handoff runId propagation validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS,
  resolveReportHandoffRunId,
  coerceReportHandoffRunId,
  assertHandoffEndpointRunId,
  buildReportHandoffRunIdDiagnosticFields,
  isValidHandoffRunId,
} from '../src/founder-test-runtime-monitor/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-report-handoff-runid-propagation';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'public/founder-reality/app.js',
  'src/founder-test-runtime-monitor/report-handoff-runid-propagation.ts',
  'scripts/validate-report-handoff-runid-propagation.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('resolveReportHandoffRunId helper', appJs.includes('function resolveReportHandoffRunId'), 'resolver');
assert('coerceReportHandoffRunId helper', appJs.includes('function coerceReportHandoffRunId'), 'coerce');
assert('card snapshot first', /resolveReportHandoffRunId[\s\S]*?founderTestRuntimeCardSnapshot/.test(appJs), 'card first');
assert('pinned runId fallback', /resolveReportHandoffRunId[\s\S]*?founderTestRuntimePinnedRunId/.test(appJs), 'pinned');
assert('copy uses card runId', /function copyLatestFounderTestReport[\s\S]*?coerceReportHandoffRunId\(null, cardRuntime\)/.test(appJs), 'copy');
assert('open uses card runId', /function openFounderTestReportModal[\s\S]*?coerceReportHandoffRunId\(null, cardRuntime\)/.test(appJs), 'open');
assert('retry uses card runId', /function retryFetchFounderTestResult[\s\S]*?coerceReportHandoffRunId\(null, cardRuntime\)/.test(appJs), 'retry');
assert('result-debug includes runId', appJs.includes('/api/founder-test/result-debug?runId='), 'debug url');
assert('debug fetch coerces runId', /fetchFounderTestResultDebug[\s\S]*?coerceReportHandoffRunId/.test(appJs), 'debug coerce');
assert('forbidden n/a guard', appJs.includes("normalized !== 'n/a'"), 'n/a guard');
assert('diagnostic runtime card runId', appJs.includes('Runtime card runId'), 'diagnostic card');
assert('diagnostic pinned runId', appJs.includes('Pinned runId'), 'diagnostic pinned');
assert('diagnostic resolved active runId', appJs.includes('Resolved active runId'), 'diagnostic resolved');
assert('diagnostic runtime snapshot runId', appJs.includes('Runtime snapshot runId'), 'diagnostic snapshot');
assert('copy payload uses card runtime', appJs.includes('buildFounderTestCopyPayload(cardRuntime)'), 'payload card');
assert('fetch retry coerces runId', /fetchFounderTestResultWithRetry[\s\S]*?coerceReportHandoffRunId/.test(appJs), 'fetch coerce');
assert('no scoring edits', !appJs.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !appJs.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:report-handoff-runid-propagation": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

assert(
  'card runId wins over explicit n/a',
  resolveReportHandoffRunId({
    explicitRunId: 'n/a',
    cardRunId: 'founder-test-runtime-card',
    pinnedRunId: 'pinned-run',
  }) === 'founder-test-runtime-card',
  'card wins',
);

assert(
  'coerce uses card when resolved missing',
  coerceReportHandoffRunId({ resolvedRunId: null, cardRunId: 'founder-test-runtime-card' }) ===
    'founder-test-runtime-card',
  'coerce card',
);

assert(
  'endpoint runId never n/a when card present',
  assertHandoffEndpointRunId({ resolvedRunId: 'n/a', cardRunId: 'founder-test-runtime-123' }) ===
    'founder-test-runtime-123',
  'endpoint guard',
);

assert(
  'diagnostic fields populated',
  buildReportHandoffRunIdDiagnosticFields({
    requestedRunId: 'founder-test-runtime-123',
    cardRunId: 'founder-test-runtime-123',
    pinnedRunId: 'pinned',
    resolvedActiveRunId: 'founder-test-runtime-123',
    runtimeSnapshotRunId: 'founder-test-runtime-123',
  }).runtimeCardRunId === 'founder-test-runtime-123',
  'fields',
);

assert('n/a is invalid handoff id', isValidHandoffRunId('n/a') === false, 'invalid n/a');

const report = [
  '# Report Handoff RunId Propagation Report',
  '',
  '## Root Cause',
  '',
  '- Report handoff paths called result/result-debug endpoints with requested runId n/a while the visible Operator Feed runtime card already held a valid runId.',
  '- runId resolution did not consistently prioritize `founderTestRuntimeCardSnapshot.runId`.',
  '',
  '## Repair',
  '',
  '- `resolveReportHandoffRunId` — card snapshot → pinned → active snapshots.',
  '- `coerceReportHandoffRunId` — never hand off n/a when card has runId.',
  '- Copy/Open/Retry/debug/fetch paths all coerce runId from visible card first.',
  '- Handoff diagnostic exposes requested, card, pinned, resolved active, and runtime snapshot runIds.',
  '',
  '## Files Changed',
  '',
  '- `src/founder-test-runtime-monitor/report-handoff-runid-propagation.ts`',
  '- `src/founder-test-runtime-monitor/complete-report-preparing-stall.ts`',
  '- `public/founder-reality/app.js`',
  '',
  '## Validation',
  '',
  ...results.map((r) => `- [${r.passed ? 'x' : ' '}] ${r.name}: ${r.detail}`),
  '',
  results.every((r) => r.passed)
    ? `\nSUCCESS: ${REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS}\n`
    : '\nFAILED: report handoff runId propagation checks did not pass.\n',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'REPORT_HANDOFF_RUNID_PROPAGATION_REPORT.md'), report, 'utf8');

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error('Report handoff runId propagation validation FAILED:');
  for (const f of failed) {
    console.error(`  ✗ ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

console.log(`Report handoff runId propagation validation passed (${results.length} checks).`);
console.log(REPORT_HANDOFF_RUNID_PROPAGATION_REPAIR_V1_PASS);
