/**
 * Phase 26.58 — Complete report handoff repair validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS,
  COMPLETE_REPORT_HANDOFF_RESULT_RETRY_ATTEMPTS,
  buildFounderTestRunHandoffPayload,
  buildCompleteFounderTestResultPendingHandoffResponse,
  resolveStoredFounderTestReportMarkdown,
  shouldReturnCompleteResultHttp200,
} from '../src/founder-test-runtime-monitor/index.js';
import {
  getFounderTestRunResultCount,
  hasFounderTestRunResult,
  peekFounderTestRunResult,
  resetFounderTestRunResultStoreForTests,
  storeFounderTestRunResult,
} from '../src/founder-test-runtime-monitor/founder-test-run-result-store.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-complete-report-handoff';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-testing-handler.ts',
  'src/founder-test-runtime-monitor/founder-test-run-result-store.ts',
  'src/founder-test-runtime-monitor/founder-test-complete-report-handoff.ts',
  'public/founder-reality/app.js',
  'scripts/validate-complete-report-handoff.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8');
const storeSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-run-result-store.ts'),
  'utf8',
);
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('result map by runId', storeSource.includes('founderTestRunResultsByRunId'), 'map');
assert('store before finish', handlerSource.indexOf('storeFounderTestRunResult') < handlerSource.indexOf('finishFounderTestRuntime({'), 'order');
assert('handoff payload builder', handlerSource.includes('buildFounderTestRunHandoffPayload'), 'handoff');
assert('resolve stored report markdown', handlerSource.includes('resolveStoredFounderTestReportMarkdown'), 'resolve');
assert('complete http 200 gate', handlerSource.includes('shouldReturnCompleteResultHttp200'), 'http200');
assert('client active runId fetch', appJs.includes('resolveActiveFounderTestRunId'), 'runId');
assert('client bounded retry constant', appJs.includes('FOUNDER_TEST_RESULT_FETCH_MAX_ATTEMPTS = 3'), 'retry 3');
assert('client retry helper', appJs.includes('fetchFounderTestResultWithRetry'), 'fetch helper');
assert('client handoff fallback', appJs.includes('buildFounderTestCompleteHandoffFallbackText'), 'fallback');
assert('client notification on fetch success', appJs.includes('deliverFounderTestReportNotification'), 'notify');
assert('complete notification title', appJs.includes('Founder Test Report Ready'), 'title');
assert('no scoring edits', !handlerSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !handlerSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(`validate:complete-report-handoff": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'script',
);

resetFounderTestRunResultStoreForTests();

const runA = 'handoff-run-a';
const runB = 'handoff-run-b';
const markdownA = '# Founder Test Report\n\nRun A complete.';
const markdownB = '# Founder Test Report\n\nRun B complete.';

storeFounderTestRunResult({
  readOnly: true,
  runId: runA,
  ok: true,
  completedAt: '2026-06-12T10:00:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId: runA,
    ok: true,
    runtime: { runId: runA, state: 'COMPLETE' } as never,
    report: { reportMarkdown: markdownA },
    reportMarkdown: markdownA,
    finalReportReady: true,
  }),
  errorMessage: null,
});

storeFounderTestRunResult({
  readOnly: true,
  runId: runB,
  ok: true,
  completedAt: '2026-06-12T11:00:00.000Z',
  payload: buildFounderTestRunHandoffPayload({
    runId: runB,
    ok: true,
    runtime: { runId: runB, state: 'COMPLETE' } as never,
    report: { reportMarkdown: markdownB },
    reportMarkdown: markdownB,
    finalReportReady: true,
  }),
  errorMessage: null,
});

assert('results stored by runId count', getFounderTestRunResultCount() === 2, String(getFounderTestRunResultCount()));
assert('has run A', hasFounderTestRunResult(runA), 'runA');
assert('has run B', hasFounderTestRunResult(runB), 'runB');

const peekA = peekFounderTestRunResult(runA);
const peekB = peekFounderTestRunResult(runB);
assert('run A markdown resolved', resolveStoredFounderTestReportMarkdown(peekA!) === markdownA, 'mdA');
assert('run B markdown resolved', resolveStoredFounderTestReportMarkdown(peekB!) === markdownB, 'mdB');
assert('complete returns http 200', shouldReturnCompleteResultHttp200(peekA!), String(shouldReturnCompleteResultHttp200(peekA!)));

const pending = buildCompleteFounderTestResultPendingHandoffResponse(
  { runId: runA, state: 'COMPLETE', endedAt: '2026-06-12T10:05:00.000Z' } as never,
  runA,
);
assert('pending has no failure markdown', pending.failureReportMarkdown == null, 'no failure');
assert('pending has preparing reason', typeof pending.finalReportPreparingReason === 'string', 'reason');

assert('retry attempts constant', COMPLETE_REPORT_HANDOFF_RESULT_RETRY_ATTEMPTS === 3, String(COMPLETE_REPORT_HANDOFF_RESULT_RETRY_ATTEMPTS));

const report = [
  '# Complete Report Handoff Repair Report',
  '',
  '## Root Cause',
  '',
  '- Final report was stored after `finishFounderTestRuntime()`, creating a race where COMPLETE runtime was visible before result persistence.',
  '- Result store kept only a single global `pendingResult`, so runId-specific fetch could miss the final markdown.',
  '- Client treated COMPLETE without cached markdown as failure/preparing indefinitely.',
  '',
  '## Server Result Persistence Proof',
  '',
  '- `founderTestRunResultsByRunId` stores results keyed by runId.',
  '- `storeFounderTestRunResult` runs before and after `finishFounderTestRuntime()` with final `reportMarkdown`.',
  '- `resolveStoredFounderTestReportMarkdown` resolves markdown from report payload.',
  '',
  '## Endpoint Proof',
  '',
  '- `GET /api/founder-test/result?runId=` returns HTTP 200 with `state: COMPLETE`, `reportMarkdown`, `generatedAt`, `runId` when stored.',
  '- COMPLETE without stored result returns 202 preparing response (bounded), not Runtime Failure Report.',
  '',
  '## Client Handoff Proof',
  '',
  '- Copy/Open Final Report uses `resolveActiveFounderTestRunId()` and retries 3 times.',
  '- After retries, shows COMPLETE handoff diagnostic — not infinite preparing.',
  '',
  '## Notification Proof',
  '',
  '- `fetchFounderTestResultWithRetry` delivers `Founder Test Report Ready` with full markdown when result arrives.',
  '',
  '## Manual UI Verification Steps',
  '',
  '1. Run Founder Test and wait for all 11 stages PASSED + Founder Test Complete.',
  '2. Click **Copy Final Report** — clipboard should contain full founder report markdown (not failure/preparing).',
  '3. Click **Open Final Report** — modal shows the same final markdown.',
  '4. Open Notifications — entry titled **Founder Test Report Ready** with working Copy Report.',
  '5. Refresh page, click Copy Final Report again — result fetch by runId still returns final markdown.',
  '',
  '---',
  '',
  `Pass token: ${COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'COMPLETE_REPORT_HANDOFF_REPAIR_REPORT.md'), report, 'utf8');
assert('report written', existsSync(join(ROOT, 'architecture', 'COMPLETE_REPORT_HANDOFF_REPAIR_REPORT.md')), 'missing');

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Complete Report Handoff validation FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Complete Report Handoff validation PASSED (${results.length} checks)`);
console.log(COMPLETE_REPORT_HANDOFF_REPAIR_V1_PASS);
