/**
 * Phase 26.69 — Founder Test COMPLETE handoff boundary validation.
 * Proves: markdown stored under runId → result-debug reachable → /result returns markdown → only then COMPLETE.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS,
  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN,
  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,
  FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
  buildFounderTestRunHandoffPayload,
  buildCompleteFounderTestResultPendingHandoffResponse,
  canEmitFounderTestRuntimeComplete,
  maskRuntimeSnapshotUntilHandoffReady,
  resolvePublicFounderTestRuntimeSnapshot,
  shouldReturnCompleteResultHttp200,
  verifyFounderTestCompleteHandoffBoundary,
  hasStoredFounderTestReportMarkdownForRun,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  resetFounderTestRunResultStoreForTests,
  storeFounderTestRunResult,
  peekFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-complete-handoff-boundary';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-testing-handler.ts',
  'server/founder-reality-server.ts',
  'src/founder-test-runtime-monitor/founder-test-complete-handoff-boundary.ts',
  'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts',
  'src/founder-test-runtime-monitor/founder-test-complete-report-handoff.ts',
  'scripts/validate-founder-test-complete-handoff-boundary.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8').replace(/\r\n/g, '\n');
const monitorSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-runtime-monitor.ts'),
  'utf8',
);
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
const handoffSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-complete-report-handoff.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert(
  'store before COMPLETE finish',
  /storeFounderTestRunResult\([\s\S]*canEmitFounderTestRuntimeComplete[\s\S]*finishFounderTestRuntime\(\{\s*state: 'COMPLETE'/.test(
    handlerSource,
  ),
  'order',
);
assert(
  'canEmit gate before COMPLETE finish',
  handlerSource.includes('canEmitFounderTestRuntimeComplete') &&
    /finishFounderTestRuntime\(\{\s*state: 'COMPLETE'/.test(handlerSource),
  'gate',
);
assert(
  'missing markdown blocks COMPLETE',
  handlerSource.includes('if (!reportMarkdown?.trim())') &&
    handlerSource.includes('FOUNDER_TEST_COMPLETE_BLOCKED_REASON_MISSING_MARKDOWN') &&
    /if \(!reportMarkdown\?\.trim\(\)\)[\s\S]*finishFounderTestRuntime\(\{\s*state: 'FAILED'/.test(handlerSource),
  'failed not complete',
);
assert(
  'store empty blocks COMPLETE',
  handlerSource.includes('if (!canEmitFounderTestRuntimeComplete') &&
    handlerSource.includes('FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY'),
  'store empty reason',
);
assert(
  'result 200 gated by shouldReturnCompleteResultHttp200',
  handlerSource.includes('shouldReturnCompleteResultHttp200(stored)'),
  'http200 gate',
);
assert(
  'result-debug uses handoff verify',
  handlerSource.includes('verifyFounderTestCompleteHandoffBoundary'),
  'debug verify',
);
assert(
  'result-debug route registered',
  serverSource.includes('/api/founder-test/result-debug'),
  'debug route',
);
assert(
  'runtime status masks COMPLETE until store ready',
  monitorSource.includes('reconcilePublicFounderTestRuntimeSnapshot'),
  'masking',
);
assert(
  'pending response state COMPLETING',
  handoffSource.includes("state: 'COMPLETING'"),
  'completing state',
);
assert('no scoring edits', !handlerSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !handlerSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(
    `validate:founder-test-complete-handoff-boundary": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'script',
);

resetFounderTestRunResultStoreForTests();

const runId = 'boundary-run-complete';
const markdown = '# Founder Test Report\n\nBoundary proof markdown.';

assert('canEmit false without store', !canEmitFounderTestRuntimeComplete({ runId, reportMarkdown: markdown }), 'no store');
assert('verify false without store', !verifyFounderTestCompleteHandoffBoundary(runId), 'no store verify');
assert('hasStored false without store', !hasStoredFounderTestReportMarkdownForRun(runId), 'no stored md');

storeFounderTestRunResult({
  readOnly: true,
  runId,
  ok: true,
  completedAt: '2026-06-12T12:00:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId,
    ok: true,
    runtime: { runId, state: 'COMPLETE' } as never,
    report: { reportMarkdown: markdown },
    reportMarkdown: markdown,
    finalReportReady: true,
  }),
  errorMessage: null,
});

assert('verify true after store', verifyFounderTestCompleteHandoffBoundary(runId), 'stored verify');
assert(
  'canEmit true after store',
  canEmitFounderTestRuntimeComplete({ runId, reportMarkdown: markdown }),
  'can emit',
);
const stored = peekFounderTestRunResult(runId)!;
assert('http 200 when markdown stored', shouldReturnCompleteResultHttp200(stored), 'http200');

const emptyOkRun = 'boundary-run-empty-ok';
storeFounderTestRunResult({
  readOnly: true,
  runId: emptyOkRun,
  ok: true,
  completedAt: '2026-06-12T12:01:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId: emptyOkRun,
    ok: true,
    runtime: { runId: emptyOkRun, state: 'COMPLETE' } as never,
    report: null,
    reportMarkdown: null,
    finalReportReady: false,
    finalReportPreparing: true,
  }),
  errorMessage: null,
});
const storedEmpty = peekFounderTestRunResult(emptyOkRun)!;
assert('http not 200 without markdown', !shouldReturnCompleteResultHttp200(storedEmpty), 'no http200 empty');

const completeSnapshot = {
  runId,
  state: 'COMPLETE',
  endedAt: '2026-06-12T12:00:00.000Z',
} as never;

resetFounderTestRunResultStoreForTests();
const maskedWithoutStore = maskRuntimeSnapshotUntilHandoffReady(completeSnapshot);
assert('masks COMPLETE without store', maskedWithoutStore.state === 'COMPLETING', String(maskedWithoutStore.state));
assert(
  'masked stage line',
  maskedWithoutStore.uiSummary?.stageLine === FOUNDER_TEST_COMPLETE_HANDOFF_PENDING_STAGE_LINE,
  'stage line',
);

storeFounderTestRunResult({
  readOnly: true,
  runId,
  ok: true,
  completedAt: '2026-06-12T12:00:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId,
    ok: true,
    runtime: completeSnapshot,
    report: { reportMarkdown: markdown },
    reportMarkdown: markdown,
    finalReportReady: true,
  }),
  errorMessage: null,
});
const unmaskedWithStore = resolvePublicFounderTestRuntimeSnapshot(completeSnapshot);
assert('COMPLETE visible when store ready', unmaskedWithStore.state === 'COMPLETE', String(unmaskedWithStore.state));

const pending = buildCompleteFounderTestResultPendingHandoffResponse(
  completeSnapshot,
  runId,
  FOUNDER_TEST_COMPLETE_BLOCKED_REASON_STORE_EMPTY,
);
assert('pending state COMPLETING', pending.state === 'COMPLETING', String(pending.state));
assert('pending has no report markdown', pending.reportMarkdown == null, 'no md');

const report = [
  '# Founder Test COMPLETE Handoff Boundary Report',
  '',
  '## Root Cause',
  '',
  '- COMPLETE was emitted while the result store had no report markdown for the runId.',
  '- Clients saw COMPLETE runtime + failed result fetch (`routeReached: false`, empty store) — an order-of-operations handoff bug, not slow generation.',
  '',
  '## Server Boundary Repair',
  '',
  '1. **Report markdown exists** — `executeFounderTestRunCore` rejects completion without trimmed markdown (`FAILED`, never `COMPLETE`).',
  '2. **Result store receives markdown under exact runId** — `storeFounderTestRunResult` runs before `finishFounderTestRuntime({ state: COMPLETE })`.',
  '3. **result-debug route reachable** — `GET /api/founder-test/result-debug?runId=` exposes store + runtime diagnostics.',
  '4. **Result endpoint returns stored markdown** — HTTP 200 only when `shouldReturnCompleteResultHttp200(stored)`; otherwise HTTP 202 `COMPLETING`.',
  '5. **COMPLETE only after boundary passes** — `canEmitFounderTestRuntimeComplete({ runId, reportMarkdown })` gates `finishFounderTestRuntime({ state: COMPLETE })`.',
  '',
  '## Public Runtime Masking',
  '',
  '- `resolvePublicFounderTestRuntimeSnapshot` masks internal COMPLETE → COMPLETING until store verification passes.',
  '- Prevents UI/Operator Feed from advertising COMPLETE while result store is still empty.',
  '',
  '## Endpoint Contract',
  '',
  '| Condition | `/result` status | Public runtime state |',
  '| --- | --- | --- |',
  '| Stored markdown for runId | 200 + reportMarkdown | COMPLETE |',
  '| Stored ok, no markdown | 202 preparing | COMPLETING |',
  '| No store, runtime completing | 202 preparing | COMPLETING |',
  '| Missing markdown at completion | FAILED | FAILED |',
  '',
  '## Manual Verification',
  '',
  '1. Run Founder Test to completion.',
  '2. Before Copy Final Report, call `GET /api/founder-test/result-debug?runId=<runId>` — `hasReportMarkdown: true`.',
  '3. Call `GET /api/founder-test/result?runId=<runId>` — HTTP 200 with full markdown.',
  '4. Runtime status shows COMPLETE only after step 3 would succeed.',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_REPORT.md'), report, 'utf8');
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_REPORT.md')),
  'missing',
);

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test COMPLETE Handoff Boundary validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test COMPLETE Handoff Boundary validation PASSED (${results.length} checks)`);
console.log(FOUNDER_TEST_COMPLETE_HANDOFF_BOUNDARY_V1_PASS);
